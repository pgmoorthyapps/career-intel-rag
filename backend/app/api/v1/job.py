from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.models.job import JobDescription, JobChunk
from app.models.masters import JobMode, JobType, ExperienceLevel
from app.services.rag_service import RAGService
from app.ai.embeddings import EmbeddingClient
import asyncpg
from app.core.config import settings
from typing import Optional
from sqlalchemy.future import select
from sqlalchemy import delete
from app.api.deps import get_current_user
from app.models.user import User
    
router = APIRouter()

class JobUpload(BaseModel):
    title: str
    company: str
    content: str
    job_mode_id: Optional[int] = None
    job_type_id: Optional[int] = None
    experience_level_id: Optional[int] = None

@router.post("/upload")
async def upload_job(
    data: JobUpload, 
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    job = JobDescription(
        title=data.title, 
        company=data.company, 
        content=data.content,
        job_mode_id=data.job_mode_id,
        job_type_id=data.job_type_id,
        experience_level_id=data.experience_level_id,
        created_by=current_user.id
    )
    db.add(job)
    await db.commit()
    await db.refresh(job)
    
    overall_embedding = await EmbeddingClient.get_embedding(data.content[:5000])
    emb_str = str(overall_embedding[:768])
    
    db_url = settings.DATABASE_URL.replace("postgresql+asyncpg://", "postgresql://").replace("?ssl=require", "")
    conn = await asyncpg.connect(db_url, ssl='require')
    try:
        await conn.execute(
            "UPDATE job_descriptions SET embedding = $1::vector WHERE id = $2",
            emb_str, job.id
        )
    finally:
        await conn.close()
    
    await db.commit()
    await RAGService.process_and_store_job(db, job.id, data.content)
    
    return {"status": "success", "job_id": job.id, "message": "Job processed successfully"}

@router.get("/")
async def get_all_jobs(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = select(JobDescription).order_by(JobDescription.id.desc())
    
    if current_user.role_id == 2:
        query = query.filter(JobDescription.created_by == current_user.id)
        
    result = await db.execute(query)
    jobs = result.scalars().all()
    
    if not jobs:
        return []
        
    modes_res = await db.execute(select(JobMode))
    types_res = await db.execute(select(JobType))
    levels_res = await db.execute(select(ExperienceLevel))
    
    modes = {m.id: m.name for m in modes_res.scalars().all()}
    types = {t.id: t.name for t in types_res.scalars().all()}
    levels = {l.id: l.name for l in levels_res.scalars().all()}
    
    formatted_jobs = []
    for job in jobs:
        formatted_jobs.append({
            "id": job.id,
            "title": job.title,
            "company": job.company,
            "content": job.content,
            "job_mode": {"name": modes.get(job.job_mode_id, "Remote")} if job.job_mode_id else {"name": "Remote"},
            "job_type": {"name": types.get(job.job_type_id, "Full-time")} if job.job_type_id else {"name": "Full-time"},
            "experience_level": {"name": levels.get(job.experience_level_id, "Mid Level")} if job.experience_level_id else {"name": "Mid Level"},
        })
        
    return formatted_jobs

@router.delete("/{job_id}")
async def delete_job(
    job_id: int, 
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    job_result = await db.execute(
        select(JobDescription).filter(JobDescription.id == job_id, JobDescription.created_by == current_user.id)
    )
    if not job_result.scalars().first():
        raise HTTPException(status_code=403, detail="Not authorized to delete this job")
   
    await db.execute(delete(JobChunk).where(JobChunk.job_id == job_id))
    await db.execute(delete(JobDescription).where(JobDescription.id == job_id))
    await db.commit()
        
    return {"status": "success", "message": "Job deleted"}


@router.get("/{job_id}")
async def get_job_by_id(job_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(JobDescription).filter(JobDescription.id == job_id))
    job = result.scalars().first()
    
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
        
    mode = await db.execute(select(JobMode).filter(JobMode.id == job.job_mode_id))
    job_type = await db.execute(select(JobType).filter(JobType.id == job.job_type_id))
    level = await db.execute(select(ExperienceLevel).filter(ExperienceLevel.id == job.experience_level_id))
    
    return {
        "id": job.id,
        "title": job.title,
        "company": job.company,
        "content": job.content,
        "job_mode": {"name": mode.scalars().first().name if job.job_mode_id else "Remote"},
        "job_type": {"name": job_type.scalars().first().name if job.job_type_id else "Full-time"},
        "experience_level": {"name": level.scalars().first().name if job.experience_level_id else "Mid Level"},
    }