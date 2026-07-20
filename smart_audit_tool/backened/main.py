from fastapi import FastAPI, Depends, HTTPException, status
from sqlalchemy.orm import Session
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
import models
from database import engine, get_db
import os
import random
from groq import Groq
from dotenv import load_dotenv

import audit_engine_fallback
import scoring_engine
import Auto_healer
import history_database
import gas_analyzer
import compliance_checker
import deployment_service
import ai_attack_simulator

load_dotenv()
models.Base.metadata.create_all(bind=engine)

GROQ_API_KEY = os.getenv("GROQ_API_KEY")

if GROQ_API_KEY:
    groq_client = Groq(api_key=GROQ_API_KEY)
else:
    groq_client = None

app = FastAPI(
    title="SolShield Pro Enterprise Security Core",
    description="AI-Powered Smart Contract Auditing Platform with Multi-Agent Architecture",
    version="3.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ContractRequest(BaseModel):
    project_name: str = Field(default="Deep Audit")
    filename: str = Field(...)
    code: str = Field(...)
    language: str = Field(default="English")

class HealRequest(BaseModel):
    code: str = Field(...)
    issue_title: str = Field(...)
    issue_description: str = Field(...)

@app.post("/scan", status_code=status.HTTP_200_OK)
@app.post("/deep-audit", status_code=status.HTTP_200_OK)
async def perform_audit(request: ContractRequest):
    if not groq_client:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Groq AI Engine uninitialized. Check GROQ_API_KEY in .env"
        )

    try:
        # Layer 1: Slither SAST + Groq AI Analysis
        vulns = await audit_engine_fallback.run_analysis_engine(request.code, groq_client)
        
        # Layer 2: Scoring
        score_payload = scoring_engine.calculate_risk_score(vulns)
        
        # Layer 4: Gas Optimization Analysis
        gas_analysis = gas_analyzer.analyze_gas_optimization(request.code)
        gas_viz = gas_analyzer.get_gas_visualization(gas_analysis)
        
        # Layer 5: ERC Compliance Check
        compliance = compliance_checker.check_erc_compliance(request.code)
        compliance_viz = compliance_checker.get_compliance_visualization(compliance)
        
        # Layer 6: AI-Powered Attack Simulation (REAL AI GENERATION!)
        ai_attack_data = await ai_attack_simulator.generate_attack_simulation(vulns, request.code, groq_client)
        ai_attacks_display = ai_attack_simulator.format_attack_for_display(ai_attack_data)
        
        # Layer 7: Deployment Simulation
        gas_estimate = deployment_service.estimate_deployment_gas(request.code)
        deployment_sim = deployment_service.simulate_deployment(request.code, vulns)
        deployment_viz = deployment_service.get_deployment_visualization(deployment_sim)
        
        # Save to database
        tx_hash = f"0x{random.randbytes(32).hex()}"
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
                "risk_score": score_payload,
                "vulnerabilities": vulns,
                "ai_attack_simulation": ai_attack_data,
                "ai_attacks_display": ai_attacks_display,
                "gas_analysis": gas_analysis,
                "gas_visualization": gas_viz,
                "compliance": compliance,
                "compliance_visualization": compliance_viz,
                "deployment_estimate": gas_estimate,
                "deployment_simulation": deployment_sim,
                "deployment_visualization": deployment_viz
            },
            "blockchain_status": {
                "tx_hash": tx_hash,
                "salt": random.randint(100000, 999999)
            }
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Pipeline Error: {str(e)}"
        )

@app.get("/history")
def get_audit_history():
    try:
        return history_database.get_history()
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database Error: {str(e)}"
        )

@app.post("/auto-heal")
async def auto_heal_contract(request: HealRequest):
    if not groq_client:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="AI Remediation core uninitialized."
        )
    try:
        return await Auto_healer.generate_auto_heal(
            groq_client, request.issue_title, request.issue_description, request.code
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Auto-Heal Error: {str(e)}"
        )

@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "agents": {
            "slither": "active",
            "groq_ai": "active" if groq_client else "inactive",
            "attack_simulator": "active",
            "gas_analyzer": "active",
            "compliance_checker": "active"
        },
        "version": "3.0.0"
    }
