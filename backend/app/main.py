from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from sqlalchemy import text
from app.core.config import settings
from app.core.database import AsyncSessionLocal, engine, Base
from app.core.seed import seed_roles
from app.api.v1 import masters, analysis, resume, job, auth  

from app.models import user, masters as master_models

@asynccontextmanager
async def lifespan(app: FastAPI):
    async with engine.begin() as conn:
        # Ensure pgvector extension exists before creating tables
        await conn.execute(text("CREATE EXTENSION IF NOT EXISTS vector"))
        
        # Create tables
        await conn.run_sync(Base.metadata.create_all)
    
    # Seed data (will skip if already exists)
    async with AsyncSessionLocal() as session:
        await seed_roles(session)
        
    yield
    
    # Cleanup
    await engine.dispose()

app = FastAPI(
    title=settings.APP_NAME, 
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api/v1/auth", tags=["Auth"])
app.include_router(masters.router, prefix="/api/v1/masters", tags=["Masters"])
app.include_router(analysis.router, prefix="/api/v1/analysis", tags=["Analysis"])
app.include_router(resume.router, prefix="/api/v1/resumes", tags=["Resumes"])
app.include_router(job.router, prefix="/api/v1/jobs", tags=["Jobs"])

@app.get("/health")
def health_check():
    return {"status": "ok", "app": settings.APP_NAME}