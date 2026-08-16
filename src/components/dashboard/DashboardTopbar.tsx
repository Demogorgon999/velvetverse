function DashboardTopbar() {
  return (
    <header className="vv-dashboard-topbar">
      <div>
        <h1>
          Welcome back, <span>Dean.</span>
        </h1>

        <p>Continue where you left off.</p>
      </div>

      <div className="vv-dashboard-account">
        <div className="vv-dashboard-credits">
          <span>◇</span>
          <strong>1,250</strong>
        </div>

        <button
          type="button"
          className="vv-dashboard-notification"
          aria-label="Notifications"
        >
          ♧
          <span />
        </button>

        <button
          type="button"
          className="vv-dashboard-avatar"
          aria-label="Open profile"
        >
          DV
        </button>
      </div>
    </header>
  )
}

export default DashboardTopbar