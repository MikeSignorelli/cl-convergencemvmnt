import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import logo from '../../assets/images/convergence-mvmnt.png'

const STEP_NAMES = ['Your path', 'Your focus', 'Daily rhythm', 'Profile', 'Get the app']

const TIERS = [
  {
    id: 'disciple',
    name: 'Disciple',
    accent: '#C2A064',
    description: 'Freedom, healing, and breaking generational patterns.',
  },
  {
    id: 'leader',
    name: 'Leader',
    accent: '#8FA9BD',
    description: 'Purpose, legacy, and significance beyond success.',
  },
  {
    id: 'pastor',
    name: 'Pastor',
    accent: '#B4737B',
    description: 'Church systems, marriage, and sustainable ministry.',
  },
]

const FOCUS_OPTIONS = [
  'Breaking generational patterns',
  'Healing from my past',
  'Finding my purpose',
  'Marriage & family',
  'Leading with clarity',
  'Daily consistency',
]

const RHYTHMS = [
  { id: 'morning', label: 'Morning · 6–9 AM', note: 'Start the day grounded' },
  { id: 'midday', label: 'Midday · 12–2 PM', note: 'A reset between meetings' },
  { id: 'evening', label: 'Evening · 8–10 PM', note: 'Reflect before rest' },
]

// Decorative QR-style pixel grid (29x29), not a real scannable code.
const QR_GRID = [
  '11111110101111000001001111111',
  '10000010110001110010001000001',
  '10111010111001000100001011101',
  '10111010010111101010001011101',
  '10111010100000100111001011101',
  '10000010111000110100001000001',
  '11111110000001000100001111111',
  '00000000101010110000000000000',
  '00011101110011011100001010000',
  '01011110000000110101100011011',
  '00000010000010101010000111001',
  '11000101111100000111110110000',
  '01001000011001011100000001100',
  '00101101010101011100000010010',
  '00001110111100111010111011001',
  '01010110011111110101010000010',
  '00000001110000100100110110101',
  '10100110101100001101001011111',
  '10100000010111100110100001101',
  '11001100111100011110000111001',
  '00000000101110000100011110010',
  '00000000000000000000100101011',
  '11111110011101011110000110000',
  '10000010011110001101110101111',
  '10111010001111111110101010010',
  '10111010100101100001000011110',
  '10111010100111001110110001000',
  '10000010000001101010001001001',
  '11111110110001010110000010000',
]

function QrCode() {
  const cell = 1
  return (
    <svg width="92" height="92" viewBox="0 0 29 29" xmlns="http://www.w3.org/2000/svg">
      {QR_GRID.flatMap((row, r) =>
        row
          .split('')
          .map((bit, c) =>
            bit === '1' ? (
              <rect key={`${r}-${c}`} x={c} y={r} width={cell} height={cell} fill="#171C10" />
            ) : null
          )
      )}
    </svg>
  )
}

function TierCard({ tier, selected, onSelect }) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className="cursor-pointer rounded-[14px] px-[22px] py-[18px] text-left font-sans"
      style={{
        border: `1px solid ${selected ? tier.accent : 'rgba(240,238,229,0.12)'}`,
        background: selected ? 'rgba(194,160,100,0.07)' : 'rgba(240,238,229,0.03)',
        boxShadow: selected ? `0 0 0 1px ${tier.accent}` : 'none',
      }}
    >
      <span
        className="mb-[3px] block text-base font-bold uppercase tracking-[0.06em]"
        style={{ color: tier.accent }}
      >
        {tier.name}
      </span>
      <span className="block font-serif text-sm text-cream/65">{tier.description}</span>
    </button>
  )
}

function FocusChip({ label, selected, onToggle }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="cursor-pointer rounded-full px-5 py-[11px] font-sans text-[12.5px] font-semibold uppercase tracking-[0.08em]"
      style={{
        border: `1px solid ${selected ? '#C2A064' : 'rgba(240,238,229,0.16)'}`,
        background: selected ? '#C2A064' : 'transparent',
        color: selected ? '#171C10' : 'rgba(240,238,229,0.7)',
      }}
    >
      {label}
    </button>
  )
}

function RhythmCard({ rhythm, selected, onSelect }) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className="flex cursor-pointer items-baseline justify-between rounded-[14px] px-[22px] py-[18px] text-left font-sans"
      style={{
        border: `1px solid ${selected ? '#C2A064' : 'rgba(240,238,229,0.12)'}`,
        background: selected ? 'rgba(194,160,100,0.07)' : 'rgba(240,238,229,0.03)',
        boxShadow: selected ? '0 0 0 1px #C2A064' : 'none',
      }}
    >
      <span className="text-[15px] font-bold uppercase tracking-[0.06em] text-white">
        {rhythm.label}
      </span>
      <span className="font-serif text-[13.5px] text-cream/60">{rhythm.note}</span>
    </button>
  )
}

export default function Onboarding() {
  const [searchParams] = useSearchParams()
  const tierParam = searchParams.get('tier')
  const hasValidTierParam = TIERS.some((t) => t.id === tierParam)

  const [step, setStep] = useState(hasValidTierParam ? 2 : 1)
  const [tier, setTier] = useState(hasValidTierParam ? tierParam : 'disciple')
  const [rhythm, setRhythm] = useState('morning')
  const [picked, setPicked] = useState([
    'Breaking generational patterns',
    'Healing from my past',
  ])

  const next = () => setStep((s) => Math.min(5, s + 1))
  const back = () => setStep((s) => Math.max(1, s - 1))

  const togglePicked = (option) => {
    setPicked((prev) =>
      prev.includes(option) ? prev.filter((p) => p !== option) : [...prev, option]
    )
  }

  return (
    <div className="min-h-screen bg-ink font-sans text-cream">
      <header className="flex h-[70px] items-center justify-between border-b border-cream/[0.07] px-8">
        <img src={logo} alt="Convergence MVMNT" className="block h-11 w-auto" />
        <Link
          to="/dashboard"
          className="text-xs font-semibold uppercase tracking-[0.12em] text-cream/55 no-underline"
        >
          Skip for now →
        </Link>
      </header>

      <div className="mx-auto w-full max-w-[560px] px-6 pt-10">
        <div className="mb-2.5 flex items-center justify-between">
          <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gold">
            Step {step} of 5
          </span>
          <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-cream/40">
            {STEP_NAMES[step - 1]}
          </span>
        </div>
        <div className="flex gap-1.5">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className={`h-[5px] flex-1 rounded-full ${i <= step ? 'bg-gold' : 'bg-cream/[0.12]'}`}
            />
          ))}
        </div>
      </div>

      <main className="mx-auto w-full max-w-[560px] px-6 pb-16 pt-9">
        {step === 1 && (
          <div>
            <h1 className="mb-3 text-[34px] font-bold uppercase leading-[1.02] text-white">
              Welcome to the movement
            </h1>
            <p className="mb-[30px] font-serif text-[16.5px] leading-[1.6] text-cream/72">
              Let&rsquo;s set up your experience. First — confirm your membership path.
            </p>
            <div className="flex flex-col gap-3">
              {TIERS.map((t) => (
                <TierCard key={t.id} tier={t} selected={tier === t.id} onSelect={() => setTier(t.id)} />
              ))}
            </div>
          </div>
        )}

        {step === 2 && (
          <div>
            <h1 className="mb-3 text-[34px] font-bold uppercase leading-[1.02] text-white">
              What brings you here?
            </h1>
            <p className="mb-[30px] font-serif text-[16.5px] leading-[1.6] text-cream/72">
              Pick everything that applies. This shapes your daily content.
            </p>
            <div className="flex flex-wrap gap-2.5">
              {FOCUS_OPTIONS.map((option) => (
                <FocusChip
                  key={option}
                  label={option}
                  selected={picked.includes(option)}
                  onToggle={() => togglePicked(option)}
                />
              ))}
            </div>
          </div>
        )}

        {step === 3 && (
          <div>
            <h1 className="mb-3 text-[34px] font-bold uppercase leading-[1.02] text-white">
              Set your daily rhythm
            </h1>
            <p className="mb-[30px] font-serif text-[16.5px] leading-[1.6] text-cream/72">
              When should we nudge you with your 3-minute daily reset?
            </p>
            <div className="flex flex-col gap-3">
              {RHYTHMS.map((r) => (
                <RhythmCard
                  key={r.id}
                  rhythm={r}
                  selected={rhythm === r.id}
                  onSelect={() => setRhythm(r.id)}
                />
              ))}
            </div>
          </div>
        )}

        {step === 4 && (
          <div>
            <h1 className="mb-3 text-[34px] font-bold uppercase leading-[1.02] text-white">
              Set up your profile
            </h1>
            <p className="mb-[30px] font-serif text-[16.5px] leading-[1.6] text-cream/72">
              This is how the community sees you.
            </p>
            <div className="mb-6 flex items-center gap-[18px]">
              <div className="flex h-[72px] w-[72px] shrink-0 items-center justify-center rounded-full border border-dashed border-gold/50 bg-gold/[0.14] text-gold">
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3z" />
                  <circle cx="12" cy="13" r="3" />
                </svg>
              </div>
              <button
                type="button"
                className="cursor-pointer rounded-full border border-cream/[0.22] bg-transparent px-5 py-[10px] font-sans text-[11.5px] font-semibold uppercase tracking-[0.12em] text-cream"
              >
                Upload photo
              </button>
            </div>
            <div className="flex flex-col gap-3.5">
              <div>
                <label className="mb-[7px] block text-[11px] font-semibold uppercase tracking-[0.16em] text-cream/50">
                  Display name
                </label>
                <input
                  type="text"
                  placeholder="Sarah Mitchell"
                  className="w-full rounded-[10px] border border-cream/[0.14] bg-cream/[0.04] px-4 py-[13px] font-serif text-[15px] text-cream outline-none"
                />
              </div>
              <div>
                <label className="mb-[7px] block text-[11px] font-semibold uppercase tracking-[0.16em] text-cream/50">
                  City (optional)
                </label>
                <input
                  type="text"
                  placeholder="Long Island, NY"
                  className="w-full rounded-[10px] border border-cream/[0.14] bg-cream/[0.04] px-4 py-[13px] font-serif text-[15px] text-cream outline-none"
                />
              </div>
              <div>
                <label className="mb-[7px] block text-[11px] font-semibold uppercase tracking-[0.16em] text-cream/50">
                  One line about you (optional)
                </label>
                <input
                  type="text"
                  placeholder="Breaking patterns, building legacy."
                  className="w-full rounded-[10px] border border-cream/[0.14] bg-cream/[0.04] px-4 py-[13px] font-serif text-[15px] text-cream outline-none"
                />
              </div>
            </div>
          </div>
        )}

        {step === 5 && (
          <div className="text-center">
            <div className="mx-auto mb-[22px] flex h-[74px] w-[74px] items-center justify-center rounded-[20px] border border-gold/35 bg-gold/[0.13]">
              <svg
                width="32"
                height="32"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#C2A064"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="5" y="2" width="14" height="20" rx="2" />
                <path d="M12 18h.01" />
              </svg>
            </div>
            <h1 className="mb-3 text-[34px] font-bold uppercase leading-[1.02] text-white">
              You&rsquo;re in, Sarah
            </h1>
            <p className="mx-auto mb-[30px] max-w-[420px] font-serif text-[16.5px] leading-[1.6] text-cream/72">
              Get the app to keep your streak alive — your daily reset takes 3 minutes, wherever you
              are.
            </p>
            <div className="mb-[26px] flex justify-center gap-3">
              <span className="inline-flex cursor-pointer items-center gap-[9px] rounded-full border border-cream/25 px-6 py-[13px] text-xs font-semibold uppercase tracking-[0.1em]">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
                </svg>
                App Store
              </span>
              <span className="inline-flex cursor-pointer items-center gap-[9px] rounded-full border border-cream/25 px-6 py-[13px] text-xs font-semibold uppercase tracking-[0.1em]">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M3 20.5v-17c0-.59.34-1.11.84-1.35L13.69 12l-9.85 9.85c-.5-.25-.84-.76-.84-1.35m13.81-5.38L6.05 21.34l8.49-8.49zm3.35-4.31c.34.27.59.68.59 1.19s-.22.9-.57 1.18l-2.29 1.32-2.5-2.5 2.5-2.5zM6.05 2.66l10.76 6.22-2.27 2.27z" />
                </svg>
                Google Play
              </span>
            </div>
            <div className="inline-block rounded-[14px] bg-cream-solid p-3.5">
              <QrCode />
            </div>
            <div className="mt-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-cream/45">
              Scan to download
            </div>
          </div>
        )}

        <div className="mt-[38px] flex items-center justify-between">
          {step > 1 ? (
            <button
              type="button"
              onClick={back}
              className="flex cursor-pointer items-center gap-2 border-none bg-transparent font-sans text-xs font-semibold uppercase tracking-[0.12em] text-cream/55"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="m15 18-6-6 6-6" />
              </svg>
              Back
            </button>
          ) : (
            <span />
          )}

          {step < 5 ? (
            <button
              type="button"
              onClick={next}
              className="flex cursor-pointer items-center gap-2.5 rounded-full border-none bg-gold px-8 py-3.5 font-sans text-[13px] font-semibold uppercase tracking-[0.12em] text-ink"
            >
              Continue
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="m9 18 6-6-6-6" />
              </svg>
            </button>
          ) : (
            <Link
              to="/dashboard"
              className="flex items-center gap-2.5 rounded-full bg-gold px-8 py-3.5 font-sans text-[13px] font-semibold uppercase tracking-[0.12em] text-ink no-underline"
            >
              Go to my dashboard
            </Link>
          )}
        </div>
      </main>
    </div>
  )
}
