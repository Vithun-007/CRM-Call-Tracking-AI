from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session

from app.models.call_interaction import CallInteraction
from app.models.lead import Lead
from app.schemas.call_interaction import (
    CallInteractionCreate,
    CallInteractionUpdate,
)


def create_call_interaction(
    db: Session,
    lead_id: int,
    call_data: CallInteractionCreate,
) -> CallInteraction:
    original_notes = (
        call_data.original_notes
        if call_data.original_notes is not None
        else call_data.notes
    )

    interaction = CallInteraction(
        lead_id=lead_id,
        call_date=call_data.call_date,
        original_notes=original_notes,
        notes=call_data.notes,
        ai_summary=call_data.ai_summary,
    )

    db.add(interaction)
    db.commit()
    db.refresh(interaction)
    return interaction


def get_all_call_interactions(
    db: Session,
    skip: int = 0,
    limit: int = 50,
) -> list[CallInteraction]:
    statement = (
        select(CallInteraction)
        .order_by(
            CallInteraction.call_date.desc(),
            CallInteraction.id.desc(),
        )
        .offset(skip)
        .limit(limit)
    )
    return list(db.scalars(statement).all())


def get_filtered_call_interactions(
    db: Session,
    skip: int = 0,
    limit: int = 10,
    search: str | None = None,
    lead_id: int | None = None,
    date_from=None,
    date_to=None,
) -> tuple[list[CallInteraction], int]:
    conditions = []

    if lead_id is not None:
        conditions.append(CallInteraction.lead_id == lead_id)

    if date_from is not None:
        conditions.append(CallInteraction.call_date >= date_from)

    if date_to is not None:
        conditions.append(CallInteraction.call_date <= date_to)

    if search and search.strip():
        term = f"%{search.strip()}%"
        conditions.append(
            or_(
                Lead.lead_name.ilike(term),
                Lead.company.ilike(term),
                Lead.contact_number.ilike(term),
                CallInteraction.original_notes.ilike(term),
                CallInteraction.notes.ilike(term),
                CallInteraction.ai_summary.ilike(term),
            )
        )

    count_statement = (
        select(func.count(CallInteraction.id))
        .select_from(CallInteraction)
        .join(Lead, Lead.id == CallInteraction.lead_id)
    )

    data_statement = (
        select(CallInteraction)
        .join(Lead, Lead.id == CallInteraction.lead_id)
        .order_by(
            CallInteraction.call_date.desc(),
            CallInteraction.id.desc(),
        )
        .offset(skip)
        .limit(limit)
    )

    if conditions:
        count_statement = count_statement.where(*conditions)
        data_statement = data_statement.where(*conditions)

    total = db.scalar(count_statement) or 0
    interactions = list(db.scalars(data_statement).all())

    return interactions, total


def get_calls_for_lead(
    db: Session,
    lead_id: int,
    skip: int = 0,
    limit: int = 50,
) -> list[CallInteraction]:
    statement = (
        select(CallInteraction)
        .where(CallInteraction.lead_id == lead_id)
        .order_by(
            CallInteraction.call_date.desc(),
            CallInteraction.id.desc(),
        )
        .offset(skip)
        .limit(limit)
    )
    return list(db.scalars(statement).all())


def get_call_interaction_by_id(
    db: Session,
    call_id: int,
) -> CallInteraction | None:
    return db.get(CallInteraction, call_id)


def update_call_interaction(
    db: Session,
    interaction: CallInteraction,
    call_data: CallInteractionUpdate,
) -> CallInteraction:
    interaction.call_date = call_data.call_date
    interaction.notes = call_data.notes
    interaction.ai_summary = call_data.ai_summary

    # Original shorthand notes are deliberately preserved.
    db.commit()
    db.refresh(interaction)
    return interaction


def delete_call_interaction(
    db: Session,
    interaction: CallInteraction,
) -> None:
    db.delete(interaction)
    db.commit()
