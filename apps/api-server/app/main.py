from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.db.session import init_db
from app.api.v1.routes import auth as auth_router
from app.utils_openapi import generate_openapi_json


@asynccontextmanager
async def lifespan(app: FastAPI):
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

app.include_router(auth_router.router, prefix="/api/auth", tags=["auth"])


@app.get("/health")
def health():
    return {"status": "ok"}
