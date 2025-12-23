import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'

function AuditReport() {
    const { user } = useAuth()
    const [dashboardData, setDashboardData] = useState(null)
    const [activities, setActivities] = useState([])
    const [loading, setLoading] = useState(true)
    const [generating, setGenerating] = useState(false)

    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = async () => {
        try {
            const [dashRes, actRes] = await Promise.all([
                api.get('/dashboard/overview'),
                api.get('/activities')
            ])
            setDashboardData(dashRes.data)
            setActivities(actRes.data.activities || [])
        } catch (error) {
            console.error('Error fetching data:', error)
        } finally {
            setLoading(false)
        }
    }

    const generatePDF = () => {
        setGenerating(true)

        const printContent = document.getElementById('audit-content')
        const printWindow = window.open('', '_blank')

        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Carbon Audit Report - ${new Date().toLocaleDateString()}</title>
                <style>
                    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&family=JetBrains+Mono:wght@400;500&display=swap');
                    body { 
                        font-family: 'Georgia', 'Times New Roman', serif; 
                        padding: 40px; 
                        color: #1A1A1A;
                        background: #FFFFFF;
                        line-height: 1.6;
                    }
                    h1 { 
                        font-family: 'Inter', sans-serif;
                        text-align: center;
                        font-size: 24px;
                        text-transform: uppercase;
                        letter-spacing: 0.05em;
                        border-bottom: 2px solid #000;
                        padding-bottom: 1rem;
                        margin-bottom: 2rem;
                    }
                    h2 { 
                        font-family: 'Inter', sans-serif;
                        font-size: 14px;
                        text-transform: uppercase;
                        letter-spacing: 0.03em;
                        margin-top: 2rem;
                        margin-bottom: 1rem;
                        border-bottom: 1px solid #000;
                        padding-bottom: 0.5rem;
                    }
                    .header { text-align: center; margin-bottom: 2rem; }
                    .header p { font-size: 12px; color: #666; }
                    .summary-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; margin: 1.5rem 0; }
                    .summary-item { 
                        background: #F2EFE9; 
                        padding: 1rem; 
                        border: 1px solid #000; 
                        text-align: center; 
                    }
                    .summary-value { 
                        font-family: 'JetBrains Mono', monospace;
                        font-size: 24px; 
                        font-weight: 700; 
                    }
                    .summary-label { 
                        font-size: 10px; 
                        text-transform: uppercase;
                        letter-spacing: 0.05em;
                        color: #666; 
                    }
                    table { width: 100%; border-collapse: collapse; margin: 1rem 0; }
                    th { 
                        background: #1A1A1A; 
                        color: #FFF; 
                        padding: 0.75rem; 
                        text-align: left;
                        font-family: 'Inter', sans-serif;
                        font-size: 10px;
                        text-transform: uppercase;
                    }
                    td { 
                        padding: 0.75rem; 
                        border-bottom: 1px solid #CCC;
                        font-size: 12px;
                    }
                    .mono { font-family: 'JetBrains Mono', monospace; }
                    .footer { 
                        margin-top: 3rem; 
                        text-align: center; 
                        font-size: 10px; 
                        color: #666;
                        border-top: 1px solid #CCC;
                        padding-top: 1rem;
                    }
                    @media print { body { padding: 20px; } }
                </style>
            </head>
            <body>
                ${printContent.innerHTML}
            </body>
            </html>
        `)

        printWindow.document.close()
        printWindow.focus()

        setTimeout(() => {
            printWindow.print()
            setGenerating(false)
        }, 500)
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
                    <p className="mono uppercase">Loading report data...</p>
                </div>
            </div>
        )
    }

    // Extract data from the nested overview object
    const overviewData = dashboardData?.overview || {}
    const totalEmissions = overviewData?.totalEmissions?.kg || 0
    const scopeBreakdown = {
        scope1: overviewData?.scopeBreakdown?.scope1?.kg || 0,
        scope2: overviewData?.scopeBreakdown?.scope2?.kg || 0,
        scope3: overviewData?.scopeBreakdown?.scope3?.kg || 0
    }
    const categoryCount = overviewData?.categoryBreakdown?.length || 0

    return (
        <div className="page-container">
            <header className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                    <h1 className="page-title">AUDIT REPORT</h1>
                    <p className="page-subtitle">Generate and export carbon emissions audit documentation</p>
                </div>
                <button
                    onClick={generatePDF}
                    className="btn btn-solid"
                    disabled={generating}
                >
                    {generating ? 'Generating...' : '↓ Export PDF'}
                </button>
            </header>

            {/* Preview Section */}
            <div className="audit-preview">
                <div id="audit-content">
                    <div className="header">
                        <h1>Carbon Emissions Audit Report</h1>
                        <p>Generated: {new Date().toLocaleDateString('en-US', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                        })}</p>
                    </div>

                    <h2>Executive Summary</h2>
                    <div className="summary-grid">
                        <div className="summary-item">
                            <div className="summary-value">{(totalEmissions / 1000).toFixed(2)}</div>
                            <div className="summary-label">Total Emissions (tCO₂e)</div>
                        </div>
                        <div className="summary-item">
                            <div className="summary-value">{activities.length}</div>
                            <div className="summary-label">Activities Logged</div>
                        </div>
                        <div className="summary-item">
                            <div className="summary-value">{categoryCount}</div>
                            <div className="summary-label">Emission Categories</div>
                        </div>
                    </div>

                    <h2>Scope Breakdown</h2>
                    <table>
                        <thead>
                            <tr>
                                <th>Scope</th>
                                <th>Description</th>
                                <th style={{ textAlign: 'right' }}>Emissions (tCO₂e)</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td className="mono">■ Scope 1</td>
                                <td>Direct Emissions</td>
                                <td className="mono" style={{ textAlign: 'right' }}>{(scopeBreakdown.scope1 / 1000).toFixed(2)}</td>
                            </tr>
                            <tr>
                                <td className="mono">▤ Scope 2</td>
                                <td>Indirect - Energy</td>
                                <td className="mono" style={{ textAlign: 'right' }}>{(scopeBreakdown.scope2 / 1000).toFixed(2)}</td>
                            </tr>
                            <tr>
                                <td className="mono">░ Scope 3</td>
                                <td>Value Chain</td>
                                <td className="mono" style={{ textAlign: 'right' }}>{(scopeBreakdown.scope3 / 1000).toFixed(2)}</td>
                            </tr>
                        </tbody>
                    </table>

                    <h2>Activity Log</h2>
                    {activities.length > 0 ? (
                        <table>
                            <thead>
                                <tr>
                                    <th>Date</th>
                                    <th>Category</th>
                                    <th>Description</th>
                                    <th style={{ textAlign: 'right' }}>Emissions (kg CO₂e)</th>
                                </tr>
                            </thead>
                            <tbody>
                                {activities.slice(0, 20).map((activity, idx) => (
                                    <tr key={idx}>
                                        <td className="mono">{new Date(activity.date).toLocaleDateString()}</td>
                                        <td>{activity.category}</td>
                                        <td>{activity.description || activity.subcategory || '—'}</td>
                                        <td className="mono" style={{ textAlign: 'right' }}>{activity.co2eKg?.toFixed(2) || '0.00'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <p>No activities logged.</p>
                    )}
                    {activities.length > 20 && (
                        <p style={{ fontStyle: 'italic', fontSize: '12px' }}>Showing first 20 of {activities.length} activities</p>
                    )}

                    <div className="footer">
                        <p>This report was generated by Carbon Tracker for Business</p>
                        <p>© {new Date().getFullYear()} — For compliance and sustainability reporting purposes</p>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default AuditReport
