from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field


SystemStatus = Literal["normal", "alert"]
SegmentHealth = Literal["normal", "theft", "warning"]
AlertLevel = Literal["info", "warning", "danger", "success"]
TicketStatus = Literal["open", "acknowledged", "resolved", "closed"]


class OverviewMetrics(BaseModel):
    total_input_power_kw: float
    total_consumption_kw: float
    total_loss_kw: float
    loss_percent: float
    total_travel_loss_kw: float
    travel_loss_percent: float
    total_theft_kw: float
    theft_percent: float
    system_status: SystemStatus
    active_alert_message: str


class MeterStatus(BaseModel):
    meter_id: str
    peer_group: str
    consumption_kw: float
    peer_avg_kw: float
    status: Literal["normal", "tampered"]


class SegmentStatus(BaseModel):
    segment_id: str
    name: str
    input_power_kw: float
    consumption_kw: float
    loss_kw: float
    loss_percent: float
    travel_loss_kw: float
    travel_loss_percent: float
    theft_kw: float
    theft_percent: float
    technical_loss_percent: float
    rolling_30d_theft_percent: float
    meters: list[MeterStatus]
    status: SegmentHealth
    recommended_action: str


class AlertEntry(BaseModel):
    id: str
    level: AlertLevel
    message: str
    rule_triggered: Literal["rule1_realtime", "rule2_persistent", "rule3_peer", "system"]
    segment_id: str | None = None
    meter_id: str | None = None
    timestamp: datetime


class Ticket(BaseModel):
    id: str
    title: str
    description: str
    status: TicketStatus
    rule_triggered: str
    segment_id: str | None = None
    meter_id: str | None = None
    created_at: datetime


class ChartSeries(BaseModel):
    labels: list[str]
    input_power_kw: list[float] = Field(default_factory=list)
    consumption_kw: list[float] = Field(default_factory=list)
    loss_kw: list[float] = Field(default_factory=list)


class ChartBundle(BaseModel):
    power: ChartSeries
    loss: ChartSeries


class SimulationState(BaseModel):
    is_running: bool
    sampling_rate_ms: int
    last_updated: datetime
    active_scenario: str | None = None


class DashboardPayload(BaseModel):
    overview: OverviewMetrics
    segments: list[SegmentStatus]
    alerts: list[AlertEntry]
    tickets: list[Ticket]
    charts: ChartBundle
    simulation: SimulationState


class TicketUpdatePayload(BaseModel):
    status: TicketStatus


class ControlSettingsUpdate(BaseModel):
    sampling_rate_ms: int | None = Field(default=None, ge=500, le=5000)


class ControlActionResponse(BaseModel):
    message: str
    state: SimulationState
