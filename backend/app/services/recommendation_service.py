"""Recommendation engine — storage, components, cost, savings, payback."""

from typing import List
from app.config import settings
from app.models.schemas import (
    Recommendations, ComponentRecommendation, WaterCalculation, RainfallData
)


class RecommendationEngine:
    """
    Generates actionable recommendations based on assessment results.
    All cost values are configurable estimates in INR.
    """

    def __init__(self):
        self.cost = settings.COST_CONFIG

    def generate(
        self,
        calculation: WaterCalculation,
        rainfall: RainfallData,
        roof_area_m2: float,
        roof_type: str,
        existing_rwh: str,
    ) -> Recommendations:
        """Generate complete recommendations."""

        # ── Storage ───────────────────────────────────────────
        storage_litres = self._recommend_storage(calculation, rainfall)
        storage_desc = self._storage_description(storage_litres)

        # ── Components ────────────────────────────────────────
        components = self._recommend_components(
            roof_area_m2, roof_type, existing_rwh, storage_litres
        )

        # ── Cost ──────────────────────────────────────────────
        total_cost = sum(c.estimated_cost for c in components)
        labour = total_cost * self.cost["labour_percentage"]
        total_cost += labour

        # ── Savings ───────────────────────────────────────────
        annual_savings = calculation.harvestable_litres * self.cost["water_rate_per_litre"]

        # ── Payback ───────────────────────────────────────────
        payback_years = None
        payback_desc = ""
        if annual_savings > 0:
            payback_years = round(total_cost / annual_savings, 1)
            payback_desc = f"Estimated payback in approximately {payback_years} years"
        else:
            payback_desc = "Payback period cannot be estimated from the available data."

        return Recommendations(
            storage_litres=storage_litres,
            storage_description=storage_desc,
            components=components,
            total_estimated_cost=round(total_cost, 0),
            annual_savings=round(annual_savings, 0),
            payback_years=payback_years,
            payback_description=payback_desc,
        )

    def _recommend_storage(self, calc: WaterCalculation, rainfall: RainfallData) -> float:
        """
        Recommend storage capacity based on:
        - Peak monthly collection (buffer for dry months)
        - Practical tank sizes available in market
        """
        if not calc.monthly_harvest_litres:
            # Simple estimate: ~1 month of average collection
            monthly_avg = calc.harvestable_litres / 12
            return self._round_to_tank_size(monthly_avg)

        # Use the maximum monthly collection as baseline
        peak_month = max(calc.monthly_harvest_litres)
        # Storage = ~70% of peak month (practical balance)
        recommended = peak_month * 0.7
        return self._round_to_tank_size(recommended)

    def _round_to_tank_size(self, litres: float) -> float:
        """Round to nearest practical tank size."""
        standard_sizes = [500, 1000, 2000, 3000, 5000, 7500, 10000, 15000, 20000, 25000]
        for size in standard_sizes:
            if size >= litres:
                return float(size)
        return float(standard_sizes[-1])

    def _storage_description(self, litres: float) -> str:
        if litres <= 1000:
            return f"A {int(litres)}L storage tank suitable for small-scale collection"
        elif litres <= 5000:
            return f"A {int(litres)}L tank — suitable for a typical household"
        elif litres <= 10000:
            return f"A {int(litres)}L tank or underground sump for medium-scale harvesting"
        return f"A {int(litres)}L capacity — consider underground sump or multiple tanks"

    def _recommend_components(
        self, area: float, roof_type: str, existing_rwh: str, storage: float
    ) -> List[ComponentRecommendation]:
        """Generate component recommendations based on assessment."""
        components = []

        # Storage tank (always recommended)
        tank_cost = storage * self.cost["tank_per_litre"]
        components.append(ComponentRecommendation(
            name="Storage Tank",
            description=f"{int(storage)}L capacity tank or sump",
            estimated_cost=round(tank_cost, 0),
            priority="essential",
        ))

        # Gutters
        gutter_length = area * settings.GUTTER_ESTIMATE_FACTOR
        gutter_cost = gutter_length * self.cost["gutters_per_meter"]
        if existing_rwh != "Yes":
            components.append(ComponentRecommendation(
                name="Gutters & Channels",
                description=f"Approximately {gutter_length:.0f}m of roof guttering",
                estimated_cost=round(gutter_cost, 0),
                priority="essential",
            ))

        # Downpipes
        downpipe_length = 3.0 * 2  # Rough estimate: 3m x 2 downpipes
        downpipe_cost = downpipe_length * self.cost["downpipes_per_meter"]
        if existing_rwh != "Yes":
            components.append(ComponentRecommendation(
                name="Downpipes",
                description="PVC downpipes to channel water from gutters to tank",
                estimated_cost=round(downpipe_cost, 0),
                priority="essential",
            ))

        # First-flush diverter (always recommended)
        components.append(ComponentRecommendation(
            name="First-Flush Diverter",
            description="Diverts the initial dirty rainwater away from the storage tank",
            estimated_cost=self.cost["first_flush_diverter"],
            priority="essential",
        ))

        # Filter
        components.append(ComponentRecommendation(
            name="Filter Unit",
            description="Mesh and charcoal filter to remove debris and contaminants",
            estimated_cost=self.cost["filter_unit"],
            priority="recommended",
        ))

        # Recharge pit (if area is large enough)
        if area >= 60:
            components.append(ComponentRecommendation(
                name="Recharge Pit",
                description="Groundwater recharge pit for overflow water",
                estimated_cost=self.cost["recharge_pit"],
                priority="recommended",
            ))

        # Overflow system
        components.append(ComponentRecommendation(
            name="Overflow System",
            description="Overflow pipe to safely divert excess water",
            estimated_cost=self.cost["overflow_system"],
            priority="recommended",
        ))

        return components


# Singleton
_engine: RecommendationEngine = None


def get_recommendation_engine() -> RecommendationEngine:
    global _engine
    if _engine is None:
        _engine = RecommendationEngine()
    return _engine
