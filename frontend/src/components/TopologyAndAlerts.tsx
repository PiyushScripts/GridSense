import type { AlertEntry, OverviewMetrics, SegmentStatus } from "../types";

interface TopologyAndAlertsProps {
  overview: OverviewMetrics | null;
  segments: SegmentStatus[];
  alerts: AlertEntry[];
}

function formatNumber(value: number): string {
  return value.toFixed(2);
}

function buildAlertTone(level: AlertEntry["level"]): string {
  if (level === "danger") return "log-danger";
  if (level === "warning") return "log-warning";
  if (level === "success") return "log-success";
  return "log-info";
}

function formatAlertTime(timestamp: string): string {
  return new Date(timestamp).toLocaleTimeString();
}

export function TopologyAndAlerts({
  overview,
  segments,
  alerts,
}: TopologyAndAlertsProps) {
  return (
    <div className="dual-panel">
      <section id="network-section" className="section panel-left">
        <h2 className="section-title">Network Topology</h2>
        <div className="network-diagram">
          <div className="node node-transformer">
            <div className="node-icon">GRID</div>
            <div className="node-label">Transformer</div>
            <div className="node-value">
              {overview ? formatNumber(overview.total_input_power_kw) : "--"} kW
            </div>
          </div>
          <div className="network-lines">
            <div className="line line-1"></div>
            <div className="line line-2"></div>
            <div className="line line-3"></div>
          </div>
          <div className="segment-nodes">
            {segments.map((segment) => (
              <div
                key={segment.segment_id}
                className={`node node-segment ${
                  segment.status === "theft" ? "node-theft" : segment.status === "warning" ? "node-warning" : "node-normal"
                }`}
              >
                <div className="node-icon">CHK</div>
                <div className="node-label">{segment.name}</div>
                <div className="node-value">{formatNumber(segment.input_power_kw)} kW In</div>
                <div className="node-status">
                  {segment.status === "theft" ? "Theft Risk" : segment.status === "warning" ? "Warning" : "Normal"}
                </div>
                {segment.status === "theft" ? <div className="theft-glow"></div> : null}
                
                {/* Meters visualization inside segment */}
                <div className="segment-meters">
                  {segment.meters.map(m => (
                    <div key={m.meter_id} className={`meter-dot ${m.status === "tampered" ? "meter-tampered" : "meter-normal"}`} title={`Meter ${m.meter_id}: ${m.consumption_kw}kW`}></div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="alert-log-section" className="section panel-right">
        <h2 className="section-title">Alert Log</h2>
        <div className="alert-log">
          {alerts.map((alert) => (
            <article key={alert.id} className={`log-entry ${buildAlertTone(alert.level)}`}>
              <div className="log-time">{formatAlertTime(alert.timestamp)}</div>
              <div className="log-message">
                <strong>{alert.rule_triggered !== "system" ? `[${alert.rule_triggered}] ` : ""}</strong>
                {alert.message}
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
