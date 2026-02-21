import { useState, useEffect } from 'react'
import { Plus, CheckCircle, X, Wrench } from 'lucide-react'
import useMaintenanceStore from '../stores/maintenanceStore'
import useVehicleStore from '../stores/vehicleStore'
import useNotificationStore from '../stores/notificationStore'
import useAuthStore from '../stores/authStore'
import dayjs from 'dayjs'

const serviceTypes = ['Oil Change', 'Tire Rotation', 'Brake Inspection', 'Engine Repair', 'AC Repair', 'Battery Replacement', 'Transmission Service', 'General Inspection']

export default function MaintenanceLogs() {
    const user = useAuthStore((s) => s.user)
    const { logs, addLog, completeLog, fetch: fetchLogs, loading } = useMaintenanceStore()
    const vehicles = useVehicleStore((s) => s.vehicles)
    const setVehicleStatus = useVehicleStore((s) => s.setStatus)
    const getVehicleById = useVehicleStore((s) => s.getVehicleById)
    const fetchVehicles = useVehicleStore((s) => s.fetch)
    const addNotification = useNotificationStore((s) => s.addNotification)
    const [showModal, setShowModal] = useState(false)
    const [filterStatus, setFilterStatus] = useState('All')
    const [form, setForm] = useState({
        vehicleId: '', serviceType: 'Oil Change', cost: '', date: dayjs().format('YYYY-MM-DD'), notes: '',
    })

    useEffect(() => {
        fetchLogs()
        fetchVehicles()
    }, [])

    const handleSubmit = async (e) => {
        e.preventDefault()
        await addLog({
            vehicleId: form.vehicleId,
            serviceType: form.serviceType,
            cost: Number(form.cost),
            date: form.date,
            notes: form.notes,
        })
        setVehicleStatus(form.vehicleId, 'In Shop')
        const v = getVehicleById(form.vehicleId)
        addNotification({ type: 'warning', message: `${v?.name} sent to shop for ${form.serviceType}` }, user?.id)
        setShowModal(false)
        setForm({ vehicleId: '', serviceType: 'Oil Change', cost: '', date: dayjs().format('YYYY-MM-DD'), notes: '' })
    }

    const handleComplete = (log) => {
        completeLog(log.id)
        setVehicleStatus(log.vehicle_id, 'Available')
        const v = getVehicleById(log.vehicle_id)
        addNotification({ type: 'info', message: `${v?.name} maintenance complete — back in service` }, user?.id)
    }

    const filtered = filterStatus === 'All' ? logs : logs.filter((l) => l.status === filterStatus)
    const eligibleVehicles = vehicles.filter((v) => v.status !== 'Retired')

    if (loading && logs.length === 0) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', color: 'var(--text-muted)', fontSize: '0.8rem', fontFamily: 'var(--font-mono)' }}>
                Loading maintenance logs...
            </div>
        )
    }

    return (
        <div>
            <div className="page-header">
                <div className="page-header-left">
                    <h1>Maintenance & Service Logs</h1>
                    <p>Preventative and reactive fleet health tracking</p>
                </div>
                <button className="btn btn-primary" onClick={() => setShowModal(true)}>
                    <Plus size={16} /> Log Service
                </button>
            </div>

            <div className="kpi-grid" style={{ marginBottom: 'var(--space-lg)' }}>
                <div className="kpi-card kpi-card--amber">
                    <div className="kpi-card-header">
                        <span className="kpi-card-label">Open Service Logs</span>
                        <div className="kpi-card-icon kpi-card-icon--amber"><Wrench size={18} /></div>
                    </div>
                    <div className="kpi-card-value">{logs.filter((l) => l.status === 'Open').length}</div>
                    <div className="kpi-card-sub">vehicles currently in shop</div>
                </div>
                <div className="kpi-card kpi-card--teal">
                    <div className="kpi-card-header">
                        <span className="kpi-card-label">Completed This Month</span>
                        <div className="kpi-card-icon kpi-card-icon--teal"><CheckCircle size={18} /></div>
                    </div>
                    <div className="kpi-card-value">
                        {logs.filter((l) => l.status === 'Completed' && dayjs(l.date).isAfter(dayjs().startOf('month'))).length}
                    </div>
                    <div className="kpi-card-sub">service jobs completed</div>
                </div>
                <div className="kpi-card kpi-card--red">
                    <div className="kpi-card-header">
                        <span className="kpi-card-label">Total Maintenance Cost</span>
                        <div className="kpi-card-icon kpi-card-icon--red">₹</div>
                    </div>
                    <div className="kpi-card-value">₹{logs.reduce((s, l) => s + Number(l.cost), 0).toLocaleString()}</div>
                    <div className="kpi-card-sub">all-time maintenance spend</div>
                </div>
            </div>

            <div className="filter-bar">
                {['All', 'Open', 'Completed'].map((s) => (
                    <button
                        key={s}
                        className={`filter-chip ${filterStatus === s ? 'active' : ''}`}
                        onClick={() => setFilterStatus(s)}
                    >
                        {s} ({s === 'All' ? logs.length : logs.filter((l) => l.status === s).length})
                    </button>
                ))}
            </div>

            <div className="data-table-wrap">
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>Vehicle</th>
                            <th>Service Type</th>
                            <th>Cost</th>
                            <th>Date</th>
                            <th>Notes</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filtered.map((l) => {
                            const v = getVehicleById(l.vehicle_id)
                            return (
                                <tr key={l.id}>
                                    <td>
                                        <div className="cell-primary">{v?.name || '—'}</div>
                                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{v?.license_plate}</div>
                                    </td>
                                    <td className="cell-primary">{l.service_type}</td>
                                    <td className="cell-mono">₹{Number(l.cost).toLocaleString()}</td>
                                    <td className="cell-mono" style={{ fontSize: '0.8rem' }}>{dayjs(l.date).format('DD MMM YYYY')}</td>
                                    <td style={{ maxWidth: 250, overflow: 'hidden', textOverflow: 'ellipsis' }}>{l.notes || '—'}</td>
                                    <td>
                                        <span className={`status-pill status-pill--${l.status === 'Open' ? 'open' : 'completed'}`}>
                                            {l.status}
                                        </span>
                                    </td>
                                    <td>
                                        {l.status === 'Open' && (
                                            <button className="btn btn-primary btn-sm" onClick={() => handleComplete(l)}>
                                                <CheckCircle size={12} /> Mark Done
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            )
                        })}
                    </tbody>
                </table>
            </div>

            {/* Add Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Log Maintenance Service</h2>
                            <button className="modal-close" onClick={() => setShowModal(false)}><X size={16} /></button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="modal-body">
                                <div style={{
                                    padding: '12px 16px', marginBottom: 16, background: 'var(--status-warn-dim)',
                                    border: '1px solid rgba(255,176,32,0.3)', borderRadius: 'var(--radius-md)',
                                    color: 'var(--status-warn)', fontSize: '0.8rem',
                                }}>
                                    Logging maintenance will automatically set the vehicle status to "In Shop" and remove it from the dispatch pool.
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Vehicle</label>
                                    <select className="form-select" value={form.vehicleId} onChange={(e) => setForm({ ...form, vehicleId: e.target.value })} required>
                                        <option value="">Select vehicle...</option>
                                        {eligibleVehicles.map((v) => (
                                            <option key={v.id} value={v.id}>{v.name} — {v.license_plate} ({v.status})</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="form-row">
                                    <div className="form-group">
                                        <label className="form-label">Service Type</label>
                                        <select className="form-select" value={form.serviceType} onChange={(e) => setForm({ ...form, serviceType: e.target.value })}>
                                            {serviceTypes.map((s) => <option key={s}>{s}</option>)}
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Cost</label>
                                        <input className="form-input" type="number" value={form.cost} onChange={(e) => setForm({ ...form, cost: e.target.value })} placeholder="0" required />
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Date</label>
                                    <input className="form-input" type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Notes</label>
                                    <textarea className="form-textarea" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Service details..." />
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary">Log Maintenance</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
