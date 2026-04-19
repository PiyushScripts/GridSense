import { useMemo } from "react";

import type { DashboardPayload, SegmentStatus } from "../types";

interface AnalyticsSectionProps {
  dashboard: DashboardPayload | null;
}

function formatNumber(value: number): string {
  return value.toFixed(2);
}

function miniSeries(values: number[] = []): string {
  if (!values.length) return "";
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  return values
    .map((value, index) => {
      const x = (index / Math.max(values.length - 1, 1)) * 100;
      const y = 100 - ((value - min) / range) * 100;
      return `${x},${y}`;
    })
    .join(" ");
}

function distributionWidth(segment: SegmentStatus, totalConsumption: number): string {
  return `${Math.min((segment.consumption_kw / Math.max(totalConsumption, 1)) * 100, 100)}%`;
}

export function AnalyticsSection({ dashboard }: AnalyticsSectionProps) {
  const powerLine = useMemo(
    () => miniSeries(dashboard?.charts?.power?.input_power_kw || []),
    [dashboard],
  );
  const lossLine = useMemo(() => miniSeries(dashboard?.charts?.loss?.loss_kw || []), [dashboard]);

  return (
    <section id="graph-section" className="section">
      <h2 className="section-title">Analytics and Graphs</h2>
      <div className="graph-grid">
        <article className="graph-card">
          <h3>Input Power vs Consumption</h3>
          <div className="chart-summary">
            <strong>{dashboard && dashboard.charts?.power?.labels?.length ? dashboard.charts.power.labels.at(-1) : "Loading"}</strong>
            <span>
              Input {dashboard ? formatNumber(dashboard.overview.total_input_power_kw) : "--"} kW
            </span>
            <span>
              Consumption{" "}
              {dashboard ? formatNumber(dashboard.overview.total_consumption_kw) : "--"} kW
            </span>
          </div>
          <svg viewBox="0 0 100 100" className="chart-svg" role="img" aria-label="Power trend">
            <polyline points={powerLine} className="chart-line chart-line-primary" />
          </svg>
        </article>
        <article className="graph-card">
          <h3>Total Real-Time Gap (kW)</h3>
          <div className="chart-summary">
            <strong>Current gap</strong>
            <span>{dashboard ? formatNumber(dashboard.overview.total_loss_kw) : "--"} kW gross gap</span>
            <span>
              Travel loss {dashboard ? formatNumber(dashboard.overview.total_travel_loss_kw) : "--"} kW
            </span>
            <span>
              Estimated theft {dashboard ? formatNumber(dashboard.overview.total_theft_kw) : "--"} kW
            </span>
          </div>
          <svg viewBox="0 0 100 100" className="chart-svg" role="img" aria-label="Loss trend">
            <polyline points={lossLine} className="chart-line chart-line-danger" />
          </svg>
        </article>
        <article className="graph-card" style={{ gridColumn: "1 / -1" }}>
          <h3>Segment-wise Load Distribution</h3>
          <div className="distribution-list">
            {dashboard?.segments.map((segment) => (
              <div key={segment.segment_id} className="distribution-row">
                <span>{segment.name}</span>
                <div className="distribution-bar-track">
                  <div
                    className={`distribution-bar ${
                      segment.status === "theft" ? "distribution-bar-danger" : ""
                    }`}
                    style={{
                      width: distributionWidth(
                        segment,
                        dashboard.overview.total_consumption_kw,
                      ),
                    }}
                  ></div>
                </div>
                <strong>{formatNumber(segment.consumption_kw)} kW</strong>
              </div>
            ))}
          </div>
        </article>
      </div>
    </section>
  );
}
