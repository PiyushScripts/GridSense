export type SystemStatus = "normal" | "alert";
export type SegmentHealth = "normal" | "warning" | "theft";
export type AlertLevel = "info" | "warning" | "danger" | "success";

export interface OverviewMetrics {
  total_input_power_kw: number;
  total_consumption_kw: number;
  total_loss_kw: number;
  loss_percent: number;
  total_travel_loss_kw: number;
  travel_loss_percent: number;
  total_theft_kw: number;
  theft_percent: number;
  system_status: SystemStatus;
  active_alert_message: string;
}

export interface MeterStatus {
  meter_id: string;
  peer_group: string;
  consumption_kw: number;
  peer_avg_kw: number;
  status: "normal" | "tampered";
}

export interface SegmentStatus {
  segment_id: string;
  name: string;
  input_power_kw: number;
  consumption_kw: number;
  loss_kw: number;
  loss_percent: number;
  travel_loss_kw: number;
  travel_loss_percent: number;
  theft_kw: number;
  theft_percent: number;
  technical_loss_percent: number;
  rolling_30d_theft_percent: number;
  meters: MeterStatus[];
  status: SegmentHealth;
  recommended_action: string;
}

export interface AlertEntry {
  id: string;
  level: AlertLevel;
  message: string;
  rule_triggered: "rule1_realtime" | "rule2_persistent" | "rule3_peer" | "system";
  segment_id?: string | null;
  meter_id?: string | null;
  timestamp: string;
}

export interface ChartSeries {
  labels: string[];
  input_power_kw?: number[];
  consumption_kw?: number[];
  loss_kw?: number[];
}

export interface ChartBundle {
  power: ChartSeries;
  loss: ChartSeries;
}

export interface SimulationState {
  is_running: boolean;
  sampling_rate_ms: number;
  last_updated: string;
  active_scenario: string | null;
}

export type TicketStatus = "open" | "acknowledged" | "resolved" | "closed";

export interface Ticket {
  id: string;
  title: string;
  description: string;
  status: TicketStatus;
  rule_triggered: string;
  segment_id?: string | null;
  meter_id?: string | null;
  created_at: string;
}

export interface DashboardPayload {
  overview: OverviewMetrics;
  segments: SegmentStatus[];
  alerts: AlertEntry[];
  tickets: Ticket[];
  charts: ChartBundle;
  simulation: SimulationState;
}

export interface ControlActionResponse {
  message: string;
  state: SimulationState;
}
