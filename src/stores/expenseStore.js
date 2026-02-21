import { create } from 'zustand'
import { supabase } from '../lib/supabase'

const useExpenseStore = create((set, get) => ({
  expenses: [],
  loading: false,
  error: null,

  fetch: async () => {
    if (!supabase) return
    set({ loading: true, error: null })
    const { data, error } = await supabase
      .from('expenses')
      .select('*')
      .order('created_at', { ascending: false })
    if (error) { set({ loading: false, error: error.message }); return }
    set({ expenses: data || [], loading: false })
  },

  addExpense: async (expense) => {
    if (!supabase) return
    const { data, error } = await supabase
      .from('expenses')
      .insert({
        vehicle_id: expense.vehicleId,
        type: expense.type || 'fuel',
        liters: expense.liters,
        cost: expense.cost,
        odometer: expense.odometer,
        date: expense.date,
      })
      .select()
      .single()
    if (error) { console.error('addExpense error:', error); return }
    set((s) => ({ expenses: [data, ...s.expenses] }))
  },

  // Computed
  getExpensesByVehicle: (vehicleId) => get().expenses.filter((e) => e.vehicle_id === vehicleId),
  getTotalFuelCost: (vehicleId) => {
    return get().expenses
      .filter((e) => e.vehicle_id === vehicleId && e.type === 'fuel')
      .reduce((sum, e) => sum + Number(e.cost), 0)
  },
  getTotalLiters: (vehicleId) => {
    return get().expenses
      .filter((e) => e.vehicle_id === vehicleId && e.type === 'fuel')
      .reduce((sum, e) => sum + Number(e.liters || 0), 0)
  },
  getAllFuelCost: () => {
    return get().expenses
      .filter((e) => e.type === 'fuel')
      .reduce((sum, e) => sum + Number(e.cost), 0)
  },
}))

export default useExpenseStore
