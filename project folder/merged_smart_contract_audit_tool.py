#!/usr/bin/env python3
"""
merged_smart_contract_audit_tool.py

Single-file tool that merges:
 - the synthetic dataset generator (original script features)
 - a static-analysis vulnerability detector for user-pasted/downloaded Solidity contracts

Usage examples:
    # Generate the synthetic dataset (same functionality as original generator)
    python3 merged_smart_contract_audit_tool.py --mode generate --outdir ./my_dataset --style urdu --prefix MyProj

    # Analyze a single local .sol file and print a human report + JSON
    python3 merged_smart_contract_audit_tool.py --mode analyze --file sample.sol --out-json report.json

    # Paste mode: read from stdin
    cat sample.sol | python3 merged_smart_contract_audit_tool.py --mode analyze --stdin

Features of analyzer (rules-based, deterministic):
 - Detects a set of common Solidity vulnerabilities and reports line numbers + snippets
 - Outputs a human-readable summary and optional JSON report
 - Accepts a file path or stdin input (so you can paste downloaded contract content)

Limitations (important):
 - This is a lightweight, static, rules-based detector (not a formal AST/symbolic engine).
 - It intentionally errs on the side of being conservative; manual review is always required.

"""

import argparse
import re
import json
import os
from pathlib import Path
from typing import List, Dict, Any, Tuple
import textwrap
import csv
import random

# -------------------- Templates (from original generator) --------------------
URDU_TEMPLATES = {
    "short_reentrancy": "Issue: withdraw() mein external call pehle state update se pehle ho rahi hai — reentrancy possible.",
    "long_reentrancy": ("Is contract ke withdraw function mein pehle external call (msg.sender.call) ho rahi hai aur baad mein balance update ho raha hai. "
                       "Agar attacker malicious contract se repeatedly call karega to funds drain ho sakti hain."),
    "fix_reentrancy": "Fix: balance update pehle karo, phir external call; use ReentrancyGuard ya nonReentrant modifier.",

    "short_access": "Issue: emergencyWithdraw() public hai — access control missing.",
    "long_access": ("Is contract mein emergencyWithdraw() pe koi owner check nahi hai; koi bhi user contract balance nikal sakta hai. "
                    "Yeh authorization bug hai."),
    "fix_access": "Fix: onlyOwner modifier add karo; sirf owner ko permission do.",

    "short_arith": "Issue: add()/sub() mein unchecked arithmetic (overflow/underflow) ho sakta hai.",
    "long_arith": ("Contract old pragma (0.7) use karta hai jahan built-in checks nahi hain. Large numbers se overflow/underflow ho sakta hai "
                   "jo logic ko tod dega."),
    "fix_arith": "Fix: pragma upgrade karo ^0.8.0 ya SafeMath use karo; input validation add karo."
}

EN_TEMPLATES = {
    "short_reentrancy": "Issue: External call before state update in withdraw() — reentrancy possible.",
    "long_reentrancy": ("The withdraw function performs an external call (msg.sender.call) before updating balances. "
                       "This allows a malicious contract to re-enter and drain funds."),
    "fix_reentrancy": "Fix: Update state before external call; use ReentrancyGuard or nonReentrant modifier.",

    "short_access": "Issue: emergencyWithdraw() is public — missing access control.",
    "long_access": "Function emergencyWithdraw() lacks an owner check; anyone can withdraw the contract balance.",
    "fix_access": "Fix: Add onlyOwner modifier and restrict access to owner.",

    "short_arith": "Issue: Unchecked arithmetic in add()/sub() — overflow/underflow possible.",
    "long_arith": ("Contract uses older Solidity versions (<0.8.0) without overflow checks. "
                   "This can cause incorrect balances or logic failures."),
    "fix_arith": "Fix: Upgrade to ^0.8.0 or use SafeMath; add checks and unit tests."
}

README_TEXT = """DATASET: Smart Contracts for FYP - Generated Collection
=======================================================

This dataset is a synthetic collection of smart contracts created to help students build and test AI models for vulnerability detection and explanation.
"""

# -------------------- Synthetic dataset generator (merged from original) --------------------
CLEAN_TEMPLATE = textwrap.dedent("""\
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract {name} {{
    uint256 public value;
    address public owner;

    constructor() {{
        owner = msg.sender;
    }}

    // {comment1}
    function update(uint256 v) public {{
        value = v;
    }}

    function get() public view returns (uint256) {{
        return value;
    }}
}}
""")

REENTRANCY_VULN = textwrap.dedent("""\
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract {name} {{
    mapping(address => uint256) public balances;

    function deposit() public payable {{
        balances[msg.sender] += msg.value;
    }}

    function withdraw() public {{
        uint256 amount = balances[msg.sender];
        require(amount > 0, "No balance");

        (bool success, ) = msg.sender.call{{value: amount}}("");
        require(success, "Transfer failed");

        balances[msg.sender] = 0;
    }}
}}
""")

REENTRANCY_FIXED = textwrap.dedent("""\
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract {name} is ReentrancyGuard {{
    mapping(address => uint256) public balances;

    function deposit() public payable {{
        balances[msg.sender] += msg.value;
    }}

    function withdraw() public nonReentrant {{
        uint256 amount = balances[msg.sender];
        require(amount > 0, "No balance");

        balances[msg.sender] = 0;
        (bool success, ) = msg.sender.call{{value: amount}}("");
        require(success, "Transfer failed");
    }}
}}
""")

ACCESS_VULN = textwrap.dedent("""\
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract {name} {{
    address public owner;

    constructor() {{
        owner = msg.sender;
    }}

    // vulnerable: anyone can call
    function emergencyWithdraw() public {{
        payable(msg.sender).transfer(address(this).balance);
    }}

    function deposit() public payable {{}}
}}
""")

ACCESS_FIXED = textwrap.dedent("""\
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract {name} {{
    address public owner;

    constructor() {{
        owner = msg.sender;
    }}

    modifier onlyOwner() {{
        require(msg.sender == owner, "Not owner");
        _;
    }}

    function emergencyWithdraw() public onlyOwner {{
        payable(msg.sender).transfer(address(this).balance);
    }}

    function deposit() public payable {{}}
}}
""")

ARITH_VULN = textwrap.dedent("""\
// SPDX-License-Identifier: MIT
pragma solidity ^0.7.0;

contract {name} {{
    uint256 public count = 0;

    function add(uint256 x) public {{
        count += x; // vulnerable to overflow in <0.8.0
    }}

    function sub(uint256 x) public {{
        count -= x; // vulnerable to underflow in <0.8.0
    }}
}}
""")

ARITH_FIXED = textwrap.dedent("""\
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract {name} {{
    uint256 public count = 0;

    function add(uint256 x) public {{
        unchecked {{ count += x; }}
    }}

    function sub(uint256 x) public {{
        require(count >= x, "Underflow");
        count -= x;
    }}
}}
""")

# -------------------- Simple rules-based vulnerability detector --------------------

# Top-10-ish patterns with metadata
VULN_RULES = [
    {
        "id": "reentrancy",
        "name": "Reentrancy (external call before state update)",
        "patterns": [r"\.call\s*\(|\.call\s*\{", r"\.transfer\s*\(|\.send\s*\("] ,
        "description": "External call (call/send/transfer) performed before state update — allows reentrancy.",
        "recommendation": "Update state before external calls; use ReentrancyGuard or nonReentrant modifier."
    },
    {
        "id": "access_control",
        "name": "Missing Access Control / Public sensitive function",
        "patterns": [r"function\s+emergencyWithdraw\b", r"function\s+adminWithdraw\b", r"function\s+ownerWithdraw\b"],
        "description": "Public function that withdraws funds or performs privileged actions without owner check.",
        "recommendation": "Restrict with onlyOwner or similar access control checks."
    },
    {
        "id": "arithmetic",
        "name": "Unchecked Arithmetic (overflow/underflow potential)",
        "patterns": [r"\+\=", r"\-\=", r"\+\s*\=", r"-\s*\="],
        "description": "Arithmetic operations in code that may overflow/underflow in older Solidity versions (<0.8.0).",
        "recommendation": "Use Solidity >=0.8.0 or SafeMath; add explicit checks."
    },
    {
        "id": "tx_origin",
        "name": "Use of tx.origin for authorization",
        "patterns": [r"tx\.origin"],
        "description": "Using tx.origin for auth is insecure; use msg.sender and proper ownership checks.",
        "recommendation": "Replace tx.origin with msg.sender and implement proper access control."
    },
    {
        "id": "delegatecall",
        "name": "delegatecall / callcode misuse",
        "patterns": [r"delegatecall\s*\(|callcode\s*\("],
        "description": "delegatecall executes code in context of caller storage — dangerous if untrusted address used.",
        "recommendation": "Avoid delegatecall with untrusted addresses; validate or restrict targets."
    },
    {
        "id": "unchecked_low_level_call",
        "name": "Unchecked low-level call return value",
        "patterns": [r"\.call\s*\(.*\)\s*;", r"\.call\s*\([^\)]*\)\s*;"],
        "description": "Low-level calls without checking returned success boolean can silently fail.",
        "recommendation": "Check the returned boolean from low-level calls and revert on failure."
    },
    {
        "id": "selfdestruct",
        "name": "Unprotected selfdestruct",
        "patterns": [r"selfdestruct\s*\(|suicide\s*\("],
        "description": "selfdestruct can remove contract code and send funds — must be restricted.",
        "recommendation": "Ensure only owner can call selfdestruct or remove such logic."
    },
    {
        "id": "uninitialized_storage",
        "name": "Uninitialized storage pointer",
        "patterns": [r"\bStorage\s*\w*;", r"\b\w+\s*=\s*Storage\("],
        "description": "Potential uninitialized storage variables or pointers may allow storage corruption.",
        "recommendation": "Initialize storage variables properly and avoid dangerous patterns."
    },
    {
        "id": "incorrect_visibility",
        "name": "Incorrect or missing function visibility",
        "patterns": [r"function\s+\w+\s*\([^\)]*\)\s*\{"],
        "description": "Functions without explicit visibility default to public in older compilers or cause confusion.",
        "recommendation": "Explicitly declare visibility (public/external/internal/private)."
    },
    {
        "id": "hardcoded_gas_limit",
        "name": "Hardcoded gas or loops that can DOS",
        "patterns": [r"for\s*\(|while\s*\(|\.gas\s*\("],
        "description": "Expensive loops or gas assumptions may be exploited to cause DoS.",
        "recommendation": "Avoid unbounded loops over dynamic arrays; use pull patterns or limits."
    }
]

# Utility: split solidity into lines and simple function blocks

def split_lines(code: str) -> List[str]:
    # Normalize line endings
    return code.replace('\r\n', '\n').replace('\r', '\n').split('\n')


def find_functions(code: str) -> List[Tuple[str, int, int]]:
    """Very simple 'function' block extractor.
    Returns list of tuples: (function_text, start_line_index (0-based), end_line_index)
    This is naive and works for straightforward contracts; multi-contracts or complex macros may confuse it.
    """
    lines = split_lines(code)
    funcs = []
    in_func = False
    brace_depth = 0
    cur_lines = []
    start_idx = 0
    for i, line in enumerate(lines):
        if not in_func:
            if re.search(r"\bfunction\b", line):
                in_func = True
                brace_depth = line.count('{') - line.count('}')
                cur_lines = [line]
                start_idx = i
                # if function with no braces on same line, continue until brace appears
                if brace_depth <= 0 and '{' in line:
                    brace_depth = 1
        else:
            cur_lines.append(line)
            brace_depth += line.count('{') - line.count('}')
            if brace_depth <= 0:
                in_func = False
                funcs.append(("\n".join(cur_lines), start_idx, i))
                cur_lines = []
    return funcs


def snippet_at(lines: List[str], start: int, end: int, context=1) -> str:
    s = max(0, start - context)
    e = min(len(lines) - 1, end + context)
    return "\n".join(lines[s:e+1])


# Primary analyzer
def analyze_code(code: str, lang: str = "english") -> Dict[str, Any]:
    lines = split_lines(code)
    results = []

    # Detect pragma version for arithmetic reasoning
    pragma_matches = re.findall(r"pragma\s+solidity\s+([^;]+);", code)
    pragma = pragma_matches[0].strip() if pragma_matches else ""
    # Try to infer major version
    pragma_version = None
    try:
        m = re.search(r"(\d+)\.", pragma)
        if m:
            pragma_version = int(m.group(1))
    except Exception:
        pragma_version = None

    # Basic file-level scans
    for rule in VULN_RULES:
        for patt in rule['patterns']:
            # find all occurrences
            for m in re.finditer(patt, code, flags=re.IGNORECASE | re.MULTILINE):
                # compute line number
                char_index = m.start()
                prior = code[:char_index]
                line_no = prior.count('\n')  # 0-based
                # get snippet
                snippet = lines[line_no].strip() if line_no < len(lines) else ''

                # Some rules are double-detected; we'll add and dedupe later
                results.append({
                    'id': rule['id'],
                    'name': rule['name'],
                    'line': line_no + 1,  # 1-based
                    'snippet': snippet,
                    'description': rule['description'],
                    'recommendation': rule['recommendation']
                })

    # Additional, slightly smarter checks: reentrancy pattern in functions
    funcs = find_functions(code)
    for func_text, start, end in funcs:
        # check for external calls then state update
        # pattern: call (or transfer/send) appears, and later mapping/balances assignment appears
        call_match = re.search(r"(\.call\s*\(|\.transfer\s*\(|\.send\s*\()", func_text)
        state_update_match = re.search(r"\bbalances\[.*\]\s*=|\b\w+\s*:\s*\w+;|\b\w+\s*=\s*\w+;", func_text)
        # more specific: look for balances[...] = 0 or balances[msg.sender] = 0
        balances_update = re.search(r"balances\s*\[.*\]\s*=", func_text)
        if call_match and balances_update:
            # locate actual line of call inside the function
            func_lines = func_text.split('\n')
            for i, fl in enumerate(func_lines):
                if re.search(r"(\.call\s*\(|\.transfer\s*\(|\.send\s*\()", fl):
                    global_line = start + i
                    results.append({
                        'id': 'reentrancy',
                        'name': 'Reentrancy (external call before state update detected in function)',
                        'line': global_line + 1,
                        'snippet': fl.strip(),
                        'description': EN_TEMPLATES['long_reentrancy'] if lang == 'english' else URDU_TEMPLATES['long_reentrancy'],
                        'recommendation': EN_TEMPLATES['fix_reentrancy'] if lang == 'english' else URDU_TEMPLATES['fix_reentrancy']
                    })
                    break

    # Heuristic: detect public withdraw/emergencyWithdraw without onlyOwner modifier
    # If the file contains an onlyOwner modifier, treat as likely protected
    has_only_owner = bool(re.search(r"modifier\s+onlyOwner\b|onlyOwner\s*\(|owner\s*=", code, flags=re.IGNORECASE))
    for m in re.finditer(r"function\s+(\w+)\s*\([^)]*\)\s*(public|external)?\b", code, flags=re.IGNORECASE):
        fname = m.group(1)
        vis = m.group(2) or ''
        if fname.lower() in ('emergencywithdraw', 'withdraw', 'adminwithdraw'):
            # look if function signature contains onlyOwner
            sig_start = m.start()
            # extract function block to search for modifiers
            # crude: take next 200 chars
            chunk = code[sig_start:sig_start+400]
            if 'onlyOwner' not in chunk and not has_only_owner:
                # get line number
                line_no = code[:sig_start].count('\n')
                snippet = split_lines(code)[line_no].strip()
                results.append({
                    'id': 'access_control',
                    'name': 'Missing access control on withdraw/emergency function',
                    'line': line_no + 1,
                    'snippet': snippet,
                    'description': EN_TEMPLATES['long_access'] if lang == 'english' else URDU_TEMPLATES['long_access'],
                    'recommendation': EN_TEMPLATES['fix_access'] if lang == 'english' else URDU_TEMPLATES['fix_access']
                })

    # Arithmetic: only flag as high risk if pragma < 0.8 or no pragma found
    if pragma_version and pragma_version < 8:
        # find uses of +=, -=, +, - and numeric operations
        for m in re.finditer(r"\b\w+\s*\+\=|\b\w+\s*\-\=|\bcount\s*\+\=|\bcount\s*\-\=|\b\w+\s*\+\s*\w+", code):
            start = m.start()
            line_no = code[:start].count('\n')
            results.append({
                'id': 'arithmetic',
                'name': 'Unchecked arithmetic (pragma <0.8.0 inferred)',
                'line': line_no + 1,
                'snippet': split_lines(code)[line_no].strip(),
                'description': EN_TEMPLATES['long_arith'] if lang == 'english' else URDU_TEMPLATES['long_arith'],
                'recommendation': EN_TEMPLATES['fix_arith'] if lang == 'english' else URDU_TEMPLATES['fix_arith']
            })

    # Deduplicate results by (id, line, snippet)
    unique = []
    seen = set()
    for r in results:
        key = (r['id'], r['line'], r['snippet'])
        if key not in seen:
            seen.add(key)
            unique.append(r)

    # Produce counts
    counts = {}
    for u in unique:
        counts[u['id']] = counts.get(u['id'], 0) + 1

    summary = {
        'total_vulns': len(unique),
        'by_type': counts,
        'vulns': unique,
        'pragma': pragma,
        'inferred_pragma_major': pragma_version
    }
    return summary

# -------------------- CLI and glue --------------------

def ensure_dir(p: Path):
    p.mkdir(parents=True, exist_ok=True)


def write_file(path: Path, content: str):
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)


def personalize_comment(style, i):
    if style == 'urdu':
        variants = [
            f"Is function ka kaam seedha hai — simple update. (id {i})",
            f"Yeh ek basic setter function hai. (example {i})",
            f"Value update karne wala simple code. (no complex logic)"
        ]
        return random.choice(variants)
    else:
        variants = [
            f"Simple setter function. (id {i})",
            f"Basic update operation used for demo. (example {i})",
            f"Update value with given input. (sample {i})"
        ]
        return random.choice(variants)


def generate_dataset(args):
    out = Path(args.outdir).resolve()
    ensure_dir(out)
    contracts = out / "contracts"
    fixed = out / "contracts_fixed"
    reports = out / "reports"
    for folder in [contracts, fixed, reports]:
        for sub in ["clean", "reentrancy", "access_control", "arithmetic"]:
            ensure_dir(folder / sub)

    labels = []
    tpl = URDU_TEMPLATES if args.style == 'urdu' else EN_TEMPLATES

    # Generate clean
    for i in range(1, args.clean_count + 1):
        name = f"{args.prefix}_Clean_{i}"
        fname = f"{name}.sol"
        comment = personalize_comment(args.style, i)
        content = CLEAN_TEMPLATE.format(name=name, comment1=comment)
        write_file(contracts / "clean" / fname, content)
        labels.append([f"contracts/clean/{fname}", "no", "none", "none", "", "", "No issues detected", "No fix required"])

    # Reentrancy
    for i in range(1, args.reentrancy_count + 1):
        name_v = f"{args.prefix}_ReentrancyVuln_{i}"
        name_f = f"{args.prefix}_ReentrancyFixed_{i}"
        fname_v = f"{name_v}.sol"
        fname_f = f"{name_f}.sol"
        write_file(contracts / "reentrancy" / fname_v, REENTRANCY_VULN.format(name=name_v))
        write_file(fixed / "reentrancy" / fname_f, REENTRANCY_FIXED.format(name=name_f))
        short = tpl["short_reentrancy"]
        long = tpl["long_reentrancy"]
        fix = tpl["fix_reentrancy"]
        report_text = f"Short: {short}\n\nLong: {long}\n\nSeverity: High\n\nRecommendation: {fix}\n"
        write_file(reports / f"{name_v}.txt", report_text)
        labels.append([f"contracts/reentrancy/{fname_v}", "yes", "reentrancy", "high", "withdraw()", "external call before state update", short, fix])

    # Access control
    for i in range(1, args.access_count + 1):
        name_v = f"{args.prefix}_AccessVuln_{i}"
        name_f = f"{args.prefix}_AccessFixed_{i}"
        fname_v = f"{name_v}.sol"
        fname_f = f"{name_f}.sol"
        write_file(contracts / "access_control" / fname_v, ACCESS_VULN.format(name=name_v))
        write_file(fixed / "access_control" / fname_f, ACCESS_FIXED.format(name=name_f))
        short = tpl["short_access"]
        long = tpl["long_access"]
        fix = tpl["fix_access"]
        report_text = f"Short: {short}\n\nLong: {long}\n\nSeverity: High\n\nRecommendation: {fix}\n"
        write_file(reports / f"{name_v}.txt", report_text)
        labels.append([f"contracts/access_control/{fname_v}", "yes", "access_control", "high", "emergencyWithdraw()", "no owner check", short, fix])

    # Arithmetic
    for i in range(1, args.arith_count + 1):
        name_v = f"{args.prefix}_ArithmeticVuln_{i}"
        name_f = f"{args.prefix}_ArithmeticFixed_{i}"
        fname_v = f"{name_v}.sol"
        fname_f = f"{name_f}.sol"
        write_file(contracts / "arithmetic" / fname_v, ARITH_VULN.format(name=name_v))
        write_file(fixed / "arithmetic" / fname_f, ARITH_FIXED.format(name=name_f))
        short = tpl["short_arith"]
        long = tpl["long_arith"]
        fix = tpl["fix_arith"]
        report_text = f"Short: {short}\n\nLong: {long}\n\nSeverity: Medium\n\nRecommendation: {fix}\n"
        write_file(reports / f"{name_v}.txt", report_text)
        labels.append([f"contracts/arithmetic/{fname_v}", "yes", "arithmetic", "medium", "add()/sub()", "unchecked arithmetic", short, fix])

    labels_path = out / "labels.csv"
    with open(labels_path, "w", encoding='utf-8', newline='') as f:
        writer = csv.writer(f)
        writer.writerow(["file","vulnerable","type","severity","affected_fn","pattern","short_explain","fix"])
        for row in labels:
            writer.writerow(row)

    write_file(out / "README.txt", README_TEXT)

    print(f"Dataset generated at: {out}")
    print("Counts:")
    print(f"  Clean: {args.clean_count}")
    print(f"  Reentrancy vuln: {args.reentrancy_count}")
    print(f"  Access control vuln: {args.access_count}")
    print(f"  Arithmetic vuln: {args.arith_count}")
    print("Labels written to:", labels_path)


def human_report(summary: Dict[str, Any], code_lines: List[str]) -> str:
    out = []
    out.append(f"Total vulnerabilities found: {summary['total_vulns']}")
    out.append('By type:')
    for t, c in summary['by_type'].items():
        out.append(f"  - {t}: {c}")
    out.append('\nDetailed findings:')
    for i, v in enumerate(summary['vulns'], 1):
        out.append(f"\n{i}) {v['name']}")
        out.append(f"   Line: {v['line']}")
        out.append(f"   Snippet: {v['snippet']}")
        out.append(f"   Desc: {v['description']}")
        out.append(f"   Fix: {v['recommendation']}")
        # show context lines
        ln = v['line'] - 1
        ctx = '\n'.join(code_lines[max(0, ln-2):min(len(code_lines), ln+3)])
        out.append("   Context:\n" + textwrap.indent(ctx, '     '))
    return '\n'.join(out)


def run_analyze_mode(args):
    # Read input
    if args.stdin:
        import sys
        code = sys.stdin.read()
    else:
        if not args.file:
            raise SystemExit("No input file provided. Use --file or --stdin")
        p = Path(args.file)
        if not p.exists():
            raise SystemExit(f"File not found: {args.file}")
        code = p.read_text(encoding='utf-8')

    code_lines = split_lines(code)
    summary = analyze_code(code, lang='english' if args.style=='english' else 'urdu')

    # Print human report
    report = human_report(summary, code_lines)
    print('\n' + '='*60 + '\nANALYSIS REPORT\n' + '='*60 + '\n')
    print(report)

    # Optionally write JSON
    if args.out_json:
        outp = Path(args.out_json)
        outp.write_text(json.dumps(summary, indent=2, ensure_ascii=False))
        print(f"\nJSON written to: {outp.resolve()}")

    # Also return for programmatic use
    return summary


def main():
    parser = argparse.ArgumentParser(description="Merged dataset generator + solidity analyzer")
    parser.add_argument('--mode', choices=['generate', 'analyze'], required=True, help='Mode: generate dataset or analyze a contract')

    # generate options
    parser.add_argument('--outdir', type=str, default='./dataset_smart_contract', help='Output directory for generated dataset')
    parser.add_argument('--style', choices=['urdu','english'], default='urdu', help='Language/style for reports')
    parser.add_argument('--prefix', type=str, default='MyProj', help='Filename prefix for generated contracts')
    parser.add_argument('--clean-count', type=int, default=10, help='Number of clean contracts (smaller default for quick runs)')
    parser.add_argument('--reentrancy-count', type=int, default=7, help='Number of reentrancy examples')
    parser.add_argument('--access-count', type=int, default=7, help='Number of access control examples')
    parser.add_argument('--arith-count', type=int, default=6, help='Number of arithmetic examples')

    # analyze options
    parser.add_argument('--file', type=str, help='Path to solidity file to analyze')
    parser.add_argument('--stdin', action='store_true', help='Read solidity code from stdin (for paste)')
    parser.add_argument('--out-json', dest='out_json', type=str, help='Write analysis result to JSON file')

    args = parser.parse_args()

    if args.mode == 'generate':
        generate_dataset(args)
    elif args.mode == 'analyze':
        run_analyze_mode(args)


if __name__ == '__main__':
    main()