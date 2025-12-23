import { Outlet, NavLink, Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

function Layout() {
    const { user } = useAuth()

    return (
        <div className="app-layout">
            {/* Top Navigation Bar */}
            <nav className="top-nav">
                <Link to="/dashboard" className="nav-logo">
                    <span className="nav-logo-icon">🌱</span>
                    <span>Carbon Tracker</span>
                </Link>

                {/* Pill-style Navigation */}
                <div className="nav-pill">
                    <NavLink to="/dashboard" className={({ isActive }) => `nav-pill-item ${isActive ? 'active' : ''}`}>
                        <span className="nav-icon">■</span>
                        Dashboard
                    </NavLink>

                    <NavLink to="/activities" className={({ isActive }) => `nav-pill-item ${isActive ? 'active' : ''}`}>
                        <span className="nav-icon">+</span>
                        Log Data
                    </NavLink>

                    <NavLink to="/scenarios" className={({ isActive }) => `nav-pill-item ${isActive ? 'active' : ''}`}>
                        <span className="nav-icon">◇</span>
                        Scenarios
                    </NavLink>

                    <NavLink to="/audit" className={({ isActive }) => `nav-pill-item ${isActive ? 'active' : ''}`}>
                        <span className="nav-icon">↓</span>
                        Audit
                    </NavLink>
                </div>

                {/* User Avatar - Clickable to Account */}
                <Link to="/account" className="nav-user-link">
                    <div className="user-avatar">
                        {user?.name?.charAt(0).toUpperCase() || 'U'}
                    </div>
                    <span className="user-name">{user?.name || 'User'}</span>
                </Link>
            </nav>

            <main className="main-content">
                <Outlet />
            </main>
        </div>
    )
}

export default Layout
