from fastapi import APIRouter

from app.schemas.dashboard import AlertEntry, ChartBundle, DashboardPayload, SegmentStatus
from app.services.simulation import simulation_service

router = APIRouter(tags=["dashboard"])


@router.get("/dashboard", response_model=DashboardPayload)
def get_dashboard() -> DashboardPayload:
    return simulation_service.get_dashboard_payload()


@router.get("/segments", response_model=list[SegmentStatus])
def get_segments() -> list[SegmentStatus]:
    return simulation_service.get_segments()


@router.get("/alerts", response_model=list[AlertEntry])
def get_alerts() -> list[AlertEntry]:
    return simulation_service.get_alerts()


@router.get("/charts", response_model=ChartBundle)
def get_charts() -> ChartBundle:
    return simulation_service.get_charts()
