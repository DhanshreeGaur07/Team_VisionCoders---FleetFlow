import { useState, useEffect } from 'react'
import { Download, FileText } from 'lucide-react'
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area } from 'recharts'
import useVehicleStore from '../stores/vehicleStore'
import useExpenseStore from '../stores/expenseStore'
import useMaintenanceStore from '../stores/maintenanceStore'
import useTripStore from '../stores/tripStore'
import useDriverStore from '../stores/driverStore'
import dayjs from 'dayjs'

const COLORS = ['#E8A020', '#4A90D9', '#3DC97A', '#E84040', '#A78BFA', '#F472B6']

export default function Analytics() {
    const vehicles = useVehicleStore((s) => s.vehicles)
    const fetchVehicles = useVehicleStore((s) => s.fetch)
    const expenses = useExpenseStore((s) => s.expenses)
    const fetchExpenses = useExpenseStore((s) => s.fetch)
    const getTotalFuelCost = useExpenseStore((s) => s.getTotalFuelCost)
    const getTotalLiters = useExpenseStore((s) => s.getTotalLiters)
    const getTotalMaintenanceCost = useMaintenanceStore((s) => s.getTotalMaintenanceCost)
    const fetchMaintenance = useMaintenanceStore((s) => s.fetch)
    const maintenanceLogs = useMaintenanceStore((s) => s.logs)
    const trips = useTripStore((s) => s.trips)
    const fetchTrips = useTripStore((s) => s.fetch)
    const drivers = useDriverStore((s) => s.drivers)
    const fetchDrivers = useDriverStore((s) => s.fetch)
    const [activeTab, setActiveTab] = useState('overview')

    useEffect(() => {
        fetchVehicles()
        fetchExpenses()
        fetchMaintenance()
        fetchTrips()
        fetchDrivers()
    }, [])

    // Fuel Efficiency Data (km/L per vehicle)
    const fuelEffData = vehicles.filter((v) => v.status !== 'Retired').map((v) => {
        const liters = getTotalLiters(v.id)
        const kmPerL = liters > 0 ? (v.odometer / liters).toFixed(1) : 0
        return { name: v.name.split(' ').slice(0, 2).join(' '), kmPerL: Number(kmPerL), liters }
    }).filter((d) => d.liters > 0)

    // Vehicle ROI
    const roiData = vehicles.filter((v) => v.status !== 'Retired' && (v.acquisition_cost || 0) > 0).map((v) => {
        const fuelCost = getTotalFuelCost(v.id)
        const maintCost = getTotalMaintenanceCost(v.id)
        const revenue = trips.filter((t) => t.vehicle_id === v.id && t.status === 'Completed')
            .reduce((s, t) => s + (t.revenue || 0), 0)
        const roi = ((revenue - fuelCost - maintCost) / v.acquisition_cost * 100).toFixed(1)
        return { name: v.name.split(' ').slice(0, 2).join(' '), roi: Number(roi), revenue, costs: fuelCost + maintCost }
    })

    // Cost breakdown pie
    const totalFuel = expenses.reduce((s, e) => s + Number(e.cost), 0)
    const totalMaint = vehicles.reduce((s, v) => s + getTotalMaintenanceCost(v.id), 0)
    const costPie = [
        { name: 'Fuel', value: totalFuel },
        { name: 'Maintenance', value: totalMaint },
    ]

    // Monthly cost trend
    const monthlyData = []
    for (let i = 5; i >= 0; i--) {
        const month = dayjs().subtract(i, 'month')
        const mKey = month.format('YYYY-MM')
        const monthExpenses = expenses.filter((e) => dayjs(e.date).format('YYYY-MM') === mKey)
        const monthMaint = maintenanceLogs.filter((l) => dayjs(l.date).format('YYYY-MM') === mKey)
        monthlyData.push({
            month: month.format('MMM'),
            fuel: monthExpenses.reduce((s, e) => s + Number(e.cost), 0),
            maintenance: monthMaint.reduce((s, l) => s + Number(l.cost), 0),
        })
    }

    // Fleet utilization over time (simulated)
    const utilizationData = Array.from({ length: 7 }, (_, i) => ({
        day: dayjs().subtract(6 - i, 'day').format('ddd'),
        rate: Math.round(15 + Math.random() * 35),
    }))

    // Driver leaderboard
    const driverLeaderboard = [...drivers]
        .sort((a, b) => (b.safety_score || 0) - (a.safety_score || 0))
        .map((d, i) => ({ ...d, rank: i + 1 }))

    // Export CSV
    const exportCSV = (data, filename) => {
        import('papaparse').then(({ default: Papa }) => {
            const csv = Papa.unparse(data)
            const blob = new Blob([csv], { type: 'text/csv' })
            const url = URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = filename
            a.click()
            URL.revokeObjectURL(url)
        })
    }

    // Export PDF
    const exportPDF = (title) => {
        import('jspdf').then(({ default: jsPDF }) => {
            const doc = new jsPDF()
            doc.setFontSize(16)
            doc.text(`FleetPulse — ${title}`, 14, 20)
            doc.setFontSize(10)
            doc.text(`Generated: ${dayjs().format('DD MMM YYYY, HH:mm')}`, 14, 28)
            doc.setFontSize(11)

            let y = 40
            doc.text('Fleet Summary:', 14, y); y += 8
            doc.text(`Total Vehicles: ${vehicles.length}`, 20, y); y += 6
            doc.text(`Active: ${vehicles.filter(v => v.status === 'On Trip').length}`, 20, y); y += 6
            doc.text(`Total Fuel Cost: Rs. ${totalFuel.toLocaleString()}`, 20, y); y += 6
            doc.text(`Total Maintenance Cost: Rs. ${totalMaint.toLocaleString()}`, 20, y); y += 6
            doc.text(`Total Trips: ${trips.length}`, 20, y); y += 6
            doc.text(`Completed Trips: ${trips.filter(t => t.status === 'Completed').length}`, 20, y); y += 12

            doc.text('Driver Safety Scores:', 14, y); y += 8
            driverLeaderboard.forEach(d => {
                doc.text(`${d.rank}. ${d.name} — Score: ${d.safety_score || 0}, Trips: ${d.trips_completed || 0}`, 20, y)
                y += 6
            })

            doc.save(`fleetpulse-${title.toLowerCase().replace(/\s+/g, '-')}.pdf`)
        })
    }

    const customTooltipStyle = {
        backgroundColor: '#161614',
        border: '1px solid rgba(240, 235, 224, 0.09)',
        borderRadius: '6px',
        padding: '10px 14px',
        fontFamily: 'DM Mono',
        fontSize: '0.75rem',
        color: '#A09880',
    }

    return (
        <div>
            <div className="page-header">
                <div className="page-header-left">
                    <h1>Analytics & Reports</h1>
                    <p>Data-driven insights for fleet optimization</p>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                    <button className="btn btn-secondary" onClick={() => exportCSV(
                        vehicles.map(v => ({
                            Name: v.name, Plate: v.license_plate, Type: v.type, Status: v.status,
                            Odometer: v.odometer, FuelCost: getTotalFuelCost(v.id), MaintCost: getTotalMaintenanceCost(v.id),
                        })),
                        'fleet-report.csv'
                    )}>
                        <Download size={16} /> Export CSV
                    </button>
                    <button className="btn btn-primary" onClick={() => exportPDF('Operational Report')}>
                        <FileText size={16} /> Export PDF
                    </button>
                </div>
            </div>

            {/* Tabs */}
            <div className="tabs">
                {['overview', 'fuel', 'financial', 'drivers'].map((tab) => (
                    <button
                        key={tab}
                        className={`tab ${activeTab === tab ? 'active' : ''}`}
                        onClick={() => setActiveTab(tab)}
                    >
                        {tab.charAt(0).toUpperCase() + tab.slice(1)}
                    </button>
                ))}
            </div>

            {activeTab === 'overview' && (
                <div>
                    <div className="charts-grid">
                        <div className="chart-container">
                            <h3>Monthly Cost Trend</h3>
                            <ResponsiveContainer width="100%" height={280}>
                                <AreaChart data={monthlyData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(240,235,224,0.04)" />
                                    <XAxis dataKey="month" tick={{ fill: '#6B6455', fontSize: 11, fontFamily: 'DM Mono' }} />
                                    <YAxis tick={{ fill: '#6B6455', fontSize: 11, fontFamily: 'DM Mono' }} />
                                    <Tooltip contentStyle={customTooltipStyle} />
                                    <Area type="monotone" dataKey="fuel" stackId="1" stroke="#E8A020" fill="rgba(232,160,32,0.08)" name="Fuel" />
                                    <Area type="monotone" dataKey="maintenance" stackId="1" stroke="#4A90D9" fill="rgba(74,144,217,0.08)" name="Maintenance" />
                                    <Legend />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>

                        <div className="chart-container">
                            <h3>Fleet Utilization (7 Days)</h3>
                            <ResponsiveContainer width="100%" height={280}>
                                <LineChart data={utilizationData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(240,235,224,0.04)" />
                                    <XAxis dataKey="day" tick={{ fill: '#6B6455', fontSize: 11, fontFamily: 'DM Mono' }} />
                                    <YAxis unit="%" tick={{ fill: '#6B6455', fontSize: 11, fontFamily: 'DM Mono' }} />
                                    <Tooltip contentStyle={customTooltipStyle} />
                                    <Line type="monotone" dataKey="rate" stroke="#4A90D9" strokeWidth={2} dot={{ r: 4, fill: '#3B82F6' }} name="Utilization %" />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    <div className="charts-grid" style={{ marginTop: 'var(--space-lg)' }}>
                        <div className="chart-container">
                            <h3>Cost Distribution</h3>
                            <ResponsiveContainer width="100%" height={260}>
                                <PieChart>
                                    <Pie data={costPie} cx="50%" cy="50%" outerRadius={90} innerRadius={50}
                                        dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                        labelLine={{ stroke: '#64748B' }}
                                    >
                                        {costPie.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
                                    </Pie>
                                    <Tooltip contentStyle={customTooltipStyle} formatter={(val) => `₹${val.toLocaleString()}`} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>

                        <div className="chart-container">
                            <h3>Fuel Efficiency by Vehicle (km/L)</h3>
                            <ResponsiveContainer width="100%" height={260}>
                                <BarChart data={fuelEffData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(240,235,224,0.04)" />
                                    <XAxis dataKey="name" tick={{ fill: '#6B6455', fontSize: 11, fontFamily: 'DM Mono' }} />
                                    <YAxis unit=" km/L" tick={{ fill: '#6B6455', fontSize: 11, fontFamily: 'DM Mono' }} />
                                    <Tooltip contentStyle={customTooltipStyle} />
                                    <Bar dataKey="kmPerL" fill="#E8A020" radius={[4, 4, 0, 0]} name="km/L" />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'fuel' && (
                <div className="chart-container">
                    <h3>Fuel Consumption Analysis</h3>
                    <ResponsiveContainer width="100%" height={400}>
                        <BarChart data={fuelEffData} layout="vertical">
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(240,235,224,0.04)" />
                            <XAxis type="number" tick={{ fill: '#6B6455', fontSize: 11, fontFamily: 'DM Mono' }} />
                            <YAxis dataKey="name" type="category" width={120} tick={{ fill: '#6B6455', fontSize: 11, fontFamily: 'DM Mono' }} />
                            <Tooltip contentStyle={customTooltipStyle} />
                            <Bar dataKey="kmPerL" fill="#E8A020" radius={[0, 4, 4, 0]} name="Fuel Efficiency (km/L)" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            )}

            {activeTab === 'financial' && (
                <div>
                    <div className="card" style={{ marginBottom: 'var(--space-lg)' }}>
                        <div className="card-header">
                            <h3 className="card-title">Vehicle ROI Analysis</h3>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                ROI = (Revenue - Costs) / Acquisition Cost x 100
                            </span>
                        </div>
                        <div className="data-table-wrap" style={{ border: 'none' }}>
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>Vehicle</th>
                                        <th>Revenue</th>
                                        <th>Costs</th>
                                        <th>Net</th>
                                        <th>ROI</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {roiData.map((r) => (
                                        <tr key={r.name}>
                                            <td className="cell-primary">{r.name}</td>
                                             <td className="cell-mono" style={{ color: 'var(--status-ok)' }}>₹{r.revenue.toLocaleString()}</td>
                                             <td className="cell-mono" style={{ color: 'var(--status-error)' }}>₹{r.costs.toLocaleString()}</td>
                                             <td className="cell-mono" style={{ color: r.revenue - r.costs >= 0 ? 'var(--status-ok)' : 'var(--status-error)' }}>
                                                 ₹{(r.revenue - r.costs).toLocaleString()}
                                             </td>
                                             <td>
                                                 <span style={{
                                                     fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1rem',
                                                     color: r.roi >= 0 ? 'var(--status-ok)' : 'var(--status-error)',
                                                 }}>
                                                     {r.roi}%
                                                 </span>
                                             </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div className="chart-container">
                        <h3>ROI Comparison</h3>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={roiData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(240,235,224,0.04)" />
                                <XAxis dataKey="name" tick={{ fill: '#6B6455', fontSize: 11, fontFamily: 'DM Mono' }} />
                                <YAxis unit="%" tick={{ fill: '#6B6455', fontSize: 11, fontFamily: 'DM Mono' }} />
                                <Tooltip contentStyle={customTooltipStyle} />
                                <Bar dataKey="roi" name="ROI %" radius={[4, 4, 0, 0]}>
                                    {roiData.map((entry, i) => (
                                        <Cell key={i} fill={entry.roi >= 0 ? '#3DC97A' : '#E84040'} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            )}

            {activeTab === 'drivers' && (
                <div className="card">
                    <div className="card-header">
                        <h3 className="card-title">Driver Performance Ranking</h3>
                    </div>
                    <div className="data-table-wrap" style={{ border: 'none' }}>
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Rank</th>
                                    <th>Driver</th>
                                    <th>Safety Score</th>
                                    <th>Trips Completed</th>
                                    <th>Status</th>
                                    <th>License</th>
                                </tr>
                            </thead>
                            <tbody>
                                {driverLeaderboard.map((d) => (
                                    <tr key={d.id}>
                                        <td>
                                            <span style={{
                                                fontFamily: 'var(--font-display)', fontWeight: 700,
                                                fontSize: d.rank <= 3 ? '1.2rem' : '0.9rem',
                                                color: d.rank === 1 ? '#FFB020' : d.rank === 2 ? '#C0C0C0' : d.rank === 3 ? '#CD7F32' : 'var(--text-muted)',
                                            }}>
                                                #{d.rank}
                                            </span>
                                        </td>
                                        <td className="cell-primary">{d.name}</td>
                                        <td>
                                            <span className={`score-badge ${(d.safety_score || 0) >= 85 ? 'score-badge--high' : (d.safety_score || 0) >= 65 ? 'score-badge--medium' : 'score-badge--low'}`}>
                                                {d.safety_score || 0}
                                            </span>
                                        </td>
                                        <td className="cell-mono">{d.trips_completed || 0}</td>
                                        <td>
                                            <span className={`status-pill status-pill--${d.status === 'On Duty' ? 'on-duty' : d.status === 'Off Duty' ? 'off-duty' : 'suspended'}`}>
                                                {d.status}
                                            </span>
                                        </td>
                                        <td className="cell-mono" style={{ fontSize: '0.8rem' }}>{d.license_category}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    )
}
