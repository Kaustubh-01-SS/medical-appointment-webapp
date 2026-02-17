/**
 * Supabase Browser Client
 * 
 * For use in Client Components and browser-side operations.
 * Automatically handles session persistence in localStorage.
 * 
 * Usage:
 *   import { createClient } from '@/lib/supabase/client'
 *   const supabase = createClient()
 *   await supabase.auth.signUp({ email, password })
 */

'use client'

import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )
}

/**
 * Get or create singleton Supabase client instance for browser
 * Prevents multiple client instances in same page lifecycle
 */
let singleton

export function getSupabaseClient() {
  if (!singleton) {
    singleton = createClient()
  }
  return singleton
}
