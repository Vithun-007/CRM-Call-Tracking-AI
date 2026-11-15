from datetime import date, timedelta

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.lead import Lead
from app.schemas.lead import LeadCreate, LeadUpdate


def create_lead(db: Session, lead_data: LeadCreate) -> Lead:
    lead = Lead(**lead_data.model_dump())
    db.add(lead)
    db.commit()
    db.refresh(lead)
    return lead


def get_all_leads(
    db: Session,
    status: str | None = None,
    priority: str | None = None,
    follow_up_from: date | None = None,
    follow_up_to: date | None = None,
    follow_up_status: str | None = None,
) -> list[Lead]:
    statement = select(Lead).order_by(Lead.created_at.desc())
    today = date.today()

    if status:
        statement = statement.where(Lead.status == status)
    if priority:
        statement = statement.where(Lead.priority == priority)

    if follow_up_status == "overdue":
        statement = statement.where(
            Lead.follow_up_date.is_not(None),
            Lead.follow_up_date < today,
        )
    elif follow_up_status == "today":
        statement = statement.where(Lead.follow_up_date == today)
    elif follow_up_status == "upcoming":
        statement = statement.where(
            Lead.follow_up_date > today,
            Lead.follow_up_date <= today + timedelta(days=7),
        )
    elif follow_up_status == "none":
        statement = statement.where(Lead.follow_up_date.is_(None))

    if follow_up_from:
        statement = statement.where(Lead.follow_up_date >= follow_up_from)
    if follow_up_to:
        statement = statement.where(Lead.follow_up_date <= follow_up_to)

    return list(db.scalars(statement).all())


def get_lead_by_id(db: Session, lead_id: int) -> Lead | None:
    return db.get(Lead, lead_id)


def update_lead(db: Session, lead: Lead, lead_data: LeadUpdate) -> Lead:
    for field, value in lead_data.model_dump().items():
        setattr(lead, field, value)

    db.commit()
    db.refresh(lead)
    return lead


def delete_lead(db: Session, lead: Lead) -> None:
    db.delete(lead)
    db.commit()
