import { supabase, unwrapFunctionError } from './supabaseClient'

// Real Zoom meetings, not a manually pasted link -- see the
// create-live-session Edge Function. Needs Zoom Server-to-Server OAuth
// credentials configured in Settings -> Live sessions (migration 0036)
// first; that function returns a clear error (e.g. "Zoom isn't configured
// yet") if they aren't set.
export async function createLiveSession({ title, description, visibleTiers, scheduledAt, durationMinutes }) {
  const { data, error } = await supabase.functions.invoke('create-live-session', {
    body: { title, description, visibleTiers, scheduledAt, durationMinutes },
  })
  if (error) throw await unwrapFunctionError(error)
  return data.session
}

export async function listLiveSessions() {
  const { data, error } = await supabase
    .from('live_sessions')
    .select('id, title, description, visible_tiers, scheduled_at, join_url, zoom_meeting_id, created_at')
    .order('scheduled_at', { ascending: true })
  if (error) throw error
  return data || []
}

// Deletes the DB row AND (best-effort) the underlying Zoom meeting -- see
// the delete-live-session Edge Function.
export async function deleteLiveSession(id) {
  const { error } = await supabase.functions.invoke('delete-live-session', {
    body: { sessionId: id },
  })
  if (error) throw await unwrapFunctionError(error)
}
