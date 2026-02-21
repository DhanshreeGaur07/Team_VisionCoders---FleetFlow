import { useState, useEffect } from 'react'
import { Plus, Search, Truck, Edit2, Power, X } from 'lucide-react'
import useVehicleStore from '../stores/vehicleStore'

export default function VehicleRegistry() {
    const { vehicles, addVehicle, updateVehicle, setStatus, fetch: fetchVehicles, loading } = useVehicleStore()
    const [showModal, setShowModal] = useState(false)
    const [editingId, setEditingId] = useState(null)
    const [search, setSearch] = useState('')
    const [filterType, setFilterType] = useState('All')
    const [filterStatus, setFilterStatus] = useState('All')
    const [form, setForm] = useState({
        name: '', model: '', licensePlate: '', type: 'Truck', maxCapacity: '', odometer: '', region: 'West', acquisitionCost: '',
    })

    useEffect(() => { fetchVehicles() }, [])

    const filtered = vehicles.filter((v) => {
        const matchSearch = v.name.toLowerCase().includes(search.toLowerCase()) ||
            (v.license_plate || '').toLowerCase().includes(search.toLowerCase())
        const matchType = filterType === 'All' || v.type === filterType
        const matchStatus = filterStatus === 'All' || v.status === filterStatus
        return matchSearch && matchType && matchStatus
    })

    const openAdd = () => {
        setEditingId(null)
        setForm({ name: '', model: '', licensePlate: '', type: 'Truck', maxCapacity: '', odometer: '', region: 'West', acquisitionCost: '' })
        setShowModal(true)
    }

    const openEdit = (v) => {
        setEditingId(v.id)
        setForm({
            name: v.name,
            model: v.model,
            licensePlate: v.license_plate,
            type: v.type,
            maxCapacity: v.max_capacity,
            odometer: v.odometer,
            region: v.region,
            acquisitionCost: v.acquisition_cost || '',
        })
        setShowModal(true)
    }

    const handleSubmit = (e) => {
        e.preventDefault()
        const data = {
            ...form,
            maxCapacity: Number(form.maxCapacity),
            odometer: Number(form.odometer),
            acquisitionCost: Number(form.acquisitionCost) || 0,
        }
        if (editingId) {
            updateVehicle(editingId, data)
        } else {
            addVehicle({ ...data, status: 'Available' })
        }
        setShowModal(false)
    }

    const toggleRetire = (v) => {
        if (v.status === 'Retired') {
            setStatus(v.id, 'Available')
        } else {
            if (confirm(`Retire ${v.name} (${v.license_plate})? This will remove it from the active fleet.`)) {
                setStatus(v.id, 'Retired')
            }
        }
    }

    const statusClass = (status) => {
        const map = { 'Available': 'available', 'On Trip': 'on-trip', 'In Shop': 'in-shop', 'Retired': 'retired' }
        return `status-pill status-pill--${map[status] || 'available'}`
    }

    if (loading && vehicles.length === 0) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', color: 'var(--text-muted)', fontSize: '0.8rem', fontFamily: 'var(--font-mono)' }}>
                Loading vehicles...
            </div>
        )
    }

    return (
        <div>
            <div className="page-header">
                <div className="page-header-left">
                    <h1>Vehicle Registry</h1>
                    <p>Manage fleet assets — {vehicles.length} vehicles registered</p>
                </div>
                <button className="btn btn-primary" onClick={openAdd}>
                    <Plus size={16} /> Add Vehicle
                </button>
            </div>

            <div className="filter-bar">
                <div className="topbar-search" style={{ minWidth: 200 }}>
                    <Search size={14} />
                    <input
                        type="text"
                        placeholder="Search by name or plate..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                <select className="form-select" value={filterType} onChange={(e) => setFilterType(e.target.value)}>
                    <option value="All">All Types</option>
                    <option value="Truck">Truck</option>
                    <option value="Van">Van</option>
                    <option value="Bike">Bike</option>
                </select>
                <select className="form-select" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                    <option value="All">All Statuses</option>
                    <option value="Available">Available</option>
                    <option value="On Trip">On Trip</option>
                    <option value="In Shop">In Shop</option>
                    <option value="Retired">Retired</option>
                </select>
            </div>

            <div className="data-table-wrap">
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>Vehicle</th>
                            <th>License Plate</th>
                            <th>Type</th>
                            <th>Max Capacity</th>
                            <th>Odometer</th>
                            <th>Region</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filtered.map((v) => (
                            <tr key={v.id}>
                                <td>
                                    <div className="cell-primary">{v.name}</div>
                                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{v.model}</div>
                                </td>
                                <td className="cell-mono">{v.license_plate}</td>
                                <td>
                                    <span style={{
                                        display: 'inline-flex', alignItems: 'center', gap: 6,
                                        fontSize: '0.8rem', color: 'var(--text-secondary)',
                                    }}>
                                        <Truck size={14} /> {v.type}
                                    </span>
                                </td>
                                <td className="cell-mono">{(v.max_capacity || 0).toLocaleString()} kg</td>
                                <td className="cell-mono">{(v.odometer || 0).toLocaleString()} km</td>
                                <td>{v.region}</td>
                                <td><span className={statusClass(v.status)}>{v.status}</span></td>
                                <td>
                                    <div style={{ display: 'flex', gap: 4 }}>
                                        <button className="btn btn-ghost btn-icon" onClick={() => openEdit(v)} title="Edit">
                                            <Edit2 size={14} />
                                        </button>
                                        <button
                                            className={`btn ${v.status === 'Retired' ? 'btn-ghost' : 'btn-danger'} btn-icon`}
                                            onClick={() => toggleRetire(v)}
                                            title={v.status === 'Retired' ? 'Reactivate' : 'Retire'}
                                        >
                                            <Power size={14} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {filtered.length === 0 && (
                            <tr>
                                <td colSpan={8}>
                                    <div className="empty-state">
                                        <Truck />
                                        <h3>No vehicles found</h3>
                                        <p>Try adjusting your filters or add a new vehicle.</p>
                                    </div>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
                <div className="pagination">
                    <span className="pagination-info">Showing {filtered.length} of {vehicles.length} vehicles</span>
                </div>
            </div>

            {/* Add/Edit Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>{editingId ? 'Edit Vehicle' : 'Add New Vehicle'}</h2>
                            <button className="modal-close" onClick={() => setShowModal(false)}><X size={16} /></button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="modal-body">
                                <div className="form-row">
                                    <div className="form-group">
                                        <label className="form-label">Vehicle Name</label>
                                        <input className="form-input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Tata Ace" required />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Model</label>
                                        <input className="form-input" value={form.model} onChange={(e) => setForm({ ...form, model: e.target.value })} placeholder="e.g. Ace Gold" required />
                                    </div>
                                </div>
                                <div className="form-row">
                                    <div className="form-group">
                                        <label className="form-label">License Plate</label>
                                        <input className="form-input" value={form.licensePlate} onChange={(e) => setForm({ ...form, licensePlate: e.target.value })} placeholder="MH-12-XX-0000" required />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Vehicle Type</label>
                                        <select className="form-select" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                                            <option>Truck</option>
                                            <option>Van</option>
                                            <option>Bike</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="form-row">
                                    <div className="form-group">
                                        <label className="form-label">Max Capacity (kg)</label>
                                        <input className="form-input" type="number" value={form.maxCapacity} onChange={(e) => setForm({ ...form, maxCapacity: e.target.value })} placeholder="500" required />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Odometer (km)</label>
                                        <input className="form-input" type="number" value={form.odometer} onChange={(e) => setForm({ ...form, odometer: e.target.value })} placeholder="0" required />
                                    </div>
                                </div>
                                <div className="form-row">
                                    <div className="form-group">
                                        <label className="form-label">Region</label>
                                        <select className="form-select" value={form.region} onChange={(e) => setForm({ ...form, region: e.target.value })}>
                                            <option>West</option>
                                            <option>North</option>
                                            <option>South</option>
                                            <option>East</option>
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Acquisition Cost</label>
                                        <input className="form-input" type="number" value={form.acquisitionCost} onChange={(e) => setForm({ ...form, acquisitionCost: e.target.value })} placeholder="0" />
                                    </div>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary">{editingId ? 'Update Vehicle' : 'Add Vehicle'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
