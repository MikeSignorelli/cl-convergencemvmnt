import { supabase } from './supabaseClient'

export async function fetchMemberCounts() {
  const { data, error } = await supabase.from('profiles').select('tier')
  if (error) throw error

  const counts = { disciple: 0, leader: 0, pastor: 0, admin: 0, none: 0 }
  for (const row of data || []) {
    const key = row.tier && counts[row.tier] !== undefined ? row.tier : 'none'
    counts[key] += 1
  }
  return { total: (data || []).length, byTier: counts }
}

// Buckets signups by week for the last 8 weeks (client-side; the members
// table is small enough not to need a SQL aggregation function for this).
export async function fetchSignupGrowth() {
  const { data, error } = await supabase.from('profiles').select('created_at')
  if (error) throw error

  const weeks = []
  const now = new Date()
  for (let i = 7; i >= 0; i--) {
    const start = new Date(now)
    start.setDate(start.getDate() - i * 7 - start.getDay())
    start.setHours(0, 0, 0, 0)
    const end = new Date(start)
    end.setDate(end.getDate() + 7)
    weeks.push({ start, end, count: 0, label: start.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) })
  }

  for (const row of data || []) {
    const created = new Date(row.created_at)
    const bucket = weeks.find((w) => created >= w.start && created < w.end)
    if (bucket) bucket.count += 1
  }

  return weeks
}
