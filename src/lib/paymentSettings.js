import { supabase } from './supabaseClient'

// Reads the current Stripe configuration for the admin Settings page (see
// migration 0030). Never returns the real secret key -- get_stripe_settings
// is a security-definer function that exposes only the publishable key
// (not sensitive) plus a masked last-4-characters hint, so the UI can show
// "a key is set" without the raw value ever reaching the browser, even for
// an admin re-loading their own settings page.
export async function fetchStripeSettings() {
  const { data, error } = await supabase.rpc('get_stripe_settings')
  if (error) throw error
  const row = Array.isArray(data) ? data[0] : data
  return {
    publishableKey: row?.publishable_key || '',
    hasSecretKey: !!row?.has_secret_key,
    secretKeyHint: row?.secret_key_hint || null,
  }
}

// Saves the Stripe key pair. Leaving secretKey blank/undefined keeps
// whatever secret key is already stored -- an admin updating just the
// publishable key never has to re-paste the secret key, and there is no
// way to read the current one back to confirm it first anyway. Passing a
// non-empty secretKey replaces it outright.
//
// Goes through a security-definer RPC rather than an upsert() straight to
// the table: INSERT ... ON CONFLICT needs SELECT on every column it
// touches (including secret_key via excluded.secret_key) to resolve the
// conflict, and secret_key can never carry a SELECT grant without
// defeating the entire point of hiding it from the client. Running as the
// function owner sidesteps that -- see migration
// save_settings_via_security_definer_rpc.
export async function saveStripeSettings({ publishableKey, secretKey }) {
  const { error } = await supabase.rpc('save_stripe_settings', {
    p_publishable_key: publishableKey?.trim() || null,
    p_secret_key: secretKey && secretKey.trim() ? secretKey.trim() : null,
  })
  if (error) throw error
}
