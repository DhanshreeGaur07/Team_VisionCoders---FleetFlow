import { create } from 'zustand'
import { supabase } from '../lib/supabase'

const useMaintenanceStore = create((set, get) => ({
  logs: [],
  loading: false,
  error: null,

  fetch: async () => {
    if (!supabase) return
    set({ loading: true, error: null })
    const { data, error } = await supabase
      .from('maintenance_logs')
      .select('*')
      .order('created_at', { ascending: false })
    if (error) { set({ loading: false, error: error.message }); return }
    set({ logs: data || [], loading: false })
  },

  addLog: async (log) => {
    if (!supabase) return null
    const { data, error } = await supabase
      .from('maintenance_logs')
      .insert({
        vehicle_id: log.vehicleId,
        service_type: log.serviceType,
        cost: log.cost,
        date: log.date,
        notes: log.notes || '',
        status: 'Open',
      })
      .select()
      .single()
    if (error) { console.error('addLog error:', error); return null }
    set((s) => ({ logs: [data, ...s.logs] }))
    return data
  },

  completeLog: async (id) => {
    if (!supabase) return
    const { error } = await supabase
      .from('maintenance_logs')
      .update({ status: 'Completed' })
      .eq('id', id)
    if (error) { console.error('completeLog error:', error); return }
    set((s) => ({
      logs: s.logs.map((l) => l.id === id ? { ...l, status: 'Completed' } : l),
    }))
  },

  // Computed
  getLogsByVehicle: (vehicleId) => get().logs.filter((l) => l.vehicle_id === vehicleId),
  getOpenLogs: () => get().logs.filter((l) => l.status === 'Open'),
  getTotalMaintenanceCost: (vehicleId) => {
    return get().logs
      .filter((l) => l.vehicle_id === vehicleId)
      .reduce((sum, l) => sum + Number(l.cost), 0)
  },
}))

export default useMaintenanceStore
