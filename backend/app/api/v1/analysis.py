from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.core.database import get_db
from app.models.resume import Resume
from app.models.job import JobDescription
from app.services.rag_service import RAGService
from app.ai.llm_client import LLMClient
from app.schemas.analysis import MatchAnalysisResponse, MatchRequest, ChatRequest, ChatResponse
from app.api.deps import get_current_user
from app.models.user import User
from app.models.masters import JobMode, JobType, ExperienceLevel

router = APIRouter()

@router.post("/match", response_model=MatchAnalysisResponse)
async def match_resume_to_job(
    request: MatchRequest, 
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    resume_result = await db.execute(
        select(Resume).filter(
            Resume.id == request.resume_id, 
            Resume.created_by == current_user.id
        )
    )
    resume = resume_result.scalars().first()
    
    job_result = await db.execute(
        select(JobDescription).filter(JobDescription.id == request.job_id)
    )
    job = job_result.scalars().first()

    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found or you don't have access")
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    relevant_resume_context = await RAGService.get_relevant_resume_chunks(
        db, resume_id=resume.id, job_text=job.content
    )

    result = await LLMClient.analyze_resume_vs_jd(
        resume_text=relevant_resume_context,
        job_description=job.content
    )
    
    return result


@router.post("/chat", response_model=ChatResponse)
async def chat_with_job(
    request: ChatRequest, 
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    resume_result = await db.execute(
        select(Resume).filter(
            Resume.id == request.resume_id, 
            Resume.created_by == current_user.id
        )
    )
    resume = resume_result.scalars().first()
    
    job_result = await db.execute(
        select(JobDescription).filter(JobDescription.id == request.job_id)
    )
    job = job_result.scalars().first()

    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found or you don't have access")
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    # Fetch Job Details (Mode, Type, Level)
    mode = await db.execute(select(JobMode).filter(JobMode.id == job.job_mode_id))
    job_type = await db.execute(select(JobType).filter(JobType.id == job.job_type_id))
    level = await db.execute(select(ExperienceLevel).filter(ExperienceLevel.id == job.experience_level_id))
    
    mode_name = mode.scalars().first().name if job.job_mode_id else "Remote"
    type_name = job_type.scalars().first().name if job.job_type_id else "Full-time"
    level_name = level.scalars().first().name if job.experience_level_id else "Mid Level"

    # Create a detailed Job Context
    job_context = f"""
    Title: {job.title}
    Company: {job.company}
    Mode: {mode_name}
    Type: {type_name}
    Experience Level: {level_name}
    
    Description:
    {job.content}
    """

    relevant_context = await RAGService.get_relevant_resume_chunks(
        db, resume_id=resume.id, job_text=request.question
    )
    
    full_resume_summary = resume.content[:3000]
    combined_context = f"--- RELEVANT CHUNKS ---\n{relevant_context}\n\n--- OVERALL RESUME SUMMARY ---\n{full_resume_summary}"

    answer = await LLMClient.chat_with_context(
        resume_context=combined_context,
        job_description=job_context,
        question=request.question
    )
    
    return {"answer": answer}