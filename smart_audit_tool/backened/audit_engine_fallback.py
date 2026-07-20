import json
import os
import asyncio
import tempfile
import shutil
import re
from fastapi import status

async def run_analysis_engine(code_content: str, groq_client=None) -> list:
    vulnerabilities = []

    # =====================================================
    # Layer 1: Slither SAST — Static Analysis
    # =====================================================
    temp_dir = tempfile.mkdtemp()
    temp_path = os.path.join(temp_dir, "contract.sol")

    try:
        with open(temp_path, 'w', encoding='utf-8') as temp_file:
            temp_file.write(code_content)

        process = await asyncio.create_subprocess_shell(
            f"slither {temp_path} --json - --solc-disable-solc-warnings",
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE
        )
        stdout, stderr = await process.communicate()
        output = stdout.decode('utf-8')

        if output and "{" in output:
            json_data = json.loads(output[output.find("{"):])
            if "results" in json_data and "detectors" in json_data["results"]:
                for bug in json_data["results"]["detectors"]:
                    lines = []
                    for el in bug.get("elements", []):
                        lines.extend(el.get("source_mapping", {}).get("lines", []))

                    severity_map = {
                        "high": "High",
                        "medium": "Medium",
                        "low": "Low",
                        "informational": "Low",
                        "optimization": "Low",
                    }
                    raw_sev = str(bug.get("impact", "medium")).lower()
                    mapped_sev = severity_map.get(raw_sev, "Medium")

                    vulnerabilities.append({
                        "title": bug.get("check", "Security Issue"),
                        "severity": mapped_sev,
                        "description": f"[SLITHER SAST] {bug.get('description', 'Detected via static analysis.')}",
                        "remediation": "Review vulnerable code and apply standard mitigation patterns.",
                        "affected_lines": sorted(set(lines)),
                    })
    except Exception as e:
        print(f"Slither error: {e}")
    finally:
        shutil.rmtree(temp_dir, ignore_errors=True)

    # =====================================================
    # Layer 2: Groq AI — Always runs for comprehensive analysis
    # =====================================================
    if groq_client:
        try:
            fallback_prompt = f"""You are an elite Solidity smart contract security auditor with 10+ years of experience.

Analyze the following Solidity smart contract for ALL vulnerabilities including but not limited to:
- Reentrancy attacks
- Integer overflow/underflow
- Access control bypass
- Unchecked return values
- Front-running vulnerabilities
- Denial of Service (DoS)
- Logic flaws
- Gas optimization issues

CRITICAL: Return your findings as a JSON array with this EXACT structure:
[
  {{
    "title": "short vulnerability name",
    "severity": "Critical",
    "description": "detailed explanation of the vulnerability and its impact",
    "remediation": "specific code-level fix recommendation",
    "affected_lines": [1, 2, 3]
  }}
]

Severity levels: Critical, High, Medium, Low

If the contract is SECURE and has no vulnerabilities, return an empty array: []

Contract code to analyze:
```solidity
{code_content}
```

Return ONLY the JSON array. No markdown, no explanation, just the JSON."""

            loop = asyncio.get_event_loop()
            response = await loop.run_in_executor(
                None,
                lambda: groq_client.chat.completions.create(
                    model="llama-3.3-70b-versatile",
                    messages=[{"role": "user", "content": fallback_prompt}],
                    temperature=0.1,
                    max_tokens=4096,
                    response_format={"type": "json_object"}
                )
            )

            raw_text = response.choices[0].message.content.strip()

            # Clean markdown code blocks if present
            if raw_text.startswith("```"):
                lines = raw_text.split("\n")
                # Remove first line (```json or ```) and last line (```)
                if len(lines) >= 2:
                    if lines[-1].strip() == "```":
                        lines = lines[1:-1]
                    else:
                        lines = lines[1:]
                raw_text = "\n".join(lines)
            raw_text = raw_text.strip()

            # Parse JSON safely
            try:
                ai_vulns = json.loads(raw_text)
            except json.JSONDecodeError:
                # Try to extract JSON array from response
                match = re.search(r'\[.*\]', raw_text, re.DOTALL)
                if match:
                    ai_vulns = json.loads(match.group(0))
                else:
                    raise ValueError(f"Could not parse JSON from AI response: {raw_text[:100]}")

            # Handle different response structures
            if isinstance(ai_vulns, str):
                ai_vulns = json.loads(ai_vulns)

            if isinstance(ai_vulns, dict):
                # Extract array from dict if wrapped
                for key in ["vulnerabilities", "findings", "results", "data"]:
                    if key in ai_vulns and isinstance(ai_vulns[key], list):
                        ai_vulns = ai_vulns[key]
                        break
                else:
                    # Single vulnerability as dict
                    ai_vulns = [ai_vulns]

            if not isinstance(ai_vulns, list):
                ai_vulns = [ai_vulns] if ai_vulns else []

            # Process each vulnerability
            valid_severities = ["Critical", "High", "Medium", "Low"]
            for v in ai_vulns:
                if not isinstance(v, dict):
                    continue

                # Ensure all required fields exist
                title = v.get("title", "Security Finding")
                severity = str(v.get("severity", "Medium")).capitalize()
                if severity not in valid_severities:
                    severity = "Medium"
                description = v.get("description", "No description provided.")
                remediation = v.get("remediation", "Review and fix manually.")
                affected_lines = v.get("affected_lines", [])

                if not isinstance(affected_lines, list):
                    affected_lines = []

                vulnerabilities.append({
                    "title": f" [AI ANALYSIS] {title}",
                    "severity": severity,
                    "description": description,
                    "remediation": remediation,
                    "affected_lines": affected_lines,
                })

        except Exception as fallback_err:
            # Log error but don't crash — add diagnostic finding
            vulnerabilities.append({
                "title": "AI Analysis Failed",
                "severity": "Medium",
                "description": f"AI fallback error: {str(fallback_err)[:200]}",
                "remediation": "Check Groq API key, model availability, and try again. Slither results still available.",
                "affected_lines": []
            })

    # =====================================================
    # Deduplication — remove duplicate findings
    # =====================================================
    seen = set()
    unique_vulns = []
    for v in vulnerabilities:
        key = (v["title"], v["severity"])
        if key not in seen:
            seen.add(key)
            unique_vulns.append(v)

    # Sort by severity
    severity_order = {"Critical": 0, "High": 1, "Medium": 2, "Low": 3}
    unique_vulns.sort(key=lambda x: severity_order.get(x["severity"], 4))

    return unique_vulns
