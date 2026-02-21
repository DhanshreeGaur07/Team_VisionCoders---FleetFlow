import { useEffect } from 'react'
import {
    Truck, Wrench, Gauge, Package, Plus, TrendingUp, TrendingDown,
    Shield, DollarSign, Users, Route as RouteIcon, AlertTriangle, Fuel, BarChart3,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import useVehicleStore from '../stores/vehicleStore'
import useTripStore from '../stores/tripStore'
import useDriverStore from '../stores/driverStore'
import useMaintenanceStore from '../stores/maintenanceStore'
import useExpenseStore from '../stores/expenseStore'
import useAuthStore from '../stores/authStore'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'

dayjs.extend(relativeTime)

export default function Dashboard() {
    const navigate = useNavigate()
    const role = useAuthStore((s) => s.role)

    const vehicles = useVehicleStore((s) => s.vehicles)
    const vLoading = useVehicleStore((s) => s.loading)
    const fetchVehicles = useVehicleStore((s) => s.fetch)
    const getActiveCount = useVehicleStore((s) => s.getActiveCount)
    const getInShopCount = useVehicleStore((s) => s.getInShopCount)
    const getUtilizationRate = useVehicleStore((s) => s.getUtilizationRate)

    const trips = useTripStore((s) => s.trips)
    const fetchTrips = useTripStore((s) => s.fetch)
    const getPendingCargoCount = useTripStore((s) => s.getPendingCargoCount)

    const drivers = useDriverStore((s) => s.drivers)
    const fetchDrivers = useDriverStore((s) => s.fetch)

    const maintenanceLogs = useMaintenanceStore((s) => s.logs)
    const fetchMaintenance = useMaintenanceStore((s) => s.fetch)
    const getTotalMaintenanceCost = useMaintenanceStore((s) => s.getTotalMaintenanceCost)

    const expenses = useExpenseStore((s) => s.expenses)
    const fetchExpenses = useExpenseStore((s) => s.fetch)

    useEffect(() => {
        fetchVehicles()
        fetchTrips()
        fetchDrivers()
        fetchMaintenance()
        fetchExpenses()
    }, [])

    // Loading state
    if (vLoading && vehicles.length === 0) {
        return (
            <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                height: '60vh', color: 'var(--text-muted)', fontSize: '0.8rem',
                fontFamily: 'var(--font-mono)',
            }}>
                Loading fleet data...
            </div>
        )
    }

    if (role === 'Dispatcher') return <DispatcherDashboard navigate={navigate} vehicles={vehicles} trips={trips} drivers={drivers} getActiveCount={getActiveCount} getPendingCargoCount={getPendingCargoCount} />
    if (role === 'Safety Officer') return <SafetyDashboard navigate={navigate} drivers={drivers} trips={trips} />
    if (role === 'Financial Analyst') return <FinancialDashboard navigate={navigate} vehicles={vehicles} expenses={expenses} maintenanceLogs={maintenanceLogs} getTotalMaintenanceCost={getTotalMaintenanceCost} />

    // Fleet Manager — full dashboard
    return <FleetManagerDashboard
        navigate={navigate}
        vehicles={vehicles}
        trips={trips}
        drivers={drivers}
        maintenanceLogs={maintenanceLogs}
        getActiveCount={getActiveCount}
        getInShopCount={getInShopCount}
        getUtilizationRate={getUtilizationRate}
        getPendingCargoCount={getPendingCargoCount}
    />
}

// ─── Fleet Manager Dashboard ───────────────────────────────────
function FleetManagerDashboard({ navigate, vehicles, trips, drivers, maintenanceLogs, getActiveCount, getInShopCount, getUtilizationRate, getPendingCargoCount }) {
    const getVehicleById = useVehicleStore((s) => s.getVehicleById)
    const activeCount = getActiveCount()
    const inShopCount = getInShopCount()
    const utilRate = getUtilizationRate()
    const pendingCargo = getPendingCargoCount()

    const recentActivity = [
        ...trips.slice(0, 5).map((t) => {
            const v = getVehicleById(t.vehicle_id)
            return {
                id: t.id,
                type: t.status === 'Completed' ? 'teal' : t.status === 'Dispatched' ? 'blue' : t.status === 'Cancelled' ? 'red' : 'amber',
                text: `Trip — ${v?.name || 'Vehicle'}: ${t.origin} → ${t.destination}`,
                badge: t.status,
                time: t.completed_at || t.dispatched_at || t.created_at,
            }
        }),
        ...maintenanceLogs.slice(0, 3).map((m) => {
            const v = getVehicleById(m.vehicle_id)
            return {
                id: m.id,
                type: m.status === 'Open' ? 'amber' : 'teal',
                text: `${m.service_type} — ${v?.name || 'Vehicle'}`,
                badge: m.status,
                time: m.date,
            }
        }),
    ].sort((a, b) => new Date(b.time) - new Date(a.time)).slice(0, 8)

    const statusBreakdown = [
        { label: 'Available', count: vehicles.filter((v) => v.status === 'Available').length, color: 'var(--status-ok)' },
        { label: 'On Trip', count: vehicles.filter((v) => v.status === 'On Trip').length, color: 'var(--status-blue)' },
        { label: 'In Shop', count: vehicles.filter((v) => v.status === 'In Shop').length, color: 'var(--status-warn)' },
        { label: 'Retired', count: vehicles.filter((v) => v.status === 'Retired').length, color: 'var(--status-error)' },
    ]
    const totalVehicles = vehicles.length

    return (
        <div>
            <div className="page-header">
                <div className="page-header-left">
                    <h1>Command Center</h1>
                    <p>{dayjs().format('ddd, DD MMM YYYY — HH:mm')} &nbsp;&middot;&nbsp; Live operational overview</p>
                </div>
                <div className="quick-actions">
                    <button className="btn btn-primary" onClick={() => navigate('/trips')}>
                        <Plus size={14} /> New Trip
                    </button>
                    <button className="btn btn-secondary" onClick={() => navigate('/vehicles')}>
                        <Truck size={14} /> Add Vehicle
                    </button>
                    <button className="btn btn-secondary" onClick={() => navigate('/maintenance')}>
                        <Wrench size={14} /> Log Service
                    </button>
                </div>
            </div>

            <div className="kpi-grid">
                <div className="kpi-card kpi-card--teal stagger-item" style={{ animationDelay: '0.05s' }}>
                    <div className="kpi-card-header">
                        <span className="kpi-card-label">Active Fleet</span>
                        <div className="kpi-card-icon kpi-card-icon--teal"><Truck size={14} /></div>
                    </div>
                    <div className="kpi-card-value">{activeCount}</div>
                    <div className="kpi-card-sub">
                        vehicles on trip&nbsp;
                        <span className="kpi-card-trend kpi-card-trend--up"><TrendingUp size={10} /> Active</span>
                    </div>
                </div>
                <div className="kpi-card kpi-card--amber stagger-item" style={{ animationDelay: '0.1s' }}>
                    <div className="kpi-card-header">
                        <span className="kpi-card-label">In Shop</span>
                        <div className="kpi-card-icon kpi-card-icon--amber"><Wrench size={14} /></div>
                    </div>
                    <div className="kpi-card-value">{inShopCount}</div>
                    <div className="kpi-card-sub">
                        vehicles under maintenance
                        {inShopCount > 0 && (
                            <span className="kpi-card-trend kpi-card-trend--down" style={{ marginLeft: 6 }}>
                                <TrendingDown size={10} /> Attention
                            </span>
                        )}
                    </div>
                </div>
                <div className="kpi-card kpi-card--blue stagger-item" style={{ animationDelay: '0.15s' }}>
                    <div className="kpi-card-header">
                        <span className="kpi-card-label">Utilisation</span>
                        <div className="kpi-card-icon kpi-card-icon--blue"><Gauge size={14} /></div>
                    </div>
                    <div className="kpi-card-value">{utilRate}%</div>
                    <div className="kpi-card-sub" style={{ marginTop: 10 }}>
                        <div className="progress-bar">
                            <div className="progress-bar-fill progress-bar-fill--teal" style={{ width: `${utilRate}%` }} />
                        </div>
                    </div>
                </div>
                <div className="kpi-card kpi-card--red stagger-item" style={{ animationDelay: '0.2s' }}>
                    <div className="kpi-card-header">
                        <span className="kpi-card-label">Pending Cargo</span>
                        <div className="kpi-card-icon kpi-card-icon--red"><Package size={14} /></div>
                    </div>
                    <div className="kpi-card-value">{pendingCargo}</div>
                    <div className="kpi-card-sub">shipments awaiting dispatch</div>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--sp-4)' }}>
                <div className="card stagger-item" style={{ animationDelay: '0.25s' }}>
                    <div className="card-header">
                        <h3 className="card-title">Fleet Status</h3>
                        <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                            {totalVehicles} registered
                        </span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                        {statusBreakdown.map((s) => (
                            <div key={s.label}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{s.label}</span>
                                    <span style={{ fontSize: '0.8rem', fontFamily: 'var(--font-display)', fontWeight: 700, color: s.color }}>{s.count}</span>
                                </div>
                                <div className="progress-bar">
                                    <div style={{ height: '100%', width: `${totalVehicles > 0 ? (s.count / totalVehicles) * 100 : 0}%`, background: s.color, borderRadius: 2, transition: 'width 0.7s var(--ease)' }} />
                                </div>
                            </div>
                        ))}
                    </div>
                    <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid var(--border-subtle)', display: 'flex', gap: 10 }}>
                        {['Truck', 'Van', 'Bike'].map((type) => {
                            const count = vehicles.filter((v) => v.type === type).length
                            return (
                                <div key={type} style={{
                                    flex: 1, background: 'var(--bg-elevated)', borderRadius: 'var(--r-md)',
                                    padding: '10px 12px', textAlign: 'center', border: '1px solid var(--border-subtle)',
                                }}>
                                    <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.3rem', color: 'var(--text-primary)' }}>{count}</div>
                                    <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.12em', marginTop: 3, fontFamily: 'var(--font-mono)' }}>{type}s</div>
                                </div>
                            )
                        })}
                    </div>
                </div>

                <div className="card stagger-item" style={{ animationDelay: '0.3s' }}>
                    <div className="card-header">
                        <h3 className="card-title">Recent Activity</h3>
                        <button className="btn btn-ghost btn-sm" onClick={() => navigate('/trips')}>View All</button>
                    </div>
                    <div className="activity-feed">
                        {recentActivity.map((a) => (
                            <div key={a.id} className="activity-item">
                                <div className={`activity-dot activity-dot--${a.type}`} />
                                <span className="activity-text">{a.text}</span>
                                <span className="activity-time">{dayjs(a.time).fromNow()}</span>
                            </div>
                        ))}
                        {recentActivity.length === 0 && (
                            <div style={{ padding: '16px', color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                                No activity yet. Create a trip to get started.
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="card stagger-item" style={{ animationDelay: '0.35s', marginTop: 'var(--sp-4)' }}>
                <div className="card-header">
                    <h3 className="card-title">Driver Compliance Alerts</h3>
                    <button className="btn btn-ghost btn-sm" onClick={() => navigate('/drivers')}>Manage Drivers</button>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 10 }}>
                    {drivers.filter((d) => {
                        const days = dayjs(d.license_expiry).diff(dayjs(), 'day')
                        return days <= 30
                    }).map((d) => {
                        const days = dayjs(d.license_expiry).diff(dayjs(), 'day')
                        const expired = days < 0
                        return (
                            <div key={d.id} style={{
                                padding: '12px 14px',
                                background: expired ? 'var(--status-error-dim)' : 'var(--status-warn-dim)',
                                border: `1px solid ${expired ? 'rgba(232,64,64,0.18)' : 'rgba(232,160,32,0.18)'}`,
                                borderRadius: 'var(--r-md)',
                                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                            }}>
                                <div>
                                    <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-primary)' }}>{d.name}</div>
                                    <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: 3 }}>
                                        {d.license_category} · {d.license_number}
                                    </div>
                                </div>
                                <span className={`status-pill ${expired ? 'status-pill--expired' : 'status-pill--draft'}`}>
                                    {expired ? `Expired ${Math.abs(days)}d ago` : `${days}d left`}
                                </span>
                            </div>
                        )
                    })}
                    {drivers.filter((d) => dayjs(d.license_expiry).diff(dayjs(), 'day') <= 30).length === 0 && (
                        <div style={{ padding: '12px 14px', color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                            All driver licenses are current — no alerts.
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

// ─── Dispatcher Dashboard ──────────────────────────────────────
function DispatcherDashboard({ navigate, vehicles, trips, drivers, getActiveCount, getPendingCargoCount }) {
    const getVehicleById = useVehicleStore((s) => s.getVehicleById)
    const getAvailableVehicles = useVehicleStore((s) => s.getAvailableVehicles)
    const getAvailableDrivers = useDriverStore((s) => s.getAvailableDrivers)

    const activeTrips = trips.filter((t) => t.status === 'Dispatched')
    const draftTrips = trips.filter((t) => t.status === 'Draft')
    const completedToday = trips.filter((t) => t.status === 'Completed' && dayjs(t.completed_at).isAfter(dayjs().startOf('day')))

    return (
        <div>
            <div className="page-header">
                <div className="page-header-left">
                    <h1>Dispatch Center</h1>
                    <p>{dayjs().format('ddd, DD MMM YYYY — HH:mm')} &nbsp;&middot;&nbsp; Trip management overview</p>
                </div>
                <div className="quick-actions">
                    <button className="btn btn-primary" onClick={() => navigate('/trips')}>
                        <Plus size={14} /> New Trip
                    </button>
                </div>
            </div>

            <div className="kpi-grid">
                <div className="kpi-card kpi-card--blue">
                    <div className="kpi-card-header">
                        <span className="kpi-card-label">Active Trips</span>
                        <div className="kpi-card-icon kpi-card-icon--blue"><RouteIcon size={14} /></div>
                    </div>
                    <div className="kpi-card-value">{activeTrips.length}</div>
                    <div className="kpi-card-sub">currently in transit</div>
                </div>
                <div className="kpi-card kpi-card--amber">
                    <div className="kpi-card-header">
                        <span className="kpi-card-label">Pending Dispatch</span>
                        <div className="kpi-card-icon kpi-card-icon--amber"><Package size={14} /></div>
                    </div>
                    <div className="kpi-card-value">{draftTrips.length}</div>
                    <div className="kpi-card-sub">awaiting dispatch</div>
                </div>
                <div className="kpi-card kpi-card--teal">
                    <div className="kpi-card-header">
                        <span className="kpi-card-label">Available Vehicles</span>
                        <div className="kpi-card-icon kpi-card-icon--teal"><Truck size={14} /></div>
                    </div>
                    <div className="kpi-card-value">{getAvailableVehicles().length}</div>
                    <div className="kpi-card-sub">ready for dispatch</div>
                </div>
                <div className="kpi-card kpi-card--red">
                    <div className="kpi-card-header">
                        <span className="kpi-card-label">Available Drivers</span>
                        <div className="kpi-card-icon kpi-card-icon--red"><Users size={14} /></div>
                    </div>
                    <div className="kpi-card-value">{getAvailableDrivers().length}</div>
                    <div className="kpi-card-sub">on duty &amp; licensed</div>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--sp-4)' }}>
                <div className="card">
                    <div className="card-header">
                        <h3 className="card-title">Active Trips</h3>
                        <button className="btn btn-ghost btn-sm" onClick={() => navigate('/trips')}>View All</button>
                    </div>
                    <div className="activity-feed">
                        {activeTrips.slice(0, 6).map((t) => {
                            const v = getVehicleById(t.vehicle_id)
                            return (
                                <div key={t.id} className="activity-item">
                                    <div className="activity-dot activity-dot--blue" />
                                    <span className="activity-text">{v?.name || 'Vehicle'}: {t.origin} → {t.destination}</span>
                                    <span className="activity-time">{dayjs(t.dispatched_at).fromNow()}</span>
                                </div>
                            )
                        })}
                        {activeTrips.length === 0 && (
                            <div style={{ padding: 16, color: 'var(--text-muted)', fontSize: '0.75rem' }}>No active trips</div>
                        )}
                    </div>
                </div>

                <div className="card">
                    <div className="card-header">
                        <h3 className="card-title">Pending Drafts</h3>
                    </div>
                    <div className="activity-feed">
                        {draftTrips.slice(0, 6).map((t) => {
                            const v = getVehicleById(t.vehicle_id)
                            return (
                                <div key={t.id} className="activity-item">
                                    <div className="activity-dot activity-dot--amber" />
                                    <span className="activity-text">{v?.name || 'Vehicle'}: {t.origin} → {t.destination}</span>
                                    <span className="activity-time">{dayjs(t.created_at).fromNow()}</span>
                                </div>
                            )
                        })}
                        {draftTrips.length === 0 && (
                            <div style={{ padding: 16, color: 'var(--text-muted)', fontSize: '0.75rem' }}>No pending drafts</div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}

// ─── Safety Officer Dashboard ──────────────────────────────────
function SafetyDashboard({ navigate, drivers, trips }) {
    const expiredLicenses = drivers.filter((d) => dayjs(d.license_expiry).isBefore(dayjs()))
    const expiringSoon = drivers.filter((d) => {
        const left = dayjs(d.license_expiry).diff(dayjs(), 'day')
        return left > 0 && left <= 30
    })
    const suspended = drivers.filter((d) => d.status === 'Suspended')
    const avgSafety = drivers.length > 0
        ? Math.round(drivers.reduce((s, d) => s + (d.safety_score || 0), 0) / drivers.length)
        : 0

    const getScoreClass = (score) => {
        if (score >= 85) return 'score-badge--high'
        if (score >= 65) return 'score-badge--medium'
        return 'score-badge--low'
    }

    const topDrivers = [...drivers].sort((a, b) => (b.safety_score || 0) - (a.safety_score || 0)).slice(0, 5)
    const bottomDrivers = [...drivers].sort((a, b) => (a.safety_score || 0) - (b.safety_score || 0)).slice(0, 5)

    return (
        <div>
            <div className="page-header">
                <div className="page-header-left">
                    <h1>Safety & Compliance</h1>
                    <p>{dayjs().format('ddd, DD MMM YYYY — HH:mm')} &nbsp;&middot;&nbsp; Driver safety overview</p>
                </div>
                <div className="quick-actions">
                    <button className="btn btn-primary" onClick={() => navigate('/drivers')}>
                        <Users size={14} /> Manage Drivers
                    </button>
                </div>
            </div>

            <div className="kpi-grid">
                <div className="kpi-card kpi-card--teal">
                    <div className="kpi-card-header">
                        <span className="kpi-card-label">Avg Safety Score</span>
                        <div className="kpi-card-icon kpi-card-icon--teal"><Shield size={14} /></div>
                    </div>
                    <div className="kpi-card-value">{avgSafety}</div>
                    <div className="kpi-card-sub">across {drivers.length} drivers</div>
                </div>
                <div className="kpi-card kpi-card--red">
                    <div className="kpi-card-header">
                        <span className="kpi-card-label">Expired Licenses</span>
                        <div className="kpi-card-icon kpi-card-icon--red"><AlertTriangle size={14} /></div>
                    </div>
                    <div className="kpi-card-value">{expiredLicenses.length}</div>
                    <div className="kpi-card-sub">require immediate action</div>
                </div>
                <div className="kpi-card kpi-card--amber">
                    <div className="kpi-card-header">
                        <span className="kpi-card-label">Expiring Soon</span>
                        <div className="kpi-card-icon kpi-card-icon--amber"><AlertTriangle size={14} /></div>
                    </div>
                    <div className="kpi-card-value">{expiringSoon.length}</div>
                    <div className="kpi-card-sub">within 30 days</div>
                </div>
                <div className="kpi-card kpi-card--blue">
                    <div className="kpi-card-header">
                        <span className="kpi-card-label">Suspended</span>
                        <div className="kpi-card-icon kpi-card-icon--blue"><Shield size={14} /></div>
                    </div>
                    <div className="kpi-card-value">{suspended.length}</div>
                    <div className="kpi-card-sub">drivers suspended</div>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--sp-4)' }}>
                <div className="card">
                    <div className="card-header">
                        <h3 className="card-title">Top Performers</h3>
                    </div>
                    <div className="activity-feed">
                        {topDrivers.map((d, i) => (
                            <div key={d.id} className="activity-item" style={{ padding: '10px 0' }}>
                                <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.85rem', color: i === 0 ? '#FFB020' : 'var(--text-muted)', width: 24 }}>#{i + 1}</span>
                                <span className="activity-text">{d.name}</span>
                                <span className={`score-badge ${getScoreClass(d.safety_score || 0)}`}>{d.safety_score || 0}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="card">
                    <div className="card-header">
                        <h3 className="card-title">License Alerts</h3>
                        <button className="btn btn-ghost btn-sm" onClick={() => navigate('/drivers')}>View All</button>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {[...expiredLicenses, ...expiringSoon].slice(0, 6).map((d) => {
                            const days = dayjs(d.license_expiry).diff(dayjs(), 'day')
                            const expired = days < 0
                            return (
                                <div key={d.id} style={{
                                    padding: '10px 12px',
                                    background: expired ? 'var(--status-error-dim)' : 'var(--status-warn-dim)',
                                    border: `1px solid ${expired ? 'rgba(232,64,64,0.15)' : 'rgba(232,160,32,0.15)'}`,
                                    borderRadius: 'var(--r-md)',
                                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                }}>
                                    <div>
                                        <div style={{ fontSize: '0.8rem', fontWeight: 600 }}>{d.name}</div>
                                        <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{d.license_category} · {d.license_number}</div>
                                    </div>
                                    <span className={`status-pill ${expired ? 'status-pill--expired' : 'status-pill--draft'}`}>
                                        {expired ? `Expired ${Math.abs(days)}d ago` : `${days}d left`}
                                    </span>
                                </div>
                            )
                        })}
                        {expiredLicenses.length === 0 && expiringSoon.length === 0 && (
                            <div style={{ padding: 12, color: 'var(--text-muted)', fontSize: '0.75rem' }}>All licenses current</div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}

// ─── Financial Analyst Dashboard ───────────────────────────────
function FinancialDashboard({ navigate, vehicles, expenses, maintenanceLogs, getTotalMaintenanceCost }) {
    const totalFuel = expenses.reduce((s, e) => s + Number(e.cost), 0)
    const totalMaint = vehicles.reduce((s, v) => s + getTotalMaintenanceCost(v.id), 0)
    const totalOps = totalFuel + totalMaint

    // Monthly breakdown (last 6 months)
    const monthlyData = []
    for (let i = 5; i >= 0; i--) {
        const month = dayjs().subtract(i, 'month')
        const mKey = month.format('YYYY-MM')
        const mExpenses = expenses.filter((e) => dayjs(e.date).format('YYYY-MM') === mKey)
        const mMaint = maintenanceLogs.filter((l) => dayjs(l.date).format('YYYY-MM') === mKey)
        monthlyData.push({
            month: month.format('MMM'),
            fuel: mExpenses.reduce((s, e) => s + Number(e.cost), 0),
            maintenance: mMaint.reduce((s, l) => s + Number(l.cost), 0),
        })
    }

    return (
        <div>
            <div className="page-header">
                <div className="page-header-left">
                    <h1>Financial Overview</h1>
                    <p>{dayjs().format('ddd, DD MMM YYYY — HH:mm')} &nbsp;&middot;&nbsp; Cost analysis and tracking</p>
                </div>
                <div className="quick-actions">
                    <button className="btn btn-primary" onClick={() => navigate('/expenses')}>
                        <Fuel size={14} /> Log Fuel
                    </button>
                    <button className="btn btn-secondary" onClick={() => navigate('/analytics')}>
                        <BarChart3 size={14} /> Full Analytics
                    </button>
                </div>
            </div>

            <div className="kpi-grid">
                <div className="kpi-card kpi-card--teal">
                    <div className="kpi-card-header">
                        <span className="kpi-card-label">Total Fuel Spend</span>
                        <div className="kpi-card-icon kpi-card-icon--teal"><Fuel size={14} /></div>
                    </div>
                    <div className="kpi-card-value">{totalFuel.toLocaleString('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 })}</div>
                    <div className="kpi-card-sub">{expenses.length} fuel entries</div>
                </div>
                <div className="kpi-card kpi-card--amber">
                    <div className="kpi-card-header">
                        <span className="kpi-card-label">Total Maintenance</span>
                        <div className="kpi-card-icon kpi-card-icon--amber"><Wrench size={14} /></div>
                    </div>
                    <div className="kpi-card-value">{totalMaint.toLocaleString('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 })}</div>
                    <div className="kpi-card-sub">{maintenanceLogs.length} service logs</div>
                </div>
                <div className="kpi-card kpi-card--red">
                    <div className="kpi-card-header">
                        <span className="kpi-card-label">Total Ops Cost</span>
                        <div className="kpi-card-icon kpi-card-icon--red"><DollarSign size={14} /></div>
                    </div>
                    <div className="kpi-card-value">{totalOps.toLocaleString('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 })}</div>
                    <div className="kpi-card-sub">Fuel + Maintenance</div>
                </div>
                <div className="kpi-card kpi-card--blue">
                    <div className="kpi-card-header">
                        <span className="kpi-card-label">Fleet Size</span>
                        <div className="kpi-card-icon kpi-card-icon--blue"><Truck size={14} /></div>
                    </div>
                    <div className="kpi-card-value">{vehicles.filter(v => v.status !== 'Retired').length}</div>
                    <div className="kpi-card-sub">active vehicles</div>
                </div>
            </div>

            <div className="card">
                <div className="card-header">
                    <h3 className="card-title">Monthly Spend Trend</h3>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 8 }}>
                    {monthlyData.map((m) => {
                        const total = m.fuel + m.maintenance
                        const maxVal = Math.max(...monthlyData.map((d) => d.fuel + d.maintenance), 1)
                        const pct = (total / maxVal) * 100
                        return (
                            <div key={m.month} style={{ textAlign: 'center' }}>
                                <div style={{ height: 120, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', marginBottom: 8 }}>
                                    <div style={{
                                        width: '60%', height: `${Math.max(pct, 4)}%`,
                                        background: 'linear-gradient(to top, var(--amber), rgba(232,160,32,0.3))',
                                        borderRadius: '4px 4px 0 0', transition: 'height 0.5s var(--ease)',
                                    }} />
                                </div>
                                <div style={{ fontSize: '0.65rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>{m.month}</div>
                                <div style={{ fontSize: '0.7rem', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', marginTop: 2 }}>
                                    {total > 0 ? `${(total / 1000).toFixed(1)}k` : '0'}
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>
        </div>
    )
}
