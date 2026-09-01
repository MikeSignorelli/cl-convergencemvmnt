import { Link } from 'react-router-dom'
import PublicLayout from '../components/PublicLayout'
import heroImg from '../assets/images/mike-with-pastors-leading-a-room.webp'
import unoffendableHeartCover from '../assets/images/unoffendable-heart-book-cover.webp'
import chaosClarityCover from '../assets/images/from-chaos-to-clarity-book-cover.webp'

const CHECK = (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#C2A064" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" className="mt-0.5 shrink-0">
    <path d="M20 6 9 17l-5-5" />
  </svg>
)

const XMARK = (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="rgba(240,238,229,0.5)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="mt-0.5 shrink-0">
    <path d="M18 6 6 18M6 6l12 12" />
  </svg>
)

const PROBLEMS = [
  {
    icon: (
      <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#A6843C" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
        <path d="M3 21h18M5 21V8l7-5 7 5v13M9 21v-5h6v5" />
        <path d="m9 12 3-2 3 2" />
      </svg>
    ),
    title: 'Stuck at 200 for 2+ years',
    desc: 'Other pastors in similar cities are breaking through. The difference isn’t their gifting — it’s their structure.',
  },
  {
    icon: (
      <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#A6843C" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" />
      </svg>
    ),
    title: 'Working 75+ hours a week',
    desc: 'You’re doing everything yourself. No pathway, no delegation, no pipeline. Just you — and everything falls apart when you stop.',
  },
  {
    icon: (
      <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#A6843C" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
        <path d="M20.8 5.6a5.5 5.5 0 0 0-7.8 0L12 6.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 22l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8z" />
        <path d="m9 10 2 2-1.5 2.5" />
      </svg>
    ),
    title: 'Marriage suffering',
    desc: 'Your spouse feels like second priority. You feel guilty. But you don’t know what to cut — because everything feels essential.',
  },
  {
    icon: (
      <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#A6843C" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
        <path d="M14 3v18M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h8M14 3h4a2 2 0 0 1 2 2v6" />
        <path d="M10.5 12h.01" />
      </svg>
    ),
    title: 'Volunteers keep quitting',
    desc: 'You train people. Three months later they burn out and disappear. So you do it yourself. Again.',
  },
]

const SYSTEMS = [
  {
    num: 'System 01',
    title: 'Guest Experience',
    desc: 'First-time guests shouldn’t disappear. They should have a clear, intentional pathway from visitor to member to volunteer to leader.',
  },
  {
    num: 'System 02',
    title: 'Volunteer Pipeline',
    desc: 'People don’t burn out because they care too much. They burn out because there’s no development pathway, no recognition, and no clear role. This changes that.',
  },
  {
    num: 'System 03',
    title: 'Leadership Development',
    desc: 'Until you have a pipeline of leaders, you will always be the bottleneck. This system builds the bench that frees you.',
  },
]

const TESTIMONIALS = [
  {
    quote: 'I thought my situation was different — small town, traditional Baptist, stuck at 185 for 2.5 years. 90 days after the 3 Core Systems: 245 attendance, 48 hours/week, marriage thriving.',
    name: 'Pastor Marcus — Rural Ohio',
  },
  {
    quote: 'I found Mike through his marriage content. My wife was ready to leave. The 7 Pillars Framework saved my marriage AND my church grew. Both/and — not either/or.',
    name: 'Pastor David — Suburban TX',
  },
  {
    quote: '150 pastors in the community. Monthly connection. I’m not alone anymore. That alone was worth the investment.',
    name: 'Pastor Sarah — Church Planter, Urban CA',
  },
]

const FOR_LIST = [
  'Lead churches of 100–300 people stuck at a growth plateau',
  'Work 60–80 hours a week doing everything themselves',
  'Have a marriage suffering under ministry pressure',
  'Are gifted and called — but lack organizational systems',
  'Want to grow the church AND protect the family — both/and, not either/or',
]

const NOT_FOR_LIST = [
  'Pastors looking for quick fixes (this is systems, not shortcuts)',
  'Those unwilling to implement (Mike teaches — you build)',
  'Pastors not ready to take their marriage health seriously',
]

export default function Pastors() {
  return (
    <PublicLayout page="/pastors">
      {/* Hero */}
      <header id="top" className="relative overflow-hidden bg-ink">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(78%_70%_at_18%_4%,rgba(194,160,100,0.15),transparent_60%)]" />
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(transparent_62%,rgba(10,13,7,0.55))]" />
        <div className="relative mx-auto grid max-w-[1200px] grid-cols-1 items-center gap-16 px-8 py-[104px] md:grid-cols-[1.32fr_1fr] md:pb-[116px]">
          <div>
            <div className="mb-8 inline-flex gap-1.5 rounded-full border border-cream/12 bg-white/[0.04] p-[5px]">
              <Link to="/onboarding?tier=disciple" className="inline-flex items-center rounded-full px-[18px] py-2 font-sans text-[11px] font-semibold uppercase tracking-[0.1em] text-cream/72 no-underline">For Disciples</Link>
              <Link to="/onboarding?tier=leader" className="inline-flex items-center rounded-full px-[18px] py-2 font-sans text-[11px] font-semibold uppercase tracking-[0.1em] text-cream/72 no-underline">For Leaders</Link>
              <Link to="/onboarding?tier=pastor" className="rounded-full bg-gold px-[18px] py-2 font-sans text-[11px] font-semibold uppercase tracking-[0.1em] text-ink no-underline">For Pastors</Link>
            </div>
            <h1 className="mb-[26px] font-sans text-[42px] font-bold uppercase leading-[0.98] tracking-[0.005em] text-cream-solid sm:text-[56px]">
              Your church isn&rsquo;t stuck because of your preaching. <span className="text-gold">It&rsquo;s stuck because of your structure.</span>
            </h1>
            <p className="mb-4 max-w-[520px] font-serif text-[19px] leading-[1.62] text-cream/74">
              You&rsquo;re gifted. You&rsquo;re called. You love your people. But your church has been stuck at the same number for two years &mdash; and your marriage is paying the price.
            </p>
            <p className="mb-[38px] max-w-[520px] font-serif text-[19px] font-medium leading-[1.62] text-cream-solid">
              Convergence MVMNT gives you both the systems to scale and the framework to protect your family while you do it.
            </p>
            <div className="flex flex-wrap items-center gap-[26px]">
              <a href="#guide" className="inline-flex items-center gap-2.5 rounded-full bg-gold px-[34px] py-4 font-sans text-sm font-semibold uppercase tracking-[0.12em] text-ink no-underline">
                Download the free guide
              </a>
              <a href="#guide" className="font-sans text-[13px] font-medium uppercase tracking-[0.1em] text-cream/72 no-underline">Explore pastor programs &rarr;</a>
            </div>
            <p className="mt-[38px] max-w-[520px] border-t border-cream/10 pt-[30px] font-serif text-base italic leading-[1.5] text-cream/55">
              From the founding pastor of the fastest-growing church in America &mdash; 5 consecutive years &mdash; who works 45 hours a week and keeps date night every week.
            </p>
          </div>
          <div className="relative aspect-[4/5] overflow-hidden rounded-2xl border border-gold/24 shadow-[0_34px_66px_-22px_rgba(0,0,0,0.7)]">
            <img src={heroImg} alt="Mike with pastors / leading a room" className="h-full w-full object-cover" />
          </div>
        </div>
      </header>

      {/* Trust bar */}
      <section className="border-y border-cream/[0.06] bg-ink-alt">
        <div className="mx-auto flex max-w-[1200px] flex-col items-center gap-[18px] px-8 py-[34px]">
          <span className="font-sans text-[11px] font-semibold uppercase tracking-[0.22em] text-cream/42">As seen on &amp; trusted by</span>
          <div className="flex flex-wrap items-center justify-center gap-x-[54px] gap-y-[22px]">
            <span className="font-sans text-[22px] font-bold tracking-[0.04em] text-cream/60">TBN</span>
            <span className="font-sans text-base font-semibold uppercase tracking-[0.04em] text-cream/55">Baker Books</span>
            <span className="font-sans text-base font-semibold uppercase tracking-[0.04em] text-cream/55">YouTube &middot; <span className="text-gold">1.6M</span></span>
            <span className="font-sans text-base font-bold uppercase tracking-[0.04em] text-cream/55">Disney+</span>
            <span className="font-sans text-[15px] font-semibold uppercase tracking-[0.03em] text-cream/55">Fastest-Growing Church in America</span>
          </div>
        </div>
      </section>

      {/* What is Convergence MVMNT */}
      <section className="bg-ink py-[120px]">
        <div className="mx-auto max-w-[1160px] px-8">
          <div className="mx-auto mb-[68px] max-w-[760px] text-center">
            <div className="mb-4 font-sans text-xs font-semibold uppercase tracking-[0.28em] text-gold">What is Convergence MVMNT</div>
            <h2 className="mb-[22px] font-sans text-[36px] font-bold uppercase leading-none tracking-[0.005em] text-cream-solid sm:text-[48px]">
              One place. Every tool to break free.
            </h2>
            <p className="font-serif text-lg leading-[1.64] text-cream/66">
              A faith-based media and growth community where seekers, leaders, and pastors come together
              to go deeper &mdash; in Scripture, in identity, and in purpose.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-[26px] md:grid-cols-3">
            <div className="flex flex-col rounded-[14px] border border-gold/[0.14] bg-card p-[34px] transition-transform hover:-translate-y-1">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#C2A064" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" />
                <path d="M7 11V7a5 5 0 0 1 9.9-1" />
              </svg>
              <h3 className="mb-3 mt-[26px] font-sans text-2xl font-bold uppercase tracking-[0.01em] text-cream-solid">Membership</h3>
              <p className="mb-6 flex-1 font-serif text-base leading-[1.62] text-cream/66">
                Teachings, tools, and a community of people serious about transformation &mdash; not just inspiration.
              </p>
              <div className="font-sans text-[13px] font-semibold uppercase tracking-[0.06em] text-gold">From $49/mo</div>
            </div>
            <div className="flex flex-col rounded-[14px] border border-gold/[0.14] bg-card p-[34px] transition-transform hover:-translate-y-1">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#C2A064" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                <path d="M2 4h7a3 3 0 0 1 3 3v13a2.5 2.5 0 0 0-2.5-2.5H2z" />
                <path d="M22 4h-7a3 3 0 0 0-3 3v13a2.5 2.5 0 0 1 2.5-2.5H22z" />
              </svg>
              <h3 className="mb-3 mt-[26px] font-sans text-2xl font-bold uppercase tracking-[0.01em] text-cream-solid">Courses &amp; Mentorship</h3>
              <p className="mb-6 flex-1 font-serif text-base leading-[1.62] text-cream/66">
                Structured programs that take you from knowing to actually living differently &mdash; breaking patterns, building a thriving life.
              </p>
              <div className="font-sans text-[13px] font-semibold uppercase tracking-[0.06em] text-gold">From $497</div>
            </div>
            <div className="flex flex-col rounded-[14px] border border-gold/[0.14] bg-card p-[34px] transition-transform hover:-translate-y-1">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#C2A064" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4.5" width="18" height="17" rx="2" />
                <path d="M3 9.5h18M8 2.5v4M16 2.5v4" />
              </svg>
              <h3 className="mb-3 mt-[26px] font-sans text-2xl font-bold uppercase tracking-[0.01em] text-cream-solid">Events &amp; Experiences</h3>
              <p className="mb-6 flex-1 font-serif text-base leading-[1.62] text-cream/66">
                The Restore Conference. The Greece &amp; Turkey Biblical Tour. Experiences that change who you are.
              </p>
              <Link to="/events" className="inline-flex items-center gap-1.5 font-sans text-[13px] font-semibold uppercase tracking-[0.06em] text-gold no-underline">See all events &rarr;</Link>
            </div>
          </div>
        </div>
      </section>

      {/* The real problem */}
      <section className="bg-paper py-[120px]">
        <div className="mx-auto max-w-[1100px] px-8">
          <div className="mx-auto mb-14 max-w-[900px] text-center">
            <div className="mb-4 font-sans text-xs font-semibold uppercase tracking-[0.28em] text-gold-dark">The real problem</div>
            <h2 className="mb-[24px] font-sans text-[32px] font-bold uppercase leading-[1.06] tracking-[0.005em] text-charcoal sm:text-[44px]">
              If your spouse said &ldquo;the church is your real wife,&rdquo; you don&rsquo;t have a marriage problem. You have a systems problem.
            </h2>
            <p className="mb-3.5 font-serif text-[19px] leading-[1.66] text-[rgb(85,86,74)]">
              You entered ministry to change lives. And you are. But somewhere along the way you became the
              bottleneck for everything &mdash; every decision, every follow-up, every volunteer problem, every
              facilities issue.
            </p>
            <p className="font-serif text-[19px] font-medium leading-[1.66] text-charcoal">
              You&rsquo;re a gifted pastor without systems. That&rsquo;s a fixable problem.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-[22px] sm:grid-cols-2">
            {PROBLEMS.map((p) => (
              <div key={p.title} className="flex items-start gap-[18px] rounded-[14px] border border-[rgb(220,216,205)] bg-white p-8">
                {p.icon}
                <div>
                  <h3 className="mb-2 font-sans text-xl font-bold uppercase tracking-[0.02em] text-charcoal">{p.title}</h3>
                  <p className="font-serif text-base leading-[1.55] text-[rgb(85,86,74)]">{p.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* The Convergence MVMNT difference */}
      <section className="bg-ink py-[120px]">
        <div className="mx-auto max-w-[1160px] px-8">
          <div className="mx-auto mb-16 max-w-[820px] text-center">
            <div className="mb-4 font-sans text-xs font-semibold uppercase tracking-[0.28em] text-gold">The Convergence MVMNT difference</div>
            <h2 className="mb-[22px] font-sans text-[32px] font-bold uppercase leading-[1.04] tracking-[0.005em] text-cream-solid sm:text-[44px]">
              Systems over hustle. Structure over burnout. Both/and &mdash; not either/or.
            </h2>
            <p className="font-serif text-[19px] leading-[1.6] text-cream/70">
              Mike built the fastest-growing church in America five years running &mdash; working 45 hours a
              week, keeping date night every week, with a thriving marriage. Not because he&rsquo;s superhuman.
              Because he built systems.
            </p>
          </div>
          <div className="mb-[52px] grid grid-cols-1 gap-[26px] md:grid-cols-3">
            {SYSTEMS.map((s) => (
              <div key={s.num} className="rounded-[14px] border border-gold/[0.14] bg-card p-[34px] transition-transform hover:-translate-y-1">
                <div className="font-sans text-[15px] font-bold uppercase tracking-[0.1em] text-gold">{s.num}</div>
                <h3 className="mb-3 mt-2.5 font-sans text-[23px] font-bold uppercase tracking-[0.02em] text-cream-solid">{s.title}</h3>
                <p className="font-serif text-base leading-[1.62] text-cream/66">{s.desc}</p>
              </div>
            ))}
          </div>
          <div className="mx-auto max-w-[820px] text-center">
            <p className="mb-3 font-serif text-2xl italic font-medium leading-[1.45] text-gold">
              &ldquo;Build these three systems and you won&rsquo;t just break 200. You&rsquo;ll build the foundation for 500, 1,000, and beyond.&rdquo;
            </p>
            <span className="font-sans text-[13px] font-semibold uppercase tracking-[0.06em] text-cream/60">Pastor Mike Signorelli</span>
          </div>
        </div>
      </section>

      {/* Case study: Pastor Marcus */}
      <section className="bg-paper py-[120px]">
        <div className="mx-auto max-w-[1100px] px-8">
          <div className="mx-auto mb-14 text-center">
            <div className="mb-4 font-sans text-xs font-semibold uppercase tracking-[0.28em] text-gold-dark">Case study &middot; Pastor Marcus</div>
            <h2 className="font-sans text-[34px] font-bold uppercase leading-[1.04] tracking-[0.005em] text-charcoal sm:text-[46px]">Same church. Same city. Different structure.</h2>
          </div>
          <div className="mb-6 grid grid-cols-1 items-stretch gap-6 md:grid-cols-2">
            <div className="rounded-2xl border border-[rgb(220,216,205)] bg-white px-[34px] py-9">
              <div className="mb-[22px] font-sans text-sm font-bold uppercase tracking-[0.12em] text-[rgb(138,135,114)]">Before</div>
              <div className="flex flex-col gap-4">
                <div className="flex items-baseline gap-3">
                  <span className="min-w-[70px] font-sans text-[30px] font-bold text-charcoal">175</span>
                  <span className="font-serif text-base text-[rgb(85,86,74)]">attendance &mdash; stuck for 2.5 years</span>
                </div>
                <div className="flex items-baseline gap-3">
                  <span className="min-w-[70px] font-sans text-[30px] font-bold text-charcoal">80<span className="text-[15px]">hrs</span></span>
                  <span className="font-serif text-base text-[rgb(85,86,74)]">worked every week</span>
                </div>
                <div className="flex items-baseline gap-3">
                  <span className="min-w-[70px] font-sans text-[22px] font-bold text-[rgb(139,90,60)]">&mdash;</span>
                  <span className="font-serif text-base text-[rgb(85,86,74)]">Marriage on the verge of collapse</span>
                </div>
              </div>
              <p className="mt-6 font-serif text-base italic text-[rgb(110,111,96)]">&ldquo;My situation is different,&rdquo; he said.</p>
            </div>
            <div className="rounded-2xl border border-gold/20 bg-ink px-[34px] py-9">
              <div className="mb-[22px] font-sans text-sm font-bold uppercase tracking-[0.12em] text-gold">After &mdash; 90 days</div>
              <div className="flex flex-col gap-4">
                <div className="flex items-baseline gap-3">
                  <span className="min-w-[70px] font-sans text-[30px] font-bold text-gold">320</span>
                  <span className="font-serif text-base text-cream/80">attendance</span>
                </div>
                <div className="flex items-baseline gap-3">
                  <span className="min-w-[70px] font-sans text-[30px] font-bold text-gold">48<span className="text-[15px]">hrs</span></span>
                  <span className="font-serif text-base text-cream/80">per week</span>
                </div>
                <div className="flex items-baseline gap-3">
                  <span className="min-w-[70px] font-sans text-[30px] font-bold text-gold">11</span>
                  <span className="font-serif text-base text-cream/80">date nights in 12 weeks &mdash; marriage thriving</span>
                </div>
              </div>
              <p className="mt-6 font-serif text-[15px] text-cream/70">
                <strong className="text-cream-solid">What he did:</strong> Implemented the 3 Core Systems. Built the volunteer
                pipeline first. Restructured the leadership pathway. Applied the 7 Pillars of a Thriving Pastor Marriage.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-5 rounded-r-xl border border-l-[3px] border-[rgb(220,216,205)] border-l-gold bg-white px-[30px] py-6">
            <p className="max-w-[660px] font-serif text-[17px] italic leading-[1.5] text-[rgb(63,64,56)]">
              &ldquo;Same church. Same city. Different structure. Pastor Marcus showed me the problem wasn&rsquo;t my calling
              &mdash; it was my systems.&rdquo; <span className="not-italic font-sans text-sm font-semibold uppercase tracking-[0.04em] text-gold-dark">&mdash; Pastor David</span>
            </p>
            <a href="#guide" className="whitespace-nowrap rounded-full bg-gold px-[26px] py-[13px] font-sans text-[13px] font-semibold uppercase tracking-[0.08em] text-ink no-underline">Get the free guide</a>
          </div>
        </div>
      </section>

      {/* What pastors are saying */}
      <section className="bg-ink py-[120px]">
        <div className="mx-auto max-w-[1160px] px-8">
          <div className="mx-auto mb-16 text-center">
            <div className="mb-4 font-sans text-xs font-semibold uppercase tracking-[0.28em] text-gold">What pastors are saying</div>
            <h2 className="font-sans text-[32px] font-bold uppercase leading-[1.04] tracking-[0.005em] text-cream-solid sm:text-[44px]">You were not meant to do this alone</h2>
          </div>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {TESTIMONIALS.map((t) => (
              <div key={t.name} className="rounded-[14px] border border-gold/[0.14] bg-card p-8">
                <div className="h-[30px] font-serif text-[60px] font-semibold leading-[0.5] text-gold/40">&ldquo;</div>
                <p className="mb-6 font-serif text-lg italic leading-[1.6] text-cream">{t.quote}</p>
                <div className="font-sans text-sm font-semibold uppercase tracking-[0.04em] text-gold">{t.name}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Is this you? */}
      <section className="bg-ink-alt py-[120px]">
        <div className="mx-auto max-w-[1000px] px-8">
          <div className="mx-auto mb-[60px] text-center">
            <div className="mb-4 font-sans text-xs font-semibold uppercase tracking-[0.28em] text-gold">Is this you?</div>
            <h2 className="font-sans text-[32px] font-bold uppercase leading-[1.04] tracking-[0.005em] text-cream-solid sm:text-[44px]">This is specifically for pastors who&hellip;</h2>
          </div>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-[1.15fr_0.85fr]">
            <div className="rounded-[14px] border border-gold/25 bg-card p-[38px_34px]">
              <div className="flex flex-col gap-4">
                {FOR_LIST.map((item) => (
                  <div key={item} className="flex items-start gap-[13px]">
                    {CHECK}
                    <span className="font-serif text-[17px] leading-[1.5] text-cream">{item}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-[14px] border border-cream/15 bg-transparent p-[38px_34px]">
              <div className="mb-5 font-sans text-sm font-bold uppercase tracking-[0.1em] text-cream/55">Not for</div>
              <div className="flex flex-col gap-4">
                {NOT_FOR_LIST.map((item) => (
                  <div key={item} className="flex items-start gap-[13px]">
                    {XMARK}
                    <span className="font-serif text-base leading-[1.5] text-cream/68">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Unoffendable Heart */}
      <section className="bg-paper py-[120px]">
        <div className="mx-auto grid max-w-[1160px] grid-cols-1 items-center gap-16 px-8 md:grid-cols-[0.8fr_1fr]">
          <div className="flex justify-center">
            <div className="relative aspect-[2/3] w-[280px] overflow-hidden rounded-[6px_12px_12px_6px] shadow-[-2px_0_0_inset_rgba(0,0,0,0.14),0_34px_56px_-18px_rgba(53,61,42,0.4)]">
              <img src={unoffendableHeartCover} alt="Unoffendable Heart — book cover" className="h-full w-full object-cover" />
            </div>
          </div>
          <div>
            <div className="mb-4 font-sans text-xs font-semibold uppercase tracking-[0.28em] text-gold-dark">New Release &middot; October 2025</div>
            <h2 className="mb-5 font-sans text-[30px] font-bold uppercase leading-[1.02] tracking-[0.005em] text-charcoal sm:text-[42px]">
              The hidden issue killing more churches than any system problem
            </h2>
            <p className="mb-4 font-serif text-lg leading-[1.64] text-[rgb(63,64,56)]">
              Before the systems. Before the growth. There&rsquo;s one invisible dynamic that derails more
              pastoral ministries than any structural problem: <em>offense</em>.
            </p>
            <p className="mb-[30px] font-serif text-lg leading-[1.64] text-[rgb(63,64,56)]">
              Mike&rsquo;s new book &mdash; <em>Unoffendable Heart</em>, with a foreword by the #1 author in
              Protestant Christianity &mdash; addresses the leadership crisis of our generation. Available
              October 2025, in every Barnes &amp; Noble nationwide.
            </p>
            <a href="#guide" className="inline-flex items-center gap-2.5 rounded-full bg-gold px-[30px] py-[15px] font-sans text-sm font-semibold uppercase tracking-[0.1em] text-ink no-underline">Pre-order your copy</a>
          </div>
        </div>
      </section>

      {/* From Chaos to Clarity */}
      <section id="chaos-to-clarity" className="relative overflow-hidden bg-ink-alt py-[120px]">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(80%_120%_at_18%_50%,rgba(194,160,100,0.12),transparent_55%)]" />
        <div className="relative mx-auto grid max-w-[1160px] grid-cols-1 items-center gap-16 px-8 md:grid-cols-[1fr_0.8fr]">
          <div>
            <h2 className="mb-[22px] font-sans text-[32px] font-bold uppercase leading-none tracking-[0.005em] text-cream-solid sm:text-[44px]">
              From Chaos to Clarity: No Turning Back
            </h2>
            <p className="mb-4 font-serif text-lg leading-[1.66] text-cream/72">
              We live in a time when culture distracts us easily from stepping into a life of fullness through
              Christ. As the number of voices in our lives has increased, so has the chaos &mdash; and many of us
              feel powerless to commit to the singular aim of our existence.
            </p>
            <p className="mb-[30px] font-serif text-lg leading-[1.66] text-cream/72">
              Drawing on his own journey and the lives of Joshua and Caleb, Mike shows how God uses your
              brokenness, fears, and shame to bring revival &mdash; so you can cut through the chaos and go after
              Jesus with all of your heart. Who you were a moment ago does not have to dictate who you are now.
            </p>
            <div className="flex flex-wrap items-center gap-4">
              <a href="#chaos-to-clarity" className="inline-flex items-center gap-2.5 rounded-full bg-gold px-[30px] py-[15px] font-sans text-sm font-semibold uppercase tracking-[0.1em] text-ink no-underline">Order the book</a>
              <span className="font-serif text-[15px] text-cream/55">Paperback, ebook &amp; audio</span>
            </div>
          </div>
          <div className="flex justify-center">
            <div className="relative aspect-[2/3] w-[280px] overflow-hidden rounded-[6px_12px_12px_6px] shadow-[-2px_0_0_inset_rgba(0,0,0,0.2),0_36px_60px_-18px_rgba(0,0,0,0.7)]">
              <img src={chaosClarityCover} alt="From Chaos to Clarity — book cover" className="h-full w-full object-cover" />
            </div>
          </div>
        </div>
      </section>

      {/* Membership: Pastor's Growth Circle */}
      <section id="membership" className="bg-ink py-[120px]">
        <div className="mx-auto max-w-[900px] px-8">
          <div className="relative overflow-hidden rounded-[20px] border border-gold/20 bg-card px-8 py-[72px] text-center sm:px-14">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(70%_120%_at_50%_0%,rgba(194,160,100,0.1),transparent_60%)]" />
            <div className="relative">
              <div className="mb-4 font-sans text-xs font-semibold uppercase tracking-[0.28em] text-gold">The Pastor&rsquo;s Growth Circle</div>
              <h2 className="mb-5 font-sans text-[34px] font-bold uppercase leading-none tracking-[0.005em] text-cream-solid sm:text-[46px]">
                Monthly coaching &amp; community
              </h2>
              <p className="mx-auto mb-10 max-w-[600px] font-serif text-lg leading-[1.6] text-cream/70">
                For $99/month, access a growing community of pastors, monthly teaching from Mike on systems
                and leadership, Q&amp;A access, templates, and early access to every program and event. You
                were not meant to do this alone.
              </p>
              <div className="flex flex-col items-center gap-4">
                <div className="font-sans text-[34px] font-bold text-cream-solid">
                  $99<span className="text-base font-medium text-cream/60">/mo</span>
                </div>
                <a href="#guide" className="inline-flex items-center gap-2.5 rounded-full bg-gold px-[42px] py-[17px] font-sans text-[15px] font-semibold uppercase tracking-[0.1em] text-ink no-underline">
                  Join the Pastor membership
                </a>
                <span className="font-serif text-sm text-cream/55">Cancel anytime.</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Free guide */}
      <section id="guide" className="bg-ink-alt py-[120px]">
        <div className="mx-auto max-w-[780px] px-8 text-center">
          <div className="mb-4 font-sans text-xs font-semibold uppercase tracking-[0.28em] text-gold">Free guide</div>
          <h2 className="mb-4 font-sans text-[36px] font-bold uppercase leading-none tracking-[0.005em] text-cream-solid sm:text-[48px]">
            Get the free guide. Start building today.
          </h2>
          <p className="mx-auto mb-2.5 max-w-[620px] font-serif text-lg leading-[1.6] text-cream/72">
            10 Keys to Breaking the 200-Person Barrier &mdash; from the pastor who built the fastest-growing
            church in America five years running.
          </p>
          <p className="mb-9 font-serif text-base italic leading-[1.5] text-cream/60">
            Includes the 3 Core Systems, the Church Calendar Strategy, the Bottleneck Diagnostic, and the
            marriage framework.
          </p>
          <form className="mx-auto flex max-w-[660px] flex-wrap justify-center gap-3">
            <input type="text" placeholder="First name" className="min-w-[130px] flex-1 rounded-full border border-cream/[0.18] bg-ink px-[22px] py-[15px] font-serif text-base text-cream-solid outline-none" />
            <input type="email" placeholder="Email address" className="min-w-[160px] flex-[1.3] rounded-full border border-cream/[0.18] bg-ink px-[22px] py-[15px] font-serif text-base text-cream-solid outline-none" />
            <select className="min-w-[150px] flex-1 rounded-full border border-cream/[0.18] bg-ink px-[22px] py-[15px] font-serif text-base text-cream-solid outline-none">
              <option value="">Church size</option>
              <option value="a">Under 100</option>
              <option value="b">100&ndash;200</option>
              <option value="c">200&ndash;300</option>
              <option value="d">300&ndash;500</option>
              <option value="e">500+</option>
            </select>
            <button type="submit" className="whitespace-nowrap rounded-full bg-gold px-7 py-[15px] font-sans text-[13px] font-semibold uppercase tracking-[0.1em] text-ink">Download free</button>
          </form>
          <p className="mt-[18px] font-serif text-[13px] text-cream/50">Immediate delivery. Used by 400+ pastors.</p>
        </div>
      </section>
    </PublicLayout>
  )
}
