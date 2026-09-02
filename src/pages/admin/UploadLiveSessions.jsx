import { useEffect, useState } from 'react'
import MemberSidebar from '../../components/MemberSidebar'
import MemberTopbar from '../../components/MemberTopbar'
import { createLiveSession, deleteLiveSession, listLiveSessions } from '../../lib/liveSessions'

const TIERS = ['disciple', 'leader', 'pastor']

export default function UploadLiveSessions() {
  const [sessions, setSessions] = useState([])
  const [loading, setLoading] = useState(true)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [visibleTiers, setVisibleTiers] = useState(TIERS)
  const [scheduledAt, setScheduledAt] = useState('')
  const [joinUrl, setJoinUrl] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

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
    if (!joinUrl.trim()) {
      setError('Add a join link.')
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
        joinUrl: joinUrl.trim(),
      })

      setTitle('')
      setDescription('')
      setVisibleTiers(TIERS)
      setScheduledAt('')
      setJoinUrl('')
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

  return (
    <div className="flex min-h-screen bg-ink font-sans text-cream">
      <MemberSidebar active="/admin/live-sessions" />
      <div className="flex flex-1 flex-col min-w-0">
        <MemberTopbar searchPlaceholder="Search live sessions…" />
        <main className="mx-auto w-full max-w-[1180px] flex-1 px-8 pb-16 pt-9">
          <h1 className="mb-1 font-sans text-[28px] font-bold uppercase leading-[1.05] text-white">
            Upload live sessions
          </h1>
          <p className="mb-6 font-serif text-[15px] text-cream/60">
            Schedule a session and choose which tiers can join.
          </p>

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
                  Join link
                </label>
                <input
                  type="url"
                  value={joinUrl}
                  onChange={(e) => setJoinUrl(e.target.value)}
                  placeholder="https://zoom.us/…"
                  className="w-full rounded-[10px] border border-cream/[0.14] bg-cream/[0.04] px-4 py-[13px] font-serif text-[15px] text-cream outline-none"
                />
              </div>
            </div>

            {error && <p className="font-serif text-[13px] text-[#D8888A]">{error}</p>}

            <button
              type="submit"
              disabled={submitting}
              className="w-fit cursor-pointer rounded-full border-none bg-gold px-8 py-3 font-sans text-[13px] font-semibold uppercase tracking-[0.12em] text-ink disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? 'Saving…' : 'Add session'}
            </button>
          </form>

          <div className="overflow-hidden rounded-cv-lg border border-cream/[0.09]">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-cream/[0.09] bg-cream/[0.03]">
                  <th className="px-5 py-3 font-sans text-[11px] font-semibold uppercase tracking-[0.12em] text-cream/50">Title</th>
                  <th className="px-5 py-3 font-sans text-[11px] font-semibold uppercase tracking-[0.12em] text-cream/50">Visible to</th>
                  <th className="px-5 py-3 font-sans text-[11px] font-semibold uppercase tracking-[0.12em] text-cream/50">When</th>
                  <th className="px-5 py-3 font-sans text-[11px] font-semibold uppercase tracking-[0.12em] text-cream/50" />
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr>
                    <td colSpan={4} className="px-5 py-6 text-center font-serif text-cream/50">Loading…</td>
                  </tr>
                )}
                {!loading && sessions.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-5 py-6 text-center font-serif text-cream/50">No live sessions yet.</td>
                  </tr>
                )}
                {!loading &&
                  sessions.map((s) => (
                    <tr key={s.id} className="border-b border-cream/[0.06] last:border-b-0">
                      <td className="px-5 py-3.5 font-sans text-sm font-medium">{s.title}</td>
                      <td className="px-5 py-3.5 font-serif text-sm text-cream/60">{s.visible_tiers.join(', ')}</td>
                      <td className="px-5 py-3.5 font-serif text-sm text-cream/60">
                        {new Date(s.scheduled_at).toLocaleString()}
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <button
                          type="button"
                          onClick={() => handleDelete(s)}
                          className="cursor-pointer border-none bg-transparent font-sans text-[11px] font-semibold uppercase tracking-[0.1em] text-[#D8888A]"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </main>
      </div>
    </div>
  )
}
