import { supabase } from './supabaseClient'

// Fixed set of known keys rather than a fully free-form editor — keeps the
// Settings page from turning into an unbounded config store nobody can
// reason about later. Add a new entry here (+ a field in AdminSettings.jsx)
// when a new setting is actually needed.
export const SETTING_KEYS = {
  SUBSCRIPTION_TERMS: 'subscription_terms',
  MEMBERSHIP_PRICE_DISPLAY: 'membership_price_display',
  SUPPORT_EMAIL: 'support_email',
  WELCOME_EMAIL_MESSAGE: 'welcome_email_message',
  // Not a content string like the rest of this file — a boolean flag ('true'
  // / 'false') for the progress-tracking module (features/progress-equivalent:
  // src/lib/progress.js + supabase/functions/progress-*). Reusing this table
  // rather than a dedicated flags table since this app has no other feature
  // flags yet; readable by anon/authenticated (app_settings' existing RLS),
  // writable by admin only. Off -> no heartbeats, no progress UI, existing
  // pages render exactly as they did before this module existed.
  PROGRESS_TRACKING_ENABLED: 'progress_tracking_enabled',
}

const DEFAULTS = {
  [SETTING_KEYS.SUBSCRIPTION_TERMS]:
    'Membership is billed monthly at $49/mo. Cancel anytime — no contracts. Individual courses are billed separately as one-time purchases.',
  [SETTING_KEYS.MEMBERSHIP_PRICE_DISPLAY]: '$49/mo',
  [SETTING_KEYS.SUPPORT_EMAIL]: 'support@convergencemvmnt.com',
  [SETTING_KEYS.WELCOME_EMAIL_MESSAGE]: 'Welcome to Convergence MVMNT — glad you’re here.',
  [SETTING_KEYS.PROGRESS_TRACKING_ENABLED]: 'true',
}

export async function fetchAppSettings() {
  const { data, error } = await supabase.from('app_settings').select('key, value')
  if (error) throw error
  const map = { ...DEFAULTS }
  for (const row of data || []) {
    map[row.key] = row.value
  }
  return map
}

export async function saveAppSetting(key, value) {
  const { data: userData } = await supabase.auth.getUser()
  const { error } = await supabase
    .from('app_settings')
    .upsert({ key, value, updated_by: userData.user?.id ?? null, updated_at: new Date().toISOString() })
  if (error) throw error
}
