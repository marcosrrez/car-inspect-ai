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

# Enable CORS for local Next.js frontend and mobile web clients
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
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
            "samples": "/api/v1/samples/list",
            "docs": "/docs"
        }
    }

@app.get("/health")
async def health():
    return {"status": "healthy"}
