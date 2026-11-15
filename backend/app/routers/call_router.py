from datetime import date

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.schemas.call_interaction import (
    CallInteractionCreate,
    CallInteractionListResponse,
    CallInteractionResponse,
    CallInteractionUpdate,
)
from app.services import call_interaction_service, lead_service


router = APIRouter(
    prefix="/api/v1",
    tags=["Call Tracking"],
)


@router.post(
    "/leads/{lead_id}/calls",
    response_model=CallInteractionResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_call(
    lead_id: int,
    call_data: CallInteractionCreate,
    db: Session = Depends(get_db),
):
    lead = lead_service.get_lead_by_id(db, lead_id)

    if lead is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Lead not found. Cannot create a call interaction.",
        )

    return call_interaction_service.create_call_interaction(
        db,
        lead_id,
        call_data,
    )


@router.get(
    "/leads/{lead_id}/calls",
    response_model=CallInteractionListResponse,
)
def get_calls_for_lead(
    lead_id: int,
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=50, ge=1, le=100),
    db: Session = Depends(get_db),
):
    lead = lead_service.get_lead_by_id(db, lead_id)

    if lead is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Lead not found.",
        )

    interactions = call_interaction_service.get_calls_for_lead(
        db,
        lead_id,
        skip,
        limit,
    )

    return {
        "success": True,
        "message": "Call history retrieved successfully.",
        "data": interactions,
        "total": len(interactions),
    }


@router.get(
    "/calls",
    response_model=CallInteractionListResponse,
)
def get_all_calls(
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=10, ge=1, le=100),
    search: str | None = Query(default=None, max_length=200),
    lead_id: int | None = Query(default=None, ge=1),
    date_from: date | None = Query(default=None),
    date_to: date | None = Query(default=None),
    db: Session = Depends(get_db),
):
    if date_from and date_to and date_from > date_to:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail="Start date cannot be later than end date.",
        )

    interactions, total = (
        call_interaction_service.get_filtered_call_interactions(
            db=db,
            skip=skip,
            limit=limit,
            search=search,
            lead_id=lead_id,
            date_from=date_from,
            date_to=date_to,
        )
    )

    return {
        "success": True,
        "message": "Call interactions retrieved successfully.",
        "data": interactions,
        "total": total,
    }


@router.get(
    "/calls/{call_id}",
    response_model=CallInteractionResponse,
)
def get_call(
    call_id: int,
    db: Session = Depends(get_db),
):
    interaction = call_interaction_service.get_call_interaction_by_id(
        db,
        call_id,
    )

    if interaction is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Call interaction not found.",
        )

    return interaction


@router.put(
    "/calls/{call_id}",
    response_model=CallInteractionResponse,
)
def update_call(
    call_id: int,
    call_data: CallInteractionUpdate,
    db: Session = Depends(get_db),
):
    interaction = call_interaction_service.get_call_interaction_by_id(
        db,
        call_id,
    )

    if interaction is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Call interaction not found.",
        )

    return call_interaction_service.update_call_interaction(
        db,
        interaction,
        call_data,
    )


@router.delete("/calls/{call_id}")
def delete_call(
    call_id: int,
    db: Session = Depends(get_db),
):
    interaction = call_interaction_service.get_call_interaction_by_id(
        db,
        call_id,
    )

    if interaction is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Call interaction not found.",
        )

    call_interaction_service.delete_call_interaction(db, interaction)

    return {
        "success": True,
        "message": "Call interaction deleted successfully.",
    }

