from motor.motor_asyncio import AsyncIOMotorClient
from app.config import settings
from app.database.json_db import JSONDatabase
import os

client: AsyncIOMotorClient = None
db = None


async def connect_db():
    """Connect to MongoDB or fallback to local JSON database for demo."""
    global client, db
    try:
        # If explicitly requested or default fallback
        client = AsyncIOMotorClient(settings.MONGODB_URI, serverSelectionTimeoutMS=2000)
        db = client[settings.DB_NAME]
        # Verify connection
        await client.admin.command("ping")
        print(f"✓ Connected to MongoDB: {settings.DB_NAME}")
    except Exception as e:
        print(f"⚠ MongoDB not available ({e})")
        print("📁 Falling back to local JSON file storage (backend/data/) for demo mode.")
        db = JSONDatabase(data_dir=os.path.join(os.path.dirname(__file__), "..", "..", "data"))


async def close_db():
    """Close database connection."""
    global client
    if client:
        client.close()
        print("✓ Database connection closed")


def get_db():
    """Get database instance."""
    return db
