import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useAuth } from '../../lib/AuthContext'
import { startMembershipCheckout, startCoursePurchase, formatPrice } from '../../lib/billing'
import { fetchCourse } from '../../lib/courses'
import { getCourseAccess } from '../../lib/courseAccess'

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
// SetPassword.jsx, which seeds the wizard here right after signup). Two
// modes share this one screen: the default $49/mo membership checkout, and
// (mode === 'course') a one-time single-course checkout for whichever
// course the visitor started from on /programs. Either way this step gates
// "Set up your profile" until Stripe actually confirms payment (see
// migration/webhook — subscription_status / course_purchases.status only
// ever flip via the webhook, never a client-reported "I paid").
export default function PaymentStep({ mode, courseId, onNext }) {
  const [searchParams, setSearchParams] = useSearchParams()
  const { profile, isAdmin, refreshProfile, purchasedCourseIds, refreshPurchases } = useAuth()
  const [starting, setStarting] = useState(false)
  const [error, setError] = useState('')
  const [confirming, setConfirming] = useState(false)
  const [confirmTimedOut, setConfirmTimedOut] = useState(false)

  const isCourseMode = mode === 'course'
  const [course, setCourse] = useState(null)
  const [courseLoading, setCourseLoading] = useState(isCourseMode)
  const [courseLoadError, setCourseLoadError] = useState('')

  const checkoutParam = searchParams.get('checkout')

  // Authoritative title/price come from the DB, never the URL/localStorage —
  // a courseId is just an id until this resolves.
  useEffect(() => {
    if (!isCourseMode) return
    let cancelled = false
    fetchCourse(courseId)
      .then((c) => {
        if (cancelled) return
        setCourse(c)
      })
      .catch((err) => {
        if (!cancelled) setCourseLoadError(err.message || 'Could not load this course.')
      })
      .finally(() => {
        if (!cancelled) setCourseLoading(false)
      })
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isCourseMode, courseId])

  // Someone who authenticated mid-flow via the "Log in instead" link
  // (CreateLoginStep) may already have access to this exact course —
  // either a standalone purchase, or (the case a plain purchasedCourseIds
  // check misses) an active membership whose role already includes it, per
  // the same rules CourseDetail/Programs/Dashboard use everywhere else.
  // Either way there's nothing to charge them for, so this skips the buy
  // button rather than risk a second charge — see the render below.
  const courseAccess = isCourseMode && course ? getCourseAccess({ course, profile, isAdmin, purchasedCourseIds }) : null

  // Returning from a successful Stripe redirect: the webhook that flips
  // subscription_status / course_purchases.status fires from Stripe's
  // servers and can lag the browser redirect by a second or two, so poll
  // briefly rather than assuming it's already reflected the instant we
  // land back here.
  useEffect(() => {
    if (checkoutParam !== 'success') return
    setSearchParams({}, { replace: true })
    setConfirming(true)
    setConfirmTimedOut(false)

    const interval = setInterval(() => {
      if (isCourseMode) refreshPurchases()
      else refreshProfile()
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
    if (!confirming) return
    if (isCourseMode) {
      if (purchasedCourseIds.includes(courseId)) {
        setConfirming(false)
        onNext()
      }
    } else if (profile?.subscription_status === 'active') {
      setConfirming(false)
      onNext()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.subscription_status, purchasedCourseIds, confirming])

  async function handleCheckout() {
    setStarting(true)
    setError('')
    try {
      if (isCourseMode) await startCoursePurchase(courseId, '/onboarding')
      else await startMembershipCheckout('/onboarding')
    } catch (err) {
      setError(err.message || 'Could not start checkout. Please try again.')
      setStarting(false)
    }
  }

  if (isCourseMode && courseLoading) {
    return <p className="font-serif text-cream/50">Loading…</p>
  }

  // Deleted, or no longer sold individually (price_cents dropped to 0) —
  // there's nothing to charge for, so send them back to pick something else
  // instead of showing a broken buy button.
  if (isCourseMode && (courseLoadError || !course || !course.price_cents || course.price_cents <= 0)) {
    return (
      <div>
        <h1 className="mb-3 text-[34px] font-bold uppercase leading-[1.02] text-white">
          This course isn&rsquo;t available
        </h1>
        <p className="mb-[30px] font-serif text-[16.5px] leading-[1.6] text-cream/[72%]">
          {courseLoadError || "It's no longer sold individually, or may have been removed. Your account is already set up — pick another program."}
        </p>
        <Link
          to="/programs"
          className="inline-flex items-center gap-2.5 rounded-full border-none bg-gold px-8 py-3.5 font-sans text-[13px] font-semibold uppercase tracking-[0.12em] text-ink no-underline"
        >
          Browse programs
        </Link>
      </div>
    )
  }

  // Already unlocked — a standalone purchase, an active membership whose
  // role already includes this course, or (rare here) an admin account —
  // so there's nothing to pay for. Sends them to the dashboard rather than
  // continuing into "Set up your profile": they authenticated via "Log in
  // instead" into an existing account, not a fresh signup.
  if (isCourseMode && courseAccess?.unlocked) {
    const alreadyHaveAccessCopy =
      courseAccess.reason === 'membership'
        ? 'This course is already included in your membership — no need to buy it separately.'
        : courseAccess.reason === 'admin'
          ? 'Your admin account already has access to every course.'
          : 'You already own this course — no need to pay again.'
    return (
      <div>
        <h1 className="mb-3 text-[34px] font-bold uppercase leading-[1.02] text-white">
          You already have access
        </h1>
        <p className="mb-[30px] font-serif text-[16.5px] leading-[1.6] text-cream/[72%]">
          {alreadyHaveAccessCopy}
        </p>
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-2.5 rounded-full border-none bg-gold px-8 py-3.5 font-sans text-[13px] font-semibold uppercase tracking-[0.12em] text-ink no-underline"
        >
          Go to my dashboard
        </Link>
      </div>
    )
  }

  return (
    <div>
      <h1 className="mb-3 text-[34px] font-bold uppercase leading-[1.02] text-white">
        {isCourseMode ? 'Complete your purchase' : 'Complete your membership'}
      </h1>
      <p className="mb-[30px] font-serif text-[16.5px] leading-[1.6] text-cream/[72%]">
        {isCourseMode ? (
          <>Your account is set — one step left. Get full access to <span className="text-cream">{course.title}</span>.</>
        ) : (
          "Your account is set — one step left. $49/month gets you everything below."
        )}
      </p>

      {!isCourseMode && (
        <div className="mb-8 flex flex-col gap-3">
          {INCLUDED.map((item) => (
            <div key={item} className="flex items-start gap-[11px]">
              {CHECKMARK}
              <span className="font-serif text-[15px] text-cream/[82%]">{item}</span>
            </div>
          ))}
        </div>
      )}

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
                  if (isCourseMode) refreshPurchases()
                  else refreshProfile()
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
            {isCourseMode ? (
              formatPrice(course.price_cents)
            ) : (
              <>$49<span className="text-base font-medium text-cream/60">/mo</span></>
            )}
          </div>
          <button
            type="button"
            onClick={handleCheckout}
            disabled={starting}
            className="flex w-full cursor-pointer items-center justify-center gap-2.5 rounded-full border-none bg-gold px-8 py-3.5 font-sans text-[13px] font-semibold uppercase tracking-[0.12em] text-ink disabled:cursor-not-allowed disabled:opacity-60"
          >
            {starting ? 'Redirecting…' : isCourseMode ? 'Complete purchase' : 'Join the movement — $49/mo'}
          </button>
          {error && <p className="font-serif text-[13px] text-[#D8888A]">{error}</p>}
        </div>
      )}
    </div>
  )
}
