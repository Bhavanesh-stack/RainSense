"""Readiness scoring service — transparent, rule-based scoring."""

from app.config import settings
from app.models.schemas import (
    ReadinessScore, ScoreBreakdown, AIAnalysis, RainfallData, WaterCalculation
)


class ReadinessScorer:
    """
    Calculates a transparent 0–100 readiness score.
    Each factor's contribution is visible to the user.
    """

    def __init__(self):
        self.weights = settings.SCORE_WEIGHTS

    def calculate_score(
        self,
        roof_area_m2: float,
        roof_material: str,
        roof_type: str,
        existing_rwh: str,
        ai_analysis: AIAnalysis,
        rainfall: RainfallData,
        calculation: WaterCalculation,
    ) -> ReadinessScore:
        """Calculate the full readiness score with breakdown."""

        # ── Roof Area Score (0–25) ─────────────────────────────
        area_score = self._score_roof_area(roof_area_m2)

        # ── Rainfall Score (0–25) ──────────────────────────────
        rainfall_score = self._score_rainfall(rainfall.annual_mm)

        # ── Roof Material Score (0–20) ─────────────────────────
        material_score = self._score_material(roof_material)

        # ── Roof Condition Score (0–15) ────────────────────────
        condition_score = self._score_condition(roof_type, existing_rwh)

        # ── Obstacles Score (0–15) ─────────────────────────────
        obstacles_score = self._score_obstacles(ai_analysis)

        total = area_score + rainfall_score + material_score + condition_score + obstacles_score
        total = min(100, max(0, round(total, 1)))

        category = self._get_category(total)
        explanation = self._generate_explanation(
            roof_area_m2, rainfall.annual_mm, roof_material, roof_type,
            ai_analysis, existing_rwh, calculation
        )

        return ReadinessScore(
            total=total,
            category=category,
            breakdown=ScoreBreakdown(
                roof_area=round(area_score, 1),
                rainfall=round(rainfall_score, 1),
                roof_material=round(material_score, 1),
                roof_condition=round(condition_score, 1),
                obstacles=round(obstacles_score, 1),
            ),
            explanation=explanation,
        )

    def _score_roof_area(self, area: float) -> float:
        """Score based on roof area. Larger = better, up to diminishing returns."""
        max_pts = self.weights["roof_area"]
        if area >= 200:
            return max_pts
        elif area >= 100:
            return max_pts * 0.9
        elif area >= 50:
            return max_pts * 0.7
        elif area >= 25:
            return max_pts * 0.5
        else:
            return max_pts * (area / 25) * 0.5

    def _score_rainfall(self, annual_mm: float) -> float:
        """Score based on annual rainfall."""
        max_pts = self.weights["rainfall"]
        if annual_mm >= 1500:
            return max_pts
        elif annual_mm >= 1000:
            return max_pts * 0.85
        elif annual_mm >= 600:
            return max_pts * 0.65
        elif annual_mm >= 300:
            return max_pts * 0.4
        else:
            return max_pts * (annual_mm / 300) * 0.4

    def _score_material(self, material: str) -> float:
        """Score based on roof material suitability for rainwater collection."""
        max_pts = self.weights["roof_material"]
        scores = {
            "RCC / Concrete": max_pts * 0.9,
            "Metal": max_pts * 1.0,
            "Tile": max_pts * 0.75,
            "Other": max_pts * 0.5,
        }
        return scores.get(material, max_pts * 0.5)

    def _score_condition(self, roof_type: str, existing_rwh: str) -> float:
        """Score based on roof type and existing infrastructure."""
        max_pts = self.weights["roof_condition"]
        score = 0

        # Roof type
        if roof_type == "Flat":
            score += max_pts * 0.5
        elif roof_type == "Sloped":
            score += max_pts * 0.65  # Sloped can be better for water flow
        else:
            score += max_pts * 0.35

        # Existing RWH
        if existing_rwh == "Yes":
            score += max_pts * 0.35  # Already has infra
        elif existing_rwh == "No":
            score += max_pts * 0.25  # Room for new installation
        else:
            score += max_pts * 0.15

        return min(max_pts, score)

    def _score_obstacles(self, ai: AIAnalysis) -> float:
        """Score based on detected obstacles (fewer = better)."""
        max_pts = self.weights["obstacles"]
        num_obstacles = len(ai.obstacles)

        if num_obstacles == 0:
            return max_pts
        elif num_obstacles <= 2:
            return max_pts * 0.7
        elif num_obstacles <= 5:
            return max_pts * 0.4
        else:
            return max_pts * 0.2

    def _get_category(self, score: float) -> str:
        if score >= 80:
            return "Highly Suitable"
        elif score >= 50:
            return "Moderately Suitable"
        return "Low Suitability"

    def _generate_explanation(
        self, area, rainfall_mm, material, roof_type, ai, existing_rwh, calc
    ) -> dict:
        """Generate human-readable explanation of the score."""
        positive = []
        attention = []

        # Area
        if area >= 50:
            positive.append("Adequate rooftop area for rainwater harvesting")
        else:
            attention.append("Relatively small rooftop area may limit collection potential")

        # Rainfall
        if rainfall_mm >= 800:
            positive.append("Favorable rainfall conditions in this location")
        elif rainfall_mm >= 400:
            positive.append("Moderate rainfall — seasonal harvesting is viable")
        else:
            attention.append("Low rainfall — collection volumes will be limited")

        # Material
        if material in ("RCC / Concrete", "Metal"):
            positive.append(f"Suitable roof material ({material}) with good runoff coefficient")
        else:
            attention.append(f"Roof material ({material}) may have lower water collection efficiency")

        # Roof type
        if roof_type == "Sloped":
            positive.append("Sloped roof aids natural water drainage for collection")
        elif roof_type == "Flat":
            positive.append("Flat roof allows flexible gutter/drain placement")

        # Obstacles
        if len(ai.obstacles) > 0:
            attention.append(f"{len(ai.obstacles)} potential obstacle(s) detected on rooftop")
        else:
            positive.append("No significant rooftop obstacles detected")

        # Existing RWH
        if existing_rwh == "Yes":
            positive.append("Existing rainwater harvesting infrastructure available")
        elif existing_rwh == "No":
            attention.append("No existing harvesting infrastructure — full installation needed")

        # Harvested volume
        if calc.harvestable_litres > 50000:
            positive.append(f"High estimated annual harvest potential ({calc.harvestable_litres:,.0f} L)")

        attention.append("Storage capacity should be selected according to actual household demand")

        return {"positive": positive, "attention": attention}


# Singleton
_scorer: ReadinessScorer = None


def get_scorer() -> ReadinessScorer:
    global _scorer
    if _scorer is None:
        _scorer = ReadinessScorer()
    return _scorer
