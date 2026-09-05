import os
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field

class Settings(BaseSettings):
    ENVIRONMENT: str = 'development'
    PORT: int = 8000
    DATABASE_URL: str = 'sqlite+aiosqlite:///./data/revenue_agent.db'
    
    # LLM Settings
    LLM_PROVIDER: str = 'fallback' # gemini, openai, fallback
    GEMINI_API_KEY: str | None = None
    OPENAI_API_KEY: str | None = None
    
    # Razorpay Settings
    RAZORPAY_KEY_ID: str | None = None
    RAZORPAY_KEY_SECRET: str | None = None
    RAZORPAY_WEBHOOK_SECRET: str | None = None
    
    # Security / Auth Settings
    JWT_SECRET: str = 'apexgrowth_secure_auth_secret_key_2026_razorpay_buildathon'
    EXTRA_ALLOWED_ORIGINS: str | None = None

    # Policy Hard Defaults
    MAX_DISCOUNT_PERCENT: float = Field(default=20.0, description='Max allowed discount percentage')
    MAX_CAMPAIGN_AUDIENCE: int = Field(default=500, description='Max customers targeted in a single campaign')
    MAX_BUDGET_INR: float = Field(default=50000.0, description='Max financial incentive budget cap in INR')
    COOLDOWN_DAYS_PER_CUSTOMER: int = Field(default=14, description='Days between discount offers to same customer')
    
    model_config = SettingsConfigDict(
        env_file='.env',
        env_file_encoding='utf-8',
        extra='ignore'
    )

settings = Settings()
