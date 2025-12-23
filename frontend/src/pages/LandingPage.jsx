import { Link } from 'react-router-dom'

function LandingPage() {
    return (
        <div className="landing-page">
            {/* Header */}
            <header className="landing-header">
                <nav className="landing-nav">
                    <Link to="/" className="landing-logo">
                        <span className="logo-icon">🌱</span>
                        <span>CARBON TRACKER</span>
                    </Link>
                    <div style={{ display: 'flex', gap: '0.75rem' }}>
                        <Link to="/login" className="btn btn-secondary">
                            Login
                        </Link>
                        <Link to="/register" className="btn btn-solid">
                            Get Started
                        </Link>
                    </div>
                </nav>
            </header>

            {/* Hero Section */}
            <section className="hero">
                <h1 className="hero-title">
                    TRACK.<br />
                    REDUCE.<br />
                    REPORT.
                </h1>
                <p className="hero-subtitle">
                    A precision tool for measuring, analyzing, and reducing your organization's
                    carbon footprint. Built for compliance. Designed for impact.
                </p>
                <div className="hero-cta">
                    <Link to="/register" className="btn btn-solid btn-large">
                        Start Tracking →
                    </Link>
                    <Link to="/login" className="btn btn-primary btn-large">
                        View Demo
                    </Link>
                </div>
            </section>

            {/* Stats Row */}
            <section className="stats-row">
                <div className="stat-card">
                    <div className="stat-value mono">2.4M</div>
                    <div className="stat-label">Tonnes CO₂e Tracked</div>
                </div>
                <div className="stat-card">
                    <div className="stat-value mono">23%</div>
                    <div className="stat-label">Avg. Reduction</div>
                </div>
                <div className="stat-card">
                    <div className="stat-value mono">847</div>
                    <div className="stat-label">Organizations</div>
                </div>
            </section>

            {/* Features Grid */}
            <section className="features-section">
                <h2 className="section-title">Capabilities</h2>
                <div className="features-grid">
                    <div className="feature-card">
                        <div className="feature-icon">■</div>
                        <h3>Real-Time Dashboard</h3>
                        <p>Monitor emissions across Scope 1, 2, and 3 with live data visualization.</p>
                    </div>
                    <div className="feature-card">
                        <div className="feature-icon">◇</div>
                        <h3>AI Insights</h3>
                        <p>Automated analysis identifies reduction opportunities and optimizations.</p>
                    </div>
                    <div className="feature-card">
                        <div className="feature-icon">+</div>
                        <h3>Activity Logging</h3>
                        <p>Comprehensive data entry with automatic emission factor calculations.</p>
                    </div>
                    <div className="feature-card">
                        <div className="feature-icon">↓</div>
                        <h3>Audit Reports</h3>
                        <p>Generate compliance-ready PDF reports for stakeholders and regulators.</p>
                    </div>
                </div>
            </section>

            {/* How It Works */}
            <section className="how-it-works">
                <h2 className="section-title">Process</h2>
                <div className="steps">
                    <div className="step">
                        <div className="step-number mono">01</div>
                        <h3>Register</h3>
                        <p>Create your account and configure your organization profile.</p>
                    </div>
                    <div className="step">
                        <div className="step-number mono">02</div>
                        <h3>Log Data</h3>
                        <p>Input your emission activities across all scopes and categories.</p>
                    </div>
                    <div className="step">
                        <div className="step-number mono">03</div>
                        <h3>Analyze</h3>
                        <p>Review AI-powered insights and identify reduction opportunities.</p>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="cta-section">
                <h2>Start Measuring Today</h2>
                <p>Join organizations committed to carbon transparency and reduction.</p>
                <Link to="/register" className="btn btn-primary btn-large">
                    Create Free Account
                </Link>
            </section>

            {/* Footer */}
            <footer className="landing-footer">
                <p>© {new Date().getFullYear()} Carbon Tracker — Environmental Data Platform</p>
            </footer>
        </div>
    )
}

export default LandingPage
