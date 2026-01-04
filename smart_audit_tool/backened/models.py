from sqlalchemy import Column, Integer, String, Text, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from database import Base
import datetime

# 1. Projects Table (Point 3: Full Project Context)
# Ye table puray project ka record rakhay ga (e.g., "DeFi Wallet V1")
class Project(Base):
    __tablename__ = "projects"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow) # Point 5: History start time
    
    # Rishta: Aik Project mein multiple Contracts ho sakty hain
    contracts = relationship("SmartContract", back_populates="project")

# 2. Smart Contracts Table (Point 5: Audit History)
# Ye har file aur uskay scan result ko save karay ga
class SmartContract(Base):
    __tablename__ = "smart_contracts"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id")) # Link to Project
    
    filename = Column(String)
    source_code = Column(Text)
    
    # Scan Results
    risk_score = Column(Integer)
    analysis_result = Column(Text) # JSON stored as Text
    
    # Audit History (Point 5: Kab scan hua?)
    scanned_at = Column(DateTime, default=datetime.datetime.utcnow)

    # Rishta: Ye contract kis project ka hissa hai?
    project = relationship("Project", back_populates="contracts")