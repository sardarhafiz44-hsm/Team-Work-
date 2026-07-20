import json
import asyncio
from fastapi import HTTPException, status

async def generate_auto_heal(groq_client, issue_title, issue_description, code) -> dict:
    if not groq_client:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="AI Engine uninitialized."
        )
    try:
        system_prompt = f"""You are a senior Solidity security engineer. Fix the vulnerability described below.

CRITICAL RULES:
1. Fix ONLY the targeted vulnerability
2. Keep the rest of the code unchanged
3. Ensure gas optimization and security best practices

Issue: {issue_title}
Description: {issue_description}

Original code:
{code}

Return JSON with this structure:
{{"fixed_code": "the fixed solidity code", "remediation_applied": "explanation of what you fixed"}}

Return ONLY JSON."""

        loop = asyncio.get_event_loop()
        response = await loop.run_in_executor(
            None,
            lambda: groq_client.chat.completions.create(
                model="llama-3.3-70b-versatile",
                messages=[{"role": "user", "content": system_prompt}],
                temperature=0.1,
                max_tokens=4096,
                response_format={"type": "json_object"}
            )
        )

        raw_text = response.choices[0].message.content.strip()
        if raw_text.startswith("```"):
            lines = raw_text.split("\n")
            raw_text = "\n".join(lines[1:-1]) if lines[-1].strip() == "```" else "\n".join(lines[1:])
        raw_text = raw_text.strip()

        result = json.loads(raw_text)
        return {
            "status": "Success",
            "fixed_code": result.get("fixed_code", "").strip(),
            "remediation_details": result.get("remediation_applied", "").strip()
        }
    except json.JSONDecodeError:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="AI returned invalid JSON"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Auto-Heal Error: {str(e)}"
        )