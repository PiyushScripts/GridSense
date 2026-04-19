import asyncio
import math
import random
from collections import deque
from dataclasses import dataclass
from datetime import UTC, datetime

from fastapi import WebSocket, WebSocketDisconnect

from app.core.config import settings
from app.schemas.dashboard import (
    AlertEntry,
    ChartBundle,
    ChartSeries,
    ControlSettingsUpdate,
    DashboardPayload,
    MeterStatus,
    OverviewMetrics,
    SegmentStatus,
    SimulationState,
    Ticket,
)


@dataclass
class MeterDef:
    id: str
    peer_group: str
    base_consumption: float


@dataclass
class SegmentDef:
    id: str
    name: str
    technical_loss_percent: float
    meters: list[MeterDef]


class SimulationService:
    def __init__(self) -> None:
        self._rng = random.Random(42)
        self._segments = [
            SegmentDef(
                id="seg-A", name="Segment A (Poles 1-4)", technical_loss_percent=2.5,
                meters=[
                    MeterDef("m-1", "small", 5.0), MeterDef("m-2", "small", 6.0),
                    MeterDef("m-3", "medium", 12.0), MeterDef("m-4", "large", 20.0)
                ]
            ),
            SegmentDef(
                id="seg-B", name="Segment B (Poles 5-8)", technical_loss_percent=2.0,
                meters=[
                    MeterDef("m-5", "small", 5.5), MeterDef("m-6", "medium", 14.0),
                    MeterDef("m-7", "medium", 11.0), MeterDef("m-8", "large", 19.0)
                ]
            ),
            SegmentDef(
                id="seg-C", name="Segment C (Poles 9-12)", technical_loss_percent=3.0,
                meters=[
                    MeterDef("m-9", "small", 4.5), MeterDef("m-10", "small", 5.0),
                    MeterDef("m-11", "medium", 13.0), MeterDef("m-12", "large", 22.0)
                ]
            ),
        ]
        self._is_running = False
        self._sampling_rate_ms = settings.default_sampling_rate_ms
        self._last_updated = datetime.now(UTC)
        self._tick = 0
        self._history = deque(maxlen=20)
        self._alerts: deque[AlertEntry] = deque(maxlen=30)
        self._tickets: dict[str, Ticket] = {}
        self._active_scenario: str | None = None

        self._daily_theft_history: dict[str, deque[float]] = {
            s.id: deque(maxlen=30) for s in self._segments
        }
        self._peer_avg = {"small": 5.0, "medium": 12.5, "large": 20.3}

        self.reset()

    def reset(self) -> None:
        self._is_running = False
        self._sampling_rate_ms = settings.default_sampling_rate_ms
        self._last_updated = datetime.now(UTC)
        self._tick = 0
        self._history.clear()
        self._alerts.clear()
        self._tickets.clear()
        self._active_scenario = None

        for s in self._segments:
            self._daily_theft_history[s.id].clear()
            for _ in range(30):
                self._daily_theft_history[s.id].append(
                    max(0.0, self._rng.uniform(-0.3, 0.4))
                )

        for _ in range(8):
            self._advance(force=True)

    def trigger_scenario(self, scenario: str) -> None:
        self._active_scenario = scenario
        self._last_updated = datetime.now(UTC)

        if scenario == "old_theft":
            self._daily_theft_history["seg-C"].clear()
            for _ in range(30):
                self._daily_theft_history["seg-C"].append(
                    14.0 + self._rng.uniform(-1.0, 1.0)
                )
        elif scenario == "reset":
            self.reset()

        self._advance(force=True)

    def start(self) -> None:
        self._is_running = True
        self._last_updated = datetime.now(UTC)

    def stop(self) -> None:
        self._is_running = False
        self._last_updated = datetime.now(UTC)

    def update_settings(self, payload: ControlSettingsUpdate) -> None:
        if payload.sampling_rate_ms is not None:
            self._sampling_rate_ms = payload.sampling_rate_ms
        self._last_updated = datetime.now(UTC)

    def get_state(self) -> SimulationState:
        return SimulationState(
            is_running=self._is_running,
            sampling_rate_ms=self._sampling_rate_ms,
            last_updated=self._last_updated,
            active_scenario=self._active_scenario,
        )

    def get_dashboard_payload(self) -> DashboardPayload:
        if self._is_running:
            self._advance()
        overview, segments = self._build_overview_and_segments()
        return DashboardPayload(
            overview=overview,
            segments=segments,
            alerts=list(self._alerts),
            tickets=list(self._tickets.values()),
            charts=self.get_charts(),
            simulation=self.get_state(),
        )

    def get_charts(self) -> ChartBundle:
        history = list(self._history)
        labels = [point["label"] for point in history]
        input_power = [point["total_input_kw"] for point in history]
        consumption = [point["total_consumption_kw"] for point in history]
        loss = [point["total_loss_kw"] for point in history]

        return ChartBundle(
            power=ChartSeries(
                labels=labels,
                input_power_kw=input_power,
                consumption_kw=consumption,
            ),
            loss=ChartSeries(
                labels=labels,
                loss_kw=loss,
            ),
        )

    async def stream_dashboard(self, websocket: WebSocket) -> None:
        await websocket.accept()
        try:
            while True:
                payload_json = self.get_dashboard_payload().json()
                await websocket.send_text(payload_json)
                await asyncio.sleep(self._sampling_rate_ms / 1000)
        except WebSocketDisconnect:
            return

    def _advance(self, force: bool = False) -> None:
        if not self._is_running and not force:
            return

        self._tick += 1
        timestamp = datetime.now(UTC)
        
        snapshot_segments = []
        total_input = 0.0
        total_consumption = 0.0
        total_loss = 0.0
        total_travel_loss = 0.0
        total_theft = 0.0

        for index, s in enumerate(self._segments):
            wave = math.sin((self._tick + index) / 2.4)

            segment_meters = []
            actual_meter_sum = 0.0
            billed_meter_sum = 0.0

            for m in s.meters:
                actual_val = m.base_consumption + wave * (m.base_consumption * 0.05) + self._rng.uniform(-0.2, 0.2)
                billed_val = actual_val

                # Apply Scenario 2: Meter Tampering on Meter 5 (Segment B)
                if self._active_scenario == "meter_tampering" and m.id == "m-5":
                    billed_val = actual_val * 0.35  # Reduced to 35%

                actual_meter_sum += actual_val
                billed_meter_sum += billed_val

                is_tampered = False
                if billed_val < (self._peer_avg[m.peer_group] * 0.4):
                    is_tampered = True

                segment_meters.append({
                    "meter_id": m.id,
                    "peer_group": m.peer_group,
                    "consumption_kw": round(billed_val, 2),
                    "peer_avg_kw": round(self._peer_avg[m.peer_group], 2),
                    "status": "tampered" if is_tampered else "normal"
                })
            
            # Segment Checkpoint Logic
            # Checkpoint reads the actual power entering the segment.
            # Power In = Actual Meters + Technical Loss + Real Theft (Hooks)
            actual_tech_loss = (s.technical_loss_percent / 100) * actual_meter_sum

            hook_theft_kw = 0.0
            # Apply Scenario 1: Hook on Segment A
            if self._active_scenario == "hook" and s.id == "seg-A":
                hook_theft_kw = 25.0
            # Apply Scenario 3: Old Theft on Segment C (happening in real time too, so 18% loss)
            if self._active_scenario == "old_theft" and s.id == "seg-C":
                hook_theft_kw = actual_meter_sum * 0.18

            checkpoint_in = actual_meter_sum + actual_tech_loss + hook_theft_kw

            gross_loss_kw = checkpoint_in - billed_meter_sum
            travel_loss_kw = actual_tech_loss
            estimated_theft_kw = max(gross_loss_kw - travel_loss_kw, 0.0)
            gross_loss_percent = (gross_loss_kw / checkpoint_in) * 100 if checkpoint_in > 0 else 0
            travel_loss_percent = (travel_loss_kw / checkpoint_in) * 100 if checkpoint_in > 0 else 0
            theft_percent = (estimated_theft_kw / checkpoint_in) * 100 if checkpoint_in > 0 else 0

            # Update history (if it's a "day" - simplified to just append per tick for simulation)
            if self._tick % 5 == 0:
                self._daily_theft_history[s.id].append(theft_percent)

            avg_30d = (
                sum(self._daily_theft_history[s.id]) / len(self._daily_theft_history[s.id])
                if self._daily_theft_history[s.id]
                else 0.0
            )

            snapshot_segments.append({
                "segment_id": s.id,
                "name": s.name,
                "input_power_kw": round(checkpoint_in, 2),
                "consumption_kw": round(billed_meter_sum, 2),
                "loss_kw": round(gross_loss_kw, 2),
                "loss_percent": round(gross_loss_percent, 2),
                "travel_loss_kw": round(travel_loss_kw, 2),
                "travel_loss_percent": round(travel_loss_percent, 2),
                "theft_kw": round(estimated_theft_kw, 2),
                "theft_percent": round(theft_percent, 2),
                "technical_loss_percent": s.technical_loss_percent,
                "rolling_30d_theft_percent": round(avg_30d, 2),
                "meters": segment_meters,
                "theft_percent_raw": theft_percent,
            })

            total_input += checkpoint_in
            total_consumption += billed_meter_sum
            total_loss += gross_loss_kw
            total_travel_loss += travel_loss_kw
            total_theft += estimated_theft_kw

        self._history.append({
            "label": timestamp.strftime("%H:%M:%S"),
            "total_input_kw": round(total_input, 2),
            "total_consumption_kw": round(total_consumption, 2),
            "total_loss_kw": round(total_loss, 2),
            "total_travel_loss_kw": round(total_travel_loss, 2),
            "total_theft_kw": round(total_theft, 2),
            "segments": snapshot_segments,
        })
        self._last_updated = timestamp
        self._run_detection_rules(snapshot_segments, timestamp)

    def _build_overview_and_segments(self) -> tuple[OverviewMetrics, list[SegmentStatus]]:
        latest = self._history[-1]
        segments: list[SegmentStatus] = []
        has_alert = False
        active_message = "All monitored segments are within normal thresholds."

        for raw_segment in latest["segments"]:
            status = "normal"
            action = "Continue monitoring."

            # Determine segment status based on rules triggered
            if raw_segment["theft_percent_raw"] > 10.0:
                status = "theft"
                action = "Dispatch crew to inspect line for hooks."
                has_alert = True
                active_message = f"Immediate hook theft detected in {raw_segment['name']}."
            elif raw_segment["rolling_30d_theft_percent"] > 8.0:
                status = "warning"
                action = "Schedule audit. Persistent theft detected."
                if not has_alert:
                    active_message = f"Persistent theft detected in {raw_segment['name']} over 30 days."

            for m in raw_segment["meters"]:
                if m["status"] == "tampered":
                    status = "theft"
                    action = f"Inspect meter {m['meter_id']} for bypass/tampering."
                    has_alert = True
                    active_message = f"Meter tampering detected at {m['meter_id']}."

            segments.append(
                SegmentStatus(
                    segment_id=raw_segment["segment_id"],
                    name=raw_segment["name"],
                    input_power_kw=raw_segment["input_power_kw"],
                    consumption_kw=raw_segment["consumption_kw"],
                    loss_kw=raw_segment["loss_kw"],
                    loss_percent=raw_segment["loss_percent"],
                    travel_loss_kw=raw_segment["travel_loss_kw"],
                    travel_loss_percent=raw_segment["travel_loss_percent"],
                    theft_kw=raw_segment["theft_kw"],
                    theft_percent=raw_segment["theft_percent"],
                    technical_loss_percent=raw_segment["technical_loss_percent"],
                    rolling_30d_theft_percent=raw_segment["rolling_30d_theft_percent"],
                    meters=[MeterStatus(**m) for m in raw_segment["meters"]],
                    status=status,
                    recommended_action=action,
                )
            )

        overview = OverviewMetrics(
            total_input_power_kw=float(latest["total_input_kw"]),
            total_consumption_kw=float(latest["total_consumption_kw"]),
            total_loss_kw=float(latest["total_loss_kw"]),
            loss_percent=round((float(latest["total_loss_kw"]) / float(latest["total_input_kw"])) * 100, 2) if float(latest["total_input_kw"]) > 0 else 0.0,
            total_travel_loss_kw=float(latest["total_travel_loss_kw"]),
            travel_loss_percent=round((float(latest["total_travel_loss_kw"]) / float(latest["total_input_kw"])) * 100, 2) if float(latest["total_input_kw"]) > 0 else 0.0,
            total_theft_kw=float(latest["total_theft_kw"]),
            theft_percent=round((float(latest["total_theft_kw"]) / float(latest["total_input_kw"])) * 100, 2) if float(latest["total_input_kw"]) > 0 else 0.0,
            system_status="alert" if has_alert else "normal",
            active_alert_message=active_message,
        )
        return overview, segments

    def _run_detection_rules(self, snapshot_segments: list[dict], timestamp: datetime) -> None:
        for segment in snapshot_segments:
            # Rule 1 - Real-Time Theft (>10%)
            if segment["theft_percent_raw"] > 10.0:
                self._add_alert(
                    "rule1_realtime",
                    "danger",
                    f"Rule 1 Alert: Estimated theft of {round(segment['theft_percent_raw'], 1)}% detected in {segment['name']}. Possible direct hook.",
                    timestamp,
                    segment_id=segment["segment_id"]
                )
                self._create_ticket_if_needed(
                    "rule1_realtime",
                    f"Direct Hook - {segment['name']}",
                    f"Estimated theft reached {round(segment['theft_percent_raw'], 1)}% after travel-loss adjustment.",
                    timestamp,
                    segment_id=segment["segment_id"]
                )

            # Rule 2 - Persistent Theft Tracker (>8% over 30 days)
            if segment["rolling_30d_theft_percent"] > 8.0:
                self._add_alert(
                    "rule2_persistent",
                    "warning",
                    f"Rule 2 Alert: 30-day rolling average theft is {round(segment['rolling_30d_theft_percent'], 1)}% in {segment['name']}. Likely ongoing theft.",
                    timestamp,
                    segment_id=segment["segment_id"]
                )
                self._create_ticket_if_needed(
                    "rule2_persistent",
                    f"Persistent Theft - {segment['name']}",
                    f"30-day rolling average theft is {round(segment['rolling_30d_theft_percent'], 1)}%.",
                    timestamp,
                    segment_id=segment["segment_id"]
                )

            # Rule 3 - Peer Comparison (<40% of peer group)
            for m in segment["meters"]:
                if m["status"] == "tampered":
                    self._add_alert(
                        "rule3_peer",
                        "danger",
                        f"Rule 3 Alert: Meter {m['meter_id']} consumption ({m['consumption_kw']} kW) is below 40% of '{m['peer_group']}' peer average ({m['peer_avg_kw']} kW).",
                        timestamp,
                        segment_id=segment["segment_id"],
                        meter_id=m["meter_id"]
                    )
                    self._create_ticket_if_needed(
                        "rule3_peer",
                        f"Meter Tampering - {m['meter_id']}",
                        f"Consumption {m['consumption_kw']} kW is below 40% of '{m['peer_group']}' peer average.",
                        timestamp,
                        segment_id=segment["segment_id"],
                        meter_id=m["meter_id"]
                    )

        if not self._alerts or self._alerts[0].level != "success" and self._alerts[0].rule_triggered != "system":
            # Check if any alert was triggered in this tick
            pass # Keep previous alerts
            
    def _add_alert(self, rule: str, level: str, message: str, timestamp: datetime, segment_id: str = None, meter_id: str = None) -> None:
        # Prevent spamming the exact same alert message
        if self._alerts and self._alerts[0].message == message:
            return
        self._alerts.appendleft(
            AlertEntry(
                id=f"alert-{timestamp.timestamp()}-{random.randint(1000, 9999)}",
                level=level,
                message=message,
                rule_triggered=rule,
                segment_id=segment_id,
                meter_id=meter_id,
                timestamp=timestamp,
            )
        )

    def _create_ticket_if_needed(self, rule: str, title: str, description: str, timestamp: datetime, segment_id: str = None, meter_id: str = None) -> None:
        for t in self._tickets.values():
            if t.status in ["open", "acknowledged"] and t.rule_triggered == rule and t.segment_id == segment_id and t.meter_id == meter_id:
                return
                
        ticket_id = f"TKT-{random.randint(10000, 99999)}"
        self._tickets[ticket_id] = Ticket(
            id=ticket_id,
            title=title,
            description=description,
            status="open",
            rule_triggered=rule,
            segment_id=segment_id,
            meter_id=meter_id,
            created_at=timestamp
        )

    def update_ticket_status(self, ticket_id: str, new_status: str) -> None:
        if ticket_id in self._tickets:
            self._tickets[ticket_id].status = new_status
            self._last_updated = datetime.now(UTC)


simulation_service = SimulationService()
