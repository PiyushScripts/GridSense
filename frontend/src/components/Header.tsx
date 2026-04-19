interface HeaderProps {
  clock: string;
}

export function Header({ clock }: HeaderProps) {
  return (
    <header id="main-header">
      <div className="header-left">
        <div className="logo-icon" aria-hidden="true">
          <span className="logo-bolt">PWR</span>
        </div>
        <div>
          <h1>Smart Electricity Monitor</h1>
          <p className="header-subtitle">Real-Time Power Grid Surveillance System</p>
        </div>
      </div>
      <div className="header-right">
        <div className="live-indicator">
          <span className="live-dot"></span>
          LIVE
        </div>
        <div className="header-clock">{clock}</div>
      </div>
    </header>
  );
}
