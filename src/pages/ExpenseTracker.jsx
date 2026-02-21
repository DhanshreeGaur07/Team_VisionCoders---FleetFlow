import { useState, useEffect } from 'react'
import { Plus, X, Fuel, Calculator } from 'lucide-react'
import useExpenseStore from '../stores/expenseStore'
import useVehicleStore from '../stores/vehicleStore'
import useMaintenanceStore from '../stores/maintenanceStore'
import dayjs from 'dayjs'

export default function ExpenseTracker() {
    const { expenses, addExpense, getTotalFuelCost, getTotalLiters, fetch: fetchExpenses, loading } = useExpenseStore()
    const vehicles = useVehicleStore((s) => s.vehicles)
    const getVehicleById = useVehicleStore((s) => s.getVehicleById)
    const fetchVehicles = useVehicleStore((s) => s.fetch)
    const getTotalMaintenanceCost = useMaintenanceStore((s) => s.getTotalMaintenanceCost)
    const fetchMaintenance = useMaintenanceStore((s) => s.fetch)
    const [showModal, setShowModal] = useState(false)
    const [selectedVehicle, setSelectedVehicle] = useState('All')

    const [form, setForm] = useState({
        vehicleId: '', liters: '', cost: '', date: dayjs().format('YYYY-MM-DD'), odometer: '',
    })

    useEffect(() => {
        fetchExpenses()
        fetchVehicles()
        fetchMaintenance()
    }, [])

    const handleSubmit = (e) => {
        e.preventDefault()
        addExpense({
            vehicleId: form.vehicleId,
            type: 'fuel',
            liters: Number(form.liters),
            cost: Number(form.cost),
            date: form.date,
            odometer: Number(form.odometer),
        })
        setShowModal(false)
        setForm({ vehicleId: '', liters: '', cost: '', date: dayjs().format('YYYY-MM-DD'), odometer: '' })
    }

    const filteredExpenses = selectedVehicle === 'All'
        ? expenses
        : expenses.filter((e) => e.vehicle_id === selectedVehicle)

    const vehicleSummaries = vehicles.filter((v) => v.status !== 'Retired').map((v) => {
        const fuelCost = getTotalFuelCost(v.id)
        const maintCost = getTotalMaintenanceCost(v.id)
        const totalCost = fuelCost + maintCost
        const liters = getTotalLiters(v.id)
        return { ...v, fuelCost, maintCost, totalCost, liters }
    }).sort((a, b) => b.totalCost - a.totalCost)

    const totalAllFuel = expenses.reduce((s, e) => s + Number(e.cost), 0)
    const totalAllMaint = vehicles.reduce((s, v) => s + getTotalMaintenanceCost(v.id), 0)

    if (loading && expenses.length === 0) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', color: 'var(--text-muted)', fontSize: '0.8rem', fontFamily: 'var(--font-mono)' }}>
                Loading expenses...
            </div>
        )
    }

    return (
        <div>
            <div className="page-header">
                <div className="page-header-left">
                    <h1>Expenses & Fuel Logging</h1>
                    <p>Financial tracking per asset — fuel spend and operational costs</p>
                </div>
                <button className="btn btn-primary" onClick={() => setShowModal(true)}>
                    <Plus size={16} /> Log Fuel
                </button>
            </div>

            <div className="kpi-grid">
                <div className="kpi-card kpi-card--teal">
                    <div className="kpi-card-header">
                        <span className="kpi-card-label">Total Fuel Spend</span>
                        <div className="kpi-card-icon kpi-card-icon--teal"><Fuel size={18} /></div>
                    </div>
                    <div className="kpi-card-value">₹{totalAllFuel.toLocaleString()}</div>
                    <div className="kpi-card-sub">{expenses.length} fuel entries</div>
                </div>
                <div className="kpi-card kpi-card--amber">
                    <div className="kpi-card-header">
                        <span className="kpi-card-label">Total Maintenance</span>
                        <div className="kpi-card-icon kpi-card-icon--amber">🔧</div>
                    </div>
                    <div className="kpi-card-value">₹{totalAllMaint.toLocaleString()}</div>
                </div>
                <div className="kpi-card kpi-card--red">
                    <div className="kpi-card-header">
                        <span className="kpi-card-label">Total Operational Cost</span>
                        <div className="kpi-card-icon kpi-card-icon--red"><Calculator size={18} /></div>
                    </div>
                    <div className="kpi-card-value">₹{(totalAllFuel + totalAllMaint).toLocaleString()}</div>
                    <div className="kpi-card-sub">Fuel + Maintenance combined</div>
                </div>
            </div>

            {/* Cost per Vehicle */}
            <div className="card" style={{ marginBottom: 'var(--space-lg)' }}>
                <div className="card-header">
                    <h3 className="card-title">Cost Breakdown by Vehicle</h3>
                </div>
                <div className="data-table-wrap" style={{ border: 'none' }}>
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Vehicle</th>
                                <th>Fuel Cost</th>
                                <th>Maintenance Cost</th>
                                <th>Total Ops Cost</th>
                                <th>Cost/km</th>
                                <th>Fuel Consumed</th>
                            </tr>
                        </thead>
                        <tbody>
                            {vehicleSummaries.map((v) => {
                                const costPerKm = v.odometer > 0 ? (v.totalCost / v.odometer).toFixed(2) : '—'
                                return (
                                    <tr key={v.id}>
                                        <td>
                                            <div className="cell-primary">{v.name}</div>
                                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{v.license_plate}</div>
                                        </td>
                                        <td className="cell-mono">₹{v.fuelCost.toLocaleString()}</td>
                                        <td className="cell-mono">₹{v.maintCost.toLocaleString()}</td>
                                        <td className="cell-mono" style={{ color: 'var(--status-ok)', fontWeight: 600 }}>
                                            ₹{v.totalCost.toLocaleString()}
                                        </td>
                                        <td className="cell-mono">₹{costPerKm}</td>
                                        <td className="cell-mono">{v.liters}L</td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Fuel Log Table */}
            <div className="card">
                <div className="card-header">
                    <h3 className="card-title">Fuel Log Entries</h3>
                    <select className="form-select" value={selectedVehicle} onChange={(e) => setSelectedVehicle(e.target.value)} style={{ width: 'auto', minWidth: 180 }}>
                        <option value="All">All Vehicles</option>
                        {vehicles.map((v) => <option key={v.id} value={v.id}>{v.name} — {v.license_plate}</option>)}
                    </select>
                </div>
                <div className="data-table-wrap" style={{ border: 'none' }}>
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Vehicle</th>
                                <th>Liters</th>
                                <th>Cost</th>
                                <th>Rate (₹/L)</th>
                                <th>Odometer</th>
                                <th>Date</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredExpenses.map((e) => {
                                const v = getVehicleById(e.vehicle_id)
                                return (
                                    <tr key={e.id}>
                                        <td className="cell-primary">{v?.name || '—'}</td>
                                        <td className="cell-mono">{e.liters}L</td>
                                        <td className="cell-mono">₹{Number(e.cost).toLocaleString()}</td>
                                        <td className="cell-mono">₹{(Number(e.cost) / Number(e.liters || 1)).toFixed(1)}</td>
                                        <td className="cell-mono">{e.odometer?.toLocaleString()} km</td>
                                        <td className="cell-mono">{dayjs(e.date).format('DD MMM YYYY')}</td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Log Fuel Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Log Fuel Entry</h2>
                            <button className="modal-close" onClick={() => setShowModal(false)}><X size={16} /></button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="modal-body">
                                <div className="form-group">
                                    <label className="form-label">Vehicle</label>
                                    <select className="form-select" value={form.vehicleId} onChange={(e) => setForm({ ...form, vehicleId: e.target.value })} required>
                                        <option value="">Select vehicle...</option>
                                        {vehicles.filter((v) => v.status !== 'Retired').map((v) => (
                                            <option key={v.id} value={v.id}>{v.name} — {v.license_plate}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="form-row">
                                    <div className="form-group">
                                        <label className="form-label">Liters</label>
                                        <input className="form-input" type="number" step="0.1" value={form.liters} onChange={(e) => setForm({ ...form, liters: e.target.value })} placeholder="0" required />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Cost</label>
                                        <input className="form-input" type="number" value={form.cost} onChange={(e) => setForm({ ...form, cost: e.target.value })} placeholder="0" required />
                                    </div>
                                </div>
                                <div className="form-row">
                                    <div className="form-group">
                                        <label className="form-label">Date</label>
                                        <input className="form-input" type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Odometer (km)</label>
                                        <input className="form-input" type="number" value={form.odometer} onChange={(e) => setForm({ ...form, odometer: e.target.value })} placeholder="Current reading" required />
                                    </div>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary">Log Fuel Entry</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
