from datetime import datetime

from sqlalchemy import DateTime, Float, ForeignKey, Integer
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class PowerSnapshotRecord(Base):
    __tablename__ = "power_snapshots"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    segment_id: Mapped[str] = mapped_column(ForeignKey("segments.id"), index=True, nullable=False)
    input_power_kw: Mapped[float] = mapped_column(Float, nullable=False)
    consumption_kw: Mapped[float] = mapped_column(Float, nullable=False)
    loss_kw: Mapped[float] = mapped_column(Float, nullable=False)
    detection_signal: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    recorded_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), index=True, nullable=False)
