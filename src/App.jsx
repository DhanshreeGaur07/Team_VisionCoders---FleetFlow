import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import useAuthStore from './stores/authStore'
import { isSupabaseConfigured } from './lib/supabase'
import Layout from './components/Layout/Layout'
import Login from './pages/Login'
import SignUp from './pages/SignUp'
import Dashboard from './pages/Dashboard'
import VehicleRegistry from './pages/VehicleRegistry'
import TripDispatcher from './pages/TripDispatcher'
import MaintenanceLogs from './pages/MaintenanceLogs'
import ExpenseTracker from './pages/ExpenseTracker'
import DriverProfiles from './pages/DriverProfiles'
import Analytics from './pages/Analytics'
import ROIAnalytics from './pages/ROIAnalytics'

const roleRoutes = {
  'Fleet Manager': ['/', '/vehicles', '/trips', '/maintenance', '/expenses', '/drivers', '/analytics', '/roi'],
  'Dispatcher': ['/', '/vehicles', '/trips', '/drivers'],
  'Safety Officer': ['/', '/drivers', '/analytics'],
  'Financial Analyst': ['/', '/expenses', '/maintenance', '/analytics', '/roi'],
}

function ProtectedRoute({ children }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const loading = useAuthStore((s) => s.loading)
  if (loading) return null
  if (!isAuthenticated) return <Navigate to="/login" replace />
  return children
}

function RoleGate({ path, children }) {
  const role = useAuthStore((s) => s.role)
  const allowed = roleRoutes[role] || roleRoutes['Fleet Manager']
  if (!allowed.includes(path)) {
    return <Navigate to="/" replace />
  }
  return children
}

function ConfigError() {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#0D0D0B',
      padding: 24,
    }}>
      <div style={{
        maxWidth: 520,
        background: '#141412',
        border: '1px solid rgba(240,235,224,0.08)',
        borderRadius: 12,
        padding: 32,
      }}>
        <div style={{
          width: 48, height: 48,
          background: '#E8A020',
          borderRadius: 6,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          marginBottom: 20,
        }}>
          <svg viewBox="0 0 16 16" fill="#0D0D0B" width={24} height={24}>
            <path d="M2 3h7l3 4-3 4H2l3-4-3-4z"/>
          </svg>
        </div>
        <h1 style={{
          fontFamily: 'Syne, sans-serif',
          fontWeight: 700,
          fontSize: '1.4rem',
          color: '#F0EBE0',
          margin: 0,
          marginBottom: 8,
        }}>
          Supabase Not Configured
        </h1>
        <p style={{
          color: '#6B6455',
          fontSize: '0.9rem',
          lineHeight: 1.6,
          margin: 0,
          marginBottom: 20,
        }}>
          FleetPulse requires Supabase for authentication and data storage.
          Create a free project at <a href="https://supabase.com" target="_blank" rel="noopener" style={{ color: '#E8A020' }}>supabase.com</a>,
          then add your credentials.
        </p>
        <div style={{
          background: '#0D0D0B',
          borderRadius: 8,
          padding: 16,
          marginBottom: 20,
        }}>
          <div style={{
            fontFamily: '"DM Mono", monospace',
            fontSize: '0.7rem',
            color: '#6B6455',
            marginBottom: 8,
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
          }}>
            1. Copy .env.example to .env
          </div>
          <code style={{
            display: 'block',
            fontFamily: '"DM Mono", monospace',
            fontSize: '0.8rem',
            color: '#A09880',
            background: '#141412',
            padding: '8px 12px',
            borderRadius: 4,
          }}>
            cp .env.example .env
          </code>
        </div>
        <div style={{
          background: '#0D0D0B',
          borderRadius: 8,
          padding: 16,
          marginBottom: 20,
        }}>
          <div style={{
            fontFamily: '"DM Mono", monospace',
            fontSize: '0.7rem',
            color: '#6B6455',
            marginBottom: 8,
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
          }}>
            2. Add your Supabase credentials to .env
          </div>
          <code style={{
            display: 'block',
            fontFamily: '"DM Mono", monospace',
            fontSize: '0.75rem',
            color: '#A09880',
            background: '#141412',
            padding: '8px 12px',
            borderRadius: 4,
            lineHeight: 1.8,
            whiteSpace: 'pre-wrap',
          }}>{`VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key`}</code>
        </div>
        <div style={{
          background: '#0D0D0B',
          borderRadius: 8,
          padding: 16,
        }}>
          <div style={{
            fontFamily: '"DM Mono", monospace',
            fontSize: '0.7rem',
            color: '#6B6455',
            marginBottom: 8,
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
          }}>
            3. Run the SQL schema in Supabase
          </div>
          <div style={{
            fontSize: '0.8rem',
            color: '#A09880',
          }}>
            Open <code style={{ background: '#141412', padding: '2px 6px', borderRadius: 3 }}>supabase-schema.sql</code> and execute it in the Supabase SQL Editor.
          </div>
        </div>
        <div style={{
          marginTop: 24,
          paddingTop: 20,
          borderTop: '1px solid rgba(240,235,224,0.06)',
          fontSize: '0.75rem',
          color: '#4A4639',
        }}>
          Restart the dev server after creating .env: <code style={{ background: '#141412', padding: '2px 6px', borderRadius: 3 }}>npm run dev</code>
        </div>
      </div>
    </div>
  )
}

function AppLoader({ children }) {
  const loading = useAuthStore((s) => s.loading)

  if (loading) {
    return (
      <div style={{
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg-base)',
        flexDirection: 'column',
        gap: 16,
      }}>
        <div style={{
          width: 36, height: 36,
          background: 'var(--amber)',
          borderRadius: 'var(--r-sm)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          animation: 'pulse 1.5s ease infinite',
        }}>
          <svg viewBox="0 0 16 16" fill="var(--bg-base)" width={18} height={18}>
            <path d="M2 3h7l3 4-3 4H2l3-4-3-4z"/>
          </svg>
        </div>
        <div style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '0.7rem',
          color: 'var(--text-muted)',
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
        }}>
          Initializing FleetPulse...
        </div>
      </div>
    )
  }

  return children
}

function App() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)

  useEffect(() => {
    if (isSupabaseConfigured) {
      useAuthStore.getState().initialize()
    }
  }, [])

  if (!isSupabaseConfigured) {
    return <ConfigError />
  }

  return (
    <BrowserRouter>
      <AppLoader>
        <Routes>
          <Route
            path="/login"
            element={isAuthenticated ? <Navigate to="/" replace /> : <Login />}
          />
          <Route
            path="/signup"
            element={isAuthenticated ? <Navigate to="/" replace /> : <SignUp />}
          />
          <Route
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route path="/" element={<Dashboard />} />
            <Route path="/vehicles" element={<VehicleRegistry />} />
            <Route path="/trips" element={<TripDispatcher />} />
            <Route path="/maintenance" element={<MaintenanceLogs />} />
            <Route path="/expenses" element={<ExpenseTracker />} />
            <Route path="/drivers" element={<DriverProfiles />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/roi" element={<ROIAnalytics />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AppLoader>
    </BrowserRouter>
  )
}

export default App
