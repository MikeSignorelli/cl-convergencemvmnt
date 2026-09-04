import { useEffect, useState } from 'react'
import MemberSidebar from '../../components/MemberSidebar'
import MemberTopbar from '../../components/MemberTopbar'
import { fetchAppSettings, saveAppSetting, SETTING_KEYS } from '../../lib/appSettings'

const FIELDS = [
  {
    key: SETTING_KEYS.MEMBERSHIP_PRICE_DISPLAY,
    label: 'Membership price (display only)',
    hint: 'Shown across the site. Changing this does not change the actual Stripe price — update that separately.',
    multiline: false,
  },
  {
    key: SETTING_KEYS.SUBSCRIPTION_TERMS,
    label: 'Subscription terms',
    hint: 'Shown wherever membership terms are displayed to customers.',
    multiline: true,
  },
  {
    key: SETTING_KEYS.SUPPORT_EMAIL,
    label: 'Support email',
    hint: 'Shown to members who need help.',
    multiline: false,
  },
  {
    key: SETTING_KEYS.WELCOME_EMAIL_MESSAGE,
    label: 'Welcome email message',
    hint: 'The opening line new members see after completing signup.',
    multiline: true,
  },
]

export default function AdminSettings() {
  const [values, setValues] = useState({})
  const [loading, setLoading] = useState(true)
  const [savingKey, setSavingKey] = useState('')
  const [error, setError] = useState('')
  const [savedKey, setSavedKey] = useState('')

  useEffect(() => {
    let cancelled = false
    fetchAppSettings()
      .then((settings) => {
        if (!cancelled) setValues(settings)
      })
      .catch((err) => setError(err.message))
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  async function handleSave(key) {
    setSavingKey(key)
    setError('')
    setSavedKey('')
    try {
      await saveAppSetting(key, values[key])
      setSavedKey(key)
    } catch (err) {
      setError(err.message || 'Could not save.')
    } finally {
      setSavingKey('')
    }
  }

  return (
    <div className="flex min-h-screen bg-ink font-sans text-cream">
      <MemberSidebar active="/admin/settings" />
      <div className="flex flex-1 flex-col min-w-0">
        <MemberTopbar />
        <main className="mx-auto w-full max-w-[680px] flex-1 px-8 pb-16 pt-9">
          <h1 className="mb-1 font-sans text-[28px] font-bold uppercase leading-[1.05] text-white">
            Settings
          </h1>
          <p className="mb-8 font-serif text-[15px] text-cream/60">
            System-wide text shown to members.
          </p>

          {loading ? (
            <p className="font-serif text-cream/50">Loading…</p>
          ) : (
            <div className="flex flex-col gap-6">
              {error && <p className="font-serif text-[13px] text-[#D8888A]">{error}</p>}
              {FIELDS.map((field) => (
                <div
                  key={field.key}
                  className="rounded-cv-lg border border-cream/[0.09] bg-[rgb(30,36,22)] px-6 py-5"
                >
                  <label className="mb-1.5 block font-sans text-[13px] font-semibold uppercase tracking-[0.08em] text-cream">
                    {field.label}
                  </label>
                  <p className="mb-3 font-serif text-[12.5px] text-cream/50">{field.hint}</p>
                  {field.multiline ? (
                    <textarea
                      value={values[field.key] || ''}
                      onChange={(e) => setValues((v) => ({ ...v, [field.key]: e.target.value }))}
                      rows={3}
                      className="mb-3 w-full resize-none rounded-[10px] border border-cream/[0.14] bg-cream/[0.04] px-4 py-[13px] font-serif text-[14px] text-cream outline-none"
                    />
                  ) : (
                    <input
                      type="text"
                      value={values[field.key] || ''}
                      onChange={(e) => setValues((v) => ({ ...v, [field.key]: e.target.value }))}
                      className="mb-3 w-full rounded-[10px] border border-cream/[0.14] bg-cream/[0.04] px-4 py-[13px] font-serif text-[14px] text-cream outline-none"
                    />
                  )}
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => handleSave(field.key)}
                      disabled={savingKey === field.key}
                      className="cursor-pointer rounded-full bg-gold px-5 py-2 font-sans text-[11.5px] font-semibold uppercase tracking-[0.08em] text-ink disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {savingKey === field.key ? 'Saving…' : 'Save'}
                    </button>
                    {savedKey === field.key && (
                      <span className="font-serif text-[12.5px] text-[#9BC08A]">Saved</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
