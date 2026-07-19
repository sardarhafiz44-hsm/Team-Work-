import json
from sqlalchemy.orm import Session
from database import SessionLocal
import models

def save_audit(filename: str, score_payload: dict, vulns: list, target_hash: str, project_name: str = "Default Project"):
    """
    Saves the absolute structural scan history directly inside the relational SQL engine.
    Completely eliminates local audit_history.json runtime file dependency.
    """
    db: Session = SessionLocal()
    try:
        # Step 1: Ensure the relational parent project tracking block context exists
        project = db.query(models.Project).filter(models.Project.name == project_name).first()
        if not project:
            project = models.Project(name=project_name)
            db.add(project)
            db.commit()
            db.refresh(project)

        # Step 2: Extract metric points from the newly refactored scoring payload matrix
        score = score_payload.get("security_score", 100.0)
        tier = score_payload.get("risk_tier", "Low Risk")

        # Step 3: Bundle up absolute payloads data into stringified text structures
        record = models.SmartContract(
            project_id=project.id,
            filename=filename,
            source_code="// Source content cataloged natively in static analyzer engine stream",
            risk_score=float(score),
            risk_tier=str(tier),
            analysis_result=json.dumps(vulns),
            target_hash=target_hash
        )
        
        db.add(record)
        db.commit()
    except Exception as e:
        db.rollback()
        raise RuntimeError(f"Database Integrity Engine execution commit block failed: {str(e)}")
    finally:
        db.close()

def get_history() -> list:
    """
    Fetches comprehensive enterprise logs history array sorted by latest scanned records.
    """
    db: Session = SessionLocal()
    try:
        contracts = db.query(models.SmartContract).order_with(models.SmartContract.scanned_at.desc()).all()
        history_payload = []
        
        for c in contracts:
            history_payload.append({
                "id": c.id,
                "project_id": c.project_id,
                "date": c.scanned_at.strftime("%Y-%m-%d %H:%M"),
                "filename": c.filename,
                "risk_score": c.risk_score,
                "risk_tier": c.risk_tier,
                "target_hash": c.target_hash,
                "result": {"vulnerabilities": json.loads(c.analysis_result)}
            })
        return history_payload
    except Exception:
        return []
    finally:
        db.close()