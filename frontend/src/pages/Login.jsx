import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

function Login() {
    const { login } = useAuth()
    const navigate = useNavigate()
    const [formData, setFormData] = useState({ email: '', password: '' })
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)
        setError('')

        try {
            await login(formData.email, formData.password)
            navigate('/dashboard')
        } catch (err) {
            setError(err.response?.data?.error || 'Login failed. Please try again.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="auth-container">
            <div className="auth-form-side">
                <div className="auth-card">
                    <div className="auth-logo">
                        <div className="auth-logo-icon">🌱</div>
                        <span className="auth-logo-text">CARBON TRACKER</span>
                    </div>

                    <h1 className="auth-title">Access Terminal</h1>
                    <p className="auth-subtitle">Enter your credentials to continue</p>

                    {error && <div className="error-message">{error}</div>}

                    <form onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label htmlFor="email">Email Address</label>
                            <input
                                type="email"
                                id="email"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                placeholder="name@company.com"
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="password">Password</label>
                            <input
                                type="password"
                                id="password"
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                placeholder="••••••••"
                                required
                            />
                        </div>

                        <button type="submit" className="btn btn-solid btn-full btn-large" disabled={loading}>
                            {loading ? 'Authenticating...' : 'Enter Terminal →'}
                        </button>
                    </form>

                    <p className="auth-footer">
                        New organization? <Link to="/register">Create Account</Link>
                    </p>
                </div>
            </div>
            <div className="auth-pattern-side"></div>
        </div>
    )
}

export default Login
