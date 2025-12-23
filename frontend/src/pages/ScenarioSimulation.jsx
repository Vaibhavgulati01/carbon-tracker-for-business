import { useState, useEffect } from 'react'
import { Chart as ChartJS, CategoryScale, LinearScale, LineElement, PointElement, Title, Tooltip, Legend } from 'chart.js'
import { Line } from 'react-chartjs-2'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, LineElement, PointElement, Title, Tooltip, Legend)

function ScenarioSimulation() {
    const { user } = useAuth()
    const [scenarios, setScenarios] = useState([])
    const [loading, setLoading] = useState(false)
    const [analyzing, setAnalyzing] = useState(false)
    const [error, setError] = useState('')
    const [result, setResult] = useState(null)

    const [formData, setFormData] = useState({
        description: '',
        parameters: {}
    })

    const SCENARIO_TEMPLATES = [
        {
            name: 'Renewable Energy',
            description: 'What if we switch 50% of our electricity to renewable sources?',
            parameters: { renewablePercentage: 50 }
        },
        {
            name: 'Reduce Travel',
            description: 'What if we reduce business travel by 30% through virtual meetings?',
            parameters: { travelReduction: 30 }
        },
        {
            name: 'EV Fleet',
            description: 'What if we replace 40% of our fleet with electric vehicles?',
            parameters: { evPercentage: 40 }
        },
        {
            name: 'Remote Work',
            description: 'What if we implement 3 days/week remote work for all employees?',
            parameters: { remoteDays: 3 }
        },
        {
            name: 'Energy Efficiency',
            description: 'What if we improve building energy efficiency by 25%?',
            parameters: { efficiencyImprovement: 25 }
        }
    ]

    useEffect(() => {
        fetchScenarios()
    }, [])

    const fetchScenarios = async () => {
        try {
            const response = await api.get('/ai/scenarios')
            setScenarios(response.data.scenarios || [])
        } catch (err) {
            console.error('Failed to fetch scenarios:', err)
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault()

        if (!user?.organizationId) {
            setError('Please set up your organization first')
            return
        }

        if (!formData.description.trim()) {
            setError('Please describe your scenario')
            return
        }

        setAnalyzing(true)
        setError('')
        setResult(null)

        try {
            const response = await api.post('/ai/scenario', formData)
            setResult(response.data)
            fetchScenarios()
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to analyze scenario')
        } finally {
            setAnalyzing(false)
        }
    }

    const applyTemplate = (template) => {
        setFormData({
            description: template.description,
            parameters: template.parameters
        })
        setResult(null)
    }

    // Load a saved scenario to view its results
    const loadScenario = async (scenario) => {
        // Fetch current emissions from dashboard if not stored in scenario
        let currentEmissions = scenario.currentEmissions

        if (!currentEmissions || !currentEmissions.totalEmissions) {
            try {
                const dashRes = await api.get('/dashboard/overview')
                currentEmissions = {
                    totalEmissions: dashRes.data?.overview?.totalEmissions?.kg || 0
                }
            } catch (err) {
                console.log('Could not fetch current emissions')
                currentEmissions = { totalEmissions: 0 }
            }
        }

        setResult({
            currentEmissions,
            analysis: scenario.analysis,
            description: scenario.description
        })
        setFormData({
            description: scenario.description,
            parameters: scenario.parameters || {}
        })
    }

    // Generate projection data for chart
    const generateProjectionChart = () => {
        if (!result) return null

        const currentEmissions = result.currentEmissions?.totalEmissions / 1000 || 100
        const reductionPercent = result.analysis?.predictedReduction?.percentage || 0
        const months = ['Now', 'M3', 'M6', 'M9', 'Y1', 'Y2']

        // Current trajectory (slight increase)
        const currentTrajectory = months.map((_, i) => currentEmissions * (1 + (i * 0.02)))

        // Projected trajectory with reduction (gradual decrease)
        const projectedTrajectory = months.map((_, i) => {
            const reduction = (reductionPercent / 100) * (i / (months.length - 1))
            return currentEmissions * (1 - reduction)
        })

        return {
            labels: months,
            datasets: [
                {
                    label: 'Current Trajectory',
                    data: currentTrajectory,
                    borderColor: '#999999',
                    backgroundColor: 'transparent',
                    borderWidth: 2,
                    borderDash: [5, 5],
                    tension: 0.4,
                    pointRadius: 4,
                    pointBackgroundColor: '#999999'
                },
                {
                    label: 'With Scenario',
                    data: projectedTrajectory,
                    borderColor: '#1A1A1A',
                    backgroundColor: 'transparent',
                    borderWidth: 3,
                    tension: 0.4,
                    pointRadius: 5,
                    pointBackgroundColor: '#1A1A1A'
                }
            ]
        }
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
                ticks: {
                    color: '#1A1A1A',
                    font: { family: "'JetBrains Mono', monospace" },
                    callback: (value) => value.toFixed(1) + ' t'
                },
                grid: { color: '#E5E5E5' },
                border: { color: '#000000', width: 2 },
                title: {
                    display: true,
                    text: 'Emissions (tCO2e)',
                    color: '#1A1A1A',
                    font: { family: "'JetBrains Mono', monospace", size: 11 }
                }
            }
        }
    }

    const projectionData = generateProjectionChart()

    return (
        <div className="page-container">
            <div className="page-header">
                <h1 className="page-title">SCENARIOS</h1>
                <p className="page-subtitle">Simulate emission reduction strategies with AI-powered analysis</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                {/* Scenario Form */}
                <div>
                    <div className="card" style={{ marginBottom: '1.5rem' }}>
                        <div className="card-header">
                            <h3 className="card-title">Quick Scenarios</h3>
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                            {SCENARIO_TEMPLATES.map((template, i) => (
                                <button
                                    key={i}
                                    onClick={() => applyTemplate(template)}
                                    className="btn btn-secondary"
                                    style={{ fontSize: '0.8rem', padding: '0.5rem 0.75rem' }}
                                >
                                    {template.name}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="card">
                        <div className="card-header">
                            <h3 className="card-title">Custom Scenario</h3>
                        </div>

                        {error && <div className="error-message">{error}</div>}

                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label>Describe Your Scenario</label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    placeholder="e.g., What if we reduce electricity consumption by 20% and switch to renewable energy?"
                                    rows="4"
                                    required
                                />
                            </div>

                            <button type="submit" className="btn btn-solid btn-full" disabled={analyzing || !user?.organizationId}>
                                {analyzing ? 'Analyzing...' : 'Analyze Scenario'}
                            </button>
                        </form>
                    </div>
                </div>

                {/* Results & Chart */}
                <div>
                    {result ? (
                        <div className="card">
                            <div className="card-header">
                                <h3 className="card-title">{result.analysis?.scenarioName || 'Analysis Result'}</h3>
                                <button
                                    onClick={() => setResult(null)}
                                    className="btn btn-secondary"
                                    style={{ fontSize: '0.75rem', padding: '0.25rem 0.75rem' }}
                                >
                                    Back
                                </button>
                            </div>

                            {/* Stats */}
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
                                <div className="stat-card">
                                    <div className="stat-value">{(result.currentEmissions?.totalEmissions / 1000)?.toFixed(2)}</div>
                                    <div className="stat-label">Current (tCO2e)</div>
                                </div>
                                <div className="stat-card" style={{ borderColor: '#1A1A1A' }}>
                                    <div className="stat-value">-{result.analysis?.predictedReduction?.percentage || 0}%</div>
                                    <div className="stat-label">Predicted Reduction</div>
                                </div>
                            </div>

                            {/* Projection Chart */}
                            {projectionData && (
                                <div style={{ marginBottom: '1.5rem' }}>
                                    <h4 className="uppercase" style={{ fontSize: '0.75rem', marginBottom: '1rem', letterSpacing: '0.05em' }}>
                                        Emission Projection
                                    </h4>
                                    <div style={{ height: '250px' }}>
                                        <Line data={projectionData} options={chartOptions} />
                                    </div>
                                </div>
                            )}

                            {result.analysis?.benefits?.length > 0 && (
                                <div className="ai-insight">
                                    <strong>Benefits:</strong>
                                    <ul style={{ marginTop: '0.5rem', paddingLeft: '1.5rem' }}>
                                        {result.analysis.benefits.map((b, i) => (
                                            <li key={i}>{b}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {result.analysis?.challenges?.length > 0 && (
                                <div className="ai-insight" style={{ marginTop: '0.75rem' }}>
                                    <strong>Challenges:</strong>
                                    <ul style={{ marginTop: '0.5rem', paddingLeft: '1.5rem' }}>
                                        {result.analysis.challenges.map((c, i) => (
                                            <li key={i}>{c}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {result.analysis?.nextSteps?.length > 0 && (
                                <div style={{ marginTop: '1rem' }}>
                                    <strong className="uppercase" style={{ fontSize: '0.75rem', letterSpacing: '0.03em' }}>Next Steps:</strong>
                                    <ol style={{ marginTop: '0.5rem', paddingLeft: '1.5rem' }}>
                                        {result.analysis.nextSteps.map((step, i) => (
                                            <li key={i} style={{ marginBottom: '0.25rem' }}>{step}</li>
                                        ))}
                                    </ol>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="card">
                            <div className="card-header">
                                <h3 className="card-title">Previous Scenarios</h3>
                                {result && (
                                    <button
                                        onClick={() => setResult(null)}
                                        className="btn btn-secondary"
                                        style={{ fontSize: '0.75rem', padding: '0.25rem 0.75rem' }}
                                    >
                                        View History
                                    </button>
                                )}
                            </div>

                            {scenarios.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: '3rem 2rem' }}>
                                    <p style={{ fontSize: '2rem', marginBottom: '1rem' }}>○</p>
                                    <p style={{ marginBottom: '0.5rem' }}>No scenarios analyzed yet</p>
                                    <p style={{ fontSize: '0.875rem', color: 'var(--pencil)' }}>
                                        Try one of the quick scenarios
                                    </p>
                                </div>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                    {scenarios.slice(0, 8).map(scenario => (
                                        <button
                                            key={scenario.scenarioId}
                                            onClick={() => loadScenario(scenario)}
                                            style={{
                                                background: 'var(--paper)',
                                                border: '1px solid var(--graphite)',
                                                borderRadius: 'var(--radius-md)',
                                                padding: '1rem',
                                                textAlign: 'left',
                                                cursor: 'pointer',
                                                transition: 'all 0.15s ease'
                                            }}
                                            onMouseEnter={(e) => {
                                                e.currentTarget.style.borderColor = 'var(--ink)'
                                                e.currentTarget.style.background = 'var(--white)'
                                            }}
                                            onMouseLeave={(e) => {
                                                e.currentTarget.style.borderColor = 'var(--graphite)'
                                                e.currentTarget.style.background = 'var(--paper)'
                                            }}
                                        >
                                            <div className="mono" style={{ fontSize: '0.7rem', color: 'var(--pencil)', marginBottom: '0.5rem' }}>
                                                {new Date(scenario.createdAt).toLocaleDateString()}
                                            </div>
                                            <p style={{ marginBottom: '0.5rem', fontSize: '0.9rem' }}>
                                                {scenario.description.length > 80
                                                    ? scenario.description.slice(0, 80) + '...'
                                                    : scenario.description}
                                            </p>
                                            <div style={{ display: 'flex', gap: '1rem', fontSize: '0.8rem' }}>
                                                <span className="mono" style={{ fontWeight: '600' }}>
                                                    -{scenario.analysis?.predictedReduction?.percentage || 0}%
                                                </span>
                                                <span style={{ color: 'var(--pencil)' }}>
                                                    Click to view
                                                </span>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

export default ScenarioSimulation
