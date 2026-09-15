import { useState } from 'react'
import { startMembershipCheckout } from '../lib/billing'

function LockGlyph() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#E9CF9C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  )
}

// Reusable locked-state design for membership-gated ("restricted") sections.
// Renders `children` blurred + dimmed behind a glass upgrade card that carries
// a START NOW checkout CTA. Drop it around any section an à la carte / non-full
// member shouldn't see yet — the whole point is to show *that there's more*
// while nudging the upgrade to the full $49/mo membership.
export default function UpgradeLock({
  children,
  eyebrow = 'Full membership',
  title = 'Unlock the full experience',
  message = 'This is part of the Convergence full membership — every course, every live session, and the whole community.',
  price = '$49/mo',
  cta = 'Start now',
  minHeight = 320,
  onUpgrade,
}) {
  const [starting, setStarting] = useState(false)
  const [error, setError] = useState('')

  async function handleUpgrade() {
    // Optional override — lets the logged-out preview demo the click without
    // hitting the real, auth-gated checkout function. Live app omits it.
    if (onUpgrade) {
      onUpgrade()
      return
    }
    setStarting(true)
    setError('')
    try {
      await startMembershipCheckout()
    } catch (err) {
      setError(err.message || 'Could not start checkout. Please try again.')
      setStarting(false)
    }
  }

  return (
    <div className="relative overflow-hidden rounded-cv-lg border border-cream/[0.09]" style={{ minHeight }}>
      {/* The real content, blurred and inert — it hints at what's behind the lock. */}
      <div aria-hidden className="pointer-events-none h-full w-full select-none scale-[1.03] opacity-60 blur-[7px] saturate-[0.85]">
        {children}
      </div>

      {/* Lock overlay + upgrade prompt */}
      <div className="absolute inset-0 flex items-center justify-center bg-[rgba(10,13,7,0.55)] px-6 py-10 text-center">
        <div className="flex w-full max-w-[380px] flex-col items-center gap-4 rounded-cv-lg border border-gold/25 bg-[rgba(18,21,12,0.74)] px-8 py-9 backdrop-blur-md">
          <div className="flex h-14 w-14 items-center justify-center rounded-full border border-gold/30 bg-gold/[0.12]">
            <LockGlyph />
          </div>
          <div className="flex flex-col gap-1.5">
            <span className="font-sans text-[10.5px] font-semibold uppercase tracking-[0.16em] text-[#E9CF9C]">
              {eyebrow}
            </span>
            <h3 className="font-sans text-[19px] font-bold uppercase leading-[1.08] text-white">{title}</h3>
            <p className="font-serif text-[14px] leading-[1.55] text-cream/70">{message}</p>
          </div>
          {error && <p className="font-serif text-[12.5px] text-[#D8888A]">{error}</p>}
          <button
            type="button"
            onClick={handleUpgrade}
            disabled={starting}
            className="mt-1 inline-flex cursor-pointer items-center gap-2 rounded-full border-none bg-gold px-7 py-3 font-sans text-[12.5px] font-semibold uppercase tracking-[0.12em] text-ink disabled:cursor-not-allowed disabled:opacity-60"
          >
            {starting ? (
              'Redirecting…'
            ) : (
              <>
                {cta} · {price}
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14M13 6l6 6-6 6" />
                </svg>
              </>
            )}
          </button>
          <span className="font-sans text-[10.5px] uppercase tracking-[0.1em] text-cream/40">Cancel anytime</span>
        </div>
      </div>
    </div>
  )
}
