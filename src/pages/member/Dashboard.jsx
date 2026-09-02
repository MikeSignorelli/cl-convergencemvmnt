import { useState } from 'react'
import { Link } from 'react-router-dom'
import MemberSidebar from '../../components/MemberSidebar'
import MemberTopbar from '../../components/MemberTopbar'
import { useAuth } from '../../lib/AuthContext'
import continueWatchingImg from '../../assets/app-images/dashboard-continue-watching.jpg'
import dailyResetImg from '../../assets/app-images/dashboard-daily-reset.jpg'

const TIERS = {
  disciple: {
    key: 'disciple',
    name: 'Sarah Mitchell',
    first: 'Sarah',
    initials: 'SM',
    label: 'Disciple',
    accent: '#C2A064',
    accentSoft: 'rgba(194,160,100,0.14)',
    streak: 12,
    streakNext: 13,
    course: 'Inherit Your Freedom',
    episode: 'Week 2: Identifying Root Beliefs',
    pct: 34,
    pctW: '34%',
    daily: 'Morning Mindset Reset',
    liveTitle: 'Hot Seat Coaching',
    liveDate: 'Thursday · Aug 27 · 8:00 PM ET',
    points: '1,240',
    badges: 4,
  },
  leader: {
    key: 'leader',
    name: 'David Richardson',
    first: 'David',
    initials: 'DR',
    label: 'Leader',
    accent: '#8FA9BD',
    accentSoft: 'rgba(143,169,189,0.16)',
    streak: 23,
    streakNext: 24,
    course: 'The Breakthrough Protocol',
    episode: "The Leader's Daily Reset",
    pct: 58,
    pctW: '58%',
    daily: "The Leader's Daily Reset",
    liveTitle: 'Boardroom Session',
    liveDate: 'Wednesday · Sept 3 · 12:00 PM ET',
    points: '2,860',
    badges: 7,
  },
  pastor: {
    key: 'pastor',
    name: 'Pastor James Thompson',
    first: 'James',
    initials: 'JT',
    label: 'Pastor',
    accent: '#B4737B',
    accentSoft: 'rgba(180,115,123,0.16)',
    streak: 8,
    streakNext: 9,
    course: 'The Movement: Church Systems',
    episode: 'Module 3 · Volunteer Pipeline',
    pct: 42,
    pctW: '42%',
    daily: 'Morning Mindset Reset',
    liveTitle: 'Regional Cluster Call',
    liveDate: 'Tuesday · Sept 9 · 1:00 PM ET',
    points: '980',
    badges: 3,
  },
}

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

function hexToRgba(hex, alpha) {
  const h = hex.replace('#', '')
  const r = parseInt(h.substring(0, 2), 16)
  const g = parseInt(h.substring(2, 4), 16)
  const b = parseInt(h.substring(4, 6), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

function todayLabel() {
  const d = new Date()
  return `${DAYS[d.getDay()]}, ${MONTHS[d.getMonth()]} ${d.getDate()}`
}

export default function Dashboard() {
  const { profile, isAdmin, previewTier, setPreviewTier } = useAuth()
  const tier = isAdmin ? previewTier || 'disciple' : profile?.tier || 'disciple'
  const readOnly = isAdmin
  const [dailyDone, setDailyDone] = useState(false)
  const t = TIERS[tier]
  const freedomDay = t.streak
  const freedomPctW = `${((t.streak / 90) * 100).toFixed(1)}%`

  return (
    <div className="flex min-h-screen bg-ink font-sans text-cream">
      <MemberSidebar active="/dashboard" />
      <div className="flex flex-1 flex-col min-w-0">
        <MemberTopbar streak={t.streak} />

        <main className="mx-auto w-full max-w-[1180px] flex-1 px-8 pb-16 pt-9">
          <div className="mb-[30px] flex flex-wrap items-center justify-between gap-5">
            <div>
              <div className="mb-1.5 font-sans text-[11px] font-semibold uppercase tracking-[0.2em] text-cream/42">
                {todayLabel()}
              </div>
              <h1 className="m-0 font-sans text-[32px] font-bold uppercase leading-[1.04] tracking-[0.005em] text-white">
                Welcome back, {t.first}
              </h1>
            </div>

            <div className="flex flex-wrap items-center gap-4">
              {isAdmin && (
                <div className="flex gap-1 rounded-full border border-cream/10 bg-cream/5 p-1">
                  {Object.values(TIERS).map((tv) => {
                    const active = tv.key === tier
                    return (
                      <button
                        key={tv.key}
                        type="button"
                        onClick={() => setPreviewTier(tv.key)}
                        className="rounded-full px-[18px] py-2 font-sans text-[11px] font-semibold uppercase tracking-[0.12em]"
                        style={
                          active
                            ? { background: t.accent, color: '#171C10' }
                            : { background: 'transparent', color: 'rgba(240,238,229,0.6)' }
                        }
                      >
                        {tv.label}
                      </button>
                    )
                  })}
                </div>
              )}

              <div className="flex gap-3.5">
                <Link
                  to="/onboarding"
                  className="font-sans text-[11px] font-semibold uppercase tracking-[0.12em] text-cream/50 no-underline hover:text-cream/80"
                >
                  Onboarding ↗
                </Link>
                <a
                  href="#"
                  className="font-sans text-[11px] font-semibold uppercase tracking-[0.12em] text-cream/50 no-underline hover:text-cream/80"
                >
                  Mobile app ↗
                </a>
              </div>
            </div>
          </div>

          {readOnly && (
            <div className="mb-[22px] flex items-center gap-2.5 rounded-cv-lg border border-gold/25 bg-gold/[0.08] px-5 py-3">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#E9CF9C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
              <span className="font-sans text-[12.5px] font-semibold uppercase tracking-[0.08em] text-[#E9CF9C]">
                Read-only preview — viewing the {t.label} experience as admin
              </span>
            </div>
          )}

          <div className="grid grid-cols-[minmax(0,1.55fr)_minmax(300px,1fr)] items-start gap-[22px]">
            {/* Left column */}
            <div className="flex min-w-0 flex-col gap-[22px]">
              <Link
                to="/player"
                className="relative block overflow-hidden rounded-cv-lg border border-cream/[0.09] bg-[rgb(30,36,22)] text-inherit no-underline"
              >
                <div className="relative aspect-[16/7] overflow-hidden">
                  <img
                    src={continueWatchingImg}
                    alt=""
                    className="block h-full w-full object-cover"
                    style={{ filter: 'brightness(0.72)' }}
                  />
                  <div
                    className="absolute inset-0"
                    style={{ background: 'linear-gradient(transparent 30%, rgba(18,21,12,0.92))' }}
                  />
                  <div className="absolute bottom-5 left-6 right-[100px]">
                    <div
                      className="mb-2 font-sans text-[11px] font-semibold uppercase tracking-[0.2em]"
                      style={{ color: t.accent }}
                    >
                      Continue watching
                    </div>
                    <div className="mb-1 font-sans text-2xl font-bold uppercase leading-[1.05] text-white">
                      {t.course}
                    </div>
                    <div className="font-serif text-[15.5px] text-cream/78">{t.episode}</div>
                  </div>
                  <div
                    className="absolute bottom-[22px] right-6 flex h-[52px] w-[52px] items-center justify-center rounded-full shadow-[0_12px_28px_-8px_rgba(0,0,0,0.6)]"
                    style={{ background: t.accent }}
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="#171C10">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </div>
                </div>
                <div className="flex items-center gap-3.5 px-6 py-3.5">
                  <div className="h-[5px] flex-1 overflow-hidden rounded-full bg-cream/10">
                    <div
                      className="h-full rounded-full"
                      style={{ background: t.accent, width: t.pctW }}
                    />
                  </div>
                  <span className="font-sans text-xs font-semibold tracking-[0.08em] text-cream/60">
                    {t.pct}% complete
                  </span>
                </div>
              </Link>

              <div className="flex flex-wrap items-center gap-[18px] rounded-cv-lg border border-cream/[0.09] bg-[rgb(30,36,22)] px-6 py-5">
                <div className="relative h-[78px] w-[78px] shrink-0 overflow-hidden rounded-xl">
                  <img
                    src={dailyResetImg}
                    alt=""
                    className="block h-full w-full object-cover"
                    style={{ filter: 'brightness(0.8)' }}
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="#fff">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </div>
                </div>
                <div className="min-w-[200px] flex-1">
                  <div
                    className="mb-1 font-sans text-[10.5px] font-semibold uppercase tracking-[0.18em]"
                    style={{ color: t.accent }}
                  >
                    Today's reset · 3 min
                  </div>
                  <div className="mb-0.5 font-sans text-[17px] font-semibold tracking-[0.02em]">
                    {t.daily}
                  </div>
                  <div className="font-serif text-sm text-cream/60">
                    Keep your streak alive — day {t.streakNext} is waiting.
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setDailyDone(true)}
                  disabled={dailyDone || readOnly}
                  className="rounded-full px-[22px] py-3 font-sans text-xs font-semibold uppercase tracking-[0.12em] disabled:cursor-default"
                  style={{
                    background: dailyDone || readOnly ? 'rgba(240,238,229,0.12)' : t.accent,
                    color: dailyDone || readOnly ? 'rgba(240,238,229,0.6)' : '#171C10',
                  }}
                >
                  {dailyDone ? 'Completed' : 'Mark complete'}
                </button>
              </div>

              <div className="rounded-cv-lg border border-cream/[0.09] bg-[rgb(30,36,22)] px-6 py-[22px]">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="m-0 font-sans text-[15px] font-bold uppercase tracking-[0.1em] text-white">
                    From the community
                  </h2>
                  <a
                    href="#"
                    className="font-sans text-[11.5px] font-semibold uppercase tracking-[0.12em] text-gold no-underline"
                  >
                    View all →
                  </a>
                </div>
                <div className="flex flex-col gap-3.5">
                  <div className="flex gap-3 rounded-xl border border-cream/[0.06] bg-cream/[0.03] px-4 py-3.5">
                    <div className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-full bg-[rgba(143,169,189,0.16)] font-sans text-xs font-bold text-[#8FA9BD]">
                      MR
                    </div>
                    <div className="min-w-0">
                      <div className="mb-0.5 flex items-baseline gap-2">
                        <span className="font-sans text-[13.5px] font-semibold">Marcus R.</span>
                        <span className="font-sans text-[11px] font-medium tracking-[0.06em] text-cream/40">
                          2h ago · Intensive
                        </span>
                      </div>
                      <div className="font-serif text-[14.5px] leading-[1.5] text-cream/78">
                        "Day 12 of the intensive and I'm finally seeing breakthrough in my relationship with my father…"
                      </div>
                      <div className="mt-2 flex gap-4 font-sans text-[11.5px] font-semibold tracking-[0.06em] text-cream/45">
                        <span>24 likes</span>
                        <span>9 replies</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-3 rounded-xl border border-cream/[0.06] bg-cream/[0.03] px-4 py-3.5">
                    <div className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-full bg-[rgba(180,115,123,0.16)] font-sans text-xs font-bold text-[#B4737B]">
                      KL
                    </div>
                    <div className="min-w-0">
                      <div className="mb-0.5 flex items-baseline gap-2">
                        <span className="font-sans text-[13.5px] font-semibold">Kayla L.</span>
                        <span className="font-sans text-[11px] font-medium tracking-[0.06em] text-cream/40">
                          5h ago · Open forum
                        </span>
                      </div>
                      <div className="font-serif text-[14.5px] leading-[1.5] text-cream/78">
                        "Question for the group: How do you handle triggers at work?"
                      </div>
                      <div className="mt-2 flex gap-4 font-sans text-[11.5px] font-semibold tracking-[0.06em] text-cream/45">
                        <span>11 likes</span>
                        <span>17 replies</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right column */}
            <div className="flex min-w-0 flex-col gap-[22px]">
              <div
                className="rounded-cv-lg border px-[22px] py-5"
                style={{
                  borderColor: hexToRgba(t.accent, 0.22),
                  background: `linear-gradient(160deg, ${hexToRgba(t.accent, 0.1)}, rgba(30,36,22,0.4))`,
                }}
              >
                <div className="mb-3 flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-[#E89147]" />
                  <span className="font-sans text-[10.5px] font-semibold uppercase tracking-[0.2em] text-cream/55">
                    Next live session
                  </span>
                </div>
                <div className="mb-1.5 font-sans text-[19px] font-bold uppercase leading-[1.12] text-white">
                  {t.liveTitle}
                </div>
                <div className="mb-4 font-serif text-[14.5px] text-cream/70">
                  {t.liveDate} · with Mike Signorelli
                </div>
                <button
                  type="button"
                  disabled={readOnly}
                  className="w-full rounded-full py-3 font-sans text-xs font-semibold uppercase tracking-[0.12em] disabled:cursor-default disabled:opacity-50"
                  style={{ background: t.accent, color: '#171C10' }}
                >
                  Add to calendar
                </button>
              </div>

              <div className="flex flex-col gap-[22px]">
                <div className="rounded-cv-lg border border-cream/[0.09] bg-[rgb(30,36,22)] px-[22px] py-5">
                  <div
                    className="mb-2.5 font-sans text-[10.5px] font-semibold uppercase tracking-[0.2em]"
                    style={{ color: t.accent }}
                  >
                    Freedom Journey
                  </div>
                  <div className="mb-1 flex items-baseline gap-2">
                    <span className="font-sans text-[30px] font-bold text-white">Day {freedomDay}</span>
                    <span className="font-sans text-sm font-medium text-cream/50">of 90</span>
                  </div>
                  <div className="mb-3.5 font-serif text-[13.5px] text-cream/62">
                    Phase 1 · Mapping your patterns
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-cream/10">
                    <div
                      className="h-full rounded-full"
                      style={{ background: t.accent, width: freedomPctW }}
                    />
                  </div>
                </div>

                <div className="flex items-center gap-3 rounded-cv-lg border border-cream/[0.09] bg-[rgb(30,36,22)] px-[22px] py-[18px]">
                  <div className="flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-full font-sans text-[13px] font-bold" style={{ background: t.accentSoft, color: t.accent }}>
                    RM
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-sans text-sm font-semibold">Rachel M.</div>
                    <div className="font-serif text-[12.5px] text-cream/55">
                      Accountability partner · checked in today
                    </div>
                  </div>
                  <a
                    href="#"
                    onClick={(e) => readOnly && e.preventDefault()}
                    aria-disabled={readOnly}
                    className={`shrink-0 font-sans text-[11px] font-semibold uppercase tracking-[0.1em] no-underline ${readOnly ? 'pointer-events-none opacity-50' : ''}`}
                    style={{ color: t.accent }}
                  >
                    Check in →
                  </a>
                </div>

                <div className="flex items-center gap-3 rounded-cv-lg border border-cream/[0.09] bg-[rgb(30,36,22)] px-[22px] py-[18px]">
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke={t.accent}
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="shrink-0"
                  >
                    <path d="M12 2v4" />
                    <path d="m6.4 6.4 2.8 2.8" />
                    <path d="M2 12h4" />
                    <path d="m6.4 17.6 2.8-2.8" />
                    <path d="M12 22v-4" />
                    <path d="m17.6 17.6-2.8-2.8" />
                    <path d="M22 12h-4" />
                    <path d="m17.6 6.4-2.8 2.8" />
                  </svg>
                  <div className="flex-1">
                    <div className="font-sans text-sm font-semibold">Hot seat lottery</div>
                    <div className="font-serif text-[12.5px] text-cream/55">
                      You're entered — drawing this Friday
                    </div>
                  </div>
                  <span
                    className="shrink-0 rounded-full px-3 py-1.5 font-sans text-[10.5px] font-semibold uppercase tracking-[0.12em]"
                    style={{
                      background: t.accentSoft,
                      border: `1px solid ${hexToRgba(t.accent, 0.3)}`,
                      color: '#E9CF9C',
                    }}
                  >
                    Entered
                  </span>
                </div>
              </div>

              <Link
                to="/progress"
                className="flex items-center gap-3 rounded-cv-lg border border-cream/[0.09] bg-[rgb(30,36,22)] px-[22px] py-[18px] text-inherit no-underline"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#E89147" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
                  <circle cx="12" cy="8" r="6" />
                  <path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11" />
                </svg>
                <div className="flex-1">
                  <div className="font-sans text-[17px] font-bold">{t.points} points</div>
                  <div className="font-serif text-[12.5px] text-cream/55">
                    {t.badges} badges earned · view progress
                  </div>
                </div>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(240,238,229,0.4)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m9 18 6-6-6-6" />
                </svg>
              </Link>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
