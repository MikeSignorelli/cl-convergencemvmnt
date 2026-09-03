import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import MemberSidebar from '../../components/MemberSidebar'
import MemberTopbar from '../../components/MemberTopbar'
import { useAuth } from '../../lib/AuthContext'
import { listMembers, updateMember, deleteMember } from '../../lib/adminMembers'

const TIER_FILTERS = ['all', 'disciple', 'leader', 'pastor', 'admin']
const PREVIEW_TIERS = ['disciple', 'leader', 'pastor']
const EDIT_TIERS = ['disciple', 'leader', 'pastor', 'admin']

function TierBadge({ tier }) {
  const colors = {
    disciple: { bg: 'rgba(194,160,100,0.14)', text: '#C2A064' },
    leader: { bg: 'rgba(143,169,189,0.16)', text: '#8FA9BD' },
    pastor: { bg: 'rgba(180,115,123,0.16)', text: '#B4737B' },
    admin: { bg: 'rgba(232,145,71,0.16)', text: '#E89147' },
  }
  const c = colors[tier] || { bg: 'rgba(240,238,229,0.1)', text: 'rgba(240,238,229,0.6)' }
  return (
    <span
      className="rounded-full px-3 py-1 font-sans text-[10.5px] font-semibold uppercase tracking-[0.1em]"
      style={{ background: c.bg, color: c.text }}
    >
      {tier}
    </span>
  )
}

export default function Members() {
  const navigate = useNavigate()
  const { profile, setPreviewTier } = useAuth()
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState('all')
  const [editingId, setEditingId] = useState(null)
  const [editTier, setEditTier] = useState('disciple')
  const [editDisplayName, setEditDisplayName] = useState('')
  const [rowError, setRowError] = useState('')
  const [busyId, setBusyId] = useState(null)

  async function load() {
    setLoading(true)
    try {
      setMembers(await listMembers())
      setError('')
    } catch (err) {
      setError(err.message)
    }
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [])

  const visible = filter === 'all' ? members : members.filter((m) => m.tier === filter)

  function previewTier(tier) {
    setPreviewTier(tier)
    navigate('/dashboard')
  }

  function startEdit(m) {
    setRowError('')
    setEditingId(m.id)
    setEditTier(m.tier || 'disciple')
    setEditDisplayName(m.display_name || '')
  }

  function cancelEdit() {
    setEditingId(null)
    setRowError('')
  }

  async function saveEdit(id) {
    setBusyId(id)
    setRowError('')
    try {
      await updateMember({ id, tier: editTier, displayName: editDisplayName.trim() || null })
      setEditingId(null)
      await load()
    } catch (err) {
      setRowError(err.message)
    }
    setBusyId(null)
  }

  async function handleDelete(m) {
    const label = m.display_name || m.username || m.email
    if (!window.confirm(`Permanently delete ${label}'s account? This can't be undone.`)) return
    setBusyId(m.id)
    setRowError('')
    try {
      await deleteMember(m.id)
      await load()
    } catch (err) {
      setRowError(err.message)
    }
    setBusyId(null)
  }

  return (
    <div className="flex min-h-screen bg-ink font-sans text-cream">
      <MemberSidebar active="/admin/members" />
      <div className="flex flex-1 flex-col min-w-0">
        <MemberTopbar searchPlaceholder="Search members…" />
        <main className="mx-auto w-full max-w-[1180px] flex-1 px-8 pb-16 pt-9">
          <h1 className="mb-1 font-sans text-[28px] font-bold uppercase leading-[1.05] text-white">
            Members
          </h1>
          <p className="mb-6 font-serif text-[15px] text-cream/60">
            Every registered member, filterable by tier.
          </p>

          <div className="mb-6 rounded-cv-lg border border-cream/[0.09] bg-[rgb(30,36,22)] px-6 py-5">
            <div className="mb-3 font-sans text-[11px] font-semibold uppercase tracking-[0.16em] text-cream/50">
              Preview a tier&rsquo;s dashboard
            </div>
            <div className="flex flex-wrap gap-2.5">
              {PREVIEW_TIERS.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => previewTier(t)}
                  className="cursor-pointer rounded-full border border-cream/[0.18] bg-cream/[0.04] px-5 py-2.5 font-sans text-[12px] font-semibold uppercase tracking-[0.1em] text-cream hover:border-gold/50"
                >
                  Preview {t}
                </button>
              ))}
            </div>
          </div>

          <div className="mb-5 flex gap-1 rounded-full border border-cream/10 bg-cream/5 p-1 w-fit">
            {TIER_FILTERS.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setFilter(t)}
                className="rounded-full px-[18px] py-2 font-sans text-[11px] font-semibold uppercase tracking-[0.12em]"
                style={
                  filter === t
                    ? { background: '#C2A064', color: '#171C10' }
                    : { background: 'transparent', color: 'rgba(240,238,229,0.6)' }
                }
              >
                {t}
              </button>
            ))}
          </div>

          {rowError && (
            <p className="mb-4 font-serif text-[13px] text-[#D8888A]">{rowError}</p>
          )}

          <div className="overflow-hidden rounded-cv-lg border border-cream/[0.09]">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-cream/[0.09] bg-cream/[0.03]">
                  <th className="px-5 py-3 font-sans text-[11px] font-semibold uppercase tracking-[0.12em] text-cream/50">Username</th>
                  <th className="px-5 py-3 font-sans text-[11px] font-semibold uppercase tracking-[0.12em] text-cream/50">Email</th>
                  <th className="px-5 py-3 font-sans text-[11px] font-semibold uppercase tracking-[0.12em] text-cream/50">Display name</th>
                  <th className="px-5 py-3 font-sans text-[11px] font-semibold uppercase tracking-[0.12em] text-cream/50">Tier</th>
                  <th className="px-5 py-3 font-sans text-[11px] font-semibold uppercase tracking-[0.12em] text-cream/50">Joined</th>
                  <th className="px-5 py-3 font-sans text-[11px] font-semibold uppercase tracking-[0.12em] text-cream/50">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr>
                    <td colSpan={6} className="px-5 py-6 text-center font-serif text-cream/50">
                      Loading…
                    </td>
                  </tr>
                )}
                {!loading && error && (
                  <tr>
                    <td colSpan={6} className="px-5 py-6 text-center font-serif text-[#D8888A]">
                      {error}
                    </td>
                  </tr>
                )}
                {!loading && !error && visible.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-5 py-6 text-center font-serif text-cream/50">
                      No members in this tier yet.
                    </td>
                  </tr>
                )}
                {!loading &&
                  !error &&
                  visible.map((m) => {
                    const isEditing = editingId === m.id
                    const isBusy = busyId === m.id
                    const isSelf = m.id === profile?.id
                    return (
                      <tr key={m.id} className="border-b border-cream/[0.06] last:border-b-0">
                        <td className="px-5 py-3.5 font-sans text-sm font-medium">{m.username || '—'}</td>
                        <td className="px-5 py-3.5 font-serif text-sm text-cream/75">{m.email}</td>
                        <td className="px-5 py-3.5 font-serif text-sm text-cream/75">
                          {isEditing ? (
                            <input
                              type="text"
                              value={editDisplayName}
                              onChange={(e) => setEditDisplayName(e.target.value)}
                              className="w-full rounded-md border border-cream/[0.18] bg-cream/[0.05] px-2.5 py-1.5 font-serif text-sm text-cream outline-none"
                            />
                          ) : (
                            m.display_name || '—'
                          )}
                        </td>
                        <td className="px-5 py-3.5">
                          {isEditing ? (
                            <select
                              value={editTier}
                              onChange={(e) => setEditTier(e.target.value)}
                              className="rounded-md border border-cream/[0.18] bg-[rgb(30,36,22)] px-2.5 py-1.5 font-sans text-[12px] uppercase tracking-[0.08em] text-cream outline-none"
                            >
                              {EDIT_TIERS.map((t) => (
                                <option key={t} value={t}>{t}</option>
                              ))}
                            </select>
                          ) : (
                            <TierBadge tier={m.tier} />
                          )}
                        </td>
                        <td className="px-5 py-3.5 font-serif text-sm text-cream/50">
                          {new Date(m.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-5 py-3.5">
                          {isEditing ? (
                            <div className="flex gap-2">
                              <button
                                type="button"
                                disabled={isBusy}
                                onClick={() => saveEdit(m.id)}
                                className="cursor-pointer rounded-full bg-gold px-3.5 py-1.5 font-sans text-[11px] font-semibold uppercase tracking-[0.08em] text-ink disabled:cursor-not-allowed disabled:opacity-60"
                              >
                                {isBusy ? 'Saving…' : 'Save'}
                              </button>
                              <button
                                type="button"
                                disabled={isBusy}
                                onClick={cancelEdit}
                                className="cursor-pointer rounded-full border border-cream/[0.18] bg-transparent px-3.5 py-1.5 font-sans text-[11px] font-semibold uppercase tracking-[0.08em] text-cream/70"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <div className="flex gap-2">
                              <button
                                type="button"
                                onClick={() => startEdit(m)}
                                className="cursor-pointer rounded-full border border-cream/[0.18] bg-cream/[0.04] px-3.5 py-1.5 font-sans text-[11px] font-semibold uppercase tracking-[0.08em] text-cream hover:border-gold/50"
                              >
                                Update
                              </button>
                              <button
                                type="button"
                                disabled={isBusy || isSelf}
                                title={isSelf ? "You can't delete your own account" : undefined}
                                onClick={() => handleDelete(m)}
                                className="cursor-pointer rounded-full border border-[#D8888A]/30 bg-[#D8888A]/[0.08] px-3.5 py-1.5 font-sans text-[11px] font-semibold uppercase tracking-[0.08em] text-[#D8888A] disabled:cursor-not-allowed disabled:opacity-40"
                              >
                                {isBusy ? 'Working…' : 'Delete'}
                              </button>
                            </div>
                          )}
                        </td>
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
