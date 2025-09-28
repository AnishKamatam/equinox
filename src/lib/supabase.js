import { createClient } from '@supabase/supabase-js'

// Replace these with your actual Supabase project URL and anon key
// You can find these in your Supabase project settings
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder-anon-key'
const supabaseServiceRoleKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY

// Only create the client if we have valid credentials
let supabase = null
let supabaseAdmin = null

const isDemoConfig = supabaseUrl === 'https://demo.supabase.co' || supabaseAnonKey === 'demo-key'
const isPlaceholder = supabaseUrl === 'https://placeholder.supabase.co' || supabaseAnonKey === 'placeholder-anon-key'

if (!isDemoConfig && !isPlaceholder) {
  supabase = createClient(supabaseUrl, supabaseAnonKey)
  
  // Create admin client with service role key if available (bypasses RLS)
  if (supabaseServiceRoleKey && supabaseServiceRoleKey !== 'your-service-role-key-here') {
    supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
    console.log('🔑 Service role key configured - can bypass RLS for data queries')
  } else {
    console.log('ℹ️ Add VITE_SUPABASE_SERVICE_ROLE_KEY to bypass RLS if needed')
  }
} else {
  if (isDemoConfig) {
    console.warn('🔧 Using demo Supabase configuration. Please set up your real Supabase project for authentication to work.')
  } else {
    console.warn('⚠️ Supabase not configured. Please add your VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your environment variables.')
  }
  
  // Create a mock client for development
  const mockClient = {
    auth: {
      getSession: () => Promise.resolve({ data: { session: null } }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
      signUp: () => Promise.resolve({ data: null, error: { message: 'Demo mode - Please configure your Supabase project' } }),
      signInWithPassword: () => Promise.resolve({ data: null, error: { message: 'Demo mode - Please configure your Supabase project' } }),
      signOut: () => Promise.resolve({ error: null }),
      resetPasswordForEmail: () => Promise.resolve({ data: null, error: { message: 'Demo mode - Please configure your Supabase project' } })
    },
    from: () => ({
      select: () => Promise.resolve({ data: [], error: null }),
      insert: () => Promise.resolve({ data: [], error: null }),
      update: () => Promise.resolve({ data: [], error: null }),
      delete: () => Promise.resolve({ data: [], error: null })
    })
  }
  
  supabase = mockClient
  supabaseAdmin = mockClient
}

export { supabase, supabaseAdmin }
