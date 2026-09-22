import { useEffect, useMemo, useState } from 'react'
import MemberSidebar from '../../components/MemberSidebar'
import MemberTopbar from '../../components/MemberTopbar'
import { formatPrice } from '../../lib/billing'
import { rangeFromPreset, RANGE_PRESETS } from '../../lib/dateRange'
import {
  fetchAnalyticsSource,
  filterByTier,
  countByTier,
  countBySubscriptionStatus,
  weeklyBuckets,
  revenueInRange,
  estimateMrrCents,
  topCoursesByPurchases,
  engagementSummary,
  MEMBER_TIERS,
} from '../../lib/analytics'

const TIER_META = {
  disciple: { label: 'Disciples', accent: '#C2A064' },
  leader: { label: 'Leaders', accent: '#8FA9BD' },
  pastor: { label: 'Pastors', accent: '#B4737B' },
  admin: { label: 'Admins', accent: '#E89147' },
  none: { label: 'No tier set', accent: 'rgba(240,238,229,0.4)' },
}

const selectCls = 'w-auto cursor-pointer rounded-[10px] border border-cream/[0.14] bg-cream/[0.04] px-4 py-2.5 font-serif text-[13.5px] text-cream outline-none'
const inputCls = 'w-full rounded-[10px] border border-cream/[0.14] bg-cream/[0.04] px-4 py-2.5 font-serif text-[13.5px] text-cream outline-none'

function StatCard({ label, value, valueColor, gold }) {
  return (
    <div className={`rounded-cv-lg border px-5 py-5 ${gold ? 'border-gold/25 bg-gold/[0.06]' : 'border-cream/[0.09] bg-[rgb(30,36,22)]'}`}>
      <div className={`mb-1 font-sans text-[10.5px] font-semibold uppercase tracking-[0.16em] ${gold ? 'text-[#E9CF9C]' : 'text-cream/50'}`}>{label}</div>
      <div className="font-sans text-[28px] font-bold" style={{ color: valueColor || 'white' }}>{value}</div>
    </div>
  )
}

function ChartCard({ title, weeks, format }) {
  const max = Math.max(1, ...weeks.map((w) => w.value))
  return (
    <div className="rounded-cv-lg border border-cream/[0.09] bg-[rgb(30,36,22)] px-6 py-6">
      <div className="mb-5 font-sans text-[11px] font-semibold uppercase tracking-[0.16em] text-cream/50">{title}</div>
      <div className="flex items-end gap-2 overflow-x-auto" style={{ height: 160 }}>
        {weeks.map((w, i) => (
          <div key={`${w.label}_${i}`} className="flex flex-1 min-w-[10px] flex-col items-center gap-2">
            <div className="flex flex-1 w-full items-end">
              <div
                className="w-full rounded-t-md bg-gold/70"
                style={{ height: `${Math.max(w.value > 0 ? 4 : 0, (w.value / max) * 100)}%` }}
                title={`${w.label}: ${format(w.value)}`}
              />
            </div>
            {weeks.length <= 16 && <span className="whitespace-nowrap font-sans text-[9px] uppercase tracking-[0.04em] text-cream/35">{w.label}</span>}
          </div>
        ))}
      </div>
    </div>
  )
}

export default function Analytics() {
  const [source, setSource] = useState(null) // { profiles, purchases, transactions, progress }
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [rangePreset, setRangePreset] = useState('30d')
  const [customStart, setCustomStart] = useState('')
  const [customEnd, setCustomEnd] = useState('')
  const [tierFilter, setTierFilter] = useState('all')

  useEffect(() => {
    let cancelled = false
    fetchAnalyticsSource()
      .then((data) => {
        if (!cancelled) setSource(data)
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || 'Could not load analytics.')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const profiles = source?.profiles || []
  const purchases = source?.purchases || []
  const transactions = source?.transactions || []
  const progress = source?.progress || []

  const { rangeStart, rangeEnd } = useMemo(() => {
    const earliest = profiles.length
      ? profiles.reduce((min, p) => (new Date(p.created_at) < min ? new Date(p.created_at) : min), new Date())
      : undefined
    const { start, end } = rangeFromPreset(rangePreset, { customStart, customEnd, earliest })
    return { rangeStart: start, rangeEnd: end }
  }, [rangePreset, customStart, customEnd, profiles])

  const tierFilteredProfiles = useMemo(() => filterByTier(profiles, tierFilter), [profiles, tierFilter])
  const tierCounts = useMemo(() => countByTier(profiles), [profiles])
  const statusCounts = useMemo(() => countBySubscriptionStatus(profiles), [profiles])

  const newSignups = useMemo(
    () => tierFilteredProfiles.filter((p) => { const d = new Date(p.created_at); return d >= rangeStart && d <= rangeEnd }).length,
    [tierFilteredProfiles, rangeStart, rangeEnd]
  )

  const signupWeeks = useMemo(() => {
    const rows = tierFilteredProfiles.map((p) => ({ date: p.created_at, value: 1 }))
    return weeklyBuckets(rows, rangeStart, rangeEnd)
  }, [tierFilteredProfiles, rangeStart, rangeEnd])

  const revenueWeeks = useMemo(() => {
    const purchaseRows = purchases.filter((p) => p.status === 'completed').map((p) => ({ date: p.purchased_at || p.created_at, value: p.courses?.price_cents ?? 0 }))
    const txRows = transactions.filter((t) => t.status === 'paid').map((t) => ({ date: t.occurred_at, value: t.amount_cents }))
    return weeklyBuckets([...purchaseRows, ...txRows], rangeStart, rangeEnd)
  }, [purchases, transactions, rangeStart, rangeEnd])

  const revenueCents = useMemo(() => revenueInRange(purchases, transactions, rangeStart, rangeEnd), [purchases, transactions, rangeStart, rangeEnd])
  const mrrCents = useMemo(() => estimateMrrCents(profiles, transactions), [profiles, transactions])
  const topCourses = useMemo(() => topCoursesByPurchases(purchases, rangeStart, rangeEnd), [purchases, rangeStart, rangeEnd])
  const engagement = useMemo(() => engagementSummary(progress), [progress])

  return (
    <div className="flex min-h-screen bg-ink font-sans text-cream">
      <MemberSidebar active="/admin/analytics" />
      <div className="flex flex-1 flex-col min-w-0">
        <MemberTopbar searchPlaceholder="Search…" />
        <main className="mx-auto w-full max-w-[1180px] flex-1 px-8 pb-16 pt-9">
          <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="mb-1 font-sans text-[28px] font-bold uppercase leading-[1.05] text-white">Analytics</h1>
              <p className="font-serif text-[15px] text-cream/60">Growth, revenue, and engagement across the whole platform.</p>
            </div>
            <div className="flex items-center gap-3">
              <select value={tierFilter} onChange={(e) => setTierFilter(e.target.value)} style={{ colorScheme: 'dark' }} className={selectCls}>
                <option value="all">All tiers</option>
                {MEMBER_TIERS.map((t) => (
                  <option key={t} value={t}>{TIER_META[t]?.label || t}</option>
                ))}
              </select>
              <select value={rangePreset} onChange={(e) => setRangePreset(e.target.value)} style={{ colorScheme: 'dark' }} className={selectCls}>
                {RANGE_PRESETS.map((r) => (
                  <option key={r.key} value={r.key}>{r.label}</option>
                ))}
              </select>
            </div>
          </div>

          {rangePreset === 'custom' && (
            <div className="mb-6 flex flex-wrap items-center gap-3">
              <div>
                <label className="mb-1 block font-sans text-[10.5px] font-semibold uppercase tracking-[0.14em] text-cream/50">From</label>
                <input type="date" value={customStart} onChange={(e) => setCustomStart(e.target.value)} style={{ colorScheme: 'dark' }} className={inputCls} />
              </div>
              <div>
                <label className="mb-1 block font-sans text-[10.5px] font-semibold uppercase tracking-[0.14em] text-cream/50">To</label>
                <input type="date" value={customEnd} onChange={(e) => setCustomEnd(e.target.value)} style={{ colorScheme: 'dark' }} className={inputCls} />
              </div>
            </div>
          )}

          {loading && <p className="font-serif text-cream/50">Loading…</p>}
          {!loading && error && <p className="font-serif text-[#D8888A]">{error}</p>}

          {!loading && !error && (
            <>
              <div className="mb-4 grid grid-cols-4 gap-4">
                <StatCard label={tierFilter === 'all' ? 'Total members' : `${TIER_META[tierFilter]?.label || tierFilter} members`} value={tierFilteredProfiles.length} />
                <StatCard label="New signups (range)" value={newSignups} />
                <StatCard label="Active subscriptions" value={statusCounts.active} valueColor="#9BC08A" />
                <StatCard label="At-risk (failed payment)" value={statusCounts.failed} valueColor={statusCounts.failed > 0 ? '#D8888A' : undefined} />
              </div>
              <div className="mb-6 grid grid-cols-3 gap-4">
                <StatCard label="Estimated MRR" value={formatPrice(mrrCents)} gold />
                <StatCard label="Revenue (range)" value={formatPrice(revenueCents)} />
                <StatCard label="Cancelled" value={statusCounts.cancelled} />
              </div>

              <div className="mb-6 grid grid-cols-5 gap-4">
                {Object.entries(TIER_META).map(([key, meta]) => (
                  <div key={key} className="rounded-cv-lg border border-cream/[0.09] bg-[rgb(30,36,22)] px-5 py-5">
                    <div className="mb-1 font-sans text-[10.5px] font-semibold uppercase tracking-[0.16em]" style={{ color: meta.accent }}>
                      {meta.label}
                    </div>
                    <div className="font-sans text-[28px] font-bold text-white">{tierCounts[key]}</div>
                  </div>
                ))}
              </div>

              <div className="mb-6 grid grid-cols-2 gap-4">
                <ChartCard title="Signups per week" weeks={signupWeeks} format={(v) => `${v}`} />
                <ChartCard title="Revenue per week" weeks={revenueWeeks} format={formatPrice} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-cv-lg border border-cream/[0.09] bg-[rgb(30,36,22)] px-6 py-6">
                  <div className="mb-4 font-sans text-[11px] font-semibold uppercase tracking-[0.16em] text-cream/50">Course engagement</div>
                  <div className="flex gap-7">
                    <div>
                      <div className="font-sans text-[24px] font-bold text-white">{engagement.avgPercent}%</div>
                      <div className="font-serif text-[12.5px] text-cream/50">Avg. watch completion</div>
                    </div>
                    <div>
                      <div className="font-sans text-[24px] font-bold text-white">{engagement.lessonsCompleted}</div>
                      <div className="font-serif text-[12.5px] text-cream/50">Lessons completed</div>
                    </div>
                    <div>
                      <div className="font-sans text-[24px] font-bold text-white">{engagement.lessonsStarted}</div>
                      <div className="font-serif text-[12.5px] text-cream/50">Lessons started</div>
                    </div>
                  </div>
                </div>
                <div className="rounded-cv-lg border border-cream/[0.09] bg-[rgb(30,36,22)] px-6 py-6">
                  <div className="mb-4 font-sans text-[11px] font-semibold uppercase tracking-[0.16em] text-cream/50">Top courses (range)</div>
                  {topCourses.length === 0 && <p className="font-serif text-[13.5px] text-cream/40">No purchases in this range.</p>}
                  <div className="flex flex-col gap-2.5">
                    {topCourses.map((c, i) => (
                      <div key={`${c.title}_${i}`} className="flex items-center justify-between gap-3">
                        <span className="truncate font-serif text-[13.5px] text-cream/80">{i + 1}. {c.title}</span>
                        <span className="shrink-0 font-sans text-[12.5px] font-semibold text-cream/60">{c.purchases} purchase{c.purchases === 1 ? '' : 's'} · {formatPrice(c.revenueCents)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  )
}
