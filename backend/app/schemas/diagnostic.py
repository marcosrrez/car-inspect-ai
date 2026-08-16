from pydantic import BaseModel, Field
from typing import Literal, Optional, List, Dict, Any

class VisualInspectionResult(BaseModel):
    component_analyzed: str = Field(description="The part of the car being analyzed, e.g., 'Timing Cover'")
    finding_category: str = Field(description="The category from the rubric or 'Error'")
    points: int = Field(description="The score assigned based on the rubric. E.g., 3, -2, or -5")
    is_walk_condition: bool = Field(description="True ONLY if the condition is a deal-breaker (e.g., Milkshake oil)")
    explanation: str = Field(description="A brief 1-sentence explanation of what is visible in the photo.")
    negotiation_tip: Optional[str] = Field(default=None, description="If points are negative, what should the buyer say to the seller?")
    confidence: float = Field(default=0.92, description="Confidence score between 0.0 and 1.0")
    detected_features: List[str] = Field(default_factory=list, description="Visual markers detected in the image")
    suggested_action: Optional[str] = Field(default=None, description="Next step or inspection recommendation")

class AudioConditionCandidate(BaseModel):
    condition: str = Field(description="Name of detected acoustic condition, e.g., 'Rod Knock', 'Healthy Engine Idle'")
    confidence: float = Field(description="Confidence probability 0.0 - 1.0")
    severity: Literal["normal", "warning", "critical"] = Field(description="Severity classification")
    description: str = Field(description="Technical summary of what this acoustic frequency pattern indicates")
    is_walk_condition: bool = Field(default=False, description="True if fatal engine mechanical fault")

class SpectrogramSummary(BaseModel):
    time_frames: int = 0
    mel_bands: int = 128
    dominant_frequency_hz: float = 0.0
    spectral_centroid_hz: float = 0.0
    harmonic_ratio: float = 0.0
    transient_impact_level: str = "low"
    energy_levels: List[float] = Field(default_factory=list, description="16-band normalized energy profile for visualizer")

class AudioInspectionResult(BaseModel):
    component_analyzed: str = Field(default="Engine Acoustics", description="E.g., 'Cold Idle Acoustics' or 'Rev & Decel Acoustics'")
    primary_condition: str = Field(description="Top detected acoustic condition")
    top_conditions: List[AudioConditionCandidate] = Field(description="Top 3 predicted conditions with confidence scores")
    confidence: float = Field(description="Confidence of the top prediction")
    severity_color: Literal["green", "yellow", "red"] = Field(description="Severity color for UI")
    points: int = Field(description="Score assigned (+3, -2, -10)")
    is_walk_condition: bool = Field(description="True if deal-breaker fault detected")
    explanation: str = Field(description="Acoustic analysis explanation")
    negotiation_tip: Optional[str] = Field(default=None, description="What to say to the seller if faults detected")
    spectrogram: SpectrogramSummary = Field(default_factory=SpectrogramSummary)

class VehicleProfile(BaseModel):
    year: int = Field(default=2015, description="Model year")
    make: str = Field(default="Toyota", description="Vehicle make")
    model: str = Field(default="Highlander", description="Vehicle model")
    trim: Optional[str] = Field(default="V6 Limited AWD", description="Vehicle trim/engine")
    mileage: Optional[int] = Field(default=115000, description="Odometer mileage")
    asking_price: Optional[float] = Field(default=16500.0, description="Listed asking price in USD")
    vin: Optional[str] = Field(default="", description="17-character VIN")

class StationItemResult(BaseModel):
    item_id: str
    station_id: str
    component_name: str
    status: Literal["uninspected", "pending", "inspected", "error"] = "uninspected"
    finding_category: Optional[str] = None
    points: int = 0
    is_walk_condition: bool = False
    explanation: Optional[str] = None
    negotiation_tip: Optional[str] = None
    confidence: Optional[float] = None
    media_type: Optional[Literal["image", "audio"]] = None
    media_url: Optional[str] = None
    audio_conditions: Optional[List[AudioConditionCandidate]] = None

class OverallReportSummary(BaseModel):
    total_score: int
    max_possible_score: int
    health_percentage: int
    grade: str # A+, A, B, C, D, F (WALK AWAY)
    verdict: Literal["EXCELLENT BUY", "FAIR / NEGOTIATE", "MAJOR RISK", "WALK AWAY - DEAL BREAKER"]
    walk_conditions_count: int
    walk_condition_reasons: List[str]
    total_estimated_repairs_usd: float
    recommended_offer_usd: float
    dealer_negotiation_script: List[Dict[str, Any]]
    completed_items_count: int
    total_items_count: int = 20
    vehicle: VehicleProfile
