import { supabase } from './supabaseClient'

// Mirrors paymentSettings.js exactly: get_zoom_settings() is a
// security-definer RPC (migration 0036) that never returns the real
// client_secret -- only account_id/client_id (not sensitive) plus a masked
// last-4-characters hint for the secret, so the UI can show "a secret is
// set" without the raw value ever reaching the browser.
export async function fetchZoomSettings() {
  const { data, error } = await supabase.rpc('get_zoom_settings')
  if (error) throw error
  const row = Array.isArray(data) ? data[0] : data
  return {
    accountId: row?.account_id || '',
    clientId: row?.client_id || '',
    hasClientSecret: !!row?.has_client_secret,
    clientSecretHint: row?.client_secret_hint || null,
  }
}

// Leaving clientSecret blank/undefined keeps whatever secret is already
// stored -- an admin updating just the account/client id never has to
// re-paste the secret, and there's no way to read the current one back to
// confirm it first anyway.
//
// Goes through a security-definer RPC rather than an upsert() straight to
// the table: INSERT ... ON CONFLICT needs SELECT on every column it
// touches (including client_secret via excluded.client_secret) to resolve
// the conflict, and client_secret can never carry a SELECT grant without
// defeating the entire point of hiding it from the client. Running as the
// function owner sidesteps that -- see migration
// save_settings_via_security_definer_rpc.
export async function saveZoomSettings({ accountId, clientId, clientSecret }) {
  const { error } = await supabase.rpc('save_zoom_settings', {
    p_account_id: accountId?.trim() || null,
    p_client_id: clientId?.trim() || null,
    p_client_secret: clientSecret && clientSecret.trim() ? clientSecret.trim() : null,
  })
  if (error) throw error
}
