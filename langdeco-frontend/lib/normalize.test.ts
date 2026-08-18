import { describe, it, expect } from 'vitest'
import { normalize } from './normalize'

describe('normalize', () => {
  it('lowercases', () => {
    expect(normalize('SOFÁ')).toBe('sofa')
  })

  it('strips accents/diacritics', () => {
    expect(normalize('cerámica')).toBe('ceramica')
    expect(normalize('almohadón')).toBe('almohadon')
  })

  it('leaves already-normalized text untouched', () => {
    expect(normalize('mesa arenisca')).toBe('mesa arenisca')
  })
})
