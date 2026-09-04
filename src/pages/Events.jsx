import PublicLayout from '../components/PublicLayout'
import tourImg from '../assets/images/footsteps-of-paul-greece-amp-turkey.webp'

const TOUR_FEATURES = [
  {
    icon: (
      <>
        <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0z" />
        <circle cx="12" cy="10" r="3" />
      </>
    ),
    text: 'Mars Hill, Ephesus, Corinth, Philippi & more — where Scripture was written',
  },
  {
    icon: (
      <>
        <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
        <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
      </>
    ),
    text: 'Deep teaching at every site — not tourism, but transformation',
  },
  {
    icon: (
      <>
        <path d="M3 18v-6a9 9 0 0 1 18 0v6" />
        <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z" />
      </>
    ),
    text: 'Includes a three-night Greek island cruise',
  },
]

const EVENTS = [
  {
    month: 'Jul',
    day: '10',
    meta: 'Revival · Yakima, WA · Free',
    title: 'Summer Tent Revival',
    desc: 'Mike ministers at the Summer Tent Revival hosted by Breakthrough Church, July 10–12. A free evening of worship and the Word.',
    href: 'https://mikesignorelli.com/events/summer-tent-revival',
  },
  {
    month: 'Jul',
    day: '30',
    endDate: '–Aug 1',
    meta: 'Conference · Miami, FL · Free',
    title: 'King Jesus Youth Conference',
    desc: 'A free three-day youth conference for a generation ready to prophesy, dream, and see visions — for the hungry and the next generation passionate for Jesus.',
    href: 'https://mikesignorelli.com/events/king-jesus-international-ministry-youth-conference',
  },
  {
    month: 'Aug',
    day: '9',
    meta: 'BRKRS Night · Orlando, FL · Free',
    title: 'BRKRS Night: Orlando',
    desc: 'One night. One assignment. Everything shifts. Join Mike and V1 Worship for a catalytic move of God — deliverance, healing, prophetic preaching, and raw worship.',
    href: 'https://mikesignorelli.com/events/brkrs-night-orlando',
  },
  {
    month: 'Oct',
    day: '2',
    meta: 'Conference · Fort Worth, TX',
    title: 'Mercy Culture Conference',
    desc: (
      <>
        A three-day conference at Mercy Culture Church — a weekend for the body of Christ to encounter the
        presence of God. The 2026 theme: <em>Holy Ground.</em>
      </>
    ),
    href: 'https://mikesignorelli.com/events/mercy-culture-conference',
  },
  {
    month: 'Oct',
    day: '15',
    meta: 'BRKRS Night · Smithtown, NY · Free',
    title: 'BRKRS Night: Northeast',
    desc: 'One night. Everything shifts. Join Mike and V1 Worship at V1 Church Long Island for deliverance, healing, freedom, prophetic preaching, and raw worship.',
    href: 'https://mikesignorelli.com/events/brkrs-night-los-angeles-w5nr9-hbd4s',
  },
  {
    month: 'Nov',
    day: '4',
    endDate: '–Nov 5',
    meta: 'Conference · Miami, FL · For Pastors',
    title: 'MVMNT: Pastors & Leaders',
    desc: 'A two-day gathering in Miami for pastors and ministry leaders — worship, dynamic teaching, and strategic collaboration. Ignite. Refresh. Transform.',
    href: 'https://mikesignorelli.com/events/mvmnt-a-conference-for-pastors-and-church-leaders',
  },
  {
    month: 'Nov',
    day: '6',
    meta: 'Conference · Winter Park, FL',
    title: 'Alive Conference',
    desc: 'A three-day encounter to activate your calling and stir your faith — powerful worship, anointed messages, and masterclasses. Hosted by Alive Church, Nov 5–7.',
    href: 'https://mikesignorelli.com/events/alive-conference',
  },
]

export default function Events() {
  return (
    <PublicLayout page="/events">
      {/* Hero */}
      <header id="top" className="relative overflow-hidden bg-ink">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(70%_80%_at_50%_0%,rgba(194,160,100,0.15),transparent_62%)]" />
        <div className="relative mx-auto max-w-[900px] px-8 pb-[92px] pt-[104px] text-center">
          <div className="mb-[18px] font-sans text-xs font-semibold uppercase tracking-[0.28em] text-gold">Upcoming · 2026</div>
          <h1 className="mb-[26px] font-sans text-[44px] font-bold uppercase leading-[0.96] tracking-[0.005em] text-cream-solid sm:text-[66px]">
            Events &amp; Experiences
          </h1>
          <p className="mx-auto mb-[38px] max-w-[640px] font-serif text-xl leading-[1.6] text-cream/[74%]">
            Join Mike Signorelli at revival gatherings, conferences, and ministry tours throughout the year.
            These are powerful moments to connect, grow, and experience what God is doing — in person.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-[22px]">
            <a href="#upcoming" className="inline-flex items-center gap-2.5 rounded-full bg-gold px-[34px] py-4 font-sans text-sm font-semibold uppercase tracking-[0.12em] text-ink no-underline">
              See all events
            </a>
            <a href="#tour" className="font-sans text-[13px] font-medium uppercase tracking-[0.1em] text-cream/[72%] no-underline">
              The Greece &amp; Turkey tour →
            </a>
          </div>
        </div>
      </header>

      {/* Featured tour */}
      <section id="tour" className="bg-paper py-[120px]">
        <div className="mx-auto grid max-w-[1160px] grid-cols-1 items-center gap-[60px] px-8 md:grid-cols-[1fr_1.05fr]">
          <div className="relative">
            <div className="aspect-[4/5] overflow-hidden rounded-2xl shadow-[0_30px_60px_-24px_rgba(53,61,42,0.4)]">
              <img src={tourImg} alt="Footsteps of Paul — Greece &amp; Turkey" className="h-full w-full object-cover" />
            </div>
            <span className="absolute left-[18px] top-[18px] rounded-full bg-gold px-4 py-2 font-sans text-[11px] font-semibold uppercase tracking-[0.12em] text-ink">
              Featured Experience
            </span>
          </div>
          <div>
            <div className="mb-4 font-sans text-xs font-semibold uppercase tracking-[0.28em] text-gold-dark">
              Aug 24 – Sep 3, 2026 · Greece &amp; Turkey
            </div>
            <h2 className="mb-5 font-sans text-[32px] font-bold uppercase leading-none tracking-[0.005em] text-charcoal sm:text-[44px]">
              Footsteps of Paul Biblical Tour
            </h2>
            <p className="mb-[26px] font-serif text-lg leading-[1.64] text-[rgb(63,64,56)]">
              A life-changing adventure through Biblical Greece and Turkey. Walk together where Paul
              proclaimed the Gospel — and watch as God writes new chapters in your own spiritual journey. 10
              days of Scripture, history, and encounter.
            </p>
            <div className="mb-[30px] flex flex-col gap-3">
              {TOUR_FEATURES.map((f) => (
                <div key={f.text} className="flex items-start gap-3">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#A6843C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mt-[3px] shrink-0">
                    {f.icon}
                  </svg>
                  <span className="font-serif text-base text-[rgb(63,64,56)]">{f.text}</span>
                </div>
              ))}
            </div>
            <a
              href="https://mikesignorelli.com/events/footsteps-of-paul-greece-turkey-tour"
              target="_blank"
              rel="noopener"
              className="inline-flex items-center gap-2.5 rounded-full bg-gold px-[30px] py-[15px] font-sans text-sm font-semibold uppercase tracking-[0.1em] text-ink no-underline"
            >
              Reserve your place
            </a>
          </div>
        </div>
      </section>

      {/* Upcoming gatherings */}
      <section id="upcoming" className="bg-ink py-[120px]">
        <div className="mx-auto max-w-[1160px] px-8">
          <div className="mx-auto mb-16 max-w-[720px] text-center">
            <div className="mb-4 font-sans text-xs font-semibold uppercase tracking-[0.28em] text-gold">The calendar</div>
            <h2 className="font-sans text-[34px] font-bold uppercase leading-none tracking-[0.005em] text-cream-solid sm:text-[48px]">
              Upcoming gatherings
            </h2>
          </div>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {EVENTS.map((ev) => (
              <div key={ev.title} className="flex items-start gap-[26px] rounded-2xl border border-gold/[0.14] bg-card px-8 py-[34px] transition-transform hover:-translate-y-1">
                <div className="w-[76px] shrink-0 border-r border-gold/20 pr-[22px] text-center">
                  <div className="font-sans text-sm font-semibold uppercase tracking-[0.14em] text-gold">{ev.month}</div>
                  <div className="font-sans text-[38px] font-bold leading-none text-cream-solid">{ev.day}</div>
                  {ev.endDate && (
                    <div className="mt-0.5 font-sans text-[11px] font-medium uppercase tracking-[0.06em] text-cream/50">{ev.endDate}</div>
                  )}
                </div>
                <div className="flex-1">
                  <div className="mb-2 font-sans text-[11px] font-semibold uppercase tracking-[0.1em] text-cream/50">{ev.meta}</div>
                  <h3 className="mb-2.5 font-sans text-[23px] font-bold uppercase tracking-[0.01em] text-cream-solid">{ev.title}</h3>
                  <p className="mb-4 font-serif text-base leading-[1.56] text-cream/[66%]">{ev.desc}</p>
                  <a href={ev.href} target="_blank" rel="noopener" className="font-sans text-xs font-semibold uppercase tracking-[0.08em] text-gold no-underline">
                    View event →
                  </a>
                </div>
              </div>
            ))}
            <div className="flex flex-col items-start justify-center rounded-2xl border border-dashed border-gold/40 px-8 py-[34px]">
              <h3 className="mb-2.5 font-sans text-[23px] font-bold uppercase tracking-[0.01em] text-cream-solid">Invite Mike to your city</h3>
              <p className="mb-[18px] font-serif text-base leading-[1.56] text-cream/[66%]">
                Hosting a conference, revival, or leaders&rsquo; gathering? Request Mike for a speaking
                engagement or ministry night.
              </p>
              <a href="#stay" className="rounded-full bg-gold px-6 py-3 font-sans text-xs font-semibold uppercase tracking-[0.08em] text-ink no-underline">
                Request Mike →
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Stay in the loop */}
      <section id="stay" className="bg-ink-alt py-[120px]">
        <div className="mx-auto max-w-[720px] px-8 text-center">
          <div className="mb-4 font-sans text-xs font-semibold uppercase tracking-[0.28em] text-gold">Never miss a gathering</div>
          <h2 className="mb-4 font-sans text-[34px] font-bold uppercase leading-none tracking-[0.005em] text-cream-solid sm:text-[48px]">
            Get event announcements first
          </h2>
          <p className="mx-auto mb-9 max-w-[560px] font-serif text-lg leading-[1.6] text-cream/[72%]">
            New tour dates, conferences, and BRKRS Nights — sent to your inbox before they fill up.
          </p>
          <form className="mx-auto flex max-w-[560px] flex-wrap justify-center gap-3">
            <input type="text" placeholder="First name" className="min-w-[130px] flex-1 rounded-full border border-cream/[0.18] bg-ink px-[22px] py-[15px] font-serif text-base text-cream-solid outline-none" />
            <input type="email" placeholder="Email address" className="min-w-[170px] flex-[1.4] rounded-full border border-cream/[0.18] bg-ink px-[22px] py-[15px] font-serif text-base text-cream-solid outline-none" />
            <button type="submit" className="whitespace-nowrap rounded-full bg-gold px-7 py-[15px] font-sans text-[13px] font-semibold uppercase tracking-[0.1em] text-ink">
              Keep me posted
            </button>
          </form>
          <p className="mt-[18px] font-serif text-[13px] text-cream/50">No spam. Unsubscribe anytime.</p>
        </div>
      </section>
    </PublicLayout>
  )
}
