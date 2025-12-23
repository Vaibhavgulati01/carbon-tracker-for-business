import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

function DisclaimerPage() {
    const { user, logout } = useAuth()
    const navigate = useNavigate()
    const [accepted, setAccepted] = useState(false)

    const currentDate = new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    })

    const handleInitialize = () => {
        if (accepted) {
            sessionStorage.removeItem('justRegistered')
            logout()
            navigate('/login')
        }
    }

    return (
        <div className="disclaimer-page">
            <div className="memo-container">
                {/* Header Block */}
                <header className="memo-header">
                    <h1>SYSTEM INITIALIZATION PROTOCOL</h1>
                    <div className="memo-meta">
                        <span><strong>REF:</strong> C-TRACK-2025-V1</span>
                        <span><strong>DATE:</strong> {currentDate}</span>
                    </div>
                </header>

                <hr className="memo-divider" />

                {/* Body Content */}
                <main className="memo-body">
                    <section className="memo-section">
                        <h2>1.0 // CORE DIRECTIVE</h2>
                        <p>
                            The purpose of this platform is not merely observation, but reduction. We convert opaque emission data into actionable reduction strategies. This system operates on a "Precision In, Precision Out" basis. The integrity of your audit depends entirely on the accuracy of your initial data entry. We employ AI-driven models to forecast anomalies, but these models require consistent, granular data inputs to function within acceptable error margins.
                        </p>
                    </section>

                    <section className="memo-section">
                        <h2>2.0 // EMISSION SCOPE DEFINITIONS</h2>
                        <p>
                            To ensure accurate categorization, adhere to the international GHG Protocol standards defined below. Misclassification leads to invalid audit reports.
                        </p>

                        <div className="scope-box scope-1">
                            <h3>[ SCOPE 01 ] DIRECT EMISSIONS</h3>
                            <p>
                                The "Burn" Category. Emissions from sources that are owned or controlled by your organization. This includes fuel combustion in furnaces, boilers, and company-owned vehicles.
                            </p>
                        </div>

                        <div className="scope-box scope-2">
                            <h3>[ SCOPE 02 ] INDIRECT ENERGY</h3>
                            <p>
                                The "Plug" Category. Emissions from the generation of purchased energy. This accounts for the electricity, steam, heating, and cooling consumed by your facilities.
                            </p>
                        </div>

                        <div className="scope-box scope-3">
                            <h3>[ SCOPE 03 ] VALUE CHAIN</h3>
                            <p>
                                The "Everything Else" Category. Indirect emissions that occur in your value chain, including business travel, waste disposal, purchased goods, and employee commuting.
                            </p>
                        </div>
                    </section>

                    <section className="memo-section">
                        <h2>3.0 // USAGE OPTIMIZATION</h2>
                        <p>
                            To maximize the utility of the AI Forecasting and "What-If" Simulation modules, users are advised to log activities monthly rather than annually. This granularity allows the system to detect seasonal inefficiencies. Users must maintain digital copies of utility bills and fuel receipts for the Audit Validation phase. Do not switch measurement units (e.g., liters vs. gallons) mid-year.
                        </p>
                    </section>

                    <section className="memo-section">
                        <h2>4.0 // LEGAL DISCLAIMER</h2>
                        <p>
                            This tool provides estimates based on standard conversion factors. It does not replace a certified ISO 14064 audit but serves as a pre-audit operational guide. All data entered is encrypted and used solely for your organization's analytics. The developers assume no liability for financial decisions made based on these projections.
                        </p>
                    </section>
                </main>

                <hr className="memo-divider" />

                {/* Action Block */}
                <footer className="memo-footer">
                    <label className="checkbox-label">
                        <input
                            type="checkbox"
                            checked={accepted}
                            onChange={(e) => setAccepted(e.target.checked)}
                        />
                        <span>I HAVE REVIEWED AND ACCEPT THE PROTOCOLS.</span>
                    </label>

                    <button
                        onClick={handleInitialize}
                        className="btn btn-solid btn-large"
                        disabled={!accepted}
                        style={{ marginTop: '1.5rem' }}
                    >
                        INITIALIZE SYSTEM
                    </button>
                </footer>
            </div>
        </div>
    )
}

export default DisclaimerPage
