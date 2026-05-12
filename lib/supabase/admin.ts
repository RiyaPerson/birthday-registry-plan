import { createClient } from '@supabase/supabase-js'

/**
 * Server-only client that bypasses RLS. Used for operations anon users cannot perform
 * under typical policies (e.g. DELETE on gift_claims) after request validation.
 * Set SUPABASE_SERVICE_ROLE_KEY in Vercel / .env.local (never expose to the client).
 */
export function createServiceRoleClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return null
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}
