import type { SegmentStatus } from "../types";

interface SegmentsSectionProps {
  segments: SegmentStatus[];
}

function formatNumber(value: number): string {
  return value.toFixed(2);
}

export function SegmentsSection({ segments }: SegmentsSectionProps) {
  return (
    <section id="segment-section" className="section">
      <h2 className="section-title">Feeder / Segment Status</h2>
      <div className="segment-table-wrapper">
        <table className="segment-table">
          <thead>
            <tr>
              <th>Segment</th>
              <th>Input (kW)</th>
              <th>Billed (kW)</th>
              <th>Travel Loss (kW)</th>
              <th>Theft (kW)</th>
              <th>Theft %</th>
              <th>Tech Loss %</th>
              <th>30-Day Theft Avg</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {segments.map((segment) => (
              <tr
                key={segment.segment_id}
                className={segment.status !== "normal" ? (segment.status === "theft" ? "row-theft" : "row-warning") : undefined}
              >
                <td>{segment.name}</td>
                <td>{formatNumber(segment.input_power_kw)}</td>
                <td>{formatNumber(segment.consumption_kw)}</td>
                <td>{formatNumber(segment.travel_loss_kw)}</td>
                <td>{formatNumber(segment.theft_kw)}</td>
                <td>{segment.theft_percent.toFixed(2)}%</td>
                <td>{segment.technical_loss_percent.toFixed(1)}%</td>
                <td>{segment.rolling_30d_theft_percent.toFixed(1)}%</td>
                <td>
                  <span
                    className={`status-badge ${
                      segment.status === "theft" ? "badge-theft" : segment.status === "warning" ? "badge-warning" : "badge-normal"
                    }`}
                  >
                    {segment.status === "theft" ? "Theft Risk" : segment.status === "warning" ? "Warning" : "Normal"}
                  </span>
                </td>
                <td>
                  <button
                    type="button"
                    className={`btn-inspect ${
                      segment.status === "theft" ? "btn-inspect-danger" : segment.status === "warning" ? "btn-inspect-warning" : ""
                    }`}
                  >
                    {segment.recommended_action}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
