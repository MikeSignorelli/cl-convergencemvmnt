import { useState } from 'react'
import UpgradeLock from '../components/UpgradeLock'

// TEMPORARY preview page (public) so the locked/upgrade design can be seen
// without logging in. Safe to delete along with its /lock-preview route.

function LockPill({ label }) {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-[rgba(10,13,7,0.45)]">
      <div className="flex items-center gap-[7px] rounded-full border border-cream/20 bg-[rgba(10,13,7,0.7)] px-4 py-2 text-[10.5px] font-semibold uppercase tracking-[0.14em] text-cream/85">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="11" width="18" height="11" rx="2" />
          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
        </svg>
        {label}
      </div>
    </div>
  )
}

function DemoCard({ title, locked }) {
  return (
    <div className="w-[300px] shrink-0">
      <div className="relative mb-2.5 aspect-video overflow-hidden rounded-xl border border-cream/[0.09] bg-[rgb(30,36,22)]">
        <div
          className={`absolute inset-0 bg-[linear-gradient(135deg,#3a4a26,#12150c)] ${
            locked ? 'scale-105 brightness-[0.5] blur-[3px]' : 'brightness-[0.7]'
          }`}
        />
        <div className="absolute inset-0 bg-[linear-gradient(transparent_40%,rgba(10,13,7,0.85))]" />
        {locked && <LockPill label="Leader tier" />}
        <div className="absolute bottom-3 left-3.5 right-3.5 text-base font-bold uppercase leading-[1.05] text-white">
          {title}
        </div>
      </div>
      <div className="text-xs font-semibold tracking-[0.06em] text-cream/55">6 lessons · 48 min</div>
    </div>
  )
}

export default function LockPreview() {
  const [demo, setDemo] = useState(false)
  return (
    <div className="min-h-screen bg-ink px-6 py-12 font-sans text-cream antialiased">
      <div className="mx-auto max-w-[960px]">
        <p className="mb-8 font-sans text-[11px] font-semibold uppercase tracking-[0.14em] text-cream/45">
          Locked-state preview (temporary route · /lock-preview)
        </p>

        <h2 className="mb-4 text-[15px] font-bold uppercase tracking-[0.1em] text-white/80">
          1 · Course detail — restricted
        </h2>
        <div className="mb-3.5 flex flex-wrap items-center gap-2.5">
          <span className="rounded-full border border-gold/35 bg-gold/[0.16] px-[13px] py-[5px] font-sans text-[10.5px] font-semibold uppercase tracking-[0.14em] text-[#E9CF9C]">
            Locked
          </span>
          <span className="font-sans text-[11px] font-semibold uppercase tracking-[0.12em] text-cream/55">
            Discipleship · 6 lessons
          </span>
        </div>
        <h1 className="mb-3 text-[38px] font-bold uppercase leading-[1.02] text-white">The Foundations Series</h1>
        <p className="mb-8 max-w-[640px] font-serif text-[16.5px] leading-[1.6] text-cream/[78%]">
          A sample restricted course so you can see the locked, blurred upgrade state exactly as it renders in context.
        </p>
        <UpgradeLock
          title="Unlock this course"
          message="This course is part of the Convergence full membership — join to stream it and unlock the entire library."
          minHeight={360}
          onUpgrade={() => setDemo(true)}
        >
          <div className="flex aspect-video w-full items-center justify-center bg-[linear-gradient(135deg,#2a3320,#12150c)]">
            <svg width="56" height="56" viewBox="0 0 24 24" fill="#C2A064">
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
        </UpgradeLock>
        {demo && (
          <p className="mt-3 font-serif text-[13.5px] text-[#9BC08A]">
            → In the live app this opens Stripe checkout for the logged-in member. Disabled here on the logged-out preview.
          </p>
        )}

        <h2 className="mb-4 mt-14 text-[15px] font-bold uppercase tracking-[0.1em] text-white/80">
          2 · Course library — locked vs unlocked cards
        </h2>
        <div className="flex flex-wrap gap-[18px]">
          <DemoCard title="Prayer & Fasting" locked={false} />
          <DemoCard title="Leading at Depth" locked />
          <DemoCard title="The Prophetic Voice" locked />
        </div>
      </div>
    </div>
  )
}
