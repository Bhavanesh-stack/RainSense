from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from datetime import datetime


# ─── Auth Models ───────────────────────────────────────────────

class UserRegister(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    email: str = Field(..., min_length=5, max_length=100)
    password: str = Field(..., min_length=6, max_length=100)
    confirm_password: str = Field(..., min_length=6, max_length=100)


class UserLogin(BaseModel):
    email: str
    password: str


class UserResponse(BaseModel):
    id: str
    name: str
    email: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


# ─── Location Models ──────────────────────────────────────────

class Location(BaseModel):
    city: str = Field(..., min_length=1, max_length=100)
    state: str = Field(default="", max_length=100)
    country: str = Field(default="India", max_length=100)


# ─── Roof Models ──────────────────────────────────────────────

class RoofInfo(BaseModel):
    area_m2: float = Field(..., gt=0, le=100000)
    material: str = Field(..., pattern="^(RCC / Concrete|Metal|Tile|Other)$")
    roof_type: str = Field(..., pattern="^(Flat|Sloped|Unknown)$")
    floors: int = Field(default=1, ge=1, le=100)
    existing_rwh: str = Field(default="Unknown", pattern="^(Yes|No|Unknown)$")


# ─── AI Analysis Models ──────────────────────────────────────

class DetectedObject(BaseModel):
    label: str
    confidence: float
    bbox: Optional[List[float]] = None


class AIAnalysis(BaseModel):
    roof_detected: bool
    obstacles: List[DetectedObject] = []
    confidence: float
    analysis_mode: str  # "ai" or "demo"
    model_info: str = ""


# ─── Rainfall Models ─────────────────────────────────────────

class RainfallData(BaseModel):
    annual_mm: float
    monthly_mm: List[float] = []
    source: str  # "live_api", "cached", "user_provided", "demo"
    location_used: str = ""


# ─── Calculation Models ──────────────────────────────────────

class WaterCalculation(BaseModel):
    runoff_coefficient: float
    harvestable_litres: float
    harvestable_m3: float
    monthly_harvest_litres: List[float] = []
    effective_area_m2: float


# ─── Score Models ─────────────────────────────────────────────

class ScoreBreakdown(BaseModel):
    roof_area: float
    rainfall: float
    roof_material: float
    roof_condition: float
    obstacles: float


class ReadinessScore(BaseModel):
    total: float
    category: str  # "Highly Suitable", "Moderately Suitable", "Low Suitability"
    breakdown: ScoreBreakdown
    explanation: dict


# ─── Recommendation Models ────────────────────────────────────

class ComponentRecommendation(BaseModel):
    name: str
    description: str
    estimated_cost: float
    priority: str  # "essential", "recommended", "optional"


class Recommendations(BaseModel):
    storage_litres: float
    storage_description: str
    components: List[ComponentRecommendation]
    total_estimated_cost: float
    annual_savings: float
    payback_years: Optional[float] = None
    payback_description: str


# ─── Assessment Models ────────────────────────────────────────

class AssessmentRequest(BaseModel):
    location: Location
    roof: RoofInfo


class AssessmentResponse(BaseModel):
    id: str
    user_id: str
    location: Location
    roof: RoofInfo
    ai_analysis: AIAnalysis
    rainfall: RainfallData
    calculation: WaterCalculation
    score: ReadinessScore
    recommendations: Recommendations
    image_filename: Optional[str] = None
    created_at: str
    demo_mode: bool = False


class AssessmentSummary(BaseModel):
    id: str
    location: Location
    roof_area_m2: float
    harvestable_litres: float
    score_total: float
    score_category: str
    created_at: str
    demo_mode: bool = False


class DashboardStats(BaseModel):
    total_assessments: int
    average_score: float
    total_water_potential: float
    latest_assessment: Optional[AssessmentSummary] = None
    recent_assessments: List[AssessmentSummary] = []
