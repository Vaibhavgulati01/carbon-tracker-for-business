import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import Layout from './components/Layout/Layout'
import LandingPage from './pages/LandingPage'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import OrganizationSetup from './pages/OrganizationSetup'
import DisclaimerPage from './pages/DisclaimerPage'
import ActivityEntry from './pages/ActivityEntry'
import ScenarioSimulation from './pages/ScenarioSimulation'
import AccountDetails from './pages/AccountDetails'
import AuditReport from './pages/AuditReport'

// Memory Block Loader Component
function MemoryLoader() {
    return (
        <div className="memory-loader">
            <div className="block b1"></div>
            <div className="block b2"></div>
            <div className="block b3"></div>
            <div className="block b4"></div>
        </div>
    )
}

// Protected Route Component
function ProtectedRoute({ children }) {
    const { user, loading } = useAuth()

    if (loading) {
        return (
            <div className="loading-screen">
                <MemoryLoader />
                <p>Loading...</p>
            </div>
        )
    }

    return user ? children : <Navigate to="/login" />
}

// Requires organization to access
function RequireOrg({ children }) {
    const { user, loading } = useAuth()

    if (loading) {
        return (
            <div className="loading-screen">
                <MemoryLoader />
                <p>Loading...</p>
            </div>
        )
    }

    if (!user) {
        return <Navigate to="/login" />
    }

    // Redirect to org setup if no organization
    if (!user.organizationId) {
        return <Navigate to="/organization-setup" />
    }

    return children
}

function App() {
    const { user } = useAuth()

    // Determine where logged-in users should go
    const getLoggedInRedirect = () => {
        if (!user) return '/login'
        if (!user.organizationId) return '/organization-setup'
        return '/dashboard'
    }

    return (
        <Routes>
            {/* Public Routes - redirect based on user state */}
            <Route path="/" element={user ? <Navigate to={getLoggedInRedirect()} /> : <LandingPage />} />
            <Route path="/login" element={user ? <Navigate to={getLoggedInRedirect()} /> : <Login />} />
            <Route path="/register" element={user ? <Navigate to={getLoggedInRedirect()} /> : <Register />} />

            {/* One-time Organization Setup (no sidebar) */}
            <Route path="/organization-setup" element={
                <ProtectedRoute>
                    <OrganizationSetup />
                </ProtectedRoute>
            } />

            {/* System Initialization Protocol / Disclaimer (no sidebar) */}
            <Route path="/initialize" element={
                <ProtectedRoute>
                    <DisclaimerPage />
                </ProtectedRoute>
            } />

            {/* Protected Routes with Layout - require organization */}
            <Route element={
                <RequireOrg>
                    <Layout />
                </RequireOrg>
            }>
                <Route path="dashboard" element={<Dashboard />} />
                <Route path="activities" element={<ActivityEntry />} />
                <Route path="scenarios" element={<ScenarioSimulation />} />
                <Route path="audit" element={<AuditReport />} />
                <Route path="account" element={<AccountDetails />} />
            </Route>

            {/* Catch all */}
            <Route path="*" element={<Navigate to="/" />} />
        </Routes>
    )
}

export default App
