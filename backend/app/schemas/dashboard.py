from datetime import date, datetime

from pydantic import BaseModel


class LatestActivityResponse(BaseModel):
    call_id: int
    lead_id: int
    lead_name: str
    company: str
    call_date: date


class FollowUpCountsResponse(BaseModel):
    overdue: int
    due_today: int
    upcoming: int
    no_follow_up: int


class RecentLeadResponse(BaseModel):
    id: int
    lead_name: str
    company: str
    status: str
    priority: str
    follow_up_date: date | None
    created_at: datetime


class DashboardSummaryResponse(BaseModel):
    total_leads: int
    calls_recorded: int
    interactions: int
    latest_activity: LatestActivityResponse | None
    lead_status_counts: dict[str, int]
    priority_counts: dict[str, int]
    conversion_rate: float
    follow_up_counts: FollowUpCountsResponse
    recent_leads: list[RecentLeadResponse]
