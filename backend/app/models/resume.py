from sqlalchemy import Column, Integer, String, Text
from pgvector.sqlalchemy import Vector
from app.models.base import BaseModel

class Resume(BaseModel):
    __tablename__ = "resumes"
    
    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String(255), nullable=True)
    content = Column(Text, nullable=False)
    embedding = Column(Vector(768))

class ResumeChunk(BaseModel):
    __tablename__ = "resume_chunks"
    
    id = Column(Integer, primary_key=True, index=True)
    resume_id = Column(Integer, index=True, nullable=False)
    content = Column(Text, nullable=False)
    embedding = Column(Vector(768))