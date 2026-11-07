from sqlalchemy import Column, Integer, String, Text, ForeignKey
from pgvector.sqlalchemy import Vector
from app.models.base import BaseModel

class JobDescription(BaseModel):
    __tablename__ = "job_descriptions"
    
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=True)
    company = Column(String(255), nullable=True)
    content = Column(Text, nullable=False)

    job_mode_id = Column(Integer, ForeignKey("job_modes.id"), nullable=True)
    job_type_id = Column(Integer, ForeignKey("job_types.id"), nullable=True)
    experience_level_id = Column(Integer, ForeignKey("experience_levels.id"), nullable=True)


    
    embedding = Column(Vector(768))

class JobChunk(BaseModel):
    __tablename__ = "job_chunks"
    
    id = Column(Integer, primary_key=True, index=True)
    job_id = Column(Integer, index=True, nullable=False)
    content = Column(Text, nullable=False)
    embedding = Column(Vector(768))