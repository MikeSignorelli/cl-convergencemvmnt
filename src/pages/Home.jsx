import { Link } from 'react-router-dom'
import PublicLayout from '../components/PublicLayout'
import heroPhoto from '../assets/images/drop-a-hero-photo-of-mike.webp'
import mikePortrait from '../assets/images/drop-a-portrait-of-mike.webp'
import inheritFreedomCover from '../assets/images/inherit-your-freedom-book-cover.webp'
import chaosClarityCover from '../assets/images/from-chaos-to-clarity-book-cover.webp'
import unoffendableHeartCover from '../assets/images/unoffendable-heart-book-cover.webp'
import greeceTurkeyImg from '../assets/images/greece-amp-turkey-mars-hill-ephesus.webp'
import restoreConferenceImg from '../assets/images/restore-conference.webp'
import unoffendableLaunchImg from '../assets/images/unoffendable-heart-launch-event.webp'

const CHECKMARK = (
  <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="#C2A064" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" className="mt-1 shrink-0">
    <path d="M20 6 9 17l-5-5" />
  </svg>
)

const TESTIMONIALS = [
  {
    initials: 'SM',
    bg: 'bg-gold',
    quote: 'It identified the exact anger pattern I inherited from my dad — one I was already passing to my daughter. I haven’t yelled at my kids in four months.',
    name: 'Sarah M.',
    role: 'Mom of 3 · Seeker',
  },
  {
    initials: 'DR',
    bg: 'bg-[rgb(156,140,106)]',
    quote: 'The most intellectually rigorous biblical experience I’ve had in 30 years as a Christian. I finally understand what I believe — and why.',
    name: 'Dr. Richard',
    role: 'Neurosurgeon, Stanford MBA',
  },
  {
    initials: 'PM',
    bg: 'bg-[rgb(107,115,85)]',
    quote: 'Stuck at 175 for 2.5 years. I implemented Mike’s systems. 90 days later we had 320. My marriage is thriving. I work 48 hours a week.',
    name: 'Pastor Marcus',
    role: 'Rural Ohio · Pastor',
    textCream: true,
  },
]

const EVENTS = [
  {
    img: greeceTurkeyImg,
    alt: 'Greece & Turkey — Mars Hill / Ephesus',
    dateBadge: 'August 2025',
    tagBadge: '20 Spots Only',
    title: 'Greece & Turkey Biblical Tour',
    desc: 'Stand where Paul walked. Study Scripture where it was written. 10 days, 2 hours of deep teaching at every site. Not tourism — transformation.',
    cta: 'Register — limited',
    href: '/leaders#tour',
  },
  {
    img: restoreConferenceImg,
    alt: 'Restore Conference',
    dateBadge: 'Date TBA',
    title: 'ALIVE CONFERENCE',
    desc: 'Alive Conference 2026 is a 3-day encounter that will activate your calling, stir your faith, and connect you to something bigger than yourself.',
    cta: 'Get notified',
    href: '#events',
  },
  {
    img: unoffendableLaunchImg,
    alt: 'Unoffendable Heart — launch event',
    dateBadge: 'October 2025',
    title: 'Unoffendable Heart Launch',
    desc: 'A live celebration of Mike’s new book release. Details coming soon.',
    cta: 'Pre-order list',
    href: '#events',
  },
]

export default function Home() {
  return (
    <PublicLayout page="/">
      {/* Hero */}
      <header id="top" className="relative overflow-hidden bg-ink">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(78%_70%_at_18%_4%,rgba(194,160,100,0.15),transparent_60%)]" />
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(transparent_62%,rgba(10,13,7,0.55))]" />
        <div className="relative mx-auto grid max-w-[1200px] grid-cols-1 items-center gap-16 px-8 py-[104px] md:grid-cols-[1.32fr_1fr] md:pb-[116px]">
          <div>
            <div className="mb-8 inline-flex gap-1.5 rounded-full border border-cream/12 bg-white/[0.04] p-[5px]">
              <span className="rounded-full bg-gold px-[18px] py-2 font-sans text-[11px] font-semibold uppercase tracking-[0.1em] text-ink">For Disciples</span>
              <Link to="/leaders" className="inline-flex items-center rounded-full px-[18px] py-2 font-sans text-[11px] font-semibold uppercase tracking-[0.1em] text-cream/72 no-underline">For Leaders</Link>
              <Link to="/pastors" className="inline-flex items-center rounded-full px-[18px] py-2 font-sans text-[11px] font-semibold uppercase tracking-[0.1em] text-cream/72 no-underline">For Pastors</Link>
            </div>
            <h1 className="mb-7 font-sans text-[42px] font-bold uppercase leading-[0.98] tracking-[0.005em] text-white sm:text-[50px]">
              Break Free From Inherited Patterns.
            </h1>
            <p className="mb-10 max-w-[500px] font-serif text-lg leading-[1.62] text-cream/74 sm:text-[19px]">
              A faith-based media and growth community for seekers ready to go deeper, breaking the
              patterns they were handed, rebuilding what God intended, and leaving a legacy that lasts
              beyond their lifetimes.
            </p>
            <div className="flex flex-wrap items-center gap-6">
              <a href="#membership" className="inline-flex items-center gap-2.5 rounded-full bg-gold px-[34px] py-4 font-sans text-sm font-semibold uppercase tracking-[0.12em] text-ink no-underline">
                Start free
              </a>
            </div>
          </div>
          <div className="relative aspect-[4/5] overflow-hidden rounded-2xl border border-gold/24 shadow-[0_34px_66px_-22px_rgba(0,0,0,0.7)]">
            <img src={heroPhoto} alt="Mike Signorelli" className="h-full w-full object-cover" />
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

      {/* Why you're here */}
      <section className="bg-ink py-32">
        <div className="mx-auto max-w-[800px] px-8 text-center">
          <div className="mb-[22px] font-sans text-xs font-semibold uppercase tracking-[0.28em] text-gold">Why you&rsquo;re here</div>
          <h2 className="mb-[34px] font-sans text-[36px] font-bold uppercase leading-none tracking-[0.005em] text-cream-solid sm:text-[50px]">
            You got saved. But the patterns didn&rsquo;t leave.
          </h2>
          <p className="mb-[22px] font-serif text-[19px] leading-[1.72] text-cream/72">
            You gave your life to Jesus thinking the anger, the fear, the dysfunction would finally stop.
            But three years later, you&rsquo;re still getting triggered the same way.
          </p>
          <p className="mb-14 font-serif text-[19px] leading-[1.72] text-cream/72">That&rsquo;s not a faith problem. That&rsquo;s a pattern problem.</p>
          <p className="mb-14 font-serif text-2xl italic leading-[1.32] text-gold sm:text-[30px]">
            Salvation is instant.
            <br />Transformation is intentional.
          </p>
          <p className="font-serif text-[19px] leading-[1.72] text-cream/72">
            And most Christians are never given the tools to do the work. That&rsquo;s why <br />Convergence MVMNT exists.
          </p>
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
            <div className="flex flex-col rounded-[14px] border border-gold/[0.14] bg-card p-[34px] transition-transform hover:-translate-y-1">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#C2A064" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" />
                <path d="M7 11V7a5 5 0 0 1 9.9-1" />
              </svg>
              <h3 className="mb-3 mt-[26px] font-sans text-2xl font-bold uppercase tracking-[0.01em] text-cream-solid">Membership</h3>
              <p className="mb-6 flex-1 font-serif text-base leading-[1.62] text-cream/66">
                Teachings, tools, and a community of people serious about transformation — not just inspiration.
              </p>
              <Link to="/onboarding" className="inline-flex w-fit items-center gap-2 rounded-full bg-gold px-6 py-3 font-sans text-[13px] font-semibold uppercase tracking-[0.06em] text-ink no-underline">
                Join the movement From $49/mo
              </Link>
            </div>
            <div className="flex flex-col rounded-[14px] border border-gold/[0.14] bg-card p-[34px] transition-transform hover:-translate-y-1">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#C2A064" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                <path d="M2 4h7a3 3 0 0 1 3 3v13a2.5 2.5 0 0 0-2.5-2.5H2z" />
                <path d="M22 4h-7a3 3 0 0 0-3 3v13a2.5 2.5 0 0 1 2.5-2.5H22z" />
              </svg>
              <h3 className="mb-3 mt-[26px] font-sans text-2xl font-bold uppercase tracking-[0.01em] text-cream-solid">Courses &amp; Mentorship</h3>
              <p className="mb-6 flex-1 font-serif text-base leading-[1.62] text-cream/66">
                Structured programs that take you from knowing to actually living differently — breaking patterns, building a thriving life.
              </p>
              <Link to="/onboarding" className="inline-flex w-fit items-center gap-2 rounded-full bg-gold px-6 py-3 font-sans text-[13px] font-semibold uppercase tracking-[0.06em] text-ink no-underline">
                Join the movement From $497
              </Link>
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
              <a href="#events" className="inline-flex items-center gap-1.5 font-sans text-[13px] font-semibold uppercase tracking-[0.06em] text-gold no-underline">See all events →</a>
            </div>
          </div>
        </div>
      </section>

      {/* Meet Mike */}
      <section id="meet-mike" className="bg-paper py-[120px]">
        <div className="mx-auto grid max-w-[1160px] grid-cols-1 items-center gap-16 px-8 md:grid-cols-[0.9fr_1.1fr]">
          <div className="relative aspect-[4/5] overflow-hidden rounded-2xl shadow-[0_30px_60px_-24px_rgba(35,40,26,0.4)]">
            <img src={mikePortrait} alt="Mike Signorelli portrait" className="h-full w-full object-cover" />
          </div>
          <div>
            <div className="mb-4 font-sans text-xs font-semibold uppercase tracking-[0.28em] text-gold-dark">Who is behind this</div>
            <h2 className="mb-[26px] font-sans text-[34px] font-bold uppercase leading-none tracking-[0.005em] text-charcoal sm:text-[46px]">
              Built by someone who has lived it.
            </h2>
            <p className="mb-[18px] font-serif text-lg leading-[1.7] text-[rgb(74,75,65)]">
              Pastor Mike Signorelli isn&rsquo;t a theologian who teaches from a distance. He built the fastest-growing
              church in America five years running — while protecting his marriage, raising his family, and doing
              the deep personal work of breaking his own generational patterns.
            </p>
            <p className="mb-[34px] font-serif text-lg leading-[1.7] text-[rgb(74,75,65)]">
              He&rsquo;s been a seeker. He&rsquo;s been a leader stretched past his limits. Everything inside Convergence
              MVMNT was built from transformation — not theory.
            </p>
            <div className="mb-[38px] grid grid-cols-1 gap-x-7 gap-y-3.5 sm:grid-cols-2">
              {[
                { d: 'M12 2a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3zM19 10a7 7 0 0 1-14 0M12 17v4', text: 'TBN Weekly Show — 3M/week' },
                { text: '1.6M YouTube Subscribers', icon: 'youtube' },
                { d: 'M4 4.5A2.5 2.5 0 0 1 6.5 2H20v18H6.5A2.5 2.5 0 0 0 4 22.5z', text: 'Baker Books Author' },
                { d: 'M3 21h18M5 21V8l7-5 7 5v13M9 21v-6h6v6', text: 'Founding Pastor, V1 Church' },
              ].map((item) => (
                <div key={item.text} className="flex items-center gap-[11px]">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#A6843C" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                    {item.icon === 'youtube' ? (
                      <>
                        <rect x="2" y="5" width="20" height="14" rx="4" />
                        <path d="m10 9 5 3-5 3z" fill="#A6843C" stroke="none" />
                      </>
                    ) : (
                      <path d={item.d} />
                    )}
                  </svg>
                  <span className="font-serif text-[15px] text-[rgb(58,59,51)]">{item.text}</span>
                </div>
              ))}
            </div>
            <a href="#meet-mike" className="inline-flex items-center gap-2.5 rounded-full border-[1.5px] border-charcoal px-[30px] py-3.5 font-sans text-[13px] font-semibold uppercase tracking-[0.12em] text-charcoal no-underline">
              Learn Mike&rsquo;s story
            </a>
          </div>
        </div>
      </section>

      {/* Featured book */}
      <section id="featured" className="bg-ink-alt py-[120px]">
        <div className="mx-auto grid max-w-[1160px] grid-cols-1 items-center gap-16 px-8 md:grid-cols-[0.85fr_1.15fr]">
          <div className="flex justify-center">
            <div className="relative aspect-[2/3] w-[300px] overflow-hidden rounded-[6px_12px_12px_6px] shadow-[-2px_0_0_inset_rgba(0,0,0,0.2),0_34px_56px_-18px_rgba(0,0,0,0.7)]">
              <img src={inheritFreedomCover} alt="Inherit Your Freedom — book cover" className="h-full w-full object-cover" />
            </div>
          </div>
          <div>
            <div className="mb-4 font-sans text-xs font-semibold uppercase tracking-[0.28em] text-gold">Featured · Inherit Your Freedom</div>
            <h2 className="mb-[22px] font-sans text-[34px] font-bold uppercase leading-none tracking-[0.005em] text-cream-solid sm:text-[46px]">
              The book that changes everything.
            </h2>
            <p className="mb-[30px] font-serif text-lg leading-[1.68] text-cream/72">
              Mike&rsquo;s complete framework for breaking the generational patterns standing between who you are and
              who God created you to be — the practical, biblical roadmap for identifying what you inherited,
              renouncing what doesn&rsquo;t belong to you, and building daily disciplines that make freedom permanent.
            </p>
            <div className="mb-[34px] flex items-baseline gap-3.5">
              <span className="font-sans text-5xl font-bold leading-none text-gold">$47</span>
              <span className="font-serif text-base text-cream/55">Also available: the complete 90-Day Intensive</span>
            </div>
            <div className="flex flex-wrap gap-4">
              <a href="#featured" className="inline-flex items-center gap-2.5 rounded-full bg-gold px-[30px] py-[15px] font-sans text-sm font-semibold uppercase tracking-[0.1em] text-ink no-underline">Order your copy</a>
              <a href="#featured" className="inline-flex items-center gap-2.5 rounded-full border-[1.5px] border-gold/50 px-[30px] py-[15px] font-sans text-sm font-semibold uppercase tracking-[0.1em] text-cream-solid no-underline">The 90-Day Intensive</a>
            </div>
          </div>
        </div>
      </section>

      {/* From Chaos to Clarity */}
      <section id="chaos-to-clarity" className="bg-ink py-[120px]">
        <div className="mx-auto grid max-w-[1160px] grid-cols-1 items-center gap-16 px-8 md:grid-cols-[1.15fr_0.85fr]">
          <div>
            <div className="mb-4 font-sans text-xs font-semibold uppercase tracking-[0.28em] text-gold">Bestselling Book · From Chaos to Clarity</div>
            <h2 className="mb-[22px] font-sans text-[34px] font-bold uppercase leading-none tracking-[0.005em] text-cream-solid sm:text-[46px]">
              Have you reached the point of no return?
            </h2>
            <p className="mb-[18px] font-serif text-lg leading-[1.68] text-cream/72">
              We live in a time when culture distracts us easily from stepping into a life of fullness through
              Christ. As the number of voices in our lives has increased, so has the chaos — and many of us
              feel powerless to commit to the singular aim of our existence.
            </p>
            <p className="mb-[30px] font-serif text-lg leading-[1.68] text-cream/72">
              Drawing on his own journey and the lives of Joshua and Caleb, Mike shows how God uses your
              brokenness, fears, and shame to bring revival — so you can cut through the chaos and go after
              Jesus with all of your heart. Who you were a moment ago does not have to dictate who you are now.
            </p>
            <div className="mb-[34px] flex items-baseline gap-3.5">
              <span className="font-sans text-5xl font-bold leading-none text-gold">$18</span>
              <span className="font-serif text-base text-cream/55">Paperback, ebook &amp; audio · also in Italian &amp; Portuguese</span>
            </div>
            <div className="flex flex-wrap gap-4">
              <a href="#chaos-to-clarity" className="inline-flex items-center gap-2.5 rounded-full bg-gold px-[30px] py-[15px] font-sans text-sm font-semibold uppercase tracking-[0.1em] text-ink no-underline">Order the book</a>
              <a href="#chaos-to-clarity" className="inline-flex items-center gap-2.5 rounded-full border-[1.5px] border-gold/50 px-[30px] py-[15px] font-sans text-sm font-semibold uppercase tracking-[0.1em] text-cream-solid no-underline">Get the audio series</a>
            </div>
          </div>
          <div className="flex justify-center">
            <div className="relative aspect-[2/3] w-[300px] overflow-hidden rounded-[6px_12px_12px_6px] shadow-[-2px_0_0_inset_rgba(0,0,0,0.2),0_34px_56px_-18px_rgba(0,0,0,0.7)]">
              <img src={chaosClarityCover} alt="From Chaos to Clarity — book cover" className="h-full w-full object-cover" />
            </div>
          </div>
        </div>
      </section>

      {/* Unoffendable Heart pre-order */}
      <section className="relative overflow-hidden bg-ink py-[120px]">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(80%_120%_at_82%_50%,rgba(194,160,100,0.12),transparent_55%)]" />
        <div className="relative mx-auto grid max-w-[1160px] grid-cols-1 items-center gap-16 px-8 md:grid-cols-[1fr_0.8fr]">
          <div>
            <span className="mb-6 inline-block rounded-full border border-gold/50 px-[15px] py-[7px] font-sans text-[11px] font-semibold uppercase tracking-[0.14em] text-gold">
              New Release · October 2025
            </span>
            <h2 className="mb-[22px] font-sans text-[34px] font-bold uppercase leading-none tracking-[0.005em] text-cream-solid sm:text-[46px]">
              The most offended generation in history. There&rsquo;s an answer.
            </h2>
            <p className="mb-[30px] font-serif text-lg leading-[1.68] text-cream/72">
              <em>Unoffendable Heart</em> — Mike&rsquo;s newest book with a foreword by the #1 author in Protestant
              Christianity — comes to Barnes &amp; Noble nationwide this October. Offense is the invisible chain
              holding millions of Christians back. This book is the antidote.
            </p>
            <form className="flex flex-wrap items-stretch gap-3">
              <input type="text" placeholder="First name" className="min-w-[130px] flex-1 rounded-full border border-cream/[0.18] bg-ink-deep px-[22px] py-[15px] font-serif text-base text-cream-solid outline-none" />
              <input type="email" placeholder="Email address" className="min-w-[170px] flex-[1.4] rounded-full border border-cream/[0.18] bg-ink-deep px-[22px] py-[15px] font-serif text-base text-cream-solid outline-none" />
              <button type="submit" className="whitespace-nowrap rounded-full bg-gold px-7 py-[15px] font-sans text-[13px] font-semibold uppercase tracking-[0.1em] text-ink">Notify me</button>
            </form>
            <p className="mt-3.5 font-serif text-[13px] text-cream/45">We respect your privacy. Unsubscribe at any time.</p>
          </div>
          <div className="flex justify-center">
            <div className="relative aspect-[2/3] w-[280px] overflow-hidden rounded-[6px_12px_12px_6px] shadow-[-2px_0_0_inset_rgba(0,0,0,0.2),0_36px_60px_-18px_rgba(0,0,0,0.7)]">
              <img src={unoffendableHeartCover} alt="Unoffendable Heart — book cover" className="h-full w-full object-cover" />
            </div>
          </div>
        </div>
      </section>

      {/* Transformation stories */}
      <section className="bg-ink-alt py-[120px]">
        <div className="mx-auto max-w-[1160px] px-8">
          <div className="mx-auto mb-16 max-w-[760px] text-center">
            <div className="mb-4 font-sans text-xs font-semibold uppercase tracking-[0.28em] text-gold">Transformation stories</div>
            <h2 className="font-sans text-[34px] font-bold uppercase leading-none tracking-[0.005em] text-cream-solid sm:text-[48px]">
              Real people. Real transformation.
            </h2>
          </div>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {TESTIMONIALS.map((t) => (
              <div key={t.name} className="rounded-[14px] border border-gold/[0.14] bg-card p-8">
                <div className="h-[30px] font-serif text-[60px] font-semibold leading-[0.5] text-gold/40">&ldquo;</div>
                <p className="mb-[26px] font-serif text-lg italic leading-[1.6] text-cream">{t.quote}</p>
                <div className="flex items-center gap-3">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-full font-sans text-sm font-bold ${t.bg} ${t.textCream ? 'text-cream-solid' : 'text-ink'}`}>
                    {t.initials}
                  </div>
                  <div>
                    <div className="font-sans text-sm font-semibold uppercase tracking-[0.04em] text-gold">{t.name}</div>
                    <div className="font-serif text-[13px] text-cream/55">{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Membership CTA */}
      <section id="membership" className="bg-ink py-[120px]">
        <div className="mx-auto max-w-[900px] px-8">
          <div className="relative overflow-hidden rounded-[20px] border border-gold/20 bg-card px-8 py-16 text-center sm:px-14 sm:py-[72px]">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(70%_120%_at_50%_0%,rgba(194,160,100,0.1),transparent_60%)]" />
            <div className="relative">
              <div className="mb-4 font-sans text-xs font-semibold uppercase tracking-[0.28em] text-gold">Membership</div>
              <h2 className="mb-5 font-sans text-[34px] font-bold uppercase leading-none tracking-[0.005em] text-cream-solid sm:text-[48px]">
                Start with membership.
              </h2>
              <p className="mx-auto mb-10 max-w-[560px] font-serif text-lg leading-[1.6] text-cream/70">
                For $49/month, get exclusive teachings, community, tools, and content updated every month —
                so you never stop growing between programs.
              </p>
              <div className="mx-auto mb-11 grid max-w-[640px] grid-cols-1 gap-x-10 gap-y-3.5 text-left sm:grid-cols-2">
                {[
                  'Monthly teaching from Mike, members-only',
                  'The Convergence MVMNT community',
                  'Early access to courses & events',
                  'Member-only discounts on everything',
                  'Monthly Q&A opportunities with Mike',
                  'Cancel anytime. No contracts.',
                ].map((item) => (
                  <div key={item} className="flex items-start gap-[11px]">
                    {CHECKMARK}
                    <span className="font-serif text-base text-cream/82">{item}</span>
                  </div>
                ))}
              </div>
              <div className="flex flex-col items-center gap-4">
                <div className="font-sans text-[34px] font-bold text-cream-solid">
                  $49<span className="text-base font-medium text-cream/60">/mo</span>
                </div>
                <Link to="/onboarding?tier=disciple" className="inline-flex items-center gap-2.5 rounded-full bg-gold px-[42px] py-[17px] font-sans text-[15px] font-semibold uppercase tracking-[0.1em] text-ink no-underline">
                  Join the movement
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Events */}
      <section id="events" className="bg-paper py-[120px]">
        <div className="mx-auto max-w-[1160px] px-8">
          <div className="mx-auto mb-16 text-center">
            <div className="mb-4 font-sans text-xs font-semibold uppercase tracking-[0.28em] text-gold-dark">Events &amp; engagement</div>
            <h2 className="font-sans text-[34px] font-bold uppercase leading-none tracking-[0.005em] text-charcoal sm:text-[48px]">What&rsquo;s coming up</h2>
          </div>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {EVENTS.map((ev) => (
              <div key={ev.title} className="flex flex-col overflow-hidden rounded-[14px] border border-[rgb(230,226,218)] bg-white transition-transform hover:-translate-y-1">
                <div className="relative h-[220px] overflow-hidden">
                  <img src={ev.img} alt={ev.alt} className="h-full w-full object-cover" />
                  <span className="absolute right-3.5 top-3.5 rounded-full bg-ink px-3.5 py-1.5 font-sans text-[11px] font-semibold uppercase tracking-[0.06em] text-cream-solid">{ev.dateBadge}</span>
                  {ev.tagBadge && (
                    <span className="absolute left-3.5 top-3.5 rounded-full bg-gold px-[13px] py-1.5 font-sans text-[11px] font-semibold uppercase tracking-[0.06em] text-ink">{ev.tagBadge}</span>
                  )}
                </div>
                <div className="flex flex-1 flex-col p-[30px] pb-8">
                  <h3 className="mb-3 font-sans text-2xl font-bold uppercase tracking-[0.01em] text-charcoal">{ev.title}</h3>
                  <p className="mb-[22px] flex-1 font-serif text-base leading-[1.58] text-[rgb(85,86,74)]">{ev.desc}</p>
                  {ev.href.startsWith('/') ? (
                    <Link to={ev.href} className="self-start rounded-full border-[1.5px] border-charcoal px-6 py-3 font-sans text-xs font-semibold uppercase tracking-[0.1em] text-charcoal no-underline">
                      {ev.cta}
                    </Link>
                  ) : (
                    <a href={ev.href} className="self-start rounded-full border-[1.5px] border-charcoal px-6 py-3 font-sans text-xs font-semibold uppercase tracking-[0.1em] text-charcoal no-underline">
                      {ev.cta}
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Free quiz */}
      <section className="bg-ink py-[120px]">
        <div className="mx-auto max-w-[720px] px-8 text-center">
          <div className="mb-4 font-sans text-xs font-semibold uppercase tracking-[0.28em] text-gold">Free quiz</div>
          <h2 className="mb-5 font-sans text-[34px] font-bold uppercase leading-none tracking-[0.005em] text-cream-solid sm:text-[48px]">Not sure where to start?</h2>
          <p className="mx-auto mb-2.5 max-w-[560px] font-serif text-lg leading-[1.62] text-cream/72">
            Take the free Five-Fold Gift Quiz and discover your spiritual gift — and the generational
            patterns blocking you from walking in it fully.
          </p>
          <p className="mb-10 font-sans text-[13px] font-semibold uppercase tracking-[0.08em] text-gold">5 minutes · Instant results · No cost</p>
          <form className="mx-auto flex max-w-[560px] flex-wrap justify-center gap-3">
            <input type="text" placeholder="First name" className="min-w-[130px] flex-1 rounded-full border border-cream/[0.18] bg-ink-alt px-[22px] py-[15px] font-serif text-base text-cream-solid outline-none" />
            <input type="email" placeholder="Email address" className="min-w-[170px] flex-[1.4] rounded-full border border-cream/[0.18] bg-ink-alt px-[22px] py-[15px] font-serif text-base text-cream-solid outline-none" />
            <button type="submit" className="whitespace-nowrap rounded-full bg-gold px-7 py-[15px] font-sans text-[13px] font-semibold uppercase tracking-[0.1em] text-ink">Take the quiz</button>
          </form>
          <p className="mt-[18px] font-serif text-[13px] text-cream/50">Trusted by 10,000+ Christians seeking transformation.</p>
        </div>
      </section>
    </PublicLayout>
  )
}
