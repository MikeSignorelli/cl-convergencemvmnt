import { Link } from 'react-router-dom'
import PublicLayout from '../components/PublicLayout'

function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-cv-bg pt-20 pb-24 px-6">
      {/* decorative gradient blob */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-32 -right-48 w-[700px] h-[700px] rounded-full opacity-10"
        style={{ background: 'radial-gradient(circle, #C2A064 0%, transparent 70%)' }}
      />

      <div className="max-w-3xl mx-auto text-center relative z-10">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-cv-gold/30 bg-cv-gold/8 mb-8">
          <span className="w-1.5 h-1.5 rounded-full bg-cv-gold flex-shrink-0" aria-hidden="true" />
          <span className="font-sans font-semibold text-[10.5px] tracking-[0.2em] uppercase text-cv-gold">
            For Disciples
          </span>
        </div>

        <h1 className="font-sans font-bold text-5xl md:text-6xl lg:text-7xl leading-[1.01] uppercase tracking-tight text-white mb-6">
          Break the cycle.<br />
          <span className="text-cv-gold">Inherit your freedom.</span>
        </h1>

        <p className="font-serif text-lg md:text-xl text-cv-text/70 leading-relaxed max-w-xl mx-auto mb-10">
          Convergence MVMNT is a structured environment for men who are done carrying wounds they didn't choose — and ready to build a legacy they're proud of.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            to="/onboarding"
            className="px-8 py-4 rounded-full bg-cv-gold text-cv-bg font-sans font-bold text-sm tracking-[0.12em] uppercase hover:brightness-110 transition-all"
          >
            Join the movement
          </Link>
          <Link
            to="/dashboard"
            className="px-8 py-4 rounded-full border border-white/20 text-cv-text/70 font-sans font-semibold text-sm tracking-[0.12em] uppercase hover:border-white/40 hover:text-cv-text transition-all"
          >
            View dashboard
          </Link>
        </div>
      </div>
    </section>
  )
}

function StatsBar() {
  const stats = [
    { value: '10,000+', label: 'Men in the movement' },
    { value: '90-Day',  label: 'Freedom journey' },
    { value: '3 min',   label: 'Daily reset' },
    { value: '3 Tiers', label: 'Disciple · Leader · Pastor' },
  ]
  return (
    <div className="bg-cv-card border-y border-white/[0.07]">
      <div className="max-w-6xl mx-auto px-6 py-8 grid grid-cols-2 md:grid-cols-4 gap-6">
        {stats.map(({ value, label }) => (
          <div key={label} className="text-center">
            <div className="font-sans font-bold text-2xl text-cv-gold tracking-tight">{value}</div>
            <div className="font-serif text-cv-text/55 text-sm mt-1">{label}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

function WhatIsConvergence() {
  return (
    <section className="py-20 px-6">
      <div className="max-w-4xl mx-auto">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <span className="font-sans font-semibold text-[10.5px] tracking-[0.2em] uppercase text-cv-gold/70 block mb-4">
              What is Convergence?
            </span>
            <h2 className="font-sans font-bold text-4xl uppercase leading-[1.05] text-white mb-5">
              More than a program.<br />A movement.
            </h2>
            <p className="font-serif text-cv-text/70 text-base leading-relaxed mb-6">
              Founded by Mike Signorelli, Convergence is a structured environment where men do the hard work of breaking generational patterns — through daily resets, accountability partnerships, live sessions, and a community that holds you to who you're becoming.
            </p>
            <p className="font-serif text-cv-text/70 text-base leading-relaxed">
              Whether you're a Disciple on the 90-day Freedom Journey, a Leader building your legacy, or a Pastor strengthening your church and marriage — there's a tier built for exactly where you are.
            </p>
          </div>

          <div className="flex flex-col gap-4">
            {[
              { icon: '🔥', title: '3-Minute Daily Reset', desc: 'Short, targeted content that compounds over 90 days.' },
              { icon: '🤝', title: 'Accountability Partners', desc: 'Matched partners who check in and hold the line with you.' },
              { icon: '🎙', title: 'Live Coaching Sessions', desc: 'Monthly hot seats, boardrooms, and cluster calls with Mike.' },
              { icon: '📈', title: 'Tier-Based Progress', desc: 'Freedom Journey, Path to Significance, or Church Systems.' },
            ].map(({ icon, title, desc }) => (
              <div
                key={title}
                className="flex gap-4 p-4 rounded-cv-lg bg-cv-card border border-white/[0.07]"
              >
                <span className="text-2xl flex-shrink-0 mt-0.5" aria-hidden="true">{icon}</span>
                <div>
                  <div className="font-sans font-semibold text-sm tracking-wide text-white mb-1">{title}</div>
                  <div className="font-serif text-cv-text/55 text-sm leading-relaxed">{desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

function ThreeTiers() {
  const tiers = [
    {
      key: 'disciple',
      color: '#C2A064',
      softBg: 'rgba(194,160,100,0.07)',
      border: 'rgba(194,160,100,0.25)',
      label: 'Disciple',
      tagline: 'Freedom & Healing',
      desc: 'Break free from patterns you inherited. The 90-day Freedom Journey walks you through identifying root beliefs, building daily discipline, and finding your accountability partner.',
      features: ['90-Day Freedom Journey', 'Daily Reset (3 min)', 'Accountability Partner', 'Hot Seat Lottery', 'Community Access'],
      to: '/',
    },
    {
      key: 'leader',
      color: '#8FA9BD',
      softBg: 'rgba(143,169,189,0.07)',
      border: 'rgba(143,169,189,0.25)',
      label: 'Leader',
      tagline: 'Purpose & Legacy',
      desc: "You've done the personal work. Now build something that lasts. The Path to Significance takes you from successful to significant — with mastermind partners and boardroom sessions.",
      features: ['Path to Significance (12 milestones)', 'Mastermind Partners', 'Boardroom Sessions', 'Greece Tour 2027', 'Leadership Content Library'],
      to: '/leaders',
    },
    {
      key: 'pastor',
      color: '#B4737B',
      softBg: 'rgba(180,115,123,0.07)',
      border: 'rgba(180,115,123,0.25)',
      label: 'Pastor',
      tagline: 'Church & Marriage',
      desc: 'Systems for sustainable ministry. Church Systems templates, marriage accountability, spouse access, and a regional cluster community with pastors facing the same challenges.',
      features: ['24 Church Systems Templates', 'Marriage Check-In', 'Spouse Access', 'Regional Cluster', 'Northeast Pastor Network'],
      to: '/pastors',
    },
  ]

  return (
    <section className="py-20 px-6 bg-cv-card/30">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <span className="font-sans font-semibold text-[10.5px] tracking-[0.2em] uppercase text-cv-gold/70 block mb-4">
            Three paths. One movement.
          </span>
          <h2 className="font-sans font-bold text-4xl uppercase leading-[1.05] text-white">
            Find your tier
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {tiers.map(({ key, color, softBg, border, label, tagline, desc, features, to }) => (
            <div
              key={key}
              className="rounded-cv-lg p-6 flex flex-col border"
              style={{ background: softBg, borderColor: border }}
            >
              <div className="font-sans font-bold text-lg tracking-[0.06em] uppercase mb-1" style={{ color }}>
                {label}
              </div>
              <div className="font-sans font-semibold text-[10.5px] tracking-[0.16em] uppercase text-cv-text/45 mb-4">
                {tagline}
              </div>
              <p className="font-serif text-cv-text/70 text-sm leading-relaxed mb-5 flex-1">
                {desc}
              </p>
              <ul className="flex flex-col gap-2 mb-6">
                {features.map((f) => (
                  <li key={f} className="flex items-center gap-2.5 font-sans font-medium text-xs text-cv-text/70">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M20 6 9 17l-5-5" />
                    </svg>
                    {f}
                  </li>
                ))}
              </ul>
              <Link
                to={to}
                className="block text-center px-4 py-3 rounded-full font-sans font-semibold text-xs tracking-[0.12em] uppercase transition-all border"
                style={{ borderColor: color, color }}
              >
                Learn more →
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function CommunityQuote() {
  const posts = [
    { initials: 'MR', color: '#8FA9BD', colorBg: 'rgba(143,169,189,0.16)', name: 'Marcus R.', time: '2h ago \u00b7 Intensive', quote: '\u201cDay 12 of the intensive and I\u2019m finally seeing breakthrough in my relationship with my father. This community is the real thing.\u201d', likes: 24, replies: 9 },
    { initials: 'KL', color: '#B4737B', colorBg: 'rgba(180,115,123,0.16)', name: 'Kayla L.', time: '5h ago \u00b7 Open forum', quote: '\u201cQuestion for the group: How do you handle triggers at work when you\u2019re trying to show up as a leader at home?\u201d', likes: 11, replies: 17 },
    { initials: 'TW', color: '#C2A064', colorBg: 'rgba(194,160,100,0.14)', name: 'Thomas W.', time: '1d ago \u00b7 Freedom Journey', quote: '\u201cFinished my 90 days. Never thought I\u2019d say this but I actually talked to my dad about the patterns we both carry. Day 1 of something new.\u201d', likes: 58, replies: 22 },
  ]

  return (
    <section className="py-20 px-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-10">
          <h2 className="font-sans font-bold text-3xl uppercase text-white">From the community</h2>
          <Link to="/dashboard" className="font-sans font-semibold text-[11px] tracking-[0.14em] uppercase text-cv-gold hover:brightness-110 transition-colors">
            View all →
          </Link>
        </div>
        <div className="flex flex-col gap-4">
          {posts.map(({ initials, color, colorBg, name, time, quote, likes, replies }) => (
            <div key={name} className="flex gap-4 p-4 rounded-cv-lg bg-cv-card border border-white/[0.06]">
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center font-sans font-bold text-xs flex-shrink-0"
                style={{ background: colorBg, color }}
                aria-hidden="true"
              >
                {initials}
              </div>
              <div className="min-w-0">
                <div className="flex items-baseline gap-2 mb-1">
                  <span className="font-sans font-semibold text-sm text-cv-text">{name}</span>
                  <span className="font-sans font-medium text-[11px] text-cv-text/40 tracking-wide">{time}</span>
                </div>
                <div className="font-serif text-cv-text/75 text-sm leading-relaxed mb-2">{quote}</div>
                <div className="flex gap-4 font-sans font-semibold text-[11.5px] tracking-wide text-cv-text/40">
                  <span>{likes} likes</span>
                  <span>{replies} replies</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function CtaBanner() {
  return (
    <section className="py-20 px-6 bg-cv-card/30">
      <div className="max-w-2xl mx-auto text-center">
        <h2 className="font-sans font-bold text-4xl md:text-5xl uppercase leading-[1.02] text-white mb-5">
          Ready to stop<br />
          <span className="text-cv-gold">passing it on?</span>
        </h2>
        <p className="font-serif text-cv-text/65 text-lg leading-relaxed mb-10">
          Join thousands of men doing the work — 3 minutes a day, every day.
        </p>
        <Link
          to="/onboarding"
          className="inline-block px-10 py-4 rounded-full bg-cv-gold text-cv-bg font-sans font-bold text-sm tracking-[0.12em] uppercase hover:brightness-110 transition-all"
        >
          Start your journey
        </Link>
      </div>
    </section>
  )
}

export default function Home() {
  return (
    <PublicLayout>
      <HeroSection />
      <StatsBar />
      <WhatIsConvergence />
      <ThreeTiers />
      <CommunityQuote />
      <CtaBanner />
    </PublicLayout>
  )
}
