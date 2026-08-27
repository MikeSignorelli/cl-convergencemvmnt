import { Link } from 'react-router-dom'
import PublicLayout from '../components/PublicLayout'

const EVENTS = [
  {
    id: 1,
    type: 'Live Session',
    tier: 'Disciple',
    tierColor: '#C2A064',
    title: 'Hot Seat Coaching',
    host: 'Mike Signorelli',
    date: 'Thursday, Aug 27, 2026',
    time: '8:00 PM ET',
    desc: 'Five disciples get on camera and work through their biggest current obstacle with Mike live. Everyone watches, everyone grows.',
    spots: 'Lottery entry open',
  },
  {
    id: 2,
    type: 'Boardroom',
    tier: 'Leader',
    tierColor: '#8FA9BD',
    title: 'Scaling Without Losing Your Soul',
    host: 'Mike Signorelli',
    date: 'Wednesday, Sept 3, 2026',
    time: '12:00 PM ET',
    desc: 'A closed-room boardroom session for leaders. This month: the identity crisis that happens when your company grows faster than you do.',
    spots: 'Leaders only',
  },
  {
    id: 3,
    type: 'Cluster Call',
    tier: 'Pastor',
    tierColor: '#B4737B',
    title: 'Northeast Regional Cluster',
    host: 'Mike Signorelli',
    date: 'Tuesday, Sept 9, 2026',
    time: '1:00 PM ET',
    desc: 'Monthly call for Northeast pastors. Open Q&A format with Mike — no slides, no performance. Just honest conversation between pastors.',
    spots: 'Northeast cluster members',
  },
  {
    id: 4,
    type: 'In-Person Experience',
    tier: 'Leader',
    tierColor: '#8FA9BD',
    title: 'Greece Tour 2027',
    host: 'Mike Signorelli',
    date: 'Spring 2027 — Exact dates TBD',
    time: 'Full week',
    desc: "A transformational journey to Greece for leaders who are ready to step fully into significance. Priority booking is now open for active Leader tier members.",
    spots: 'Priority booking open',
  },
  {
    id: 5,
    type: 'Workshop',
    tier: 'All tiers',
    tierColor: '#C2A064',
    title: 'Freedom Journey Intensive',
    host: 'Mike Signorelli',
    date: 'Saturday, Oct 4, 2026',
    time: '10:00 AM – 4:00 PM ET',
    desc: 'A full-day virtual intensive for disciples in any phase of their 90-day Freedom Journey. Includes breakout groups and live Q&A.',
    spots: 'Open to all disciples',
  },
  {
    id: 6,
    type: 'Marriage Event',
    tier: 'Pastor',
    tierColor: '#B4737B',
    title: 'Pastoral Marriage Weekend',
    host: 'Mike & Amanda Signorelli',
    date: 'November 2026 — Exact dates TBD',
    time: 'Full weekend',
    desc: 'A weekend retreat for pastors and their spouses. Structured, honest, and built around the unique pressures of ministry on a marriage.',
    spots: 'Pastors + spouses',
  },
]

function EventCard({ event }) {
  const { type, tier, tierColor, title, host, date, time, desc, spots } = event
  return (
    <article className="flex flex-col p-6 rounded-cv-lg bg-cv-card border border-white/[0.07] hover:border-white/[0.12] transition-colors">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <span
            className="px-2.5 py-1 rounded-full font-sans font-semibold text-[10px] tracking-[0.14em] uppercase"
            style={{ background: `${tierColor}22`, color: tierColor, border: `1px solid ${tierColor}44` }}
          >
            {tier}
          </span>
          <span className="font-sans font-semibold text-[10.5px] tracking-[0.14em] uppercase text-cv-text/40">
            {type}
          </span>
        </div>
        <span className="font-sans font-semibold text-[10.5px] tracking-[0.1em] uppercase text-cv-text/35">
          {spots}
        </span>
      </div>

      <h3 className="font-sans font-bold text-xl uppercase tracking-wide text-white mb-1">{title}</h3>
      <div className="font-sans font-semibold text-xs tracking-[0.1em] uppercase mb-3" style={{ color: tierColor }}>
        with {host}
      </div>

      <div className="flex items-center gap-4 mb-4 font-sans text-xs text-cv-text/50 flex-wrap">
        <span className="flex items-center gap-1.5">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            <rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" />
          </svg>
          {date}
        </span>
        <span className="flex items-center gap-1.5">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            <circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" />
          </svg>
          {time}
        </span>
      </div>

      <p className="font-serif text-cv-text/65 text-sm leading-relaxed flex-1 mb-5">{desc}</p>

      <Link
        to="/dashboard"
        className="block text-center px-4 py-3 rounded-full font-sans font-semibold text-xs tracking-[0.12em] uppercase border transition-all hover:brightness-110"
        style={{ borderColor: tierColor, color: tierColor }}
      >
        Register →
      </Link>
    </article>
  )
}

export default function Events() {
  return (
    <PublicLayout>
      {/* Hero */}
      <section className="pt-20 pb-14 px-6 bg-cv-bg">
        <div className="max-w-3xl mx-auto text-center">
          <span className="font-sans font-semibold text-[10.5px] tracking-[0.2em] uppercase text-cv-gold/70 block mb-4">
            Live sessions & experiences
          </span>
          <h1 className="font-sans font-bold text-5xl md:text-6xl uppercase leading-[1.01] text-white mb-5">
            Events &<br />
            <span className="text-cv-gold">Experiences</span>
          </h1>
          <p className="font-serif text-cv-text/65 text-lg leading-relaxed max-w-xl mx-auto">
            From hot seat coaching to the Greece tour — every event is built to accelerate the work you're already doing.
          </p>
        </div>
      </section>

      {/* Event grid */}
      <section className="py-16 px-6">
        <div className="max-w-5xl mx-auto">
          {/* Filter pills */}
          <div className="flex gap-2 flex-wrap mb-10" role="group" aria-label="Filter by tier">
            {['All', 'Disciple', 'Leader', 'Pastor'].map((label) => (
              <button
                key={label}
                className="px-4 py-2 rounded-full font-sans font-semibold text-xs tracking-[0.12em] uppercase border border-white/15 text-cv-text/55 hover:border-cv-gold/50 hover:text-cv-gold transition-colors"
              >
                {label}
              </button>
            ))}
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {EVENTS.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-6 bg-cv-card/30">
        <div className="max-w-xl mx-auto text-center">
          <h2 className="font-sans font-bold text-3xl uppercase text-white mb-4">
            Want access to all events?
          </h2>
          <p className="font-serif text-cv-text/60 text-base leading-relaxed mb-8">
            Each event is tied to a membership tier. Join the movement to unlock the sessions relevant to your path.
          </p>
          <Link
            to="/onboarding"
            className="inline-block px-10 py-4 rounded-full bg-cv-gold text-cv-bg font-sans font-bold text-sm tracking-[0.12em] uppercase hover:brightness-110 transition-all"
          >
            Join the movement
          </Link>
        </div>
      </section>
    </PublicLayout>
  )
}
