import { NavLink } from 'react-router-dom'

const navigationItems = [
  {
    label: 'Dashboard',
    to: '/dashboard',
    icon: '⌂',
  },
  {
    label: 'Characters',
    to: '/characters',
    icon: '♙',
  },
  {
    label: 'Marketplace',
    to: '/marketplace',
    icon: '▣',
  },
  {
    label: 'My Characters',
    to: '/my-characters',
    icon: '♧',
  },
  {
    label: 'Chat',
    to: '/chat',
    icon: '◌',
  },
  {
    label: 'Creator Studio',
    to: '/creator-studio',
    icon: '✎',
  },
]

function DashboardSidebar() {
  return (
    <aside className="vv-sidebar">
      <div className="vv-sidebar-logo">
        <span>V</span>
        <strong>VelvetVerse</strong>
      </div>

      <nav className="vv-sidebar-navigation">
        {navigationItems.map((item) => (
          <NavLink
            key={item.label}
            to={item.to}
            className={({ isActive }) =>
              isActive
                ? 'vv-sidebar-link active'
                : 'vv-sidebar-link'
            }
          >
            <span className="vv-sidebar-icon">
              {item.icon}
            </span>

            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="vv-sidebar-membership">
        <p className="vv-sidebar-membership-label">
          VelvetVerse Premium
        </p>

        <p>Your journey continues.</p>

        <div className="vv-sidebar-credit-row">
          <span>Credits</span>
          <strong>1,250</strong>
        </div>

        <div className="vv-sidebar-credit-track">
          <span />
        </div>

        <button type="button">
          Manage Subscription
        </button>
      </div>

      <div className="vv-sidebar-profile">
        <div className="vv-sidebar-avatar">
          DV
        </div>

        <div>
          <strong>Dean</strong>
          <span>Premium Member</span>
        </div>

        <span>⌄</span>
      </div>
    </aside>
  )
}

export default DashboardSidebar