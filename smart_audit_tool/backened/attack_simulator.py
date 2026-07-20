"""
SolShield Pro - Attack Simulation Agent (Agent Beta)
Generates step-by-step exploit scenarios for discovered vulnerabilities.
"""

import json
import asyncio
from typing import List, Dict, Any

async def simulate_attack(vulnerabilities: List[Dict], groq_client, contract_code: str) -> Dict[str, Any]:
    """
    Simulates how an attacker would exploit the found vulnerabilities.
    Returns a detailed attack protocol with steps, code, and impact.
    """
    
    if not vulnerabilities or not groq_client:
        return {
            "attack_feasible": False,
            "attack_chain": [],
            "estimated_loss": "$0",
            "difficulty": "N/A"
        }

    # Build attack simulation prompt
    vuln_summary = "\n".join([
        f"- {v['severity']}: {v['title']} (Lines: {v.get('affected_lines', [])})"
        for v in vulnerabilities[:5]
    ])

    prompt = f"""You are an elite white-hat hacker simulating an attack on this Solidity smart contract.

VULNERABILITIES FOUND:
{vuln_summary}

SMART CONTRACT CODE:
```solidity
{contract_code[:2000]}
```

Generate a detailed ATTACK SIMULATION PROTOCOL with these sections:

1. **Attack Vector**: Primary vulnerability to exploit
2. **Prerequisites**: What attacker needs (flashloan, multiple addresses, etc.)
3. **Step-by-Step Execution**: 
   - Step 1: [Action]
   - Step 2: [Action]
   - Step 3: [Action]
4. **Attack Code**: Solidity/JavaScript code for the exploit
5. **Expected Impact**: 
   - Funds at risk: $X
   - Success probability: X%
   - Time to execute: X minutes
6. **Mitigation Priority**: Which vulnerability to fix first

Return as JSON:
{{
  "attack_feasible": true/false,
  "difficulty": "Easy/Medium/Hard/Expert",
  "attack_chain": [
    {{
      "step": 1,
      "action": "description",
      "code": "attack code snippet",
      "impact": "what happens"
    }}
  ],
  "estimated_loss_usd": 500000,
  "success_probability": 85,
  "time_to_execute_minutes": 5,
  "primary_vector": "vulnerability name",
  "mitigation_priority": ["fix1", "fix2"]
}}

Return ONLY JSON."""

    try:
        loop = asyncio.get_event_loop()
        response = await loop.run_in_executor(
            None,
            lambda: groq_client.chat.completions.create(
                model="llama-3.3-70b-versatile",
                messages=[{"role": "user", "content": prompt}],
                temperature=0.3,
                max_tokens=3000,
                response_format={"type": "json_object"}
            )
        )

        raw_text = response.choices[0].message.content.strip()
        
        # Clean markdown
        if raw_text.startswith("```"):
            lines = raw_text.split("\n")
            raw_text = "\n".join(lines[1:-1]) if lines[-1].strip() == "```" else "\n".join(lines[1:])
        
        result = json.loads(raw_text.strip())
        
        # Add metadata
        result["simulated_at"] = "now"
        result["vulnerabilities_analyzed"] = len(vulnerabilities)
        
        return result

    except Exception as e:
        return {
            "attack_feasible": True,
            "error": str(e)[:200],
            "attack_chain": [],
            "estimated_loss_usd": 0,
            "difficulty": "Unknown"
        }


def get_attack_visualization(attack_data: Dict) -> Dict[str, Any]:
    """
    Converts attack simulation data into visualization-ready format.
    """
    if not attack_data.get("attack_chain"):
        return {
            "nodes": [],
            "edges": [],
            "risk_score": 0
        }

    nodes = []
    edges = []
    
    # Create flow nodes
    for i, step in enumerate(attack_data["attack_chain"]):
        nodes.append({
            "id": f"step_{i}",
            "label": f"Step {i+1}: {step.get('action', 'Unknown')[:50]}",
            "type": "attack_step",
            "impact": step.get("impact", ""),
            "code": step.get("code", "")
        })
        
        if i > 0:
            edges.append({
                "from": f"step_{i-1}",
                "to": f"step_{i}",
                "label": "exploit chain"
            })

    # Add start and end nodes
    nodes.insert(0, {
        "id": "start",
        "label": "Attacker Initiation",
        "type": "start"
    })
    nodes.append({
        "id": "end",
        "label": f"Impact: ${attack_data.get('estimated_loss_usd', 0):,}",
        "type": "impact"
    })
    edges.insert(0, {"from": "start", "to": "step_0", "label": "begin"})
    edges.append({"from": f"step_{len(attack_data['attack_chain'])-1}", "to": "end", "label": "exploit"})

    return {
        "nodes": nodes,
        "edges": edges,
        "risk_score": attack_data.get("success_probability", 0),
        "difficulty": attack_data.get("difficulty", "Unknown"),
        "estimated_loss": attack_data.get("estimated_loss_usd", 0)
    }
