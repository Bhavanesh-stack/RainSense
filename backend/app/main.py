"""RainSense AI — FastAPI Application Entry Point."""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from contextlib import asynccontextmanager
import os

from app.config import settings
from app.database import connect_db, close_db
from app.routes import auth_router, assessment_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application startup and shutdown."""
    # Startup
    print("─" * 50)
    print("  RainSense AI — Starting up")
    print("─" * 50)
    await connect_db()

    # Ensure upload directory exists
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)

    if settings.DEMO_MODE:
        print("⚠ Running in DEMO MODE — results are illustrative")
    print("─" * 50)

    yield

    # Shutdown
    await close_db()
    print("RainSense AI — Shut down complete")


app = FastAPI(
    title="RainSense AI",
    description="AI-Based Rooftop Rainwater Harvesting Assessment System",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        settings.FRONTEND_URL,
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_origin_regex=r"^https?://(localhost|127\.0\.0\.1)(:\d+)?$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Static files for uploaded images
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=settings.UPLOAD_DIR), name="uploads")

# Routes
app.include_router(auth_router)
app.include_router(assessment_router)


@app.get("/")
async def root():
    return {
        "name": "RainSense AI",
        "version": "1.0.0",
        "status": "running",
        "demo_mode": settings.DEMO_MODE,
    }


@app.get("/api/health")
async def health():
    from app.database import get_db
    db = get_db()
    return {
        "status": "healthy",
        "database": "connected" if db is not None else "disconnected",
        "demo_mode": settings.DEMO_MODE,
    }
