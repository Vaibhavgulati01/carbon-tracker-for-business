import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'

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
            name: 'Switch to Renewable Energy',
            description: 'What if we switch 50% of our electricity to renewable sources?',
            parameters: { renewablePercentage: 50 }
        },
        {
            name: 'Reduce Business Travel',
            description: 'What if we reduce business travel by 30% through virtual meetings?',
            parameters: { travelReduction: 30 }
        },
        {
            name: 'Electric Vehicle Fleet',
            description: 'What if we replace 40% of our fleet with electric vehicles?',
            parameters: { evPercentage: 40 }
        },
        {
            name: 'Remote Work Policy',
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

    return (
        <div className="animate-fadeIn">
            <div className="page-header">
                <h1 className="page-title">🔮 What-If Scenarios</h1>
                <p className="page-subtitle">Simulate emission reduction strategies with AI-powered analysis</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                {/* Scenario Form */}
                <div>
                    <div className="card" style={{ marginBottom: '1.5rem' }}>
                        <h3 style={{ marginBottom: '1rem' }}>Quick Scenarios</h3>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                            {SCENARIO_TEMPLATES.map((template, i) => (
                                <button
                                    key={i}
                                    onClick={() => applyTemplate(template)}
                                    className="btn btn-secondary"
                                    style={{ fontSize: '0.85rem', padding: '0.5rem 0.75rem' }}
                                >
                                    {template.name}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="card">
                        <h3 style={{ marginBottom: '1rem' }}>Custom Scenario</h3>

                        {error && <div className="error-message">{error}</div>}

                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label>Describe Your Scenario *</label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    placeholder="e.g., What if we reduce electricity consumption by 20% and switch to renewable energy?"
                                    rows="4"
                                    required
                                />
                            </div>

                            <button type="submit" className="btn btn-primary btn-full" disabled={analyzing || !user?.organizationId}>
                                {analyzing ? '🤖 Analyzing with AI...' : '🚀 Analyze Scenario'}
                            </button>
                        </form>

                        {/* Result */}
                        {result && (
                            <div className="scenario-result" style={{ marginTop: '1.5rem' }}>
                                <h4 style={{ marginBottom: '1rem', color: 'var(--primary)' }}>
                                    {result.analysis?.scenarioName || 'Analysis Result'}
                                </h4>

                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem', marginBottom: '1rem' }}>
                                    <div>
                                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Current Emissions</div>
                                        <div style={{ fontSize: '1.25rem', fontWeight: '600' }}>
                                            {(result.currentEmissions?.totalEmissions / 1000)?.toFixed(2)} tCO₂e
                                        </div>
                                    </div>
                                    <div>
                                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Predicted Reduction</div>
                                        <div style={{ fontSize: '1.25rem', fontWeight: '600', color: 'var(--success)' }}>
                                            -{result.analysis?.predictedReduction?.percentage || 0}%
                                        </div>
                                    </div>
                                </div>

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
                                    <div className="ai-insight" style={{ marginTop: '0.75rem', borderColor: 'var(--warning)' }}>
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
                                        <strong>Next Steps:</strong>
                                        <ol style={{ marginTop: '0.5rem', paddingLeft: '1.5rem', color: 'var(--text-secondary)' }}>
                                            {result.analysis.nextSteps.map((step, i) => (
                                                <li key={i} style={{ marginBottom: '0.25rem' }}>{step}</li>
                                            ))}
                                        </ol>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Previous Scenarios */}
                <div className="card">
                    <div className="card-header">
                        <h3 className="card-title">Previous Scenarios</h3>
                    </div>

                    {scenarios.length === 0 ? (
                        <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem' }}>
                            No scenarios analyzed yet. Try one of the quick scenarios!
                        </p>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {scenarios.slice(0, 5).map(scenario => (
                                <div
                                    key={scenario.scenarioId}
                                    style={{
                                        background: 'var(--bg-tertiary)',
                                        borderRadius: 'var(--radius-md)',
                                        padding: '1rem'
                                    }}
                                >
                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                                        {new Date(scenario.createdAt).toLocaleDateString()}
                                    </div>
                                    <p style={{ marginBottom: '0.5rem', color: 'var(--text-primary)' }}>
                                        {scenario.description}
                                    </p>
                                    <div style={{ display: 'flex', gap: '1rem', fontSize: '0.85rem' }}>
                                        <span style={{ color: 'var(--success)' }}>
                                            -{scenario.analysis?.predictedReduction?.percentage || 0}% reduction
                                        </span>
                                        <span style={{ color: 'var(--text-muted)' }}>
                                            {scenario.analysis?.implementation?.difficulty || 'N/A'} difficulty
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

export default ScenarioSimulation
