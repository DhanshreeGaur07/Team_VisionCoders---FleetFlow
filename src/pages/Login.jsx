import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, AlertTriangle } from 'lucide-react'
import useAuthStore from '../stores/authStore'

export default function Login() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [showPw, setShowPw] = useState(false)
    const login = useAuthStore((s) => s.login)
    const loading = useAuthStore((s) => s.loading)
    const error = useAuthStore((s) => s.error)
    const clearError = useAuthStore((s) => s.clearError)
    const navigate = useNavigate()

    const handleSubmit = async (e) => {
        e.preventDefault()
        clearError()
        const result = await login(email.trim(), password)
        if (!result.error) {
            navigate('/')
        }
    }

    return (
        <div className="login-page">
            {/* Left visual panel */}
            <div className="login-visual">
                <div className="login-visual-content">
                    {/* Radar */}
                    <div className="radar-sweep">
                        <div className="radar-ring" />
                        <div className="radar-ring" />
                        <div className="radar-dot" />
                        <div className="radar-dot" />
                        <div className="radar-dot" />
                    </div>

                    <h2>Fleet<br /><em>Pulse</em></h2>
                    <p>
                        Industrial-grade fleet command. Monitor your entire delivery
                        fleet, track driver compliance, and optimise operational costs —
                        unified in one precision control center.
                    </p>

                    {/* Stats row */}
                    <div className="login-stats">
                        <div className="login-stat-item">
                            <span className="login-stat-value">4</span>
                            <span className="login-stat-label">Roles</span>
                        </div>
                        <div className="login-stat-item">
                            <span className="login-stat-value">7</span>
                            <span className="login-stat-label">Modules</span>
                        </div>
                        <div className="login-stat-item">
                            <span className="login-stat-value">Live</span>
                            <span className="login-stat-label">Data</span>
                        </div>
                        <div className="login-stat-item">
                            <span className="login-stat-value">Real‑time</span>
                            <span className="login-stat-label">Insights</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right form panel */}
            <div className="login-form-side">
                <div className="login-form-header">
                    {/* Logo mark */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 28 }}>
                        <div style={{
                            width: 30, height: 30,
                            background: 'var(--amber)',
                            borderRadius: 'var(--r-sm)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            flexShrink: 0,
                        }}>
                            <svg viewBox="0 0 16 16" fill="var(--bg-base)" width={15} height={15}>
                                <path d="M2 3h7l3 4-3 4H2l3-4-3-4z"/>
                            </svg>
                        </div>
                        <span style={{
                            fontFamily: 'var(--font-display)',
                            fontSize: '0.85rem',
                            fontWeight: 700,
                            letterSpacing: '0.1em',
                            textTransform: 'uppercase',
                            color: 'var(--text-primary)',
                        }}>FleetPulse</span>
                    </div>
                    <h1>Sign In</h1>
                    <p>Access the command center</p>
                </div>

                {error && (
                    <div style={{
                        padding: '10px 14px', marginBottom: 'var(--sp-5)',
                        background: 'var(--status-error-dim)',
                        border: '1px solid rgba(232,64,64,0.2)',
                        borderRadius: 'var(--r-md)',
                        color: 'var(--status-error)', fontSize: '0.78rem',
                        display: 'flex', alignItems: 'center', gap: 8,
                    }}>
                        <AlertTriangle size={14} /> {error}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label className="form-label">Email Address</label>
                        <input
                            className="form-input"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="operator@fleetpulse.io"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Password</label>
                        <div style={{ position: 'relative' }}>
                            <input
                                className="form-input"
                                type={showPw ? 'text' : 'password'}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Enter password"
                                minLength={6}
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowPw(!showPw)}
                                style={{
                                    position: 'absolute', right: 10, top: '50%',
                                    transform: 'translateY(-50%)',
                                    background: 'none', border: 'none',
                                    color: 'var(--text-muted)', cursor: 'pointer',
                                    padding: 4, display: 'flex', alignItems: 'center',
                                }}
                            >
                                {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
                            </button>
                        </div>
                    </div>

                    <div className="login-actions">
                        <button
                            className="btn btn-primary"
                            type="submit"
                            disabled={loading}
                            style={{ opacity: loading ? 0.7 : 1 }}
                        >
                            {loading ? (
                                <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <span className="spinner" />
                                    Authenticating...
                                </span>
                            ) : (
                                'Access Command Center'
                            )}
                        </button>
                    </div>

                    <div style={{ textAlign: 'center', marginTop: 'var(--sp-5)', fontSize: '0.78rem' }}>
                        <span style={{ color: 'var(--text-muted)' }}>Don't have an account? </span>
                        <Link to="/signup" style={{ color: 'var(--amber)' }}>Create Account</Link>
                    </div>
                </form>
            </div>
        </div>
    )
}
