from fastapi import APIRouter, Response, HTTPException
from app.services.sample_data import SAMPLE_PRESETS, generate_sample_audio_wav, generate_sample_image_png

router = APIRouter()

@router.get("/list")
async def get_sample_presets():
    """Returns catalog of test audio presets and visual scenarios."""
    return SAMPLE_PRESETS

@router.get("/audio/{preset_id}")
async def get_sample_audio(preset_id: str):
    """Returns downloadable/playable WAV test audio stream."""
    preset = next((p for p in SAMPLE_PRESETS["audio"] if p["id"] == preset_id), None)
    if not preset:
        raise HTTPException(status_code=404, detail="Audio preset not found.")
    
    audio_bytes = generate_sample_audio_wav(preset["condition"])
    return Response(content=audio_bytes, media_type="audio/wav", headers={
        "Content-Disposition": f'inline; filename="{preset_id}.wav"'
    })

@router.get("/image/{preset_id}")
async def get_sample_image(preset_id: str):
    """Returns PNG test inspection image."""
    preset = next((p for p in SAMPLE_PRESETS["vision"] if p["id"] == preset_id), None)
    if not preset:
        raise HTTPException(status_code=404, detail="Vision preset not found.")
    
    img_bytes = generate_sample_image_png(preset["component_key"], preset["scenario"])
    return Response(content=img_bytes, media_type="image/png", headers={
        "Content-Disposition": f'inline; filename="{preset_id}.png"'
    })
