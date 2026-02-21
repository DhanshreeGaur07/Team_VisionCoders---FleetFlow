import { NavLink } from 'react-router-dom'
import {
    LayoutDashboard,
    Truck,
    Route,
    Wrench,
    Receipt,
    Users,
    BarChart3,
    LogOut,
    Percent,
} from 'lucide-react'
import useAuthStore from '../../stores/authStore'

const allNavItems = [
    { label: 'Operations', type: 'section' },
    { to: '/', icon: LayoutDashboard, label: 'Command Center' },
    { to: '/vehicles', icon: Truck, label: 'Vehicle Registry' },
    { to: '/trips', icon: Route, label: 'Trip Dispatcher' },
    { label: 'Logistics', type: 'section' },
    { to: '/maintenance', icon: Wrench, label: 'Maintenance' },
    { to: '/expenses', icon: Receipt, label: 'Expenses & Fuel' },
    { label: 'Intelligence', type: 'section' },
    { to: '/drivers', icon: Users, label: 'Driver Profiles' },
    { to: '/analytics', icon: BarChart3, label: 'Analytics' },
    { to: '/roi', icon: Percent, label: 'ROI Analytics' },
]

const roleRoutes = {
    'Fleet Manager': ['/', '/vehicles', '/trips', '/maintenance', '/expenses', '/drivers', '/analytics', '/roi'],
    'Dispatcher': ['/', '/vehicles', '/trips', '/drivers'],
    'Safety Officer': ['/', '/drivers', '/analytics'],
    'Financial Analyst': ['/', '/expenses', '/maintenance', '/analytics', '/roi'],
}

function getFilteredNavItems(role) {
    const allowed = roleRoutes[role] || roleRoutes['Fleet Manager']

    // Filter link items, then clean up section headers that have no items after them
    const filtered = []
    let lastSection = null

    for (const item of allNavItems) {
        if (item.type === 'section') {
            lastSection = item
            continue
        }
        if (allowed.includes(item.to)) {
            // If there's a pending section header, add it first
            if (lastSection) {
                filtered.push(lastSection)
                lastSection = null
            }
            filtered.push(item)
        }
    }

    return filtered
}

export default function Sidebar() {
    const { profile, role, logout } = useAuthStore()
    const navItems = getFilteredNavItems(role)

    const displayName = profile?.full_name || 'Operator'
    const initials = displayName
        .split(' ')
        .map((w) => w[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)

    return (
        <aside className="sidebar">
            {/* Brand */}
            <div className="sidebar-brand">
                <div className="sidebar-brand-icon">
                    <svg viewBox="0 0 16 16" fill="currentColor">
                        <path d="M2 3h7l3 4-3 4H2l3-4-3-4z" opacity="0.9"/>
                    </svg>
                </div>
                <div className="sidebar-brand-text">
                    <h1>FleetPulse</h1>
                    <span>Command System</span>
                </div>
            </div>

            {/* Navigation */}
            <nav className="sidebar-nav">
                {navItems.map((item, i) => {
                    if (item.type === 'section') {
                        return <div key={`section-${i}`} className="sidebar-section-label">{item.label}</div>
                    }
                    const Icon = item.icon
                    return (
                        <NavLink
                            key={item.to}
                            to={item.to}
                            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
                            end={item.to === '/'}
                        >
                            <Icon size={15} />
                            {item.label}
                        </NavLink>
                    )
                })}
            </nav>

            {/* User footer */}
            <div className="sidebar-footer">
                <div className="sidebar-user" onClick={logout} title="Sign out">
                    <div className="sidebar-avatar">{initials}</div>
                    <div className="sidebar-user-info">
                        <div className="sidebar-user-name">{displayName}</div>
                        <div className="sidebar-user-role">{role || 'Unknown'}</div>
                    </div>
                    <LogOut size={13} style={{ color: 'var(--text-dim)', flexShrink: 0 }} />
                </div>
            </div>
        </aside>
    )
}
