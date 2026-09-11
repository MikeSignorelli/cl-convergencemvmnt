import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import MemberSidebar from '../../components/MemberSidebar'
import { PaymentStatusBadge } from '../../components/PaymentWall'
import { useAuth } from '../../lib/AuthContext'
import { fetchBillingSummary, setMembershipCancellation, formatPrice } from '../../lib/billing'

// Shared status colors so membership, invoices, and course rows read as one
// system — green matches an active membership badge (see PaymentWall).
const GREEN = { bg: 'rgba(155,192,138,0.16)', text: '#9BC08A' }
const NEUTRAL = { bg: 'rgba(240,238,229,0.1)', text: 'rgba(240,238,229,0.6)' }
const RED = { bg: 'rgba(216,136,138,0.16)', text: '#D8888A' }

// Covers both Stripe invoice statuses (paid/open/draft/void/uncollectible)
// and course_purchases statuses (completed/pending/failed) — the unified
// transactions list from get-billing-summary carries both.
const STATUS_STYLES = {
  paid: { label: 'Paid', ...GREEN },
  completed: { label: 'Paid', ...GREEN },
  open: { label: 'Open', ...NEUTRAL },
  pending: { label: 'Pending', ...NEUTRAL },
  draft: { label: 'Draft', ...NEUTRAL },
  void: { label: 'Void', ...NEUTRAL },
  failed: { label: 'Failed', ...RED },
  uncollectible: { label: 'Failed', ...RED },
}

function statusConfig(status) {
  return STATUS_STYLES[status] || { label: status || '—', ...NEUTRAL }
}

function StatusPill({ status }) {
  const c = statusConfig(status)
  return (
    <span
      className="rounded-full px-3 py-1 font-sans text-[10.5px] font-semibold uppercase tracking-[0.08em]"
      style={{ background: c.bg, color: c.text }}
    >
      {c.label}
    </span>
  )
}

function formatDateTime(iso) {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

function formatDate(iso) {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
}

const CardIcon = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
    <line x1="1" y1="10" x2="23" y2="10" />
  </svg>
)
const PlayIcon = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="4" width="20" height="16" rx="2" />
    <path d="m10 9 5 3-5 3z" />
  </svg>
)

export default function PaymentHistory() {
  const { profile } = useAuth()

  const [summary, setSummary] = useState(null) // { hasStripeCustomer, membership, transactions }
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [confirmOpen, setConfirmOpen] = useState(false)
  const [actionBusy, setActionBusy] = useState(false)
  const [actionError, setActionError] = useState('')

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const data = await fetchBillingSummary()
        if (!cancelled) setSummary(data)
      } catch (err) {
        if (!cancelled) setError(err.message || 'Could not load billing.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [])

  const membership = summary?.membership
  const transactions = summary?.transactions || []
  const membershipStatus = membership?.status || profile?.subscription_status || 'pending'
  const isActive = membershipStatus === 'active'
  const needsAction = membershipStatus === 'failed' || membershipStatus === 'cancelled'
  const cancelScheduled = !!membership?.cancelAtPeriodEnd
  const periodEnd = membership?.currentPeriodEnd

  function applyCancelState(cancelAtPeriodEnd, currentPeriodEnd) {
    setSummary((prev) => ({
      hasStripeCustomer: prev?.hasStripeCustomer ?? true,
      transactions: prev?.transactions || [],
      membership: {
        ...(prev?.membership || {}),
        status: prev?.membership?.status || profile?.subscription_status || 'active',
        cancelAtPeriodEnd,
        currentPeriodEnd: currentPeriodEnd ?? prev?.membership?.currentPeriodEnd ?? null,
      },
    }))
  }

  async function handleCancel() {
    setActionBusy(true)
    setActionError('')
    try {
      const res = await setMembershipCancellation(true)
      applyCancelState(true, res?.currentPeriodEnd)
      setConfirmOpen(false)
    } catch (err) {
      setActionError(err.message || 'Could not cancel. Please try again.')
    } finally {
      setActionBusy(false)
    }
  }

  async function handleResume() {
    setActionBusy(true)
    setActionError('')
    try {
      const res = await setMembershipCancellation(false)
      applyCancelState(false, res?.currentPeriodEnd)
    } catch (err) {
      setActionError(err.message || 'Could not resume. Please try again.')
    } finally {
      setActionBusy(false)
    }
  }

  const membershipSubtitle = (() => {
    if (isActive && cancelScheduled)
      return `Access continues until ${formatDate(periodEnd)} — your membership won’t renew.`
    if (isActive) {
      const price = membership?.upcomingAmountCents != null ? formatPrice(membership.upcomingAmountCents) : '$49'
      const when = membership?.upcomingDate || periodEnd
      return when
        ? `${price} / month · next charge ${formatDate(when)} · cancel anytime`
        : `${price} / month · renews monthly · cancel anytime`
    }
    return 'Full access to every course, live sessions, and the community.'
  })()

  return (
    <div className="flex min-h-screen bg-ink font-sans text-cream">
      <MemberSidebar active="/payments" />

      <main className="mx-auto max-w-[1180px] flex-1 min-w-0 px-8 py-9 pb-16">
        <h1 className="m-0 text-[32px] font-bold uppercase leading-[1.04] text-white">Payment history</h1>
        <p className="mb-8 mt-1.5 font-serif text-[15px] text-cream/60">
          Your membership, every payment you’ve made, and any individual course purchases.
        </p>

        {/* Membership */}
        <section className="mb-9">
          <h2 className="mb-3.5 text-[13px] font-bold uppercase tracking-[0.14em] text-cream/45">Membership</h2>
          <div className="flex flex-wrap items-center justify-between gap-5 rounded-2xl border border-cream/[0.09] bg-[rgb(30,36,22)] p-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gold/[0.14]">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#C2A064" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 7l4 4 5-7 5 7 4-4v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                </svg>
              </div>
              <div>
                <div className="text-[16px] font-bold uppercase tracking-[0.02em] text-white">Convergence Membership</div>
                <div className="mt-1 font-serif text-[14px] text-cream/60">{membershipSubtitle}</div>
              </div>
            </div>

            <div className="flex flex-col items-end gap-2.5">
              <PaymentStatusBadge status={membershipStatus} />

              {isActive && !cancelScheduled && (
                <button
                  type="button"
                  onClick={() => {
                    setActionError('')
                    setConfirmOpen(true)
                  }}
                  className="cursor-pointer rounded-full border border-[rgba(216,136,138,0.4)] bg-transparent px-5 py-2 font-sans text-[11px] font-semibold uppercase tracking-[0.1em] text-[#D8888A] hover:bg-[rgba(216,136,138,0.08)]"
                >
                  Cancel membership
                </button>
              )}

              {isActive && cancelScheduled && (
                <button
                  type="button"
                  onClick={handleResume}
                  disabled={actionBusy}
                  className="cursor-pointer rounded-full border border-gold/40 bg-gold/10 px-5 py-2 font-sans text-[11px] font-semibold uppercase tracking-[0.1em] text-[#E9CF9C] hover:bg-gold/[0.16] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {actionBusy ? 'Working…' : 'Resume membership'}
                </button>
              )}

              {!isActive && (
                <Link
                  to="/membership"
                  className="font-sans text-[11.5px] font-semibold uppercase tracking-[0.1em] text-[#E9CF9C] no-underline hover:text-gold"
                >
                  {needsAction ? 'Update membership →' : 'Join the movement →'}
                </Link>
              )}
            </div>
          </div>
          {actionError && !confirmOpen && (
            <p className="mt-2.5 font-serif text-[13px] text-[#D8888A]">{actionError}</p>
          )}
        </section>

        {/* Unified payment history */}
        <section>
          <h2 className="mb-3.5 text-[13px] font-bold uppercase tracking-[0.14em] text-cream/45">Payments</h2>

          {loading && <p className="font-serif text-cream/50">Loading your payments…</p>}
          {!loading && error && (
            <p className="font-serif text-[13.5px] text-[#D8888A]">Couldn’t load your payments: {error}</p>
          )}
          {!loading && !error && transactions.length === 0 && (
            <div className="rounded-2xl border border-dashed border-cream/[0.14] bg-cream/[0.02] p-10 text-center">
              <p className="mx-auto mb-4 max-w-[440px] font-serif text-[15px] leading-[1.6] text-cream/55">
                No payments yet. Your membership charges and any course purchases will appear here.
              </p>
              <Link
                to="/membership"
                className="font-sans text-[12px] font-semibold uppercase tracking-[0.1em] text-[#E9CF9C] no-underline hover:text-gold"
              >
                Join the movement →
              </Link>
            </div>
          )}

          {!loading && !error && transactions.length > 0 && (
            <div className="overflow-hidden rounded-2xl border border-cream/[0.09] bg-[rgb(30,36,22)]">
              {transactions.map((t) => (
                <div
                  key={t.id}
                  className="flex items-center justify-between gap-4 border-b border-cream/[0.05] px-5 py-4 last:border-b-0"
                >
                  <div className="flex min-w-0 items-center gap-3.5">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gold/[0.1] text-gold">
                      {t.type === 'course' ? PlayIcon : CardIcon}
                    </div>
                    <div className="min-w-0">
                      <div className="overflow-hidden text-ellipsis whitespace-nowrap text-[14.5px] font-semibold text-white">
                        {t.description || (t.type === 'course' ? 'Course purchase' : 'Membership')}
                      </div>
                      <div className="font-serif text-[12.5px] text-cream/45">
                        {t.type === 'course' ? 'Course' : 'Membership'} · {formatDateTime(t.date)}
                      </div>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-4">
                    {t.receiptUrl && (
                      <a
                        href={t.receiptUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hidden font-sans text-[11px] font-semibold uppercase tracking-[0.08em] text-cream/45 no-underline hover:text-cream sm:inline"
                      >
                        Receipt ↗
                      </a>
                    )}
                    <span className="font-sans text-[14px] font-semibold tabular-nums text-cream/85">
                      {formatPrice(t.amountCents)}
                    </span>
                    <StatusPill status={t.status} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      {/* Cancel confirmation */}
      {confirmOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-[rgba(10,13,7,0.8)] p-6 backdrop-blur-[6px]"
          onClick={() => !actionBusy && setConfirmOpen(false)}
        >
          <div
            className="w-[420px] max-w-full rounded-[20px] border border-[rgba(216,136,138,0.35)] bg-[linear-gradient(170deg,rgb(35,43,24),rgb(23,28,16))] p-[34px_32px] shadow-[0_40px_90px_-20px_rgba(0,0,0,0.8)]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#D8888A]">Cancel membership</div>
            <h2 className="mb-3 text-[23px] font-bold uppercase leading-[1.08] text-white">Cancel your membership?</h2>
            <p className="mb-6 font-serif text-[15px] leading-[1.6] text-cream/[72%]">
              {periodEnd
                ? `You’ll keep full access until ${formatDate(periodEnd)}. After that, your membership won’t renew — you’ll lose access to courses, live sessions, and the community.`
                : 'You’ll keep access until the end of your current billing period. After that, your membership won’t renew — you’ll lose access to courses, live sessions, and the community.'}
            </p>
            {actionError && <p className="mb-4 font-serif text-[13px] text-[#D8888A]">{actionError}</p>}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setConfirmOpen(false)}
                disabled={actionBusy}
                className="flex-1 cursor-pointer rounded-full border border-cream/20 bg-transparent py-3 font-sans text-[12px] font-semibold uppercase tracking-[0.1em] text-cream hover:bg-cream/[0.06] disabled:cursor-not-allowed disabled:opacity-60"
              >
                Keep membership
              </button>
              <button
                type="button"
                onClick={handleCancel}
                disabled={actionBusy}
                className="flex-1 cursor-pointer rounded-full border-none bg-[#C25E5E] py-3 font-sans text-[12px] font-semibold uppercase tracking-[0.1em] text-white hover:bg-[#b45252] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {actionBusy ? 'Cancelling…' : 'Cancel membership'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
