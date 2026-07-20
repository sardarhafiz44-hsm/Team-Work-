"""
SolShield Pro - Gas Optimization Analyzer
Analyzes smart contract for gas inefficiencies and suggests optimizations.
"""

import re
from typing import Dict, List, Any

def analyze_gas_optimization(contract_code: str) -> Dict[str, Any]:
    """
    Static analysis for gas optimization opportunities.
    """
    issues = []
    savings_estimate = 0

    # Check for storage vs memory usage
    storage_pattern = r'(uint256|address|bool)\s+(public|private|internal)\s+(\w+)'
    storage_vars = re.findall(storage_pattern, contract_code)
    
    # Check for loops with storage reads
    loop_pattern = r'for\s*\([^)]+\)\s*\{'
    loops = re.findall(loop_pattern, contract_code)
    
    for i, loop in enumerate(loops):
        issues.append({
            "id": f"gas_{i+1}",
            "title": "Storage Read in Loop",
            "severity": "Medium",
            "description": "Reading from storage in a loop is expensive. Cache in memory.",
            "recommendation": "Use local variable to cache storage value before loop",
            "estimated_savings_gwei": 2000,
            "line": contract_code[:contract_code.find(loop)].count('\n') + 1
        })
        savings_estimate += 2000

    # Check for expensive operations
    if 'ecrecover' in contract_code:
        issues.append({
            "id": "gas_ecrecover",
            "title": "Expensive ecrecover Operation",
            "severity": "Low",
            "description": "ecrecover costs 3000+ gas. Consider using OpenZeppelin's ECDSA library.",
            "recommendation": "Use import '@openzeppelin/contracts/utils/cryptography/ECDSA.sol'",
            "estimated_savings_gwei": 500,
            "line": contract_code.find('ecrecover')
        })
        savings_estimate += 500

    # Check for selfdestruct (deprecated)
    if 'selfdestruct' in contract_code:
        issues.append({
            "id": "gas_selfdestruct",
            "title": "Deprecated selfdestruct",
            "severity": "High",
            "description": "selfdestruct is deprecated since Cancun upgrade. Use alternative pattern.",
            "recommendation": "Implement pause mechanism or owner withdrawal pattern",
            "estimated_savings_gwei": 0,
            "line": contract_code.find('selfdestruct')
        })

    # Check for tx.origin
    if 'tx.origin' in contract_code:
        issues.append({
            "id": "gas_txorigin",
            "title": "Use msg.sender instead of tx.origin",
            "severity": "Medium",
            "description": "tx.origin is not only a security risk but can cause unexpected gas costs",
            "recommendation": "Replace tx.origin with msg.sender",
            "estimated_savings_gwei": 100,
            "line": contract_code.find('tx.origin')
        })
        savings_estimate += 100

    # Check for redundant SSTORE
    if re.search(r'(\w+)\s*=\s*\1\s*;', contract_code):
        issues.append({
            "id": "gas_redundant_store",
            "title": "Redundant State Write",
            "severity": "Medium",
            "description": "Writing same value to storage wastes gas",
            "recommendation": "Add conditional check before storage write",
            "estimated_savings_gwei": 5000,
            "line": 0
        })
        savings_estimate += 5000

    # Calculate total potential savings
    total_savings_eth = savings_estimate / 1e9
    gas_price_gwei = 30  # Average gas price
    savings_usd = (total_savings_eth * 3000)  # Assuming ETH = $3000

    return {
        "total_issues": len(issues),
        "total_savings_gwei": savings_estimate,
        "total_savings_usd_per_tx": round(savings_usd, 4),
        "issues": issues,
        "optimization_score": max(0, 100 - (len(issues) * 15))
    }


def get_gas_visualization(gas_data: Dict) -> Dict[str, Any]:
    """
    Creates visualization data for gas analysis.
    """
    return {
        "chart_data": [
            {"name": "Current Gas", "value": 100, "color": "#FF3B5C"},
            {"name": "Optimized", "value": gas_data["optimization_score"], "color": "#00ff88"},
        ],
        "savings_breakdown": [
            {
                "category": issue["title"],
                "savings_gwei": issue["estimated_savings_gwei"],
                "severity": issue["severity"]
            }
            for issue in gas_data["issues"]
        ],
        "total_savings": f"${gas_data['total_savings_usd_per_tx']}"
    }
