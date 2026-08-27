import { Link } from 'react-router-dom'
import PublicLayout from '../components/PublicLayout'

function Hero() {
  return (
    <section className="relative overflow-hidden bg-cv-bg pt-20 pb-24 px-6">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-32 -right-48 w-[700px] h-[700px] rounded-full opacity-10"
        style={{ background: 'radial-gradient(circle, #B4737B 0%, transparent 70%)' }}
      />
      <div className="max-w-3xl mx-auto text-center relative z-10">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-cv-rose/30 bg-cv-rose/8 mb-8">
          <span className="w-1.5 h-1.5 rounded-full bg-cv-rose flex-shrink-0" aria-hidden="true" />
          <span className="font-sans font-semibold text-[10.5px] tracking-[0.2em] uppercase text-cv-rose">
            For Pastors
          </span>
        </div>
        <h1 className="font-sans font-bold text-5xl md:text-6xl leading-[1.01] uppercase tracking-tight text-white mb-6">
          Sustainable ministry<br />
          <span style={{ color: '#B4737B' }}>starts at home.</span>
        </h1>
        <p className="font-serif text-lg md:text-xl text-cv-text/70 leading-relaxed max-w-xl mx-auto mb-10">
          Built for the pastor who loves his church but is burning out. Church systems, marriage accountability, and a community of pastors who get it.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            to="/onboarding"
            className="px-8 py-4 rounded-full font-sans font-bold text-sm tracking-[0.12em] uppercase hover:brightness-110 transition-all text-cv-bg"
            style={{ background: '#B4737B' }}
          >
            Join as a Pastor
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

function ChurchSystems() {
  const modules = [
    { n: 1, title: 'Vision & Values Alignment',   templates: 4 },
    { n: 2, title: 'Team & Staff Systems',         templates: 5 },
    { n: 3, title: 'Volunteer Pipeline',           templates: 4 },
    { n: 4, title: 'Preaching & Communication',    templates: 3 },
    { n: 5, title: 'Pastoral Care Framework',      templates: 4 },
    { n: 6, title: 'Sustainable Growth Systems',   templates: 4 },
  ]

  return (
    <section className="py-20 px-6 bg-cv-card/30">
      <div className="max-w-4xl mx-auto">
        <span className="font-sans font-semibold text-[10.5px] tracking-[0.2em] uppercase block mb-4" style={{ color: 'rgba(180,115,123,0.7)' }}>
          The template library
        </span>
        <h2 className="font-sans font-bold text-4xl uppercase text-white mb-3">Church Systems</h2>
        <p className="font-serif text-cv-text/65 text-base leading-relaxed mb-10 max-w-lg">
          24 ready-to-use templates across 6 modules. Download them one at a time and implement at your own pace.
        </p>
        <div className="grid sm:grid-cols-2 gap-4">
          {modules.map(({ n, title, templates }) => (
            <div key={n} className="flex items-center gap-4 p-4 rounded-cv-lg bg-cv-card border border-white/[0.07]">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center font-sans font-bold text-sm flex-shrink-0"
                style={{ background: 'rgba(180,115,123,0.14)', color: '#B4737B' }}
              >
                {n}
              </div>
              <div>
                <div className="font-sans font-semibold text-sm text-cv-text/85">{title}</div>
                <div className="font-serif text-cv-text/45 text-xs mt-0.5">{templates} templates</div>
              </div>
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
      title: 'Marriage Check-In',
      desc: 'A weekly structured check-in with your spouse built into your rhythm — before the cracks become crises.',
    },
    {
      title: 'Spouse Access',
      desc: "Your wife gets her own access level. She's part of this. Because the strongest ministry starts in the home.",
    },
    {
      title: 'Regional Clusters',
      desc: 'Join a regional cohort of pastors in your area. Northeast, Southeast, Midwest, West Coast — real community with people close to home.',
    },
    {
      title: 'Daily Reset for Pastors',
      desc: 'A 3-minute morning reset calibrated for pastoral life — covering leadership posture, family health, and personal renewal.',
    },
    {
      title: 'Pastoral Care Library',
      desc: 'Content built for the unique pressures pastors face: burnout, church conflict, family tension, and leadership loneliness.',
    },
    {
      title: 'Mike Signorelli Access',
      desc: 'Monthly Regional Cluster Calls with Mike. These are not polished presentations — they are honest conversations.',
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
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#B4737B" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
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
          Strong church.<br />
          <span style={{ color: '#B4737B' }}>Stronger marriage.</span>
        </h2>
        <p className="font-serif text-cv-text/65 text-base leading-relaxed mb-8">
          You give your best to your congregation. Let this be the place where you get filled back up.
        </p>
        <Link
          to="/onboarding"
          className="inline-block px-10 py-4 rounded-full font-sans font-bold text-sm tracking-[0.12em] uppercase text-cv-bg hover:brightness-110 transition-all"
          style={{ background: '#B4737B' }}
        >
          Join the movement
        </Link>
      </div>
    </section>
  )
}

export default function Pastors() {
  return (
    <PublicLayout>
      <Hero />
      <ChurchSystems />
      <Features />
      <Cta />
    </PublicLayout>
  )
}
