import { create } from 'zustand'
import { supabase } from '../lib/supabase'
import dayjs from 'dayjs'

const useDriverStore = create((set, get) => ({
  drivers: [],
  loading: false,
  error: null,

  fetch: async () => {
    if (!supabase) return
    set({ loading: true, error: null })
    const { data, error } = await supabase
      .from('drivers')
      .select('*')
      .order('created_at', { ascending: false })
    if (error) { set({ loading: false, error: error.message }); return }
    set({ drivers: data || [], loading: false })
  },

  addDriver: async (driver) => {
    if (!supabase) return
    const { data, error } = await supabase
      .from('drivers')
      .insert({
        name: driver.name,
        license_number: driver.licenseNumber,
        license_expiry: driver.licenseExpiry,
        license_category: driver.licenseCategory,
        phone: driver.phone,
        status: driver.status || 'On Duty',
        safety_score: driver.safetyScore ?? 100,
        trips_completed: 0,
      })
      .select()
      .single()
    if (error) { console.error('addDriver error:', error); return }
    set((s) => ({ drivers: [data, ...s.drivers] }))
  },

  updateDriver: async (id, updates) => {
    if (!supabase) return
    const mapped = {}
    if (updates.name !== undefined) mapped.name = updates.name
    if (updates.licenseNumber !== undefined) mapped.license_number = updates.licenseNumber
    if (updates.licenseExpiry !== undefined) mapped.license_expiry = updates.licenseExpiry
    if (updates.licenseCategory !== undefined) mapped.license_category = updates.licenseCategory
    if (updates.phone !== undefined) mapped.phone = updates.phone
    if (updates.status !== undefined) mapped.status = updates.status
    if (updates.safetyScore !== undefined) mapped.safety_score = updates.safetyScore
    if (updates.tripsCompleted !== undefined) mapped.trips_completed = updates.tripsCompleted

    const { error } = await supabase.from('drivers').update(mapped).eq('id', id)
    if (error) { console.error('updateDriver error:', error); return }
    set((s) => ({
      drivers: s.drivers.map((d) => d.id === id ? { ...d, ...mapped } : d),
    }))
  },

  setStatus: async (id, status) => {
    if (!supabase) return
    const { error } = await supabase.from('drivers').update({ status }).eq('id', id)
    if (error) { console.error('setDriverStatus error:', error); return }
    set((s) => ({
      drivers: s.drivers.map((d) => d.id === id ? { ...d, status } : d),
    }))
  },

  incrementTrips: async (id) => {
    if (!supabase) return
    const driver = get().drivers.find((d) => d.id === id)
    if (!driver) return
    const newCount = (driver.trips_completed || 0) + 1
    const { error } = await supabase.from('drivers').update({ trips_completed: newCount }).eq('id', id)
    if (error) { console.error('incrementTrips error:', error); return }
    set((s) => ({
      drivers: s.drivers.map((d) => d.id === id ? { ...d, trips_completed: newCount } : d),
    }))
  },

  // Computed getters
  getAvailableDrivers: () => {
    return get().drivers.filter((d) => {
      if (d.status !== 'On Duty') return false
      if (dayjs(d.license_expiry).isBefore(dayjs())) return false
      return true
    })
  },
  getDriverById: (id) => get().drivers.find((d) => d.id === id),
  isLicenseExpired: (id) => {
    const d = get().drivers.find((dr) => dr.id === id)
    return d ? dayjs(d.license_expiry).isBefore(dayjs()) : false
  },
  isLicenseExpiringSoon: (id) => {
    const d = get().drivers.find((dr) => dr.id === id)
    if (!d) return false
    const left = dayjs(d.license_expiry).diff(dayjs(), 'day')
    return left > 0 && left <= 30
  },
  getLicenseDaysLeft: (id) => {
    const d = get().drivers.find((dr) => dr.id === id)
    return d ? dayjs(d.license_expiry).diff(dayjs(), 'day') : 0
  },
}))

export default useDriverStore
