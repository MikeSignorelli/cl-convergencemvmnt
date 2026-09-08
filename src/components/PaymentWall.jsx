import { useState } from 'react'
import { startMembershipCheckout } from '../lib/billing'

const BILLING_LABELS = {
  pending: 'Payment pending',
  active: 'Active',
  failed: 'Payment failed',
  cancelled: 'Cancelled',
}

export function PaymentStatusBadge({ status }) {
  const colors = {
    active: { bg: 'rgba(155,192,138,0.16)', text: '#9BC08A' },
    pending: { bg: 'rgba(240,238,229,0.1)', text: 'rgba(240,238,229,0.6)' },
    failed: { bg: 'rgba(216,136,138,0.16)', text: '#D8888A' },
    cancelled: { bg: 'rgba(216,136,138,0.1)', text: 'rgba(216,136,138,0.7)' },
  }
  const c = colors[status] || colors.pending
  return (
    <span
      className="rounded-full px-3.5 py-1.5 font-sans text-[11px] font-semibold uppercase tracking-[0.08em]"
      style={{ background: c.bg, color: c.text }}
    >
      {BILLING_LABELS[status] || BILLING_LABELS.pending}
    </span>
  )
}

// Membership access requires an active subscription -- gates the
// dashboard, the course library, and every course page (all courses are
// included in the single membership; none are purchased individually).
// Admins always pass through, since they don't hold a real membership
// subscription.
export default function PaymentWall({ status }) {
  const [starting, setStarting] = useState(false)
  const [error, setError] = useState('')

  async function handleCheckout() {
    setStarting(true)
    setError('')
    try {
      await startMembershipCheckout()
    } catch (err) {
      setError(err.message || 'Could not start checkout. Please try again.')
      setStarting(false)
    }
  }

  const isFailed = status === 'failed' || status === 'cancelled'

  return (
    <main className="mx-auto flex w-full max-w-[560px] flex-1 flex-col items-center justify-center px-8 py-16 text-center">
      <div className="mb-5">
        <PaymentStatusBadge status={status} />
      </div>
      <h1 className="mb-3 font-sans text-[28px] font-bold uppercase leading-[1.05] text-white">
        {isFailed ? 'Update your payment to continue' : 'Complete your membership'}
      </h1>
      <p className="mb-8 font-serif text-base leading-[1.6] text-cream/70">
        {isFailed
          ? 'Your last membership payment didn’t go through. Update billing to get back into your dashboard and courses.'
          : 'Your dashboard, courses, and community unlock once your $49/mo membership payment is confirmed.'}
      </p>
      {error && <p className="mb-4 font-serif text-[13px] text-[#D8888A]">{error}</p>}
      <button
        type="button"
        onClick={handleCheckout}
        disabled={starting}
        className="flex cursor-pointer items-center gap-2.5 rounded-full border-none bg-gold px-8 py-3.5 font-sans text-[13px] font-semibold uppercase tracking-[0.12em] text-ink disabled:cursor-not-allowed disabled:opacity-60"
      >
        {starting ? 'Redirecting…' : isFailed ? 'Update payment · $49/mo' : 'Join the movement · $49/mo'}
      </button>
    </main>
  )
}
