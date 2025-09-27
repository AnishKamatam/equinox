import { createClient } from '@supabase/supabase-js'

// Replace these with your actual Supabase project URL and anon key
// You can find these in your Supabase project settings
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder-anon-key'

// Only create the client if we have valid credentials
let supabase = null

const isDemoConfig = supabaseUrl === 'https://demo.supabase.co' || supabaseAnonKey === 'demo-key'
const isPlaceholder = supabaseUrl === 'https://placeholder.supabase.co' || supabaseAnonKey === 'placeholder-anon-key'

if (!isDemoConfig && !isPlaceholder) {
  supabase = createClient(supabaseUrl, supabaseAnonKey)
} else {
  if (isDemoConfig) {
    console.warn('🔧 Using demo Supabase configuration. Please set up your real Supabase project for authentication to work.')
  } else {
    console.warn('⚠️ Supabase not configured. Please add your VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your environment variables.')
  }
  
  // Create a mock client for development
  supabase = {
    auth: {
      getSession: () => Promise.resolve({ data: { session: null } }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
      signUp: () => Promise.resolve({ data: null, error: { message: 'Demo mode - Please configure your Supabase project' } }),
      signInWithPassword: () => Promise.resolve({ data: null, error: { message: 'Demo mode - Please configure your Supabase project' } }),
      signOut: () => Promise.resolve({ error: null }),
      resetPasswordForEmail: () => Promise.resolve({ data: null, error: { message: 'Demo mode - Please configure your Supabase project' } })
    }
  }
}

export { supabase }
