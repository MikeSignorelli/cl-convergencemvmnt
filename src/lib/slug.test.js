import { describe, it, expect } from 'vitest'
import { slugify } from './slug'

describe('slugify', () => {
  it('lowercases and hyphenates a basic title', () => {
    expect(slugify('Inherit Your Freedom!')).toBe('inherit-your-freedom')
  })

  it('collapses repeated punctuation into a single hyphen', () => {
    expect(slugify('Week 1 -- Intro!!  (Part A)')).toBe('week-1-intro-part-a')
  })

  it('trims leading and trailing punctuation', () => {
    expect(slugify('  --Hello World--  ')).toBe('hello-world')
  })

  it('strips unicode/accented characters', () => {
    expect(slugify('Café Déjà Vu')).toBe('caf-d-j-vu')
  })

  it('returns an empty string for empty input', () => {
    expect(slugify('')).toBe('')
    expect(slugify(undefined)).toBe('')
  })
})
