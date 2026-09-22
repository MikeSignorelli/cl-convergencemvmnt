import { useEffect, useState } from 'react'
import MemberSidebar from '../../components/MemberSidebar'
import MemberTopbar from '../../components/MemberTopbar'
import { useAuth } from '../../lib/AuthContext'
import { createLiveSession, deleteLiveSession, listLiveSessions } from '../../lib/liveSessions'

const TIERS = ['disciple', 'leader', 'pastor']
const DEFAULT_DURATION_MINUTES = 60
// Re-checks "has this session started yet?" every 30s so a session flips
// from "starts at ..." to "Join now" on its own, with no page refresh --
// the whole point of "no manual admin action to open it."
const NOW_TICK_MS = 30000

export default function UploadLiveSessions() {
  const { isAdmin } = useAuth()
  const [showForm, setShowForm] = useState(false)
  const [sessions, setSessions] = useState([])
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [visibleTiers, setVisibleTiers] = useState(TIERS)
  const [scheduledAt, setScheduledAt] = useState('')
  const [durationMinutes, setDurationMinutes] = useState(String(DEFAULT_DURATION_MINUTES))
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), NOW_TICK_MS)
    return () => clearInterval(id)
  }, [])

  async function refresh() {
    setLoading(true)
    try {
      setSessions(await listLiveSessions())
    } catch (err) {
      setError(err.message)
    }
    setLoading(false)
  }

  useEffect(() => {
    refresh()
  }, [])

  function toggleTier(tier) {
    setVisibleTiers((prev) =>
      prev.includes(tier) ? prev.filter((t) => t !== tier) : [...prev, tier]
    )
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (!title.trim()) {
      setError('Enter a title.')
      return
    }
    if (!scheduledAt) {
      setError('Choose a date and time.')
      return
    }
    if (visibleTiers.length === 0) {
      setError('Select at least one tier.')
      return
    }

    setSubmitting(true)
    try {
      await createLiveSession({
        title: title.trim(),
        description: description.trim(),
        visibleTiers,
        scheduledAt: new Date(scheduledAt).toISOString(),
        durationMinutes: parseInt(durationMinutes, 10) || DEFAULT_DURATION_MINUTES,
      })

      setTitle('')
      setDescription('')
      setVisibleTiers(TIERS)
      setScheduledAt('')
      setDurationMinutes(String(DEFAULT_DURATION_MINUTES))
      setShowForm(false)
      await refresh()
    } catch (err) {
      setError(err.message || 'Could not save this session.')
    }
    setSubmitting(false)
  }

  async function handleDelete(session) {
    try {
      await deleteLiveSession(session.id)
      await refresh()
    } catch (err) {
      setError(err.message)
    }
  }

  const q = query.trim().toLowerCase()
  const visible = q
    ? sessions.filter((s) => `${s.title || ''} ${s.description || ''}`.toLowerCase().includes(q))
    : sessions

  return (
    <div className="flex min-h-screen bg-ink font-sans text-cream">
      <MemberSidebar active="/live-sessions" />
      <div className="flex flex-1 flex-col min-w-0">
        <MemberTopbar
          searchPlaceholder="Search live sessions…"
          search={query}
          onSearch={setQuery}
          actionLabel={isAdmin ? 'Upload Live Sessions' : undefined}
          actionOnClick={() => setShowForm((v) => !v)}
        />
        <main className="mx-auto w-full max-w-[1180px] flex-1 px-8 pb-16 pt-9">
          <h1 className="mb-1 font-sans text-[28px] font-bold uppercase leading-[1.05] text-white">
            Live sessions
          </h1>
          <p className="mb-6 font-serif text-[15px] text-cream/60">
            Upcoming sessions for your tier.
          </p>

          {isAdmin && showForm && (
          <form
            onSubmit={handleSubmit}
            className="mb-8 flex flex-col gap-4 rounded-cv-lg border border-cream/[0.09] bg-[rgb(30,36,22)] px-6 py-6"
          >
            <div>
              <label className="mb-[7px] block text-[11px] font-semibold uppercase tracking-[0.16em] text-cream/50">
                Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full rounded-[10px] border border-cream/[0.14] bg-cream/[0.04] px-4 py-[13px] font-serif text-[15px] text-cream outline-none"
              />
            </div>
            <div>
              <label className="mb-[7px] block text-[11px] font-semibold uppercase tracking-[0.16em] text-cream/50">
                Description (optional)
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full rounded-[10px] border border-cream/[0.14] bg-cream/[0.04] px-4 py-[13px] font-serif text-[15px] text-cream outline-none"
              />
            </div>

            <div>
              <label className="mb-[7px] block text-[11px] font-semibold uppercase tracking-[0.16em] text-cream/50">
                Visible to
              </label>
              <div className="flex flex-wrap gap-2.5">
                {TIERS.map((tier) => (
                  <button
                    key={tier}
                    type="button"
                    onClick={() => toggleTier(tier)}
                    className="cursor-pointer rounded-full px-5 py-2 font-sans text-[11.5px] font-semibold uppercase tracking-[0.08em]"
                    style={
                      visibleTiers.includes(tier)
                        ? { background: '#C2A064', color: '#171C10' }
                        : { background: 'transparent', border: '1px solid rgba(240,238,229,0.16)', color: 'rgba(240,238,229,0.7)' }
                    }
                  >
                    {tier}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-[7px] block text-[11px] font-semibold uppercase tracking-[0.16em] text-cream/50">
                  Date &amp; time
                </label>
                <input
                  type="datetime-local"
                  value={scheduledAt}
                  onChange={(e) => setScheduledAt(e.target.value)}
                  className="w-full rounded-[10px] border border-cream/[0.14] bg-cream/[0.04] px-4 py-[13px] font-serif text-[15px] text-cream outline-none"
                />
              </div>
              <div>
                <label className="mb-[7px] block text-[11px] font-semibold uppercase tracking-[0.16em] text-cream/50">
                  Duration (minutes)
                </label>
                <input
                  type="number"
                  min="15"
                  step="15"
                  value={durationMinutes}
                  onChange={(e) => setDurationMinutes(e.target.value)}
                  className="w-full rounded-[10px] border border-cream/[0.14] bg-cream/[0.04] px-4 py-[13px] font-serif text-[15px] text-cream outline-none"
                />
              </div>
            </div>
            <p className="-mt-1 font-serif text-[12px] text-cream/40">
              The Zoom meeting and join link are created automatically — nothing to paste in.
            </p>

            {error && <p className="font-serif text-[13px] text-[#D8888A]">{error}</p>}

            <button
              type="submit"
              disabled={submitting}
              className="w-fit cursor-pointer rounded-full border-none bg-gold px-8 py-3 font-sans text-[13px] font-semibold uppercase tracking-[0.12em] text-ink disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? 'Creating the Zoom meeting…' : 'Add session'}
            </button>
          </form>
          )}

          <div className="overflow-hidden rounded-cv-lg border border-cream/[0.09]">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-cream/[0.09] bg-cream/[0.03]">
                  <th className="px-5 py-3 font-sans text-[11px] font-semibold uppercase tracking-[0.12em] text-cream/50">Title</th>
                  <th className="px-5 py-3 font-sans text-[11px] font-semibold uppercase tracking-[0.12em] text-cream/50">Visible to</th>
                  <th className="px-5 py-3 font-sans text-[11px] font-semibold uppercase tracking-[0.12em] text-cream/50">When</th>
                  <th className="px-5 py-3 font-sans text-[11px] font-semibold uppercase tracking-[0.12em] text-cream/50" />
                  {isAdmin && <th className="px-5 py-3 font-sans text-[11px] font-semibold uppercase tracking-[0.12em] text-cream/50" />}
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr>
                    <td colSpan={isAdmin ? 5 : 4} className="px-5 py-6 text-center font-serif text-cream/50">Loading…</td>
                  </tr>
                )}
                {!loading && visible.length === 0 && (
                  <tr>
                    <td colSpan={isAdmin ? 5 : 4} className="px-5 py-6 text-center font-serif text-cream/50">
                      {sessions.length === 0 ? 'No live sessions yet.' : `No sessions match “${query}”.`}
                    </td>
                  </tr>
                )}
                {!loading &&
                  visible.map((s) => {
                    const scheduled = new Date(s.scheduled_at)
                    const isLive = now >= scheduled
                    return (
                      <tr key={s.id} className="border-b border-cream/[0.06] last:border-b-0">
                        <td className="px-5 py-3.5 font-sans text-sm font-medium">{s.title}</td>
                        <td className="px-5 py-3.5 font-serif text-sm text-cream/60">{s.visible_tiers.join(', ')}</td>
                        <td className="px-5 py-3.5 font-serif text-sm text-cream/60">
                          {isLive ? (
                            <span className="font-sans text-[11px] font-semibold uppercase tracking-[0.08em] text-[#9BC08A]">Live now</span>
                          ) : (
                            `Starts ${scheduled.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}`
                          )}
                        </td>
                        <td className="px-5 py-3.5">
                          {isLive && s.join_url && (
                            <a
                              href={s.join_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="cursor-pointer whitespace-nowrap rounded-full bg-gold px-4 py-[7px] font-sans text-[10.5px] font-semibold uppercase tracking-[0.08em] text-ink no-underline"
                            >
                              Join now
                            </a>
                          )}
                        </td>
                        {isAdmin && (
                        <td className="px-5 py-3.5 text-right">
                          <button
                            type="button"
                            onClick={() => handleDelete(s)}
                            className="cursor-pointer border-none bg-transparent font-sans text-[11px] font-semibold uppercase tracking-[0.1em] text-[#D8888A]"
                          >
                            Delete
                          </button>
                        </td>
                        )}
                      </tr>
                    )
                  })}
              </tbody>
            </table>
          </div>
        </main>
      </div>
    </div>
  )
}
