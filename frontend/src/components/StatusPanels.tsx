interface StatusPanelsProps {
  loading: boolean;
  error: string | null;
  activeAlertMessage: string | null;
  hasDashboard: boolean;
}

export function StatusPanels({
  loading,
  error,
  activeAlertMessage,
  hasDashboard,
}: StatusPanelsProps) {
  return (
    <>
      {error ? (
        <section className="section">
          <h2 className="section-title">Connection Status</h2>
          <p className="empty-state">Backend error: {error}</p>
        </section>
      ) : null}

      {loading && !hasDashboard ? (
        <section className="section">
          <h2 className="section-title">Loading</h2>
          <p className="empty-state">Connecting to backend and waiting for first payload...</p>
        </section>
      ) : null}

      {activeAlertMessage ? (
        <section className="section">
          <h2 className="section-title">Active Incident</h2>
          <p className="incident-copy">{activeAlertMessage}</p>
        </section>
      ) : null}
    </>
  );
}
