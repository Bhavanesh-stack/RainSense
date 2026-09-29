import os
from dotenv import load_dotenv

load_dotenv()


class Settings:
    # MongoDB
    MONGODB_URI: str = os.getenv("MONGODB_URI", "mongodb://localhost:27017")
    DB_NAME: str = os.getenv("DB_NAME", "rainsense")

    # JWT
    JWT_SECRET: str = os.getenv("JWT_SECRET", "dev-secret-key")
    JWT_ALGORITHM: str = os.getenv("JWT_ALGORITHM", "HS256")
    JWT_EXPIRATION_HOURS: int = int(os.getenv("JWT_EXPIRATION_HOURS", "24"))

    # Weather API
    OPENWEATHER_API_KEY: str = os.getenv("OPENWEATHER_API_KEY", "")

    # YOLO
    YOLO_MODEL_PATH: str = os.getenv("YOLO_MODEL_PATH", "yolov8n.pt")

    # App
    DEMO_MODE: bool = os.getenv("DEMO_MODE", "true").lower() == "true"
    MAX_FILE_SIZE_MB: int = int(os.getenv("MAX_FILE_SIZE_MB", "10"))
    UPLOAD_DIR: str = os.getenv("UPLOAD_DIR", "uploads")

    # CORS
    FRONTEND_URL: str = os.getenv("FRONTEND_URL", "http://localhost:5173")

    # Runoff coefficients
    RUNOFF_COEFFICIENTS = {
        "RCC / Concrete": 0.85,
        "Metal": 0.90,
        "Tile": 0.80,
        "Other": 0.70,
    }

    # Readiness score weights (out of 100)
    SCORE_WEIGHTS = {
        "roof_area": 25,
        "rainfall": 25,
        "roof_material": 20,
        "roof_condition": 15,
        "obstacles": 15,
    }

    # Cost assumptions (INR)
    COST_CONFIG = {
        "tank_per_litre": 8,
        "gutters_per_meter": 350,
        "filter_unit": 3500,
        "first_flush_diverter": 2500,
        "downpipes_per_meter": 250,
        "recharge_pit": 15000,
        "overflow_system": 3000,
        "labour_percentage": 0.20,
        "water_rate_per_litre": 0.10,
    }

    # Gutter estimate (meters, based on roof perimeter approximation)
    GUTTER_ESTIMATE_FACTOR: float = 0.12  # meters of gutter per m² roof


settings = Settings()
