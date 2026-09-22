import { useEffect, useMemo, useState } from 'react'
import MemberSidebar from '../../components/MemberSidebar'
import MemberTopbar from '../../components/MemberTopbar'
import { formatPrice } from '../../lib/billing'
import { fetchAllTransactions, isRevenue, dailyRevenue } from '../../lib/orders'
import { rangeFromPreset } from '../../lib/dateRange'

const PAGE_SIZE = 20
const MAX_CHART_DAYS = 60
const selectCls = 'w-auto cursor-pointer rounded-[10px] border border-cream/[0.14] bg-cream/[0.04] px-4 py-2.5 font-serif text-[13.5px] text-cream outline-none'
const inputCls = 'w-full rounded-[10px] border border-cream/[0.14] bg-cream/[0.04] px-4 py-2.5 font-serif text-[13.5px] text-cream outline-none'

const STATUS_STYLES = {
  paid: { label: 'Paid', bg: 'rgba(155,192,138,0.16)', text: '#9BC08A' },
  completed: { label: 'Paid', bg: 'rgba(155,192,138,0.16)', text: '#9BC08A' },
  pending: { label: 'Pending', bg: 'rgba(240,238,229,0.1)', text: 'rgba(240,238,229,0.6)' },
  failed: { label: 'Failed', bg: 'rgba(216,136,138,0.16)', text: '#D8888A' },
}
function StatusPill({ status }) {
  const c = STATUS_STYLES[status] || { label: status || '—', bg: 'rgba(240,238,229,0.1)', text: 'rgba(240,238,229,0.6)' }
  return (
    <span className="whitespace-nowrap rounded-full px-3 py-1 font-sans text-[10.5px] font-semibold uppercase tracking-[0.08em]" style={{ background: c.bg, color: c.text }}>
      {c.label}
    </span>
  )
}

function fmtDate(iso) {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleString(undefined, { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })
}
function fmtDay(key) {
  const [y, m, d] = key.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}
const RANGE_PRESETS = [
  { key: 'today', label: 'Today' },
  { key: '7d', label: 'Last 7 days' },
  { key: '30d', label: 'Last 30 days' },
  { key: 'month', label: 'This month' },
  { key: 'all', label: 'All time' },
  { key: 'custom', label: 'Custom range' },
]

export default function Orders() {
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [rangePreset, setRangePreset] = useState('30d')
  const [customStart, setCustomStart] = useState('')
  const [customEnd, setCustomEnd] = useState('')

  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [page, setPage] = useState(1)

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const rows = await fetchAllTransactions()
        if (!cancelled) setTransactions(rows)
      } catch (err) {
        if (!cancelled) setError(err.message || 'Could not load transactions.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [])

  const { rangeStart, rangeEnd } = useMemo(() => {
    const earliest = transactions.length
      ? transactions.reduce((min, t) => (new Date(t.date) < min ? new Date(t.date) : min), new Date())
      : undefined
    const { start, end } = rangeFromPreset(rangePreset, { customStart, customEnd, earliest })
    return { rangeStart: start, rangeEnd: end }
  }, [rangePreset, customStart, customEnd, transactions])

  const inRange = useMemo(
    () => transactions.filter((t) => { const d = new Date(t.date); return d >= rangeStart && d <= rangeEnd }),
    [transactions, rangeStart, rangeEnd]
  )
  const revenueInRange = useMemo(() => inRange.filter(isRevenue), [inRange])
  const totalRevenueCents = useMemo(() => revenueInRange.reduce((s, t) => s + t.amountCents, 0), [revenueInRange])
  const membershipRevenueCents = useMemo(
    () => revenueInRange.filter((t) => t.type === 'membership').reduce((s, t) => s + t.amountCents, 0),
    [revenueInRange]
  )
  const courseRevenueCents = totalRevenueCents - membershipRevenueCents
  const failedCount = useMemo(() => inRange.filter((t) => t.status === 'failed').length, [inRange])

  const chartDays = Math.round((rangeEnd - rangeStart) / 86400000) + 1
  const chart = useMemo(
    () => (chartDays <= MAX_CHART_DAYS ? dailyRevenue(inRange, rangeStart, rangeEnd) : []),
    [inRange, rangeStart, rangeEnd, chartDays]
  )
  const maxDay = Math.max(1, ...chart.map((d) => d.amountCents))

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return inRange.filter((t) => {
      if (q && !t.memberName.toLowerCase().includes(q) && !t.description.toLowerCase().includes(q)) return false
      if (typeFilter !== 'all' && t.type !== typeFilter) return false
      if (statusFilter !== 'all' && t.status !== statusFilter) return false
      return true
    })
  }, [inRange, search, typeFilter, statusFilter])

  useEffect(() => {
    setPage(1)
  }, [rangePreset, customStart, customEnd, search, typeFilter, statusFilter])

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const currentPage = Math.min(page, pageCount)
  const pageRows = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)

  return (
    <div className="flex min-h-screen bg-ink font-sans text-cream">
      <MemberSidebar active="/admin/orders" />
      <div className="flex flex-1 flex-col min-w-0">
        <MemberTopbar searchPlaceholder="Search orders…" search={search} onSearch={setSearch} />
        <main className="mx-auto w-full max-w-[1180px] flex-1 px-8 pb-16 pt-9">
          <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="mb-1 font-sans text-[28px] font-bold uppercase leading-[1.05] text-white">Orders</h1>
              <p className="font-serif text-[15px] text-cream/60">Every membership charge and course purchase, across every member.</p>
            </div>
            <select value={rangePreset} onChange={(e) => setRangePreset(e.target.value)} style={{ colorScheme: 'dark' }} className={selectCls}>
              {RANGE_PRESETS.map((r) => (
                <option key={r.key} value={r.key}>{r.label}</option>
              ))}
            </select>
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

          {error && <p className="mb-4 font-serif text-[13px] text-[#D8888A]">{error}</p>}
          {loading && <p className="font-serif text-cream/50">Loading…</p>}

          {!loading && !error && (
            <>
              <div className="mb-6 grid grid-cols-4 gap-4">
                <div className="rounded-cv-lg border border-gold/25 bg-gold/[0.06] px-5 py-5">
                  <div className="mb-1 font-sans text-[10.5px] font-semibold uppercase tracking-[0.16em] text-[#E9CF9C]">Total revenue</div>
                  <div className="font-sans text-[28px] font-bold text-white">{formatPrice(totalRevenueCents)}</div>
                </div>
                <div className="rounded-cv-lg border border-cream/[0.09] bg-[rgb(30,36,22)] px-5 py-5">
                  <div className="mb-1 font-sans text-[10.5px] font-semibold uppercase tracking-[0.16em] text-cream/50">Membership</div>
                  <div className="font-sans text-[28px] font-bold text-white">{formatPrice(membershipRevenueCents)}</div>
                </div>
                <div className="rounded-cv-lg border border-cream/[0.09] bg-[rgb(30,36,22)] px-5 py-5">
                  <div className="mb-1 font-sans text-[10.5px] font-semibold uppercase tracking-[0.16em] text-cream/50">Courses</div>
                  <div className="font-sans text-[28px] font-bold text-white">{formatPrice(courseRevenueCents)}</div>
                </div>
                <div className="rounded-cv-lg border border-cream/[0.09] bg-[rgb(30,36,22)] px-5 py-5">
                  <div className="mb-1 font-sans text-[10.5px] font-semibold uppercase tracking-[0.16em] text-cream/50">Failed charges</div>
                  <div className="font-sans text-[28px] font-bold" style={{ color: failedCount > 0 ? '#D8888A' : 'white' }}>{failedCount}</div>
                </div>
              </div>

              <div className="mb-6 rounded-cv-lg border border-cream/[0.09] bg-[rgb(30,36,22)] px-6 py-6">
                <div className="mb-5 font-sans text-[11px] font-semibold uppercase tracking-[0.16em] text-cream/50">
                  Daily revenue {chartDays > MAX_CHART_DAYS && '— range too wide to chart by day, showing totals above only'}
                </div>
                {chartDays <= MAX_CHART_DAYS && (
                  <div className="flex items-end gap-1.5 overflow-x-auto" style={{ height: 160 }}>
                    {chart.map((d) => (
                      <div key={d.key} className="flex flex-1 min-w-[6px] flex-col items-center gap-2">
                        <div className="flex flex-1 w-full items-end">
                          <div
                            className="w-full rounded-t-md bg-gold/70"
                            style={{ height: `${Math.max(d.amountCents > 0 ? 4 : 0, (d.amountCents / maxDay) * 100)}%` }}
                            title={`${fmtDay(d.key)}: ${formatPrice(d.amountCents)}`}
                          />
                        </div>
                        {chart.length <= 31 && (
                          <span className="whitespace-nowrap font-sans text-[9px] uppercase tracking-[0.04em] text-cream/35">{fmtDay(d.key)}</span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="mb-4 flex flex-wrap items-center gap-3">
                <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} style={{ colorScheme: 'dark' }} className={selectCls}>
                  <option value="all">All types</option>
                  <option value="course">Course</option>
                  <option value="membership">Membership</option>
                </select>
                <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={{ colorScheme: 'dark' }} className={selectCls}>
                  <option value="all">All statuses</option>
                  <option value="completed">Paid (course)</option>
                  <option value="paid">Paid (membership)</option>
                  <option value="pending">Pending</option>
                  <option value="failed">Failed</option>
                </select>
                <span className="ml-auto font-serif text-[12.5px] text-cream/50">{filtered.length} order{filtered.length === 1 ? '' : 's'}</span>
              </div>

              <div className="overflow-hidden rounded-cv-lg border border-cream/[0.09]">
                <table className="w-full border-collapse text-left">
                  <thead>
                    <tr className="border-b border-cream/[0.09] bg-cream/[0.03]">
                      <th className="px-5 py-3 font-sans text-[11px] font-semibold uppercase tracking-[0.12em] text-cream/50">Member</th>
                      <th className="px-5 py-3 font-sans text-[11px] font-semibold uppercase tracking-[0.12em] text-cream/50">Item</th>
                      <th className="px-5 py-3 font-sans text-[11px] font-semibold uppercase tracking-[0.12em] text-cream/50">Date</th>
                      <th className="px-5 py-3 font-sans text-[11px] font-semibold uppercase tracking-[0.12em] text-cream/50">Amount</th>
                      <th className="px-5 py-3 font-sans text-[11px] font-semibold uppercase tracking-[0.12em] text-cream/50">Status</th>
                      <th className="px-5 py-3 font-sans text-[11px] font-semibold uppercase tracking-[0.12em] text-cream/50" />
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.length === 0 && (
                      <tr><td colSpan={6} className="px-5 py-6 text-center font-serif text-cream/50">No orders match this range or filters.</td></tr>
                    )}
                    {pageRows.map((t) => (
                      <tr key={t.id} className="border-b border-cream/[0.06] last:border-b-0">
                        <td className="px-5 py-3.5 font-sans text-sm font-medium">{t.memberName}</td>
                        <td className="px-5 py-3.5 font-serif text-sm text-cream/70">
                          {t.description}
                          <span className="ml-2 font-sans text-[9.5px] font-semibold uppercase tracking-[0.08em] text-cream/35">{t.type}</span>
                        </td>
                        <td className="px-5 py-3.5 font-serif text-sm text-cream/60">{fmtDate(t.date)}</td>
                        <td className="px-5 py-3.5 font-sans text-sm font-semibold tabular-nums text-cream/85">{formatPrice(t.amountCents)}</td>
                        <td className="px-5 py-3.5"><StatusPill status={t.status} /></td>
                        <td className="whitespace-nowrap px-5 py-3.5 text-right">
                          {t.receiptUrl && (
                            <a href={t.receiptUrl} target="_blank" rel="noopener noreferrer" className="font-sans text-[11px] font-semibold uppercase tracking-[0.1em] text-gold no-underline">
                              Receipt ↗
                            </a>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {filtered.length > 0 && pageCount > 1 && (
                <div className="mt-4 flex items-center justify-between gap-4">
                  <span className="font-serif text-[12.5px] text-cream/50">Page {currentPage} of {pageCount}</span>
                  <div className="flex items-center gap-2">
                    <button type="button" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={currentPage <= 1} className="cursor-pointer rounded-full border border-cream/[0.14] bg-transparent px-4 py-2 font-sans text-[11px] font-semibold uppercase tracking-[0.1em] text-cream/70 disabled:cursor-not-allowed disabled:opacity-40">← Prev</button>
                    <button type="button" onClick={() => setPage((p) => Math.min(pageCount, p + 1))} disabled={currentPage >= pageCount} className="cursor-pointer rounded-full border border-cream/[0.14] bg-transparent px-4 py-2 font-sans text-[11px] font-semibold uppercase tracking-[0.1em] text-cream/70 disabled:cursor-not-allowed disabled:opacity-40">Next →</button>
                  </div>
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  )
}
