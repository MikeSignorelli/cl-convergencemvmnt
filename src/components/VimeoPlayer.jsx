import { useEffect, useRef, useState } from 'react'
import Player from '@vimeo/player'

// Embedded Vimeo player wired to the official SDK. Accepts a Vimeo URL or a
// bare numeric id, and drives progress tracking off the SDK's playback events:
//   - startAt: seek here once the player is ready (resume where they left off)
//   - onProgress({seconds, percent, duration}): throttled to saveEvery ms, plus
//     on pause and ended — the caller persists this
//   - onComplete(): fired once when percent >= completeAt, or on ended
//   - onEvent({type, ...}): every raw event, if you want them (e.g. a debug panel)
//
// Works with domain-restricted private videos as long as the portal's domain is
// whitelisted in Vimeo — otherwise Vimeo blocks the embed and the SDK fires an
// `error` event, surfaced below.
export default function VimeoPlayer({
  video,
  startAt = 0,
  completeAt = 0.9,
  saveEvery = 5000,
  onProgress,
  onComplete,
  onEvent,
}) {
  const containerRef = useRef(null)
  const [error, setError] = useState('')

  // Keep the latest callbacks in a ref so the player effect doesn't need to
  // re-create the iframe every time the parent re-renders.
  const cb = useRef({})
  cb.current = { onProgress, onComplete, onEvent }

  useEffect(() => {
    if (!containerRef.current || !video) return
    setError('')

    const isUrl = /^https?:\/\//i.test(String(video))
    const player = new Player(containerRef.current, {
      ...(isUrl ? { url: String(video) } : { id: Number(video) }),
      responsive: true,
      dnt: true,
    })

    let lastSaved = 0
    let completed = false

    player.on('play', (d) => cb.current.onEvent?.({ type: 'play', ...d }))

    player.on('pause', (d) => {
      cb.current.onEvent?.({ type: 'pause', ...d })
      cb.current.onProgress?.(d)
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
      player.ready().then(() => player.setCurrentTime(startAt)).catch(() => {})
    }

    return () => {
      player.destroy().catch(() => {})
    }
  }, [video, startAt, completeAt, saveEvery])

  return (
    <div className="overflow-hidden rounded-cv-lg border border-cream/[0.09] bg-black">
      <div ref={containerRef} className="aspect-video w-full" />
      {error && (
        <p className="px-4 py-3 font-serif text-[13px] text-[#D8888A]">
          {error} — if this is a private video, add the portal domain to Vimeo’s allowed domains.
        </p>
      )}
    </div>
  )
}
