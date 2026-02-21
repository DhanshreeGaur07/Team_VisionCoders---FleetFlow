import { useState, useEffect } from 'react'
import { Plus, X, Shield, AlertTriangle, Award } from 'lucide-react'
import useDriverStore from '../stores/driverStore'
import useTripStore from '../stores/tripStore'
import dayjs from 'dayjs'

export default function DriverProfiles() {
    const { drivers, addDriver, updateDriver, setStatus, isLicenseExpired, isLicenseExpiringSoon, getLicenseDaysLeft, fetch: fetchDrivers, loading } = useDriverStore()
    const getTripsByDriver = useTripStore((s) => s.getTripsByDriver)
    const fetchTrips = useTripStore((s) => s.fetch)
    const [showModal, setShowModal] = useState(false)
    const [filterStatus, setFilterStatus] = useState('All')
    const [form, setForm] = useState({
        name: '', licenseNumber: '', licenseExpiry: '', licenseCategory: 'Truck', phone: '',
    })

    useEffect(() => {
        fetchDrivers()
        fetchTrips()
    }, [])

    const handleSubmit = (e) => {
        e.preventDefault()
        addDriver({ ...form, status: 'On Duty', safetyScore: 100 })
        setShowModal(false)
        setForm({ name: '', licenseNumber: '', licenseExpiry: '', licenseCategory: 'Truck', phone: '' })
    }

    const toggleStatus = (driver) => {
        const cycle = { 'On Duty': 'Off Duty', 'Off Duty': 'On Duty', 'Suspended': 'On Duty' }
        setStatus(driver.id, cycle[driver.status] || 'On Duty')
    }

    const suspendDriver = (driver) => {
        if (confirm(`Suspend ${driver.name}?`)) {
            setStatus(driver.id, 'Suspended')
        }
    }

    const filtered = filterStatus === 'All' ? drivers : drivers.filter((d) => d.status === filterStatus)

    const statusClass = (status) => {
        const map = { 'On Duty': 'on-duty', 'Off Duty': 'off-duty', 'Suspended': 'suspended' }
        return `status-pill status-pill--${map[status] || 'on-duty'}`
    }

    const getScoreClass = (score) => {
        if (score >= 85) return 'score-badge--high'
        if (score >= 65) return 'score-badge--medium'
        return 'score-badge--low'
    }

    const topDrivers = [...drivers].sort((a, b) => (b.safety_score || 0) - (a.safety_score || 0)).slice(0, 3)
    const medals = ['🥇', '🥈', '🥉']

    if (loading && drivers.length === 0) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', color: 'var(--text-muted)', fontSize: '0.8rem', fontFamily: 'var(--font-mono)' }}>
                Loading drivers...
            </div>
        )
    }

    return (
        <div>
            <div className="page-header">
                <div className="page-header-left">
                    <h1>Driver Performance & Safety</h1>
                    <p>Compliance management and performance tracking</p>
                </div>
                <button className="btn btn-primary" onClick={() => setShowModal(true)}>
                    <Plus size={16} /> Add Driver
                </button>
            </div>

            {/* Leaderboard */}
            <div className="card" style={{ marginBottom: 'var(--space-lg)' }}>
                <div className="card-header">
                    <h3 className="card-title"><Award size={18} style={{ marginRight: 8, color: 'var(--status-warn)' }} />Safety Leaderboard</h3>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
                    {topDrivers.map((d, i) => (
                        <div key={d.id} style={{
                            padding: 20,
                            background: i === 0
                                ? 'linear-gradient(135deg, rgba(255,176,32,0.1), rgba(255,176,32,0.02))'
                                : 'var(--bg-primary)',
                            border: `1px solid ${i === 0 ? 'rgba(255,176,32,0.3)' : 'var(--border-subtle)'}`,
                            borderRadius: 'var(--radius-lg)',
                            textAlign: 'center',
                        }}>
                            <div style={{ fontSize: '2rem', marginBottom: 8 }}>{medals[i]}</div>
                            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '1rem' }}>{d.name}</div>
                            <div style={{ marginTop: 8 }}>
                                <span className={`score-badge ${getScoreClass(d.safety_score || 0)}`}>{d.safety_score || 0}</span>
                            </div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 8 }}>
                                {d.trips_completed || 0} trips completed
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="filter-bar">
                {['All', 'On Duty', 'Off Duty', 'Suspended'].map((s) => (
                    <button
                        key={s}
                        className={`filter-chip ${filterStatus === s ? 'active' : ''}`}
                        onClick={() => setFilterStatus(s)}
                    >
                        {s} ({s === 'All' ? drivers.length : drivers.filter((d) => d.status === s).length})
                    </button>
                ))}
            </div>

            <div className="data-table-wrap">
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>Driver</th>
                            <th>License #</th>
                            <th>Category</th>
                            <th>License Expiry</th>
                            <th>Safety Score</th>
                            <th>Trips</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filtered.map((d) => {
                            const expired = isLicenseExpired(d.id)
                            const expiringSoon = isLicenseExpiringSoon(d.id)
                            const daysLeft = getLicenseDaysLeft(d.id)
                            const trips = getTripsByDriver(d.id)

                            return (
                                <tr key={d.id}>
                                    <td>
                                        <div className="cell-primary">{d.name}</div>
                                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{d.phone}</div>
                                    </td>
                                    <td className="cell-mono" style={{ fontSize: '0.8rem' }}>{d.license_number}</td>
                                    <td>{d.license_category}</td>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                            <span className="cell-mono" style={{ fontSize: '0.8rem' }}>{dayjs(d.license_expiry).format('DD MMM YYYY')}</span>
                                            {expired && (
                                                <span className="status-pill status-pill--expired">
                                                    EXPIRED
                                                </span>
                                            )}
                                            {expiringSoon && !expired && (
                                                <span style={{
                                                    fontSize: '0.7rem', color: 'var(--status-warn)',
                                                    display: 'flex', alignItems: 'center', gap: 4,
                                                }}>
                                                    <AlertTriangle size={12} /> {daysLeft}d left
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                    <td>
                                        <span className={`score-badge ${getScoreClass(d.safety_score || 0)}`}>{d.safety_score || 0}</span>
                                    </td>
                                    <td className="cell-mono">{d.trips_completed || 0}</td>
                                    <td><span className={statusClass(d.status)}>{d.status}</span></td>
                                    <td>
                                        <div style={{ display: 'flex', gap: 4 }}>
                                            <button className="btn btn-secondary btn-sm" onClick={() => toggleStatus(d)}>
                                                {d.status === 'On Duty' ? 'Off Duty' : 'Activate'}
                                            </button>
                                            {d.status !== 'Suspended' && (
                                                <button className="btn btn-danger btn-sm" onClick={() => suspendDriver(d)}>
                                                    <Shield size={12} />
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            )
                        })}
                    </tbody>
                </table>
                <div className="pagination">
                    <span className="pagination-info">Showing {filtered.length} of {drivers.length} drivers</span>
                </div>
            </div>

            {/* Add Driver Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Add New Driver</h2>
                            <button className="modal-close" onClick={() => setShowModal(false)}><X size={16} /></button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="modal-body">
                                <div className="form-group">
                                    <label className="form-label">Full Name</label>
                                    <input className="form-input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Driver name" required />
                                </div>
                                <div className="form-row">
                                    <div className="form-group">
                                        <label className="form-label">License Number</label>
                                        <input className="form-input" value={form.licenseNumber} onChange={(e) => setForm({ ...form, licenseNumber: e.target.value })} placeholder="MH-XXXXXXXXXX" required />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">License Expiry</label>
                                        <input className="form-input" type="date" value={form.licenseExpiry} onChange={(e) => setForm({ ...form, licenseExpiry: e.target.value })} required />
                                    </div>
                                </div>
                                <div className="form-row">
                                    <div className="form-group">
                                        <label className="form-label">License Category</label>
                                        <select className="form-select" value={form.licenseCategory} onChange={(e) => setForm({ ...form, licenseCategory: e.target.value })}>
                                            <option>Truck</option>
                                            <option>Van</option>
                                            <option>Bike</option>
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Phone</label>
                                        <input className="form-input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+91 XXXXX XXXXX" required />
                                    </div>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary">Add Driver</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
