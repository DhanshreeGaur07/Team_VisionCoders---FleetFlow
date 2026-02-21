import { create } from 'zustand'
import { supabase } from '../lib/supabase'

const useVehicleStore = create((set, get) => ({
  vehicles: [],
  loading: false,
  error: null,

  fetch: async () => {
    if (!supabase) return
    set({ loading: true, error: null })
    const { data, error } = await supabase
      .from('vehicles')
      .select('*')
      .order('created_at', { ascending: false })
    if (error) { set({ loading: false, error: error.message }); return }
    set({ vehicles: data || [], loading: false })
  },

  addVehicle: async (vehicle) => {
    if (!supabase) return
    const { data, error } = await supabase
      .from('vehicles')
      .insert({
        name: vehicle.name,
        model: vehicle.model,
        license_plate: vehicle.licensePlate,
        type: vehicle.type,
        max_capacity: vehicle.maxCapacity,
        odometer: vehicle.odometer,
        region: vehicle.region,
        acquisition_cost: vehicle.acquisitionCost || 0,
        status: vehicle.status || 'Available',
      })
      .select()
      .single()
    if (error) { console.error('addVehicle error:', error); return }
    set((s) => ({ vehicles: [data, ...s.vehicles] }))
  },

  updateVehicle: async (id, updates) => {
    if (!supabase) return
    const mapped = {}
    if (updates.name !== undefined) mapped.name = updates.name
    if (updates.model !== undefined) mapped.model = updates.model
    if (updates.licensePlate !== undefined) mapped.license_plate = updates.licensePlate
    if (updates.type !== undefined) mapped.type = updates.type
    if (updates.maxCapacity !== undefined) mapped.max_capacity = updates.maxCapacity
    if (updates.odometer !== undefined) mapped.odometer = updates.odometer
    if (updates.region !== undefined) mapped.region = updates.region
    if (updates.acquisitionCost !== undefined) mapped.acquisition_cost = updates.acquisitionCost
    if (updates.status !== undefined) mapped.status = updates.status

    const { error } = await supabase.from('vehicles').update(mapped).eq('id', id)
    if (error) { console.error('updateVehicle error:', error); return }
    set((s) => ({
      vehicles: s.vehicles.map((v) => v.id === id ? { ...v, ...mapped } : v),
    }))
  },

  setStatus: async (id, status) => {
    if (!supabase) return
    const { error } = await supabase.from('vehicles').update({ status }).eq('id', id)
    if (error) { console.error('setStatus error:', error); return }
    set((s) => ({
      vehicles: s.vehicles.map((v) => v.id === id ? { ...v, status } : v),
    }))
  },

  // Computed getters (from local state)
  getAvailableVehicles: () => get().vehicles.filter((v) => v.status === 'Available'),
  getVehicleById: (id) => get().vehicles.find((v) => v.id === id),
  getVehiclesByStatus: (status) => get().vehicles.filter((v) => v.status === status),
  getActiveCount: () => get().vehicles.filter((v) => v.status === 'On Trip').length,
  getInShopCount: () => get().vehicles.filter((v) => v.status === 'In Shop').length,
  getUtilizationRate: () => {
    const vs = get().vehicles.filter((v) => v.status !== 'Retired')
    if (vs.length === 0) return 0
    return Math.round((vs.filter((v) => v.status === 'On Trip').length / vs.length) * 100)
  },
}))

export default useVehicleStore
