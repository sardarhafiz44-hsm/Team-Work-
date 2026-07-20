"""
SolShield Pro - AI-Powered Attack Simulation Agent
Generates REAL attack scenarios using Groq AI based on actual vulnerabilities found.
"""

import json
import asyncio
from typing import List, Dict, Any
from groq import Groq

async def generate_attack_simulation(
    vulnerabilities: List[Dict],
    contract_code: str,
    groq_client: Groq
) -> Dict[str, Any]:
    """
    Uses AI to generate realistic attack scenarios based on found vulnerabilities.
    Returns step-by-step exploit plan with actual code.
    """
    
    if not vulnerabilities:
        return {
            "attack_feasible": False,
            "message": "No vulnerabilities found. Contract appears secure.",
            "attack_steps": [],
            "estimated_loss": "$0",
            "difficulty": "N/A"
        }

    # Build vulnerability summary for AI
    vuln_details = "\n".join([
        f"- {v.get('severity', 'Unknown')}: {v.get('title', 'Unknown')} "
        f"(Lines: {v.get('affected_lines', [])})\n"
        f"  Description: {v.get('description', 'N/A')}\n"
        f"  Impact: {v.get('impact', 'Unknown')}"
        for v in vulnerabilities[:5]  # Top 5 vulnerabilities
    ])

    prompt = f"""You are an elite white-hat hacker performing authorized penetration testing.

VULNERABILITIES FOUND IN SMART CONTRACT:
{vuln_details}

SMART CONTRACT CODE:
```solidity
{contract_code[:3000]}
```

Generate a DETAILED ATTACK SIMULATION showing how an attacker would exploit these vulnerabilities.

For EACH vulnerability, provide:
1. **Attack Name**: Clear title
2. **Difficulty**: Easy/Medium/Hard/Expert
3. **Prerequisites**: What attacker needs (flashloan, multiple wallets, etc.)
4. **Step-by-Step Execution**:
   - Step 1: [Action with code snippet]
   - Step 2: [Action with code snippet]
   - Step 3: [Action with code snippet]
5. **Expected Outcome**: What happens after attack
6. **Funds at Risk**: Realistic estimate based on contract balance
7. **Success Probability**: Based on complexity

Return JSON format:
{{
  "attack_feasible": true,
  "total_vulnerabilities": 3,
  "attacks": [
    {{
      "name": "Reentrancy Attack via Flashloan",
      "difficulty": "Hard",
      "target_vulnerability": "Reentrancy in withdraw()",
      "prerequisites": ["Flashloan of 100 ETH", "Attacker wallet with gas"],
      "steps": [
        {{
          "step": 1,
          "action": "Borrow 100 ETH via flashloan",
          "code": "flashloan.borrow(100 ether);",
          "explanation": "Attacker borrows funds to manipulate contract state"
        }},
        {{
          "step": 2,
          "action": "Call withdraw() function",
          "code": "target.withdraw();",
          "explanation": "Triggers vulnerable function"
        }},
        {{
          "step": 3,
          "action": "Re-enter withdraw() before balance update",
          "code": "// Reentrancy callback\\ntarget.withdraw();",
          "explanation": "Exploits reentrancy to drain funds"
        }}
      ],
      "outcome": "Contract drained of all ETH",
      "funds_at_risk_usd": 500000,
      "success_probability": 85,
      "mitigation": "Use checks-effects-interactions pattern"
    }}
  ],
  "overall_risk": "Critical",
  "recommendation": "DO NOT DEPLOY - Fix all vulnerabilities first"
}}

Return ONLY valid JSON. No markdown, no explanation."""

    try:
        loop = asyncio.get_event_loop()
        response = await loop.run_in_executor(
            None,
            lambda: groq_client.chat.completions.create(
                model="llama-3.3-70b-versatile",
                messages=[{"role": "user", "content": prompt}],
                temperature=0.4,
                max_tokens=4096,
                response_format={"type": "json_object"}
            )
        )

        raw_text = response.choices[0].message.content.strip()
        
        # Clean markdown if present
        if raw_text.startswith("```"):
            lines = raw_text.split("\n")
            raw_text = "\n".join(lines[1:-1]) if len(lines) > 2 and lines[-1].strip() == "```" else "\n".join(lines[1:])
        
        result = json.loads(raw_text.strip())
        
        # Add metadata
        result["generated_by"] = "Groq AI (Llama 3.3 70B)"
        result["timestamp"] = "now"
        result["vulnerabilities_analyzed"] = len(vulnerabilities)
        
        return result

    except json.JSONDecodeError as e:
        return {
            "attack_feasible": True,
            "error": f"AI response parsing failed: {str(e)[:200]}",
            "attacks": [],
            "recommendation": "Manual review required"
        }
    except Exception as e:
        return {
            "attack_feasible": True,
            "error": f"AI generation failed: {str(e)[:200]}",
            "attacks": [],
            "recommendation": "Check Groq API key and try again"
        }


def format_attack_for_display(attack_data: Dict) -> List[Dict]:
    """
    Formats attack data for frontend display.
    """
    if not attack_data.get("attacks"):
        return []
    
    formatted_attacks = []
    for attack in attack_data["attacks"]:
        formatted_attacks.append({
            "name": attack.get("name", "Unknown Attack"),
            "difficulty": attack.get("difficulty", "Unknown"),
            "target": attack.get("target_vulnerability", "Unknown"),
            "prerequisites": attack.get("prerequisites", []),
            "steps": attack.get("steps", []),
            "outcome": attack.get("outcome", "Unknown"),
            "funds_at_risk": attack.get("funds_at_risk_usd", 0),
            "success_probability": attack.get("success_probability", 0),
            "mitigation": attack.get("mitigation", "Review required")
        })
    
    return formatted_attacks
