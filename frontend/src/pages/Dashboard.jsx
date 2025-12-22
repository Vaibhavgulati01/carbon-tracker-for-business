import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Chart as ChartJS, ArcElement, CategoryScale, LinearScale, BarElement, LineElement, PointElement, Title, Tooltip, Legend } from 'chart.js'
import { Pie, Bar, Line } from 'react-chartjs-2'
import api from '../services/api'

// Register Chart.js components
ChartJS.register(ArcElement, CategoryScale, LinearScale, BarElement, LineElement, PointElement, Title, Tooltip, Legend)

function Dashboard() {
    const [overview, setOverview] = useState(null)
    const [trends, setTrends] = useState(null)
    const [insights, setInsights] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')

    useEffect(() => {
        fetchDashboardData()
    }, [])

    const fetchDashboardData = async () => {
        try {
            const [overviewRes, trendsRes] = await Promise.all([
                api.get('/dashboard/overview'),
                api.get('/dashboard/trends')
            ])

            setOverview(overviewRes.data)
            setTrends(trendsRes.data)

            // Fetch AI insights (non-blocking)
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

    if (loading) {
        return (
            <div className="loading-screen" style={{ minHeight: '50vh' }}>
                <div className="loader"></div>
                <p>Loading dashboard...</p>
            </div>
        )
    }

    if (error) {
        return (
            <div className="animate-fadeIn">
                <div className="page-header">
                    <h1 className="page-title">📊 Dashboard</h1>
                </div>
                <div className="card">
                    <p style={{ color: 'var(--text-muted)', textAlign: 'center' }}>
                        {error}
                    </p>
                    <div style={{ textAlign: 'center', marginTop: '1rem' }}>
                        <Link to="/organization" className="btn btn-primary">Set Up Organization</Link>
                    </div>
                </div>
            </div>
        )
    }

    const { overview: data } = overview || {}
    const hasData = data?.activityCount > 0

    // Scope Pie Chart Data
    const scopePieData = {
        labels: ['Scope 1 (Direct)', 'Scope 2 (Energy)', 'Scope 3 (Value Chain)'],
        datasets: [{
            data: [
                data?.scopeBreakdown?.scope1?.kg || 0,
                data?.scopeBreakdown?.scope2?.kg || 0,
                data?.scopeBreakdown?.scope3?.kg || 0
            ],
            backgroundColor: ['#F59E0B', '#3B82F6', '#10B981'],
            borderWidth: 0
        }]
    }

    // Category Bar Chart Data
    const categoryBarData = {
        labels: data?.categoryBreakdown?.slice(0, 6).map(c => c.category) || [],
        datasets: [{
            label: 'CO₂e (kg)',
            data: data?.categoryBreakdown?.slice(0, 6).map(c => c.kg) || [],
            backgroundColor: '#10B981',
            borderRadius: 6
        }]
    }

    // Monthly Trend Line Chart Data
    const trendLineData = {
        labels: trends?.trends?.map(t => t.month) || [],
        datasets: [
            {
                label: 'Scope 1',
                data: trends?.trends?.map(t => t.scope1) || [],
                borderColor: '#F59E0B',
                backgroundColor: 'rgba(245, 158, 11, 0.1)',
                tension: 0.4,
                fill: true
            },
            {
                label: 'Scope 2',
                data: trends?.trends?.map(t => t.scope2) || [],
                borderColor: '#3B82F6',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                tension: 0.4,
                fill: true
            },
            {
                label: 'Scope 3',
                data: trends?.trends?.map(t => t.scope3) || [],
                borderColor: '#10B981',
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                tension: 0.4,
                fill: true
            }
        ]
    }

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'bottom',
                labels: { color: '#94A3B8', padding: 15 }
            }
        },
        scales: {
            x: { ticks: { color: '#94A3B8' }, grid: { color: 'rgba(255,255,255,0.05)' } },
            y: { ticks: { color: '#94A3B8' }, grid: { color: 'rgba(255,255,255,0.05)' } }
        }
    }

    return (
        <div className="animate-fadeIn">
            <div className="page-header">
                <h1 className="page-title">📊 Dashboard</h1>
                <p className="page-subtitle">
                    {overview?.organization?.name || 'Your organization'} - Carbon Emissions Overview
                </p>
            </div>

            {!hasData ? (
                <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
                    <h3 style={{ marginBottom: '1rem' }}>No emission data yet</h3>
                    <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
                        Start by adding your first activity to see your carbon footprint.
                    </p>
                    <Link to="/activities" className="btn btn-primary">Add First Activity</Link>
                </div>
            ) : (
                <>
                    {/* Stats Cards */}
                    <div className="dashboard-grid">
                        <div className="stat-card">
                            <div className="stat-value">{data?.totalEmissions?.tonnes?.toFixed(2) || 0}</div>
                            <div className="stat-label">Total Emissions (tCO₂e)</div>
                        </div>
                        <div className="stat-card" style={{ borderLeft: '3px solid var(--scope1)' }}>
                            <div className="stat-value">{data?.scopeBreakdown?.scope1?.percentage || 0}%</div>
                            <div className="stat-label">Scope 1 (Direct)</div>
                        </div>
                        <div className="stat-card" style={{ borderLeft: '3px solid var(--scope2)' }}>
                            <div className="stat-value">{data?.scopeBreakdown?.scope2?.percentage || 0}%</div>
                            <div className="stat-label">Scope 2 (Energy)</div>
                        </div>
                        <div className="stat-card" style={{ borderLeft: '3px solid var(--scope3)' }}>
                            <div className="stat-value">{data?.scopeBreakdown?.scope3?.percentage || 0}%</div>
                            <div className="stat-label">Scope 3 (Value Chain)</div>
                        </div>
                    </div>

                    {/* Charts */}
                    <div className="charts-grid">
                        <div className="card">
                            <div className="card-header">
                                <h3 className="card-title">Emissions by Scope</h3>
                            </div>
                            <div className="chart-container">
                                <Pie data={scopePieData} options={{ ...chartOptions, plugins: { ...chartOptions.plugins, legend: { position: 'right', labels: { color: '#94A3B8' } } } }} />
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
                            <h3 className="card-title">Monthly Emission Trends ({trends?.year})</h3>
                        </div>
                        <div className="chart-container" style={{ height: '350px' }}>
                            <Line data={trendLineData} options={chartOptions} />
                        </div>
                    </div>

                    {/* AI Insights */}
                    {insights && (
                        <div className="card">
                            <div className="card-header">
                                <h3 className="card-title">🤖 AI Insights</h3>
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
