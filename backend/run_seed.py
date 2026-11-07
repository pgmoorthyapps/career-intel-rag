import asyncio
import logging
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import AsyncSessionLocal
from app.models.user import Role
from sqlalchemy.future import select
from sqlalchemy import func

# Setup logging to see output in terminal
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def seed_roles(db: AsyncSession):
    from app.core.config import settings
    print("Current DB URL:", settings.DATABASE_URL)
    result = await db.execute(select(func.count()).select_from(Role))
    role_count = result.scalar()

    if role_count > 0:
        logger.info("Roles already exist. Skipping seed.")
        return

    logger.info("Seeding default roles...")
    default_roles = [
        {"id": 1, "name": "user", "description": "Job Seeker / Candidate", "permission_level": 1},
        {"id": 2, "name": "employer", "description": "Company / Employer", "permission_level": 2},
        {"id": 3, "name": "admin", "description": "System Administrator", "permission_level": 3},
    ]

    for role_data in default_roles:
        new_role = Role(
            id=role_data["id"],
            name=role_data["name"],
            description=role_data["description"],
            permission_level=role_data["permission_level"],
            created_by=1
        )
        db.add(new_role)
    
    await db.commit()
    logger.info("Roles seeded successfully.")

async def main():
    logger.info("Connecting to database...")
    try:
        async with AsyncSessionLocal() as session:
            await seed_roles(session)
    except Exception as e:
        logger.error(f"Error during seeding: {e}")

if __name__ == "__main__":
    asyncio.run(main())