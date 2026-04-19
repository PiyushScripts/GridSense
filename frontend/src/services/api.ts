import type {
  ControlActionResponse,
  DashboardPayload,
  SimulationState,
} from "../types";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, "") ?? "http://127.0.0.1:8000";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
    },
    ...init,
  });

  if (!response.ok) {
    throw new Error(`Request failed: ${response.status} ${response.statusText}`);
  }

  return (await response.json()) as T;
}

export async function fetchDashboard(): Promise<DashboardPayload> {
  return request<DashboardPayload>("/api/dashboard");
}

export async function startSimulation(): Promise<ControlActionResponse> {
  return request<ControlActionResponse>("/api/control/start", { method: "POST" });
}

export async function stopSimulation(): Promise<ControlActionResponse> {
  return request<ControlActionResponse>("/api/control/stop", { method: "POST" });
}

export async function resetSimulation(): Promise<ControlActionResponse> {
  return request<ControlActionResponse>("/api/control/reset", { method: "POST" });
}

export async function updateSettings(
  payload: Partial<Pick<SimulationState, "sampling_rate_ms">>,
): Promise<ControlActionResponse> {
  return request<ControlActionResponse>("/api/control/settings", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function injectScenario(scenario: string): Promise<ControlActionResponse> {
  return request<ControlActionResponse>("/api/control/inject-scenario", {
    method: "POST",
    body: JSON.stringify({ scenario }),
  });
}

export function getWebSocketUrl(): string {
  const base = new URL(API_BASE_URL);
  base.protocol = base.protocol === "https:" ? "wss:" : "ws:";
  base.pathname = "/ws/monitoring";
  base.search = "";
  return base.toString();
}
