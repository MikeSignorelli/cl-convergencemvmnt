import { Link } from 'react-router-dom'
import PublicLayout from '../components/PublicLayout'
import heroPhoto from '../assets/images/drop-a-hero-photo-of-mike.webp'
import mikePortrait from '../assets/images/drop-a-portrait-of-mike.webp'
import teachingPhoto from '../assets/images/mike-with-pastors-leading-a-room.webp'

const CHECKMARK = (
  <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="#C2A064" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" className="mt-1 shrink-0">
    <path d="M20 6 9 17l-5-5" />
  </svg>
)

// Same three-audience split used across the rest of the site (Home/Leaders/
// Pastors) — membership isn't a separate product per tier, it's the same
// $49/mo access with content that adapts to where you are.
const TIERS = [
  {
    label: 'Disciple',
    desc: 'Break the patterns you inherited. Build the daily disciplines that make freedom permanent.',
  },
  {
    label: 'Leader',
    desc: 'Lead your family, team, or business without burning out or repeating what was modeled for you.',
  },
  {
    label: 'Pastor',
    desc: 'Build the systems and support that make ministry sustainable for decades, not seasons.',
  },
]

const PAIN_POINTS = [
  'You gave your life to Jesus, but the anger, fear, or dysfunction never actually left',
  'You know the theory — you’ve read the books, heard the sermons — but nothing changes on a Tuesday afternoon',
  'You’re doing this alone, with no one checking in on whether you’re actually doing the work',
  'You lead others while quietly repeating the same patterns you promised you’d break',
  'Every course you’ve bought gave you information, but never a system you actually stuck with',
]

const INCLUDED = [
  'Monthly teaching from Mike, members-only',
  'The full course library — Freedom & Healing, Leadership & Legacy, and Church Systems for Pastors',
  'The Convergence MVMNT community',
  'Early access to new courses & events',
  'Member-only discounts on everything',
  'Monthly Q&A opportunities with Mike',
  'Cancel anytime. No contracts.',
]

const CREDENTIALS = [
  { d: 'M12 2a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3zM19 10a7 7 0 0 1-14 0M12 17v4', text: 'TBN Weekly Show — 3M/week' },
  { text: '1.6M YouTube Subscribers', icon: 'youtube' },
  { d: 'M4 4.5A2.5 2.5 0 0 1 6.5 2H20v18H6.5A2.5 2.5 0 0 0 4 22.5z', text: 'Baker Books Author' },
  { d: 'M3 21h18M5 21V8l7-5 7 5v13M9 21v-6h6v6', text: 'Founding Pastor, V1 Church' },
]

// Same three testimonials already live on the Home page — reused as-is
// rather than inventing new ones for this page.
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

export default function Membership() {
  return (
    <PublicLayout page="/membership">
      {/* Hero */}
      <header id="top" className="relative overflow-hidden bg-ink">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(78%_70%_at_18%_4%,rgba(194,160,100,0.15),transparent_60%)]" />
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(transparent_62%,rgba(10,13,7,0.55))]" />
        <div className="relative mx-auto grid max-w-[1200px] grid-cols-1 items-center gap-16 px-8 py-[100px] md:grid-cols-[1.32fr_1fr] md:pb-[112px]">
          <div>
            <div className="mb-7 inline-flex items-center gap-2.5 rounded-full border border-gold/30 bg-white/[0.04] px-4 py-2">
              <span className="font-sans text-xs font-semibold uppercase tracking-[0.12em] text-gold">$49/month</span>
              <span className="text-cream/30">·</span>
              <span className="font-sans text-xs font-semibold uppercase tracking-[0.12em] text-cream/60">Cancel anytime</span>
            </div>
            <h1 className="mb-7 font-sans text-[42px] font-bold uppercase leading-[0.98] tracking-[0.005em] text-white sm:text-[52px]">
              You know God called you to more. You just don&rsquo;t have the path.
            </h1>
            <p className="mb-10 max-w-[520px] font-serif text-lg leading-[1.62] text-cream/[74%] sm:text-[19px]">
              Membership is monthly teaching, a full course library, and a community of people doing the
              same work — breaking inherited patterns, leading without burning out, building something
              that outlasts you. Not information. A system you actually follow through on.
            </p>
            <div className="flex flex-wrap items-center gap-6">
              <Link to="/onboarding?tier=disciple" className="inline-flex items-center gap-2.5 rounded-full bg-gold px-[34px] py-4 font-sans text-sm font-semibold uppercase tracking-[0.12em] text-ink no-underline">
                Join the movement — $49/mo
              </Link>
              <a href="#included" className="font-sans text-[13px] font-semibold uppercase tracking-[0.1em] text-cream/60 no-underline hover:text-cream-solid">
                See what&rsquo;s included ↓
              </a>
            </div>
          </div>
          <div className="relative aspect-[4/5] overflow-hidden rounded-2xl border border-gold/[24%] shadow-[0_34px_66px_-22px_rgba(0,0,0,0.7)]">
            <img src={heroPhoto} alt="Mike Signorelli" className="h-full w-full object-cover" />
          </div>
        </div>
      </header>

      {/* Who this is for */}
      <section className="border-y border-cream/[0.06] bg-ink-alt py-[76px]">
        <div className="mx-auto max-w-[1160px] px-8">
          <div className="mx-auto mb-[52px] max-w-[640px] text-center">
            <div className="mb-4 font-sans text-xs font-semibold uppercase tracking-[0.28em] text-gold">One membership, wherever you are</div>
            <h2 className="font-sans text-[30px] font-bold uppercase leading-none tracking-[0.005em] text-cream-solid sm:text-[38px]">
              Your people are already inside.
            </h2>
          </div>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {TIERS.map((t) => (
              <div key={t.label} className="rounded-[14px] border border-gold/[0.14] bg-card p-8 text-center">
                <div className="mb-3 font-sans text-lg font-bold uppercase tracking-[0.04em] text-gold">{t.label}</div>
                <p className="font-serif text-[15px] leading-[1.6] text-cream/70">{t.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Sound familiar */}
      <section className="bg-ink py-32">
        <div className="mx-auto max-w-[760px] px-8 text-center">
          <div className="mb-[22px] font-sans text-xs font-semibold uppercase tracking-[0.28em] text-gold">Sound familiar?</div>
          <h2 className="mb-[46px] font-sans text-[34px] font-bold uppercase leading-none tracking-[0.005em] text-cream-solid sm:text-[46px]">
            Salvation is instant. Transformation is intentional.
          </h2>
          <div className="mx-auto mb-14 flex max-w-[560px] flex-col gap-5 text-left">
            {PAIN_POINTS.map((point) => (
              <div key={point} className="flex items-start gap-3.5">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-gold" />
                <span className="font-serif text-lg leading-[1.6] text-cream/[78%]">{point}</span>
              </div>
            ))}
          </div>
          <p className="font-serif text-xl italic leading-[1.5] text-gold sm:text-2xl">
            That&rsquo;s not a faith problem. That&rsquo;s a pattern problem — and most Christians are never
            given the tools to do the work.
          </p>
        </div>
      </section>

      {/* What's included */}
      <section id="included" className="relative overflow-hidden bg-ink-alt py-[120px]">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(70%_90%_at_82%_10%,rgba(194,160,100,0.1),transparent_55%)]" />
        <div className="relative mx-auto grid max-w-[1160px] grid-cols-1 items-center gap-16 px-8 md:grid-cols-[1fr_0.85fr]">
          <div>
            <div className="mb-4 font-sans text-xs font-semibold uppercase tracking-[0.28em] text-gold">Everything inside membership</div>
            <h2 className="mb-[26px] font-sans text-[34px] font-bold uppercase leading-none tracking-[0.005em] text-cream-solid sm:text-[44px]">
              One place. Every tool to break free.
            </h2>
            <p className="mb-10 font-serif text-lg leading-[1.64] text-cream/70">
              A growing library organized around where you actually need help — not a stack of courses
              you&rsquo;ll never finish.
            </p>
            <div className="grid grid-cols-1 gap-x-8 gap-y-4">
              {INCLUDED.map((item) => (
                <div key={item} className="flex items-start gap-[11px]">
                  {CHECKMARK}
                  <span className="font-serif text-base text-cream/[82%]">{item}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="relative aspect-[4/5] overflow-hidden rounded-2xl shadow-[0_30px_60px_-24px_rgba(0,0,0,0.5)]">
            <img src={teachingPhoto} alt="Mike teaching" className="h-full w-full object-cover" />
          </div>
        </div>
      </section>

      {/* Meet Mike */}
      <section className="bg-paper py-[120px]">
        <div className="mx-auto grid max-w-[1160px] grid-cols-1 items-center gap-16 px-8 md:grid-cols-[0.9fr_1.1fr]">
          <div className="relative aspect-[4/5] overflow-hidden rounded-2xl shadow-[0_30px_60px_-24px_rgba(35,40,26,0.4)]">
            <img src={mikePortrait} alt="Mike Signorelli portrait" className="h-full w-full object-cover" />
          </div>
          <div>
            <div className="mb-4 font-sans text-xs font-semibold uppercase tracking-[0.28em] text-gold-dark">Who&rsquo;s teaching inside</div>
            <h2 className="mb-[26px] font-sans text-[34px] font-bold uppercase leading-none tracking-[0.005em] text-charcoal sm:text-[44px]">
              Built by someone who has lived it.
            </h2>
            <p className="mb-[18px] font-serif text-lg leading-[1.7] text-[rgb(74,75,65)]">
              Pastor Mike Signorelli isn&rsquo;t a theologian who teaches from a distance. He built the
              fastest-growing church in America five years running — while protecting his marriage,
              raising his family, and doing the deep personal work of breaking his own generational
              patterns.
            </p>
            <p className="mb-[34px] font-serif text-lg leading-[1.7] text-[rgb(74,75,65)]">
              Every teaching inside membership comes from what actually worked for him — not theory.
            </p>
            <div className="grid grid-cols-1 gap-x-7 gap-y-3.5 sm:grid-cols-2">
              {CREDENTIALS.map((item) => (
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
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="bg-ink-alt py-[120px]">
        <div className="mx-auto max-w-[1160px] px-8">
          <div className="mx-auto mb-16 max-w-[760px] text-center">
            <div className="mb-4 font-sans text-xs font-semibold uppercase tracking-[0.28em] text-gold">Real members, real change</div>
            <h2 className="font-sans text-[34px] font-bold uppercase leading-none tracking-[0.005em] text-cream-solid sm:text-[48px]">
              Don&rsquo;t take our word for it.
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

      {/* Pricing */}
      <section id="join" className="bg-ink py-[120px]">
        <div className="mx-auto max-w-[900px] px-8">
          <div className="relative overflow-hidden rounded-[20px] border border-gold/20 bg-card px-8 py-16 text-center sm:px-14 sm:py-[72px]">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(70%_120%_at_50%_0%,rgba(194,160,100,0.1),transparent_60%)]" />
            <div className="relative">
              <div className="mb-4 font-sans text-xs font-semibold uppercase tracking-[0.28em] text-gold">Membership</div>
              <h2 className="mb-5 font-sans text-[34px] font-bold uppercase leading-none tracking-[0.005em] text-cream-solid sm:text-[48px]">
                Ready to stop waiting?
              </h2>
              <p className="mx-auto mb-10 max-w-[560px] font-serif text-lg leading-[1.6] text-cream/70">
                Every week you wait is another week doing this alone. The teaching, the library, and the
                community are ready when you are.
              </p>
              <div className="mx-auto mb-11 grid max-w-[640px] grid-cols-1 gap-x-10 gap-y-3.5 text-left sm:grid-cols-2">
                {INCLUDED.map((item) => (
                  <div key={item} className="flex items-start gap-[11px]">
                    {CHECKMARK}
                    <span className="font-serif text-base text-cream/[82%]">{item}</span>
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
                <span className="font-serif text-[13px] text-cream/45">Cancel anytime. No contracts. Secure checkout via Stripe.</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </PublicLayout>
  )
}
