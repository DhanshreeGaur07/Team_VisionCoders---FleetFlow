import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, AlertTriangle } from 'lucide-react'
import useAuthStore from '../stores/authStore'

export default function SignUp() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [fullName, setFullName] = useState('')
    const [role, setRole] = useState('Dispatcher')
    const [showPw, setShowPw] = useState(false)
    const [success, setSuccess] = useState(false)
    const signup = useAuthStore((s) => s.signup)
    const loading = useAuthStore((s) => s.loading)
    const error = useAuthStore((s) => s.error)
    const clearError = useAuthStore((s) => s.clearError)
    const navigate = useNavigate()

    const handleSubmit = async (e) => {
        e.preventDefault()
        clearError()
        const result = await signup(email.trim(), password, fullName.trim(), role)
        if (!result.error) {
            if (result.needsConfirmation) {
                setSuccess(true)
            } else {
                navigate('/')
            }
        }
    }

    if (success) {
        return (
            <div className="login-page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{
                    maxWidth: 420, width: '90%', padding: 'var(--sp-8)',
                    background: 'var(--bg-surface)', borderRadius: 'var(--r-xl)',
                    border: '1px solid var(--border-default)', textAlign: 'center',
                }}>
                    <div style={{
                        width: 48, height: 48, borderRadius: '50%',
                        background: 'var(--status-ok-dim)', color: 'var(--status-ok)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        margin: '0 auto var(--sp-5)', fontSize: '1.5rem',
                    }}>&#10003;</div>
                    <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', marginBottom: 'var(--sp-3)' }}>
                        Check Your Email
                    </h2>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: 'var(--sp-6)' }}>
                        We sent a confirmation link to <strong style={{ color: 'var(--text-secondary)' }}>{email}</strong>.
                        Click the link to activate your account.
                    </p>
                    <Link to="/login" className="btn btn-primary" style={{ display: 'inline-flex' }}>
                        Back to Sign In
                    </Link>
                </div>
            </div>
        )
    }

    return (
        <div className="login-page" style={{ gridTemplateColumns: '1fr 440px' }}>
            {/* Left visual */}
            <div className="login-visual">
                <div className="login-visual-content">
                    <div className="radar-sweep">
                        <div className="radar-ring" />
                        <div className="radar-ring" />
                        <div className="radar-dot" />
                        <div className="radar-dot" />
                        <div className="radar-dot" />
                    </div>
                    <h2>Join<br /><em>FleetPulse</em></h2>
                    <p>
                        Create your operator account. Your role determines which
                        modules and data you can access within the command system.
                    </p>

                    <div style={{ marginTop: 'var(--sp-8)', paddingTop: 'var(--sp-6)', borderTop: '1px solid var(--border-subtle)' }}>
                        <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.14em', marginBottom: 'var(--sp-4)' }}>
                            Available Roles
                        </div>
                        {[
                            { role: 'Fleet Manager', desc: 'Full access to all modules and analytics' },
                            { role: 'Dispatcher', desc: 'Trip management, vehicle dispatch, drivers' },
                            { role: 'Safety Officer', desc: 'Driver compliance, safety scores, alerts' },
                            { role: 'Financial Analyst', desc: 'Expenses, fuel tracking, ROI analysis' },
                        ].map((r) => (
                            <div key={r.role} style={{
                                padding: '8px 0', borderBottom: '1px solid var(--border-subtle)',
                                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                            }}>
                                <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>{r.role}</span>
                                <span style={{ fontSize: '0.65rem', color: 'var(--text-dim)' }}>{r.desc}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Right form */}
            <div className="login-form-side">
                <div className="login-form-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 28 }}>
                        <div style={{
                            width: 30, height: 30, background: 'var(--amber)',
                            borderRadius: 'var(--r-sm)', display: 'flex',
                            alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                        }}>
                            <svg viewBox="0 0 16 16" fill="var(--bg-base)" width={15} height={15}>
                                <path d="M2 3h7l3 4-3 4H2l3-4-3-4z"/>
                            </svg>
                        </div>
                        <span style={{
                            fontFamily: 'var(--font-display)', fontSize: '0.85rem',
                            fontWeight: 700, letterSpacing: '0.1em',
                            textTransform: 'uppercase', color: 'var(--text-primary)',
                        }}>FleetPulse</span>
                    </div>
                    <h1>Create Account</h1>
                    <p>Register as a new operator</p>
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
                        <label className="form-label">Full Name</label>
                        <input
                            className="form-input"
                            type="text"
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            placeholder="Your full name"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Email Address</label>
                        <input
                            className="form-input"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="you@company.com"
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
                                placeholder="Min 6 characters"
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
                                    padding: 4, display: 'flex',
                                }}
                            >
                                {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
                            </button>
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Operator Role</label>
                        <select
                            className="form-select"
                            value={role}
                            onChange={(e) => setRole(e.target.value)}
                        >
                            <option>Fleet Manager</option>
                            <option>Dispatcher</option>
                            <option>Safety Officer</option>
                            <option>Financial Analyst</option>
                        </select>
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
                                    <span className="spinner" />Creating Account...
                                </span>
                            ) : 'Create Account'}
                        </button>
                    </div>

                    <div style={{ textAlign: 'center', marginTop: 'var(--sp-5)', fontSize: '0.78rem' }}>
                        <span style={{ color: 'var(--text-muted)' }}>Already have an account? </span>
                        <Link to="/login" style={{ color: 'var(--amber)' }}>Sign In</Link>
                    </div>
                </form>
            </div>
        </div>
    )
}
