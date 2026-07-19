from sqlalchemy import Column, Integer, String, Text, ForeignKey, DateTime, Float
from sqlalchemy.orm import relationship
from database import Base
import datetime

class Project(Base):
    __tablename__ = "projects"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True, nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    # Relationships: One project can hold multiple contract analysis sweeps
    contracts = relationship("SmartContract", back_populates="project", cascade="all, delete-orphan")


class SmartContract(Base):
    __tablename__ = "smart_contracts"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id", ondelete="CASCADE"))
    
    filename = Column(String, nullable=False)
    source_code = Column(Text, nullable=False)
    
    # Upgraded to Float to map perfectly with the new CVSS Scoring metrics parameters
    risk_score = Column(Float, nullable=False)
    risk_tier = Column(String, nullable=False)
    
    # Deep logs structural payload (JSON stored safely as Text dump string block)
    analysis_result = Column(Text, nullable=False) 
    target_hash = Column(String, unique=True, index=True)
    
    scanned_at = Column(DateTime, default=datetime.datetime.utcnow)

    # Relationships
    project = relationship("Project", back_populates="contracts")