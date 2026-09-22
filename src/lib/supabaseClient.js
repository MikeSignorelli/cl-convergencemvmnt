import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

if (!supabaseUrl || !supabaseKey) {
  throw new Error(
    'Missing Supabase env vars: set VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY in .env.local'
  )
}

export const supabase = createClient(supabaseUrl, supabaseKey)

// supabase-js only puts a generic "Edge Function returned a non-2xx status
// code" on a FunctionsHttpError -- the function's own {error: "..."} JSON
// body (what actually explains the failure) sits unread on error.context,
// a Response. This pulls it out so the UI can show something the admin or
// member can act on instead of that one-size-fits-all message. Shared by
// every lib module that calls supabase.functions.invoke (billing.js,
// liveSessions.js, ...).
export async function unwrapFunctionError(error) {
  if (error?.context && typeof error.context.json === 'function') {
    try {
      const body = await error.context.clone().json()
      if (body?.error) return new Error(body.error)
    } catch {
      // Body wasn't JSON (or already consumed) -- fall through to the
      // original error rather than hide it behind a second failure.
    }
  }
  return error
}
