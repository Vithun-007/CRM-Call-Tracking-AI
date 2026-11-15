from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.db.database import create_database_tables
from app.models import Lead, CallInteraction
from app.routers import lead_router, call_router, ai_router, dashboard_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    print("Initializing CRM database...")

    create_database_tables()

    print("CRM database initialized successfully.")

    yield

    print("CRM backend shutting down.")


app = FastAPI(
    title="Indium AI-Powered CRM",
    description=(
        "Backend API for lead management, "
        "call tracking, and AI-powered call summaries."
    ),
    version="1.0.0",
    lifespan=lifespan,
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(lead_router)
app.include_router(call_router)
app.include_router(ai_router)
app.include_router(dashboard_router)


@app.get("/", tags=["General"])
def root():
    return {
        "success": True,
        "message": "Indium AI-Powered CRM Backend is running.",
    }


@app.get("/health", tags=["General"])
def health_check():
    return {
        "success": True,
        "status": "healthy",
        "application": "Indium AI-Powered CRM",
        "database": "SQLite",
    }

