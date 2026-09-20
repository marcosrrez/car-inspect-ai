import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.v1.api import api_router

app = FastAPI(
    title="Car Pre-Purchase Inspection & Diagnostic AI API",
    description="Asynchronous Python backend orchestrating Audio Spectrogram Transformer (AST) acoustic fault detection and Multimodal Vision Language Model (VLM) inspection checklists.",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS: restrict to configured origins in production. Set CORS_ALLOW_ORIGINS to a
# comma-separated list of allowed origins (e.g. "https://app.example.com").
# Defaults to "*" for local development. Credentials are only enabled when a
# specific origin allow-list is provided (browsers reject "*" + credentials).
_origins_env = os.environ.get("CORS_ALLOW_ORIGINS", "*").strip()
_allow_origins = [o.strip() for o in _origins_env.split(",") if o.strip()] or ["*"]
_allow_credentials = _allow_origins != ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=_allow_origins,
    allow_credentials=_allow_credentials,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix="/api/v1")

@app.get("/")
async def root():
    return {
        "service": "AI Car Pre-Purchase Inspection API",
        "status": "online",
        "version": "1.0.0",
        "endpoints": {
            "audio_ast": "/api/v1/diagnose/audio",
            "vision_vlm": "/api/v1/diagnose/vision",
            "reports": "/api/v1/reports/generate",
            "docs": "/docs"
        }
    }

@app.get("/health")
async def health():
    return {"status": "healthy"}
