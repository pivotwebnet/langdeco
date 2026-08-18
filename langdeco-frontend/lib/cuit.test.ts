import { describe, it, expect } from 'vitest'
import { isValidCuit } from './cuit'

describe('isValidCuit', () => {
  it('accepts a mathematically valid CUIT, with or without dashes', () => {
    expect(isValidCuit('20-12345678-6')).toBe(true)
    expect(isValidCuit('20123456786')).toBe(true)
  })

  it('rejects a CUIT with a wrong check digit', () => {
    expect(isValidCuit('20-12345678-7')).toBe(false)
  })

  it('rejects strings that are not 11 digits long', () => {
    expect(isValidCuit('123')).toBe(false)
    expect(isValidCuit('')).toBe(false)
  })
})
