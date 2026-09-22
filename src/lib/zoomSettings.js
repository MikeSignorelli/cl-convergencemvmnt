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
export async function saveZoomSettings({ accountId, clientId, clientSecret }) {
  const { data: userData } = await supabase.auth.getUser()
  const patch = {
    provider: 'zoom',
    account_id: accountId?.trim() || null,
    client_id: clientId?.trim() || null,
    updated_by: userData.user?.id ?? null,
    updated_at: new Date().toISOString(),
  }
  if (clientSecret && clientSecret.trim()) {
    patch.client_secret = clientSecret.trim()
  }
  const { error } = await supabase.from('zoom_settings').upsert(patch, { onConflict: 'provider' })
  if (error) throw error
}
