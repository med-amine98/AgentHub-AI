import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    DATABASE_URL: str = os.getenv("DATABASE_URL", "mysql+pymysql://agenthub_user:agenthub_password@localhost:3306/agenthub")
    JWT_SECRET: str = os.getenv("JWT_SECRET", "supersecretjwtkeyforagenthubai2026")
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "120"))

    class Config:
        case_sensitive = True

settings = Settings()
