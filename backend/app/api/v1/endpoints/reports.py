from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List
from app.schemas.diagnostic import StationItemResult, OverallReportSummary, VehicleProfile
from app.services.report_generator import generate_inspection_report

router = APIRouter()

class ReportGenerationPayload(BaseModel):
    items: List[StationItemResult]
    vehicle: VehicleProfile

@router.post("/generate", response_model=OverallReportSummary)
async def generate_report(payload: ReportGenerationPayload):
    """
    POST /api/v1/reports/generate
    Generates dynamic scorecard, repair cost tally, walk-condition flags, and negotiation scripts.
    """
    try:
        report = generate_inspection_report(payload.items, payload.vehicle)
        return report
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Report generation error: {str(e)}")
