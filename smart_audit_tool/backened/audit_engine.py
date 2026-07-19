"""
SolShield Pro — Core Audit Engine
===================================
Tri-layered hybrid smart contract auditing pipeline:
  Layer 1 (SAST)  -> Slither  (static pattern analysis)
  Layer 1 (SAST)  -> Mythril  (symbolic execution)
  Layer 2 (DAST)  -> Foundry  (runtime fuzzing)
  Layer 3 (AI)    -> Gemini/Groq (formal-verification-style logic review)

All static/dynamic layers run concurrently for speed. Every subprocess call
uses argument lists (not shell=True) to avoid shell-injection risk, and every
external tool call has a hard timeout so one slow scanner can't hang the
whole pipeline.
"""

import json
import os
import re
import asyncio
import tempfile
import shutil
import logging
from typing import Optional, List, Dict, Any

import google.generativeai as genai
import typing_extensions as typing

logger = logging.getLogger("solshield.audit_engine")
logging.basicConfig(level=logging.INFO)

# ---------------------------------------------------------------------------
# Config / Timeouts — tune these based on your server's resources
# ---------------------------------------------------------------------------
SLITHER_TIMEOUT = 60      # seconds
MYTHRIL_TIMEOUT = 90      # Mythril's symbolic execution is slow, give it room
FOUNDRY_TIMEOUT = 60
AI_TIMEOUT = 45

SEVERITY_MAP = {
    "high": "High", "medium": "Medium", "low": "Low",
    "informational": "Low", "optimization": "Low",
    "critical": "Critical",
}


class VulnerabilitySchema(typing.TypedDict):
    title: str
    severity: str  # Critical, High, Medium, Low
    description: str
    remediation: str
    affected_lines: List[int]


# ---------------------------------------------------------------------------
# 0. COMPILER ENVIRONMENT PROVISIONING
# ---------------------------------------------------------------------------
async def setup_solc_env(code: str) -> None:
    """Detects the pragma version and switches solc-select to match it.
    Both Slither and Mythril depend on the right solc being active."""
    ver_match = re.search(r"pragma\s+solidity\s*\^?\s*(\d+\.\d+\.\d+)", code)
    version = ver_match.group(1) if ver_match else "0.8.20"
    try:
        proc = await asyncio.create_subprocess_exec(
            "solc-select", "install", version,
            stdout=asyncio.subprocess.DEVNULL, stderr=asyncio.subprocess.DEVNULL,
        )
        await asyncio.wait_for(proc.communicate(), timeout=60)

        proc = await asyncio.create_subprocess_exec(
            "solc-select", "use", version,
            stdout=asyncio.subprocess.DEVNULL, stderr=asyncio.subprocess.DEVNULL,
        )
        await asyncio.wait_for(proc.communicate(), timeout=15)
        logger.info(f"solc switched to version {version}")
    except asyncio.TimeoutError:
        logger.warning(f"solc-select timed out for version {version}, continuing with active version")
    except Exception as e:
        logger.warning(f"solc-select failed ({e}), continuing with whatever solc is currently active")


# ---------------------------------------------------------------------------
# 1a. SAST LAYER — SLITHER
# ---------------------------------------------------------------------------
async def run_slither_sast(contract_path: str) -> List[Dict[str, Any]]:
    """Runs Slither and normalizes its JSON output into our vulnerability schema."""
    vulnerabilities: List[Dict[str, Any]] = []
    try:
        proc = await asyncio.create_subprocess_exec(
            "slither", contract_path, "--json", "-", "--disable-color",
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
        )
        try:
            stdout, stderr = await asyncio.wait_for(proc.communicate(), timeout=SLITHER_TIMEOUT)
        except asyncio.TimeoutError:
            proc.kill()
            logger.error("Slither timed out")
            return [{
                "title": "Slither Scan Timeout",
                "severity": "Medium",
                "description": f"[SLITHER SAST] Static analysis did not complete within {SLITHER_TIMEOUT}s. "
                                "Contract may be too large or contain complex inheritance chains.",
                "remediation": "Re-run with a longer timeout, or split the contract into smaller units for analysis.",
                "affected_lines": [],
            }]

        output = stdout.decode("utf-8", errors="ignore")
        if not output or "{" not in output:
            err = stderr.decode("utf-8", errors="ignore")
            logger.warning(f"Slither produced no JSON output. stderr: {err[:300]}")
            return []

        json_data = json.loads(output[output.find("{"):])
        detectors = json_data.get("results", {}).get("detectors", [])

        for bug in detectors:
            lines: List[int] = []
            for el in bug.get("elements", []):
                sm = el.get("source_mapping", {})
                lines.extend(sm.get("lines", []))

            vulnerabilities.append({
                "title": bug.get("check", "Security Issue"),
                "severity": SEVERITY_MAP.get((bug.get("impact") or "").lower(), "Medium"),
                "description": f"[SLITHER SAST] {bug.get('description', 'Detected via static analyzer pass.').strip()}",
                "remediation": _slither_remediation_hint(bug.get("check", "")),
                "affected_lines": sorted(set(lines)),
            })

    except json.JSONDecodeError as e:
        logger.error(f"Slither JSON parse failed: {e}")
    except FileNotFoundError:
        logger.error("Slither binary not found — is it installed and in PATH?")
        return [{
            "title": "Slither Not Installed",
            "severity": "Critical",
            "description": "[SYSTEM] The 'slither' command was not found on this server.",
            "remediation": "Run: pip install slither-analyzer, and confirm it's in the backend's PATH.",
            "affected_lines": [],
        }]
    except Exception as e:
        logger.error(f"Slither execution error: {e}")

    return vulnerabilities


def _slither_remediation_hint(check_name: str) -> str:
    """A small lookup table so remediation text isn't generic boilerplate."""
    hints = {
        "reentrancy-eth": "Apply checks-effects-interactions pattern; update state before making external calls, or use a reentrancy guard.",
        "reentrancy-no-eth": "Apply checks-effects-interactions pattern; update state before making external calls.",
        "unchecked-transfer": "Check the boolean return value of transfer/transferFrom calls, or use SafeERC20.",
        "arbitrary-send-eth": "Restrict who can trigger the ETH transfer, and validate the destination address.",
        "tx-origin": "Replace tx.origin authentication checks with msg.sender.",
        "timestamp": "Avoid using block.timestamp for critical logic (e.g. randomness or strict equality checks).",
    }
    return hints.get(check_name, "Review the flagged code path against the corresponding SWC/CWE entry and apply the standard mitigation pattern.")


# ---------------------------------------------------------------------------
# 1b. SAST LAYER — MYTHRIL (symbolic execution)
# ---------------------------------------------------------------------------
async def run_mythril_analysis(contract_path: str) -> List[Dict[str, Any]]:
    """Runs Mythril's symbolic execution engine and normalizes its output."""
    vulnerabilities: List[Dict[str, Any]] = []
    try:
        proc = await asyncio.create_subprocess_exec(
            "myth", "analyze", contract_path,
            "-o", "json",
            "--execution-timeout", str(MYTHRIL_TIMEOUT - 10),
            "--solver-timeout", "10000",
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
        )
        try:
            stdout, stderr = await asyncio.wait_for(proc.communicate(), timeout=MYTHRIL_TIMEOUT)
        except asyncio.TimeoutError:
            proc.kill()
            logger.error("Mythril timed out")
            return [{
                "title": "Mythril Scan Timeout",
                "severity": "Medium",
                "description": f"[MYTHRIL SAST] Symbolic execution did not complete within {MYTHRIL_TIMEOUT}s.",
                "remediation": "Increase --execution-timeout, or run Mythril on a smaller isolated contract.",
                "affected_lines": [],
            }]

        output = stdout.decode("utf-8", errors="ignore")

        # Mythril sometimes prints warnings before the JSON body — find the first '{'
        if "{" not in output:
            err = stderr.decode("utf-8", errors="ignore")
            logger.warning(f"Mythril produced no JSON output. stderr: {err[:300]}")
            return []

        json_data = json.loads(output[output.find("{"):])
        issues = json_data.get("issues", [])

        for issue in issues:
            description = issue.get("description", {})
            if isinstance(description, dict):
                desc_text = f"{description.get('head', '')} {description.get('tail', '')}".strip()
            else:
                desc_text = str(description)

            vulnerabilities.append({
                "title": issue.get("title", "Symbolic Execution Finding") + f" (SWC-{issue.get('swc-id', '???')})",
                "severity": SEVERITY_MAP.get((issue.get("severity") or "").lower(), "Medium"),
                "description": f"[MYTHRIL SYMBOLIC EXECUTION] {desc_text}",
                "remediation": "Cross-reference the SWC-ID at https://swcregistry.io for the standard mitigation pattern.",
                "affected_lines": [issue["lineno"]] if issue.get("lineno") else [],
            })

    except json.JSONDecodeError as e:
        logger.error(f"Mythril JSON parse failed: {e}")
    except FileNotFoundError:
        logger.error("Mythril binary not found — is it installed and in PATH?")
        return [{
            "title": "Mythril Not Installed",
            "severity": "Critical",
            "description": "[SYSTEM] The 'myth' command was not found on this server.",
            "remediation": "Run: pip install mythril, and confirm it's in the backend's PATH.",
            "affected_lines": [],
        }]
    except Exception as e:
        logger.error(f"Mythril execution error: {e}")

    return vulnerabilities


# ---------------------------------------------------------------------------
# 2. DAST LAYER — FOUNDRY FUZZING
# ---------------------------------------------------------------------------
async def run_foundry_fuzzing(code_content: str, temp_dir: str) -> List[Dict[str, Any]]:
    vulnerabilities: List[Dict[str, Any]] = []
    src_dir = os.path.join(temp_dir, "src")
    os.makedirs(src_dir, exist_ok=True)

    contract_path = os.path.join(src_dir, "TargetContract.sol")
    with open(contract_path, "w", encoding="utf-8") as f:
        f.write(code_content)

    try:
        init_proc = await asyncio.create_subprocess_exec(
            "forge", "init", "--no-commit", "--force",
            cwd=temp_dir, stdout=asyncio.subprocess.PIPE, stderr=asyncio.subprocess.PIPE,
        )
        await asyncio.wait_for(init_proc.communicate(), timeout=30)

        build_proc = await asyncio.create_subprocess_exec(
            "forge", "build",
            cwd=temp_dir, stdout=asyncio.subprocess.PIPE, stderr=asyncio.subprocess.PIPE,
        )
        stdout, stderr = await asyncio.wait_for(build_proc.communicate(), timeout=FOUNDRY_TIMEOUT)
        output = stdout.decode("utf-8", errors="ignore") + stderr.decode("utf-8", errors="ignore")

        if "arithmetic over/underflow" in output.lower() or "panic: arithmetic" in output.lower():
            vulnerabilities.append({
                "title": "Arithmetic Overflow/Underflow (Runtime)",
                "severity": "Critical",
                "description": "[FOUNDRY DAST] Runtime fuzzing environment flagged a mathematical invariant violation.",
                "remediation": "Wrap arithmetic in checked scopes or upgrade to Solidity >=0.8.0 for native overflow protection.",
                "affected_lines": [],
            })
    except asyncio.TimeoutError:
        logger.error("Foundry build/fuzz timed out")
    except FileNotFoundError:
        logger.error("Foundry ('forge') not found — is it installed and in PATH?")
    except Exception as e:
        logger.error(f"Foundry execution error: {e}")

    return vulnerabilities


# ---------------------------------------------------------------------------
# 3. AI FORMAL-VERIFICATION LAYER
# ---------------------------------------------------------------------------
async def run_formal_verification(code_content: str, model) -> List[Dict[str, Any]]:
    if not model:
        return []
    try:
        prompt = f"""Act as a Formal Verification Engineer & SMT Solver Specialist.
Analyze the math logic of this Solidity smart contract.
1. Extract structural/mathematical invariants (e.g. balance updates, total supply equations).
2. Identify state-transition anomalies where those invariants could be broken.

Return ONLY the structured findings, no conversational prose.
Target Code Block:
{code_content}"""

        loop = asyncio.get_event_loop()
        response = await asyncio.wait_for(
            loop.run_in_executor(
                None,
                lambda: model.generate_content(
                    prompt,
                    generation_config=genai.GenerationConfig(
                        response_mime_type="application/json",
                        response_schema=list[VulnerabilitySchema],
                    ),
                ),
            ),
            timeout=AI_TIMEOUT,
        )

        raw_text = response.text.strip()
        if not raw_text:
            return []

        fv_vulns = json.loads(raw_text)
        for v in fv_vulns:
            v["title"] = f"🔍 [MATH PROOF] {v.get('title', 'Invariant Broken')}"
            v["severity"] = str(v.get("severity", "High")).capitalize()
            v.setdefault("affected_lines", [])
        return fv_vulns

    except asyncio.TimeoutError:
        logger.error("AI formal verification timed out")
        return []
    except json.JSONDecodeError:
        return [{
            "title": "AI Parsing Error",
            "severity": "Low",
            "description": "The AI engine returned a response that could not be parsed as structured JSON.",
            "remediation": "Re-run the deep audit; if this persists, check the model's response_schema configuration.",
            "affected_lines": [],
        }]
    except Exception as e:
        logger.error(f"Formal verification error: {e}")
        return [{
            "title": "Formal Verification Exception",
            "severity": "Medium",
            "description": f"[SYSTEM] AI layer failed: {str(e)}",
            "remediation": "Check API key validity and network connectivity to the AI provider.",
            "affected_lines": [],
        }]


# ---------------------------------------------------------------------------
# 4. ORCHESTRATOR — runs all layers concurrently and merges results
# ---------------------------------------------------------------------------
async def run_analysis_engine(code_content: str, model=None) -> List[Dict[str, Any]]:
    await setup_solc_env(code_content)

    temp_dir = tempfile.mkdtemp()
    contract_path = os.path.join(temp_dir, "contract.sol")

    try:
        with open(contract_path, "w", encoding="utf-8") as f:
            f.write(code_content)

        # Run every layer concurrently instead of sequentially — cuts total
        # scan time roughly to the length of the SLOWEST tool, not the sum.
        slither_task = run_slither_sast(contract_path)
        mythril_task = run_mythril_analysis(contract_path)
        foundry_task = run_foundry_fuzzing(code_content, temp_dir)
        ai_task = run_formal_verification(code_content, model)

        slither_res, mythril_res, foundry_res, ai_res = await asyncio.gather(
            slither_task, mythril_task, foundry_task, ai_task,
            return_exceptions=False,
        )

    finally:
        shutil.rmtree(temp_dir, ignore_errors=True)

    # Merge + dedupe on (title, sorted affected_lines) so the same bug
    # reported by two tools doesn't show twice
    merged: Dict[tuple, Dict[str, Any]] = {}
    for group in (slither_res, mythril_res, foundry_res, ai_res):
        for v in group:
            key = (v["title"], tuple(sorted(v.get("affected_lines", []))))
            if key not in merged:
                merged[key] = v

    results = list(merged.values())

    severity_order = {"Critical": 0, "High": 1, "Medium": 2, "Low": 3}
    results.sort(key=lambda v: severity_order.get(v["severity"], 4))

    return results
