from datetime import date, timedelta

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.lead import Lead
from app.models.call_interaction import CallInteraction


LEAD_STATUSES = ("New", "Contacted", "Interested", "Converted", "Lost")
LEAD_PRIORITIES = ("High", "Medium", "Low")


def get_dashboard_summary(db: Session) -> dict:
    today = date.today()
    upcoming_limit = today + timedelta(days=7)

    total_leads = db.scalar(
        select(func.count(Lead.id))
    ) or 0

    calls_recorded = db.scalar(
        select(func.count(CallInteraction.id))
    ) or 0

    leads_contacted = db.scalar(
        select(func.count(func.distinct(CallInteraction.lead_id)))
    ) or 0

    status_rows = db.execute(
        select(Lead.status, func.count(Lead.id))
        .group_by(Lead.status)
    ).all()

    status_counts = {status: 0 for status in LEAD_STATUSES}
    for status, count in status_rows:
        status_counts[status] = count

    priority_rows = db.execute(
        select(Lead.priority, func.count(Lead.id))
        .group_by(Lead.priority)
    ).all()

    priority_counts = {priority: 0 for priority in LEAD_PRIORITIES}
    for priority, count in priority_rows:
        priority_counts[priority] = count

    converted_leads = status_counts["Converted"]
    conversion_rate = (
        round((converted_leads / total_leads) * 100, 2)
        if total_leads
        else 0.0
    )

    overdue = db.scalar(
        select(func.count(Lead.id)).where(
            Lead.follow_up_date < today
        )
    ) or 0

    due_today = db.scalar(
        select(func.count(Lead.id)).where(
            Lead.follow_up_date == today
        )
    ) or 0

    upcoming = db.scalar(
        select(func.count(Lead.id)).where(
            Lead.follow_up_date > today,
            Lead.follow_up_date <= upcoming_limit,
        )
    ) or 0

    no_follow_up = db.scalar(
        select(func.count(Lead.id)).where(
            Lead.follow_up_date.is_(None)
        )
    ) or 0

    latest_call = db.scalar(
        select(CallInteraction)
        .order_by(
            CallInteraction.call_date.desc(),
            CallInteraction.id.desc(),
        )
        .limit(1)
    )

    latest_activity = None

    if latest_call is not None:
        lead = db.get(Lead, latest_call.lead_id)

        latest_activity = {
            "call_id": latest_call.id,
            "lead_id": latest_call.lead_id,
            "lead_name": lead.lead_name if lead else "Unknown lead",
            "company": lead.company if lead else "Unknown company",
            "call_date": latest_call.call_date,
        }

    recent_leads = db.scalars(
        select(Lead)
        .order_by(Lead.created_at.desc(), Lead.id.desc())
        .limit(5)
    ).all()

    return {
        "total_leads": total_leads,
        "calls_recorded": calls_recorded,
        "interactions": leads_contacted,
        "latest_activity": latest_activity,
        "lead_status_counts": status_counts,
        "priority_counts": priority_counts,
        "conversion_rate": conversion_rate,
        "follow_up_counts": {
            "overdue": overdue,
            "due_today": due_today,
            "upcoming": upcoming,
            "no_follow_up": no_follow_up,
        },
        "recent_leads": [
            {
                "id": lead.id,
                "lead_name": lead.lead_name,
                "company": lead.company,
                "status": lead.status,
                "priority": lead.priority,
                "follow_up_date": lead.follow_up_date,
                "created_at": lead.created_at,
            }
            for lead in recent_leads
        ],
    }
