from fastapi import FastAPI, Depends
from sqlalchemy.orm import Session
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import models
from database import engine, get_db
import json
import os
import re
import random
import subprocess
import tempfile
import shutil
from web3 import Web3 
import google.generativeai as genai
from dotenv import load_dotenv
from datetime import datetime, timezone

load_dotenv()
models.Base.metadata.create_all(bind=engine)

# --- CONFIGURATION ---
GENAI_KEY = os.getenv("GEMINI_API_KEY")
RPC_URL = "http://127.0.0.1:8545" 
PRIVATE_KEY = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"

if GENAI_KEY:
    genai.configure(api_key=GENAI_KEY)
    model = genai.GenerativeModel('gemini-1.5-flash')

app = FastAPI(title="SolShield Pro")
app.add_middleware(
    CORSMiddleware, allow_origins=["*"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"]
)

class ContractRequest(BaseModel):
    project_name: str = "Default Project"
    filename: str
    code: str
    language: str = "English"

# --- 🛠️ HELPER: FIND COMPILER ---
def setup_solc_env(code):
    try:
        ver_match = re.search(r'pragma solidity \^?(\d+\.\d+\.\d+)', code)
        version = ver_match.group(1) if ver_match else "0.8.0"
        
        # Windows Path Fix
        if not shutil.which("solc"):
            subprocess.run(f"solc-select install {version}", shell=True, stdout=subprocess.DEVNULL)
            subprocess.run(f"solc-select use {version}", shell=True, stdout=subprocess.DEVNULL)
    except: pass

# --- 🔥 SCAN ENGINE (Slither + Regex + DoS Check) ---
def run_analysis_engine(code_content):
    vulnerabilities = []
    
    # 1. Setup Env
    setup_solc_env(code_content)

    # 2. Try Slither
    with tempfile.NamedTemporaryFile(delete=False, suffix=".sol", mode='w', encoding='utf-8') as temp_file:
        temp_file.write(code_content)
        temp_path = temp_file.name

    try:
        print(f"🔍 Running Slither on {temp_path}...")
        result = subprocess.run(
            f"slither {temp_path} --json - --solc-disable-solc-warnings", 
            shell=True, capture_output=True, text=True, encoding='utf-8'
        )

        if result.stdout and "{" in result.stdout:
            try:
                json_data = json.loads(result.stdout[result.stdout.find("{"):])
                if "results" in json_data and "detectors" in json_data["results"]:
                    for bug in json_data["results"]["detectors"]:
                        vulnerabilities.append({
                            "title": bug.get("check", "Security Issue"),
                            "severity": bug.get("impact", "Medium"),
                            "description": bug.get("description", "Detected by Slither"),
                            "remediation": "Check logic manually."
                        })
            except: pass
    except: pass
    finally:
        if os.path.exists(temp_path): os.unlink(temp_path)

    # --- 3. SAFETY NET (Agar Slither Miss Kar Jaye) ---
    # Hum yahan wo bugs pakrain gay jo Slither miss karta hai (Logic Bugs)
    
    if not vulnerabilities:
        print("⚠️ Running Advanced Safety Net...")
        
        # --- CHECK 1: DoS (Denial of Service) - Unbounded Loop ---
        # Logic: Agar loop mein '.length' use ho raha hai array par -> Risk hai
        if re.search(r'for\s*\(.*\.length', code_content):
            vulnerabilities.append({
                "title": "Denial of Service (DoS) Risk",
                "severity": "High",
                "description": "Unbounded loop detected over an array. If the array grows too large, the transaction will run out of gas and fail permanently.",
                "remediation": "Use a 'Pull Payment' pattern instead of pushing funds in a loop. Or limit the loop size."
            })

        # --- CHECK 2: Owner Hijack ---
        if "owner =" in code_content and "require" not in code_content:
            vulnerabilities.append({
                "title": "Critical: Broken Access Control",
                "severity": "Critical",
                "description": "Ownership can be changed by anyone without restriction.",
                "remediation": "Add 'require(msg.sender == owner);'."
            })
            
        # --- CHECK 3: Replay ---
        if "ecrecover" in code_content and "nonce" not in code_content:
            vulnerabilities.append({
                "title": "Signature Replay Attack",
                "severity": "Critical",
                "description": "Signature used without nonce.",
                "remediation": "Add a nonce mapping."
            })
            
        # --- CHECK 4: Phishing ---
        if "tx.origin" in code_content:
            vulnerabilities.append({
                "title": "Phishing Risk (tx.origin)",
                "severity": "High",
                "description": "tx.origin is unsafe for auth.",
                "remediation": "Use msg.sender."
            })

    return vulnerabilities

# --- 🧠 AI POLISHER (ChatGPT Style Explanation) ---
def ai_enhance_report(vulnerabilities, code):
    if not model or not vulnerabilities: return vulnerabilities
    
    try:
        # Hum AI ko Code + Bugs bhejain gay ta ke wo context samajh sakay
        prompt = f"""
        Analyze this Solidity code and the findings below.
        Code:
        {code[:1000]}... (truncated)

        Findings:
        {json.dumps(vulnerabilities)}

        Task:
        1. Rewrite 'description' to be simple and explain the IMPACT (like: "Attackers can steal funds...").
        2. Provide a specific 'remediation' code snippet based on the user's code.
        3. Return JSON: {{ "vulnerabilities": [...] }}
        """
        response = model.generate_content(prompt)
        match = re.search(r'\{.*\}', response.text, re.DOTALL)
        if match:
            ai_bugs = json.loads(match.group(0)).get("vulnerabilities", [])
            for i, v in enumerate(ai_bugs):
                if i < len(vulnerabilities): vulnerabilities[i].update(v)
    except Exception as e:
        print(f"AI Polish Failed: {e}")
        
    return vulnerabilities

# --- 🧮 SCORE ---
def calculate_real_score(vulnerabilities):
    if not vulnerabilities: return 100, "Secure Contract"
    deductions = 0
    for vuln in vulnerabilities:
        s = vuln.get("severity", "Low").lower()
        if "critical" in s: deductions += 40
        elif "high" in s: deductions += 25
        elif "medium" in s: deductions += 15
        else: deductions += 5
    return max(0, 100 - deductions), "Issues Found"

# --- 🛠️ BLOCKCHAIN ---
def send_real_transaction(filename, score, report):
    try:
        web3 = Web3(Web3.HTTPProvider(RPC_URL))
        if not web3.is_connected(): return {"status": "Error", "tx_hash": "0xError", "salt": 0}
        
        account = web3.eth.account.from_key(PRIVATE_KEY)
        nonce_salt = random.randint(100000, 999999)
        data_payload = f"AUDIT:{filename}|SCORE:{score}|SALT:{nonce_salt}"
        data_hex = web3.to_hex(text=data_payload)
        
        tx = { 'nonce': web3.eth.get_transaction_count(account.address), 'to': account.address, 'value': 0, 'gas': 600000, 'gasPrice': web3.to_wei('2', 'gwei'), 'data': data_hex }
        signed_tx = web3.eth.account.sign_transaction(tx, PRIVATE_KEY)
        tx_hash = web3.eth.send_raw_transaction(signed_tx.raw_transaction)
        
        return { "tx_hash": tx_hash.hex(), "salt": nonce_salt, "status": "Verified on Foundry Anvil" }
    except: return { "tx_hash": "0x" + os.urandom(32).hex(), "salt": random.randint(100000, 999999), "status": "Simulated (Error)" }

# --- ROUTES ---
@app.post("/deep-audit")
def deep_audit_contract(request: ContractRequest, db: Session = Depends(get_db)):
    # 1. Scan (Slither + DoS Check)
    final_vulnerabilities = run_analysis_engine(request.code)
    
    # 2. AI Polish (Explains like ChatGPT)
    final_vulnerabilities = ai_enhance_report(final_vulnerabilities, request.code)

    # 3. Score & Blockchain
    real_score, summary = calculate_real_score(final_vulnerabilities)
    blockchain_receipt = send_real_transaction(request.filename, real_score, final_vulnerabilities)
    
    final_report = { "risk_score": real_score, "audit_summary": summary, "vulnerabilities": final_vulnerabilities }

    try:
        project = db.query(models.Project).filter(models.Project.name == request.project_name).first()
        if not project:
            project = models.Project(name=request.project_name)
            db.add(project)
            db.commit()
        db_contract = models.SmartContract(project_id=project.id, filename=request.filename, source_code=request.code, analysis_result=json.dumps(final_report), risk_score=real_score, scanned_at=datetime.now(timezone.utc))
        db.add(db_contract)
        db.commit()
    except: pass

    return { "status": "Success", "ai_result": final_report, "blockchain_status": blockchain_receipt }

@app.get("/history")
def get_history(db: Session = Depends(get_db)):
    try:
        history = db.query(models.SmartContract).order_by(models.SmartContract.scanned_at.desc()).limit(15).all()
        return [{"id": h.id, "filename": h.filename, "risk_score": h.risk_score, "date": h.scanned_at.strftime("%Y-%m-%d %H:%M"), "result": json.loads(h.analysis_result)} for h in history]
    except: return []