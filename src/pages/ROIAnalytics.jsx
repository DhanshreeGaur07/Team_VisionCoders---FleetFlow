import { useEffect, useState } from 'react'
import {
    TrendingUp, TrendingDown, DollarSign, Truck, Fuel, Wrench,
    Calendar, PieChart, BarChart3, ArrowUpRight, ArrowDownRight,
    Calculator, Target, Percent, Activity, AlertCircle, CheckCircle,
    Route, MapPin, Clock, Package, Award, XCircle,
} from 'lucide-react'
import useVehicleStore from '../stores/vehicleStore'
import useTripStore from '../stores/tripStore'
import useExpenseStore from '../stores/expenseStore'
import useMaintenanceStore from '../stores/maintenanceStore'
import useAuthStore from '../stores/authStore'
import dayjs from 'dayjs'

export default function ROIAnalytics() {
    const vehicles = useVehicleStore((s) => s.vehicles) || []
    const trips = useTripStore((s) => s.trips) || []
    const expenses = useExpenseStore((s) => s.expenses) || []
    const maintenanceLogs = useMaintenanceStore((s) => s.logs) || []
    const vehiclesLoading = useVehicleStore((s) => s.loading)
    const fetchVehicles = useVehicleStore((s) => s.fetch)
    const fetchTrips = useTripStore((s) => s.fetch)
    const fetchExpenses = useExpenseStore((s) => s.fetch)
    const fetchMaintenance = useMaintenanceStore((s) => s.fetch)
    const role = useAuthStore((s) => s.role)

    const getVehicleById = useVehicleStore((s) => s.getVehicleById)

    const [timeRange, setTimeRange] = useState('12m')
    const [selectedVehicle, setSelectedVehicle] = useState('all')
    const [activeTab, setActiveTab] = useState('fleet')
    const [tripSortBy, setTripSortBy] = useState('roi')
    const [tripSortOrder, setTripSortOrder] = useState('desc')

    const getROIStatus = (roi) => {
        if (roi >= 50) return { label: 'Excellent', color: '#3DC97A', icon: CheckCircle }
        if (roi >= 20) return { label: 'Good', color: '#4A90D9', icon: TrendingUp }
        if (roi >= 0) return { label: 'Break-even', color: '#E8A020', icon: Activity }
        return { label: 'Loss', color: '#E84040', icon: AlertCircle }
    }

    useEffect(() => {
        fetchVehicles()
        fetchTrips()
        fetchExpenses()
        fetchMaintenance()
    }, [])

    if (vehiclesLoading) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>
                Loading ROI data...
            </div>
        )
    }

    if (vehicles.length === 0) {
        return (
            <div>
                <div className="page-header">
                    <div className="page-header-left">
                        <h1>ROI Analytics</h1>
                        <p>Return on Investment analysis and fleet profitability</p>
                    </div>
                </div>
                <div className="card" style={{ padding: 'var(--sp-12)', textAlign: 'center' }}>
                    <BarChart3 size={48} style={{ color: 'var(--text-dim)', marginBottom: 'var(--sp-4)' }} />
                    <h3 style={{ marginBottom: 'var(--sp-2)' }}>No Data Available</h3>
                    <p style={{ color: 'var(--text-muted)' }}>Add vehicles and complete trips to see ROI analytics</p>
                </div>
            </div>
        )
    }

    let completedTrips, totalInvestment, totalRevenue, totalFuelCost, totalMaintenanceCost, totalOperatingCosts, netProfit, roiPercentage, profitMargin
    let activeVehicles, avgRevenuePerVehicle, avgCostPerVehicle, monthlyData, vehicleROI, filteredVehicles, months
    let tripROI, filteredTripROI, topTrips, worstTrips, avgTripRevenue, avgTripROI, profitableTrips, lossTrips
    let costBreakdown, maxProfit, overallStatus, StatusIcon

    try {
        completedTrips = trips.filter(t => t.status === 'Completed')
        
        totalInvestment = vehicles.reduce((sum, v) => sum + Number(v.acquisition_cost || 0), 0)
        
        totalRevenue = completedTrips.reduce((sum, t) => sum + Number(t.revenue || 0), 0)
        
        totalFuelCost = expenses.filter(e => e.type === 'fuel').reduce((sum, e) => sum + Number(e.cost || 0), 0)
        
        totalMaintenanceCost = maintenanceLogs.reduce((sum, m) => sum + Number(m.cost || 0), 0)
        
        totalOperatingCosts = totalFuelCost + totalMaintenanceCost
        
        netProfit = totalRevenue - totalOperatingCosts
        
        roiPercentage = totalOperatingCosts > 0 ? ((netProfit / totalOperatingCosts) * 100) : 0
        
        profitMargin = totalRevenue > 0 ? ((netProfit / totalRevenue) * 100) : 0

        activeVehicles = vehicles.filter(v => v.status !== 'Retired')
        avgRevenuePerVehicle = activeVehicles.length > 0 ? totalRevenue / activeVehicles.length : 0
        avgCostPerVehicle = activeVehicles.length > 0 ? totalOperatingCosts / activeVehicles.length : 0

        monthlyData = []
        months = timeRange === '3m' ? 3 : timeRange === '6m' ? 6 : 12
        for (let i = months - 1; i >= 0; i--) {
            const month = dayjs().subtract(i, 'month')
            const mKey = month.format('YYYY-MM')
            const mTrips = completedTrips.filter(t => t.completed_at && dayjs(t.completed_at).format('YYYY-MM') === mKey)
            const mExpenses = expenses.filter(e => e.date && dayjs(e.date).format('YYYY-MM') === mKey)
            const mMaint = maintenanceLogs.filter(m => m.date && dayjs(m.date).format('YYYY-MM') === mKey)
            
            const revenue = mTrips.reduce((s, t) => s + Number(t.revenue || 0), 0)
            const costs = mExpenses.reduce((s, e) => s + Number(e.cost || 0), 0) + 
                         mMaint.reduce((s, m) => s + Number(m.cost || 0), 0)
            
            monthlyData.push({
                month: month.format('MMM'),
                fullMonth: month.format('MMMM YYYY'),
                revenue,
                costs,
                profit: revenue - costs,
                roi: costs > 0 ? ((revenue - costs) / costs) * 100 : 0,
            })
        }

        vehicleROI = activeVehicles.map(v => {
            const vTrips = completedTrips.filter(t => t.vehicle_id === v.id)
            const vRevenue = vTrips.reduce((s, t) => s + Number(t.revenue || 0), 0)
            const vFuel = expenses.filter(e => e.vehicle_id === v.id && e.type === 'fuel')
                .reduce((s, e) => s + Number(e.cost || 0), 0)
            const vMaint = maintenanceLogs.filter(m => m.vehicle_id === v.id)
                .reduce((s, m) => s + Number(m.cost || 0), 0)
            const vCosts = vFuel + vMaint
            const vProfit = vRevenue - vCosts
            const vROI = vCosts > 0 ? (vProfit / vCosts) * 100 : 0
            const acquisitionCost = Number(v.acquisition_cost || 0)
            const paybackProgress = acquisitionCost > 0 ? Math.min((vProfit / acquisitionCost) * 100, 100) : 100
            
            return {
                ...v,
                revenue: vRevenue,
                costs: vCosts,
                profit: vProfit,
                roi: vROI,
                tripCount: vTrips.length,
                paybackProgress,
                acquisitionCost,
            }
        }).sort((a, b) => b.roi - a.roi)

        filteredVehicles = selectedVehicle === 'all' 
            ? vehicleROI 
            : vehicleROI.filter(v => v.id === selectedVehicle)

        tripROI = completedTrips.map(t => {
            const vehicle = getVehicleById(t.vehicle_id)
            const revenue = Number(t.revenue || 0)
            const distance = Math.max(0, Number(t.end_odometer || 0) - Number(t.start_odometer || 0))
            const cargoWeight = Number(t.cargo_weight || 0)
            
            const vehicleExpenses = expenses.filter(e => e.vehicle_id === t.vehicle_id)
            const vehicleMaint = maintenanceLogs.filter(m => m.vehicle_id === t.vehicle_id)
            const totalVehicleFuel = vehicleExpenses.reduce((s, e) => s + Number(e.cost || 0), 0)
            const totalVehicleMaint = vehicleMaint.reduce((s, m) => s + Number(m.cost || 0), 0)
            const totalVehicleDistance = vehicle ? Math.max(0, Number(vehicle.odometer || 0) - Number(t.start_odometer || 0)) : Math.max(0, distance)
            
            const costPerKm = totalVehicleDistance > 0 
                ? (totalVehicleFuel + totalVehicleMaint) / totalVehicleDistance 
                : 0
            const estimatedTripCost = distance > 0 ? distance * costPerKm : 0
            const profit = revenue - estimatedTripCost
            const roi = estimatedTripCost > 0 ? (profit / estimatedTripCost) * 100 : (revenue > 0 ? 100 : 0)
            const revenuePerKm = distance > 0 ? revenue / distance : 0
            const revenuePerKg = cargoWeight > 0 ? revenue / cargoWeight : 0
            
            return {
                ...t,
                vehicleName: vehicle?.name || 'Unknown',
                vehicleType: vehicle?.type || '-',
                distance,
                revenue,
                estimatedCost: estimatedTripCost,
                profit,
                roi,
                revenuePerKm,
                revenuePerKg,
                efficiency: revenue > 0 && estimatedTripCost > 0 ? (profit / revenue) * 100 : (revenue > 0 ? 100 : 0),
            }
        })

        filteredTripROI = tripROI
            .filter(t => selectedVehicle === 'all' || t.vehicle_id === selectedVehicle)
            .sort((a, b) => {
                const aVal = tripSortBy === 'roi' ? a.roi : 
                            tripSortBy === 'revenue' ? a.revenue :
                            tripSortBy === 'profit' ? a.profit :
                            tripSortBy === 'distance' ? a.distance : a.revenue
                const bVal = tripSortBy === 'roi' ? b.roi : 
                            tripSortBy === 'revenue' ? b.revenue :
                            tripSortBy === 'profit' ? b.profit :
                            tripSortBy === 'distance' ? b.distance : b.revenue
                return tripSortOrder === 'desc' ? bVal - aVal : aVal - bVal
            })

        topTrips = [...tripROI].sort((a, b) => b.roi - a.roi).slice(0, 5)
        worstTrips = [...tripROI].sort((a, b) => a.roi - b.roi).slice(0, 5)
        
        avgTripRevenue = tripROI.length > 0 
            ? tripROI.reduce((s, t) => s + t.revenue, 0) / tripROI.length 
            : 0
        avgTripROI = tripROI.length > 0 
            ? tripROI.reduce((s, t) => s + t.roi, 0) / tripROI.length 
            : 0
        profitableTrips = tripROI.filter(t => t.profit > 0).length
        lossTrips = tripROI.filter(t => t.profit < 0).length

        costBreakdown = [
            { label: 'Fuel Costs', value: totalFuelCost, color: '#E8A020', icon: Fuel },
            { label: 'Maintenance', value: totalMaintenanceCost, color: '#4A90D9', icon: Wrench },
            { label: 'Net Revenue', value: totalRevenue, color: '#3DC97A', icon: DollarSign },
        ]

        maxProfit = monthlyData.length > 0 
            ? Math.max(...monthlyData.map(m => Math.abs(m.profit)), 1) 
            : 1

        overallStatus = getROIStatus(roiPercentage)
        StatusIcon = overallStatus.icon
    } catch (error) {
        console.error('ROI Analytics error:', error)
        return (
            <div>
                <div className="page-header">
                    <div className="page-header-left">
                        <h1>ROI Analytics</h1>
                        <p>Return on Investment analysis and fleet profitability</p>
                    </div>
                </div>
                <div className="card" style={{ padding: 'var(--sp-12)', textAlign: 'center' }}>
                    <AlertCircle size={48} style={{ color: 'var(--status-error)', marginBottom: 'var(--sp-4)' }} />
                    <h3 style={{ marginBottom: 'var(--sp-2)', color: 'var(--status-error)' }}>Error Loading Data</h3>
                    <p style={{ color: 'var(--text-muted)' }}>{String(error)}</p>
                    <pre style={{textAlign: 'left', marginTop: 10, fontSize: '0.6rem'}}>{error?.stack}</pre>
                </div>
            </div>
        )
    }

    return (
        <div>
            <div className="page-header">
                <div className="page-header-left">
                    <h1>ROI Analytics</h1>
                    <p>Return on Investment analysis &middot; Fleet profitability insights</p>
                </div>
                <div className="quick-actions">
                    <select 
                        className="form-select"
                        value={timeRange}
                        onChange={(e) => setTimeRange(e.target.value)}
                        style={{ minWidth: 120 }}
                    >
                        <option value="3m">Last 3 Months</option>
                        <option value="6m">Last 6 Months</option>
                        <option value="12m">Last 12 Months</option>
                    </select>
                    <select 
                        className="form-select"
                        value={selectedVehicle}
                        onChange={(e) => setSelectedVehicle(e.target.value)}
                        style={{ minWidth: 150 }}
                    >
                        <option value="all">All Vehicles</option>
                        {vehicles.map(v => (
                            <option key={v.id} value={v.id}>{v.name}</option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="tabs" style={{ marginBottom: 'var(--sp-6)' }}>
                <button 
                    className={`tab ${activeTab === 'fleet' ? 'active' : ''}`}
                    onClick={() => setActiveTab('fleet')}
                >
                    <Truck size={12} style={{ marginRight: 6 }} />
                    Fleet ROI
                </button>
                <button 
                    className={`tab ${activeTab === 'trips' ? 'active' : ''}`}
                    onClick={() => setActiveTab('trips')}
                >
                    <Route size={12} style={{ marginRight: 6 }} />
                    Trip ROI
                </button>
            </div>

            {activeTab === 'fleet' ? (
                <>
                <div className="kpi-grid">
                <div className="kpi-card kpi-card--teal stagger-item" style={{ animationDelay: '0.05s' }}>
                    <div className="kpi-card-header">
                        <span className="kpi-card-label">Total Revenue</span>
                        <div className="kpi-card-icon kpi-card-icon--teal"><DollarSign size={14} /></div>
                    </div>
                    <div className="kpi-card-value">
                        {totalRevenue.toLocaleString('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 })}
                    </div>
                    <div className="kpi-card-sub">
                        from {completedTrips.length} completed trips
                    </div>
                </div>

                <div className="kpi-card kpi-card--red stagger-item" style={{ animationDelay: '0.1s' }}>
                    <div className="kpi-card-header">
                        <span className="kpi-card-label">Operating Costs</span>
                        <div className="kpi-card-icon kpi-card-icon--red"><Activity size={14} /></div>
                    </div>
                    <div className="kpi-card-value">
                        {totalOperatingCosts.toLocaleString('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 })}
                    </div>
                    <div className="kpi-card-sub">
                        Fuel + Maintenance expenses
                    </div>
                </div>

                <div className="kpi-card kpi-card--amber stagger-item" style={{ animationDelay: '0.15s' }}>
                    <div className="kpi-card-header">
                        <span className="kpi-card-label">Net Profit</span>
                        <div className="kpi-card-icon kpi-card-icon--amber"><TrendingUp size={14} /></div>
                    </div>
                    <div className="kpi-card-value" style={{ color: netProfit >= 0 ? 'var(--status-ok)' : 'var(--status-error)' }}>
                        {netProfit.toLocaleString('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 })}
                    </div>
                    <div className="kpi-card-sub">
                        {netProfit >= 0 ? 'Profit generated' : 'Operating at loss'}
                        {netProfit !== 0 && (
                            <span className={`kpi-card-trend ${netProfit >= 0 ? 'kpi-card-trend--up' : 'kpi-card-trend--down'}`} style={{ marginLeft: 6 }}>
                                {netProfit >= 0 ? <ArrowUpRight size={10} /> : <ArrowDownRight size={10} />}
                                {Math.abs(profitMargin).toFixed(1)}% margin
                            </span>
                        )}
                    </div>
                </div>

                <div className="kpi-card kpi-card--blue stagger-item" style={{ animationDelay: '0.2s' }}>
                    <div className="kpi-card-header">
                        <span className="kpi-card-label">ROI</span>
                        <div className="kpi-card-icon kpi-card-icon--blue"><Percent size={14} /></div>
                    </div>
                    <div className="kpi-card-value" style={{ color: overallStatus.color }}>
                        {roiPercentage.toFixed(1)}%
                    </div>
                    <div className="kpi-card-sub">
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            <StatusIcon size={12} />
                            {overallStatus.label} return rate
                        </span>
                    </div>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 'var(--sp-4)', marginBottom: 'var(--sp-4)' }}>
                <div className="card stagger-item" style={{ animationDelay: '0.25s' }}>
                    <div className="card-header">
                        <h3 className="card-title">Monthly Profitability Trend</h3>
                        <div style={{ display: 'flex', gap: 'var(--sp-3)', fontSize: '0.7rem' }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                <span style={{ width: 10, height: 10, background: 'var(--status-ok)', borderRadius: 2 }}></span>
                                Profit
                            </span>
                            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                <span style={{ width: 10, height: 10, background: 'var(--status-error)', borderRadius: 2 }}></span>
                                Loss
                            </span>
                        </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: `repeat(${months}, 1fr)`, gap: 6, alignItems: 'flex-end', height: 180 }}>
                        {monthlyData.map((m, i) => (
                            <div key={i} style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                <div style={{ flex: 1, display: 'flex', alignItems: 'flex-end', width: '100%', justifyContent: 'center' }}>
                                    <div 
                                        style={{
                                            width: '70%',
                                            height: `${Math.max((Math.abs(m.profit) / maxProfit) * 100, 4)}%`,
                                            background: m.profit >= 0 
                                                ? 'linear-gradient(to top, #3DC97A, rgba(61, 201, 122, 0.4))'
                                                : 'linear-gradient(to top, #E84040, rgba(232, 64, 64, 0.4))',
                                            borderRadius: '4px 4px 0 0',
                                            transition: 'height 0.5s var(--ease)',
                                            minHeight: 4,
                                        }}
                                        title={`${m.fullMonth}: ${m.profit.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}`}
                                    />
                                </div>
                                <div style={{ fontSize: '0.6rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', marginTop: 8 }}>
                                    {m.month}
                                </div>
                                <div style={{ 
                                    fontSize: '0.65rem', 
                                    fontFamily: 'var(--font-mono)', 
                                    color: m.profit >= 0 ? 'var(--status-ok)' : 'var(--status-error)',
                                    fontWeight: 500,
                                }}>
                                    {m.profit >= 0 ? '+' : ''}{(m.profit / 1000).toFixed(1)}k
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="card stagger-item" style={{ animationDelay: '0.3s' }}>
                    <div className="card-header">
                        <h3 className="card-title">Cost Breakdown</h3>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                        {costBreakdown.map((item, i) => {
                            const Icon = item.icon
                            const pct = totalOperatingCosts > 0 
                                ? (item.value / (item.label === 'Net Revenue' ? totalRevenue : totalOperatingCosts)) * 100 
                                : 0
                            return (
                                <div key={i}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                                        <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                                            <Icon size={12} style={{ color: item.color }} />
                                            {item.label}
                                        </span>
                                        <span style={{ fontSize: '0.78rem', fontFamily: 'var(--font-display)', fontWeight: 700, color: item.color }}>
                                            {item.value.toLocaleString('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 })}
                                        </span>
                                    </div>
                                    <div className="progress-bar" style={{ height: 6 }}>
                                        <div style={{
                                            height: '100%',
                                            width: `${pct}%`,
                                            background: item.color,
                                            borderRadius: 3,
                                            transition: 'width 0.5s var(--ease)',
                                        }} />
                                    </div>
                                </div>
                            )
                        })}
                    </div>

                    <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid var(--border-subtle)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Avg Revenue/Vehicle</span>
                            <span style={{ fontSize: '0.8rem', fontFamily: 'var(--font-display)', fontWeight: 700, color: 'var(--status-ok)' }}>
                                {avgRevenuePerVehicle.toLocaleString('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 })}
                            </span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Avg Cost/Vehicle</span>
                            <span style={{ fontSize: '0.8rem', fontFamily: 'var(--font-display)', fontWeight: 700, color: 'var(--status-error)' }}>
                                {avgCostPerVehicle.toLocaleString('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 })}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="card stagger-item" style={{ animationDelay: '0.35s' }}>
                <div className="card-header">
                    <h3 className="card-title">Vehicle ROI Performance</h3>
                    <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                        {filteredVehicles.length} vehicles analyzed
                    </span>
                </div>
                
                {filteredVehicles.length > 0 ? (
                    <div className="data-table-wrap">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Vehicle</th>
                                    <th>Type</th>
                                    <th>Acquisition</th>
                                    <th>Trips</th>
                                    <th>Revenue</th>
                                    <th>Costs</th>
                                    <th>Profit</th>
                                    <th>ROI</th>
                                    <th>Payback</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredVehicles.map((v) => {
                                    const vStatus = getROIStatus(v.roi)
                                    const VIcon = vStatus.icon
                                    return (
                                        <tr key={v.id}>
                                            <td className="cell-primary">
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                    <Truck size={14} style={{ color: 'var(--text-muted)' }} />
                                                    {v.name}
                                                </div>
                                            </td>
                                            <td>{v.type}</td>
                                            <td className="cell-mono">
                                                {v.acquisitionCost > 0 
                                                    ? v.acquisitionCost.toLocaleString('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 })
                                                    : '-'}
                                            </td>
                                            <td className="cell-mono">{v.tripCount}</td>
                                            <td className="cell-mono" style={{ color: 'var(--status-ok)' }}>
                                                {v.revenue.toLocaleString('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 })}
                                            </td>
                                            <td className="cell-mono" style={{ color: 'var(--status-error)' }}>
                                                {v.costs.toLocaleString('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 })}
                                            </td>
                                            <td className="cell-mono" style={{ color: v.profit >= 0 ? 'var(--status-ok)' : 'var(--status-error)', fontWeight: 600 }}>
                                                {v.profit >= 0 ? '+' : ''}{v.profit.toLocaleString('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 })}
                                            </td>
                                            <td>
                                                <span style={{
                                                    display: 'inline-flex',
                                                    alignItems: 'center',
                                                    gap: 4,
                                                    padding: '3px 8px',
                                                    borderRadius: 4,
                                                    fontSize: '0.7rem',
                                                    fontFamily: 'var(--font-mono)',
                                                    fontWeight: 600,
                                                    background: `${vStatus.color}15`,
                                                    color: vStatus.color,
                                                }}>
                                                    <VIcon size={10} />
                                                    {v.roi.toFixed(1)}%
                                                </span>
                                            </td>
                                            <td>
                                                <div style={{ width: 80 }}>
                                                    <div className="progress-bar" style={{ height: 4 }}>
                                                        <div style={{
                                                            width: `${v.paybackProgress}%`,
                                                            height: '100%',
                                                            background: v.paybackProgress >= 100 ? 'var(--status-ok)' : 'var(--status-warn)',
                                                            borderRadius: 2,
                                                        }} />
                                                    </div>
                                                    <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>
                                                        {v.paybackProgress.toFixed(0)}%
                                                    </span>
                                                </div>
                                            </td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div style={{ padding: 'var(--sp-8)', textAlign: 'center', color: 'var(--text-muted)' }}>
                        No vehicle data available for selected filters
                    </div>
                )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--sp-4)', marginTop: 'var(--sp-4)' }}>
                <div className="card stagger-item" style={{ animationDelay: '0.4s' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                        <div style={{
                            width: 40, height: 40,
                            background: 'var(--amber-dim)',
                            borderRadius: 'var(--r-md)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                            <Target size={18} style={{ color: 'var(--amber)' }} />
                        </div>
                        <div>
                            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Total Investment</div>
                            <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                                {totalInvestment.toLocaleString('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 })}
                            </div>
                        </div>
                    </div>
                    <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
                        Total acquisition cost of {activeVehicles.length} active vehicles in your fleet.
                    </p>
                </div>

                <div className="card stagger-item" style={{ animationDelay: '0.45s' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                        <div style={{
                            width: 40, height: 40,
                            background: 'var(--status-ok-dim)',
                            borderRadius: 'var(--r-md)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                            <Calculator size={18} style={{ color: 'var(--status-ok)' }} />
                        </div>
                        <div>
                            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Cost Efficiency</div>
                            <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem', fontWeight: 700, color: 'var(--status-ok)' }}>
                                {(100 - (totalOperatingCosts / totalRevenue * 100 || 0)).toFixed(1)}%
                            </div>
                        </div>
                    </div>
                    <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
                        Percentage of revenue retained after operating expenses.
                    </p>
                </div>

                <div className="card stagger-item" style={{ animationDelay: '0.5s' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                        <div style={{
                            width: 40, height: 40,
                            background: 'var(--status-blue-dim)',
                            borderRadius: 'var(--r-md)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                            <PieChart size={18} style={{ color: 'var(--status-blue)' }} />
                        </div>
                        <div>
                            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Fleet Utilization</div>
                            <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem', fontWeight: 700, color: 'var(--status-blue)' }}>
                                {((completedTrips.length / Math.max(activeVehicles.length, 1)) * 10).toFixed(1)}x
                            </div>
                        </div>
                    </div>
<p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
                        Average trips completed per vehicle in the selected period.
                    </p>
                </div>
            </div>
                </>
            ) : (
                <div>
                    <div className="kpi-grid">
                        <div className="kpi-card kpi-card--teal stagger-item" style={{ animationDelay: '0.05s' }}>
                            <div className="kpi-card-header">
                                <span className="kpi-card-label">Avg Trip Revenue</span>
                                <div className="kpi-card-icon kpi-card-icon--teal"><DollarSign size={14} /></div>
                            </div>
                            <div className="kpi-card-value">
                                {avgTripRevenue.toLocaleString('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 })}
                            </div>
                            <div className="kpi-card-sub">
                                per trip average
                            </div>
                        </div>

                        <div className="kpi-card kpi-card--amber stagger-item" style={{ animationDelay: '0.1s' }}>
                            <div className="kpi-card-header">
                                <span className="kpi-card-label">Avg Trip ROI</span>
                                <div className="kpi-card-icon kpi-card-icon--amber"><Percent size={14} /></div>
                            </div>
                            <div className="kpi-card-value" style={{ color: avgTripROI >= 0 ? 'var(--status-ok)' : 'var(--status-error)' }}>
                                {avgTripROI.toFixed(1)}%
                            </div>
                            <div className="kpi-card-sub">
                                average return per trip
                            </div>
                        </div>

                        <div className="kpi-card kpi-card--blue stagger-item" style={{ animationDelay: '0.15s' }}>
                            <div className="kpi-card-header">
                                <span className="kpi-card-label">Profitable Trips</span>
                                <div className="kpi-card-icon kpi-card-icon--blue"><CheckCircle size={14} /></div>
                            </div>
                            <div className="kpi-card-value" style={{ color: 'var(--status-ok)' }}>
                                {profitableTrips}
                            </div>
                            <div className="kpi-card-sub">
                                of {tripROI.length} completed trips
                                {tripROI.length > 0 ? (
                                    <span className="kpi-card-trend kpi-card-trend--up" style={{ marginLeft: 6 }}>
                                        {((profitableTrips / tripROI.length) * 100).toFixed(0)}%
                                    </span>
                                ) : null}
                            </div>
                        </div>

                        <div className="kpi-card kpi-card--red stagger-item" style={{ animationDelay: '0.2s' }}>
                            <div className="kpi-card-header">
                                <span className="kpi-card-label">Loss Trips</span>
                                <div className="kpi-card-icon kpi-card-icon--red"><XCircle size={14} /></div>
                            </div>
                            <div className="kpi-card-value" style={{ color: lossTrips > 0 ? 'var(--status-error)' : 'var(--status-ok)' }}>
                                {lossTrips}
                            </div>
                            <div className="kpi-card-sub">
                                trips operating at loss
                            </div>
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--sp-4)', marginBottom: 'var(--sp-4)' }}>
                        <div className="card stagger-item" style={{ animationDelay: '0.25s' }}>
                            <div className="card-header">
                                <h3 className="card-title">Top Performing Trips</h3>
                                <Award size={14} style={{ color: 'var(--amber)' }} />
                            </div>
                            <div className="activity-feed">
                                {topTrips.map((t, i) => (
                                    <div key={t.id} className="activity-item" style={{ padding: '10px 0' }}>
                                        <span style={{ 
                                            fontFamily: 'var(--font-display)', 
                                            fontWeight: 700, 
                                            fontSize: '0.8rem', 
                                            color: i === 0 ? 'var(--amber)' : 'var(--text-muted)', 
                                            width: 24 
                                        }}>#{i + 1}</span>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                {t.vehicleName}: {t.origin} → {t.destination}
                                            </div>
                                            <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)', marginTop: 2 }}>
                                                {t.distance > 0 ? `${t.distance} km` : 'N/A'} · {t.revenue.toLocaleString('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 })}
                                            </div>
                                        </div>
                                        <span style={{
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            gap: 3,
                                            padding: '2px 8px',
                                            borderRadius: 4,
                                            fontSize: '0.65rem',
                                            fontFamily: 'var(--font-mono)',
                                            fontWeight: 600,
                                            background: 'var(--status-ok-dim)',
                                            color: 'var(--status-ok)',
                                        }}>
                                            {t.roi.toFixed(0)}%
                                        </span>
                                    </div>
                                ))}
                                {topTrips.length === 0 && (
                                    <div style={{ padding: 16, color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                                        No completed trips yet
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="card stagger-item" style={{ animationDelay: '0.3s' }}>
                            <div className="card-header">
                                <h3 className="card-title">Underperforming Trips</h3>
                                <AlertCircle size={14} style={{ color: 'var(--status-error)' }} />
                            </div>
                            <div className="activity-feed">
                                {worstTrips.map((t, i) => (
                                    <div key={t.id} className="activity-item" style={{ padding: '10px 0' }}>
                                        <span style={{ 
                                            fontFamily: 'var(--font-display)', 
                                            fontWeight: 700, 
                                            fontSize: '0.8rem', 
                                            color: 'var(--status-error)', 
                                            width: 24 
                                        }}>#{i + 1}</span>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                {t.vehicleName}: {t.origin} → {t.destination}
                                            </div>
                                            <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)', marginTop: 2 }}>
                                                {t.distance > 0 ? `${t.distance} km` : 'N/A'} · {t.revenue.toLocaleString('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 })}
                                            </div>
                                        </div>
                                        <span style={{
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            gap: 3,
                                            padding: '2px 8px',
                                            borderRadius: 4,
                                            fontSize: '0.65rem',
                                            fontFamily: 'var(--font-mono)',
                                            fontWeight: 600,
                                            background: t.roi >= 0 ? 'var(--status-warn-dim)' : 'var(--status-error-dim)',
                                            color: t.roi >= 0 ? 'var(--status-warn)' : 'var(--status-error)',
                                        }}>
                                            {t.roi.toFixed(0)}%
                                        </span>
                                    </div>
                                ))}
                                {worstTrips.length === 0 && (
                                    <div style={{ padding: 16, color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                                        No completed trips yet
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="card stagger-item" style={{ animationDelay: '0.35s' }}>
                        <div className="card-header">
                            <h3 className="card-title">Trip-by-Trip ROI Analysis</h3>
                            <div style={{ display: 'flex', gap: 'var(--sp-2)' }}>
                                <select 
                                    className="form-select"
                                    value={tripSortBy}
                                    onChange={(e) => setTripSortBy(e.target.value)}
                                    style={{ minWidth: 100, padding: '4px 8px', fontSize: '0.7rem' }}
                                >
                                    <option value="roi">Sort by ROI</option>
                                    <option value="revenue">Sort by Revenue</option>
                                    <option value="profit">Sort by Profit</option>
                                    <option value="distance">Sort by Distance</option>
                                </select>
                                <button 
                                    className="btn btn-ghost btn-sm"
                                    onClick={() => setTripSortOrder(tripSortOrder === 'desc' ? 'asc' : 'desc')}
                                >
                                    {tripSortOrder === 'desc' ? <TrendingDown size={12} /> : <TrendingUp size={12} />}
                                </button>
                            </div>
                        </div>
                        
                        {filteredTripROI.length > 0 ? (
                            <div className="data-table-wrap">
                                <table className="data-table">
                                    <thead>
                                        <tr>
                                            <th>Trip</th>
                                            <th>Vehicle</th>
                                            <th>Route</th>
                                            <th>Distance</th>
                                            <th>Revenue</th>
                                            <th>Est. Cost</th>
                                            <th>Profit</th>
                                            <th>ROI</th>
                                            <th>Rev/Km</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredTripROI.map((t) => {
                                            const tStatus = getROIStatus(t.roi)
                                            const TIcon = tStatus.icon
                                            return (
                                                <tr key={t.id}>
                                                    <td className="cell-primary">
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                            <Route size={12} style={{ color: 'var(--text-dim)' }} />
                                                            <span style={{ fontSize: '0.7rem' }}>#{String(t.id).slice(0, 6)}</span>
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                                            <Truck size={12} style={{ color: 'var(--text-muted)' }} />
                                                            <span style={{ fontSize: '0.75rem' }}>{t.vehicleName}</span>
                                                        </div>
                                                    </td>
                                                    <td style={{ maxWidth: 150 }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.72rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                            <MapPin size={10} style={{ color: 'var(--status-ok)', flexShrink: 0 }} />
                                                            {t.origin}
                                                            <span style={{ color: 'var(--text-dim)' }}>→</span>
                                                            <MapPin size={10} style={{ color: 'var(--status-blue)', flexShrink: 0 }} />
                                                            {t.destination}
                                                        </div>
                                                    </td>
                                                    <td className="cell-mono">{t.distance > 0 ? `${t.distance} km` : '-'}</td>
                                                    <td className="cell-mono" style={{ color: 'var(--status-ok)' }}>
                                                        {t.revenue.toLocaleString('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 })}
                                                    </td>
                                                    <td className="cell-mono" style={{ color: 'var(--status-error)' }}>
                                                        {t.estimatedCost.toLocaleString('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 })}
                                                    </td>
                                                    <td className="cell-mono" style={{ color: t.profit >= 0 ? 'var(--status-ok)' : 'var(--status-error)', fontWeight: 600 }}>
                                                        {t.profit >= 0 ? '+' : ''}{t.profit.toLocaleString('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 })}
                                                    </td>
                                                    <td>
                                                        <span style={{
                                                            display: 'inline-flex',
                                                            alignItems: 'center',
                                                            gap: 3,
                                                            padding: '2px 6px',
                                                            borderRadius: 4,
                                                            fontSize: '0.65rem',
                                                            fontFamily: 'var(--font-mono)',
                                                            fontWeight: 600,
                                                            background: `${tStatus.color}15`,
                                                            color: tStatus.color,
                                                        }}>
                                                            <TIcon size={10} />
                                                            {t.roi.toFixed(0)}%
                                                        </span>
                                                    </td>
                                                    <td className="cell-mono" style={{ fontSize: '0.7rem' }}>
                                                        {t.revenuePerKm > 0 ? `${t.revenuePerKm.toFixed(1)}/km` : '-'}
                                                    </td>
                                                </tr>
                                            )
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div style={{ padding: 'var(--sp-8)', textAlign: 'center', color: 'var(--text-muted)' }}>
                                No trip data available for selected filters
                            </div>
                        )}
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--sp-4)', marginTop: 'var(--sp-4)' }}>
                        <div className="card stagger-item" style={{ animationDelay: '0.4s' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                                <div style={{
                                    width: 40, height: 40,
                                    background: 'var(--status-ok-dim)',
                                    borderRadius: 'var(--r-md)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                }}>
                                    <TrendingUp size={18} style={{ color: 'var(--status-ok)' }} />
                                </div>
                                <div>
                                    <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Best Trip ROI</div>
                                    <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem', fontWeight: 700, color: 'var(--status-ok)' }}>
                                        {topTrips.length > 0 ? `${topTrips[0].roi.toFixed(0)}%` : 'N/A'}
                                    </div>
                                </div>
                            </div>
                            <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
                                {topTrips.length > 0 ? `${topTrips[0].vehicleName}: ${topTrips[0].origin} → ${topTrips[0].destination}` : 'No trips completed yet'}
                            </p>
                        </div>

                        <div className="card stagger-item" style={{ animationDelay: '0.45s' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                                <div style={{
                                    width: 40, height: 40,
                                    background: 'var(--status-blue-dim)',
                                    borderRadius: 'var(--r-md)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                }}>
                                    <Clock size={18} style={{ color: 'var(--status-blue)' }} />
                                </div>
                                <div>
                                    <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Total Distance</div>
                                    <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem', fontWeight: 700, color: 'var(--status-blue)' }}>
                                        {tripROI.reduce((s, t) => s + t.distance, 0).toLocaleString()} km
                                    </div>
                                </div>
                            </div>
                            <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
                                Total distance covered across all completed trips.
                            </p>
                        </div>

                        <div className="card stagger-item" style={{ animationDelay: '0.5s' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                                <div style={{
                                    width: 40, height: 40,
                                    background: 'var(--amber-dim)',
                                    borderRadius: 'var(--r-md)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                }}>
                                    <Package size={18} style={{ color: 'var(--amber)' }} />
                                </div>
                                <div>
                                    <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Cargo Moved</div>
                                    <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem', fontWeight: 700, color: 'var(--amber)' }}>
                                        {tripROI.reduce((s, t) => s + Number(t.cargo_weight || 0), 0).toLocaleString()} kg
                                    </div>
                                </div>
                            </div>
                            <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
                                Total cargo weight transported in completed trips.
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
