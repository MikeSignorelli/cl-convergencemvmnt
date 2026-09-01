import { Link } from 'react-router-dom'
import logo from '../../assets/images/convergence-mvmnt.png'
import heroImg from '../../assets/app-images/course-detail-1.jpg'
import ep1Img from '../../assets/app-images/course-detail-2.jpg'
import ep4Img from '../../assets/app-images/course-detail-3.jpg'
import instructorImg from '../../assets/app-images/course-detail-4.jpg'

// Data-driven episode list — 8 episodes across 4 status variants (done / current / open / locked).
// Only episodes with a real thumbnail carry an `image`; the rest fall back to a plain placeholder.
const EPISODES = [
  {
    week: 1,
    ep: 1,
    title: 'Mapping Your Generational Patterns',
    sub: 'Where the patterns started — and how to see them clearly.',
    dur: '22 min',
    status: 'done',
    image: ep1Img,
  },
  {
    week: 1,
    ep: 2,
    title: 'Your Family Map Exercise',
    sub: 'Guided workbook session with Mike.',
    dur: '18 min',
    status: 'done',
  },
  {
    week: 1,
    ep: 3,
    title: 'Naming What You Carry',
    sub: 'Turning awareness into language.',
    dur: '15 min',
    status: 'done',
  },
  {
    week: 2,
    ep: 1,
    title: 'Identifying Root Beliefs',
    sub: 'The beliefs underneath the behavior.',
    dur: '24 min',
    status: 'current',
    image: ep4Img,
  },
  {
    week: 2,
    ep: 2,
    title: 'The Void Section',
    sub: 'What absence taught you to believe.',
    dur: '19 min',
    status: 'open',
  },
  {
    week: 2,
    ep: 3,
    title: 'Belief Audit Exercise',
    sub: 'Workbook session · 10 questions.',
    dur: '14 min',
    status: 'open',
  },
  {
    week: 3,
    ep: 1,
    title: 'The Lies You Inherited',
    sub: 'Unlocks when Week 2 is complete.',
    dur: '26 min',
    status: 'locked',
  },
  {
    week: 3,
    ep: 2,
    title: 'Truth Replacement Protocol',
    sub: 'Unlocks when Week 2 is complete.',
    dur: '21 min',
    status: 'locked',
  },
]

// Per-status visual treatment, matching the 4 reference rows in the source markup.
const STATUS_STYLES = {
  done: {
    card: 'bg-cream/[0.02]',
    week: 'text-cream/40',
    title: 'text-cream/60',
  },
  current: {
    card: 'bg-[#232B18]',
    week: 'text-gold',
    title: 'text-white',
  },
  open: {
    card: 'bg-[#1E2416]',
    week: 'text-cream/50',
    title: 'text-cream',
  },
  locked: {
    card: 'bg-cream/[0.02]',
    week: 'text-cream/[0.35]',
    title: 'text-cream/45',
  },
}

function CheckIcon({ className }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#C2A064" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M20 6 9 17l-5-5" />
    </svg>
  )
}

function PlayIcon({ className }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="rgba(255,255,255,0.9)" className={className}>
      <path d="M8 5v14l11-7z" />
    </svg>
  )
}

function LockIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="rgba(240,238,229,0.55)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  )
}

function EpisodeThumbnail({ episode }) {
  return (
    <div className="relative w-[104px] flex-shrink-0 overflow-hidden rounded-lg bg-[rgb(37,44,26)]" style={{ aspectRatio: '16 / 9' }}>
      {episode.image && (
        <img src={episode.image} alt="" className="absolute inset-0 h-full w-full object-cover brightness-[0.72]" />
      )}
      <div className="absolute inset-0 flex items-center justify-center">
        {episode.status === 'done' && <CheckIcon />}
        {episode.status === 'current' && <PlayIcon />}
        {episode.status === 'open' && <PlayIcon />}
        {episode.status === 'locked' && <LockIcon />}
      </div>
    </div>
  )
}

function EpisodeBadge({ status }) {
  if (status === 'done') {
    return (
      <span className="rounded-full border border-gold/30 bg-gold/[0.13] px-[11px] py-1 font-sans text-[10px] font-semibold uppercase tracking-[0.12em] text-[#E9CF9C]">
        Done
      </span>
    )
  }
  if (status === 'current') {
    return (
      <span className="rounded-full bg-gold px-[11px] py-1 font-sans text-[10px] font-semibold uppercase tracking-[0.12em] text-ink">
        Up next
      </span>
    )
  }
  return null
}

function EpisodeRow({ episode }) {
  const styles = STATUS_STYLES[episode.status]
  return (
    <Link
      to="/player"
      className={`flex items-center gap-4 rounded-[13px] border border-cream/[0.08] px-[18px] py-3.5 no-underline ${styles.card}`}
    >
      <EpisodeThumbnail episode={episode} />
      <div className="min-w-0 flex-1">
        <div className={`mb-[3px] font-sans text-[11px] font-semibold uppercase tracking-[0.14em] ${styles.week}`}>
          Week {episode.week} · Episode {episode.ep}
        </div>
        <div className={`font-sans text-[16px] font-semibold tracking-[0.01em] ${styles.title}`}>{episode.title}</div>
        <div className="mt-[2px] font-serif text-[13px] text-cream/50">{episode.sub}</div>
      </div>
      <div className="flex flex-shrink-0 items-center gap-3.5">
        <span className="font-sans text-[12px] font-semibold tracking-[0.08em] text-cream/45">{episode.dur}</span>
        <EpisodeBadge status={episode.status} />
      </div>
    </Link>
  )
}

export default function CourseDetail() {
  const completedCount = EPISODES.filter((e) => e.status === 'done').length

  return (
    <div className="min-h-screen bg-ink font-sans text-cream antialiased">
      <header className="sticky top-0 z-40 flex h-[66px] items-center justify-between gap-6 border-b border-cream/[0.07] bg-ink/90 px-8 backdrop-blur-md">
        <div className="flex items-center gap-5">
          <Link
            to="/courses"
            className="flex items-center gap-2 font-sans text-[12px] font-semibold uppercase tracking-[0.12em] text-cream/65 no-underline"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m15 18-6-6 6-6" />
            </svg>
            Course library
          </Link>
        </div>
        <Link to="/dashboard">
          <img src={logo} alt="Convergence MVMNT" className="block h-10 w-auto" />
        </Link>
        <div className="flex items-center gap-[18px]">
          <div className="flex items-center gap-1.5 rounded-full border border-gold/25 bg-gold/[0.12] px-[13px] py-[7px]">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#E89147" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
            </svg>
            <span className="font-sans text-[13px] font-bold text-[#E9CF9C]">12-day streak</span>
          </div>
          <div className="flex h-[34px] w-[34px] items-center justify-center rounded-full bg-gold/[0.14] font-sans text-[12.5px] font-bold text-gold">
            SM
          </div>
        </div>
      </header>

      <section className="relative flex min-h-[340px] items-end overflow-hidden">
        <img
          src={heroImg}
          alt=""
          className="absolute inset-0 h-full w-full object-cover brightness-[0.55]"
          style={{ objectPosition: 'center 25%' }}
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(90deg, rgba(18,21,12,0.92) 25%, rgba(18,21,12,0.2) 75%), linear-gradient(transparent 35%, rgba(18,21,12,0.95))',
          }}
        />
        <div className="relative mx-auto w-full max-w-[1160px] px-10 pb-9 pt-12">
          <div className="mb-3.5 flex items-center gap-2.5">
            <span className="rounded-full border border-gold/35 bg-gold/[0.16] px-[13px] py-[5px] font-sans text-[10.5px] font-semibold uppercase tracking-[0.14em] text-[#E9CF9C]">
              Freedom &amp; Healing
            </span>
            <span className="font-sans text-[11px] font-semibold uppercase tracking-[0.16em] text-cream/60">
              12 weeks · 36 episodes · Certificate
            </span>
          </div>
          <h1 className="mb-2.5 text-[46px] font-bold uppercase leading-[0.98] text-white">
            Inherit Your Freedom
            <br />
            90-Day Intensive
          </h1>
          <p className="max-w-[560px] font-serif text-[16.5px] leading-[1.6] text-cream/[0.78]">
            Break the patterns you were handed. A guided 90-day process to map generational patterns, confront
            inherited lies, and rebuild identity on truth.
          </p>
        </div>
      </section>

      <main className="mx-auto grid max-w-[1160px] grid-cols-1 items-start gap-6 px-10 pb-[72px] pt-8 lg:grid-cols-[1.6fr_1fr]">
        <div className="min-w-0">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="m-0 font-sans text-[17px] font-bold uppercase tracking-[0.1em] text-white">Episodes</h2>
            <span className="font-sans text-[12px] font-semibold tracking-[0.08em] text-cream/50">
              {completedCount} of 36 complete
            </span>
          </div>
          <div className="flex flex-col gap-2.5">
            {EPISODES.map((episode) => (
              <EpisodeRow key={`${episode.week}-${episode.ep}`} episode={episode} />
            ))}
          </div>
        </div>

        <div className="sticky top-[90px] flex flex-col gap-5.5">
          <div className="rounded-cv-lg border border-cream/[0.09] bg-[rgb(30,36,22)] p-[22px]">
            <div className="mb-4 flex items-center gap-3.5">
              <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-full border-2 border-gold/40">
                <img src={instructorImg} alt="Mike Signorelli" className="h-full w-full object-cover" />
              </div>
              <div>
                <div className="mb-[3px] font-sans text-[10.5px] font-semibold uppercase tracking-[0.18em] text-cream/45">
                  Your instructor
                </div>
                <div className="font-sans text-[18px] font-bold uppercase">Mike Signorelli</div>
              </div>
            </div>
            <p className="m-0 font-serif text-[14px] leading-[1.6] text-cream/70">
              Pastor, author of Unoffendable Heart, and founder of Convergence MVMNT. Mike walks every week of the
              intensive with you.
            </p>
          </div>

          <div className="rounded-cv-lg border border-cream/[0.09] bg-[rgb(30,36,22)] p-[22px]">
            <div className="mb-2.5 flex items-center justify-between">
              <span className="font-sans text-[10.5px] font-semibold uppercase tracking-[0.18em] text-cream/45">
                Your progress
              </span>
              <span className="font-sans text-[14px] font-bold text-[#E9CF9C]">34%</span>
            </div>
            <div className="mb-4 h-1.5 overflow-hidden rounded-full bg-cream/10">
              <div className="h-full w-[34%] rounded-full bg-gold" />
            </div>
            <Link
              to="/player"
              className="flex items-center justify-center gap-2.5 rounded-full bg-gold px-4 py-[13px] font-sans text-[12.5px] font-semibold uppercase tracking-[0.12em] text-ink no-underline"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <path d="M8 5v14l11-7z" />
              </svg>
              Continue Week 2
            </Link>
          </div>

          <div className="rounded-cv-lg border border-cream/[0.09] bg-[rgb(30,36,22)] p-[22px]">
            <div className="mb-3 font-sans text-[10.5px] font-semibold uppercase tracking-[0.18em] text-cream/45">
              Included
            </div>
            <div className="flex flex-col gap-2.5 font-serif text-[14px] text-cream/75">
              <div className="flex items-center gap-2.5">
                <CheckIcon className="h-[14px] w-[14px] flex-shrink-0" />
                Weekly workbook (PDF)
              </div>
              <div className="flex items-center gap-2.5">
                <CheckIcon className="h-[14px] w-[14px] flex-shrink-0" />
                Private intensive community
              </div>
              <div className="flex items-center gap-2.5">
                <CheckIcon className="h-[14px] w-[14px] flex-shrink-0" />
                Monthly hot seat coaching
              </div>
              <div className="flex items-center gap-2.5">
                <CheckIcon className="h-[14px] w-[14px] flex-shrink-0" />
                Completion certificate
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
