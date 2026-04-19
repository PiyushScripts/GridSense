import { useEffect, useMemo, useState } from "react";

import { fetchDashboard, getWebSocketUrl } from "../services/api";
import type { DashboardPayload } from "../types";

interface MonitoringState {
  dashboard: DashboardPayload | null;
  loading: boolean;
  error: string | null;
  reload: () => Promise<void>;
}

export function useMonitoring(): MonitoringState {
  const [dashboard, setDashboard] = useState<DashboardPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const socketUrl = useMemo(() => getWebSocketUrl(), []);

  const reload = async () => {
    setLoading(true);
    try {
      const payload = await fetchDashboard();
      setDashboard(payload);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load dashboard.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void reload();
  }, []);

  useEffect(() => {
    const socket = new WebSocket(socketUrl);

    socket.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data) as DashboardPayload;
        setDashboard(payload);
        setLoading(false);
        setError(null);
      } catch {
        setError("Failed to parse realtime monitoring payload.");
      }
    };

    socket.onerror = () => {
      setError((current) => current ?? "Realtime connection error.");
    };

    return () => {
      socket.close();
    };
  }, [socketUrl]);

  return {
    dashboard,
    loading,
    error,
    reload,
  };
}
