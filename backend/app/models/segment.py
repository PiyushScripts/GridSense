from sqlalchemy import Float, String
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class SegmentRecord(Base):
    __tablename__ = "segments"

    id: Mapped[str] = mapped_column(String(50), primary_key=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    feeder_code: Mapped[str] = mapped_column(String(50), nullable=False, unique=True)
    nominal_input_kw: Mapped[float] = mapped_column(Float, nullable=False)
