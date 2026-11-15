from datetime import date
from typing import Literal

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.schemas.lead import LeadCreate, LeadResponse, LeadUpdate
from app.services import lead_service


router = APIRouter(prefix="/api/v1/leads", tags=["Lead Management"])


@router.post("", response_model=LeadResponse, status_code=status.HTTP_201_CREATED)
def create_lead(lead_data: LeadCreate, db: Session = Depends(get_db)):
    return lead_service.create_lead(db, lead_data)


@router.get("")
def get_all_leads(
    search: str | None = Query(default=None, min_length=1),
    lead_status: Literal["New", "Contacted", "Interested", "Converted", "Lost"] | None = Query(default=None, alias="status"),
    priority: Literal["Low", "Medium", "High"] | None = None,
    follow_up_from: date | None = None,
    follow_up_to: date | None = None,
    follow_up_status: Literal["overdue", "today", "upcoming", "none"] | None = None,
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=50, ge=1, le=100),
    db: Session = Depends(get_db),
):
    if follow_up_from and follow_up_to and follow_up_from > follow_up_to:
        raise HTTPException(
            status_code=422,
            detail="follow_up_from cannot be later than follow_up_to.",
        )

    leads = lead_service.get_all_leads(
        db,
        status=lead_status,
        priority=priority,
        follow_up_from=follow_up_from,
        follow_up_to=follow_up_to,
        follow_up_status=follow_up_status,
    )

    if search:
        search_term = search.strip().casefold()
        leads = [
            lead for lead in leads
            if search_term in lead.lead_name.casefold()
            or search_term in lead.company.casefold()
            or search_term in lead.contact_number.casefold()
        ]

    total = len(leads)
    return {
        "success": True,
        "message": "Leads retrieved successfully.",
        "data": leads[skip:skip + limit],
        "total": total,
    }


@router.get("/{lead_id}", response_model=LeadResponse)
def get_lead(lead_id: int, db: Session = Depends(get_db)):
    lead = lead_service.get_lead_by_id(db, lead_id)
    if lead is None:
        raise HTTPException(status_code=404, detail="Lead not found.")
    return lead


@router.put("/{lead_id}", response_model=LeadResponse)
def update_lead(
    lead_id: int,
    lead_data: LeadUpdate,
    db: Session = Depends(get_db),
):
    lead = lead_service.get_lead_by_id(db, lead_id)
    if lead is None:
        raise HTTPException(status_code=404, detail="Lead not found.")
    return lead_service.update_lead(db, lead, lead_data)


@router.delete("/{lead_id}", status_code=status.HTTP_200_OK)
def delete_lead(lead_id: int, db: Session = Depends(get_db)):
    lead = lead_service.get_lead_by_id(db, lead_id)
    if lead is None:
        raise HTTPException(status_code=404, detail="Lead not found.")

    lead_service.delete_lead(db, lead)
    return {"success": True, "message": "Lead deleted successfully."}
