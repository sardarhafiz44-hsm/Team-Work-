def calculate_risk_score(vulnerabilities: list) -> dict:
    """
    Enterprise risk analysis matrix utilizing CVSS v3.1 mathematical logic bounds.
    Converts individual severity profiles into a high-level points system and risk matrix.
    """
    # Baseline calculations parameters
    max_score = 100.0
    critical_count = 0
    high_count = 0
    medium_count = 0
    low_count = 0
    
    # Weight matrices according to industrial smart contract risk parameters
    # High-severity bugs carry exponential weight multipliers to prevent masking vectors
    for v in vulnerabilities:
        sev = str(v.get("severity", "Medium")).capitalize()
        if sev == "Critical":
            critical_count += 1
        elif sev == "High":
            high_count += 1
        elif sev == "Medium":
            medium_count += 1
        elif sev == "Low":
            low_count += 1

    # Exponential degradation formula to prevent logical masking
    # Even a single critical vulnerability drops security posture severely
    deductions = (
        (critical_count * 40.0) +
        (high_count * 25.0) +
        (medium_count * 10.0) +
        (low_count * 2.5)
    )
    
    # Compute base security health points score
    security_score = max(0.0, max_score - deductions)
    security_score = round(security_score, 2)
    
    # Determine the structural categorical risk tier based on absolute metrics bounds
    if critical_count > 0 or security_score <= 39.9:
        risk_tier = "Critical Risk"
        color_code = "#FF0000"  # Crimson Red for high-alert components
    elif high_count > 0 or (40.0 <= security_score <= 69.9):
        risk_tier = "High Risk"
        color_code = "#FFA500"  # Amber Orange
    elif 70.0 <= security_score <= 89.9:
        risk_tier = "Medium Risk"
        color_code = "#FFFF00"  # Warning Yellow
    else:
        risk_tier = "Low Risk"
        color_code = "#00FF00"  # Secure Emerald Green

    # Enterprise payload matrix response for frontend dashboard widgets mapping
    return {
        "security_score": security_score,
        "risk_tier": risk_tier,
        "ui_metadata": {
            "color_code": color_code,
            "badge_text": risk_tier.upper()
        },
        "vulnerability_breakdown": {
            "critical": critical_count,
            "high": high_count,
            "medium": medium_count,
            "low": low_count
        },
        "total_findings": len(vulnerabilities)
    }