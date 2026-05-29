from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.db.session import init_db
from app.api.v1.routes import auth as auth_router
from app.utils_openapi import generate_openapi_json


@asynccontextmanager
async def lifespan(app: FastAPI):
    try:
        from py_logger import configure_logging
        configure_logging()
    except ImportError:
        import logging
        logging.basicConfig(level=logging.INFO)
        logging.warning("py-logger 不可用，降级为标准 logging")
    init_db()
    generate_openapi_json(app, output_path="openapi.json")
    yield


app = FastAPI(title=settings.APP_NAME, lifespan=lifespan)

cors_origins = [origin.strip() for origin in settings.CORS_ORIGINS.split(",") if origin.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

try:
    from py_logger.middlewares.fastapi_middleware import RequestLoggingMiddleware
    app.add_middleware(RequestLoggingMiddleware)
except ImportError:
    pass

app.include_router(auth_router.router, prefix="/api/auth", tags=["auth"])


@app.get("/health")
def health():
    return {"status": "ok"}
