import { useState, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTier } from '../context/TierContext'
import { TIER_ACCENT, TIER_SOFT } from '../data/tiers'
import Logo from '../components/Logo'

const STEP_NAMES = { 1: 'Your path', 2: 'Your focus', 3: 'Daily rhythm', 4: 'Profile', 5: 'Get the app' }

const FOCUS_CHIPS = [
  'Breaking generational patterns',
  'Healing from my past',
  'Finding my purpose',
  'Marriage & family',
  'Leading with clarity',
  'Daily consistency',
]

const RHYTHMS = [
  { key: 'morning', label: 'Morning · 6–9 AM',   sub: 'Start the day grounded' },
  { key: 'midday',  label: 'Midday · 12–2 PM',   sub: 'A reset between meetings' },
  { key: 'evening', label: 'Evening · 8–10 PM',  sub: 'Reflect before rest' },
]

/* ─── Progress bar ────────────────────────────────────────── */
function ProgressBar({ step }) {
  return (
    <div className="max-w-[560px] w-full mx-auto px-6 pt-10 pb-0">
      <div className="flex items-center justify-between mb-2.5">
        <span className="font-sans font-semibold text-[11px] tracking-[0.18em] uppercase text-cv-gold">
          Step {step} of 5
        </span>
        <span className="font-sans font-semibold text-[11px] tracking-[0.12em] uppercase text-cv-text/40">
          {STEP_NAMES[step]}
        </span>
      </div>
      <div className="flex gap-1.5">
        {[1, 2, 3, 4, 5].map((n) => (
          <div
            key={n}
            className="flex-1 h-[5px] rounded-full transition-colors duration-300"
            style={{ background: n <= step ? '#C2A064' : 'rgba(240,238,229,0.12)' }}
          />
        ))}
      </div>
    </div>
  )
}

/* ─── Step 1: Your path ─────────────────────────────────── */
function StepPath({ selected, onSelect }) {
  const tiers = [
    { key: 'disciple', label: 'Disciple', desc: 'Freedom, healing, and breaking generational patterns.' },
    { key: 'leader',   label: 'Leader',   desc: 'Purpose, legacy, and significance beyond success.' },
    { key: 'pastor',   label: 'Pastor',   desc: 'Church systems, marriage, and sustainable ministry.' },
  ]
  return (
    <div>
      <h1 className="font-sans font-bold text-[34px] leading-[1.02] uppercase text-white m-0 mb-3">
        Welcome to the movement
      </h1>
      <p className="font-serif text-[16.5px] leading-relaxed text-cv-text/72 m-0 mb-8">
        Let's set up your experience. First — confirm your membership path.
      </p>
      <div className="flex flex-col gap-3" role="radiogroup" aria-label="Membership path">
        {tiers.map(({ key, label, desc }) => {
          const on  = selected === key
          const acc = TIER_ACCENT[key]
          const sft = TIER_SOFT[key]
          return (
            <button
              key={key}
              role="radio"
              aria-checked={on}
              onClick={() => onSelect(key)}
              className="cursor-pointer text-left p-[18px_22px] rounded-cv border font-sans text-cv-text w-full transition-all"
              style={{
                border:     `1px solid ${on ? acc : 'rgba(240,238,229,0.12)'}`,
                background: on ? sft : 'rgba(240,238,229,0.03)',
                boxShadow:  on ? `0 0 0 1px ${acc}` : 'none',
              }}
            >
              <span className="block font-bold text-[16px] tracking-[0.06em] uppercase mb-1" style={{ color: acc }}>
                {label}
              </span>
              <span className="block font-serif text-[14px] text-cv-text/65">{desc}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

/* ─── Step 2: Your focus ────────────────────────────────── */
function StepFocus({ picked, onToggle }) {
  return (
    <div>
      <h1 className="font-sans font-bold text-[34px] leading-[1.02] uppercase text-white m-0 mb-3">
        What brings you here?
      </h1>
      <p className="font-serif text-[16.5px] leading-relaxed text-cv-text/72 m-0 mb-8">
        Pick everything that applies. This shapes your daily content.
      </p>
      <div className="flex flex-wrap gap-2.5" role="group" aria-label="Focus areas">
        {FOCUS_CHIPS.map((chip) => {
          const on = picked.includes(chip)
          return (
            <button
              key={chip}
              onClick={() => onToggle(chip)}
              aria-pressed={on}
              className="cursor-pointer px-5 py-[11px] rounded-full font-sans font-semibold text-[12.5px] tracking-[0.08em] uppercase border transition-all"
              style={
                on
                  ? { border: '1px solid #C2A064', background: '#C2A064', color: '#171C10' }
                  : { border: '1px solid rgba(240,238,229,0.16)', background: 'transparent', color: 'rgba(240,238,229,0.7)' }
              }
            >
              {chip}
            </button>
          )
        })}
      </div>
    </div>
  )
}

/* ─── Step 3: Daily rhythm ──────────────────────────────── */
function StepRhythm({ selected, onSelect }) {
  return (
    <div>
      <h1 className="font-sans font-bold text-[34px] leading-[1.02] uppercase text-white m-0 mb-3">
        Set your daily rhythm
      </h1>
      <p className="font-serif text-[16.5px] leading-relaxed text-cv-text/72 m-0 mb-8">
        When should we nudge you with your 3-minute daily reset?
      </p>
      <div className="flex flex-col gap-3" role="radiogroup" aria-label="Daily rhythm">
        {RHYTHMS.map(({ key, label, sub }) => {
          const on = selected === key
          return (
            <button
              key={key}
              role="radio"
              aria-checked={on}
              onClick={() => onSelect(key)}
              className="cursor-pointer text-left p-[16px_22px] rounded-cv font-sans text-cv-text w-full flex justify-between items-baseline gap-4 border transition-all"
              style={{
                border:     `1px solid ${on ? '#C2A064' : 'rgba(240,238,229,0.12)'}`,
                background: on ? 'rgba(194,160,100,0.07)' : 'rgba(240,238,229,0.03)',
                boxShadow:  on ? '0 0 0 1px #C2A064' : 'none',
              }}
            >
              <span className="font-bold text-[15px] tracking-[0.06em] uppercase">{label}</span>
              <span className="font-serif text-[13.5px] text-cv-text/60">{sub}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

/* ─── Step 4: Profile ───────────────────────────────────── */
function StepProfile({ photoSrc, onPhotoChange, name, setName, city, setCity, bio, setBio }) {
  const fileRef = useRef()
  return (
    <div>
      <h1 className="font-sans font-bold text-[34px] leading-[1.02] uppercase text-white m-0 mb-3">
        Set up your profile
      </h1>
      <p className="font-serif text-[16.5px] leading-relaxed text-cv-text/72 m-0 mb-8">
        This is how the community sees you.
      </p>
      {/* Photo upload */}
      <div className="flex items-center gap-[18px] mb-6">
        <button
          type="button"
          onClick={() => fileRef.current.click()}
          className="w-[72px] h-[72px] rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden cursor-pointer border border-dashed border-cv-gold/50 bg-cv-gold/[0.14] text-cv-gold hover:brightness-110 transition-all p-0"
          aria-label="Upload profile photo"
        >
          {photoSrc ? (
            <img src={photoSrc} alt="Profile" className="w-full h-full object-cover" />
          ) : (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3z" />
              <circle cx="12" cy="13" r="3" />
            </svg>
          )}
        </button>
        <button
          type="button"
          onClick={() => fileRef.current.click()}
          className="cursor-pointer px-5 py-2.5 rounded-full border border-white/22 bg-transparent text-cv-text font-sans font-semibold text-[11.5px] tracking-[0.12em] uppercase hover:border-white/40 transition-colors"
        >
          Upload photo
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={onPhotoChange}
          aria-label="Choose profile photo file"
        />
      </div>
      {/* Fields */}
      <div className="flex flex-col gap-3.5">
        {[
          { id: 'input-name', label: 'Display name',              placeholder: 'Sarah Mitchell', value: name, set: setName, type: 'text', max: undefined },
          { id: 'input-city', label: 'City (optional)',            placeholder: 'Long Island, NY', value: city, set: setCity, type: 'text', max: undefined },
          { id: 'input-bio',  label: 'One line about you (optional)', placeholder: 'Breaking patterns, building legacy.', value: bio, set: setBio, type: 'text', max: 120 },
        ].map(({ id, label, placeholder, value, set, type, max }) => (
          <div key={id}>
            <label
              htmlFor={id}
              className="block font-sans font-semibold text-[11px] tracking-[0.16em] uppercase text-cv-text/50 mb-1.5"
            >
              {label}
            </label>
            <input
              id={id}
              type={type}
              placeholder={placeholder}
              value={value}
              maxLength={max}
              autoComplete={id === 'input-name' ? 'name' : id === 'input-city' ? 'address-level2' : 'off'}
              onChange={(e) => set(e.target.value)}
              className="w-full px-4 py-3 rounded-[10px] border border-white/14 bg-white/[0.04] text-cv-text font-serif text-[15px] transition-colors"
            />
          </div>
        ))}
      </div>
    </div>
  )
}

/* ─── Step 5: Get the app ───────────────────────────────── */
function StepApp({ firstName }) {
  return (
    <div className="text-center">
      <div className="w-[74px] h-[74px] rounded-[20px] bg-cv-gold/[0.13] border border-cv-gold/35 flex items-center justify-center mx-auto mb-[22px]" aria-hidden="true">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#C2A064" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="5" y="2" width="14" height="20" rx="2" />
          <path d="M12 18h.01" />
        </svg>
      </div>
      <h1 className="font-sans font-bold text-[34px] leading-[1.02] uppercase text-white m-0 mb-3">
        {firstName ? `You're in, ${firstName}` : "You're in"}
      </h1>
      <p className="font-serif text-[16.5px] leading-relaxed text-cv-text/72 max-w-[420px] mx-auto m-0 mb-8">
        Get the app to keep your streak alive — your daily reset takes 3 minutes, wherever you are.
      </p>
      <div className="flex gap-3 justify-center mb-6 flex-wrap">
        <button className="cursor-pointer inline-flex items-center gap-2 px-6 py-3 rounded-full border border-white/25 bg-transparent text-cv-text font-sans font-semibold text-[12px] tracking-[0.1em] uppercase hover:border-white/40 transition-colors" aria-label="Download on the App Store">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/></svg>
          App Store
        </button>
        <button className="cursor-pointer inline-flex items-center gap-2 px-6 py-3 rounded-full border border-white/25 bg-transparent text-cv-text font-sans font-semibold text-[12px] tracking-[0.1em] uppercase hover:border-white/40 transition-colors" aria-label="Get it on Google Play">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M3 20.5v-17c0-.59.34-1.11.84-1.35L13.69 12l-9.85 9.85c-.5-.25-.84-.76-.84-1.35m13.81-5.38L6.05 21.34l8.49-8.49zm3.35-4.31c.34.27.59.68.59 1.19s-.22.9-.57 1.18l-2.29 1.32-2.5-2.5 2.5-2.5zM6.05 2.66l10.76 6.22-2.27 2.27z"/></svg>
          Google Play
        </button>
      </div>
      {/* QR code */}
      <div className="inline-block p-3.5 rounded-[14px] bg-cv-text" aria-label="QR code to download the app">
        <svg width="92" height="92" viewBox="0 0 29 29" fill="#171C10" aria-hidden="true">
          <path d="M0 0h7v7H0zM2 2v3h3V2zM9 0h2v2H9zM13 0h2v2h-2zM11 2h2v2h-2zM9 4h2v3H9zM13 4h2v2h-2zM22 0h7v7h-7zM24 2v3h3V2zM0 9h2v2H0zM4 9h3v2H4zM9 9h2v2H9zM13 9h2v4h-2zM17 9h3v2h-3zM22 9h2v2h-2zM26 9h3v2h-3zM2 11h2v2H2zM6 11h3v2H6zM11 11h2v2h-2zM17 12h2v2h-2zM22 11h2v3h-2zM26 12h2v2h-2zM0 13h2v3H0zM4 14h3v2H4zM9 14h2v2H9zM13 15h2v2h-2zM19 14h2v2h-2zM24 14h3v2h-3zM0 18h2v2H0zM4 18h2v2H4zM9 18h4v2H9zM15 18h2v2h-2zM19 18h3v2h-3zM24 18h2v2h-2zM27 18h2v2h-2zM0 22h7v7H0zM2 24v3h3V24zM9 22h2v2H9zM13 22h2v3h-2zM17 22h3v2h-3zM22 22h2v2h-2zM26 22h3v3h-3zM9 26h3v3H9zM15 26h2v3h-2zM19 25h2v4h-2zM23 26h2v3h-2z"/>
        </svg>
      </div>
      <div className="font-sans font-semibold text-[11px] tracking-[0.14em] uppercase text-cv-text/45 mt-3">
        Scan to download
      </div>
    </div>
  )
}

/* ─── Main Onboarding page ──────────────────────────────── */
export default function Onboarding() {
  const { tier: ctxTier, setTier } = useTier()
  const navigate = useNavigate()

  const [step, setStep]         = useState(1)
  const [tier, setLocalTier]    = useState(ctxTier)
  const [rhythm, setRhythm]     = useState('morning')
  const [picked, setPicked]     = useState(['Breaking generational patterns', 'Healing from my past'])
  const [photoSrc, setPhotoSrc] = useState('')
  const [name, setName]         = useState('')
  const [city, setCity]         = useState('')
  const [bio, setBio]           = useState('')

  function selectTier(t) {
    setLocalTier(t)
    setTier(t)
  }

  function toggleChip(chip) {
    setPicked((prev) =>
      prev.includes(chip) ? prev.filter((c) => c !== chip) : [...prev, chip]
    )
  }

  function handlePhotoChange(e) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => setPhotoSrc(ev.target.result)
    reader.readAsDataURL(file)
  }

  function goNext() {
    if (step < 5) { setStep(step + 1); window.scrollTo({ top: 0, behavior: 'smooth' }) }
  }
  function goBack() {
    if (step > 1) { setStep(step - 1); window.scrollTo({ top: 0, behavior: 'smooth' }) }
  }

  const firstName = name.trim().split(' ')[0] || ''

  return (
    <div className="min-h-screen bg-cv-bg text-cv-text font-sans antialiased flex flex-col">
      {/* Header */}
      <header className="h-[70px] flex items-center justify-between px-8 border-b border-white/[0.07] flex-shrink-0">
        <Link to="/" aria-label="Convergence MVMNT Home" className="no-underline">
          <Logo height={38} />
        </Link>
        <Link
          to="/dashboard"
          className="font-sans font-semibold text-[12px] tracking-[0.12em] uppercase text-cv-text/55 no-underline hover:text-cv-text transition-colors"
        >
          Skip for now →
        </Link>
      </header>

      {/* Progress */}
      <ProgressBar step={step} />

      {/* Content */}
      <main className="flex-1 flex items-start justify-center px-6 pt-11 pb-16">
        <div className="max-w-[560px] w-full">
          {step === 1 && <StepPath selected={tier} onSelect={selectTier} />}
          {step === 2 && <StepFocus picked={picked} onToggle={toggleChip} />}
          {step === 3 && <StepRhythm selected={rhythm} onSelect={setRhythm} />}
          {step === 4 && (
            <StepProfile
              photoSrc={photoSrc}
              onPhotoChange={handlePhotoChange}
              name={name} setName={setName}
              city={city} setCity={setCity}
              bio={bio}   setBio={setBio}
            />
          )}
          {step === 5 && <StepApp firstName={firstName} />}

          {/* Navigation */}
          <div className="flex items-center justify-between mt-[38px]">
            <button
              onClick={goBack}
              className="flex items-center gap-2 bg-transparent border-none cursor-pointer font-sans font-semibold text-[12px] tracking-[0.12em] uppercase text-cv-text/55 p-0 hover:text-cv-text transition-colors"
              style={{ visibility: step === 1 ? 'hidden' : 'visible' }}
              aria-label="Go to previous step"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="m15 18-6-6 6-6" />
              </svg>
              Back
            </button>

            {step < 5 ? (
              <button
                onClick={goNext}
                className="flex items-center gap-2.5 px-8 py-3.5 rounded-full border-none bg-cv-gold text-cv-bg font-sans font-semibold text-[13px] tracking-[0.12em] uppercase cursor-pointer hover:brightness-110 transition-all"
                aria-label="Continue to next step"
              >
                Continue
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="m9 18 6-6-6-6" />
                </svg>
              </button>
            ) : (
              <Link
                to="/dashboard"
                className="flex items-center gap-2.5 px-8 py-3.5 rounded-full bg-cv-gold text-cv-bg font-sans font-semibold text-[13px] tracking-[0.12em] uppercase no-underline hover:brightness-110 transition-all"
                aria-label="Go to my dashboard"
              >
                Go to my dashboard
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="m9 18 6-6-6-6" />
                </svg>
              </Link>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
