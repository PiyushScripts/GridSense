from pathlib import Path

from fastapi import FastAPI, WebSocket
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import control, dashboard, health
from app.services.simulation import simulation_service

app = FastAPI(
    title="Smart Electricity Monitoring API",
    version="0.1.0",
    description="Backend API for the smart electricity monitoring dashboard.",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router, prefix="/api")
app.include_router(dashboard.router, prefix="/api")
app.include_router(control.router, prefix="/api")

static_dir = Path(__file__).resolve().parent / "static"
app.mount("/static", StaticFiles(directory=static_dir), name="static")


@app.get("/", include_in_schema=False)
def root() -> FileResponse:
    return FileResponse(static_dir / "index.html")


@app.websocket("/ws/monitoring")
async def monitoring_socket(websocket: WebSocket) -> None:
    await simulation_service.stream_dashboard(websocket)
