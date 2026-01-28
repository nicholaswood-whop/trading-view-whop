import { createClient } from '@supabase/supabase-js'

/**
 * Supabase client for direct database access and real-time features
 * 
 * Note: We're using Prisma for ORM, but Supabase client can be used for:
 * - Real-time subscriptions
 * - Storage (if needed)
 * - Direct SQL queries
 * - Row Level Security (RLS) policies
 * 
 * @see https://supabase.com/docs/guides/getting-started
 */
export function createSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('Supabase credentials not found. Some features may not work.')
    return null
  }

  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false, // We're using server-side only
    },
  })
}

/**
 * Server-side Supabase client (uses service role key for admin operations)
 * Only use this in server-side code with proper authentication
 */
export function createSupabaseAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    console.warn('Supabase admin credentials not found.')
    return null
  }

  return createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}
