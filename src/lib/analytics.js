import { supabase } from './supabaseClient'
import { isRevenue } from './orders'

export const MEMBER_TIERS = ['disciple', 'leader', 'pastor', 'admin']

// One fetch per source table, all client-side from here — same "small
// enough for a single membership site" call Orders.jsx and this file's own
// original fetchMemberCounts/fetchSignupGrowth already made. Analytics.jsx
// derives every stat/chart/table from these four arrays via filters
// (date range, tier) applied in the component, so switching a filter never
// re-hits the network.
export async function fetchAnalyticsSource() {
  const [{ data: profiles, error: profilesError }, { data: purchases, error: purchasesError }, { data: txRows, error: txError }, { data: progressRows, error: progressError }] =
    await Promise.all([
      supabase.from('profiles').select('id, tier, subscription_status, created_at'),
      supabase.from('course_purchases').select('id, status, purchased_at, created_at, courses(id, title, price_cents)'),
      supabase.from('billing_transactions').select('id, amount_cents, status, occurred_at'),
      supabase.from('lesson_progress').select('percent, completed'),
    ])
  if (profilesError) throw profilesError
  if (purchasesError) throw purchasesError
  if (txError) throw txError
  if (progressError) throw progressError
  return { profiles: profiles || [], purchases: purchases || [], transactions: txRows || [], progress: progressRows || [] }
}

export function filterByTier(profiles, tier) {
  return tier === 'all' ? profiles : profiles.filter((p) => (p.tier || 'none') === tier)
}

export function countByTier(profiles) {
  const counts = { disciple: 0, leader: 0, pastor: 0, admin: 0, none: 0 }
  for (const p of profiles) {
    const key = p.tier && counts[p.tier] !== undefined ? p.tier : 'none'
    counts[key] += 1
  }
  return counts
}

export function countBySubscriptionStatus(profiles) {
  const counts = { active: 0, pending: 0, failed: 0, cancelled: 0 }
  for (const p of profiles) {
    const key = counts[p.subscription_status] !== undefined ? p.subscription_status : 'pending'
    counts[key] += 1
  }
  return counts
}

// Buckets any {date, value} rows by calendar week across [start, end],
// oldest first (chart order) — every week in range gets an entry (0 if
// nothing happened) so a quiet week shows as a gap, not a skipped bar.
// Caps at maxWeeks (clamping start forward) so a wide range (e.g. "all
// time" on an old site) still renders a readable chart.
export function weeklyBuckets(rows, start, end, maxWeeks = 52) {
  let clampedStart = new Date(start)
  const totalWeeks = Math.ceil((end - clampedStart) / (7 * 86400000))
  if (totalWeeks > maxWeeks) {
    clampedStart = new Date(end)
    clampedStart.setDate(clampedStart.getDate() - maxWeeks * 7)
  }
  const weekStart = new Date(clampedStart)
  weekStart.setHours(0, 0, 0, 0)
  weekStart.setDate(weekStart.getDate() - weekStart.getDay())

  const weeks = []
  for (const cursor = new Date(weekStart); cursor <= end; cursor.setDate(cursor.getDate() + 7)) {
    const wStart = new Date(cursor)
    const wEnd = new Date(cursor)
    wEnd.setDate(wEnd.getDate() + 7)
    weeks.push({ start: wStart, end: wEnd, value: 0, label: wStart.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) })
  }
  for (const r of rows) {
    const d = new Date(r.date)
    const bucket = weeks.find((w) => d >= w.start && d < w.end)
    if (bucket) bucket.value += r.value
  }
  return weeks
}

// Revenue actually collected in [start, end] — course purchases + paid
// membership charges, same "only count paid/completed" rule as Orders.jsx.
export function revenueInRange(purchases, transactions, start, end) {
  let cents = 0
  for (const p of purchases) {
    if (p.status !== 'completed') continue
    const d = new Date(p.purchased_at || p.created_at)
    if (d >= start && d <= end) cents += p.courses?.price_cents ?? 0
  }
  for (const t of transactions) {
    if (!isRevenue({ status: t.status })) continue
    const d = new Date(t.occurred_at)
    if (d >= start && d <= end) cents += t.amount_cents
  }
  return cents
}

// MRR estimate: active subscriptions × the most recent actual membership
// charge amount (falls back to $49 only if the ledger has no paid charges
// yet, e.g. right after migration 0032 before the next renewal). Grounded
// in a real observed charge rather than a hardcoded price that could go
// stale if pricing ever changes.
const FALLBACK_MEMBERSHIP_CENTS = 4900
export function estimateMrrCents(profiles, transactions) {
  const activeCount = profiles.filter((p) => p.subscription_status === 'active').length
  const paidCharges = transactions.filter((t) => t.status === 'paid').sort((a, b) => new Date(b.occurred_at) - new Date(a.occurred_at))
  const perMemberCents = paidCharges[0]?.amount_cents || FALLBACK_MEMBERSHIP_CENTS
  return activeCount * perMemberCents
}

// Ranked by purchase count within [start, end] — "what's actually selling."
// Includes pending + completed (both are real buyer intent; only revenue
// sums restrict to completed) so a course with a lot of abandoned/pending
// checkouts still surfaces as worth investigating.
export function topCoursesByPurchases(purchases, start, end, limit = 5) {
  const byCourse = new Map()
  for (const p of purchases) {
    const d = new Date(p.purchased_at || p.created_at)
    if (d < start || d > end) continue
    const id = p.courses?.id || 'unknown'
    const title = p.courses?.title || 'Untitled course'
    const entry = byCourse.get(id) || { title, purchases: 0, revenueCents: 0 }
    entry.purchases += 1
    if (p.status === 'completed') entry.revenueCents += p.courses?.price_cents ?? 0
    byCourse.set(id, entry)
  }
  return Array.from(byCourse.values()).sort((a, b) => b.purchases - a.purchases).slice(0, limit)
}

// Coarse engagement signal from lesson_progress: how far members get into
// what they start. Not a per-course completion rate (that needs each
// course's total lesson count, a heavier join) -- this is deliberately the
// simple version: average watch % across every lesson a member has ever
// touched, plus how many lessons have been fully finished.
export function engagementSummary(progressRows) {
  if (progressRows.length === 0) return { avgPercent: 0, lessonsStarted: 0, lessonsCompleted: 0 }
  const avgPercent = Math.round((progressRows.reduce((s, r) => s + (r.percent || 0), 0) / progressRows.length) * 100)
  const lessonsCompleted = progressRows.filter((r) => r.completed).length
  return { avgPercent, lessonsStarted: progressRows.length, lessonsCompleted }
}
