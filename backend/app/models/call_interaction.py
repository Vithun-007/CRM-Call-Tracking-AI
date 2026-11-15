
from datetime import date, datetime, timezone

from sqlalchemy import Date, DateTime, ForeignKey, Integer, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class CallInteraction(Base):
    __tablename__ = "call_interactions"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        index=True,
    )

    lead_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("leads.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    call_date: Mapped[date] = mapped_column(
        Date,
        nullable=False,
    )

    # Original shorthand notes entered by the user.
    original_notes: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )

    # Final notes approved and saved by the user.
    notes: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )

    # AI-generated summary, when available.
    ai_summary: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    lead: Mapped["Lead"] = relationship(
        back_populates="call_interactions",
    )
