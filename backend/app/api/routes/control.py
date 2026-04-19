from fastapi import APIRouter, Body
from pydantic import BaseModel

from app.schemas.dashboard import ControlActionResponse, ControlSettingsUpdate, SimulationState
from app.services.simulation import simulation_service

router = APIRouter(tags=["control"])


@router.get("/control/state", response_model=SimulationState)
def get_control_state() -> SimulationState:
    return simulation_service.get_state()


@router.post("/control/start", response_model=ControlActionResponse)
def start_simulation() -> ControlActionResponse:
    simulation_service.start()
    return ControlActionResponse(message="Simulation started.", state=simulation_service.get_state())


@router.post("/control/stop", response_model=ControlActionResponse)
def stop_simulation() -> ControlActionResponse:
    simulation_service.stop()
    return ControlActionResponse(message="Simulation stopped.", state=simulation_service.get_state())


@router.post("/control/reset", response_model=ControlActionResponse)
def reset_simulation() -> ControlActionResponse:
    simulation_service.reset()
    return ControlActionResponse(message="Simulation reset.", state=simulation_service.get_state())


@router.post("/control/settings", response_model=ControlActionResponse)
def update_settings(payload: ControlSettingsUpdate) -> ControlActionResponse:
    simulation_service.update_settings(payload)
    return ControlActionResponse(message="Control settings updated.", state=simulation_service.get_state())


class ScenarioPayload(BaseModel):
    scenario: str

@router.post("/control/inject-scenario", response_model=ControlActionResponse)
def inject_scenario(payload: ScenarioPayload) -> ControlActionResponse:
    simulation_service.trigger_scenario(payload.scenario)
    return ControlActionResponse(message=f"Scenario '{payload.scenario}' triggered.", state=simulation_service.get_state())


from app.schemas.dashboard import TicketUpdatePayload

@router.post("/control/ticket/{ticket_id}/status", response_model=ControlActionResponse)
def update_ticket_status(ticket_id: str, payload: TicketUpdatePayload) -> ControlActionResponse:
    simulation_service.update_ticket_status(ticket_id, payload.status)
    return ControlActionResponse(message=f"Ticket {ticket_id} updated.", state=simulation_service.get_state())
