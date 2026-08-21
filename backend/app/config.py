import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    DATABASE_URL: str = os.getenv("DATABASE_URL", "mysql+pymysql://agenthub_user:agenthub_password@localhost:3306/agenthub")
    JWT_SECRET: str = os.getenv("JWT_SECRET", "supersecretjwtkeyforagenthubai2026")
    JWT_ALGORITHM: str = os.getenv("JWT_ALGORITHM", "HS256")
   
   

    class Config:
        case_sensitive = True

settings = Settings()
