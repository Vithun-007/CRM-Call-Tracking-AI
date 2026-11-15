from datetime import date, datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, field_validator


LeadStatus = Literal["New", "Contacted", "Interested", "Converted", "Lost"]
LeadPriority = Literal["Low", "Medium", "High"]


class LeadFields(BaseModel):
    lead_name: str = Field(min_length=2, max_length=150)
    company: str = Field(min_length=2, max_length=200)
    contact_number: str = Field(min_length=5, max_length=30)
    status: LeadStatus = "New"
    priority: LeadPriority = "Medium"
    follow_up_date: date | None = None
    lead_notes: str | None = Field(default=None, max_length=5000)

    @field_validator("lead_name", "company", "contact_number")
    @classmethod
    def validate_non_empty(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("This field cannot be empty.")
        return value

    @field_validator("lead_notes")
    @classmethod
    def normalize_notes(cls, value: str | None) -> str | None:
        if value is None:
            return None
        value = value.strip()
        return value or None


class LeadCreate(LeadFields):
    pass


class LeadUpdate(LeadFields):
    pass


class LeadResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    lead_name: str
    company: str
    contact_number: str
    status: LeadStatus
    priority: LeadPriority
    follow_up_date: date | None
    lead_notes: str | None
    created_at: datetime
    updated_at: datetime


class LeadListResponse(BaseModel):
    success: bool
    message: str
    data: list[LeadResponse]
    total: int
