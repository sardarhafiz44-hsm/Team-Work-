from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os
from dotenv import load_dotenv

# Secret file (.env) ko load karna
load_dotenv()

# Database ka link uthana
SQLALCHEMY_DATABASE_URL = os.getenv("DATABASE_URL")

# Engine start karna (Gari ka engine start karny jaisa)
engine = create_engine(SQLALCHEMY_DATABASE_URL)

# Session bnana (Communication channel)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base model (Is bunyad par sary tables banain gy)
Base = declarative_base()

# Dependency (Ye function har baar database khol kar band kary ga - Safety k liye)
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()