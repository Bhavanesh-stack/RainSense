"""Rainwater harvesting calculation service."""

from typing import List
from app.config import settings
from app.models.schemas import WaterCalculation, RainfallData


class RainwaterCalculator:
    """
    Calculates harvestable rainwater using the standard runoff formula:
    V = A × R × C
    where V = volume, A = effective area, R = rainfall depth, C = runoff coefficient
    """

    def __init__(self):
        self.coefficients = settings.RUNOFF_COEFFICIENTS

    def get_runoff_coefficient(self, material: str) -> float:
        """Get the runoff coefficient for a roof material."""
        return self.coefficients.get(material, 0.70)

    def calculate(
        self,
        roof_area_m2: float,
        rainfall: RainfallData,
        roof_material: str,
        obstacle_reduction: float = 0.0,
    ) -> WaterCalculation:
        """
        Calculate annual harvestable rainwater.

        Args:
            roof_area_m2: Total roof area in square meters
            rainfall: Rainfall data with annual and monthly values
            roof_material: Roof material type for coefficient lookup
            obstacle_reduction: Fraction of roof area blocked by obstacles (0.0 to 1.0)
        """
        coefficient = self.get_runoff_coefficient(roof_material)
        effective_area = roof_area_m2 * (1 - obstacle_reduction)

        # Annual calculation: V = A × R(m) × C
        rainfall_m = rainfall.annual_mm / 1000.0
        volume_m3 = effective_area * rainfall_m * coefficient
        volume_litres = volume_m3 * 1000.0

        # Monthly calculations
        monthly_harvest = []
        for monthly_rain_mm in rainfall.monthly_mm:
            monthly_rain_m = monthly_rain_mm / 1000.0
            monthly_vol = effective_area * monthly_rain_m * coefficient * 1000.0
            monthly_harvest.append(round(monthly_vol, 1))

        return WaterCalculation(
            runoff_coefficient=coefficient,
            harvestable_litres=round(volume_litres, 1),
            harvestable_m3=round(volume_m3, 2),
            monthly_harvest_litres=monthly_harvest,
            effective_area_m2=round(effective_area, 1),
        )


# Singleton
_calculator: RainwaterCalculator = None


def get_calculator() -> RainwaterCalculator:
    global _calculator
    if _calculator is None:
        _calculator = RainwaterCalculator()
    return _calculator
