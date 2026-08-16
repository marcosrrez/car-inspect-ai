from fastapi import APIRouter
from app.api.v1.endpoints import diagnose, reports, samples

api_router = APIRouter()
api_router.include_router(diagnose.router, prefix="/diagnose", tags=["Diagnostic Inference"])
api_router.include_router(reports.router, prefix="/reports", tags=["Inspection Reports"])
api_router.include_router(samples.router, prefix="/samples", tags=["Test Samples"])
