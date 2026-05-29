from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from py_config.settings import settings

engine = create_engine(settings.DB_URL, future=True)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    try:
        Base.metadata.create_all(bind=engine)
    except Exception:
        pass
