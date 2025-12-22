import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'

function ActivityEntry() {
    const { user } = useAuth()
    const navigate = useNavigate()
    const [factors, setFactors] = useState({})
    const [categories, setCategories] = useState({})
    const [activities, setActivities] = useState([])
    const [loading, setLoading] = useState(false)
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
        fetchFactors()
        fetchActivities()
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
            setSuccess('Activity added successfully!')
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
        if (!confirm('Are you sure you want to delete this activity?')) return

        try {
            await api.delete(`/activities/${id}`)
            fetchActivities()
        } catch (err) {
            setError('Failed to delete activity')
        }
    }

    const selectedCategoryFactors = formData.category ? categories[formData.category] || [] : []

    return (
        <div className="animate-fadeIn">
            <div className="page-header">
                <h1 className="page-title">📝 Activity Entry</h1>
                <p className="page-subtitle">Log your emission activities to calculate carbon footprint</p>
            </div>

            {!user?.organizationId && (
                <div className="card" style={{ marginBottom: '1.5rem', background: 'rgba(245, 158, 11, 0.1)', borderColor: 'var(--warning)' }}>
                    <p style={{ color: 'var(--warning)' }}>
                        ⚠️ Please <a href="/organization" style={{ color: 'var(--warning)', textDecoration: 'underline' }}>set up your organization</a> before adding activities.
                    </p>
                </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '1.5rem' }}>
                {/* Add Activity Form */}
                <div className="card">
                    <h3 style={{ marginBottom: '1.5rem' }}>Add New Activity</h3>

                    {error && <div className="error-message">{error}</div>}
                    {success && (
                        <div style={{ background: 'rgba(34, 197, 94, 0.1)', border: '1px solid var(--success)', color: 'var(--success)', padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)', marginBottom: '1rem' }}>
                            {success}
                        </div>
                    )}

                    <form onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label>Category *</label>
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
                                <label>Type *</label>
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
                            <label>Quantity *</label>
                            <input
                                type="number"
                                value={formData.quantity}
                                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                                placeholder={formData.subcategory ? `Enter ${factors[formData.subcategory]?.unit || 'amount'}` : 'Enter quantity'}
                                step="0.01"
                                min="0"
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label>Date *</label>
                            <input
                                type="date"
                                value={formData.date}
                                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label>Location</label>
                            <input
                                type="text"
                                value={formData.location}
                                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                placeholder="Office, Factory, etc."
                            />
                        </div>

                        <div className="form-group">
                            <label>Description (Optional)</label>
                            <textarea
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                placeholder="Additional notes..."
                                rows="2"
                            />
                        </div>

                        <button type="submit" className="btn btn-primary btn-full" disabled={loading || !user?.organizationId}>
                            {loading ? 'Adding...' : 'Add Activity'}
                        </button>
                    </form>
                </div>

                {/* Activities List */}
                <div className="card">
                    <div className="card-header">
                        <h3 className="card-title">Recent Activities</h3>
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                            {activities.length} entries
                        </span>
                    </div>

                    {activities.length === 0 ? (
                        <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem' }}>
                            No activities logged yet
                        </p>
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
                                            <td>{new Date(activity.date).toLocaleDateString()}</td>
                                            <td>{activity.category}</td>
                                            <td>{activity.quantity} {activity.unit}</td>
                                            <td>{activity.co2eKg?.toFixed(2)} kg</td>
                                            <td>
                                                <span className={`badge badge-scope${activity.scope}`}>
                                                    Scope {activity.scope}
                                                </span>
                                            </td>
                                            <td>
                                                <button
                                                    onClick={() => handleDelete(activity.activityId)}
                                                    style={{ background: 'none', border: 'none', color: 'var(--error)', cursor: 'pointer' }}
                                                >
                                                    🗑️
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
        </div>
    )
}

export default ActivityEntry
