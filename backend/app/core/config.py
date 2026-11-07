from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    APP_NAME: str = "Career Intelligence RAG"
    ENVIRONMENT: str = "development"
    
    # Database
    DATABASE_URL: str = "postgresql+asyncpg://postgres:moorthy@localhost:5433/career_intel_db"
    
    # AI Keys
    GROQ_API_KEY: str = ""
    GEMINI_API_KEY: str = ""
    
    # JWT
    JWT_SECRET: str = "super_secret_key_change_me"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

settings = Settings()