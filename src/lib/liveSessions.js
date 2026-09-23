import { supabase, unwrapFunctionError } from './supabaseClient'

// Thumbnails are stored as a storage PATH, not a URL — same pattern as
// courseThumbnailUrl (src/lib/courses.js).
export function liveSessionThumbnailUrl(path) {
  if (!path) return null
  if (/^https?:\/\//i.test(path)) return path
  const { data } = supabase.storage.from('live-session-thumbnails').getPublicUrl(path)
  return data.publicUrl
}

export async function uploadLiveSessionThumbnail(file) {
  const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg'
  const path = `${crypto.randomUUID()}.${ext}`
  const { error: uploadError } = await supabase.storage
    .from('live-session-thumbnails')
    .upload(path, file, { contentType: file.type })
  if (uploadError) throw uploadError
  const { data } = supabase.storage.from('live-session-thumbnails').getPublicUrl(path)
  return { path, publicUrl: data.publicUrl }
}

// Real Zoom meetings, not a manually pasted link -- see the
// create-live-session Edge Function. Needs Zoom Server-to-Server OAuth
// credentials configured in Settings -> Live sessions (migration 0036)
// first; that function returns a clear error (e.g. "Zoom isn't configured
// yet") if they aren't set. thumbnailPath is uploaded client-side first
// (uploadLiveSessionThumbnail doesn't need a session id to exist yet) and
// just passed through here to be stored on the new row.
export async function createLiveSession({ title, description, visibleTiers, scheduledAt, durationMinutes, thumbnailPath }) {
  const { data, error } = await supabase.functions.invoke('create-live-session', {
    body: { title, description, visibleTiers, scheduledAt, durationMinutes, thumbnailPath },
  })
  if (error) throw await unwrapFunctionError(error)
  return data.session
}

const LIST_COLUMNS = 'id, title, description, visible_tiers, scheduled_at, duration_minutes, thumbnail_path, join_url, zoom_meeting_id, created_at'

export async function listLiveSessions() {
  const { data, error } = await supabase
    .from('live_sessions')
    .select(LIST_COLUMNS)
    .order('scheduled_at', { ascending: true })
  if (error) throw error
  return (data || []).map((s) => ({ ...s, thumbnail_url: liveSessionThumbnailUrl(s.thumbnail_path) }))
}

export async function fetchLiveSession(id) {
  const { data, error } = await supabase
    .from('live_sessions')
    .select(LIST_COLUMNS)
    .eq('id', id)
    .maybeSingle()
  if (error) throw error
  return data ? { ...data, thumbnail_url: liveSessionThumbnailUrl(data.thumbnail_path) } : data
}

// Deletes the DB row AND (best-effort) the underlying Zoom meeting -- see
// the delete-live-session Edge Function.
export async function deleteLiveSession(id) {
  const { error } = await supabase.functions.invoke('delete-live-session', {
    body: { sessionId: id },
  })
  if (error) throw await unwrapFunctionError(error)
}

// A session is "live" from scheduled_at through scheduled_at + duration —
// previously unbounded (scheduled_at onward, forever), which meant a
// months-old session with no end time would still show "Live now".
export function isSessionLive(session, now = new Date()) {
  const start = new Date(session.scheduled_at)
  const end = new Date(start.getTime() + (session.duration_minutes || 60) * 60000)
  return now >= start && now <= end
}
export function isSessionPast(session, now = new Date()) {
  const start = new Date(session.scheduled_at)
  const end = new Date(start.getTime() + (session.duration_minutes || 60) * 60000)
  return now > end
}

// "3d 4h", "2h 15m", "42m", "Starting now" — for the countdown badge on
// cards and the detail page. Deliberately coarse (no seconds) above a
// minute so it doesn't visually tick every second on the card grid.
export function formatCountdown(targetDate, now = new Date()) {
  const diffMs = new Date(targetDate).getTime() - now.getTime()
  if (diffMs <= 0) return 'Starting now'
  const totalMinutes = Math.floor(diffMs / 60000)
  const days = Math.floor(totalMinutes / (60 * 24))
  const hours = Math.floor((totalMinutes % (60 * 24)) / 60)
  const minutes = totalMinutes % 60
  if (days > 0) return `${days}d ${hours}h`
  if (hours > 0) return `${hours}h ${minutes}m`
  return `${minutes}m`
}
