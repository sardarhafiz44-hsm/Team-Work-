"""
SolShield Pro - ERC Compliance Checker
Checks if contract follows ERC20/ERC721/ERC1155 standards.
"""

import re
from typing import Dict, List, Any

def check_erc_compliance(contract_code: str) -> Dict[str, Any]:
    """
    Analyzes contract for ERC standard compliance.
    """
    
    # Detect contract type
    is_erc20 = bool(re.search(r'function\s+transfer\s*\(', contract_code))
    is_erc721 = bool(re.search(r'function\s+safeTransferFrom\s*\(', contract_code))
    is_erc1155 = bool(re.search(r'function\s+safeBatchTransferFrom\s*\(', contract_code))
    
    compliance_results = {
        "contract_type": "Unknown",
        "standards_checked": [],
        "compliant": False,
        "compliance_score": 0,
        "missing_functions": [],
        "events_missing": [],
        "recommendations": []
    }

    if is_erc20:
        compliance_results["contract_type"] = "ERC20 Token"
        compliance_results["standards_checked"].append("ERC20")
        
        required_functions = [
            ("totalSupply", "function totalSupply()"),
            ("balanceOf", "function balanceOf(address)"),
            ("transfer", "function transfer(address,uint256)"),
            ("transferFrom", "function transferFrom(address,address,uint256)"),
            ("approve", "function approve(address,uint256)"),
            ("allowance", "function allowance(address,address)")
        ]
        
        required_events = [
            ("Transfer", "event Transfer(address,address,uint256)"),
            ("Approval", "event Approval(address,address,uint256)")
        ]
        
        found_functions = []
        missing_functions = []
        
        for func_name, pattern in required_functions:
            if re.search(pattern.replace('(', r'\s*\('), contract_code):
                found_functions.append(func_name)
            else:
                missing_functions.append(func_name)
        
        found_events = []
        missing_events = []
        
        for event_name, pattern in required_events:
            if re.search(pattern.replace('(', r'\s*\('), contract_code):
                found_events.append(event_name)
            else:
                missing_events.append(event_name)
        
        compliance_score = ((len(found_functions) / len(required_functions)) * 80) + \
                         ((len(found_events) / len(required_events)) * 20)
        
        compliance_results.update({
            "compliant": len(missing_functions) == 0 and len(missing_events) == 0,
            "compliance_score": round(compliance_score, 1),
            "found_functions": found_functions,
            "missing_functions": missing_functions,
            "found_events": found_events,
            "missing_events": missing_events,
            "recommendations": [
                f"Implement missing function: {func}" for func in missing_functions
            ] + [
                f"Add missing event: {event}" for event in missing_events
            ]
        })

    elif is_erc721:
        compliance_results["contract_type"] = "ERC721 NFT"
        compliance_results["standards_checked"].append("ERC721")
        
        required_functions = [
            "balanceOf", "ownerOf", "safeTransferFrom",
            "transferFrom", "approve", "setApprovalForAll",
            "getApproved", "isApprovedForAll"
        ]
        
        found = [f for f in required_functions if f in contract_code]
        missing = [f for f in required_functions if f not in contract_code]
        
        compliance_score = (len(found) / len(required_functions)) * 100
        
        compliance_results.update({
            "compliant": len(missing) == 0,
            "compliance_score": round(compliance_score, 1),
            "missing_functions": missing,
            "recommendations": [f"Implement: {f}" for f in missing]
        })

    elif is_erc1155:
        compliance_results["contract_type"] = "ERC1155 Multi-Token"
        compliance_results["standards_checked"].append("ERC1155")
        
        required_functions = [
            "balanceOf", "balanceOfBatch", "safeTransferFrom",
            "safeBatchTransferFrom", "setApprovalForAll", "isApprovedForAll"
        ]
        
        found = [f for f in required_functions if f in contract_code]
        missing = [f for f in required_functions if f not in contract_code]
        
        compliance_score = (len(found) / len(required_functions)) * 100
        
        compliance_results.update({
            "compliant": len(missing) == 0,
            "compliance_score": round(compliance_score, 1),
            "missing_functions": missing,
            "recommendations": [f"Implement: {f}" for f in missing]
        })

    else:
        compliance_results["contract_type"] = "Custom Contract"
        compliance_results["compliance_score"] = 100
        compliance_results["recommendations"] = ["No specific ERC standard detected"]

    return compliance_results


def get_compliance_visualization(compliance_data: Dict) -> Dict[str, Any]:
    """
    Creates visualization data for compliance report.
    """
    return {
        "contract_type": compliance_data["contract_type"],
        "compliance_score": compliance_data["compliance_score"],
        "standards": compliance_data["standards_checked"],
        "is_compliant": compliance_data["compliant"],
        "missing_items": compliance_data.get("missing_functions", []) + compliance_data.get("missing_events", [])
    }
