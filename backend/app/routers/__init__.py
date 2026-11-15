from app.routers.lead_router import router as lead_router
from app.routers.call_router import router as call_router
from app.routers.ai_router import router as ai_router
from app.routers.dashboard_router import router as dashboard_router

__all__ = [
    "lead_router",
    "call_router",
    "ai_router",
    "dashboard_router",
]
