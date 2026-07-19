import json
import asyncio
from fastapi import HTTPException, status
import google.generativeai as genai
import typing_extensions as typing

# Define strict response structure for the Auto-Healer Agent
class HealedContractSchema(typing.TypedDict):
    fixed_code: str
    remediation_applied: str

async def generate_auto_heal(model, issue_title, issue_description, code) -> dict:
    if not model:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE, 
            detail="AI Core Engine uninitialized or model missing."
        )
        
    try:
        # Enforcing GitHub Repository Expert Persona & Contextual Constraints
        system_prompt = f"""Act as the Senior Solidity Security Engineer and Smart Contract Auditor for SolShield Pro.
Your task is to fix the absolute security vulnerability specified in the issue.

CRITICAL INSTRUCTIONS:
1. Fix ONLY the targeted vulnerability. Do not alter unrelated logical paths or state parameters.
2. Ensure the resulting code is gas-optimized and strictly follows Solidity security best-practices.
3. Eliminate all overflow, reentrancy, or access control vectors introduced by the fix.

Issue Title: {issue_title}
Issue Description: {issue_description}

Target Source Code:
{code}
"""
        loop = asyncio.get_event_loop()
        
        # Enforcing Structured Schema outputs to completely eliminate regex string parsing errors
        response = await loop.run_in_executor(
            None,
            lambda: model.generate_content(
                system_prompt,
                generation_config=genai.GenerationConfig(
                    response_mime_type="application/json",
                    response_schema=HealedContractSchema,
                    temperature=0.1  # Lowered temperature for deterministic security patching
                )
            )
        )
        
        raw_text = response.text.strip()
        if not raw_text:
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY, 
                detail="Automated patch engine returned empty context structural block."
            )
            
        result = json.loads(raw_text)
        return {
            "status": "Success",
            "fixed_code": result.get("fixed_code", "").strip(),
            "remediation_details": result.get("remediation_applied", "").strip()
        }
        
    except json.JSONDecodeError:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Healer engine failed to validate output parsing schema criteria matrix."
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Auto-Heal Agent Core Runtime Failure: {str(e)}"
        )