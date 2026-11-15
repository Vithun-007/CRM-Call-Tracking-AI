from datetime import date, datetime

from pydantic import BaseModel, ConfigDict, Field, field_validator


class CallInteractionCreate(BaseModel):
    call_date: date
    original_notes: str | None = Field(default=None, max_length=5000)
    notes: str = Field(min_length=1, max_length=5000)
    ai_summary: str | None = Field(default=None, max_length=3000)

    @field_validator("original_notes", "notes", "ai_summary")
    @classmethod
    def validate_text(cls, value: str | None) -> str | None:
        if value is None:
            return None

        value = value.strip()

        if not value:
            raise ValueError("Text fields cannot contain only whitespace.")

        return value


class CallInteractionUpdate(BaseModel):
    call_date: date
    notes: str = Field(min_length=1, max_length=5000)
    ai_summary: str | None = Field(default=None, max_length=3000)

    @field_validator("notes", "ai_summary")
    @classmethod
    def validate_text(cls, value: str | None) -> str | None:
        if value is None:
            return None

        value = value.strip()

        if not value:
            raise ValueError("Text fields cannot contain only whitespace.")

        return value


class CallInteractionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    lead_id: int
    call_date: date
    original_notes: str
    notes: str
    ai_summary: str | None
    created_at: datetime
    updated_at: datetime


class CallInteractionListResponse(BaseModel):
    success: bool
    message: str
    data: list[CallInteractionResponse]
    total: int
