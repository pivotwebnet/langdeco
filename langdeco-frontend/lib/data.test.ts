import { describe, it, expect } from 'vitest'
import { formatPrice } from './data'

describe('formatPrice', () => {
  it('formats whole numbers with thousands separators (formato AR/DE)', () => {
    expect(formatPrice(1890000)).toBe('$ 1.890.000')
  })

  it('rounds decimals to the nearest integer', () => {
    expect(formatPrice(1999.6)).toBe('$ 2.000')
  })

  it('handles zero', () => {
    expect(formatPrice(0)).toBe('$ 0')
  })

  it('handles small numbers without separators', () => {
    expect(formatPrice(500)).toBe('$ 500')
  })
})
