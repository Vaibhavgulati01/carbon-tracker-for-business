import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'

const INDUSTRIES = [
    'Technology',
    'Manufacturing',
    'Retail',
    'Healthcare',
    'Transportation',
    'Energy',
    'Finance',
    'Construction',
    'Agriculture',
    'Other'
]

function OrganizationSetup() {
    const { user, logout, refreshUser } = useAuth()
    const navigate = useNavigate()
    const [loading, setLoading] = useState(false)
    const [submitting, setSubmitting] = useState(false)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState(false)

    const [formData, setFormData] = useState({
        name: '',
        industry: 'Technology',
        employeeCount: '',
        reportingYear: new Date().getFullYear(),
        operationalBoundary: 'single-site'
    })

    useEffect(() => {
        // Only redirect if org exists AND we're not in the middle of submitting
        if (user?.organizationId && !submitting) {
            navigate('/dashboard')
        }
    }, [user, navigate, submitting])

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)
        setSubmitting(true)
        setError('')

        try {
            await api.post('/organizations', formData)

            // Store the new JWT token that includes organizationId
            // (The backend sends a token even though we might not use it immediately if we're going to logout later, 
            // but it's good practice to keep session fresh)

            // Show success message
            setSuccess(true)

            // Wait a moment then redirect to disclaimer/initialize
            setTimeout(async () => {
                await refreshUser() // Refresh to get orgId in context
                navigate('/initialize')
            }, 1000)

        } catch (err) {
            setError(err.response?.data?.error || 'Failed to create organization')
            setSubmitting(false)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="org-setup-page">
            <div className="org-setup-container">
                <div className="org-setup-header">
                    <div className="logo-icon" style={{ fontSize: '3rem', filter: 'grayscale(1)' }}>🌱</div>
                    <h1>ORGANIZATION SETUP</h1>
                    <p>Complete your profile to start tracking emissions</p>
                </div>

                <div className="org-setup-card">
                    {error && <div className="error-message">{error}</div>}

                    {success && (
                        <div style={{
                            background: 'var(--paper)',
                            border: '2px solid var(--ink)',
                            padding: '1.5rem',
                            borderRadius: 'var(--radius-md)',
                            marginBottom: '1rem',
                            textAlign: 'center'
                        }}>
                            <p style={{ fontWeight: '600', marginBottom: '0.5rem' }}>Organization created successfully!</p>
                            <p style={{ color: 'var(--pencil)' }}>Redirecting to System Protocol...</p>
                        </div>
                    )}

                    {!success && (
                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label htmlFor="name">Organization Name</label>
                                <input
                                    type="text"
                                    id="name"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="Acme Corporation"
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="industry">Industry Sector</label>
                                <select
                                    id="industry"
                                    value={formData.industry}
                                    onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                                    required
                                >
                                    {INDUSTRIES.map(ind => (
                                        <option key={ind} value={ind}>{ind}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label htmlFor="employeeCount">Employees</label>
                                    <input
                                        type="number"
                                        id="employeeCount"
                                        value={formData.employeeCount}
                                        onChange={(e) => setFormData({ ...formData, employeeCount: parseInt(e.target.value) || '' })}
                                        placeholder="100"
                                        min="1"
                                    />
                                </div>

                                <div className="form-group">
                                    <label htmlFor="reportingYear">Reporting Year</label>
                                    <select
                                        id="reportingYear"
                                        value={formData.reportingYear}
                                        onChange={(e) => setFormData({ ...formData, reportingYear: parseInt(e.target.value) })}
                                    >
                                        {[2025, 2024, 2023, 2022].map(year => (
                                            <option key={year} value={year}>{year}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="form-group">
                                <label htmlFor="boundary">Operational Boundary</label>
                                <select
                                    id="boundary"
                                    value={formData.operationalBoundary}
                                    onChange={(e) => setFormData({ ...formData, operationalBoundary: e.target.value })}
                                >
                                    <option value="single-site">Single Site</option>
                                    <option value="multi-site">Multi-Site</option>
                                </select>
                            </div>

                            <button type="submit" className="btn btn-solid btn-full btn-large" disabled={loading}>
                                {loading ? 'Setting up...' : 'Start Tracking →'}
                            </button>
                        </form>
                    )}
                </div>

                <p className="org-setup-note">
                    This is a one-time setup. Configuration cannot be modified later.
                </p>
            </div>
        </div >
    )
}

export default OrganizationSetup
