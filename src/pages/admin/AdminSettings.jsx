import { useEffect, useState } from 'react'
import MemberSidebar from '../../components/MemberSidebar'
import MemberTopbar from '../../components/MemberTopbar'
import { useAuth } from '../../lib/AuthContext'
import { supabase } from '../../lib/supabaseClient'
import { isCommonPassword } from '../../lib/commonPasswords'
import { fetchAppSettings, saveAppSetting, SETTING_KEYS } from '../../lib/appSettings'
import { listCategories, createCategory, renameCategory, reorderCategories, deleteCategory } from '../../lib/courseCategories'
import { fetchStripeSettings, saveStripeSettings } from '../../lib/paymentSettings'
import { fetchZoomSettings, saveZoomSettings } from '../../lib/zoomSettings'

const MIN_PASSWORD_LENGTH = 12

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

function PasswordCard() {
  const { session } = useAuth()
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSuccess(false)

    if (!currentPassword) {
      setError('Enter your current password.')
      return
    }
    if (newPassword.length < MIN_PASSWORD_LENGTH) {
      setError(`New password must be at least ${MIN_PASSWORD_LENGTH} characters.`)
      return
    }
    if (isCommonPassword(newPassword)) {
      setError('That password is too common — please choose another.')
      return
    }
    if (newPassword !== confirm) {
      setError('New passwords don’t match.')
      return
    }

    setSubmitting(true)
    try {
      // Supabase has no direct "verify current password" call — the
      // standard way is to re-authenticate with it. A wrong current
      // password fails here with an auth error before anything changes.
      const { error: verifyError } = await supabase.auth.signInWithPassword({
        email: session?.user?.email,
        password: currentPassword,
      })
      if (verifyError) {
        setError('Current password is incorrect.')
        setSubmitting(false)
        return
      }

      const { error: updateError } = await supabase.auth.updateUser({ password: newPassword })
      if (updateError) throw updateError

      setSuccess(true)
      setCurrentPassword('')
      setNewPassword('')
      setConfirm('')
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="rounded-cv-lg border border-cream/[0.09] bg-[rgb(30,36,22)] px-6 py-5">
      <label className="mb-1.5 block font-sans text-[13px] font-semibold uppercase tracking-[0.08em] text-cream">
        Password
      </label>
      <p className="mb-4 font-serif text-[12.5px] text-cream/50">
        Update the password for {session?.user?.email}.
      </p>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3.5" noValidate>
        <input
          type="password"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          autoComplete="current-password"
          placeholder="Current password"
          className="w-full rounded-[10px] border border-cream/[0.14] bg-cream/[0.04] px-4 py-[13px] font-serif text-[14px] text-cream outline-none"
        />
        <input
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          autoComplete="new-password"
          placeholder={`New password — at least ${MIN_PASSWORD_LENGTH} characters`}
          className="w-full rounded-[10px] border border-cream/[0.14] bg-cream/[0.04] px-4 py-[13px] font-serif text-[14px] text-cream outline-none"
        />
        <input
          type="password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          autoComplete="new-password"
          placeholder="Confirm new password"
          className="w-full rounded-[10px] border border-cream/[0.14] bg-cream/[0.04] px-4 py-[13px] font-serif text-[14px] text-cream outline-none"
        />

        {error && <p className="font-serif text-[13px] text-[#D8888A]">{error}</p>}
        {success && <p className="font-serif text-[13px] text-[#9BC08A]">Password updated successfully.</p>}

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={submitting}
            className="cursor-pointer rounded-full bg-gold px-5 py-2 font-sans text-[11.5px] font-semibold uppercase tracking-[0.08em] text-ink disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? 'Updating…' : 'Update password'}
          </button>
        </div>
      </form>
    </div>
  )
}

// The secret key is write-only end to end (see migration 0030): this card
// never has the real value to pre-fill, so the secret-key input always
// starts blank. fetchStripeSettings() only ever returns a masked hint
// ("has a key ending in ****1xtr93") via a security-definer RPC that
// deliberately omits the raw value — leaving the field blank on save keeps
// whatever secret is already stored, so updating just the publishable key
// never forces re-pasting the secret. Structurally different from the
// single-value FIELDS below (two related fields with asymmetric read
// access), so it's its own self-contained card rather than entries in
// FIELDS.
function StripeSettingsCard() {
  const [publishableKey, setPublishableKey] = useState('')
  const [secretKey, setSecretKey] = useState('')
  const [hasSecretKey, setHasSecretKey] = useState(false)
  const [secretKeyHint, setSecretKeyHint] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    let cancelled = false
    fetchStripeSettings()
      .then((settings) => {
        if (cancelled) return
        setPublishableKey(settings.publishableKey)
        setHasSecretKey(settings.hasSecretKey)
        setSecretKeyHint(settings.secretKeyHint)
      })
      .catch((err) => setError(err.message || 'Could not load Stripe settings.'))
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  async function handleSave() {
    setError('')
    setSaved(false)
    setSaving(true)
    try {
      await saveStripeSettings({ publishableKey, secretKey })
      const settings = await fetchStripeSettings()
      setHasSecretKey(settings.hasSecretKey)
      setSecretKeyHint(settings.secretKeyHint)
      setSecretKey('')
      setSaved(true)
    } catch (err) {
      setError(err.message || 'Could not save Stripe settings.')
    }
    setSaving(false)
  }

  return (
    <div className="rounded-cv-lg border border-cream/[0.09] bg-[rgb(30,36,22)] px-6 py-5">
      <label className="mb-1.5 block font-sans text-[13px] font-semibold uppercase tracking-[0.08em] text-cream">
        Stripe
      </label>
      <p className="mb-4 font-serif text-[12.5px] text-cream/50">
        Membership and course payments are charged directly to these keys. The secret key powers the
        webhook and checkout too — set{' '}
        <code className="text-cream/70">STRIPE_WEBHOOK_SECRET</code> and{' '}
        <code className="text-cream/70">STRIPE_MEMBERSHIP_PRICE_ID</code> separately in Supabase Edge
        Function Secrets; those aren't managed from here yet.
      </p>

      {loading ? (
        <p className="font-serif text-[13.5px] text-cream/50">Loading…</p>
      ) : (
        <div className="flex flex-col gap-3.5">
          <div>
            <label className="mb-[7px] block font-sans text-[11px] font-semibold uppercase tracking-[0.12em] text-cream/50">
              Publishable key
            </label>
            <input
              type="text"
              value={publishableKey}
              onChange={(e) => setPublishableKey(e.target.value)}
              placeholder="pk_test_…"
              autoComplete="off"
              name="stripe_publishable_key"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck="false"
              className="w-full rounded-[10px] border border-cream/[0.14] bg-cream/[0.04] px-4 py-[13px] font-serif text-[14px] text-cream outline-none"
            />
          </div>
          <div>
            <label className="mb-[7px] block font-sans text-[11px] font-semibold uppercase tracking-[0.12em] text-cream/50">
              Secret key
            </label>
            {/* type="password" only to visually mask the value while typing — this
                is not a login field. Plain autoComplete="off" is well-documented to
                be ignored by Chrome specifically for <input type="password">; "new-
                password" is the token browsers actually respect for "don't suggest
                a saved site-login credential here", which is what stops this field
                (and the plain-text field above it, which Chrome otherwise pairs as
                a "username") from being silently autofilled with the admin's own
                account email/password instead of staying blank. */}
            <input
              type="password"
              value={secretKey}
              onChange={(e) => setSecretKey(e.target.value)}
              autoComplete="new-password"
              name="stripe_secret_key"
              className="w-full rounded-[10px] border border-cream/[0.14] bg-cream/[0.04] px-4 py-[13px] font-serif text-[14px] text-cream outline-none"
            />
            <p className="mt-1.5 font-serif text-[12px] text-cream/40">
              {hasSecretKey
                ? `A secret key is currently set (${secretKeyHint}). It's never shown in full — paste a new one only to replace it.`
                : 'No secret key set yet. Paste one from your Stripe Dashboard (Developers → API keys).'}
            </p>
          </div>

          {error && <p className="font-serif text-[13px] text-[#D8888A]">{error}</p>}

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="cursor-pointer rounded-full bg-gold px-5 py-2 font-sans text-[11.5px] font-semibold uppercase tracking-[0.08em] text-ink disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? 'Saving…' : 'Save'}
            </button>
            {saved && <span className="font-serif text-[12.5px] text-[#9BC08A]">Saved</span>}
          </div>
        </div>
      )}
    </div>
  )
}

// Zoom Server-to-Server OAuth credentials for live sessions (migration
// 0036) -- same write-only-secret pattern as StripeSettingsCard above:
// client_secret is never sent back to the browser, only a masked hint.
function ZoomSettingsCard() {
  const [accountId, setAccountId] = useState('')
  const [clientId, setClientId] = useState('')
  const [clientSecret, setClientSecret] = useState('')
  const [hasClientSecret, setHasClientSecret] = useState(false)
  const [clientSecretHint, setClientSecretHint] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    let cancelled = false
    fetchZoomSettings()
      .then((settings) => {
        if (cancelled) return
        setAccountId(settings.accountId)
        setClientId(settings.clientId)
        setHasClientSecret(settings.hasClientSecret)
        setClientSecretHint(settings.clientSecretHint)
      })
      .catch((err) => setError(err.message || 'Could not load Zoom settings.'))
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  async function handleSave() {
    setError('')
    setSaved(false)
    setSaving(true)
    try {
      await saveZoomSettings({ accountId, clientId, clientSecret })
      const settings = await fetchZoomSettings()
      setHasClientSecret(settings.hasClientSecret)
      setClientSecretHint(settings.clientSecretHint)
      setClientSecret('')
      setSaved(true)
    } catch (err) {
      setError(err.message || 'Could not save Zoom settings.')
    }
    setSaving(false)
  }

  return (
    <div className="rounded-cv-lg border border-cream/[0.09] bg-[rgb(30,36,22)] px-6 py-5">
      <label className="mb-1.5 block font-sans text-[13px] font-semibold uppercase tracking-[0.08em] text-cream">
        Zoom
      </label>
      <p className="mb-4 font-serif text-[12.5px] text-cream/50">
        Live sessions create real Zoom meetings automatically via a Server-to-Server OAuth app —
        create one in the Zoom Marketplace (Build App → Server-to-Server OAuth) and paste its three
        values here. Members can join right at the scheduled time with no manual step on your end.
      </p>

      {loading ? (
        <p className="font-serif text-[13.5px] text-cream/50">Loading…</p>
      ) : (
        <div className="flex flex-col gap-3.5">
          <div>
            <label className="mb-[7px] block font-sans text-[11px] font-semibold uppercase tracking-[0.12em] text-cream/50">
              Account ID
            </label>
            <input
              type="text"
              value={accountId}
              onChange={(e) => setAccountId(e.target.value)}
              placeholder="Zoom Account ID"
              autoComplete="off"
              name="zoom_account_id"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck="false"
              className="w-full rounded-[10px] border border-cream/[0.14] bg-cream/[0.04] px-4 py-[13px] font-serif text-[14px] text-cream outline-none"
            />
          </div>
          <div>
            <label className="mb-[7px] block font-sans text-[11px] font-semibold uppercase tracking-[0.12em] text-cream/50">
              Client ID
            </label>
            <input
              type="text"
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              placeholder="Client ID"
              autoComplete="off"
              name="zoom_client_id"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck="false"
              className="w-full rounded-[10px] border border-cream/[0.14] bg-cream/[0.04] px-4 py-[13px] font-serif text-[14px] text-cream outline-none"
            />
          </div>
          <div>
            <label className="mb-[7px] block font-sans text-[11px] font-semibold uppercase tracking-[0.12em] text-cream/50">
              Client Secret
            </label>
            {/* type="password" only to visually mask the value while typing -- see
                StripeSettingsCard's identical note on autoComplete="new-password"
                being what actually stops Chrome autofilling a saved login here. */}
            <input
              type="password"
              value={clientSecret}
              onChange={(e) => setClientSecret(e.target.value)}
              autoComplete="new-password"
              name="zoom_client_secret"
              className="w-full rounded-[10px] border border-cream/[0.14] bg-cream/[0.04] px-4 py-[13px] font-serif text-[14px] text-cream outline-none"
            />
            <p className="mt-1.5 font-serif text-[12px] text-cream/40">
              {hasClientSecret
                ? `A client secret is currently set (${clientSecretHint}). It's never shown in full — paste a new one only to replace it.`
                : 'No client secret set yet. Paste it from your Zoom Server-to-Server OAuth app.'}
            </p>
          </div>

          {error && <p className="font-serif text-[13px] text-[#D8888A]">{error}</p>}

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="cursor-pointer rounded-full bg-gold px-5 py-2 font-sans text-[11.5px] font-semibold uppercase tracking-[0.08em] text-ink disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? 'Saving…' : 'Save'}
            </button>
            {saved && <span className="font-serif text-[12.5px] text-[#9BC08A]">Saved</span>}
          </div>
        </div>
      )}
    </div>
  )
}

// Structurally different from the single-value FIELDS below (a repeatable,
// reorderable list rather than one key/value pair), so it's its own
// self-contained card rather than an entry in FIELDS.
function CourseCategoriesCard() {
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [newName, setNewName] = useState('')
  const [adding, setAdding] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [editingName, setEditingName] = useState('')

  async function refresh() {
    try {
      const list = await listCategories()
      setCategories(list)
    } catch (err) {
      setError(err.message || 'Could not load categories.')
    }
  }

  useEffect(() => {
    refresh().finally(() => setLoading(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function handleAdd() {
    setError('')
    if (!newName.trim()) return
    setAdding(true)
    try {
      await createCategory(newName)
      setNewName('')
      await refresh()
    } catch (err) {
      setError(err.message || 'Could not add this category.')
    }
    setAdding(false)
  }

  function startRename(cat) {
    setError('')
    setEditingId(cat.id)
    setEditingName(cat.name)
  }

  async function handleRename(id) {
    setError('')
    try {
      await renameCategory(id, editingName)
      setEditingId(null)
      await refresh()
    } catch (err) {
      setError(err.message || 'Could not rename this category.')
    }
  }

  async function handleDelete(cat) {
    if (!window.confirm(`Delete “${cat.name}”? This can't be undone.`)) return
    setError('')
    try {
      await deleteCategory(cat.id)
      await refresh()
    } catch (err) {
      setError(err.message || 'Could not delete this category.')
    }
  }

  async function move(index, dir) {
    const other = index + dir
    if (other < 0 || other >= categories.length) return
    setError('')
    const next = [...categories]
    ;[next[index], next[other]] = [next[other], next[index]]
    setCategories(next)
    try {
      await reorderCategories(next.map((c) => c.id))
    } catch (err) {
      setError(err.message || 'Could not reorder categories.')
      await refresh()
    }
  }

  return (
    <div className="rounded-cv-lg border border-cream/[0.09] bg-[rgb(30,36,22)] px-6 py-5">
      <label className="mb-1.5 block font-sans text-[13px] font-semibold uppercase tracking-[0.08em] text-cream">
        Course categories
      </label>
      <p className="mb-4 font-serif text-[12.5px] text-cream/50">
        Shown on courses in the admin editor and used to group/filter the member Course Library.
      </p>

      {error && <p className="mb-3 font-serif text-[13px] text-[#D8888A]">{error}</p>}

      {loading ? (
        <p className="font-serif text-[13.5px] text-cream/50">Loading…</p>
      ) : (
        <div className="mb-4 flex flex-col gap-2">
          {categories.length === 0 && (
            <p className="font-serif text-[13.5px] text-cream/40">No categories yet.</p>
          )}
          {categories.map((cat, index) => (
            <div
              key={cat.id}
              className="flex items-center gap-3 rounded-[10px] border border-cream/[0.1] bg-cream/[0.03] px-3.5 py-2.5"
            >
              <div className="flex flex-col gap-0.5">
                <button
                  type="button"
                  onClick={() => move(index, -1)}
                  disabled={index === 0}
                  aria-label="Move up"
                  className="cursor-pointer border-none bg-transparent p-0 leading-none text-cream/50 disabled:cursor-not-allowed disabled:opacity-25"
                >
                  ▲
                </button>
                <button
                  type="button"
                  onClick={() => move(index, 1)}
                  disabled={index === categories.length - 1}
                  aria-label="Move down"
                  className="cursor-pointer border-none bg-transparent p-0 leading-none text-cream/50 disabled:cursor-not-allowed disabled:opacity-25"
                >
                  ▼
                </button>
              </div>

              {editingId === cat.id ? (
                <>
                  <input
                    type="text"
                    value={editingName}
                    onChange={(e) => setEditingName(e.target.value)}
                    className="flex-1 rounded-[8px] border border-cream/[0.14] bg-cream/[0.04] px-3 py-[9px] font-serif text-[13.5px] text-cream outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => handleRename(cat.id)}
                    className="cursor-pointer whitespace-nowrap rounded-full bg-gold px-4 py-[7px] font-sans text-[10.5px] font-semibold uppercase tracking-[0.08em] text-ink"
                  >
                    Save
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingId(null)}
                    className="cursor-pointer whitespace-nowrap border-none bg-transparent font-sans text-[10.5px] font-semibold uppercase tracking-[0.08em] text-cream/50"
                  >
                    Cancel
                  </button>
                </>
              ) : (
                <>
                  <span className="flex-1 font-serif text-[14px] text-cream">{cat.name}</span>
                  <button
                    type="button"
                    onClick={() => startRename(cat)}
                    className="cursor-pointer whitespace-nowrap border-none bg-transparent font-sans text-[10.5px] font-semibold uppercase tracking-[0.08em] text-cream/50"
                  >
                    Rename
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(cat)}
                    className="cursor-pointer whitespace-nowrap border-none bg-transparent font-sans text-[10.5px] font-semibold uppercase tracking-[0.08em] text-[#D8888A]"
                  >
                    Delete
                  </button>
                </>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="flex items-center gap-3">
        <input
          type="text"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="e.g. Freedom & Healing"
          className="flex-1 rounded-[10px] border border-cream/[0.14] bg-cream/[0.04] px-4 py-[13px] font-serif text-[14px] text-cream outline-none"
        />
        <button
          type="button"
          onClick={handleAdd}
          disabled={adding || !newName.trim()}
          className="cursor-pointer whitespace-nowrap rounded-full bg-gold px-5 py-2 font-sans text-[11.5px] font-semibold uppercase tracking-[0.08em] text-ink disabled:cursor-not-allowed disabled:opacity-60"
        >
          {adding ? 'Adding…' : '+ Add category'}
        </button>
      </div>
    </div>
  )
}

const TABS = [
  { key: 'account', label: 'Account' },
  { key: 'payments', label: 'Payments' },
  { key: 'courses', label: 'Courses' },
  { key: 'live-sessions', label: 'Live sessions' },
  { key: 'content', label: 'Site content' },
]

function TabBar({ active, onChange }) {
  return (
    <div className="mb-8 flex flex-wrap gap-1 border-b border-cream/[0.09]">
      {TABS.map((t) => (
        <button
          key={t.key}
          type="button"
          onClick={() => onChange(t.key)}
          className={`-mb-px cursor-pointer border-b-2 px-4 py-3 font-sans text-[12.5px] font-semibold uppercase tracking-[0.1em] ${
            active === t.key ? 'border-gold text-white' : 'border-transparent text-cream/50 hover:text-cream/80'
          }`}
        >
          {t.label}
        </button>
      ))}
    </div>
  )
}

export default function AdminSettings() {
  const [activeTab, setActiveTab] = useState('account')
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
          <p className="mb-6 font-serif text-[15px] text-cream/60">
            Your account, payments, courses, and system-wide text shown to members.
          </p>

          <TabBar active={activeTab} onChange={setActiveTab} />

          {activeTab === 'account' && (
            <div className="flex flex-col gap-6">
              <PasswordCard />
            </div>
          )}

          {activeTab === 'payments' && (
            <div className="flex flex-col gap-6">
              <StripeSettingsCard />
            </div>
          )}

          {activeTab === 'courses' && (
            <div className="flex flex-col gap-6">
              <CourseCategoriesCard />
            </div>
          )}

          {activeTab === 'live-sessions' && (
            <div className="flex flex-col gap-6">
              <ZoomSettingsCard />
            </div>
          )}

          {activeTab === 'content' && (
            loading ? (
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
            )
          )}
        </main>
      </div>
    </div>
  )
}
