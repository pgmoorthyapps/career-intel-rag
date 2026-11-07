from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.models.resume import Resume, ResumeChunk
from app.services.rag_service import RAGService
from app.ai.embeddings import EmbeddingClient
import io
import asyncpg
from pypdf import PdfReader
from app.core.config import settings
from sqlalchemy.future import select
from sqlalchemy import delete
from app.api.deps import get_current_user
from app.models.user import User

router = APIRouter()

@router.post("/upload")
async def upload_resume(
    file: UploadFile = File(...), 
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if not file.filename.endswith(('.pdf', '.txt')):
        raise HTTPException(status_code=400, detail="Only PDF and TXT files are supported")

    content = ""
    try:
        file_bytes = await file.read()
        if file.filename.endswith('.pdf'):
            pdf = PdfReader(io.BytesIO(file_bytes))
            for page in pdf.pages:
                content += page.extract_text() + "\n"
        else:
            content = file_bytes.decode("utf-8")
            
        if not content.strip():
            raise HTTPException(status_code=400, detail="Could not extract text from file")

        # Create main resume record with created_by
        resume = Resume(
            filename=file.filename, 
            content=content,
            created_by=current_user.id
        )
        db.add(resume)
        await db.commit()
        await db.refresh(resume)
        
        # Generate overall embedding
        overall_embedding = await EmbeddingClient.get_embedding(content[:5000])
        emb_str = str(overall_embedding[:768])
        
        # Update using direct asyncpg connection
        db_url = settings.DATABASE_URL.replace("postgresql+asyncpg://", "postgresql://").replace("?ssl=require", "")
        conn = await asyncpg.connect(db_url, ssl='require')
        try:
            await conn.execute(
                "UPDATE resumes SET embedding = $1::vector WHERE id = $2",
                emb_str, resume.id
            )
        finally:
            await conn.close()
        
        # Chunk and store for RAG
        await RAGService.process_and_store_resume(db, resume.id, content)
        
        return {"status": "success", "resume_id": resume.id, "message": "Resume processed successfully"}
        
    except Exception as e:
        print(f"Upload Error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/")
async def get_all_resumes(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Filter by current_user.id
    result = await db.execute(
        select(Resume)
        .filter(Resume.created_by == current_user.id)
        .order_by(Resume.id.desc())
    )
    resumes = result.scalars().all()
    
    return [
        {
            "id": r.id,
            "filename": r.filename,
            "created_at": r.created_at
        }
        for r in resumes
    ]

@router.delete("/{resume_id}")
async def delete_resume(
    resume_id: int, 
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Check ownership
    resume_result = await db.execute(
        select(Resume).filter(Resume.id == resume_id, Resume.created_by == current_user.id)
    )
    if not resume_result.scalars().first():
        raise HTTPException(status_code=403, detail="Not authorized to delete this resume")

    # Delete chunks first
    await db.execute(delete(ResumeChunk).where(ResumeChunk.resume_id == resume_id))
    # Delete main resume
    await db.execute(delete(Resume).where(Resume.id == resume_id))
    await db.commit()
        
    return {"status": "success", "message": "Resume deleted"}