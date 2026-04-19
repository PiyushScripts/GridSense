from app.core.database import Base, engine
from app.models import AlertRecord, PowerSnapshotRecord, SegmentRecord, SimulationSettingsRecord


def initialize_database() -> None:
    _ = (AlertRecord, PowerSnapshotRecord, SegmentRecord, SimulationSettingsRecord)
    Base.metadata.create_all(bind=engine)
