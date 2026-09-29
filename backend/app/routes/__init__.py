from .auth import router as auth_router
from .assessment import router as assessment_router

__all__ = ["auth_router", "assessment_router"]
