# FleetPulse

**Industrial-grade Fleet Command System**

A modern, production-ready fleet management application built with React and Supabase. Monitor your delivery fleet, track driver compliance, manage expenses, and optimize operational costs—all unified in one precision control center.

![FleetPulse](https://img.shields.io/badge/FleetPulse-v1.0.0-amber)
![React](https://img.shields.io/badge/React-19.2-61DAFB)
![Supabase](https://img.shields.io/badge/Supabase-2.97-3ECF8E)
![License](https://img.shields.io/badge/License-MIT-green)

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Project Structure](#project-structure)
- [Database Schema](#database-schema)
- [Modules Overview](#modules-overview)
- [User Roles & Permissions](#user-roles--permissions)
- [API & State Management](#api--state-management)
- [Design System](#design-system)
- [Contributing](#contributing)
- [License](#license)

---

## Features

### Core Capabilities

- **Vehicle Registry** — Complete fleet inventory with status tracking, odometer readings, and acquisition costs
- **Trip Dispatcher** — Create, dispatch, and track delivery trips with origin/destination routing
- **Driver Profiles** — Manage driver information, license details, safety scores, and compliance
- **Expense Tracking** — Log fuel expenses and operational costs per vehicle
- **Maintenance Logs** — Schedule and track vehicle maintenance with cost analysis
- **Analytics Dashboard** — Real-time KPIs, charts, and fleet performance metrics
- **ROI Analytics** — Comprehensive return on investment analysis for fleet and individual trips

### Advanced Features

- **Role-Based Access Control** — Four distinct user roles with granular permissions
- **Real-time Updates** — Live data synchronization with Supabase
- **Export & Reports** — Generate PDF reports and CSV exports
- **Responsive Design** — Works seamlessly on desktop and tablet devices
- **Dark Theme UI** — Modern, eye-friendly interface with industrial aesthetics

---

## Tech Stack

| Category | Technology |
|----------|------------|
| **Frontend** | React 19, React Router DOM 7 |
| **State Management** | Zustand 5 |
| **Backend & Auth** | Supabase (PostgreSQL, Auth, RLS) |
| **Charts** | Recharts 3 |
| **Icons** | Lucide React |
| **Date Handling** | Day.js |
| **PDF Generation** | jsPDF |
| **CSV Parsing** | PapaParse |
| **Animations** | Framer Motion |
| **Build Tool** | Vite 7 |
| **Styling** | CSS Variables with custom design system |

---

## Getting Started

### Prerequisites

- Node.js 18+ installed
- A Supabase account (free tier works)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd fleetpulse
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up Supabase**
   
   - Create a new project at [supabase.com](https://supabase.com)
   - Go to Project Settings → API and copy your credentials
   - Run the SQL schema from `supabase-schema.sql` in the Supabase SQL Editor

4. **Configure environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` with your Supabase credentials:
   ```env
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

6. **Open in browser**
   ```
   http://localhost:5173
   ```

### Build for Production

```bash
npm run build
npm run preview
```

---

## Project Structure

```
fleetpulse/
├── public/
│   └── vite.svg
├── src/
│   ├── components/
│   │   └── Layout/
│   │       ├── Layout.jsx      # Main app layout wrapper
│   │       ├── Sidebar.jsx     # Navigation sidebar
│   │       └── TopBar.jsx      # Top navigation bar
│   ├── lib/
│   │   └── supabase.js         # Supabase client configuration
│   ├── pages/
│   │   ├── Analytics.jsx       # Analytics dashboard
│   │   ├── Dashboard.jsx       # Command center overview
│   │   ├── DriverProfiles.jsx  # Driver management
│   │   ├── ExpenseTracker.jsx  # Fuel & expense logs
│   │   ├── Login.jsx           # Authentication
│   │   ├── MaintenanceLogs.jsx # Maintenance records
│   │   ├── ROIAnalytics.jsx    # ROI analysis
│   │   ├── SignUp.jsx          # User registration
│   │   ├── TripDispatcher.jsx  # Trip management
│   │   └── VehicleRegistry.jsx # Fleet inventory
│   ├── stores/
│   │   ├── authStore.js        # Authentication state
│   │   ├── driverStore.js      # Driver data
│   │   ├── expenseStore.js     # Expense records
│   │   ├── maintenanceStore.js # Maintenance logs
│   │   ├── notificationStore.js# Notifications
│   │   ├── tripStore.js        # Trip management
│   │   └── vehicleStore.js     # Vehicle inventory
│   ├── App.jsx                 # Main app component with routing
│   ├── main.jsx                # App entry point
│   └── index.css               # Global styles & design tokens
├── .env.example
├── index.html
├── package.json
├── supabase-schema.sql
└── vite.config.js
```

---

## Database Schema

### Tables

| Table | Description |
|-------|-------------|
| `profiles` | User profiles with role assignments |
| `vehicles` | Fleet vehicle inventory |
| `drivers` | Driver information and compliance |
| `trips` | Delivery trip records |
| `expenses` | Fuel and operational expenses |
| `maintenance_logs` | Vehicle maintenance records |
| `notifications` | User notifications |

### Relationships

```
profiles (auth.users)
    ↓
vehicles ←→ trips ←→ drivers
    ↓          ↓
expenses   maintenance_logs
```

### Entity Details

#### Vehicles
```sql
- id: uuid (primary key)
- name: text
- model: text
- license_plate: text
- type: text (Truck, Van, Bike)
- max_capacity: integer
- odometer: integer
- status: text (Available, On Trip, In Shop, Retired)
- region: text
- acquisition_cost: numeric
```

#### Trips
```sql
- id: uuid (primary key)
- vehicle_id: uuid (foreign key)
- driver_id: uuid (foreign key)
- origin: text
- destination: text
- cargo_weight: integer
- start_odometer: integer
- end_odometer: integer
- revenue: numeric
- status: text (Draft, Dispatched, Completed, Cancelled)
```

#### Drivers
```sql
- id: uuid (primary key)
- name: text
- license_number: text
- license_expiry: date
- license_category: text (Truck, Van, Bike)
- phone: text
- status: text (On Duty, Off Duty, Suspended)
- safety_score: integer
- trips_completed: integer
```

---

## Modules Overview

### 1. Command Center (Dashboard)
- Fleet status overview with KPI cards
- Active trips and pending dispatches
- Vehicle utilization rate
- Recent activity feed
- Quick action shortcuts

### 2. Vehicle Registry
- Complete fleet inventory management
- Add, edit, and retire vehicles
- Track odometer readings
- Monitor vehicle status (Available, On Trip, In Shop, Retired)
- Acquisition cost tracking for ROI

### 3. Trip Dispatcher
- Create new delivery trips
- Assign vehicles and drivers
- Set origin/destination routes
- Track cargo weight and revenue
- Dispatch, complete, or cancel trips
- Trip lifecycle management

### 4. Driver Profiles
- Driver information management
- License tracking with expiry alerts
- Safety score monitoring
- Trip history per driver
- Status management (On Duty, Off Duty, Suspended)

### 5. Maintenance Logs
- Schedule vehicle maintenance
- Track service types and costs
- Maintenance status workflow
- Cost analysis per vehicle

### 6. Expenses & Fuel
- Log fuel expenses per vehicle
- Track liters and costs
- Odometer-based tracking
- Export to CSV

### 7. Analytics
- Fleet performance charts
- Revenue vs costs visualization
- Monthly trends analysis
- Driver performance metrics
- Vehicle utilization statistics

### 8. ROI Analytics

#### Fleet ROI Tab
- Total revenue vs operating costs
- Net profit calculations
- Monthly profitability trends
- Vehicle-by-vehicle ROI breakdown
- Payback progress tracking
- Cost efficiency metrics

#### Trip ROI Tab
- Trip-by-trip profitability analysis
- Top performing trips
- Underperforming trips identification
- Revenue per kilometer metrics
- Cargo weight analysis
- Average trip ROI calculations

---

## User Roles & Permissions

| Role | Dashboard | Vehicles | Trips | Drivers | Maintenance | Expenses | Analytics | ROI |
|------|:---------:|:--------:|:-----:|:-------:|:-----------:|:--------:|:---------:|:---:|
| **Fleet Manager** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Dispatcher** | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Safety Officer** | ✅ | ❌ | ❌ | ✅ | ❌ | ❌ | ✅ | ❌ |
| **Financial Analyst** | ✅ | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ | ✅ |

### Role Descriptions

- **Fleet Manager** — Full access to all modules. Can manage vehicles, dispatch trips, oversee drivers, and view complete analytics.

- **Dispatcher** — Focus on operations. Can view vehicles, create and dispatch trips, and manage driver assignments.

- **Safety Officer** — Focus on compliance. Can monitor driver profiles, safety scores, and view analytics for safety insights.

- **Financial Analyst** — Focus on costs. Can track expenses, maintenance costs, and access ROI analytics for financial planning.

---

## API & State Management

### Zustand Stores

The application uses Zustand for global state management with the following stores:

```javascript
// Vehicle Store Example
useVehicleStore = {
  vehicles: [],
  loading: false,
  error: null,
  
  // Actions
  fetch: async () => {...},
  addVehicle: async (vehicle) => {...},
  updateVehicle: async (id, updates) => {...},
  setStatus: async (id, status) => {...},
  
  // Computed Getters
  getAvailableVehicles: () => [...],
  getVehicleById: (id) => {...},
  getActiveCount: () => number,
  getUtilizationRate: () => number,
}
```

### Available Stores

| Store | Purpose |
|-------|---------|
| `authStore` | User authentication, login, signup, session |
| `vehicleStore` | Vehicle CRUD, status management |
| `driverStore` | Driver profiles, safety scores |
| `tripStore` | Trip lifecycle, dispatching |
| `expenseStore` | Fuel and expense logging |
| `maintenanceStore` | Maintenance records |
| `notificationStore` | User notifications |

### Supabase Integration

- **Authentication** — Supabase Auth with email/password
- **Database** — PostgreSQL with Row Level Security (RLS)
- **Real-time** — Optional real-time subscriptions available

---

## Design System

### Color Palette

| Token | Value | Usage |
|-------|-------|-------|
| `--bg-base` | `#0D0D0B` | Primary background |
| `--bg-elevated` | `#141412` | Card backgrounds |
| `--amber` | `#E8A020` | Primary accent |
| `--status-ok` | `#3DC97A` | Success states |
| `--status-error` | `#E84040` | Error states |
| `--status-warn` | `#E8A020` | Warning states |
| `--status-blue` | `#4A90D9` | Info states |

### Typography

- **Display Font** — Syne (headings)
- **Body Font** — DM Sans
- **Mono Font** — DM Mono (data, code)

### Spacing Scale

| Token | Value |
|-------|-------|
| `--sp-1` | 4px |
| `--sp-2` | 8px |
| `--sp-3` | 12px |
| `--sp-4` | 16px |
| `--sp-5` | 20px |
| `--sp-6` | 24px |

---

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |
| `npm run lint` | Run ESLint |

---

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Follow existing code style and conventions
- Write meaningful commit messages
- Test all user roles before submitting PR
- Update documentation for new features

---

## License

This project is licensed under the MIT License.

---

## Acknowledgments

- Built for the Odoo Hackathon 2026
- Powered by Supabase
- Icons by Lucide
- Charts by Recharts

---

**FleetPulse** — *Industrial-grade fleet command for modern logistics.*
