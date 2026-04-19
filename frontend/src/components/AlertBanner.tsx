interface AlertBannerProps {
  isAlert: boolean;
  message: string;
}

export function AlertBanner({ isAlert, message }: AlertBannerProps) {
  return (
    <div className={`alert-banner ${isAlert ? "alert-danger" : "alert-safe"}`}>
      <div className="alert-icon">{isAlert ? "ALERT" : "OK"}</div>
      <div className="alert-text">
        <strong>{isAlert ? "THEFT DETECTED" : "SYSTEM NORMAL"}</strong>
        {" - "}
        {message}
      </div>
      <div className="alert-pulse"></div>
    </div>
  );
}
