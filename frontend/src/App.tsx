import { useEffect, useState } from "react";

import {
  injectScenario,
  resetSimulation,
  startSimulation,
  stopSimulation,
  updateSettings,
} from "./services/api";
import { AlertBanner } from "./components/AlertBanner";
import { AnalyticsSection } from "./components/AnalyticsSection";
import { ControlAndArchitecture } from "./components/ControlAndArchitecture";
import { Header } from "./components/Header";
import { OverviewSection } from "./components/OverviewSection";
import { SegmentsSection } from "./components/SegmentsSection";
import { StatusPanels } from "./components/StatusPanels";
import { TopologyAndAlerts } from "./components/TopologyAndAlerts";
import { useMonitoring } from "./hooks/useMonitoring";

type ActionState = "idle" | "submitting";

function formatClock(date: Date): string {
  return date.toLocaleTimeString();
}

export default function App() {
  const { dashboard, error, loading, reload } = useMonitoring();
  const [clock, setClock] = useState(() => formatClock(new Date()));
  const [actionState, setActionState] = useState<ActionState>("idle");
  const [samplingRate, setSamplingRate] = useState(2000);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setClock(formatClock(new Date()));
    }, 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!dashboard) return;
    setSamplingRate(dashboard.simulation.sampling_rate_ms);
  }, [dashboard]);

  const activeAlert = dashboard?.alerts[0] ?? null;
  const isAlert = dashboard?.overview.system_status === "alert";

  async function runControlAction(action: () => Promise<unknown>) {
    setActionState("submitting");
    try {
      await action();
      await reload();
    } finally {
      setActionState("idle");
    }
  }

  async function saveSettings() {
    await runControlAction(() =>
      updateSettings({
        sampling_rate_ms: samplingRate,
      }),
    );
  }

  return (
    <div className="app-shell">
      <Header clock={clock} />
      <AlertBanner
        isAlert={Boolean(isAlert)}
        message={dashboard?.overview.active_alert_message ?? "Loading current system state."}
      />

      <main id="dashboard-main">
        <StatusPanels
          loading={loading}
          error={error}
          activeAlertMessage={activeAlert?.message ?? null}
          hasDashboard={Boolean(dashboard)}
        />
        <OverviewSection dashboard={dashboard} />
        <SegmentsSection segments={dashboard?.segments ?? []} />
        <TopologyAndAlerts
          overview={dashboard?.overview ?? null}
          segments={dashboard?.segments ?? []}
          alerts={dashboard?.alerts ?? []}
        />
        <AnalyticsSection dashboard={dashboard} />
        <ControlAndArchitecture
          simulation={dashboard?.simulation ?? null}
          samplingRate={samplingRate}
          actionDisabled={actionState === "submitting"}
          onSamplingRateChange={setSamplingRate}
          onStart={() => void runControlAction(startSimulation)}
          onStop={() => void runControlAction(stopSimulation)}
          onReset={() => void runControlAction(resetSimulation)}
          onInjectScenario={(scenario) => void runControlAction(() => injectScenario(scenario))}
          onSave={() => void saveSettings()}
        />
      </main>

      <footer id="main-footer">
        <p>GridSense: Smart Electricity Theft Detection System</p>
        <p className="footer-sub">Rule-Based Energy Balance Monitoring</p>
      </footer>
    </div>
  );
}
