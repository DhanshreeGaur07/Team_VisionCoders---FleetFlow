import { useState, useEffect } from 'react'
import { Plus, Play, CheckCircle, XCircle, AlertTriangle, X } from 'lucide-react'
import useVehicleStore from '../stores/vehicleStore'
import useDriverStore from '../stores/driverStore'
import useTripStore from '../stores/tripStore'
import useNotificationStore from '../stores/notificationStore'
import useAuthStore from '../stores/authStore'
import dayjs from 'dayjs'

export default function TripDispatcher() {
    const user = useAuthStore((s) => s.user)

    const vehicles = useVehicleStore((s) => s.vehicles)
    const setVehicleStatus = useVehicleStore((s) => s.setStatus)
    const getAvailableVehicles = useVehicleStore((s) => s.getAvailableVehicles)
    const getVehicleById = useVehicleStore((s) => s.getVehicleById)
    const fetchVehicles = useVehicleStore((s) => s.fetch)

    const drivers = useDriverStore((s) => s.drivers)
    const getAvailableDrivers = useDriverStore((s) => s.getAvailableDrivers)
    const setDriverStatus = useDriverStore((s) => s.setStatus)
    const getDriverById = useDriverStore((s) => s.getDriverById)
    const incrementTrips = useDriverStore((s) => s.incrementTrips)
    const fetchDrivers = useDriverStore((s) => s.fetch)

    const { trips, addTrip, dispatchTrip, completeTrip, cancelTrip, fetch: fetchTrips } = useTripStore()
    const addNotification = useNotificationStore((s) => s.addNotification)

    const [showModal, setShowModal] = useState(false)
    const [showCompleteModal, setShowCompleteModal] = useState(false)
    const [completingTripId, setCompletingTripId] = useState(null)
    const [endOdometer, setEndOdometer] = useState('')
    const [filterStatus, setFilterStatus] = useState('All')

    const [form, setForm] = useState({
        vehicleId: '', driverId: '', origin: '', destination: '', cargoWeight: '', revenue: '',
    })
    const [error, setError] = useState('')

    useEffect(() => {
        fetchVehicles()
        fetchDrivers()
        fetchTrips()
    }, [])

    const availableVehicles = getAvailableVehicles()
    const availableDrivers = getAvailableDrivers()

    const selectedVehicle = form.vehicleId ? getVehicleById(form.vehicleId) : null

    const handleCreate = async (e) => {
        e.preventDefault()
        setError('')

        if (!form.vehicleId || !form.driverId) {
            setError('Please select both a vehicle and driver.')
            return
        }

        const weight = Number(form.cargoWeight)
        const vehicle = getVehicleById(form.vehicleId)

        if (weight > (vehicle?.max_capacity || 0)) {
            setError(`Cargo weight (${weight}kg) exceeds vehicle capacity (${vehicle.max_capacity}kg). Reduce cargo or select a larger vehicle.`)
            return
        }

        await addTrip({
            vehicleId: form.vehicleId,
            driverId: form.driverId,
            origin: form.origin,
            destination: form.destination,
            cargoWeight: weight,
            startOdometer: vehicle?.odometer || 0,
            revenue: Number(form.revenue) || 0,
        })

        addNotification({ type: 'info', message: `New trip created: ${form.origin} → ${form.destination}` }, user?.id)
        setShowModal(false)
        setForm({ vehicleId: '', driverId: '', origin: '', destination: '', cargoWeight: '', revenue: '' })
    }

    const handleDispatch = (tripId) => {
        const trip = trips.find((t) => t.id === tripId)
        if (!trip) return
        dispatchTrip(tripId)
        setVehicleStatus(trip.vehicle_id, 'On Trip')
        setDriverStatus(trip.driver_id, 'On Duty')
        addNotification({ type: 'info', message: `Trip dispatched` }, user?.id)
    }

    const handleComplete = (tripId) => {
        setCompletingTripId(tripId)
        setEndOdometer('')
        setShowCompleteModal(true)
    }

    const submitComplete = () => {
        const trip = trips.find((t) => t.id === completingTripId)
        if (!trip) return
        completeTrip(completingTripId, Number(endOdometer) || 0)
        setVehicleStatus(trip.vehicle_id, 'Available')
        const vStore = useVehicleStore.getState()
        vStore.updateVehicle(trip.vehicle_id, { odometer: Number(endOdometer) || vStore.getVehicleById(trip.vehicle_id)?.odometer || 0 })
        incrementTrips(trip.driver_id)
        addNotification({ type: 'info', message: `Trip completed` }, user?.id)
        setShowCompleteModal(false)
    }

    const handleCancel = (tripId) => {
        const trip = trips.find((t) => t.id === tripId)
        if (!trip) return
        if (confirm('Cancel this trip?')) {
            cancelTrip(tripId)
            if (trip.status === 'Dispatched') {
                setVehicleStatus(trip.vehicle_id, 'Available')
            }
            addNotification({ type: 'warning', message: `Trip cancelled` }, user?.id)
        }
    }

    const filteredTrips = filterStatus === 'All' ? trips : trips.filter((t) => t.status === filterStatus)

    const statusClass = (status) => {
        const map = { 'Draft': 'draft', 'Dispatched': 'dispatched', 'Completed': 'completed', 'Cancelled': 'cancelled' }
        return `status-pill status-pill--${map[status] || 'draft'}`
    }

    return (
        <div>
            <div className="page-header">
                <div className="page-header-left">
                    <h1>Trip Dispatcher</h1>
                    <p>Create, dispatch, and manage delivery trips</p>
                </div>
                <button className="btn btn-primary" onClick={() => { setError(''); setShowModal(true) }}>
                    <Plus size={16} /> Create Trip
                </button>
            </div>

            <div className="filter-bar">
                {['All', 'Draft', 'Dispatched', 'Completed', 'Cancelled'].map((s) => (
                    <button
                        key={s}
                        className={`filter-chip ${filterStatus === s ? 'active' : ''}`}
                        onClick={() => setFilterStatus(s)}
                    >
                        {s} {s !== 'All' && `(${trips.filter((t) => t.status === s).length})`}
                    </button>
                ))}
            </div>

            <div className="data-table-wrap">
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>Vehicle</th>
                            <th>Driver</th>
                            <th>Route</th>
                            <th>Cargo</th>
                            <th>Status</th>
                            <th>Date</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredTrips.map((t) => {
                            const v = getVehicleById(t.vehicle_id)
                            const d = getDriverById(t.driver_id)
                            return (
                                <tr key={t.id}>
                                    <td>
                                        <div className="cell-primary">{v?.name || '—'}</div>
                                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{v?.license_plate}</div>
                                    </td>
                                    <td className="cell-primary">{d?.name || '—'}</td>
                                    <td>
                                        <div style={{ fontSize: '0.8rem' }}>
                                            {t.origin} → {t.destination}
                                        </div>
                                    </td>
                                    <td className="cell-mono">{t.cargo_weight} kg</td>
                                    <td><span className={statusClass(t.status)}>{t.status}</span></td>
                                    <td className="cell-mono" style={{ fontSize: '0.75rem' }}>
                                        {dayjs(t.created_at).format('DD MMM, HH:mm')}
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', gap: 4 }}>
                                            {t.status === 'Draft' && (
                                                <button className="btn btn-primary btn-sm" onClick={() => handleDispatch(t.id)}>
                                                    <Play size={12} /> Dispatch
                                                </button>
                                            )}
                                            {t.status === 'Dispatched' && (
                                                <button className="btn btn-primary btn-sm" onClick={() => handleComplete(t.id)}>
                                                    <CheckCircle size={12} /> Complete
                                                </button>
                                            )}
                                            {(t.status === 'Draft' || t.status === 'Dispatched') && (
                                                <button className="btn btn-danger btn-sm" onClick={() => handleCancel(t.id)}>
                                                    <XCircle size={12} />
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            )
                        })}
                        {filteredTrips.length === 0 && (
                            <tr>
                                <td colSpan={7}>
                                    <div className="empty-state">
                                        <h3>No trips found</h3>
                                        <p>Create a new trip to get started.</p>
                                    </div>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
                <div className="pagination">
                    <span className="pagination-info">Showing {filteredTrips.length} of {trips.length} trips</span>
                </div>
            </div>

            {/* Create Trip Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Create New Trip</h2>
                            <button className="modal-close" onClick={() => setShowModal(false)}><X size={16} /></button>
                        </div>
                        <form onSubmit={handleCreate}>
                            <div className="modal-body">
                                {error && (
                                    <div style={{
                                        padding: '12px 16px', marginBottom: 16, background: 'var(--status-error-dim)',
                                        border: '1px solid rgba(255,61,90,0.3)', borderRadius: 'var(--radius-md)',
                                        color: 'var(--status-error)', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: 8,
                                    }}>
                                        <AlertTriangle size={16} /> {error}
                                    </div>
                                )}

                                <div className="form-row">
                                    <div className="form-group">
                                        <label className="form-label">Vehicle</label>
                                        <select className="form-select" value={form.vehicleId} onChange={(e) => setForm({ ...form, vehicleId: e.target.value })} required>
                                            <option value="">Select vehicle...</option>
                                            {availableVehicles.map((v) => (
                                                <option key={v.id} value={v.id}>{v.name} — {v.license_plate} ({v.max_capacity}kg)</option>
                                            ))}
                                        </select>
                                        {availableVehicles.length === 0 && (
                                            <div className="form-error">No vehicles available</div>
                                        )}
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Driver</label>
                                        <select className="form-select" value={form.driverId} onChange={(e) => setForm({ ...form, driverId: e.target.value })} required>
                                            <option value="">Select driver...</option>
                                            {availableDrivers.map((d) => (
                                                <option key={d.id} value={d.id}>{d.name} — {d.license_category}</option>
                                            ))}
                                        </select>
                                        {availableDrivers.length === 0 && (
                                            <div className="form-error">No eligible drivers available</div>
                                        )}
                                    </div>
                                </div>

                                <div className="form-row">
                                    <div className="form-group">
                                        <label className="form-label">Origin</label>
                                        <input className="form-input" value={form.origin} onChange={(e) => setForm({ ...form, origin: e.target.value })} placeholder="Pickup location" required />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Destination</label>
                                        <input className="form-input" value={form.destination} onChange={(e) => setForm({ ...form, destination: e.target.value })} placeholder="Delivery location" required />
                                    </div>
                                </div>

                                <div className="form-row">
                                    <div className="form-group">
                                        <label className="form-label">Cargo Weight (kg)</label>
                                        <input className="form-input" type="number" value={form.cargoWeight} onChange={(e) => setForm({ ...form, cargoWeight: e.target.value })} placeholder="0" required />
                                        {selectedVehicle && (
                                            <div style={{
                                                fontSize: '0.75rem', marginTop: 4,
                                                color: Number(form.cargoWeight) > (selectedVehicle.max_capacity || 0) ? 'var(--status-error)' : 'var(--text-muted)',
                                            }}>
                                                Vehicle capacity: {selectedVehicle.max_capacity}kg
                                                {Number(form.cargoWeight) > 0 && ` — ${Math.round((Number(form.cargoWeight) / selectedVehicle.max_capacity) * 100)}% loaded`}
                                            </div>
                                        )}
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Revenue</label>
                                        <input className="form-input" type="number" value={form.revenue} onChange={(e) => setForm({ ...form, revenue: e.target.value })} placeholder="0" />
                                    </div>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary">Create Trip</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Complete Trip Modal */}
            {showCompleteModal && (
                <div className="modal-overlay" onClick={() => setShowCompleteModal(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 400 }}>
                        <div className="modal-header">
                            <h2>Complete Trip</h2>
                            <button className="modal-close" onClick={() => setShowCompleteModal(false)}><X size={16} /></button>
                        </div>
                        <div className="modal-body">
                            <div className="form-group">
                                <label className="form-label">Final Odometer Reading (km)</label>
                                <input className="form-input" type="number" value={endOdometer} onChange={(e) => setEndOdometer(e.target.value)} placeholder="Enter current odometer" required />
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button className="btn btn-secondary" onClick={() => setShowCompleteModal(false)}>Cancel</button>
                            <button className="btn btn-primary" onClick={submitComplete}>Mark Completed</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
