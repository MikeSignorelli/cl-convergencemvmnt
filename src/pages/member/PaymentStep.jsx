import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useAuth } from '../../lib/AuthContext'
import { startMembershipCheckout } from '../../lib/billing'

const CHECKMARK = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#C2A064" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" className="mt-0.5 shrink-0">
    <path d="M20 6 9 17l-5-5" />
  </svg>
)

const INCLUDED = [
  'Monthly teaching from Mike, members-only',
  'The full course library',
  'The Convergence MVMNT community',
  'Cancel anytime. No contracts.',
]

const CONFIRM_TIMEOUT_MS = 15000
const POLL_INTERVAL_MS = 1500

// The account already exists by the time this step is reached (see
// SetPassword.jsx, which seeds the wizard here right after signup) — this
// is purely the $49/mo checkout, gating "Set up your profile" until Stripe
// actually confirms payment (see migration/webhook: subscription_status
// only ever flips via the webhook, never a client-reported "I paid").
export default function PaymentStep({ onNext }) {
  const [searchParams, setSearchParams] = useSearchParams()
  const { profile, refreshProfile } = useAuth()
  const [starting, setStarting] = useState(false)
  const [error, setError] = useState('')
  const [confirming, setConfirming] = useState(false)
  const [confirmTimedOut, setConfirmTimedOut] = useState(false)

  const checkoutParam = searchParams.get('checkout')

  // Returning from a successful Stripe redirect: the webhook that flips
  // subscription_status to 'active' fires from Stripe's servers and can
  // lag the browser redirect by a second or two, so poll briefly rather
  // than assuming it's already reflected the instant we land back here.
  useEffect(() => {
    if (checkoutParam !== 'success') return
    setSearchParams({}, { replace: true })
    setConfirming(true)
    setConfirmTimedOut(false)

    const interval = setInterval(() => {
      refreshProfile()
    }, POLL_INTERVAL_MS)
    const timeout = setTimeout(() => {
      clearInterval(interval)
      setConfirmTimedOut(true)
    }, CONFIRM_TIMEOUT_MS)

    return () => {
      clearInterval(interval)
      clearTimeout(timeout)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [checkoutParam])

  useEffect(() => {
    if (confirming && profile?.subscription_status === 'active') {
      setConfirming(false)
      onNext()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.subscription_status, confirming])

  async function handleCheckout() {
    setStarting(true)
    setError('')
    try {
      await startMembershipCheckout('/onboarding')
    } catch (err) {
      setError(err.message || 'Could not start checkout. Please try again.')
      setStarting(false)
    }
  }

  return (
    <div>
      <h1 className="mb-3 text-[34px] font-bold uppercase leading-[1.02] text-white">
        Complete your membership
      </h1>
      <p className="mb-[30px] font-serif text-[16.5px] leading-[1.6] text-cream/[72%]">
        Your account is set — one step left. $49/month gets you everything below.
      </p>

      <div className="mb-8 flex flex-col gap-3">
        {INCLUDED.map((item) => (
          <div key={item} className="flex items-start gap-[11px]">
            {CHECKMARK}
            <span className="font-serif text-[15px] text-cream/[82%]">{item}</span>
          </div>
        ))}
      </div>

      {checkoutParam === 'cancelled' && (
        <p className="mb-5 font-serif text-[13px] text-[#D8888A]">
          Checkout was cancelled — try again when you&rsquo;re ready.
        </p>
      )}

      {confirming ? (
        <div className="rounded-[14px] border border-gold/20 bg-gold/[0.06] px-6 py-5 text-center">
          {!confirmTimedOut ? (
            <p className="font-serif text-[15px] text-cream/80">Confirming your payment…</p>
          ) : (
            <>
              <p className="mb-3 font-serif text-[15px] text-cream/80">
                Still confirming — this can take a minute. You don&rsquo;t need to pay again.
              </p>
              <button
                type="button"
                onClick={() => {
                  setConfirmTimedOut(false)
                  refreshProfile()
                  setTimeout(() => setConfirmTimedOut(true), CONFIRM_TIMEOUT_MS)
                }}
                className="cursor-pointer rounded-full border border-cream/[0.22] bg-transparent px-6 py-3 font-sans text-xs font-semibold uppercase tracking-[0.12em] text-cream"
              >
                Check again
              </button>
            </>
          )}
        </div>
      ) : (
        <div className="flex flex-col items-center gap-3">
          <div className="font-sans text-[28px] font-bold text-cream-solid">
            $49<span className="text-base font-medium text-cream/60">/mo</span>
          </div>
          <button
            type="button"
            onClick={handleCheckout}
            disabled={starting}
            className="flex w-full cursor-pointer items-center justify-center gap-2.5 rounded-full border-none bg-gold px-8 py-3.5 font-sans text-[13px] font-semibold uppercase tracking-[0.12em] text-ink disabled:cursor-not-allowed disabled:opacity-60"
          >
            {starting ? 'Redirecting…' : 'Join the movement — $49/mo'}
          </button>
          {error && <p className="font-serif text-[13px] text-[#D8888A]">{error}</p>}
        </div>
      )}
    </div>
  )
}
