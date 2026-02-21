import { create } from 'zustand'
import { supabase } from '../lib/supabase'

const useNotificationStore = create((set, get) => ({
  notifications: [],
  loading: false,

  fetch: async (userId) => {
    if (!userId || !supabase) return
    set({ loading: true })
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(30)
    if (error) { console.error('fetchNotifications error:', error); set({ loading: false }); return }
    set({ notifications: data || [], loading: false })
  },

  addNotification: async (notification, userId) => {
    if (!userId || !supabase) return
    const { data, error } = await supabase
      .from('notifications')
      .insert({
        user_id: userId,
        type: notification.type || 'info',
        message: notification.message,
        read: false,
      })
      .select()
      .single()
    if (error) { console.error('addNotification error:', error); return }
    set((s) => ({ notifications: [data, ...s.notifications] }))
  },

  markAsRead: async (id) => {
    if (!supabase) return
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', id)
    if (error) { console.error('markAsRead error:', error); return }
    set((s) => ({
      notifications: s.notifications.map((n) => n.id === id ? { ...n, read: true } : n),
    }))
  },

  markAllRead: async (userId) => {
    if (!userId || !supabase) return
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('user_id', userId)
      .eq('read', false)
    if (error) { console.error('markAllRead error:', error); return }
    set((s) => ({
      notifications: s.notifications.map((n) => ({ ...n, read: true })),
    }))
  },

  getUnreadCount: () => get().notifications.filter((n) => !n.read).length,
}))

export default useNotificationStore
