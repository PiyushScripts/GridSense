const state = {
  dashboard: null,
  socket: null,
  busy: false,
};

const elements = {
  clock: document.getElementById("header-clock"),
  statusPanel: document.getElementById("status-panel"),
  statusMessage: document.getElementById("status-message"),
  alertBanner: document.getElementById("alert-banner"),
  alertIcon: document.getElementById("alert-icon"),
  alertTitle: document.getElementById("alert-title"),
  alertMessage: document.getElementById("alert-message"),
  overviewInput: document.getElementById("overview-input"),
  overviewConsumption: document.getElementById("overview-consumption"),
  overviewTravelLoss: document.getElementById("overview-travel-loss"),
  overviewTravelLossPercent: document.getElementById("overview-travel-loss-percent"),
  overviewTheft: document.getElementById("overview-theft"),
  overviewTheftPercent: document.getElementById("overview-theft-percent"),
  overviewStatus: document.getElementById("overview-status"),
  overviewMode: document.getElementById("overview-mode"),
  transformerInput: document.getElementById("transformer-input"),
  segmentsBody: document.getElementById("segments-body"),
  segmentNodes: document.getElementById("segment-nodes"),
  alertsList: document.getElementById("alerts-list"),
  powerLabel: document.getElementById("power-label"),
  powerInputSummary: document.getElementById("power-input-summary"),
  powerConsumptionSummary: document.getElementById("power-consumption-summary"),
  lossSummary: document.getElementById("loss-summary"),
  travelLossSummary: document.getElementById("travel-loss-summary"),
  theftSummary: document.getElementById("theft-summary"),
  powerLine: document.getElementById("power-line"),
  lossLine: document.getElementById("loss-line"),
  distributionList: document.getElementById("distribution-list"),
  simulationDot: document.getElementById("simulation-dot"),
  simulationText: document.getElementById("simulation-text"),
  samplingInput: document.getElementById("sampling-input"),
  samplingValue: document.getElementById("sampling-value"),
  startButton: document.getElementById("start-button"),
  stopButton: document.getElementById("stop-button"),
  resetButton: document.getElementById("reset-button"),
  saveButton: document.getElementById("save-button"),
  btnHook: document.getElementById("btn-scenario-hook"),
  btnTamper: document.getElementById("btn-scenario-tamper"),
  btnOld: document.getElementById("btn-scenario-old"),
  activeScenarioBadge: document.getElementById("active-scenario-badge"),
  activeScenarioText: document.getElementById("active-scenario-text"),
  ticketsOpen: document.getElementById("tickets-open"),
  ticketsAcknowledged: document.getElementById("tickets-acknowledged"),
  ticketsResolved: document.getElementById("tickets-resolved"),
  ticketsClosed: document.getElementById("tickets-closed")
};

function formatNumber(value) {
  return Number(value).toFixed(2);
}

function setStatus(message) {
  if (!message) {
    elements.statusPanel.classList.add("hidden");
    elements.statusMessage.textContent = "";
    return;
  }
  elements.statusPanel.classList.remove("hidden");
  elements.statusMessage.textContent = message;
}

function buildSeries(values = []) {
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

function updateButtons(simulation) {
  const disabled = state.busy;
  elements.startButton.disabled = disabled || simulation.is_running;
  elements.stopButton.disabled = disabled || !simulation.is_running;
  elements.resetButton.disabled = disabled;
  elements.saveButton.disabled = disabled;
  
  elements.btnHook.disabled = disabled || !simulation.is_running;
  elements.btnTamper.disabled = disabled || !simulation.is_running;
  elements.btnOld.disabled = disabled || !simulation.is_running;

  elements.simulationDot.classList.toggle("running", simulation.is_running);
  elements.simulationText.textContent = simulation.is_running
    ? "Simulation Running"
    : "Simulation Ready";
    
  if (simulation.active_scenario) {
    elements.activeScenarioBadge.style.display = "block";
    elements.activeScenarioText.textContent = simulation.active_scenario;
  } else {
    elements.activeScenarioBadge.style.display = "none";
  }
}

function renderSegments(segments) {
  elements.segmentsBody.innerHTML = segments
    .map(
      (segment) => `
        <tr class="${segment.status === "theft" ? "row-theft" : segment.status === "warning" ? "row-warning" : ""}">
          <td>${segment.name}</td>
          <td>${formatNumber(segment.input_power_kw)}</td>
          <td>${formatNumber(segment.consumption_kw)}</td>
          <td>${formatNumber(segment.travel_loss_kw)}</td>
          <td>${formatNumber(segment.theft_kw)}</td>
          <td>${segment.theft_percent.toFixed(2)}%</td>
          <td>${segment.technical_loss_percent.toFixed(1)}%</td>
          <td>${segment.rolling_30d_theft_percent.toFixed(1)}%</td>
          <td>
            <span class="status-badge ${segment.status === "theft" ? "badge-theft" : segment.status === "warning" ? "badge-warning" : "badge-normal"}">
              ${segment.status === "theft" ? "Theft Risk" : segment.status === "warning" ? "Warning" : "Normal"}
            </span>
          </td>
          <td>
            <button type="button" class="btn-inspect ${segment.status === "theft" ? "btn-inspect-danger" : segment.status === "warning" ? "btn-inspect-warning" : ""}">
              ${segment.recommended_action}
            </button>
          </td>
        </tr>
      `,
    )
    .join("");

  elements.segmentNodes.innerHTML = segments
    .map((segment) => {
      const meterHtml = segment.meters.map(m => `<div class="meter-dot ${m.status === 'tampered' ? 'meter-tampered' : 'meter-normal'}" title="Meter ${m.meter_id}: ${m.consumption_kw}kW"></div>`).join('');
      return `
        <div class="node node-segment ${segment.status === "theft" ? "node-theft" : segment.status === "warning" ? "node-warning" : "node-normal"}">
          <div class="node-icon">CHK</div>
          <div class="node-label">${segment.name}</div>
          <div class="node-value">${formatNumber(segment.input_power_kw)} kW In</div>
          <div class="node-status">${segment.status === "theft" ? "Theft Risk" : segment.status === "warning" ? "Warning" : "Normal"}</div>
          ${segment.status === "theft" ? '<div class="theft-glow"></div>' : ""}
          <div class="segment-meters">
            ${meterHtml}
          </div>
        </div>
      `;
    })
    .join("");
}

function alertTone(level) {
  if (level === "danger") return "log-danger";
  if (level === "warning") return "log-warning";
  if (level === "success") return "log-success";
  return "log-info";
}

function renderAlerts(alerts) {
  elements.alertsList.innerHTML = alerts
    .map(
      (alert) => `
        <article class="log-entry ${alertTone(alert.level)}">
          <div class="log-time">${new Date(alert.timestamp).toLocaleTimeString()}</div>
          <div class="log-message">
            <strong>${alert.rule_triggered && alert.rule_triggered !== "system" ? `[${alert.rule_triggered}] ` : ""}</strong>
            ${alert.message}
          </div>
        </article>
      `,
    )
    .join("");
}

function renderDistribution(dashboard) {
  elements.distributionList.innerHTML = dashboard.segments
    .map((segment) => {
      const width = Math.min(
        (segment.consumption_kw / Math.max(dashboard.overview.total_consumption_kw, 1)) * 100,
        100,
      );
      return `
        <div class="distribution-row">
          <span>${segment.name}</span>
          <div class="distribution-bar-track">
            <div class="distribution-bar ${segment.status === "theft" ? "distribution-bar-danger" : ""}" style="width: ${width}%"></div>
          </div>
          <strong>${formatNumber(segment.consumption_kw)} kW</strong>
        </div>
      `;
    })
    .join("");
}

function renderDashboard(dashboard) {
  state.dashboard = dashboard;
  const isAlert = dashboard.overview.system_status === "alert";
  const activeAlertTitle = isAlert ? "THEFT DETECTED" : "SYSTEM NORMAL";

  elements.alertBanner.className = `alert-banner ${isAlert ? "alert-danger" : "alert-safe"}`;
  elements.alertIcon.textContent = isAlert ? "ALERT" : "OK";
  elements.alertTitle.textContent = activeAlertTitle;
  elements.alertMessage.textContent = dashboard.overview.active_alert_message;

  elements.overviewInput.textContent = formatNumber(dashboard.overview.total_input_power_kw);
  elements.overviewConsumption.textContent = formatNumber(dashboard.overview.total_consumption_kw);
  elements.overviewTravelLoss.textContent = formatNumber(dashboard.overview.total_travel_loss_kw);
  elements.overviewTravelLossPercent.textContent = `${dashboard.overview.travel_loss_percent.toFixed(2)}%`;
  elements.overviewTravelLossPercent.className = "card-trend trend-stable";
  elements.overviewTheft.textContent = formatNumber(dashboard.overview.total_theft_kw);
  elements.overviewTheftPercent.textContent = `${dashboard.overview.theft_percent.toFixed(2)}%`;
  elements.overviewTheftPercent.className = `card-trend ${isAlert ? "trend-danger" : "trend-stable"}`;
  elements.overviewStatus.textContent = isAlert ? "THEFT DETECTED" : "NORMAL";
  elements.overviewStatus.className = `card-value ${isAlert ? "status-danger" : "status-normal"}`;
  elements.overviewMode.textContent = dashboard.simulation.is_running
    ? "Simulation Active"
    : "Simulation Ready";
  elements.overviewMode.className = `card-trend ${isAlert ? "trend-danger" : "trend-up"}`;
  elements.transformerInput.textContent = formatNumber(dashboard.overview.total_input_power_kw);

  renderSegments(dashboard.segments);
  renderAlerts(dashboard.alerts);
  renderDistribution(dashboard);
  renderTickets(dashboard.tickets);

  elements.powerLabel.textContent =
    (dashboard.charts.power.labels && dashboard.charts.power.labels.length) ? dashboard.charts.power.labels.at(-1) : "Loading";
  elements.powerInputSummary.textContent = formatNumber(
    dashboard.overview.total_input_power_kw,
  );
  elements.powerConsumptionSummary.textContent = formatNumber(
    dashboard.overview.total_consumption_kw,
  );
  elements.lossSummary.textContent = formatNumber(dashboard.overview.total_loss_kw);
  elements.travelLossSummary.textContent = formatNumber(dashboard.overview.total_travel_loss_kw);
  elements.theftSummary.textContent = formatNumber(dashboard.overview.total_theft_kw);
  
  elements.powerLine.setAttribute(
    "points",
    buildSeries(dashboard.charts.power.input_power_kw || []),
  );
  elements.lossLine.setAttribute(
    "points",
    buildSeries(dashboard.charts.loss.loss_kw || []),
  );

  elements.samplingInput.value = String(dashboard.simulation.sampling_rate_ms);
  elements.samplingValue.textContent = String(dashboard.simulation.sampling_rate_ms);
  updateButtons(dashboard.simulation);
  setStatus("");
}

async function request(path, options) {
  const response = await fetch(path, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!response.ok) {
    throw new Error(`Request failed: ${response.status} ${response.statusText}`);
  }
  return response.json();
}

window.updateTicketStatus = function(ticketId, status) {
  runAction(() => request(`/api/control/ticket/${ticketId}/status`, {
    method: "POST",
    body: JSON.stringify({ status: status })
  }));
};

function renderTickets(tickets) {
  const columns = {
    open: [],
    acknowledged: [],
    resolved: [],
    closed: []
  };
  
  (tickets || []).forEach(ticket => {
    columns[ticket.status].push(ticket);
  });
  
  function createTicketHtml(t) {
    let actionsHtml = "";
    if (t.status === "open") {
      actionsHtml = `
        <button class="btn-ticket btn-ticket-ack" onclick="window.updateTicketStatus('${t.id}', 'acknowledged')">Acknowledge</button>
        <button class="btn-ticket btn-ticket-res" onclick="window.updateTicketStatus('${t.id}', 'resolved')">Resolve</button>
      `;
    } else if (t.status === "acknowledged") {
      actionsHtml = `
        <button class="btn-ticket btn-ticket-res" onclick="window.updateTicketStatus('${t.id}', 'resolved')">Resolve</button>
      `;
    } else if (t.status === "resolved") {
      actionsHtml = `
        <button class="btn-ticket btn-ticket-cls" onclick="window.updateTicketStatus('${t.id}', 'closed')">Close</button>
      `;
    } else {
      actionsHtml = `<span style="font-size: 0.75rem; color: var(--text-dim)">Closed</span>`;
    }
    
    return `
      <div class="ticket-card">
        <div class="ticket-header">
          <span class="ticket-id">${t.id}</span>
          <span class="ticket-date">${new Date(t.created_at).toLocaleTimeString()}</span>
        </div>
        <h4 class="ticket-title">${t.title}</h4>
        <p class="ticket-desc">${t.description}</p>
        <div class="ticket-actions">${actionsHtml}</div>
      </div>
    `;
  }
  
  elements.ticketsOpen.innerHTML = columns.open.map(createTicketHtml).join("");
  elements.ticketsAcknowledged.innerHTML = columns.acknowledged.map(createTicketHtml).join("");
  elements.ticketsResolved.innerHTML = columns.resolved.map(createTicketHtml).join("");
  elements.ticketsClosed.innerHTML = columns.closed.map(createTicketHtml).join("");
}

async function fetchDashboard() {
  const dashboard = await request("/api/dashboard");
  renderDashboard(dashboard);
}

function connectSocket() {
  const protocol = window.location.protocol === "https:" ? "wss" : "ws";
  const socket = new WebSocket(`${protocol}://${window.location.host}/ws/monitoring`);
  state.socket = socket;

  socket.addEventListener("message", (event) => {
    try {
      renderDashboard(JSON.parse(event.data));
    } catch (error) {
      setStatus(`Realtime update parse error: ${error}`);
    }
  });

  socket.addEventListener("close", () => {
    window.setTimeout(connectSocket, 1500);
  });

  socket.addEventListener("error", () => {
    setStatus("Realtime connection issue detected. The dashboard will retry automatically.");
  });
}

async function runAction(callback) {
  state.busy = true;
  if (state.dashboard) {
    updateButtons(state.dashboard.simulation);
  }
  try {
    await callback();
    await fetchDashboard();
  } catch (error) {
    setStatus(error instanceof Error ? error.message : "Unexpected request error.");
  } finally {
    state.busy = false;
    if (state.dashboard) {
      updateButtons(state.dashboard.simulation);
    }
  }
}

function bindEvents() {
  elements.samplingInput.addEventListener("input", (event) => {
    elements.samplingValue.textContent = String(Number(event.target.value));
  });

  elements.startButton.addEventListener("click", () =>
    runAction(() => request("/api/control/start", { method: "POST" })),
  );
  elements.stopButton.addEventListener("click", () =>
    runAction(() => request("/api/control/stop", { method: "POST" })),
  );
  elements.resetButton.addEventListener("click", () =>
    runAction(() => request("/api/control/reset", { method: "POST" })),
  );
  elements.saveButton.addEventListener("click", () =>
    runAction(() =>
      request("/api/control/settings", {
        method: "POST",
        body: JSON.stringify({
          sampling_rate_ms: Number(elements.samplingInput.value),
        }),
      }),
    ),
  );
  
  elements.btnHook.addEventListener("click", () =>
    runAction(() => request("/api/control/inject-scenario", { method: "POST", body: JSON.stringify({scenario: "hook"}) })),
  );
  elements.btnTamper.addEventListener("click", () =>
    runAction(() => request("/api/control/inject-scenario", { method: "POST", body: JSON.stringify({scenario: "meter_tampering"}) })),
  );
  elements.btnOld.addEventListener("click", () =>
    runAction(() => request("/api/control/inject-scenario", { method: "POST", body: JSON.stringify({scenario: "old_theft"}) })),
  );
}

function startClock() {
  const updateClock = () => {
    elements.clock.textContent = new Date().toLocaleTimeString();
  };
  updateClock();
  window.setInterval(updateClock, 1000);
}

async function init() {
  startClock();
  bindEvents();
  await fetchDashboard();
  connectSocket();
}

init().catch((error) => {
  setStatus(error instanceof Error ? error.message : "Failed to initialize dashboard.");
});
