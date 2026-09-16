import { describe, it, expect, vi, afterEach } from 'vitest'
import { extractVimeoId, fetchVimeoOEmbed } from './vimeo'

describe('extractVimeoId', () => {
  it('parses a plain video URL', () => {
    expect(extractVimeoId('https://vimeo.com/123456789')).toBe('123456789')
  })

  it('parses a URL with a private-link hash', () => {
    expect(extractVimeoId('https://vimeo.com/123456789/abcdef')).toBe('123456789')
  })

  it('parses a player embed URL', () => {
    expect(extractVimeoId('https://player.vimeo.com/video/123456789')).toBe('123456789')
  })

  it('accepts a bare numeric id', () => {
    expect(extractVimeoId('123456789')).toBe('123456789')
  })

  it('returns null for an unparseable string', () => {
    expect(extractVimeoId('not a vimeo link')).toBeNull()
    expect(extractVimeoId('https://youtube.com/watch?v=abc')).toBeNull()
    expect(extractVimeoId('')).toBeNull()
    expect(extractVimeoId(null)).toBeNull()
  })
})

describe('fetchVimeoOEmbed', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('maps a successful oEmbed response', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        title: 'Week 1 — Intro',
        duration: 542,
        thumbnail_url: 'https://i.vimeocdn.com/video/thumb.jpg',
      }),
    })
    vi.stubGlobal('fetch', mockFetch)

    const result = await fetchVimeoOEmbed('https://vimeo.com/123456789')

    expect(mockFetch).toHaveBeenCalledWith(
      'https://vimeo.com/api/oembed.json?url=https%3A%2F%2Fvimeo.com%2F123456789'
    )
    expect(result).toEqual({
      title: 'Week 1 — Intro',
      duration: 542,
      thumbnailUrl: 'https://i.vimeocdn.com/video/thumb.jpg',
    })
  })

  it('throws a clear error on a non-200 response', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
      json: async () => ({}),
    })
    vi.stubGlobal('fetch', mockFetch)

    await expect(fetchVimeoOEmbed('https://vimeo.com/000000000')).rejects.toThrow(/invalid or private video/i)
  })
})
