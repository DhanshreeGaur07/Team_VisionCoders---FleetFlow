import { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { Search, Bell, X } from 'lucide-react'
import useNotificationStore from '../../stores/notificationStore'
import useAuthStore from '../../stores/authStore'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'

dayjs.extend(relativeTime)

const pageTitles = {
    '/':            'Command Center',
    '/vehicles':    'Vehicle Registry',
    '/trips':       'Trip Dispatcher',
    '/maintenance': 'Maintenance Logs',
    '/expenses':    'Expenses & Fuel',
    '/drivers':     'Driver Profiles',
    '/analytics':   'Analytics',
    '/roi':         'ROI Analytics',
}

export default function TopBar() {
    const location = useLocation()
    const title = pageTitles[location.pathname] || 'FleetPulse'
    const user = useAuthStore((s) => s.user)
    const { notifications, getUnreadCount, markAsRead, markAllRead, fetch: fetchNotifications } = useNotificationStore()
    const unreadCount = getUnreadCount()
    const [showNotifications, setShowNotifications] = useState(false)

    useEffect(() => {
        if (user?.id) {
            fetchNotifications(user.id)
        }
    }, [user?.id])

    const notifDotColor = (type) => {
        if (type === 'critical') return 'var(--status-error)'
        if (type === 'warning')  return 'var(--status-warn)'
        return 'var(--status-ok)'
    }

    return (
        <header className="topbar">
            <div className="topbar-left">
                {/* Subtle route indicator */}
                <span style={{
                    fontSize: '0.6rem',
                    color: 'var(--text-dim)',
                    fontFamily: 'var(--font-mono)',
                    letterSpacing: '0.12em',
                    textTransform: 'uppercase',
                }}>
                    FP /
                </span>
                <span className="topbar-breadcrumb">{title}</span>
            </div>

            <div className="topbar-right">
                <div className="topbar-search">
                    <Search size={13} style={{ flexShrink: 0 }} />
                    <input type="text" placeholder="Search fleet..." />
                    <kbd>⌘K</kbd>
                </div>

                {/* Notifications */}
                <div style={{ position: 'relative' }}>
                    <button
                        className="topbar-btn"
                        onClick={() => setShowNotifications(!showNotifications)}
                    >
                        <Bell size={15} />
                        {unreadCount > 0 && (
                            <span className="topbar-badge">{unreadCount}</span>
                        )}
                    </button>

                    {showNotifications && (
                        <div style={{
                            position: 'absolute',
                            top: 'calc(100% + 8px)',
                            right: 0,
                            width: 360,
                            background: 'var(--bg-surface)',
                            border: '1px solid var(--border-default)',
                            borderRadius: 'var(--r-xl)',
                            boxShadow: 'var(--shadow-lg)',
                            zIndex: 200,
                            maxHeight: 420,
                            overflow: 'hidden',
                            display: 'flex',
                            flexDirection: 'column',
                            animation: 'modalIn 0.2s var(--ease) both',
                        }}>
                            {/* Header */}
                            <div style={{
                                padding: '14px 18px',
                                borderBottom: '1px solid var(--border-subtle)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                flexShrink: 0,
                            }}>
                                <span style={{
                                    fontFamily: 'var(--font-display)',
                                    fontWeight: 700,
                                    fontSize: '0.8rem',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.06em',
                                    color: 'var(--text-primary)',
                                }}>
                                    Notifications
                                    {unreadCount > 0 && (
                                        <span style={{
                                            marginLeft: 8,
                                            background: 'var(--status-error)',
                                            color: 'white',
                                            fontSize: '0.55rem',
                                            fontFamily: 'var(--font-mono)',
                                            padding: '1px 6px',
                                            borderRadius: 20,
                                            verticalAlign: 'middle',
                                        }}>{unreadCount}</span>
                                    )}
                                </span>
                                <div style={{ display: 'flex', gap: 6 }}>
                                    {unreadCount > 0 && (
                                        <button className="btn btn-ghost btn-sm" onClick={() => markAllRead(user?.id)}>
                                            Mark all read
                                        </button>
                                    )}
                                    <button className="btn btn-ghost btn-sm" onClick={() => setShowNotifications(false)}>
                                        <X size={13} />
                                    </button>
                                </div>
                            </div>

                            {/* Notifications list */}
                            <div style={{ overflowY: 'auto' }}>
                                {notifications.length === 0 && (
                                    <div style={{
                                        padding: '24px 18px',
                                        textAlign: 'center',
                                        color: 'var(--text-muted)',
                                        fontSize: '0.75rem',
                                    }}>
                                        No notifications yet
                                    </div>
                                )}
                                {notifications.map((n) => (
                                    <div
                                        key={n.id}
                                        onClick={() => markAsRead(n.id)}
                                        style={{
                                            padding: '12px 18px',
                                            borderBottom: '1px solid var(--border-subtle)',
                                            cursor: 'pointer',
                                            background: n.read ? 'transparent' : 'var(--amber-subtle)',
                                            transition: 'background 120ms',
                                            display: 'flex',
                                            gap: 12,
                                            alignItems: 'flex-start',
                                        }}
                                    >
                                        <div style={{
                                            width: 5, height: 5, borderRadius: '50%',
                                            background: notifDotColor(n.type),
                                            marginTop: 6, flexShrink: 0,
                                        }} />
                                        <div style={{ flex: 1 }}>
                                            <div style={{
                                                fontSize: '0.74rem',
                                                color: 'var(--text-secondary)',
                                                lineHeight: 1.5,
                                            }}>{n.message}</div>
                                            <div style={{
                                                fontSize: '0.62rem',
                                                color: 'var(--text-muted)',
                                                marginTop: 4,
                                                fontFamily: 'var(--font-mono)',
                                            }}>{dayjs(n.created_at).fromNow()}</div>
                                        </div>
                                        {!n.read && (
                                            <div style={{
                                                width: 6, height: 6, borderRadius: '50%',
                                                background: 'var(--amber)',
                                                marginTop: 5, flexShrink: 0,
                                            }} />
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </header>
    )
}
