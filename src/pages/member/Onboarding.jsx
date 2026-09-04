import { Link } from 'react-router-dom'
import logo from '../../assets/images/convergence-mvmnt.png'
import { useOnboardingSession, TOTAL_STEPS, LOGIN_STEP, PROFILE_STEP } from './useOnboardingSession'
import CreateLoginStep from './CreateLoginStep'
import ProfileStep from './ProfileStep'

const STEP_NAMES = [
  'Your focus',
  'Daily rhythm',
  'Create your login',
  'Profile',
  'Get the app',
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
  const { step, tier, rhythm, setRhythm, picked, togglePicked, next, back } =
    useOnboardingSession()

  return (
    <div className="min-h-screen bg-ink font-sans text-cream">
      <header className="flex h-[70px] items-center justify-between border-b border-cream/[0.07] px-8">
        <Link to="/" className="block">
          <img src={logo} alt="Convergence MVMNT" className="block h-11 w-auto" />
        </Link>
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
            Step {step} of {TOTAL_STEPS}
          </span>
          <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-cream/40">
            {STEP_NAMES[step - 1]}
          </span>
        </div>
        <div className="flex gap-1.5">
          {Array.from({ length: TOTAL_STEPS }, (_, i) => i + 1).map((i) => (
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
              What brings you here?
            </h1>
            <p className="mb-[30px] font-serif text-[16.5px] leading-[1.6] text-cream/[72%]">
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

        {step === 2 && (
          <div>
            <h1 className="mb-3 text-[34px] font-bold uppercase leading-[1.02] text-white">
              Set your daily rhythm
            </h1>
            <p className="mb-[30px] font-serif text-[16.5px] leading-[1.6] text-cream/[72%]">
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

        {step === LOGIN_STEP && <CreateLoginStep tier={tier} rhythm={rhythm} picked={picked} onBack={back} />}

        {step === PROFILE_STEP && <ProfileStep onBack={back} onNext={next} />}

        {step === TOTAL_STEPS && (
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
            <p className="mx-auto mb-[30px] max-w-[420px] font-serif text-[16.5px] leading-[1.6] text-cream/[72%]">
              Keep your streak alive — your daily reset takes 3 minutes, wherever you are.
            </p>
          </div>
        )}

        {/* "Create your login" and "Set up your profile" render their own Back/Continue
            (submitting IS the continue action), so the generic footer is skipped for those. */}
        {step !== LOGIN_STEP && step !== PROFILE_STEP && (
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

            {step < TOTAL_STEPS ? (
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
        )}
      </main>
    </div>
  )
}
