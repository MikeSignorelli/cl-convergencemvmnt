import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import MemberSidebar from '../../components/MemberSidebar'
import MemberTopbar from '../../components/MemberTopbar'
import { useAuth } from '../../lib/AuthContext'
import { listMembers, deleteMember } from '../../lib/adminMembers'

const TIER_FILTERS = ['all', 'disciple', 'leader', 'pastor', 'admin']
const PREVIEW_TIERS = ['disciple', 'leader', 'pastor']

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

function BillingBadge({ status }) {
  const colors = {
    active: { bg: 'rgba(155,192,138,0.16)', text: '#9BC08A' },
    pending: { bg: 'rgba(240,238,229,0.1)', text: 'rgba(240,238,229,0.6)' },
    failed: { bg: 'rgba(216,136,138,0.16)', text: '#D8888A' },
    cancelled: { bg: 'rgba(216,136,138,0.1)', text: 'rgba(216,136,138,0.7)' },
  }
  const c = colors[status] || colors.pending
  return (
    <span
      className="rounded-full px-3 py-1 font-sans text-[10.5px] font-semibold uppercase tracking-[0.1em]"
      style={{ background: c.bg, color: c.text }}
    >
      {status || 'pending'}
    </span>
  )
}

function MemberDetailPanel({ member, onClose, onDelete, busy }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-6" onClick={onClose}>
      <div
        className="w-full max-w-[440px] rounded-cv-lg border border-cream/[0.09] bg-[rgb(30,36,22)] p-7"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-5 flex items-start justify-between">
          <div>
            <h2 className="m-0 font-sans text-xl font-bold uppercase text-white">
              {member.display_name || member.username}
            </h2>
            <p className="mt-1 font-serif text-sm text-cream/55">@{member.username}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer rounded-lg border-none bg-transparent p-1 text-cream/50 hover:text-cream"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex flex-col gap-3.5 font-serif text-sm">
          <div className="flex items-center justify-between border-b border-cream/[0.07] pb-3">
            <span className="text-cream/50">Email</span>
            <span className="text-cream">{member.email}</span>
          </div>
          <div className="flex items-center justify-between border-b border-cream/[0.07] pb-3">
            <span className="text-cream/50">Tier</span>
            <TierBadge tier={member.tier} />
          </div>
          <div className="flex items-center justify-between border-b border-cream/[0.07] pb-3">
            <span className="text-cream/50">Billing status</span>
            <BillingBadge status={member.subscription_status} />
          </div>
          <div className="flex items-center justify-between border-b border-cream/[0.07] pb-3">
            <span className="text-cream/50">City</span>
            <span className="text-cream">{member.city || '—'}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-cream/50">Joined</span>
            <span className="text-cream">{new Date(member.created_at).toLocaleDateString()}</span>
          </div>
        </div>

        <button
          type="button"
          disabled={busy}
          onClick={() => onDelete(member)}
          className="mt-6 w-full cursor-pointer rounded-full border border-[#D8888A]/30 bg-[#D8888A]/[0.08] px-5 py-2.5 font-sans text-[12px] font-semibold uppercase tracking-[0.08em] text-[#D8888A] disabled:cursor-not-allowed disabled:opacity-40"
        >
          {busy ? 'Working…' : 'Delete account'}
        </button>
      </div>
    </div>
  )
}

export default function Members() {
  const navigate = useNavigate()
  const { profile, setPreviewTier } = useAuth()
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState('all')
  const [viewing, setViewing] = useState(null)
  const [busyId, setBusyId] = useState(null)
  const [rowError, setRowError] = useState('')

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

  async function handleDelete(m) {
    const label = m.display_name || m.username || m.email
    if (!window.confirm(`Permanently delete ${label}'s account? This can't be undone.`)) return
    setBusyId(m.id)
    setRowError('')
    try {
      await deleteMember(m.id)
      setViewing(null)
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
                  <th className="px-5 py-3 font-sans text-[11px] font-semibold uppercase tracking-[0.12em] text-cream/50">Tier</th>
                  <th className="px-5 py-3 font-sans text-[11px] font-semibold uppercase tracking-[0.12em] text-cream/50">Billing</th>
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
                    const isBusy = busyId === m.id
                    const isSelf = m.id === profile?.id
                    return (
                      <tr key={m.id} className="border-b border-cream/[0.06] last:border-b-0">
                        <td className="px-5 py-3.5 font-sans text-sm font-medium">{m.username || '—'}</td>
                        <td className="px-5 py-3.5 font-serif text-sm text-cream/75">{m.email}</td>
                        <td className="px-5 py-3.5">
                          <TierBadge tier={m.tier} />
                        </td>
                        <td className="px-5 py-3.5">
                          <BillingBadge status={m.subscription_status} />
                        </td>
                        <td className="px-5 py-3.5 font-serif text-sm text-cream/50">
                          {new Date(m.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => setViewing(m)}
                              className="cursor-pointer rounded-full border border-cream/[0.18] bg-cream/[0.04] px-3.5 py-1.5 font-sans text-[11px] font-semibold uppercase tracking-[0.08em] text-cream hover:border-gold/50"
                            >
                              View
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
                        </td>
                      </tr>
                    )
                  })}
              </tbody>
            </table>
          </div>
        </main>
      </div>

      {viewing && (
        <MemberDetailPanel
          member={viewing}
          onClose={() => setViewing(null)}
          onDelete={handleDelete}
          busy={busyId === viewing.id}
        />
      )}
    </div>
  )
}
