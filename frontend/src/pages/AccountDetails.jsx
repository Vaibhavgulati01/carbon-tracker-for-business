import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'

function AccountDetails() {
    const { user, logout } = useAuth()
    const [organization, setOrganization] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchOrganization()
    }, [])

    const fetchOrganization = async () => {
        try {
            if (user?.organizationId) {
                const response = await api.get(`/organizations/${user.organizationId}`)
                setOrganization(response.data.organization)
            }
        } catch (error) {
            console.error('Error fetching organization:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleLogout = () => {
        logout()
    }

    if (loading) {
        return (
            <div className="page-container">
                <div className="loading-screen" style={{ minHeight: '50vh' }}>
                    <div className="memory-loader">
                        <div className="block b1"></div>
                        <div className="block b2"></div>
                        <div className="block b3"></div>
                        <div className="block b4"></div>
                    </div>
                    <p className="mono uppercase">Loading data...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="page-container">
            <header className="page-header">
                <h1 className="page-title">ACCOUNT</h1>
                <p className="page-subtitle">User profile and organization information</p>
            </header>

            <div className="account-grid">
                {/* User Profile Card */}
                <div className="account-card">
                    <h2>User Profile</h2>
                    <div className="account-info">
                        <div className="info-row">
                            <span className="info-label">Name</span>
                            <span className="info-value">{user?.name || 'Not set'}</span>
                        </div>
                        <div className="info-row">
                            <span className="info-label">Email</span>
                            <span className="info-value mono">{user?.email}</span>
                        </div>
                        <div className="info-row">
                            <span className="info-label">Role</span>
                            <span className="info-value badge">{user?.role || 'Admin'}</span>
                        </div>
                        <div className="info-row">
                            <span className="info-label">Status</span>
                            <span className="info-value mono">● Active</span>
                        </div>
                    </div>
                </div>

                {/* Organization Card */}
                <div className="account-card">
                    <h2>Organization</h2>
                    {organization ? (
                        <div className="account-info">
                            <div className="info-row">
                                <span className="info-label">Company</span>
                                <span className="info-value">{organization.name}</span>
                            </div>
                            <div className="info-row">
                                <span className="info-label">Industry</span>
                                <span className="info-value">{organization.industry}</span>
                            </div>
                            <div className="info-row">
                                <span className="info-label">Employees</span>
                                <span className="info-value mono">{organization.employeeCount || '—'}</span>
                            </div>
                            <div className="info-row">
                                <span className="info-label">Reporting Year</span>
                                <span className="info-value mono">{organization.reportingYear || new Date().getFullYear()}</span>
                            </div>
                        </div>
                    ) : (
                        <p style={{ color: 'var(--pencil)' }}>No organization data available</p>
                    )}
                </div>

                {/* Actions Card */}
                <div className="account-card actions-card">
                    <h2>Actions</h2>
                    <div style={{ paddingTop: '1rem' }}>
                        <button onClick={handleLogout} className="btn btn-danger btn-full">
                            ↳ Sign Out
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default AccountDetails
