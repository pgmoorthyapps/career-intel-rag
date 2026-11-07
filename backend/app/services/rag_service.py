from sqlalchemy.ext.asyncio import AsyncSession
from app.models.resume import ResumeChunk
from app.models.job import JobChunk
from app.ai.embeddings import EmbeddingClient
import asyncpg
from app.core.config import settings

class RAGService:
    @staticmethod
    def chunk_text(text_content: str, chunk_size: int = 500, overlap: int = 50) -> list[str]:
        chunks = []
        start = 0
        while start < len(text_content):
            end = start + chunk_size
            chunks.append(text_content[start:end])
            start = end - overlap
        return chunks

    @staticmethod
    async def _get_raw_conn():
        db_url = settings.DATABASE_URL.replace("postgresql+asyncpg://", "postgresql://").replace("?ssl=require", "")
        return await asyncpg.connect(db_url, ssl='require')

    @staticmethod
    async def process_and_store_resume(db: AsyncSession, resume_id: int, text_content: str):
        chunks = RAGService.chunk_text(text_content)
        
        conn = await RAGService._get_raw_conn()
        try:
            for chunk in chunks:
                if not chunk.strip():
                    continue
                
                embedding = await EmbeddingClient.get_embedding(chunk)
                emb_str = str(embedding[:768])
                
                await conn.execute(
                    "INSERT INTO resume_chunks (resume_id, content, embedding, created_by, is_active, created_at) VALUES ($1, $2, $3::vector, 1, true, NOW())",
                    resume_id, chunk, emb_str
                )
        finally:
            await conn.close()
        
        await db.commit()

    @staticmethod
    async def process_and_store_job(db: AsyncSession, job_id: int, text_content: str):
        chunks = RAGService.chunk_text(text_content)
        
        conn = await RAGService._get_raw_conn()
        try:
            for chunk in chunks:
                if not chunk.strip():
                    continue
                    
                embedding = await EmbeddingClient.get_embedding(chunk)
                emb_str = str(embedding[:768])
                
                await conn.execute(
                    "INSERT INTO job_chunks (job_id, content, embedding, created_by, is_active, created_at) VALUES ($1, $2, $3::vector, 1, true, NOW())",
                    job_id, chunk, emb_str
                )
        finally:
            await conn.close()
            
        await db.commit()

    @staticmethod
    async def get_relevant_resume_chunks(db: AsyncSession, resume_id: int, job_text: str, limit: int = 3) -> str:
        job_embedding = await EmbeddingClient.get_embedding(job_text)
        job_emb_str = str(job_embedding[:768])
        
        conn = await RAGService._get_raw_conn()
        try:
            rows = await conn.fetch(
                "SELECT content FROM resume_chunks WHERE resume_id = $1 AND deleted_at IS NULL ORDER BY embedding <=> $2::vector LIMIT $3",
                resume_id, job_emb_str, limit
            )
        finally:
            await conn.close()
        
        return "\n\n".join([row['content'] for row in rows])