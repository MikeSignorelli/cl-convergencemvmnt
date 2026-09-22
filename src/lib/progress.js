import { supabase, unwrapFunctionError } from './supabaseClient'
import { fetchAppSettings, SETTING_KEYS } from './appSettings'

// ---------------------------------------------------------------------------
// Config (mirror of the three Edge Functions' own copies of these numbers --
// see progress-heartbeat/index.ts for why there's no shared module).
// ---------------------------------------------------------------------------
export const HEARTBEAT_INTERVAL_MS = 10_000
export const RESUME_MIN_SECONDS = 10
export const RESUME_MAX_FRACTION = 0.95
export const NEAR_END_RESET_FRACTION = 0.98
export const MAX_TRACKED_PLAYBACK_RATE = 2
const RETRY_BACKOFF_MS = [1000, 2000, 4000, 8000, 16000, 30000]
const SESSION_QUEUE_KEY_PREFIX = 'cv-progress-queue:'

// ---------------------------------------------------------------------------
// Feature flag
// ---------------------------------------------------------------------------
let cachedEnabled = null
// Cached in memory for the tab's lifetime (settings rarely change mid-session)
// -- avoids a network round trip before every single episode open. Callers
// that need a fresh read (e.g. right after an admin flips it) can pass
// `force`.
export async function isProgressTrackingEnabled(force = false) {
  if (cachedEnabled != null && !force) return cachedEnabled
  try {
    const settings = await fetchAppSettings()
    cachedEnabled = settings[SETTING_KEYS.PROGRESS_TRACKING_ENABLED] !== 'false'
  } catch {
    // Fail open on the READ (missing/unreachable settings shouldn't disable
    // a feature nobody asked to turn off) -- but every write path below
    // still independently no-ops gracefully if the API is unreachable.
    cachedEnabled = true
  }
  return cachedEnabled
}

// ---------------------------------------------------------------------------
// Per-user local cache keys -- everything is namespaced by user id and wiped
// on logout (see clearAllProgressCaches), so switching accounts on the same
// browser never shows a leftover position from the previous user.
// ---------------------------------------------------------------------------
function queueKey(userId) {
  return `${SESSION_QUEUE_KEY_PREFIX}${userId}`
}

function readQueue(userId) {
  try {
    const raw = sessionStorage.getItem(queueKey(userId))
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}
function writeQueue(userId, queue) {
  try {
    if (queue.length === 0) sessionStorage.removeItem(queueKey(userId))
    else sessionStorage.setItem(queueKey(userId), JSON.stringify(queue))
  } catch {
    // sessionStorage can throw (private mode, quota) -- losing the queue is
    // an acceptable degradation, not a crash.
  }
}

// Clears every progress-related client cache. Call on logout (item #28 --
// never show the previous user's positions to whoever signs in next) and
// on user-switch.
export function clearAllProgressCaches() {
  try {
    for (let i = sessionStorage.length - 1; i >= 0; i--) {
      const key = sessionStorage.key(i)
      if (key && key.startsWith(SESSION_QUEUE_KEY_PREFIX)) sessionStorage.removeItem(key)
    }
  } catch {
    /* ignore */
  }
  inMemoryCourseCache.clear()
}

// In-memory (not persisted) cache of the last-fetched course progress
// payload, for instant UI on back-navigation -- server is still always
// re-fetched and is authoritative; this only avoids a loading flash.
const inMemoryCourseCache = new Map()
export function getCachedCourseProgress(courseId) {
  return inMemoryCourseCache.get(courseId) || null
}

// ---------------------------------------------------------------------------
// Edge Function calls
// ---------------------------------------------------------------------------
async function invoke(name, body, { method } = {}) {
  const { data, error } = await supabase.functions.invoke(name, { body, method })
  if (error) throw await unwrapFunctionError(error)
  return data
}

export async function fetchCourseProgress(courseId) {
  const data = await invoke('progress-course', { courseId })
  inMemoryCourseCache.set(courseId, data)
  return data
}

export async function fetchContinueWatchingCourses(limit) {
  const data = await invoke('progress-continue-watching', { limit })
  return data?.items || []
}

export async function fetchMyProgress() {
  return invoke('progress-me', {})
}

export async function markEpisodeComplete(episodeId) {
  return invoke('progress-complete', { episodeId })
}
export async function markEpisodeIncomplete(episodeId) {
  return invoke('progress-complete', { episodeId }, { method: 'DELETE' })
}
export async function startEpisodeOver(episodeId) {
  return invoke('progress-start-over', { episodeId })
}

// ---------------------------------------------------------------------------
// Resume decision (spec: "Resume decision when an episode is opened")
// ---------------------------------------------------------------------------
export function getResumeDecision({ lastPosition = 0, completedAt = null, duration = 0 }) {
  if (completedAt || (duration > 0 && lastPosition >= duration * RESUME_MAX_FRACTION)) {
    return { mode: 'watch_again', resumeSeconds: 0 }
  }
  if (lastPosition >= RESUME_MIN_SECONDS) {
    return { mode: 'resume', resumeSeconds: lastPosition }
  }
  return { mode: 'start', resumeSeconds: 0 }
}

// ---------------------------------------------------------------------------
// BroadcastChannel: same episode open in two tabs (#10) -- when one tab
// starts playing, it announces itself; every other tab pauses its own
// player and shows "Playing in another tab". Guarded because Safari <15.4
// and any non-browser test environment may not have BroadcastChannel.
// ---------------------------------------------------------------------------
const channel = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel('progress') : null

export function announcePlaying(episodeId, sessionId) {
  channel?.postMessage({ type: 'playing', episodeId, sessionId })
}
export function onOtherTabPlaying(callback) {
  if (!channel) return () => {}
  const handler = (event) => {
    if (event.data?.type === 'playing') callback(event.data.episodeId, event.data.sessionId)
  }
  channel.addEventListener('message', handler)
  return () => channel.removeEventListener('message', handler)
}

// ---------------------------------------------------------------------------
// EpisodeTracker -- one instance per currently-open episode. Owns the
// heartbeat interval, the discrete-event listeners, the retry/backoff queue,
// and the sendBeacon-on-unload path. Created fresh per episode (see
// VimeoPlayer's `key={episode.id}` remount pattern already in CourseDetail),
// destroyed (via stop()) when the player closes or the episode switches.
// ---------------------------------------------------------------------------
export function createEpisodeTracker({ episodeId, courseId, userId, vimeoId, enabled }) {
  const sessionId = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
  let secondsWatchedSinceLastFlush = 0
  let lastTimeupdateAt = null
  let lastKnownPosition = 0
  let lastKnownMaxPosition = 0
  let lastKnownDuration = 0
  let lastKnownPlaybackRate = 1
  let queue = enabled ? readQueue(userId) : []
  let retryAttempt = 0
  let retryTimer = null
  let stopped = false

  function buildPayload(overrides = {}) {
    return {
      episodeId,
      courseId,
      position: lastKnownPosition,
      maxPosition: lastKnownMaxPosition,
      secondsWatchedDelta: secondsWatchedSinceLastFlush,
      duration: lastKnownDuration || undefined,
      playbackRate: lastKnownPlaybackRate,
      vimeoId,
      clientTs: new Date().toISOString(),
      sessionId,
      ...overrides,
    }
  }

  async function sendNow(payload) {
    const { error } = await supabase.functions.invoke('progress-heartbeat', { body: payload })
    if (error) throw await unwrapFunctionError(error)
  }

  function persistQueue() {
    if (userId) writeQueue(userId, queue)
  }

  function scheduleRetry() {
    if (stopped || queue.length === 0) return
    const delay = RETRY_BACKOFF_MS[Math.min(retryAttempt, RETRY_BACKOFF_MS.length - 1)]
    retryTimer = setTimeout(flushQueue, delay)
  }

  async function flushQueue() {
    if (!enabled || stopped) return
    while (queue.length > 0) {
      const next = queue[0]
      try {
        await sendNow(next)
        queue.shift()
        persistQueue()
        retryAttempt = 0
      } catch {
        retryAttempt += 1
        persistQueue()
        scheduleRetry()
        return
      }
    }
  }

  function enqueue(payload) {
    queue.push(payload)
    persistQueue()
    flushQueue()
  }

  function beat(overrides) {
    if (!enabled || stopped) return
    const payload = buildPayload(overrides)
    secondsWatchedSinceLastFlush = 0
    enqueue(payload)
  }

  // ---- Public event hooks (wired from VimeoPlayer's callbacks) ----------
  function onLoaded() {
    if (enabled) announcePlaying(episodeId, sessionId)
    // Flush anything left over from a previous page load (refresh mid-watch,
    // item #5/#8) before this episode's first real heartbeat.
    if (enabled && queue.length > 0) flushQueue()
  }

  function onTimeupdate({ seconds, duration, percent } = {}) {
    if (typeof seconds === 'number') lastKnownPosition = seconds
    if (typeof duration === 'number' && duration > 0) lastKnownDuration = duration
    lastKnownMaxPosition = Math.max(lastKnownMaxPosition, lastKnownPosition)
    const now = Date.now()
    if (lastTimeupdateAt != null) {
      const wallClockDelta = (now - lastTimeupdateAt) / 1000
      // Real play time only -- a seek makes the gap between timeupdate
      // ticks huge/negative, and >MAX_TRACKED_PLAYBACK_RATE isn't credited
      // (config: "> 2x counts nothing"). A normal ~1s tick at rate R adds R
      // seconds of real watched time for R <= cap.
      if (wallClockDelta > 0 && wallClockDelta < 5 && lastKnownPlaybackRate <= MAX_TRACKED_PLAYBACK_RATE) {
        secondsWatchedSinceLastFlush += wallClockDelta * lastKnownPlaybackRate
      }
    }
    lastTimeupdateAt = now
    void percent
  }

  function onPlaybackRateChange(rate) {
    if (typeof rate === 'number' && rate > 0) lastKnownPlaybackRate = rate
  }

  function onPause() {
    lastTimeupdateAt = null
    beat()
  }
  function onSeeked({ seconds } = {}) {
    if (typeof seconds === 'number') lastKnownPosition = seconds
    lastTimeupdateAt = null
    beat()
  }
  function onEnded() {
    lastTimeupdateAt = null
    lastKnownPosition = lastKnownDuration || lastKnownPosition
    lastKnownMaxPosition = Math.max(lastKnownMaxPosition, lastKnownPosition)
    beat()
  }
  // Fired right after a resume seek succeeds (spec step 6: "send an
  // immediate heartbeat so last_watched_at updates and Continue Watching
  // reorders").
  function onResumeApplied(position) {
    lastKnownPosition = position
    lastKnownMaxPosition = Math.max(lastKnownMaxPosition, position)
    beat({ secondsWatchedDelta: 0 })
  }

  const intervalId = enabled
    ? setInterval(() => {
        if (secondsWatchedSinceLastFlush > 0 || lastTimeupdateAt != null) beat()
      }, HEARTBEAT_INTERVAL_MS)
    : null

  function handleVisibilityChange() {
    if (document.visibilityState === 'hidden') flushBeacon()
  }
  function flushBeacon() {
    if (!enabled || stopped) return
    if (secondsWatchedSinceLastFlush <= 0 && queue.length === 0) return
    if (secondsWatchedSinceLastFlush > 0) {
      queue.push(buildPayload())
      secondsWatchedSinceLastFlush = 0
      persistQueue()
    }
    // sendBeacon can't carry our Authorization header, so it can't hit the
    // Edge Function directly -- best-effort synchronous flush attempt
    // instead; whatever doesn't make it stays in the sessionStorage queue
    // and is retried on next load (item #5/#6/#8).
    flushQueue()
  }

  if (enabled && typeof document !== 'undefined') {
    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('pagehide', flushBeacon)
    window.addEventListener('online', flushQueue)
  }

  if (enabled && queue.length > 0) flushQueue()

  function stop() {
    stopped = true
    if (intervalId) clearInterval(intervalId)
    if (retryTimer) clearTimeout(retryTimer)
    if (typeof document !== 'undefined') {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('pagehide', flushBeacon)
      window.removeEventListener('online', flushQueue)
    }
    // Flush whatever's outstanding before the tracker goes away (episode
    // switch / player close, item #3) so the old episode's position is
    // saved before the new one takes over.
    if (secondsWatchedSinceLastFlush > 0) beat()
  }

  return {
    sessionId,
    onLoaded,
    onTimeupdate,
    onPlaybackRateChange,
    onPause,
    onSeeked,
    onEnded,
    onResumeApplied,
    stop,
  }
}
