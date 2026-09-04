import { Link } from 'react-router-dom'
import PublicLayout from '../components/PublicLayout'
import teachingImg from '../assets/images/mike-teaching-at-depth-study-on-stage.webp'
import greeceTurkeyImg from '../assets/images/footsteps-of-paul-greece-amp-turkey.webp'
import unoffendableHeartCover from '../assets/images/unoffendable-heart-book-cover.webp'
import chaosClarityCover from '../assets/images/from-chaos-to-clarity-book-cover.webp'

const CONVERGENCE_CARDS = [
  {
    title: 'Membership',
    desc: 'Teachings, tools, and a community of people serious about transformation — not just inspiration.',
    ctaLabel: 'Join the movement From $49/mo',
    icon: (
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#C2A064" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="11" width="18" height="11" rx="2" />
        <path d="M7 11V7a5 5 0 0 1 9.9-1" />
      </svg>
    ),
  },
  {
    title: 'Courses & Mentorship',
    desc: 'Structured programs that take you from knowing to actually living differently — breaking patterns, building a thriving life.',
    ctaLabel: 'Join the movement From $497',
    icon: (
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#C2A064" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2 4h7a3 3 0 0 1 3 3v13a2.5 2.5 0 0 0-2.5-2.5H2z" />
        <path d="M22 4h-7a3 3 0 0 0-3 3v13a2.5 2.5 0 0 1 2.5-2.5H22z" />
      </svg>
    ),
  },
  {
    title: 'Events & Experiences',
    desc: 'The Restore Conference. The Greece & Turkey Biblical Tour. Experiences that change who you are.',
    icon: (
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#C2A064" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4.5" width="18" height="17" rx="2" />
        <path d="M3 9.5h18M8 2.5v4M16 2.5v4" />
      </svg>
    ),
  },
]

const WORK_CARDS = [
  {
    title: 'Practitioner, not theorist',
    desc: 'Mike built the fastest-growing church in America while doing his own deep inner work — protecting his marriage and family through it. He teaches from what he has lived, at the level you operate.',
    icon: (
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#C2A064" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2 2 7l10 5 10-5z" />
        <path d="M2 17l10 5 10-5M2 12l10 5 10-5" />
      </svg>
    ),
  },
  {
    title: 'Grounded in neuroscience',
    desc: 'Why your patterns fire the way they do — and how the brain actually rewires. Real mechanisms for lasting change, not willpower and shame.',
    icon: (
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#C2A064" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2 4h7a3 3 0 0 1 3 3v13a2.5 2.5 0 0 0-2.5-2.5H2z" />
        <path d="M22 4h-7a3 3 0 0 0-3 3v13a2.5 2.5 0 0 1 2.5-2.5H22z" />
      </svg>
    ),
  },
  {
    title: 'Spiritual transformation',
    desc: 'An integrated relationship with God and your own soul — the bridge from the old self you’ve outgrown to the new self you’re stepping into.',
    icon: (
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#C2A064" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M13 2 3 14h9l-1 8 10-12h-9z" />
      </svg>
    ),
  },
]

const TOUR_FEATURES = [
  {
    d: 'M17.8 19.2 16 11l3.5-3.5a2.1 2.1 0 0 0-3-3L13 8 4.8 6.2a.5.5 0 0 0-.5.8L8 11l-2 2H3l-1 1 3 2 2 3 1-1v-3l2-2 3.7 3.7a.5.5 0 0 0 .8-.5z',
    text: 'Every major city Paul visited — Mars Hill, Ephesus, Corinth, Philippi, Thessalonica',
  },
  {
    paths: ['M2 4h7a3 3 0 0 1 3 3v13a2.5 2.5 0 0 0-2.5-2.5H2z', 'M22 4h-7a3 3 0 0 0-3 3v13a2.5 2.5 0 0 1 2.5-2.5H22z'],
    text: '2 hours of deep teaching at every site — not a devotional, not a photo op',
  },
  {
    d: 'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM22 21v-2a4 4 0 0 0-3-3.87M16 3.13A4 4 0 0 1 16 11',
    text: '20 people maximum — intimate, personal, transformative',
  },
  {
    paths: ['M22 10v6M2 10l10-5 10 5-10 5z', 'M6 12v5c3 3 9 3 12 0v-5'],
    text: 'Historical context, archaeological evidence, theological depth + practical application',
  },
  {
    d: 'M8 22h8M12 11v11M5 3h14l-1 6a6 6 0 0 1-12 0z',
    text: 'VIP option: private dinners with Mike + Legacy Architecture consultation',
  },
]

const SOCIAL_PROOF = [
  {
    quote: 'I built a portfolio worth $200M but had zero biblical framework for stewardship. One conversation with Mike was worth more than 10 years of Sunday sermons.',
    name: 'Mark — CFO, Fortune 500',
  },
  {
    quote: 'Finally found other high-performers who take faith seriously. The peer community alone transformed how I engage my faith.',
    name: 'Sarah — Real Estate Developer',
  },
  {
    quote: 'I’ve done three Holy Land tours. None came close to this level of depth. After 30 years a Christian — this trip changed how I read the entire New Testament.',
    name: 'James & Sarah — Tour Participants',
  },
]

export default function Leaders() {
  return (
    <PublicLayout page="/leaders">
      {/* Hero */}
      <header id="top" className="relative overflow-hidden bg-ink">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(78%_70%_at_18%_4%,rgba(194,160,100,0.15),transparent_60%)]" />
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(transparent_62%,rgba(10,13,7,0.55))]" />
        <div className="relative mx-auto grid max-w-[1200px] grid-cols-1 items-center gap-16 px-8 py-[104px] md:grid-cols-[1.32fr_1fr] md:pb-[116px]">
          <div>
            <div className="mb-8 inline-flex gap-1.5 rounded-full border border-cream/12 bg-white/[0.04] p-[5px]">
              <Link to="/" className="inline-flex items-center rounded-full px-[18px] py-2 font-sans text-[11px] font-semibold uppercase tracking-[0.1em] text-cream/72 no-underline">For Disciples</Link>
              <span className="rounded-full bg-gold px-[18px] py-2 font-sans text-[11px] font-semibold uppercase tracking-[0.1em] text-ink">For Leaders</span>
              <Link to="/pastors" className="inline-flex items-center rounded-full px-[18px] py-2 font-sans text-[11px] font-semibold uppercase tracking-[0.1em] text-cream/72 no-underline">For Pastors</Link>
            </div>
            <h1 className="mb-[26px] font-sans text-[42px] font-bold uppercase leading-[0.98] tracking-[0.005em] text-cream-solid sm:text-[60px]">
              You built the life. <span className="text-gold">But something&rsquo;s still missing.</span>
            </h1>
            <p className="mb-[38px] max-w-[540px] font-serif text-lg leading-[1.62] text-cream/74 sm:text-[19px]">
              You&rsquo;ve got the profit — the company, the exits, the title. What you don&rsquo;t have is peace. The
              business runs; but your inner world, your marriage, your family tell a different story. Convergence
              MVMNT is a mindset, neuroscience, and spiritual transformation process for high-capacity leaders ready
              to close the gap between the self they&rsquo;ve outgrown and the self they&rsquo;re becoming.
            </p>
            <div className="flex flex-wrap items-center gap-[26px]">
              <Link to="/onboarding?tier=leader" className="inline-flex items-center gap-2.5 rounded-full bg-gold px-[34px] py-4 font-sans text-sm font-semibold uppercase tracking-[0.12em] text-ink no-underline">
                Join the movement
              </Link>
              <a href="#tour" className="font-sans text-[13px] font-medium uppercase tracking-[0.1em] text-cream/72 no-underline">Explore programs →</a>
            </div>
            <p className="mt-[38px] max-w-[520px] border-t border-cream/10 pt-[30px] font-serif text-base italic leading-[1.5] text-cream/55">
              For high-earning entrepreneurs and executives who have profit — but lack peace.
            </p>
          </div>
          <div className="relative">
            <div className="relative aspect-[4/5] overflow-hidden rounded-2xl border border-gold/24 shadow-[0_34px_66px_-22px_rgba(0,0,0,0.7)]">
              <img src={teachingImg} alt="Mike teaching at depth (study / on stage)" className="h-full w-full object-cover" />
            </div>
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
            <span className="font-sans text-base font-semibold uppercase tracking-[0.04em] text-cream/55">YouTube · <span className="text-gold">1.6M</span></span>
            <span className="font-sans text-base font-bold uppercase tracking-[0.04em] text-cream/55">Disney+</span>
            <span className="font-sans text-[15px] font-semibold uppercase tracking-[0.03em] text-cream/55">Fastest-Growing Church in America</span>
          </div>
        </div>
      </section>

      {/* What is Convergence MVMNT */}
      <section className="bg-ink-alt py-[120px]">
        <div className="mx-auto max-w-[1160px] px-8">
          <div className="mx-auto mb-[68px] max-w-[760px] text-center">
            <div className="mb-4 font-sans text-xs font-semibold uppercase tracking-[0.28em] text-gold">What is Convergence MVMNT</div>
            <h2 className="mb-[22px] font-sans text-[36px] font-bold uppercase leading-none tracking-[0.005em] text-cream-solid sm:text-[48px]">
              One place. Every tool to break free.
            </h2>
            <p className="font-serif text-lg leading-[1.64] text-cream/66">
              A faith-based media and growth community where seekers, leaders, and pastors come together
              to go deeper — in Scripture, in identity, and in purpose.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-[26px] md:grid-cols-3">
            {CONVERGENCE_CARDS.map((card) => (
              <div key={card.title} className="flex flex-col rounded-[14px] border border-gold/[0.14] bg-card px-[34px] py-10 transition-transform hover:-translate-y-1">
                {card.icon}
                <h3 className="mb-3 mt-[26px] font-sans text-2xl font-bold uppercase tracking-[0.01em] text-cream-solid">{card.title}</h3>
                <p className="mb-6 flex-1 font-serif text-base leading-[1.62] text-cream/66">{card.desc}</p>
                {card.ctaLabel ? (
                  <Link to="/onboarding?tier=leader" className="inline-flex w-fit items-center gap-2 rounded-full bg-gold px-6 py-3 font-sans text-[13px] font-semibold uppercase tracking-[0.06em] text-ink no-underline">
                    {card.ctaLabel}
                  </Link>
                ) : (
                  <Link to="/events" className="inline-flex items-center gap-1.5 font-sans text-[13px] font-semibold uppercase tracking-[0.06em] text-gold no-underline">See all events →</Link>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* The peace gap */}
      <section className="bg-paper py-[120px]">
        <div className="mx-auto max-w-[1100px] px-8">
          <div className="mx-auto mb-14 max-w-[820px] text-center">
            <div className="mb-4 font-sans text-xs font-semibold uppercase tracking-[0.28em] text-gold-dark">The peace gap</div>
            <h2 className="mb-[22px] font-sans text-[34px] font-bold uppercase leading-[1.04] tracking-[0.005em] text-charcoal sm:text-[46px]">
              You&rsquo;ve optimized everything — except the one thing quietly breaking
            </h2>
            <p className="mb-[14px] font-serif text-[19px] leading-[1.66] text-[rgb(85,86,74)]">
              You&rsquo;ve scaled companies, closed the deals, and hit numbers most people never touch. You know how
              to grow almost anything — except the part of you that feels stuck, anxious, or disconnected from God
              and the people you love most.
            </p>
            <p className="font-serif text-[19px] font-medium leading-[1.66] text-charcoal">
              That&rsquo;s not a discipline problem. It&rsquo;s an integration problem — and no amount of profit closes it.
            </p>
          </div>

          <div className="mx-auto max-w-[860px] overflow-hidden rounded-[14px] border border-[rgb(220,216,205)] bg-white shadow-[0_20px_50px_-22px_rgba(53,61,42,0.35)]">
            <div className="grid grid-cols-2">
              <div className="bg-ink px-8 py-[22px]">
                <span className="font-sans text-[13px] font-semibold uppercase tracking-[0.1em] text-gold">Business education</span>
              </div>
              <div className="border-l border-cream/12 bg-card px-8 py-[22px]">
                <span className="font-sans text-[13px] font-semibold uppercase tracking-[0.1em] text-cream/70">Inner-life investment</span>
              </div>
            </div>
            <div className="grid grid-cols-2 font-sans">
              <div className="border-r border-[rgb(230,226,218)]">
                <div className="flex justify-between border-b border-[rgb(238,234,226)] px-8 py-4 text-base text-[rgb(63,64,56)]">
                  <span className="uppercase tracking-[0.02em]">MBA</span>
                  <span className="font-bold text-charcoal">$150,000</span>
                </div>
                <div className="flex justify-between border-b border-[rgb(238,234,226)] px-8 py-4 text-base text-[rgb(63,64,56)]">
                  <span className="uppercase tracking-[0.02em]">Executive Coaching</span>
                  <span className="font-bold text-charcoal">$50,000</span>
                </div>
                <div className="flex justify-between border-b border-[rgb(238,234,226)] px-8 py-4 text-base text-[rgb(63,64,56)]">
                  <span className="uppercase tracking-[0.02em]">Business Conferences</span>
                  <span className="font-bold text-charcoal">$30,000</span>
                </div>
                <div className="flex justify-between border-b border-[rgb(238,234,226)] px-8 py-4 text-base text-[rgb(63,64,56)]">
                  <span className="uppercase tracking-[0.02em]">Leadership Programs</span>
                  <span className="font-bold text-charcoal">$20,000</span>
                </div>
                <div className="flex justify-between bg-paper px-8 py-[18px] text-[17px]">
                  <span className="font-bold uppercase tracking-[0.04em] text-charcoal">Total</span>
                  <span className="font-bold text-charcoal">$250,000</span>
                </div>
              </div>
              <div>
                <div className="flex justify-between border-b border-[rgb(238,234,226)] px-8 py-4 text-base text-[rgb(63,64,56)]">
                  <span className="uppercase tracking-[0.02em]">Books</span>
                  <span className="font-bold text-[rgb(140,110,48)]">$500</span>
                </div>
                <div className="flex justify-between border-b border-[rgb(238,234,226)] px-8 py-4 text-base text-[rgb(63,64,56)]">
                  <span className="uppercase tracking-[0.02em]">Courses</span>
                  <span className="font-bold text-[rgb(140,110,48)]">$0</span>
                </div>
                <div className="flex justify-between border-b border-[rgb(238,234,226)] px-8 py-4 text-base text-[rgb(63,64,56)]">
                  <span className="uppercase tracking-[0.02em]">Experiences</span>
                  <span className="font-bold text-[rgb(140,110,48)]">$1,000</span>
                </div>
                <div className="flex justify-between border-b border-[rgb(238,234,226)] px-8 py-4 text-base text-[rgb(63,64,56)]">
                  <span className="uppercase tracking-[0.02em]">Assessment</span>
                  <span className="font-bold text-[rgb(140,110,48)]">$0</span>
                </div>
                <div className="flex justify-between bg-paper px-8 py-[18px] text-[17px]">
                  <span className="font-bold uppercase tracking-[0.04em] text-charcoal">Total</span>
                  <span className="font-bold text-[rgb(140,110,48)]">$1,500</span>
                </div>
              </div>
            </div>
            <div className="bg-ink px-8 py-[26px] text-center">
              <p className="font-serif text-lg leading-[1.5] text-cream/86">
                You&rsquo;ve invested <span className="font-sans text-[22px] font-bold text-gold">167×</span> more in
                your success than your soul. Then you wonder why the wins feel hollow.
              </p>
            </div>
          </div>

          <div className="mt-11 text-center">
            <a href="#assessment" className="inline-flex items-center gap-2.5 rounded-full bg-gold px-8 py-[15px] font-sans text-sm font-semibold uppercase tracking-[0.1em] text-ink no-underline">
              Close the gap — take the free assessment
            </a>
          </div>
        </div>
      </section>

      {/* How the work actually happens */}
      <section className="bg-ink py-[120px]">
        <div className="mx-auto max-w-[1160px] px-8">
          <div className="mx-auto mb-16 max-w-[800px] text-center">
            <div className="mb-4 font-sans text-xs font-semibold uppercase tracking-[0.28em] text-gold">How the work actually happens</div>
            <h2 className="font-sans text-[36px] font-bold uppercase leading-none tracking-[0.005em] text-cream-solid sm:text-[48px]">
              Mindset. Neuroscience. Spirit. Finally integrated.
            </h2>
          </div>
          <div className="mb-[52px] grid grid-cols-1 gap-[26px] md:grid-cols-3">
            {WORK_CARDS.map((card) => (
              <div key={card.title} className="rounded-[14px] border border-gold/[0.14] bg-card px-[34px] py-10 transition-transform hover:-translate-y-1">
                {card.icon}
                <h3 className="mb-3 mt-[26px] font-sans text-[23px] font-bold uppercase tracking-[0.01em] text-cream-solid">{card.title}</h3>
                <p className="font-serif text-base leading-[1.62] text-cream/66">{card.desc}</p>
              </div>
            ))}
          </div>
          <div className="mx-auto max-w-[780px] text-center">
            <p className="font-serif text-2xl italic font-medium leading-[1.45] text-gold">
              &ldquo;Most programs give you mindset or faith. Almost none give you both — wired to how the brain and
              the soul actually change.&rdquo;
            </p>
          </div>
        </div>
      </section>

      {/* Tour */}
      <section id="tour" className="bg-paper py-[120px]">
        <div className="mx-auto grid max-w-[1160px] grid-cols-1 items-center gap-[60px] px-8 md:grid-cols-[1fr_1.05fr]">
          <div className="relative">
            <div className="relative aspect-[4/5] overflow-hidden rounded-2xl shadow-[0_30px_60px_-24px_rgba(53,61,42,0.4)]">
              <img src={greeceTurkeyImg} alt="Greece &amp; Turkey — Mars Hill / Ephesus ruins" className="h-full w-full object-cover" />
            </div>
            <span className="absolute left-[18px] top-[18px] rounded-full bg-gold px-4 py-2 font-sans text-[11px] font-semibold uppercase tracking-[0.12em] text-ink">Featured Experience</span>
          </div>
          <div>
            <div className="mb-4 font-sans text-xs font-semibold uppercase tracking-[0.28em] text-gold-dark">Greece &amp; Turkey Biblical Tour</div>
            <h2 className="mb-[18px] font-sans text-[32px] font-bold uppercase leading-[1.02] tracking-[0.005em] text-charcoal sm:text-[42px]">
              Don&rsquo;t read about where Paul walked. Stand there.
            </h2>
            <p className="mb-[26px] font-serif text-lg leading-[1.62] text-[rgb(63,64,56)]">
              10 days studying Scripture where it was written, in a group of 20 serious professionals, with teaching
              at the intellectual level you&rsquo;ve been searching for.
            </p>
            <div className="mb-7 flex flex-col gap-3.5">
              {TOUR_FEATURES.map((item) => (
                <div key={item.text} className="flex items-start gap-3">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#A6843C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mt-[3px] shrink-0">
                    {item.paths ? item.paths.map((d) => <path key={d} d={d} />) : <path d={item.d} />}
                  </svg>
                  <span className="font-serif text-base text-[rgb(63,64,56)]">{item.text}</span>
                </div>
              ))}
            </div>
            <div className="mb-[26px] rounded-[0_10px_10px_0] border border-l-[3px] border-[rgb(220,216,205)] border-l-gold bg-white px-[22px] py-[18px]">
              <p className="mb-2 font-serif text-base italic leading-[1.5] text-[rgb(63,64,56)]">
                &ldquo;Most intellectually rigorous biblical experience I&rsquo;ve ever had. The depth was unmatched.&rdquo;
              </p>
              <span className="font-sans text-[13px] font-semibold uppercase tracking-[0.04em] text-gold-dark">Dr. Richard — Neurosurgeon, Stanford MBA</span>
            </div>
            <div className="flex flex-wrap items-center gap-5">
              <a href="#assessment" className="inline-flex items-center gap-2.5 rounded-full bg-gold px-[30px] py-[15px] font-sans text-sm font-semibold uppercase tracking-[0.1em] text-ink no-underline">Register now</a>
              <span className="font-sans text-[13px] font-semibold uppercase tracking-[0.04em] text-[rgb(110,111,96)]">Aug 2025 · 10 days · 20 spots · from $10,000</span>
            </div>
          </div>
        </div>
      </section>

      {/* Social proof */}
      <section className="bg-ink py-[120px]">
        <div className="mx-auto max-w-[1160px] px-8">
          <div className="mx-auto mb-16 max-w-[760px] text-center">
            <div className="mb-4 font-sans text-xs font-semibold uppercase tracking-[0.28em] text-gold">Social proof</div>
            <h2 className="font-sans text-[32px] font-bold uppercase leading-[1.04] tracking-[0.005em] text-cream-solid sm:text-[44px]">
              Where high-capacity leaders go when success stops being enough
            </h2>
          </div>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {SOCIAL_PROOF.map((t) => (
              <div key={t.name} className="rounded-[14px] border border-gold/[0.14] bg-card px-8 py-9">
                <div className="h-[30px] font-serif text-[60px] font-semibold leading-[0.5] text-gold/40">&ldquo;</div>
                <p className="mb-6 font-serif text-lg italic leading-[1.6] text-cream">{t.quote}</p>
                <div className="font-sans text-sm font-semibold uppercase tracking-[0.04em] text-gold">{t.name}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Unoffendable Heart */}
      <section className="relative overflow-hidden bg-ink-alt py-[120px]">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(80%_120%_at_82%_50%,rgba(194,160,100,0.12),transparent_55%)]" />
        <div className="relative mx-auto grid max-w-[1160px] grid-cols-1 items-center gap-16 px-8 md:grid-cols-[1fr_0.8fr]">
          <div>
            <span className="mb-6 inline-block rounded-full border border-gold/50 px-[15px] py-[7px] font-sans text-[11px] font-semibold uppercase tracking-[0.14em] text-gold">
              New Release · October 2025
            </span>
            <h2 className="mb-[22px] font-sans text-[32px] font-bold uppercase leading-none tracking-[0.005em] text-cream-solid sm:text-[44px]">
              The next frontier: Unoffendable Heart
            </h2>
            <p className="mb-4 font-serif text-lg leading-[1.66] text-cream/72">
              In business, offense kills partnerships, cultures, and opportunities. In faith, it&rsquo;s no different.
            </p>
            <p className="mb-[30px] font-serif text-lg leading-[1.66] text-cream/72">
              Mike&rsquo;s new book — with a foreword by the #1 author in Protestant Christianity — examines how
              offense operates as a strategic weapon against high-performers who are <em>this close</em> to their
              breakthrough. Available October 2025, nationwide at Barnes &amp; Noble.
            </p>
            <a href="#assessment" className="inline-flex items-center gap-2.5 rounded-full bg-gold px-[30px] py-[15px] font-sans text-sm font-semibold uppercase tracking-[0.1em] text-ink no-underline">Pre-order your copy</a>
          </div>
          <div className="flex justify-center">
            <div className="relative aspect-[2/3] w-[280px] overflow-hidden rounded-[6px_12px_12px_6px] shadow-[-2px_0_0_inset_rgba(0,0,0,0.2),0_36px_60px_-18px_rgba(0,0,0,0.7)]">
              <img src={unoffendableHeartCover} alt="Unoffendable Heart — book cover" className="h-full w-full object-cover" />
            </div>
          </div>
        </div>
      </section>

      {/* From Chaos to Clarity */}
      <section id="chaos-to-clarity" className="bg-paper py-[120px]">
        <div className="mx-auto grid max-w-[1160px] grid-cols-1 items-center gap-16 px-8 md:grid-cols-[0.8fr_1fr]">
          <div className="flex justify-center">
            <div className="relative aspect-[2/3] w-[280px] overflow-hidden rounded-[6px_12px_12px_6px] shadow-[-2px_0_0_inset_rgba(0,0,0,0.14),0_34px_56px_-18px_rgba(53,61,42,0.4)]">
              <img src={chaosClarityCover} alt="From Chaos to Clarity — book cover" className="h-full w-full object-cover" />
            </div>
          </div>
          <div>
            <div className="mb-4 font-sans text-xs font-semibold uppercase tracking-[0.28em] text-gold-dark">Bestselling Book · From Chaos to Clarity</div>
            <h2 className="mb-5 font-sans text-[32px] font-bold uppercase leading-[1.02] tracking-[0.005em] text-charcoal sm:text-[42px]">
              From Chaos to Clarity: No Turning Back
            </h2>
            <p className="mb-4 font-serif text-lg leading-[1.64] text-[rgb(63,64,56)]">
              We live in a time when culture distracts us easily from stepping into a life of fullness through
              Christ. As the number of voices in our lives has increased, so has the chaos — and many of us
              feel powerless to commit to the singular aim of our existence.
            </p>
            <p className="mb-[30px] font-serif text-lg leading-[1.64] text-[rgb(63,64,56)]">
              Drawing on his own journey and the lives of Joshua and Caleb, Mike shows how God uses your
              brokenness, fears, and shame to bring revival — so you can cut through the chaos and go after
              Jesus with all of your heart.
            </p>
            <div className="flex flex-wrap items-center gap-4">
              <a href="#chaos-to-clarity" className="inline-flex items-center gap-2.5 rounded-full bg-gold px-[30px] py-[15px] font-sans text-sm font-semibold uppercase tracking-[0.1em] text-ink no-underline">Order the book</a>
              <span className="font-serif text-[15px] text-[rgb(110,111,96)]">Paperback, ebook &amp; audio · also in Italian &amp; Portuguese</span>
            </div>
          </div>
        </div>
      </section>

      {/* Membership */}
      <section id="membership" className="bg-ink py-[120px]">
        <div className="mx-auto max-w-[900px] px-8">
          <div className="relative overflow-hidden rounded-[20px] border border-gold/20 bg-card px-14 py-[72px] text-center">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(70%_120%_at_50%_0%,rgba(194,160,100,0.1),transparent_60%)]" />
            <div className="relative">
              <div className="mb-4 font-sans text-xs font-semibold uppercase tracking-[0.28em] text-gold">Membership for leaders</div>
              <h2 className="mb-5 font-sans text-[34px] font-bold uppercase leading-none tracking-[0.005em] text-cream-solid sm:text-[46px]">
                Monthly practice for the peace success didn&rsquo;t buy
              </h2>
              <p className="mx-auto mb-10 max-w-[600px] font-serif text-lg leading-[1.6] text-cream/70">
                At $99/month, get Mike&rsquo;s monthly mindset, neuroscience, and spiritual formation teachings, a
                peer community of high-capacity leaders doing the same inner work, and member-first access to
                events, tours, and programs.
              </p>
              <div className="flex flex-col items-center gap-4">
                <div className="font-sans text-[34px] font-bold text-cream-solid">
                  $99<span className="text-base font-medium text-cream/60">/mo</span>
                </div>
                <Link to="/onboarding?tier=leader" className="inline-flex items-center gap-2.5 rounded-full bg-gold px-[42px] py-[17px] font-sans text-[15px] font-semibold uppercase tracking-[0.1em] text-ink no-underline">
                  Join the movement
                </Link>
                <span className="font-serif text-sm text-cream/55">Cancel anytime. No contracts.</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Free assessment */}
      <section id="assessment" className="bg-ink-alt py-[120px]">
        <div className="mx-auto max-w-[720px] px-8 text-center">
          <div className="mb-4 font-sans text-xs font-semibold uppercase tracking-[0.28em] text-gold">Free assessment</div>
          <h2 className="mb-5 font-sans text-[36px] font-bold uppercase leading-none tracking-[0.005em] text-cream-solid sm:text-[48px]">
            Start with 5 minutes. Find where profit outran peace.
          </h2>
          <p className="mx-auto mb-10 max-w-[600px] font-serif text-lg leading-[1.6] text-cream/72">
            The Peace &amp; Performance Assessment maps your inner life across 5 dimensions — and shows you
            exactly where your success has outpaced your soul.
          </p>
          <form className="mx-auto flex max-w-[560px] flex-wrap justify-center gap-3">
            <input type="text" placeholder="First name" className="min-w-[130px] flex-1 rounded-full border border-cream/[0.18] bg-ink px-[22px] py-[15px] font-serif text-base text-cream-solid outline-none" />
            <input type="email" placeholder="Email address" className="min-w-[170px] flex-[1.4] rounded-full border border-cream/[0.18] bg-ink px-[22px] py-[15px] font-serif text-base text-cream-solid outline-none" />
            <Link to="/onboarding?tier=leader" className="whitespace-nowrap rounded-full bg-gold px-7 py-[15px] font-sans text-[13px] font-semibold uppercase tracking-[0.1em] text-ink no-underline">Join the movement</Link>
          </form>
          <p className="mt-[18px] font-serif text-[13px] text-cream/50">Personalized report delivered immediately. No cost.</p>
        </div>
      </section>
    </PublicLayout>
  )
}
