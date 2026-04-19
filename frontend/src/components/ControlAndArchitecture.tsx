import type { SimulationState } from "../types";

interface ControlAndArchitectureProps {
  simulation: SimulationState | null;
  samplingRate: number;
  actionDisabled: boolean;
  onSamplingRateChange: (value: number) => void;
  onStart: () => void;
  onStop: () => void;
  onReset: () => void;
  onInjectScenario: (scenario: string) => void;
  onSave: () => void;
}

export function ControlAndArchitecture({
  simulation,
  samplingRate,
  actionDisabled,
  onSamplingRateChange,
  onStart,
  onStop,
  onReset,
  onInjectScenario,
  onSave,
}: ControlAndArchitectureProps) {
  return (
    <div className="dual-panel">
      <section id="control-section" className="section panel-left">
        <h2 className="section-title">Simulation Controls</h2>
        <div className="control-panel">
          <div className="control-status">
            <div className="status-indicator">
              <span className={`sim-dot ${simulation?.is_running ? "running" : ""}`}></span>
              <span>{simulation?.is_running ? "Simulation Running" : "Simulation Ready"}</span>
            </div>
            {simulation?.active_scenario && (
              <div className="active-scenario-badge">
                Active Scenario: <strong>{simulation.active_scenario}</strong>
              </div>
            )}
          </div>
          <div className="control-buttons">
            <button
              type="button"
              className="btn btn-start"
              disabled={actionDisabled || simulation?.is_running}
              onClick={onStart}
            >
              Start
            </button>
            <button
              type="button"
              className="btn btn-stop"
              disabled={actionDisabled || !simulation?.is_running}
              onClick={onStop}
            >
              Stop
            </button>
            <button type="button" className="btn btn-reset" disabled={actionDisabled} onClick={onReset}>
              Reset
            </button>
          </div>
          <div className="scenario-buttons">
            <h3 className="sub-title">Inject Scenarios</h3>
            <div className="scenario-grid">
               <button 
                  type="button" 
                  className="btn btn-scenario btn-scenario-hook" 
                  disabled={actionDisabled || !simulation?.is_running} 
                  onClick={() => onInjectScenario("hook")}
                >
                  Direct Hook (Rule 1)
                </button>
                <button 
                  type="button" 
                  className="btn btn-scenario btn-scenario-tamper" 
                  disabled={actionDisabled || !simulation?.is_running} 
                  onClick={() => onInjectScenario("meter_tampering")}
                >
                  Meter Tampering (Rule 3)
                </button>
                <button 
                  type="button" 
                  className="btn btn-scenario btn-scenario-old" 
                  disabled={actionDisabled || !simulation?.is_running} 
                  onClick={() => onInjectScenario("old_theft")}
                >
                  Old Theft (Rule 2)
                </button>
            </div>
          </div>
          <div className="control-params">
            <label className="param">
              <span>Sampling Rate (ms)</span>
              <input
                type="range"
                min="500"
                max="5000"
                step="100"
                value={samplingRate}
                onChange={(event) => onSamplingRateChange(Number(event.target.value))}
              />
              <strong>{samplingRate}</strong>
            </label>
            <button type="button" className="btn btn-save" disabled={actionDisabled} onClick={onSave}>
              Apply Settings
            </button>
          </div>
        </div>
      </section>

      <section id="dataflow-section" className="section panel-right">
        <h2 className="section-title">GridSense Architecture</h2>
        <div className="dataflow">
          <div className="flow-step flow-active">
            <div className="flow-icon">TRANSFORMER</div>
            <div className="flow-label">Level 1 (Input)</div>
          </div>
          <div className="flow-arrow">-</div>
          <div className="flow-step flow-active">
            <div className="flow-icon">CHECKPOINTS</div>
            <div className="flow-label">Level 2 (Segments)</div>
          </div>
          <div className="flow-arrow">-</div>
          <div className="flow-step flow-active">
            <div className="flow-icon">METERS</div>
            <div className="flow-label">Level 3 (Output)</div>
          </div>
        </div>
        <div className="dataflow-description">
          <p>
            GridSense divides the distribution network into auditable segments using intermediate checkpoints.
            <br/><br/>
            <strong>Rule 1:</strong> Real-Time Theft {">"} 10% after travel-loss adjustment (Catches new hooks)<br/>
            <strong>Rule 2:</strong> Persistent Theft {">"} 8% for 7 days (Catches old theft)<br/>
            <strong>Rule 3:</strong> Peer Comparison {"<"} 40% avg (Catches meter tampering)
          </p>
        </div>
      </section>
    </div>
  );
}
