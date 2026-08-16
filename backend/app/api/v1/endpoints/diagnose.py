from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from typing import Optional
from app.schemas.diagnostic import VisualInspectionResult, AudioInspectionResult
from app.services.audio_ast import audio_service
from app.services.vision_vlm import vision_service

router = APIRouter()

@router.post("/audio", response_model=AudioInspectionResult)
async def diagnose_audio(
    audio: UploadFile = File(..., description="Audio recording blob (webm, mp4, wav, etc.)"),
    context: str = Form("idling", description="Acoustic context hint ('idling' or 'revving')"),
    preset_fault: Optional[str] = Form(None, description="Optional preset acoustic condition for testing")
):
    """
    POST /api/v1/diagnose/audio
    Accepts: multipart/form-data (audio file + context string like 'idling').
    Returns: JSON with top 3 predicted conditions, confidence scores, severity color, spectrogram metrics, and walk condition flag.
    """
    try:
        audio_bytes = await audio.read()
        if len(audio_bytes) == 0:
            raise HTTPException(status_code=400, detail="Empty audio payload received.")
        
        result = audio_service.diagnose_audio(
            audio_bytes=audio_bytes,
            context_hint=context,
            preset_fault=preset_fault
        )
        return result
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Audio acoustic inference error: {str(e)}")

@router.post("/vision", response_model=VisualInspectionResult)
async def diagnose_vision(
    image: UploadFile = File(..., description="Component photograph"),
    component_key: str = Form(..., description="Station component ID, e.g., 's2_timing_cover', 's1_dipstick'"),
    car_context: str = Form("2015 Toyota Highlander V6", description="Vehicle profile context"),
    preset_condition: Optional[str] = Form(None, description="Optional preset condition for test simulation")
):
    """
    POST /api/v1/diagnose/vision
    Accepts: multipart/form-data (image file + component ID, e.g. s2_timing_cover).
    Returns: Structured JSON strictly conforming to the Pydantic VisualInspectionResult schema.
    """
    try:
        image_bytes = await image.read()
        if len(image_bytes) == 0:
            raise HTTPException(status_code=400, detail="Empty image payload received.")
        
        result = vision_service.diagnose_image(
            image_bytes=image_bytes,
            component_key=component_key,
            car_context=car_context,
            preset_condition=preset_condition
        )
        return result
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Vision VLM inference error: {str(e)}")
