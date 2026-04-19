import type { DashboardPayload } from "../types";

interface OverviewSectionProps {
  dashboard: DashboardPayload | null;
}

function formatNumber(value: number): string {
  return value.toFixed(2);
}

export function OverviewSection({ dashboard }: OverviewSectionProps) {
  const isAlert = dashboard?.overview.system_status === "alert";

  return (
    <section id="overview-section" className="section">
      <h2 className="section-title">System Overview</h2>
      <div className="overview-cards">
        <article className="card card-power">
          <div className="card-icon">IN</div>
          <div className="card-content">
            <span className="card-label">Total Input Power</span>
            <span className="card-value">
              {dashboard ? formatNumber(dashboard.overview.total_input_power_kw) : "--"}{" "}
              <small>kW</small>
            </span>
          </div>
          <div className="card-trend trend-stable">Grid Feed</div>
        </article>
        <article className="card card-consumption">
          <div className="card-icon">OUT</div>
          <div className="card-content">
            <span className="card-label">Total Billed Consumption</span>
            <span className="card-value">
              {dashboard ? formatNumber(dashboard.overview.total_consumption_kw) : "--"}{" "}
              <small>kW</small>
            </span>
          </div>
          <div className="card-trend trend-up">Live Draw</div>
        </article>
        <article className="card card-loss">
          <div className="card-icon">LINE</div>
          <div className="card-content">
            <span className="card-label">Travel Loss</span>
            <span className="card-value">
              {dashboard ? formatNumber(dashboard.overview.total_travel_loss_kw) : "--"} <small>kW</small>
            </span>
          </div>
          <div className="card-trend trend-stable">
            {dashboard ? `${dashboard.overview.travel_loss_percent.toFixed(2)}%` : "--"}
          </div>
        </article>
        <article className="card card-theft">
          <div className="card-icon">THEFT</div>
          <div className="card-content">
            <span className="card-label">Estimated Theft</span>
            <span className="card-value">
              {dashboard ? formatNumber(dashboard.overview.total_theft_kw) : "--"} <small>kW</small>
            </span>
          </div>
          <div className={`card-trend ${isAlert ? "trend-danger" : "trend-stable"}`}>
            {dashboard ? `${dashboard.overview.theft_percent.toFixed(2)}%` : "--"}
          </div>
        </article>
        <article className="card card-status">
          <div className="card-icon">STATE</div>
          <div className="card-content">
            <span className="card-label">System Status</span>
            <span className={`card-value ${isAlert ? "status-danger" : "status-normal"}`}>
              {isAlert ? "THEFT DETECTED" : "NORMAL"}
            </span>
          </div>
          <div className={`card-trend ${isAlert ? "trend-danger" : "trend-up"}`}>
            {dashboard?.simulation.is_running ? "Simulation Active" : "Simulation Ready"}
          </div>
        </article>
      </div>
    </section>
  );
}
