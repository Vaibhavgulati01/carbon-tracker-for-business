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
    const { user, updateUser } = useAuth()
    const navigate = useNavigate()
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState('')
    const [organization, setOrganization] = useState(null)

    const [formData, setFormData] = useState({
        name: '',
        industry: 'Technology',
        employeeCount: '',
        reportingYear: new Date().getFullYear(),
        operationalBoundary: 'single-site'
    })

    useEffect(() => {
        if (user?.organizationId) {
            fetchOrganization()
        }
    }, [user])

    const fetchOrganization = async () => {
        try {
            const response = await api.get(`/organizations/${user.organizationId}`)
            setOrganization(response.data.organization)
            setFormData({
                name: response.data.organization.name,
                industry: response.data.organization.industry,
                employeeCount: response.data.organization.employeeCount,
                reportingYear: response.data.organization.reportingYear,
                operationalBoundary: response.data.organization.operationalBoundary
            })
        } catch (err) {
            console.error('Failed to fetch organization:', err)
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)
        setError('')
        setSuccess('')

        try {
            if (organization) {
                await api.put(`/organizations/${user.organizationId}`, formData)
                setSuccess('Organization updated successfully!')
            } else {
                const response = await api.post('/organizations', formData)
                updateUser({ organizationId: response.data.organization.organizationId })
                setOrganization(response.data.organization)
                setSuccess('Organization created successfully!')
                setTimeout(() => navigate('/activities'), 1500)
            }
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to save organization')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="animate-fadeIn">
            <div className="page-header">
                <h1 className="page-title">🏢 Organization Setup</h1>
                <p className="page-subtitle">
                    {organization ? 'Update your organization details' : 'Set up your organization to start tracking emissions'}
                </p>
            </div>

            <div className="card" style={{ maxWidth: '600px' }}>
                {error && <div className="error-message">{error}</div>}
                {success && (
                    <div style={{
                        background: 'rgba(34, 197, 94, 0.1)',
                        border: '1px solid var(--success)',
                        color: 'var(--success)',
                        padding: '0.75rem 1rem',
                        borderRadius: 'var(--radius-md)',
                        marginBottom: '1rem'
                    }}>
                        {success}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label htmlFor="name">Organization Name *</label>
                        <input
                            type="text"
                            id="name"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            placeholder="ABC Corporation"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="industry">Industry Sector *</label>
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

                    <div className="form-group">
                        <label htmlFor="employeeCount">Number of Employees</label>
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

                    <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
                        {loading ? 'Saving...' : (organization ? 'Update Organization' : 'Create Organization')}
                    </button>
                </form>
            </div>
        </div>
    )
}

export default OrganizationSetup
