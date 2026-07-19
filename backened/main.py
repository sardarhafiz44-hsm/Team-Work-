from fastapi import FastAPI, Depends, HTTPException, status
from sqlalchemy.orm import Session
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
import models
from database import engine, get_db
import os
import random
import google.generativeai as genai
from dotenv import load_dotenv

# Internal Core Security Module Mappings
import audit_engine_fallback  # Switched tightly to our optimized fallback engine pass
import scoring_engine
import Auto_healer
import history_database

# --- INITIALIZATION & ENVIRONMENT CONFIGURATION ---
load_dotenv()
models.Base.metadata.create_all(bind=engine)

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)
    generation_config = {
        "temperature": 0.1,  # Enforcing deterministic output vectors matching senior audit rules
        "top_p": 0.95,
        "top_k": 64,
        "max_output_tokens": 8192,
    }
    model = genai.GenerativeModel(
        model_name="gemini-1.5-flash",
        generation_config=generation_config
    )
else:
    model = None

app = FastAPI(
    title="SolShield Pro Enterprise Security Core",
    description="Automated Hybrid Vulnerability Assessment Engine Framework.",
    version="1.1.0"
)

# Robust CORS Setup - Allow internal UI Sandbox handshakes without drops
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- PYDANTIC STRUCTURAL LAYOUT SCHEMAS ---
class ContractRequest(BaseModel):
    project_name: str = Field(default="Deep Audit", example="DeFi Token")
    filename: str = Field(..., example="Token.sol")
    code: str = Field(..., example="contract Token { ... }")
    language: str = Field(default="English")

class HealRequest(BaseModel):
    code: str = Field(...)
    issue_title: str = Field(...)
    issue_description: str = Field(...)

# --- ORCHESTRATED ROUTE HANDLERS ---

@app.post("/scan", status_code=status.HTTP_200_OK)
@app.post("/deep-audit", status_code=status.HTTP_200_OK)
async def perform_audit(request: ContractRequest):
    if not model:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE, 
            detail="Gemini AI Engine components are uninitialized. Check local configuration environment."
        )
    
    try:
        # Step 1: Run the Hybrid Layer 1 SAST + AI Fallback Architecture Sweep
        vulns = await audit_engine_fallback.run_analysis_engine(request.code, model)
        
        # Step 2: Compute Exponential Multipliers CVSS Risk Scoring Schema
        score_payload = scoring_engine.calculate_risk_score(vulns)
        
        # Step 3: Compute Mock Ledger Verification Properties
        tx_hash = f"0x{random.randbytes(32).hex()}"
        
        # Step 4: Secure Relational Commit Tracking without positional leaks
        history_database.save_audit(
            filename=request.filename,
            score_payload=score_payload,
            vulns=vulns,
            target_hash=tx_hash,
            project_name=request.project_name
        )

        return {
            "status": "Success",
            "ai_result": {
                "risk_score": score_payload,  # Returns the comprehensive dynamic object matrix mapping
                "vulnerabilities": vulns
            },
            "blockchain_status": {
                "tx_hash": tx_hash, 
                "salt": random.randint(100000, 999999)
            }
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, 
            detail=f"Automated Pipeline Execution Interrupted: {str(e)}"
        )

@app.get("/history")
def get_audit_history():
    try:
        return history_database.get_history()
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database Access Failure Stream Trace: {str(e)}"
        )

@app.post("/auto-heal")
async def auto_heal_contract(request: HealRequest):
    if not model:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE, 
            detail="AI Remediation core uninitialized."
        )
    try:
        return await Auto_healer.generate_auto_heal(
            model, request.issue_title, request.issue_description, request.code
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Auto-Heal Core Internal Failure: {str(e)}"
        )