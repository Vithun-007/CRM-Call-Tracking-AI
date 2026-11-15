from pydantic import BaseModel, Field, field_validator


class AISummaryRequest(BaseModel):
    notes: str = Field(
        min_length=3,
        max_length=5000,
        description="Original shorthand call notes.",
    )

    @field_validator("notes")
    @classmethod
    def validate_notes(cls, value: str) -> str:
        value = value.strip()

        if len(value) < 3:
            raise ValueError("Please provide meaningful call notes.")

        return value


class AISummaryData(BaseModel):
    summary: str


class AISummaryResponse(BaseModel):
    success: bool
    message: str
    data: AISummaryData


class AICallIntelligenceData(BaseModel):
    summary: str
    customer_intent: str
    requirements: list[str]
    customer_interests: list[str]
    action_items: list[str]
    follow_up_recommendation: str


class AICallIntelligenceResponse(BaseModel):
    success: bool
    message: str
    data: AICallIntelligenceData
