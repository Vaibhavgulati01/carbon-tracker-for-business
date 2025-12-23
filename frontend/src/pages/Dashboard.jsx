import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Chart as ChartJS, ArcElement, CategoryScale, LinearScale, BarElement, LineElement, PointElement, Title, Tooltip, Legend } from 'chart.js'
import { Pie, Bar, Line } from 'react-chartjs-2'
import api from '../services/api'

// Register Chart.js components
ChartJS.register(ArcElement, CategoryScale, LinearScale, BarElement, LineElement, PointElement, Title, Tooltip, Legend)

const TIME_PERIODS = [
    { value: '1m', label: '1 Month' },
    { value: '6m', label: '6 Months' },
    { value: '1y', label: '1 Year' },
    { value: 'all', label: 'All Time' }
]

function Dashboard() {
    const [overview, setOverview] = useState(null)
    const [trends, setTrends] = useState(null)
    const [insights, setInsights] = useState(null)
    const [activities, setActivities] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [timePeriod, setTimePeriod] = useState('all')

    useEffect(() => {
        fetchDashboardData()
    }, [timePeriod])

    const getDateRange = () => {
        const now = new Date()
        let startDate = null

        switch (timePeriod) {
            case '1m':
                startDate = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate())
                break
            case '6m':
                startDate = new Date(now.getFullYear(), now.getMonth() - 6, now.getDate())
                break
            case '1y':
                startDate = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate())
                break
            default:
                startDate = null
        }
        return startDate ? startDate.toISOString().split('T')[0] : null
    }

    const fetchDashboardData = async () => {
        setLoading(true)
        try {
            const startDate = getDateRange()
            const params = startDate ? `?startDate=${startDate}` : ''

            const [overviewRes, trendsRes, activitiesRes] = await Promise.all([
                api.get(`/dashboard/overview${params}`),
                api.get(`/dashboard/trends${params}`),
                api.get('/activities')
            ])

            setOverview(overviewRes.data)
            setTrends(trendsRes.data)
            setActivities(activitiesRes.data.activities || [])

            try {
                const insightsRes = await api.get('/ai/insights')
                setInsights(insightsRes.data.insights)
            } catch (err) {
                console.log('AI insights not available')
            }
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to load dashboard')
        } finally {
            setLoading(false)
        }
    }

    const getFilteredActivities = () => {
        const startDate = getDateRange()
        if (!startDate) return activities
        return activities.filter(a => new Date(a.date) >= new Date(startDate))
    }

    const filteredActivities = getFilteredActivities()

    if (loading) {
        return (
            <div className="loading-screen" style={{ minHeight: '50vh' }}>
                <div className="memory-loader">
                    <div className="block b1"></div>
                    <div className="block b2"></div>
                    <div className="block b3"></div>
                    <div className="block b4"></div>
                </div>
                <p className="mono uppercase">Loading data...</p>
            </div>
        )
    }

    if (error) {
        return (
            <div className="page-container">
                <div className="page-header">
                    <h1 className="page-title">DASHBOARD</h1>
                </div>
                <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
                    <p style={{ fontSize: '2rem', marginBottom: '1rem' }}>○</p>
                    <h3 style={{ marginBottom: '0.5rem' }}>NO DATA AVAILABLE</h3>
                    <p style={{ marginBottom: '1.5rem' }}>
                        Start by logging your organization's emission activities.
                    </p>
                    <Link to="/activities" className="btn btn-solid">Log First Activity</Link>
                </div>
            </div>
        )
    }

    const { overview: data } = overview || {}
    const hasData = data?.activityCount > 0

    // Monochrome Scope Pie Chart
    const scopePieData = {
        labels: ['Scope 1 (Direct)', 'Scope 2 (Energy)', 'Scope 3 (Value Chain)'],
        datasets: [{
            data: [
                data?.scopeBreakdown?.scope1?.kg || 0,
                data?.scopeBreakdown?.scope2?.kg || 0,
                data?.scopeBreakdown?.scope3?.kg || 0
            ],
            backgroundColor: ['#1A1A1A', '#666666', '#CCCCCC'],
            borderColor: '#000000',
            borderWidth: 2
        }]
    }

    // Monochrome Bar Chart
    const categoryBarData = {
        labels: data?.categoryBreakdown?.slice(0, 6).map(c => c.category) || [],
        datasets: [{
            label: 'CO2e (kg)',
            data: data?.categoryBreakdown?.slice(0, 6).map(c => c.kg) || [],
            backgroundColor: '#1A1A1A',
            borderColor: '#000000',
            borderWidth: 2,
            borderRadius: 4
        }]
    }

    // Monochrome Line Chart
    const trendLineData = {
        labels: trends?.trends?.map(t => t.month) || [],
        datasets: [
            {
                label: 'Scope 1',
                data: trends?.trends?.map(t => t.scope1) || [],
                borderColor: '#000000',
                backgroundColor: 'transparent',
                borderWidth: 3,
                tension: 0.4,
                pointRadius: 4,
                pointBackgroundColor: '#000000'
            },
            {
                label: 'Scope 2',
                data: trends?.trends?.map(t => t.scope2) || [],
                borderColor: '#666666',
                backgroundColor: 'transparent',
                borderWidth: 2,
                borderDash: [5, 5],
                tension: 0.4,
                pointRadius: 4,
                pointBackgroundColor: '#666666'
            },
            {
                label: 'Scope 3',
                data: trends?.trends?.map(t => t.scope3) || [],
                borderColor: '#999999',
                backgroundColor: 'transparent',
                borderWidth: 2,
                borderDash: [2, 2],
                tension: 0.4,
                pointRadius: 4,
                pointBackgroundColor: '#999999'
            }
        ]
    }

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'bottom',
                labels: {
                    color: '#1A1A1A',
                    padding: 15,
                    font: { family: "'JetBrains Mono', monospace", size: 11 }
                }
            }
        },
        scales: {
            x: {
                ticks: { color: '#1A1A1A', font: { family: "'JetBrains Mono', monospace" } },
                grid: { color: '#E5E5E5' },
                border: { color: '#000000', width: 2 }
            },
            y: {
                ticks: { color: '#1A1A1A', font: { family: "'JetBrains Mono', monospace" } },
                grid: { color: '#E5E5E5' },
                border: { color: '#000000', width: 2 }
            }
        }
    }

    return (
        <div className="page-container">
            {/* Header */}
            <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                    <h1 className="page-title">DASHBOARD</h1>
                    <p className="page-subtitle">
                        {overview?.organization?.name || 'Organization'} — Carbon Emissions Overview
                    </p>
                </div>
                <Link to="/activities" className="btn btn-solid">
                    + Log Activity
                </Link>
            </div>

            {/* Time Period Filter */}
            <div className="filter-bar">
                <span className="filter-label">Time Period:</span>
                <div className="filter-buttons">
                    {TIME_PERIODS.map(period => (
                        <button
                            key={period.value}
                            onClick={() => setTimePeriod(period.value)}
                            className={`filter-btn ${timePeriod === period.value ? 'active' : ''}`}
                        >
                            {period.label}
                        </button>
                    ))}
                </div>
                <span className="mono" style={{ marginLeft: 'auto', fontSize: '0.875rem' }}>
                    {filteredActivities.length} entries
                </span>
            </div>

            {!hasData ? (
                <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
                    <h3 style={{ marginBottom: '1rem' }}>NO EMISSION DATA</h3>
                    <p style={{ marginBottom: '1.5rem' }}>
                        Start by adding your first activity to generate analytics.
                    </p>
                    <Link to="/activities" className="btn btn-solid">Add First Activity</Link>
                </div>
            ) : (
                <>
                    {/* Stats Cards */}
                    <div className="dashboard-grid">
                        <div className="stat-card">
                            <div className="stat-value">{data?.totalEmissions?.tonnes?.toFixed(2) || 0}</div>
                            <div className="stat-label">Total (tCO2e)</div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-value">{data?.scopeBreakdown?.scope1?.percentage || 0}%</div>
                            <div className="stat-label">Scope 1</div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-value">{data?.scopeBreakdown?.scope2?.percentage || 0}%</div>
                            <div className="stat-label">Scope 2</div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-value">{data?.scopeBreakdown?.scope3?.percentage || 0}%</div>
                            <div className="stat-label">Scope 3</div>
                        </div>
                    </div>

                    {/* Charts */}
                    <div className="charts-grid">
                        <div className="card">
                            <div className="card-header">
                                <h3 className="card-title">Emissions by Scope</h3>
                            </div>
                            <div className="chart-container">
                                <Pie data={scopePieData} options={{
                                    ...chartOptions,
                                    plugins: {
                                        ...chartOptions.plugins,
                                        legend: {
                                            position: 'bottom',
                                            labels: {
                                                color: '#1A1A1A',
                                                font: { family: "'JetBrains Mono', monospace", size: 11 }
                                            }
                                        }
                                    }
                                }} />
                            </div>
                        </div>

                        <div className="card">
                            <div className="card-header">
                                <h3 className="card-title">Top Categories</h3>
                            </div>
                            <div className="chart-container">
                                <Bar data={categoryBarData} options={chartOptions} />
                            </div>
                        </div>
                    </div>

                    {/* Monthly Trends */}
                    <div className="card" style={{ marginBottom: '2rem' }}>
                        <div className="card-header">
                            <h3 className="card-title">Monthly Trends ({trends?.year})</h3>
                        </div>
                        <div className="chart-container" style={{ height: '350px' }}>
                            <Line data={trendLineData} options={chartOptions} />
                        </div>
                    </div>

                    {/* Recent Activities */}
                    <div className="card" style={{ marginBottom: '2rem' }}>
                        <div className="card-header">
                            <h3 className="card-title">Recent Entries</h3>
                            <Link to="/activities" className="uppercase" style={{ fontSize: '0.75rem' }}>View All</Link>
                        </div>
                        {filteredActivities.length > 0 ? (
                            <div className="table-container">
                                <table>
                                    <thead>
                                        <tr>
                                            <th>Date</th>
                                            <th>Category</th>
                                            <th>Type</th>
                                            <th>Quantity</th>
                                            <th>CO2e</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredActivities.slice(0, 5).map(activity => (
                                            <tr key={activity.activityId}>
                                                <td className="mono">{new Date(activity.date).toLocaleDateString()}</td>
                                                <td>{activity.category}</td>
                                                <td>{activity.subcategory || '—'}</td>
                                                <td className="mono">{activity.quantity} {activity.unit}</td>
                                                <td className="mono" style={{ fontWeight: '600' }}>
                                                    {activity.co2eKg?.toFixed(2)} kg
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <p style={{ textAlign: 'center', padding: '1rem' }}>
                                No activities in selected time period
                            </p>
                        )}
                    </div>

                    {/* AI Insights */}
                    {insights && (
                        <div className="card">
                            <div className="card-header">
                                <h3 className="card-title">Optimization Log</h3>
                            </div>
                            <p style={{ marginBottom: '1rem' }}>{insights.summary}</p>

                            {insights.keyFindings?.length > 0 && (
                                <div className="ai-insight">
                                    <strong>Key Findings:</strong>
                                    <ul style={{ marginTop: '0.5rem', paddingLeft: '1.5rem' }}>
                                        {insights.keyFindings.map((finding, i) => (
                                            <li key={i} style={{ marginBottom: '0.25rem' }}>{finding}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {insights.quickWins?.length > 0 && (
                                <div className="ai-insight" style={{ marginTop: '1rem' }}>
                                    <strong>Quick Wins:</strong>
                                    <ul style={{ marginTop: '0.5rem', paddingLeft: '1.5rem' }}>
                                        {insights.quickWins.map((win, i) => (
                                            <li key={i} style={{ marginBottom: '0.25rem' }}>{win}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    )}
                </>
            )}
        </div>
    )
}

export default Dashboard
