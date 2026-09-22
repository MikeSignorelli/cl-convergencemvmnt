import { supabase } from './supabaseClient'

// Admin-wide transaction feed: unions course_purchases (0011) and
// billing_transactions (0032) — the same two sources billing.js's
// fetchBillingSummary reads for one member's own history, but every row,
// for every member. Both tables' RLS already lets an admin select every
// row (course_purchases' "for all" admin clause; billing_transactions'
// `is_caller_admin()`), so this is a plain client query, same as
// adminListCourses() elsewhere — no service-role Edge Function needed.
//
// Fetches the whole history rather than accepting a date range: the
// intended scale here is a single-membership-site's transaction volume
// (same "small enough for client-side aggregation" call Analytics.jsx
// already makes for signups) — Orders.jsx does its own range filtering
// and daily bucketing over this array. Revisit with real server-side
// pagination if this table ever grows past a few thousand rows.
export async function fetchAllTransactions() {
  const [{ data: purchases, error: purchasesError }, { data: invoices, error: invoicesError }] = await Promise.all([
    supabase
      .from('course_purchases')
      .select('id, status, purchased_at, created_at, courses(title, price_cents), profiles(display_name, username)')
      .order('created_at', { ascending: false }),
    supabase
      .from('billing_transactions')
      .select('id, status, amount_cents, currency, description, receipt_url, occurred_at, profiles(display_name, username)')
      .order('occurred_at', { ascending: false }),
  ])
  if (purchasesError) throw purchasesError
  if (invoicesError) throw invoicesError

  const courseTx = (purchases || []).map((p) => ({
    id: `course_${p.id}`,
    type: 'course',
    memberName: p.profiles?.display_name || p.profiles?.username || 'Unknown member',
    description: p.courses?.title || 'Course purchase',
    date: p.purchased_at || p.created_at,
    amountCents: p.courses?.price_cents ?? 0,
    currency: 'usd',
    status: p.status, // pending | completed | failed
    receiptUrl: null,
  }))

  const membershipTx = (invoices || []).map((row) => ({
    id: `membership_${row.id}`,
    type: 'membership',
    memberName: row.profiles?.display_name || row.profiles?.username || 'Unknown member',
    description: row.description || 'Monthly membership',
    date: row.occurred_at,
    amountCents: row.amount_cents,
    currency: row.currency,
    status: row.status, // paid | failed
    receiptUrl: row.receipt_url,
  }))

  return [...courseTx, ...membershipTx].sort((a, b) => new Date(b.date) - new Date(a.date))
}

// "Revenue" only ever counts money actually collected — completed course
// purchases and paid membership invoices — never pending or failed rows.
const REVENUE_STATUSES = new Set(['completed', 'paid'])
export function isRevenue(t) {
  return REVENUE_STATUSES.has(t.status)
}

// Local-midnight day key (not UTC) so "today"/daily buckets match what the
// admin's own calendar day looks like, same intent as toLocalInput
// elsewhere in the admin panel.
export function dayKey(dateIso) {
  const d = new Date(dateIso)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

// Revenue bucketed by day across [start, end] inclusive, newest last (chart
// order) — every day in range gets an entry (0 if nothing sold) so a gap in
// sales shows as a gap in the chart, not a skipped bar.
export function dailyRevenue(transactions, start, end) {
  const buckets = new Map()
  for (const d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    buckets.set(dayKey(d), 0)
  }
  for (const t of transactions) {
    if (!isRevenue(t)) continue
    const key = dayKey(t.date)
    if (buckets.has(key)) buckets.set(key, buckets.get(key) + t.amountCents)
  }
  return Array.from(buckets.entries()).map(([key, amountCents]) => ({ key, amountCents }))
}
