import os
from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field, AliasChoices

class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), ".env"),
        env_file_encoding="utf-8",
        extra="ignore"
    )

    # Server
    PORT: int = 8000
    ENVIRONMENT: str = "development"
    CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://localhost:3000",
        "https://prakriti-ai-eta.vercel.app",
        "https://darukaa-earth-ai.vercel.app"
    ]

    # API Abuse Controls & Quotas
    RATE_LIMIT_ANONYMOUS_PER_MINUTE: int = Field(default=5, description="Requests per minute for unauthenticated queries")
    RATE_LIMIT_AUTHENTICATED_PER_MINUTE: int = Field(default=20, description="Requests per minute per verified user_id")
    MAX_QUERY_CHAR_LENGTH: int = Field(default=1000, description="Max character length for user questions")
    MAX_UPLOAD_SIZE_MB: int = Field(default=25, description="Max upload size in MB")
    MAX_UPLOAD_PAGES: int = Field(default=100, description="Max pages for uploaded PDFs")
    MAX_DOCUMENTS_PER_USER: int = Field(default=10, description="Max private documents stored per user")

    # Qdrant Vector DB
    QDRANT_URL: str = Field(default="http://localhost:6333", description="Qdrant Cloud or local cluster URL")
    QDRANT_API_KEY: str = Field(default="", description="Qdrant API Key")
    QDRANT_COLLECTION_NAME: str = "darukaa_knowledge"
    QDRANT_DENSE_MODEL: str = "sentence-transformers/all-MiniLM-L6-v2"
    QDRANT_SPARSE_MODEL: str = "Qdrant/bm25"
    DENSE_VECTOR_SIZE: int = 384

    # LLM Providers — 3-Tier Fallback Chain
    GEMINI_API_KEY: str = Field(default="", description="Google AI Studio Gemini API Key")
    LLM_PRIMARY_MODEL: str = "gemini-3.5-flash-lite"      # Primary low-latency model
    LLM_SECONDARY_MODEL: str = "gemini-3.1-flash-lite"         # Active secondary tier
    LLM_TERTIARY_MODEL: str = "gemini-3.6-flash"          # Resilient fallback tier
    GROQ_API_KEY: str = Field(default="", description="Optional Groq fallback API key")
    GROQ_MODEL: str = "llama-3.3-70b-versatile"

    # Supabase Auth, Postgres & Storage
    SUPABASE_URL: str = Field(default="https://example.supabase.co", description="Supabase Project URL")
    SUPABASE_ANON_KEY: str = Field(default="", description="Supabase Anon/Public Key")
    SUPABASE_SERVICE_ROLE_KEY: str = Field(default="", description="Supabase Service Role Key (Backend only)")
    SUPABASE_JWT_SECRET: str = Field(
        default="",
        validation_alias=AliasChoices("SUPABASE_JWT_SECRET", "SUPABASE_JWT_KEY"),
        description="Supabase HS256 JWT Secret or Key"
    )

    # Langfuse Observability & Tracing
    LANGFUSE_PUBLIC_KEY: str = Field(default="", description="Langfuse Project Public Key")
    LANGFUSE_SECRET_KEY: str = Field(default="", description="Langfuse Project Secret Key")
    LANGFUSE_BASE_URL: str = Field(
        default="https://cloud.langfuse.com",
        validation_alias=AliasChoices("LANGFUSE_BASE_URL", "LANGFUSE_HOST"),
        description="Langfuse Host / Base URL"
    )

settings = Settings()
