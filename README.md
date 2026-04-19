# GridSense — Smart Electricity Theft Detection System

GridSense is a rule-based monitoring platform that detects and localizes electricity theft using feeder-level energy balance logic.
It combines transformer readings, feeder checkpoints, and consumer meter data to surface suspicious loss patterns in real time and over long periods.

## Why GridSense

Power distribution networks often face high AT&C losses, especially where theft is common. Utilities can measure total loss, but identifying *where* theft is happening is difficult.

GridSense addresses this by splitting the feeder into auditable segments and applying transparent arithmetic rules (not black-box ML) to pinpoint probable theft zones and suspicious meters.

## Core Detection Logic

GridSense uses this principle:

> **Power in = Billed consumption + Technical losses + Unbilled usage**

For each segment, GridSense computes a theft gap after subtracting expected technical loss.

### Rule 1 — Real-Time Segment Gap
- Runs every interval.
- Triggers when adjusted theft in a segment exceeds threshold (default modeled as >10%).
- Best for new theft (fresh hooks or sudden bypass events).

### Rule 2 — Persistent Loss Tracker
- Maintains 30-day rolling theft trends.
- Flags segments with sustained elevated loss (modeled as >8% persistent behavior).
- Best for long-running theft that appears “normal” in short windows.

### Rule 3 — Peer Comparison
- Compares a meter against its peer group baseline.
- Flags homes with implausibly low reported use (modeled as <40% of peer norm).
- Best for meter tampering/bypass cases.

## Architecture

### Level 1: Transformer Input
- Main outgoing measurement (trusted supply baseline).

### Level 2: Feeder Checkpoints
- Intermediate poles split feeder into segments.
- Enables theft localization by segment, not just feeder-wide loss.

### Level 3: Consumer Meters
- Billed readings at household level.
- Compared against checkpoint and peer behavior.

## What This Repository Contains

This repo provides a simulation-first implementation for demos and development:

- **Backend (FastAPI)**
  - Simulates segment/meter behavior
  - Injects theft scenarios
  - Runs rule engine
  - Exposes dashboard + control APIs and WebSocket stream
- **Frontend (React + Vite + TypeScript)**
  - Real-time dashboard
  - Segment, alert, and analytics panels
  - Simulation control panel for scenario injection

## Repository Structure

```text
/backend
  /app
    /api/routes        # health, dashboard, control APIs
    /services          # simulation and detection logic
    /schemas           # response models
    /static            # served dashboard build assets
/frontend
  /src                 # React UI, hooks, API client, components
README.md
```

## Quick Start

### Prerequisites
- Python 3.10+
- Node.js 18+

### 1) Run Backend

```bash
cd /home/runner/work/GridSense/GridSense/backend
python3 -m pip install -r requirements.txt
uvicorn app.main:app --reload
```

Backend default: `http://127.0.0.1:8000`

### 2) Run Frontend (Dev)

```bash
cd /home/runner/work/GridSense/GridSense/frontend
npm install
npm run dev
```

Frontend default: `http://127.0.0.1:5173`

Set API target if needed:

```bash
VITE_API_BASE_URL=http://127.0.0.1:8000
```

## Key API Endpoints

- `GET /api/health`
- `GET /api/dashboard`
- `GET /api/segments`
- `GET /api/alerts`
- `GET /api/charts`
- `POST /api/control/start`
- `POST /api/control/stop`
- `POST /api/control/reset`
- `POST /api/control/settings`
- `POST /api/control/inject-scenario`
- `POST /api/control/ticket/{ticket_id}/status`
- `WS /ws/monitoring`

## Demo Scenarios

Use simulation controls to inject:
- **Hook theft** (segment-level sudden loss)
- **Meter tampering** (low meter vs peer baseline)
- **Old theft** (persistent rolling loss)

## Design Principles

- Explainable and auditable rule engine
- Segment-level localization for field actionability
- Technical loss-aware calculations to reduce false positives
- Simulation-ready architecture for hackathon/demo environments

## One-Line Pitch

**GridSense is a rule-based electricity theft detection system that localizes both real-time and persistent theft using segmented energy-balance analysis.**
