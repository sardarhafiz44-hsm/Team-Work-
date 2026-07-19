import re

# --- VULNERABILITY RULES (Ab mazeed detail k sath) ---
VULN_RULES = [
    {
        "id": "reentrancy",
        "name": "Reentrancy Risk",
        # Updated Pattern: Ab ye .call.value(...) aur .call{value:...} dono ko pakray ga
        "pattern": r"\.call(?:\.value\s*\(|\s*\{)",
        "severity": "High",
        "description": "External call detected. Ensure state changes happen BEFORE the call.",
        
        # New: Human Readable Details
        "explanation": "Apka code contract se bahar paise bhej raha hai (External Call). Solidity mein agar aap paise bhejne se pehle user ka balance update nahi karte, to ye khatarnaak hai.",
        "consequence": "Hacker aik hi transaction mein baar baar withdraw() function call kar ke apka pura contract khali (Drain) kar sakta hai.",
        "patch": "Fix karne ke liye 'Checks-Effects-Interactions' pattern use karein. Pehle user ka balance 0 set karein, uske baad paise transfer karein. Ya phir OpenZeppelin ka 'ReentrancyGuard' use karein."
    },
    {
        "id": "tx_origin",
        "name": "Phishing via tx.origin",
        "pattern": r"tx\.origin",
        "severity": "Medium",
        "description": "Use of tx.origin for authorization is insecure.",
        
        "explanation": "Aap authentication ke liye 'tx.origin' use kar rahe hain jo ke ghalat hai. Ye user ka asal wallet address hota hai, jo phishing attack mein spoof ho sakta hai.",
        "consequence": "Agar apka user kisi malicious website par click kar de, to hacker uski identity use kar ke apke contract se funds chura sakta hai.",
        "patch": "'tx.origin' ki jagah hamesha 'msg.sender' use karein."
    },
    {
        "id": "overflow",
        "name": "Arithmetic Overflow Risk",
        "pattern": r"(\+|\-|\*)\=", 
        "severity": "Low",
        "description": "Older Solidity versions (<0.8.0) lack overflow checks.",
        
        "explanation": "Apke code mein +, -, * use ho raha hai aur Solidity ka version purana lag raha hai. Agar number boht bara ho gya to wo wapis 0 par aa jaye ga (Overflow).",
        "consequence": "Calculation ghalat ho sakti hai. Misal ke tor par, agar kisi ka balance negative mein chala gya to wo infinite ho jaye ga.",
        "patch": "Solidity version ^0.8.0 use karein (us mein ye automatic fix hai), ya phir 'SafeMath' library use karein."
    },
    {
        "id": "unchecked_low_level",
        "name": "Unchecked Return Value",
        # Pattern: .call(...) use hua magar uske foran baad require ya if nahi laga
        "pattern": r"\.call\s*(?:\.value\s*\(|\{)(?:(?!\brequire\b|\bif\b).)*;",
        "severity": "Medium",
        "description": "Low-level call return value not checked.",
        
        "explanation": "Aap ne '.call' use kiya hai lekin ye check nahi kiya ke wo successful hua ya fail.",
        "consequence": "Agar paise transfer fail ho gaye, to contract ko pata nahi chalay ga aur wo samajhay ga ke paise chale gaye hain.",
        "patch": "Hamesha return value check karein. Example: '(bool success, ) = msg.sender.call...; require(success, \"Transfer failed\");'"
    }
]

def analyze_contract_text(code: str):
    results = []
    lines = code.split('\n')
    
    # 1. Regex Scan
    for rule in VULN_RULES:
        # Regex search poore code mein
        matches = re.finditer(rule['pattern'], code, re.MULTILINE)
        for match in matches:
            # Line number nikalna
            char_index = match.start()
            line_no = code[:char_index].count('\n') + 1
            snippet = lines[line_no-1].strip()
            
            # Agar duplicate line ho to skip karein
            if any(r['line'] == line_no and r['vuln_id'] == rule['id'] for r in results):
                continue

            results.append({
                "vuln_id": rule['id'],
                "name": rule['name'],
                "severity": rule['severity'],
                "line": line_no,
                "snippet": snippet,
                # New Fields added to result
                "explanation": rule['explanation'],
                "consequence": rule['consequence'],
                "patch": rule['patch']
            })
            
    # 2. Risk Score Calculation
    score = 100
    for res in results:
        if res['severity'] == "High":
            score -= 20
        elif res['severity'] == "Medium":
            score -= 10
        else:
            score -= 5
            
    final_score = max(0, score)
    
    return {
        "status": "Vulnerable" if results else "Secure",
        "risk_score": final_score,
        "issues": results
    }