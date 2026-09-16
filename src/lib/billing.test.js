import { describe, it, expect } from 'vitest'
import { formatStripeProductLabel } from './billing'

// Only the pure formatting helper is tested here — everything else in this
// module talks to Supabase/Stripe (see listStripeProducts,
// startMembershipCheckout, etc.) and needs a real backend to exercise
// meaningfully, same as the rest of this file's functions.
describe('formatStripeProductLabel', () => {
  it('formats a one-time price', () => {
    expect(
      formatStripeProductLabel({ productName: 'Foundations Course', amount: 49700, currency: 'usd', interval: null })
    ).toBe('Foundations Course $497.00 (one-time)')
  })

  it('formats a monthly recurring price', () => {
    expect(
      formatStripeProductLabel({ productName: 'Membership', amount: 4900, currency: 'usd', interval: 'month' })
    ).toBe('Membership $49.00 per month')
  })

  it('formats a yearly recurring price', () => {
    expect(
      formatStripeProductLabel({ productName: 'Annual Plan', amount: 49900, currency: 'usd', interval: 'year' })
    ).toBe('Annual Plan $499.00 per year')
  })
})
