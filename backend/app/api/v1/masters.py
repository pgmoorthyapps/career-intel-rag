from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.models import masters
from app.repositories.base import BaseRepository
from app.schemas.base import MasterCreateSchema, MasterUpdateSchema, MasterResponseSchema
from app.models.user import Role

router = APIRouter()

TABLE_MAPPING = {
    "roles": Role,
    "job-modes": masters.JobMode,
    "job-types": masters.JobType,
    "experience-levels": masters.ExperienceLevel,
    "industries": masters.Industry,
}

def get_repo(table_name: str):
    model = TABLE_MAPPING.get(table_name)
    if not model:
        raise HTTPException(status_code=404, detail=f"Table '{table_name}' not found")
    return BaseRepository(model)

@router.get("/{table_name}", response_model=list[MasterResponseSchema])
async def get_all(
    table_name: str, 
    skip: int = 0, 
    limit: int = 100, 
    search: str = None, 
    db: AsyncSession = Depends(get_db)
):
    repo = get_repo(table_name)
    return await repo.get_all(db, skip=skip, limit=limit, search=search)

@router.post("/{table_name}", response_model=MasterResponseSchema)
async def create(
    table_name: str, 
    obj_in: MasterCreateSchema, 
    db: AsyncSession = Depends(get_db)
):
    repo = get_repo(table_name)
    return await repo.create(db, obj_in)

@router.put("/{table_name}/{id}", response_model=MasterResponseSchema)
async def update(
    table_name: str, 
    id: int, 
    obj_in: MasterUpdateSchema, 
    db: AsyncSession = Depends(get_db)
):
    repo = get_repo(table_name)
    db_obj = await repo.get(db, id)
    if not db_obj:
        raise HTTPException(status_code=404, detail="Record not found")
    return await repo.update(db, db_obj, obj_in)

@router.delete("/{table_name}/{id}")
async def delete(
    table_name: str, 
    id: int, 
    db: AsyncSession = Depends(get_db)
):
    repo = get_repo(table_name)
    await repo.delete(db, id)
    return {"status": "success", "message": "Deleted successfully"}