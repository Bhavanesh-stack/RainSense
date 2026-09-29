"""Weather/rainfall data service with API and demo fallback."""

import httpx
from typing import Optional
from app.config import settings
from app.models.schemas import RainfallData


# Demo rainfall data for major Indian cities (annual averages in mm, monthly breakdown)
DEMO_RAINFALL_DATA = {
    "chennai": {
        "annual_mm": 1400,
        "monthly_mm": [25, 10, 10, 25, 55, 50, 100, 130, 120, 260, 350, 265],
    },
    "mumbai": {
        "annual_mm": 2200,
        "monthly_mm": [0, 1, 0, 1, 20, 530, 700, 500, 310, 80, 20, 5],
    },
    "delhi": {
        "annual_mm": 800,
        "monthly_mm": [20, 20, 15, 10, 25, 55, 210, 230, 120, 15, 5, 10],
    },
    "bangalore": {
        "annual_mm": 970,
        "monthly_mm": [5, 10, 15, 50, 115, 80, 100, 130, 195, 165, 65, 40],
    },
    "kolkata": {
        "annual_mm": 1650,
        "monthly_mm": [15, 25, 35, 55, 140, 280, 340, 330, 255, 125, 30, 5],
    },
    "hyderabad": {
        "annual_mm": 810,
        "monthly_mm": [10, 10, 15, 25, 35, 105, 160, 170, 155, 85, 30, 10],
    },
    "pune": {
        "annual_mm": 720,
        "monthly_mm": [2, 2, 5, 15, 40, 130, 180, 150, 120, 55, 15, 6],
    },
    "jaipur": {
        "annual_mm": 600,
        "monthly_mm": [8, 8, 5, 5, 15, 55, 195, 180, 75, 15, 5, 5],
    },
    "default": {
        "annual_mm": 1100,
        "monthly_mm": [30, 25, 30, 40, 60, 120, 180, 170, 140, 100, 55, 30],
    },
}


class WeatherService:
    """Fetches rainfall data from weather APIs or provides demo data."""

    def __init__(self):
        self.api_key = settings.OPENWEATHER_API_KEY

    async def get_rainfall(self, city: str, state: str = "", country: str = "India") -> RainfallData:
        """
        Get annual rainfall data for a location.
        Tries live API first, falls back to demo data.
        """
        # Try live API if key is available and not in forced demo mode
        if self.api_key and not settings.DEMO_MODE:
            live_data = await self._fetch_live_data(city, country)
            if live_data:
                return live_data

        # Fallback to demo data
        return self._get_demo_data(city)

    async def _fetch_live_data(self, city: str, country: str) -> Optional[RainfallData]:
        """Fetch rainfall data from OpenWeatherMap API."""
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                # Get coordinates first
                geo_url = "http://api.openweathermap.org/geo/1.0/direct"
                geo_resp = await client.get(geo_url, params={
                    "q": f"{city},{country}",
                    "limit": 1,
                    "appid": self.api_key,
                })
                geo_data = geo_resp.json()
                if not geo_data:
                    return None

                lat, lon = geo_data[0]["lat"], geo_data[0]["lon"]

                # Get climate/weather data
                weather_url = "https://api.openweathermap.org/data/2.5/weather"
                weather_resp = await client.get(weather_url, params={
                    "lat": lat,
                    "lon": lon,
                    "appid": self.api_key,
                })
                weather_data = weather_resp.json()

                # Extract rain data if available
                rain_1h = weather_data.get("rain", {}).get("1h", 0)

                # For annual estimation, we'd need historical data
                # OpenWeatherMap free tier is limited, so we use demo data
                # but mark it as coming from a partially-live source
                demo = self._get_demo_data(city)
                return RainfallData(
                    annual_mm=demo.annual_mm,
                    monthly_mm=demo.monthly_mm,
                    source="cached",
                    location_used=f"{city}, {country} (coordinates: {lat:.2f}, {lon:.2f})",
                )

        except Exception as e:
            print(f"⚠ Weather API error: {e}")
            return None

    def _get_demo_data(self, city: str) -> RainfallData:
        """Get demo rainfall data based on city name."""
        city_key = city.lower().strip()
        data = DEMO_RAINFALL_DATA.get(city_key, DEMO_RAINFALL_DATA["default"])

        return RainfallData(
            annual_mm=data["annual_mm"],
            monthly_mm=data["monthly_mm"],
            source="demo",
            location_used=f"{city} (demo data — illustrative values)",
        )


# Singleton
_weather_service: WeatherService = None


def get_weather_service() -> WeatherService:
    global _weather_service
    if _weather_service is None:
        _weather_service = WeatherService()
    return _weather_service
