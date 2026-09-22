import { useEffect, useRef, useState } from 'react'
import Player from '@vimeo/player'
import { buildVimeoEmbedUrl } from '../lib/vimeo'

// Embedded Vimeo player wired to the official SDK. Accepts a Vimeo URL or a
// bare numeric id, and drives progress tracking off the SDK's playback events:
//   - startAt: seek here once the player is ready (resume where they left off)
//   - onProgress({seconds, percent, duration}): throttled to saveEvery ms, plus
//     on pause and ended — the caller persists this
//   - onComplete(): fired once when percent >= completeAt, or on ended
//   - onSeeked({seconds, ...}): fired on a manual scrub (item #11/#12 — the
//     caller updates last_position but must not touch max_position itself)
//   - onPlaybackRateChange(rate): fired on speed change (item #21)
//   - onResumeApplied(seconds): fired once the initial startAt seek actually
//     lands (clamped to the real duration) — the caller sends an immediate
//     heartbeat here (spec step 6)
//   - onPause({seconds, ...}): fired on pause, separately from onProgress —
//     the tracker's onPause() does an immediate flush, unlike onTimeupdate's
//     throttled accumulation
//   - onEvent({type, ...}): every raw event, if you want them (e.g. a debug panel)
//
// Works with domain-restricted private videos as long as the portal's domain is
// whitelisted in Vimeo — otherwise Vimeo blocks the embed and the SDK fires an
// `error` event, surfaced below.
//
// Renders its own <iframe src="player.vimeo.com/..."> and wraps THAT directly
// (`new Player(iframeElement)`) rather than handing a container div + {url}
// to the SDK. The div+url form resolves the embed asynchronously via Vimeo's
// oEmbed API before it can inject an iframe — under React StrictMode's
// mount→cleanup→mount dev cycle, that in-flight oEmbed fetch outlives the
// first instance's destroy() (which only removes an iframe if one already
// exists) and injects a zombie iframe afterwards, silently orphaning the
// surviving instance's event listeners. Building the src ourselves (same
// numeric id + private-link hash oEmbed itself would've resolved) sidesteps
// the race entirely, and also works for private videos, which oEmbed can't
// see at all.
export default function VimeoPlayer({
  video,
  startAt = 0,
  completeAt = 0.9,
  saveEvery = 5000,
  onProgress,
  onComplete,
  onSeeked,
  onPlaybackRateChange,
  onResumeApplied,
  onPause,
  onEvent,
}) {
  const iframeRef = useRef(null)
  const [error, setError] = useState('')
  const embedUrl = buildVimeoEmbedUrl(video)

  // Keep the latest callbacks in a ref so the player effect doesn't need to
  // re-create the iframe every time the parent re-renders.
  const cb = useRef({})
  cb.current = { onProgress, onComplete, onSeeked, onPlaybackRateChange, onResumeApplied, onPause, onEvent }

  useEffect(() => {
    if (!iframeRef.current || !embedUrl) return
    setError('')

    const player = new Player(iframeRef.current)

    let lastSaved = 0
    let completed = false

    player.on('play', (d) => cb.current.onEvent?.({ type: 'play', ...d }))

    player.on('pause', (d) => {
      cb.current.onEvent?.({ type: 'pause', ...d })
      cb.current.onProgress?.(d)
      cb.current.onPause?.(d)
    })

    player.on('timeupdate', (d) => {
      cb.current.onEvent?.({ type: 'timeupdate', ...d })
      const now = Date.now()
      if (now - lastSaved >= saveEvery) {
        lastSaved = now
        cb.current.onProgress?.(d)
      }
      if (!completed && d.percent >= completeAt) {
        completed = true
        cb.current.onComplete?.(d)
      }
    })

    player.on('seeked', (d) => {
      cb.current.onEvent?.({ type: 'seeked', ...d })
      cb.current.onSeeked?.(d)
    })

    player.on('playbackratechange', (d) => {
      cb.current.onEvent?.({ type: 'playbackratechange', ...d })
      cb.current.onPlaybackRateChange?.(d?.playbackRate)
    })

    player.on('ended', (d) => {
      cb.current.onEvent?.({ type: 'ended', ...d })
      if (!completed) {
        completed = true
        cb.current.onComplete?.(d)
      }
      cb.current.onProgress?.(d)
    })

    player.on('error', (e) => {
      setError(e?.message || 'This video could not be loaded.')
      cb.current.onEvent?.({ type: 'error', ...e })
    })

    if (startAt > 0) {
      // Clamp to the real duration once known -- a stale/incorrect saved
      // position (e.g. the admin re-linked this episode to a shorter video,
      // item #18) should never seek past the end. One retry on failure: the
      // SDK's `ready()` resolving doesn't strictly guarantee the iframe is
      // done negotiating with Vimeo, so a `setCurrentTime` race is possible;
      // retrying once after a short delay covers that without looping forever.
      const seekWithRetry = (attempt = 0) => {
        player
          .ready()
          .then(() => player.getDuration())
          .then((duration) => {
            const safeSeconds = duration > 0 ? Math.min(startAt, Math.max(0, duration - 1)) : startAt
            return player.setCurrentTime(safeSeconds).then(() => safeSeconds)
          })
          .then((appliedSeconds) => {
            cb.current.onResumeApplied?.(appliedSeconds)
          })
          .catch(() => {
            if (attempt < 1) setTimeout(() => seekWithRetry(attempt + 1), 500)
          })
      }
      seekWithRetry()
    }

    // NOT player.destroy(): that removes the iframe from the DOM directly
    // (element.parentNode.removeChild), which React doesn't know about
    // since it owns and rendered that same <iframe> itself. Under React
    // StrictMode's dev-only mount→cleanup→mount, that direct removal races
    // React's own reconciliation of the same node and leaves the surviving
    // mount with no live iframe. .off() only unregisters this instance's
    // callbacks (a postMessage to the iframe, no DOM access) -- React
    // removes/replaces the actual iframe element itself, normally, whenever
    // this component unmounts or gets a new key/src.
    return () => {
      ;['play', 'pause', 'timeupdate', 'seeked', 'playbackratechange', 'ended', 'error'].forEach((name) =>
        player.off(name)
      )
    }
  }, [embedUrl, startAt, completeAt, saveEvery])

  return (
    <div className="overflow-hidden rounded-cv-lg border border-cream/[0.09] bg-black">
      <div className="aspect-video w-full">
        {embedUrl && (
          <iframe
            ref={iframeRef}
            src={embedUrl}
            className="h-full w-full"
            allow="autoplay; fullscreen; picture-in-picture; clipboard-write; encrypted-media"
            allowFullScreen
            title="Episode video"
          />
        )}
      </div>
      {error && (
        <p className="px-4 py-3 font-serif text-[13px] text-[#D8888A]">
          {error} — if this is a private video, add the portal domain to Vimeo’s allowed domains.
        </p>
      )}
    </div>
  )
}
