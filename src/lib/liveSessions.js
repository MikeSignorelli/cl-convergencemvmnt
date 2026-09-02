import { supabase } from './supabaseClient'

export async function createLiveSession({ title, description, visibleTiers, scheduledAt, joinUrl }) {
  const { data: userData } = await supabase.auth.getUser()
  const { error } = await supabase.from('live_sessions').insert({
    title,
    description: description || null,
    visible_tiers: visibleTiers,
    scheduled_at: scheduledAt,
    join_url: joinUrl,
    created_by: userData.user?.id ?? null,
  })
  if (error) throw error
}

export async function listLiveSessions() {
  const { data, error } = await supabase
    .from('live_sessions')
    .select('id, title, description, visible_tiers, scheduled_at, join_url, created_at')
    .order('scheduled_at', { ascending: true })
  if (error) throw error
  return data || []
}

export async function deleteLiveSession(id) {
  const { error } = await supabase.from('live_sessions').delete().eq('id', id)
  if (error) throw error
}
