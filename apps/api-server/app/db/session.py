"""数据库引擎与会话管理模块。"""

from app.core.config import settings
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

engine = create_engine(settings.DB_URL, future=True)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db():
    """获取数据库会话，用于 FastAPI 依赖注入。"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    """初始化数据库，创建所有表。"""
    # attempt to import models to ensure metadata is registered
    try:
        from app.models import Base

        Base.metadata.create_all(bind=engine)
    except (ImportError, AttributeError):
        # if no models defined yet, ignore
        pass
