from datetime import datetime

from sqlalchemy import Boolean, DateTime, Float, Integer
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class SimulationSettingsRecord(Base):
    __tablename__ = "simulation_settings"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    is_running: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    threshold_kw: Mapped[float] = mapped_column(Float, nullable=False)
    sampling_rate_ms: Mapped[int] = mapped_column(Integer, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
