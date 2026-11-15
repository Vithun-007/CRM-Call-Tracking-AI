from datetime import date, datetime, timezone

from sqlalchemy import Date, DateTime, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class Lead(Base):
    __tablename__ = "leads"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    lead_name: Mapped[str] = mapped_column(String(150), nullable=False)
    company: Mapped[str] = mapped_column(String(200), nullable=False)
    contact_number: Mapped[str] = mapped_column(String(30), nullable=False)

    status: Mapped[str] = mapped_column(
        String(20), nullable=False, default="New", server_default="New"
    )
    priority: Mapped[str] = mapped_column(
        String(10), nullable=False, default="Medium", server_default="Medium"
    )
    follow_up_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    lead_notes: Mapped[str | None] = mapped_column(Text, nullable=True)

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

    call_interactions: Mapped[list["CallInteraction"]] = relationship(
        back_populates="lead",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )
