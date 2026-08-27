import { Link } from 'react-router-dom'
import PublicLayout from '../components/PublicLayout'

function Hero() {
  return (
    <section className="relative overflow-hidden bg-cv-bg pt-20 pb-24 px-6">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-32 -left-48 w-[700px] h-[700px] rounded-full opacity-10"
        style={{ background: 'radial-gradient(circle, #8FA9BD 0%, transparent 70%)' }}
      />
      <div className="max-w-3xl mx-auto text-center relative z-10">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-cv-steel/30 bg-cv-steel/8 mb-8">
          <span className="w-1.5 h-1.5 rounded-full bg-cv-steel flex-shrink-0" aria-hidden="true" />
          <span className="font-sans font-semibold text-[10.5px] tracking-[0.2em] uppercase text-cv-steel">
            For Leaders
          </span>
        </div>
        <h1 className="font-sans font-bold text-5xl md:text-6xl leading-[1.01] uppercase tracking-tight text-white mb-6">
          Success isn't the goal.<br />
          <span style={{ color: '#8FA9BD' }}>Significance is.</span>
        </h1>
        <p className="font-serif text-lg md:text-xl text-cv-text/70 leading-relaxed max-w-xl mx-auto mb-10">
          You've built something — a business, a career, a reputation. Now it's time to build something that outlasts you. The Leader tier is for men who are ready to trade success for significance.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            to="/onboarding"
            className="px-8 py-4 rounded-full font-sans font-bold text-sm tracking-[0.12em] uppercase hover:brightness-110 transition-all text-cv-bg"
            style={{ background: '#8FA9BD' }}
          >
            Join as a Leader
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

function PathToSignificance() {
  const milestones = [
    { n: 1,  label: 'Clarity on your calling' },
    { n: 2,  label: 'Identify your leadership wounds' },
    { n: 3,  label: 'Rebuild your inner circle' },
    { n: 4,  label: 'Define your legacy statement' },
    { n: 5,  label: 'Build your life architecture' },
    { n: 6,  label: 'Master the pivot from success to significance' },
    { n: 7,  label: 'Mastermind cohort placement' },
    { n: 8,  label: 'Boardroom sessions begin' },
    { n: 9,  label: 'Greece experience prep' },
    { n: 10, label: 'Mentor a rising leader' },
    { n: 11, label: 'Legacy project launch' },
    { n: 12, label: 'Significance certification' },
  ]

  return (
    <section className="py-20 px-6 bg-cv-card/30">
      <div className="max-w-4xl mx-auto">
        <span className="font-sans font-semibold text-[10.5px] tracking-[0.2em] uppercase block mb-4" style={{ color: 'rgba(143,169,189,0.7)' }}>
          Your roadmap
        </span>
        <h2 className="font-sans font-bold text-4xl uppercase text-white mb-3">
          Path to Significance
        </h2>
        <p className="font-serif text-cv-text/65 text-base leading-relaxed mb-10 max-w-lg">
          12 milestones. Every one builds on the last. This isn't a course — it's a transformation arc with clear checkpoints.
        </p>
        <div className="grid sm:grid-cols-2 gap-4">
          {milestones.map(({ n, label }) => (
            <div key={n} className="flex items-center gap-4 p-4 rounded-cv-lg bg-cv-card border border-white/[0.07]">
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center font-sans font-bold text-sm flex-shrink-0"
                style={{ background: 'rgba(143,169,189,0.14)', color: '#8FA9BD' }}
              >
                {n}
              </div>
              <span className="font-sans font-semibold text-sm tracking-wide text-cv-text/80">{label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function Features() {
  const items = [
    {
      title: 'Mastermind Partners',
      desc: 'Weekly accountability calls with a hand-matched partner who is at the same stage you are. No fluff — real work.',
    },
    {
      title: 'Boardroom Sessions',
      desc: 'Monthly virtual boardrooms with Mike Signorelli and a small cohort of leaders. Real conversations about the hard stuff.',
    },
    {
      title: 'Daily Leader Reset',
      desc: "3 minutes every morning calibrated for leaders. Different from the Disciple reset — this one's about your inner posture as you lead.",
    },
    {
      title: 'Greece Tour 2027',
      desc: 'A transformational in-person experience in Greece. Priority booking opens for active leaders first.',
    },
    {
      title: 'Leadership Content Library',
      desc: 'Courses, sessions, and frameworks built specifically for men navigating success, identity, and legacy.',
    },
    {
      title: 'Leaderboard & Recognition',
      desc: 'Points, badges, and community recognition that compounds with every milestone you hit.',
    },
  ]

  return (
    <section className="py-20 px-6">
      <div className="max-w-4xl mx-auto">
        <h2 className="font-sans font-bold text-4xl uppercase text-white mb-10 text-center">
          What's inside
        </h2>
        <div className="grid md:grid-cols-2 gap-5">
          {items.map(({ title, desc }) => (
            <div key={title} className="p-5 rounded-cv-lg bg-cv-card border border-white/[0.07]">
              <div className="flex items-center gap-2 mb-2">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#8FA9BD" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M20 6 9 17l-5-5" />
                </svg>
                <span className="font-sans font-bold text-sm tracking-wide text-white">{title}</span>
              </div>
              <p className="font-serif text-cv-text/60 text-sm leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function Cta() {
  return (
    <section className="py-20 px-6 bg-cv-card/30">
      <div className="max-w-xl mx-auto text-center">
        <h2 className="font-sans font-bold text-4xl uppercase leading-tight text-white mb-4">
          Build a legacy<br />
          <span style={{ color: '#8FA9BD' }}>worth leaving.</span>
        </h2>
        <p className="font-serif text-cv-text/65 text-base leading-relaxed mb-8">
          Join the leaders who stopped chasing success and started building significance.
        </p>
        <Link
          to="/onboarding"
          className="inline-block px-10 py-4 rounded-full font-sans font-bold text-sm tracking-[0.12em] uppercase text-cv-bg hover:brightness-110 transition-all"
          style={{ background: '#8FA9BD' }}
        >
          Start the journey
        </Link>
      </div>
    </section>
  )
}

export default function Leaders() {
  return (
    <PublicLayout>
      <Hero />
      <PathToSignificance />
      <Features />
      <Cta />
    </PublicLayout>
  )
}
