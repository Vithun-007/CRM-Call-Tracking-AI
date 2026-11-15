import logging

from fastapi import APIRouter, HTTPException, status

from app.schemas.ai import (
    AISummaryRequest,
    AISummaryResponse,
    AICallIntelligenceResponse,
)
from app.services.ai_service import (
    generate_call_summary,
    generate_call_intelligence,
)


logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/api/v1/ai",
    tags=["AI Call Intelligence"],
)


@router.post(
    "/summarize",
    response_model=AISummaryResponse,
)
def summarize_call_notes(request: AISummaryRequest):
    """
    Backward-compatible endpoint for professional call summaries.
    """
    try:
        summary = generate_call_summary(request.notes)

        return {
            "success": True,
            "message": "Call summary generated successfully.",
            "data": {
                "summary": summary,
            },
        }

    except ValueError as error:
        logger.warning("AI summarization configuration or output error.")

        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=str(error),
        ) from error

    except Exception as error:
        logger.exception("AI summarization request failed.")

        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Unable to generate the call summary. Please try again.",
        ) from error


@router.post(
    "/analyze",
    response_model=AICallIntelligenceResponse,
)
def analyze_call_notes(request: AISummaryRequest):
    """
    Run the LangGraph Call Intelligence Agent and return
    its complete structured analysis.
    """
    try:
        result = generate_call_intelligence(request.notes)

        return {
            "success": True,
            "message": "Call intelligence generated successfully.",
            "data": result,
        }

    except ValueError as error:
        logger.warning("Call intelligence validation or configuration error.")

        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=str(error),
        ) from error

    except Exception as error:
        logger.exception("Call intelligence agent execution failed.")

        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Unable to analyze the call notes. Please try again.",
        ) from error
