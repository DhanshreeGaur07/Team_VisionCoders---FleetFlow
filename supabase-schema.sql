-- ═══════════════════════════════════════════════════
-- FLEETPULSE — SUPABASE DATABASE SCHEMA
-- Run this in Supabase SQL Editor (Dashboard > SQL)
-- ═══════════════════════════════════════════════════

-- 1. Profiles table (extends auth.users with role)
create table if not exists public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  email text not null,
  full_name text not null default '',
  role text not null check (role in ('Fleet Manager','Dispatcher','Safety Officer','Financial Analyst')),
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Users can read own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Allow insert during signup (service role or trigger)
create policy "Allow insert for authenticated"
  on public.profiles for insert
  with check (auth.uid() = id);

-- All authenticated users can read all profiles (needed for role lookups)
create policy "Authenticated can read all profiles"
  on public.profiles for select
  using (auth.role() = 'authenticated');

-- 2. Vehicles
create table if not exists public.vehicles (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  model text not null default '',
  license_plate text not null,
  type text not null check (type in ('Truck','Van','Bike')),
  max_capacity integer not null default 0,
  odometer integer not null default 0,
  status text not null default 'Available' check (status in ('Available','On Trip','In Shop','Retired')),
  region text not null default 'West',
  acquisition_cost numeric not null default 0,
  date_added date not null default current_date,
  created_at timestamptz not null default now()
);

alter table public.vehicles enable row level security;

create policy "Authenticated can read vehicles"
  on public.vehicles for select
  using (auth.role() = 'authenticated');

create policy "Authenticated can insert vehicles"
  on public.vehicles for insert
  with check (auth.role() = 'authenticated');

create policy "Authenticated can update vehicles"
  on public.vehicles for update
  using (auth.role() = 'authenticated');

-- 3. Drivers
create table if not exists public.drivers (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  license_number text not null,
  license_expiry date not null,
  license_category text not null check (license_category in ('Truck','Van','Bike')),
  phone text not null default '',
  status text not null default 'On Duty' check (status in ('On Duty','Off Duty','Suspended')),
  safety_score integer not null default 100,
  trips_completed integer not null default 0,
  created_at timestamptz not null default now()
);

alter table public.drivers enable row level security;

create policy "Authenticated can read drivers"
  on public.drivers for select
  using (auth.role() = 'authenticated');

create policy "Authenticated can insert drivers"
  on public.drivers for insert
  with check (auth.role() = 'authenticated');

create policy "Authenticated can update drivers"
  on public.drivers for update
  using (auth.role() = 'authenticated');

-- 4. Trips
create table if not exists public.trips (
  id uuid default gen_random_uuid() primary key,
  vehicle_id uuid references public.vehicles(id) on delete set null,
  driver_id uuid references public.drivers(id) on delete set null,
  origin text not null,
  destination text not null,
  cargo_weight integer not null default 0,
  start_odometer integer not null default 0,
  end_odometer integer,
  revenue numeric not null default 0,
  status text not null default 'Draft' check (status in ('Draft','Dispatched','Completed','Cancelled')),
  created_at timestamptz not null default now(),
  dispatched_at timestamptz,
  completed_at timestamptz
);

alter table public.trips enable row level security;

create policy "Authenticated can read trips"
  on public.trips for select
  using (auth.role() = 'authenticated');

create policy "Authenticated can insert trips"
  on public.trips for insert
  with check (auth.role() = 'authenticated');

create policy "Authenticated can update trips"
  on public.trips for update
  using (auth.role() = 'authenticated');

-- 5. Maintenance Logs
create table if not exists public.maintenance_logs (
  id uuid default gen_random_uuid() primary key,
  vehicle_id uuid references public.vehicles(id) on delete set null,
  service_type text not null,
  cost numeric not null default 0,
  date date not null default current_date,
  notes text default '',
  status text not null default 'Open' check (status in ('Open','Completed')),
  created_at timestamptz not null default now()
);

alter table public.maintenance_logs enable row level security;

create policy "Authenticated can read maintenance_logs"
  on public.maintenance_logs for select
  using (auth.role() = 'authenticated');

create policy "Authenticated can insert maintenance_logs"
  on public.maintenance_logs for insert
  with check (auth.role() = 'authenticated');

create policy "Authenticated can update maintenance_logs"
  on public.maintenance_logs for update
  using (auth.role() = 'authenticated');

-- 6. Expenses (fuel logs)
create table if not exists public.expenses (
  id uuid default gen_random_uuid() primary key,
  vehicle_id uuid references public.vehicles(id) on delete set null,
  type text not null default 'fuel',
  liters numeric not null default 0,
  cost numeric not null default 0,
  odometer integer not null default 0,
  date date not null default current_date,
  created_at timestamptz not null default now()
);

alter table public.expenses enable row level security;

create policy "Authenticated can read expenses"
  on public.expenses for select
  using (auth.role() = 'authenticated');

create policy "Authenticated can insert expenses"
  on public.expenses for insert
  with check (auth.role() = 'authenticated');

create policy "Authenticated can update expenses"
  on public.expenses for update
  using (auth.role() = 'authenticated');

-- 7. Notifications
create table if not exists public.notifications (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade,
  type text not null default 'info' check (type in ('info','warning','critical')),
  message text not null,
  read boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.notifications enable row level security;

create policy "Users can read own notifications"
  on public.notifications for select
  using (auth.uid() = user_id);

create policy "Authenticated can insert notifications"
  on public.notifications for insert
  with check (auth.role() = 'authenticated');

create policy "Users can update own notifications"
  on public.notifications for update
  using (auth.uid() = user_id);

-- ═══════════════════════════════════════════════════
-- TRIGGER: Auto-create profile on signup
-- ═══════════════════════════════════════════════════

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    coalesce(new.raw_user_meta_data ->> 'role', 'Dispatcher')
  );
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
