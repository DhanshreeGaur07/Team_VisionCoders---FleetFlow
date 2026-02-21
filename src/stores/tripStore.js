import { create } from 'zustand'
import { supabase } from '../lib/supabase'

const useTripStore = create((set, get) => ({
  trips: [],
  loading: false,
  error: null,

  fetch: async () => {
    if (!supabase) return
    set({ loading: true, error: null })
    const { data, error } = await supabase
      .from('trips')
      .select('*')
      .order('created_at', { ascending: false })
    if (error) { set({ loading: false, error: error.message }); return }
    set({ trips: data || [], loading: false })
  },

  addTrip: async (trip) => {
    if (!supabase) return null
    const { data, error } = await supabase
      .from('trips')
      .insert({
        vehicle_id: trip.vehicleId,
        driver_id: trip.driverId,
        origin: trip.origin,
        destination: trip.destination,
        cargo_weight: trip.cargoWeight,
        start_odometer: trip.startOdometer,
        revenue: trip.revenue || 0,
        status: 'Draft',
      })
      .select()
      .single()
    if (error) { console.error('addTrip error:', error); return null }
    set((s) => ({ trips: [data, ...s.trips] }))
    return data
  },

  dispatchTrip: async (id) => {
    if (!supabase) return
    const now = new Date().toISOString()
    const { error } = await supabase
      .from('trips')
      .update({ status: 'Dispatched', dispatched_at: now })
      .eq('id', id)
    if (error) { console.error('dispatchTrip error:', error); return }
    set((s) => ({
      trips: s.trips.map((t) => t.id === id ? { ...t, status: 'Dispatched', dispatched_at: now } : t),
    }))
  },

  completeTrip: async (id, endOdometer) => {
    if (!supabase) return
    const now = new Date().toISOString()
    const { error } = await supabase
      .from('trips')
      .update({ status: 'Completed', completed_at: now, end_odometer: endOdometer })
      .eq('id', id)
    if (error) { console.error('completeTrip error:', error); return }
    set((s) => ({
      trips: s.trips.map((t) => t.id === id
        ? { ...t, status: 'Completed', completed_at: now, end_odometer: endOdometer }
        : t),
    }))
  },

  cancelTrip: async (id) => {
    if (!supabase) return
    const { error } = await supabase
      .from('trips')
      .update({ status: 'Cancelled' })
      .eq('id', id)
    if (error) { console.error('cancelTrip error:', error); return }
    set((s) => ({
      trips: s.trips.map((t) => t.id === id ? { ...t, status: 'Cancelled' } : t),
    }))
  },

  // Computed
  getTripById: (id) => get().trips.find((t) => t.id === id),
  getPendingCargoCount: () => get().trips.filter((t) => t.status === 'Draft').length,
  getTripsByVehicle: (vehicleId) => get().trips.filter((t) => t.vehicle_id === vehicleId),
  getTripsByDriver: (driverId) => get().trips.filter((t) => t.driver_id === driverId),
  getCompletedTrips: () => get().trips.filter((t) => t.status === 'Completed'),
}))

export default useTripStore
