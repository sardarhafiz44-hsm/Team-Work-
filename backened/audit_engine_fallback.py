import json
import os
import asyncio
import tempfile
import shutil
import google.generativeai as genai
import typing_extensions as typing
from fastapi import status

# Define explicit structured validation layout for fallback logs entries
class FallbackVulnerabilitySchema(typing.TypedDict):
    title: str
    severity: str  # Critical, High, Medium, Low
    description: str
    remediation: str
    affected_lines: list[int]

async def run_analysis_engine(code_content: str, model=None) -> list:
    vulnerabilities = []
    
    # --- Layer 1: Slither SAST Core Runtime Pass ---
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
                    
                    vulnerabilities.append({
                        "title": bug.get("check", "Security Issue"),
                        "severity": str(bug.get("impact", "Medium")).capitalize(),
                        "description": f"[SLITHER SAST] {bug.get('description', 'Detected via fallback engine pipeline pass.')}",
                        "remediation": "Review vulnerable reference code sequence paths.",
                        "affected_lines": sorted(set(lines)),
                    })
    except Exception:
        pass  # Graceful recovery loop validation execution protection
    finally:
        shutil.rmtree(temp_dir, ignore_errors=True)
    
    # --- Layer 2: 🚀 AI FALLBACK LOGIC ENGINE (Triggers on SAST bypass/empty) ---
    if not vulnerabilities and model:
        try:
            fallback_prompt = f"""Act as an Expert Smart Contract Vulnerability Auditor.
Analyze the target contract logic explicitly for high-alert flaws like Reentrancy, Overflow loops, and Access Control bypass anomalies.

Enforce the output payload array to match the structural formatting criteria rules.
Target Code Block:
{code_content}"""

            loop = asyncio.get_event_loop()
            response = await loop.run_in_executor(
                None, 
                lambda: model.generate_content(
                    fallback_prompt,
                    generation_config=genai.GenerationConfig(
                        response_mime_type="application/json",
                        response_schema=list[FallbackVulnerabilitySchema],
                        temperature=0.1
                    )
                )
            )
            
            raw_text = response.text.strip()
            if raw_text:
                ai_vulns = json.loads(raw_text)
                for v in ai_vulns:
                    v["title"] = f"🤖 [AI FALLBACK] {v.get('title', 'Security Finding')}"
                    v["severity"] = str(v.get("severity", "Medium")).capitalize()
                    if "affected_lines" not in v:
                        v["affected_lines"] = []
                vulnerabilities.extend(ai_vulns)
                
        except Exception as fallback_err:
            # Injecting descriptive diagnostic trace array log entry for easy troubleshooting on frontend UI
            vulnerabilities.append({
                "title": "Fallback Engine Failure",
                "severity": "Critical",
                "description": f"AI fallback validation runtime trace raised unexpected behavior pattern: {str(fallback_err)}",
                "remediation": "Check system server logs environment profiles parameters context.",
                "affected_lines": []
            })

    return vulnerabilities