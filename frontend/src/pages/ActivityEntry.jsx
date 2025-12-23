import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'

function ActivityEntry() {
    const { user, refreshUser } = useAuth()
    const navigate = useNavigate()
    const [factors, setFactors] = useState({})
    const [categories, setCategories] = useState({})
    const [activities, setActivities] = useState([])
    const [loading, setLoading] = useState(false)
    const [initializing, setInitializing] = useState(true)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState('')

    const [formData, setFormData] = useState({
        category: '',
        subcategory: '',
        quantity: '',
        date: new Date().toISOString().split('T')[0],
        location: '',
        description: ''
    })

    useEffect(() => {
        const init = async () => {
            // Refresh user data first to get latest organizationId
            await refreshUser()
            setInitializing(false)
            // Then fetch other data
            fetchFactors()
            fetchActivities()
        }
        init()
    }, [])

    const fetchFactors = async () => {
        try {
            const response = await api.get('/activities/factors')
            setFactors(response.data.factors)
            setCategories(response.data.categories)
        } catch (err) {
            console.error('Failed to fetch factors:', err)
        }
    }

    const fetchActivities = async () => {
        try {
            const response = await api.get('/activities')
            setActivities(response.data.activities)
        } catch (err) {
            console.error('Failed to fetch activities:', err)
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault()

        if (!user?.organizationId) {
            setError('Please set up your organization first')
            return
        }

        setLoading(true)
        setError('')
        setSuccess('')

        try {
            await api.post('/activities', formData)
            setSuccess('Activity logged successfully')
            setFormData({
                category: '',
                subcategory: '',
                quantity: '',
                date: new Date().toISOString().split('T')[0],
                location: '',
                description: ''
            })
            fetchActivities()
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to add activity')
        } finally {
            setLoading(false)
        }
    }

    const handleDelete = async (id) => {
        if (!confirm('Delete this activity entry?')) return

        try {
            await api.delete(`/activities/${id}`)
            fetchActivities()
        } catch (err) {
            setError('Failed to delete activity')
        }
    }

    const selectedCategoryFactors = formData.category ? categories[formData.category] || [] : []

    // Show loading while getting user data
    if (initializing) {
        return (
            <div className="page-container">
                <div className="loading-screen" style={{ minHeight: '50vh' }}>
                    <div className="memory-loader">
                        <div className="block b1"></div>
                        <div className="block b2"></div>
                        <div className="block b3"></div>
                        <div className="block b4"></div>
                    </div>
                    <p className="mono uppercase">Loading...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="page-container">
            <div className="page-header">
                <h1 className="page-title">LOG ACTIVITY</h1>
                <p className="page-subtitle">Record emission activities for carbon footprint calculation</p>
            </div>

            {!user?.organizationId && (
                <div className="card" style={{ marginBottom: '1.5rem', borderColor: 'var(--ink)' }}>
                    <p>
                        Please <a href="/organization-setup">set up your organization</a> before logging activities.
                    </p>
                </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '1.5rem' }}>
                {/* Add Activity Form */}
                <div className="card">
                    <div className="card-header">
                        <h3 className="card-title">New Entry</h3>
                    </div>

                    {error && <div className="error-message">{error}</div>}
                    {success && (
                        <div style={{
                            background: 'var(--paper)',
                            border: '2px solid var(--ink)',
                            padding: '0.75rem 1rem',
                            borderRadius: 'var(--radius-md)',
                            marginBottom: '1rem',
                            fontWeight: '500'
                        }}>
                            ✓ {success}
                        </div>
                    )}

                    <form onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label>Category</label>
                            <select
                                value={formData.category}
                                onChange={(e) => setFormData({ ...formData, category: e.target.value, subcategory: '' })}
                                required
                            >
                                <option value="">Select category</option>
                                {Object.keys(categories).map(cat => (
                                    <option key={cat} value={cat}>{cat}</option>
                                ))}
                            </select>
                        </div>

                        {selectedCategoryFactors.length > 0 && (
                            <div className="form-group">
                                <label>Type</label>
                                <select
                                    value={formData.subcategory}
                                    onChange={(e) => setFormData({ ...formData, subcategory: e.target.value })}
                                    required
                                >
                                    <option value="">Select type</option>
                                    {selectedCategoryFactors.map(factor => (
                                        <option key={factor} value={factor}>
                                            {factors[factor]?.description} ({factors[factor]?.unit})
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}

                        <div className="form-group">
                            <label>Quantity</label>
                            <input
                                type="number"
                                value={formData.quantity}
                                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                                placeholder={formData.subcategory ? `Enter ${factors[formData.subcategory]?.unit || 'amount'}` : 'Enter value'}
                                step="0.01"
                                min="0"
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label>Date</label>
                            <input
                                type="date"
                                value={formData.date}
                                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label>Location (Optional)</label>
                            <input
                                type="text"
                                value={formData.location}
                                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                placeholder="Office, Factory, etc."
                            />
                        </div>

                        <button type="submit" className="btn btn-solid btn-full" disabled={loading || !user?.organizationId}>
                            {loading ? 'Saving...' : '+ Add Entry'}
                        </button>
                    </form>
                </div>

                {/* Activities List */}
                <div className="card">
                    <div className="card-header">
                        <h3 className="card-title">Activity Log</h3>
                        <span className="mono" style={{ fontSize: '0.875rem' }}>
                            {activities.length} entries
                        </span>
                    </div>

                    {activities.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '3rem 2rem' }}>
                            <p style={{ fontSize: '2rem', marginBottom: '1rem' }}>○</p>
                            <p style={{ marginBottom: '0.5rem' }}>
                                No activities logged
                            </p>
                            <p style={{ fontSize: '0.875rem', color: 'var(--pencil)' }}>
                                Add your first emission activity
                            </p>
                        </div>
                    ) : (
                        <div className="table-container">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Date</th>
                                        <th>Category</th>
                                        <th>Quantity</th>
                                        <th>CO₂e</th>
                                        <th>Scope</th>
                                        <th></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {activities.slice(0, 10).map(activity => (
                                        <tr key={activity.activityId}>
                                            <td className="mono">{new Date(activity.date).toLocaleDateString()}</td>
                                            <td>{activity.category}</td>
                                            <td className="mono">{activity.quantity} {activity.unit}</td>
                                            <td className="mono" style={{ fontWeight: '600' }}>{activity.co2eKg?.toFixed(2)} kg</td>
                                            <td>
                                                <span className={`badge badge-scope${activity.scope}`}>
                                                    S{activity.scope}
                                                </span>
                                            </td>
                                            <td>
                                                <button
                                                    onClick={() => handleDelete(activity.activityId)}
                                                    style={{
                                                        background: 'none',
                                                        border: 'none',
                                                        cursor: 'pointer',
                                                        fontSize: '1rem'
                                                    }}
                                                >
                                                    ✕
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {/* Process CTA */}
            {activities.length > 0 && (
                <div className="card" style={{ marginTop: '1.5rem', textAlign: 'center', padding: '2rem' }}>
                    <h3 style={{ marginBottom: '0.5rem' }}>Ready to analyze?</h3>
                    <p style={{ marginBottom: '1.5rem' }}>
                        {activities.length} activities logged. View your dashboard for insights.
                    </p>
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="btn btn-solid btn-large"
                    >
                        View Dashboard →
                    </button>
                </div>
            )}
        </div>
    )
}

export default ActivityEntry
