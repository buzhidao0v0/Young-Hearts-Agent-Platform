"""应用全局配置模块。"""

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """应用全局配置，从环境变量或 .env 文件加载。"""

    APP_NAME: str = "心青年智能体平台 - Backend"
    DB_URL: str = "sqlite:///./dev.db"
    VECTOR_STORE: str = "chroma"

    SECRET_KEY: str = "dev-secret-change-me"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

    SESSION_COOKIE_NAME: str = "session_id"
    SESSION_COOKIE_HTTPONLY: bool = True
    SESSION_COOKIE_SECURE: bool = False
    SESSION_EXPIRE_MINUTES: int = 60 * 24

    CORS_ORIGINS: str = "http://localhost:5173,http://10.15.9.148:5173"

    REDIS_URL: str = "redis://localhost:6379/0"

    DOUBAO_API_KEY: str = ""
    DOUBAO_BASE_URL: str = ""

    CELERY_BROKER_URL: str = "redis://localhost:6379/1"
    CELERY_RESULT_BACKEND: str = "redis://localhost:6379/2"

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")


settings = Settings()
