import { create } from 'zustand'
import { supabase, isSupabaseConfigured } from '../lib/supabase'

const useAuthStore = create((set, get) => ({
  user: null,
  profile: null,
  role: null,
  isAuthenticated: false,
  loading: true,
  error: null,

  // Initialize session from Supabase on app load
  initialize: async () => {
    if (!isSupabaseConfigured || !supabase) {
      set({ loading: false })
      return
    }
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single()

        set({
          user: session.user,
          profile,
          role: profile?.role || session.user.user_metadata?.role || 'Fleet Manager',
          isAuthenticated: true,
          loading: false,
        })
      } else {
        set({ loading: false })
      }

      // Listen for auth state changes
      supabase.auth.onAuthStateChange(async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single()

          set({
            user: session.user,
            profile,
            role: profile?.role || session.user.user_metadata?.role || 'Fleet Manager',
            isAuthenticated: true,
            loading: false,
          })
        } else if (event === 'SIGNED_OUT') {
          set({
            user: null,
            profile: null,
            role: null,
            isAuthenticated: false,
            loading: false,
          })
        }
      })
    } catch (err) {
      console.error('Auth init error:', err)
      set({ loading: false, error: err.message })
    }
  },

  // Sign in with email/password
  login: async (email, password) => {
    set({ loading: true, error: null })
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      set({ loading: false, error: error.message })
      return { error }
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', data.user.id)
      .single()

    set({
      user: data.user,
      profile,
      role: profile?.role || data.user.user_metadata?.role || 'Fleet Manager',
      isAuthenticated: true,
      loading: false,
    })
    return { error: null }
  },

  // Sign up with email/password/role/name
  signup: async (email, password, fullName, role) => {
    set({ loading: true, error: null })
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          role,
        },
      },
    })
    if (error) {
      set({ loading: false, error: error.message })
      return { error }
    }

    // If email confirmation is disabled, user is immediately active
    if (data.user && data.session) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.user.id)
        .single()

      set({
        user: data.user,
        profile,
        role: profile?.role || role,
        isAuthenticated: true,
        loading: false,
      })
    } else {
      set({ loading: false })
    }

    return { error: null, needsConfirmation: !data.session }
  },

  // Sign out
  logout: async () => {
    await supabase.auth.signOut()
    set({
      user: null,
      profile: null,
      role: null,
      isAuthenticated: false,
      loading: false,
      error: null,
    })
  },

  clearError: () => set({ error: null }),
}))

export default useAuthStore
