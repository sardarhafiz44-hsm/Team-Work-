from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy.orm import Session
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from pydantic import BaseModel
import models, analyzer
from database import engine, get_db
import json
import os
import re
import google.generativeai as genai
from dotenv import load_dotenv

# --- SAFETY TYPES ---
from google.generativeai.types import HarmCategory, HarmBlockThreshold

load_dotenv()

# --- DATABASE CREATION ---
models.Base.metadata.create_all(bind=engine)

# --- GEMINI SETUP (SAFETY BYPASS) ---
GENAI_KEY = os.getenv("GEMINI_API_KEY")

generation_config = {
    "temperature": 0.0,
    "top_p": 1,
    "top_k": 1,
    "max_output_tokens": 4096,
    "response_mime_type": "application/json"
}

safety_settings = {
    HarmCategory.HARM_CATEGORY_HARASSMENT: HarmBlockThreshold.BLOCK_NONE,
    HarmCategory.HARM_CATEGORY_HATE_SPEECH: HarmBlockThreshold.BLOCK_NONE,
    HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT: HarmBlockThreshold.BLOCK_NONE,
    HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT: HarmBlockThreshold.BLOCK_NONE,
}

if GENAI_KEY:
    genai.configure(api_key=GENAI_KEY)
    model = genai.GenerativeModel(
        model_name='gemini-flash-latest',
        generation_config=generation_config,
        safety_settings=safety_settings 
    )
else:
    model = None

# --- APP SETUP ---
app = FastAPI(title="SolShield AI API", version="3.9.0")

# --- SECURITY ---
origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:5173",
    "http://127.0.0.1:5173"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.add_middleware(TrustedHostMiddleware, allowed_hosts=["localhost", "127.0.0.1"])

# --- DATA MODELS ---
class ContractRequest(BaseModel):
    project_name: str = "Default Project" 
    filename: str
    code: str
    language: str = "English"

# --- ROUTES ---

@app.get("/")
def read_root():
    return {"Message": "SolShield AI with History is Active!"}

# Route 1: Quick Scan
@app.post("/scan")
def scan_contract(request: ContractRequest, db: Session = Depends(get_db)):
    project = db.query(models.Project).filter(models.Project.name == request.project_name).first()
    if not project:
        project = models.Project(name=request.project_name)
        db.add(project)
        db.commit()
        db.refresh(project)

    analysis_report = analyzer.analyze_contract_text(request.code)
    
    db_contract = models.SmartContract(
        project_id=project.id,
        filename=request.filename,
        source_code=request.code,
        analysis_result=json.dumps(analysis_report),
        risk_score=analysis_report['risk_score']
    )
    db.add(db_contract)
    db.commit()
    db.refresh(db_contract)
    
    return {"message": "Quick Scan Complete", "data": analysis_report}

# Route 2: Deep Audit
@app.post("/deep-audit")
def deep_audit_contract(request: ContractRequest):
    prompt = f"""
    CONTEXT: EDUCATIONAL SECURITY ANALYSIS.
    Act as a Defensive Security Researcher.
    
    TARGET LANGUAGE: {request.language}
    (Translate analysis to {request.language}).

    Code to Analyze:
    {request.code}

    Identify:
    1. Critical Security Flaws
    2. Logic Errors
    3. Gas Optimizations

    RETURN RAW JSON ONLY. NO MARKDOWN.
    Structure:
    {{
        "audit_summary": "Summary in {request.language}.",
        "risk_score": 50,
        "vulnerabilities": [
            {{
                "title": "Bug Title (English)",
                "severity": "Critical/High/Medium/Low",
                "affected_lines": [1], 
                "line_number": 1,
                "description": "Desc in {request.language}.",
                "impact": "Impact in {request.language}.",
                "remediation": "Fix in {request.language}.",
                "fixed_code_snippet": "Code"
            }}
        ],
        "attack_vectors": [], 
        "gas_improvements": []
    }}
    """

    try:
        if model:
            response = model.generate_content(prompt)
            
            if not response.parts:
                 return {
                    "status": "Success",
                    "ai_result": {
                        "audit_summary": "AI Safety Filter triggered.",
                        "risk_score": 50,
                        "vulnerabilities": [],
                        "gas_improvements": []
                    }
                 }
            
            ai_text = response.text
            
            try:
                ai_json = json.loads(ai_text)
            except json.JSONDecodeError:
                match = re.search(r'\{.*\}', ai_text, re.DOTALL)
                if match:
                    ai_json = json.loads(match.group(0))
                else:
                    raise ValueError("AI Output Parsing Failed.")
            
            return {"status": "Success", "ai_result": ai_json}
        else:
            return {"status": "Error", "details": "Gemini API Key missing."}

    except Exception as e:
        return {"status": "Error", "details": str(e)}

# --- NEW ROUTE: HISTORY ---
@app.get("/history")
def get_history(db: Session = Depends(get_db)):
    # Pichlay 10 scans lay kar aao (Newest first)
    history = db.query(models.SmartContract).order_by(models.SmartContract.scanned_at.desc()).limit(10).all()
    
    # Data ko safayi se bhejo
    cleaned_history = []
    for h in history:
        try:
            # Result JSON string hai, usay wapis Object banao
            parsed_result = json.loads(h.analysis_result)
        except:
            parsed_result = {}

        cleaned_history.append({
            "id": h.id,
            "filename": h.filename,
            "risk_score": h.risk_score,
            "date": h.scanned_at.strftime("%Y-%m-%d %H:%M"),
            "result": parsed_result # Poora result ta k wapis open ho sakay
        })
    
    return cleaned_history