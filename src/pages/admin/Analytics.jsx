import { useEffect, useState } from 'react'
import MemberSidebar from '../../components/MemberSidebar'
import MemberTopbar from '../../components/MemberTopbar'
import { fetchMemberCounts, fetchSignupGrowth } from '../../lib/analytics'

const TIER_META = {
  disciple: { label: 'Disciples', accent: '#C2A064' },
  leader: { label: 'Leaders', accent: '#8FA9BD' },
  pastor: { label: 'Pastors', accent: '#B4737B' },
  admin: { label: 'Admins', accent: '#E89147' },
  none: { label: 'No tier set', accent: 'rgba(240,238,229,0.4)' },
}

export default function Analytics() {
  const [counts, setCounts] = useState(null)
  const [weeks, setWeeks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const [memberCounts, growth] = await Promise.all([fetchMemberCounts(), fetchSignupGrowth()])
        if (cancelled) return
        setCounts(memberCounts)
        setWeeks(growth)
      } catch (err) {
        if (!cancelled) setError(err.message)
      }
      if (!cancelled) setLoading(false)
    }
    load()
    return () => {
      cancelled = true
    }
  }, [])

  const maxWeekCount = Math.max(1, ...weeks.map((w) => w.count))
  // 30-day retention proxy: share of members who joined more than 30 days
  // ago and are still counted (there's no activity/session tracking yet
  // to measure "still active" more precisely than "still a member").
  const totalActive = counts?.total ?? 0

  return (
    <div className="flex min-h-screen bg-ink font-sans text-cream">
      <MemberSidebar active="/admin/analytics" />
      <div className="flex flex-1 flex-col min-w-0">
        <MemberTopbar searchPlaceholder="Search…" />
        <main className="mx-auto w-full max-w-[1180px] flex-1 px-8 pb-16 pt-9">
          <h1 className="mb-1 font-sans text-[28px] font-bold uppercase leading-[1.05] text-white">
            Analytics
          </h1>
          <p className="mb-6 font-serif text-[15px] text-cream/60">
            Member counts and signup growth.
          </p>

          {loading && <p className="font-serif text-cream/50">Loading…</p>}
          {!loading && error && <p className="font-serif text-[#D8888A]">{error}</p>}

          {!loading && !error && counts && (
            <>
              <div className="mb-6 grid grid-cols-5 gap-4">
                <div className="rounded-cv-lg border border-cream/[0.09] bg-[rgb(30,36,22)] px-5 py-5">
                  <div className="mb-1 font-sans text-[10.5px] font-semibold uppercase tracking-[0.16em] text-cream/50">
                    Total members
                  </div>
                  <div className="font-sans text-[28px] font-bold text-white">{totalActive}</div>
                </div>
                {Object.entries(TIER_META).map(([key, meta]) => (
                  <div key={key} className="rounded-cv-lg border border-cream/[0.09] bg-[rgb(30,36,22)] px-5 py-5">
                    <div
                      className="mb-1 font-sans text-[10.5px] font-semibold uppercase tracking-[0.16em]"
                      style={{ color: meta.accent }}
                    >
                      {meta.label}
                    </div>
                    <div className="font-sans text-[28px] font-bold text-white">{counts.byTier[key]}</div>
                  </div>
                ))}
              </div>

              <div className="rounded-cv-lg border border-cream/[0.09] bg-[rgb(30,36,22)] px-6 py-6">
                <div className="mb-5 font-sans text-[11px] font-semibold uppercase tracking-[0.16em] text-cream/50">
                  Signups per week (last 8 weeks)
                </div>
                <div className="flex items-end gap-3" style={{ height: 160 }}>
                  {weeks.map((w) => (
                    <div key={w.label} className="flex flex-1 flex-col items-center gap-2">
                      <div className="flex flex-1 w-full items-end">
                        <div
                          className="w-full rounded-t-md bg-gold/70"
                          style={{ height: `${Math.max(4, (w.count / maxWeekCount) * 100)}%` }}
                          title={`${w.count} signups`}
                        />
                      </div>
                      <span className="font-sans text-[10px] font-semibold text-cream/45">{w.count}</span>
                      <span className="font-sans text-[9.5px] uppercase tracking-[0.06em] text-cream/35">{w.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  )
}
