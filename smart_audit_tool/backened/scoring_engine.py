def calculate_risk_score(vulnerabilities: list) -> dict:
    if not vulnerabilities:
        return {
            "security_score": 100,
            "risk_tier": "Low Risk",
            "ui_metadata": {
                "color_code": "#00ff88",
                "badge_text": "SECURE"
            },
            "vulnerability_breakdown": {
                "critical": 0, "high": 0, "medium": 0, "low": 0
            },
            "total_findings": 0,
            "score_breakdown": {
                "base_score": 100,
                "deductions": [],
                "final_score": 100
            }
        }

    max_score = 100.0
    critical_count = 0
    high_count = 0
    medium_count = 0
    low_count = 0
    deductions = []

    for v in vulnerabilities:
        sev = str(v.get("severity", "Medium")).capitalize()
        if sev == "Critical":
            critical_count += 1
            deductions.append({"item": v.get("title", "Critical Issue"), "points": -40, "severity": "Critical"})
        elif sev == "High":
            high_count += 1
            deductions.append({"item": v.get("title", "High Issue"), "points": -25, "severity": "High"})
        elif sev == "Medium":
            medium_count += 1
            deductions.append({"item": v.get("title", "Medium Issue"), "points": -10, "severity": "Medium"})
        elif sev == "Low":
            low_count += 1
            deductions.append({"item": v.get("title", "Low Issue"), "points": -5, "severity": "Low"})

    total_deduction = sum(d["points"] for d in deductions)
    security_score = max(0.0, max_score + total_deduction)
    security_score = round(security_score, 2)

    if critical_count > 0 or security_score <= 39.9:
        risk_tier = "Critical Risk"
        color_code = "#FF3B5C"
    elif high_count > 0 or (40.0 <= security_score <= 69.9):
        risk_tier = "High Risk"
        color_code = "#FF8A3D"
    elif 70.0 <= security_score <= 89.9:
        risk_tier = "Medium Risk"
        color_code = "#F5C451"
    else:
        risk_tier = "Low Risk"
        color_code = "#00ff88"

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
        "total_findings": len(vulnerabilities),
        "score_breakdown": {
            "base_score": 100,
            "deductions": deductions,
            "total_deduction": total_deduction,
            "final_score": security_score
        }
    }