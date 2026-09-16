import { describe, it, expect } from 'vitest'
import { parseCsv, validateEpisodeCsvRow, partitionCsvRows } from './csv'

describe('parseCsv', () => {
  it('parses a well-formed 2-row CSV', () => {
    const text = 'week,title,video_link\n1,Intro,https://vimeo.com/111\n2,Deep Dive,https://vimeo.com/222'
    expect(parseCsv(text)).toEqual([
      { week: '1', title: 'Intro', video_link: 'https://vimeo.com/111' },
      { week: '2', title: 'Deep Dive', video_link: 'https://vimeo.com/222' },
    ])
  })

  it('handles a quoted field containing a comma', () => {
    const text = 'week,title,description\n1,Intro,"Part one, and part two"'
    const rows = parseCsv(text)
    expect(rows).toEqual([{ week: '1', title: 'Intro', description: 'Part one, and part two' }])
  })

  it('returns an empty array for empty input', () => {
    expect(parseCsv('')).toEqual([])
    expect(parseCsv('   \n  ')).toEqual([])
  })
})

describe('validateEpisodeCsvRow', () => {
  it('passes a valid row', () => {
    const row = {
      week: '1',
      title: 'Intro',
      video_link: 'https://vimeo.com/123456789',
      description: 'Optional',
      release_date: '2026-01-01',
    }
    expect(validateEpisodeCsvRow(row, 1)).toEqual({ valid: true, errors: [] })
  })

  it('fails a row missing a required field with a clear error message', () => {
    const row = { week: '1', title: '', video_link: 'https://vimeo.com/123456789' }
    const result = validateEpisodeCsvRow(row, 2)
    expect(result.valid).toBe(false)
    expect(result.errors).toEqual(expect.arrayContaining([expect.stringContaining('Row 2: "title" is required')]))
  })

  it('fails a row with an invalid video_link', () => {
    const row = { week: '1', title: 'Intro', video_link: 'https://youtube.com/watch?v=abc' }
    const result = validateEpisodeCsvRow(row, 3)
    expect(result.valid).toBe(false)
    expect(result.errors).toEqual(expect.arrayContaining([expect.stringContaining('video_link')]))
  })

  it('fails a row with a non-positive-integer week', () => {
    const row = { week: '0', title: 'Intro', video_link: 'https://vimeo.com/123456789' }
    const result = validateEpisodeCsvRow(row, 4)
    expect(result.valid).toBe(false)
    expect(result.errors).toEqual(expect.arrayContaining([expect.stringContaining('week')]))
  })

  it('fails a row with an unparseable release_date', () => {
    const row = {
      week: '1',
      title: 'Intro',
      video_link: 'https://vimeo.com/123456789',
      release_date: 'not-a-date',
    }
    const result = validateEpisodeCsvRow(row, 5)
    expect(result.valid).toBe(false)
    expect(result.errors).toEqual(expect.arrayContaining([expect.stringContaining('release_date')]))
  })
})

describe('partitionCsvRows', () => {
  it('puts every row in `valid` when all rows pass', () => {
    const rows = [
      { week: '1', title: 'Intro', video_link: 'https://vimeo.com/111' },
      { week: '2', title: 'Deep Dive', video_link: 'https://vimeo.com/222' },
    ]
    const { valid, invalid } = partitionCsvRows(rows)
    expect(invalid).toEqual([])
    expect(valid).toEqual([
      { row: rows[0], rowIndex: 1 },
      { row: rows[1], rowIndex: 2 },
    ])
  })

  it('separates invalid rows with their error messages, 1-based rowIndex', () => {
    const rows = [
      { week: '1', title: 'Intro', video_link: 'https://vimeo.com/111' },
      { week: '0', title: '', video_link: 'not-a-link' },
    ]
    const { valid, invalid } = partitionCsvRows(rows)
    expect(valid).toEqual([{ row: rows[0], rowIndex: 1 }])
    expect(invalid).toHaveLength(1)
    expect(invalid[0].rowIndex).toBe(2)
    expect(invalid[0].row).toBe(rows[1])
    expect(invalid[0].errors.length).toBeGreaterThan(0)
  })

  it('returns two empty arrays for no rows', () => {
    expect(partitionCsvRows([])).toEqual({ valid: [], invalid: [] })
    expect(partitionCsvRows(undefined)).toEqual({ valid: [], invalid: [] })
  })
})
