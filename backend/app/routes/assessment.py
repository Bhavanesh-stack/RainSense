"""Assessment and analysis routes — the core workflow."""

import os
import uuid
import json
from datetime import datetime
from fastapi import APIRouter, HTTPException, UploadFile, File, Form, Depends, status
from fastapi.responses import StreamingResponse
from bson import ObjectId
from app.config import settings
from app.utils.auth import get_current_user
from app.database import get_db
from app.services.image_processing import ImageProcessor
from app.services.yolo_service import get_roof_analyzer
from app.services.weather_service import get_weather_service
from app.services.rainwater_calculator import get_calculator
from app.services.scoring_service import get_scorer
from app.services.recommendation_service import get_recommendation_engine
from app.services.report_service import generate_pdf_report
from app.models.schemas import (
    Location, RoofInfo, AssessmentResponse, AssessmentSummary, DashboardStats
)

router = APIRouter(prefix="/api", tags=["Assessments"])


@router.post("/analyze", response_model=AssessmentResponse)
async def analyze_rooftop(
    image: UploadFile = File(...),
    location_json: str = Form(...),
    roof_json: str = Form(...),
    user: dict = Depends(get_current_user),
):
    """
    Run the full analysis pipeline:
    1. Validate & preprocess image
    2. AI rooftop analysis (YOLO)
    3. Fetch rainfall data
    4. Calculate harvestable water
    5. Score readiness
    6. Generate recommendations
    7. Save to database
    """
    # ── Parse form data ───────────────────────────────────
    try:
        location = Location(**json.loads(location_json))
        roof = RoofInfo(**json.loads(roof_json))
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid form data: {str(e)}",
        )

    # ── Validate image ────────────────────────────────────
    file_bytes = await image.read()
    if not file_bytes:
        raise HTTPException(status_code=400, detail="Image is required.")

    max_bytes = settings.MAX_FILE_SIZE_MB * 1024 * 1024
    if len(file_bytes) > max_bytes:
        raise HTTPException(
            status_code=400,
            detail=f"Image exceeds maximum size of {settings.MAX_FILE_SIZE_MB}MB.",
        )

    validation = ImageProcessor.validate_image(file_bytes, image.filename or "image.jpg")
    if not validation["valid"]:
        raise HTTPException(status_code=400, detail=validation["error"])

    # ── Preprocess image ──────────────────────────────────
    try:
        processed_img = ImageProcessor.preprocess(file_bytes)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Unable to process rooftop image: {str(e)}")

    # ── Save original image ───────────────────────────────
    upload_dir = settings.UPLOAD_DIR
    os.makedirs(upload_dir, exist_ok=True)
    ext = (image.filename or "image.jpg").rsplit(".", 1)[-1]
    image_filename = f"{uuid.uuid4().hex}.{ext}"
    image_path = os.path.join(upload_dir, image_filename)
    with open(image_path, "wb") as f:
        f.write(file_bytes)

    # ── AI Analysis ───────────────────────────────────────
    analyzer = get_roof_analyzer()
    ai_analysis = analyzer.analyze(processed_img)

    # ── Rainfall Data ─────────────────────────────────────
    weather = get_weather_service()
    rainfall = await weather.get_rainfall(location.city, location.state, location.country)

    # ── Calculate obstacle reduction ──────────────────────
    obstacle_reduction = min(len(ai_analysis.obstacles) * 0.03, 0.15)

    # ── Rainwater Calculation ─────────────────────────────
    calculator = get_calculator()
    calculation = calculator.calculate(
        roof_area_m2=roof.area_m2,
        rainfall=rainfall,
        roof_material=roof.material,
        obstacle_reduction=obstacle_reduction,
    )

    # ── Readiness Score ───────────────────────────────────
    scorer = get_scorer()
    score = scorer.calculate_score(
        roof_area_m2=roof.area_m2,
        roof_material=roof.material,
        roof_type=roof.roof_type,
        existing_rwh=roof.existing_rwh,
        ai_analysis=ai_analysis,
        rainfall=rainfall,
        calculation=calculation,
    )

    # ── Recommendations ───────────────────────────────────
    rec_engine = get_recommendation_engine()
    recommendations = rec_engine.generate(
        calculation=calculation,
        rainfall=rainfall,
        roof_area_m2=roof.area_m2,
        roof_type=roof.roof_type,
        existing_rwh=roof.existing_rwh,
    )

    # ── Build assessment document ─────────────────────────
    now = datetime.utcnow().isoformat()
    assessment_doc = {
        "user_id": user["user_id"],
        "location": location.model_dump(),
        "roof": roof.model_dump(),
        "ai_analysis": ai_analysis.model_dump(),
        "rainfall": rainfall.model_dump(),
        "calculation": calculation.model_dump(),
        "score": score.model_dump(),
        "recommendations": recommendations.model_dump(),
        "image_filename": image_filename,
        "created_at": now,
        "demo_mode": settings.DEMO_MODE or ai_analysis.analysis_mode == "demo",
    }

    # ── Save to DB ────────────────────────────────────────
    db = get_db()
    assessment_id = ""
    if db is not None:
        result = await db.assessments.insert_one(assessment_doc)
        assessment_id = str(result.inserted_id)
    else:
        assessment_id = uuid.uuid4().hex

    return AssessmentResponse(
        id=assessment_id,
        **{k: v for k, v in assessment_doc.items() if k != "_id"},
    )


@router.get("/assessments", response_model=list[AssessmentSummary])
async def get_assessments(user: dict = Depends(get_current_user)):
    """Get all assessments for the current user."""
    db = get_db()
    if db is None:
        return []

    cursor = db.assessments.find(
        {"user_id": user["user_id"]}
    ).sort("created_at", -1).limit(50)

    assessments = []
    async for doc in cursor:
        assessments.append(AssessmentSummary(
            id=str(doc["_id"]),
            location=Location(**doc["location"]),
            roof_area_m2=doc["roof"]["area_m2"],
            harvestable_litres=doc["calculation"]["harvestable_litres"],
            score_total=doc["score"]["total"],
            score_category=doc["score"]["category"],
            created_at=doc["created_at"],
            demo_mode=doc.get("demo_mode", False),
        ))
    return assessments


@router.get("/assessments/{assessment_id}", response_model=AssessmentResponse)
async def get_assessment(assessment_id: str, user: dict = Depends(get_current_user)):
    """Get a specific assessment by ID."""
    db = get_db()
    if db is None:
        raise HTTPException(status_code=404, detail="Assessment not found")

    try:
        doc = await db.assessments.find_one({
            "_id": ObjectId(assessment_id),
            "user_id": user["user_id"],
        })
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid assessment ID")

    if not doc:
        raise HTTPException(status_code=404, detail="Assessment not found")

    return AssessmentResponse(
        id=str(doc["_id"]),
        **{k: v for k, v in doc.items() if k not in ("_id",)},
    )


@router.delete("/assessments/{assessment_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_assessment(assessment_id: str, user: dict = Depends(get_current_user)):
    """Delete an assessment."""
    db = get_db()
    if db is None:
        raise HTTPException(status_code=404, detail="Assessment not found")

    try:
        result = await db.assessments.delete_one({
            "_id": ObjectId(assessment_id),
            "user_id": user["user_id"],
        })
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid assessment ID")

    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Assessment not found")


@router.get("/dashboard", response_model=DashboardStats)
async def get_dashboard(user: dict = Depends(get_current_user)):
    """Get dashboard statistics for the current user."""
    db = get_db()
    if db is None:
        return DashboardStats(
            total_assessments=0,
            average_score=0,
            total_water_potential=0,
        )

    pipeline = [
        {"$match": {"user_id": user["user_id"]}},
        {"$group": {
            "_id": None,
            "total": {"$sum": 1},
            "avg_score": {"$avg": "$score.total"},
            "total_water": {"$sum": "$calculation.harvestable_litres"},
        }},
    ]
    stats = await db.assessments.aggregate(pipeline).to_list(1)

    # Get recent assessments
    cursor = db.assessments.find(
        {"user_id": user["user_id"]}
    ).sort("created_at", -1).limit(5)

    recent = []
    async for doc in cursor:
        recent.append(AssessmentSummary(
            id=str(doc["_id"]),
            location=Location(**doc["location"]),
            roof_area_m2=doc["roof"]["area_m2"],
            harvestable_litres=doc["calculation"]["harvestable_litres"],
            score_total=doc["score"]["total"],
            score_category=doc["score"]["category"],
            created_at=doc["created_at"],
            demo_mode=doc.get("demo_mode", False),
        ))

    if stats:
        s = stats[0]
        return DashboardStats(
            total_assessments=s["total"],
            average_score=round(s["avg_score"] or 0, 1),
            total_water_potential=round(s["total_water"] or 0, 0),
            latest_assessment=recent[0] if recent else None,
            recent_assessments=recent,
        )

    return DashboardStats(
        total_assessments=0,
        average_score=0,
        total_water_potential=0,
        recent_assessments=[],
    )


@router.get("/reports/{assessment_id}")
async def download_report(assessment_id: str, user: dict = Depends(get_current_user)):
    """Generate and download a PDF report for an assessment."""
    db = get_db()
    if db is None:
        raise HTTPException(status_code=404, detail="Assessment not found")

    try:
        doc = await db.assessments.find_one({
            "_id": ObjectId(assessment_id),
            "user_id": user["user_id"],
        })
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid assessment ID")

    if not doc:
        raise HTTPException(status_code=404, detail="Assessment not found")

    # Convert ObjectId to string for JSON serialization
    doc["_id"] = str(doc["_id"])

    pdf_buffer = generate_pdf_report(doc, user_name=user.get("name", "User"))

    return StreamingResponse(
        pdf_buffer,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f'attachment; filename="RainSense_Report_{assessment_id[:8]}.pdf"'
        },
    )
