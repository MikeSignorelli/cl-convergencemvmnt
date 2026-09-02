import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import MemberSidebar from '../../components/MemberSidebar'
import MemberTopbar from '../../components/MemberTopbar'
import { supabase } from '../../lib/supabaseClient'
import { useAuth } from '../../lib/AuthContext'

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

export default function Members() {
  const navigate = useNavigate()
  const { setPreviewTier } = useAuth()
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    let cancelled = false
    async function load() {
      const { data, error: fetchError } = await supabase
        .from('profiles')
        .select('id, username, display_name, city, tier, created_at')
        .order('created_at', { ascending: false })
      if (cancelled) return
      if (fetchError) {
        setError(fetchError.message)
      } else {
        setMembers(data || [])
      }
      setLoading(false)
    }
    load()
    return () => {
      cancelled = true
    }
  }, [])

  const visible = filter === 'all' ? members : members.filter((m) => m.tier === filter)

  function previewTier(tier) {
    setPreviewTier(tier)
    navigate('/dashboard')
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

          <div className="overflow-hidden rounded-cv-lg border border-cream/[0.09]">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-cream/[0.09] bg-cream/[0.03]">
                  <th className="px-5 py-3 font-sans text-[11px] font-semibold uppercase tracking-[0.12em] text-cream/50">Username</th>
                  <th className="px-5 py-3 font-sans text-[11px] font-semibold uppercase tracking-[0.12em] text-cream/50">Display name</th>
                  <th className="px-5 py-3 font-sans text-[11px] font-semibold uppercase tracking-[0.12em] text-cream/50">City</th>
                  <th className="px-5 py-3 font-sans text-[11px] font-semibold uppercase tracking-[0.12em] text-cream/50">Tier</th>
                  <th className="px-5 py-3 font-sans text-[11px] font-semibold uppercase tracking-[0.12em] text-cream/50">Joined</th>
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr>
                    <td colSpan={5} className="px-5 py-6 text-center font-serif text-cream/50">
                      Loading…
                    </td>
                  </tr>
                )}
                {!loading && error && (
                  <tr>
                    <td colSpan={5} className="px-5 py-6 text-center font-serif text-[#D8888A]">
                      {error}
                    </td>
                  </tr>
                )}
                {!loading && !error && visible.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-5 py-6 text-center font-serif text-cream/50">
                      No members in this tier yet.
                    </td>
                  </tr>
                )}
                {!loading &&
                  !error &&
                  visible.map((m) => (
                    <tr key={m.id} className="border-b border-cream/[0.06] last:border-b-0">
                      <td className="px-5 py-3.5 font-sans text-sm font-medium">{m.username}</td>
                      <td className="px-5 py-3.5 font-serif text-sm text-cream/75">{m.display_name || '—'}</td>
                      <td className="px-5 py-3.5 font-serif text-sm text-cream/60">{m.city || '—'}</td>
                      <td className="px-5 py-3.5">
                        <TierBadge tier={m.tier} />
                      </td>
                      <td className="px-5 py-3.5 font-serif text-sm text-cream/50">
                        {new Date(m.created_at).toLocaleDateString()}
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
