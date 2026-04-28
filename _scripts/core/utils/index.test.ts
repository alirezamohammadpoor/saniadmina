import { describe, it, expect } from 'vitest'
import {
  validateQty,
  clamp,
  pad,
  getWrappedIndex,
  hashFromString,
  isNumber,
  toPascalCase,
} from '@/core/utils'

describe('validateQty', () => {
  it('returns the number when given a valid integer', () => {
    expect(validateQty(5)).toBe(5)
    expect(validateQty(0)).toBe(0)
  })

  it('returns the default when given a non-integer', () => {
    expect(validateQty(1.5)).toBe(1)
    expect(validateQty('abc')).toBe(1)
    expect(validateQty(NaN)).toBe(1)
  })

  it('accepts a custom default', () => {
    expect(validateQty('x', 10)).toBe(10)
  })
})

describe('clamp', () => {
  it('clamps within range', () => {
    expect(clamp(5, 0, 10)).toBe(5)
    expect(clamp(-5, 0, 10)).toBe(0)
    expect(clamp(15, 0, 10)).toBe(10)
  })

  it('handles reversed bounds', () => {
    expect(clamp(5, 10, 0)).toBe(5)
    expect(clamp(-5, 10, 0)).toBe(0)
    expect(clamp(15, 10, 0)).toBe(10)
  })
})

describe('pad', () => {
  it('pads with zeros by default', () => {
    expect(pad(7, 3)).toBe('007')
    expect(pad(42, 4)).toBe('0042')
  })

  it('leaves numbers wider than width untouched', () => {
    expect(pad(1234, 2)).toBe('1234')
  })

  it('accepts a custom pad character', () => {
    expect(pad(7, 3, ' ')).toBe('  7')
  })
})

describe('getWrappedIndex', () => {
  it('wraps past the end', () => {
    expect(getWrappedIndex([1, 2, 3], 3)).toBe(0)
    expect(getWrappedIndex([1, 2, 3], 4)).toBe(1)
  })

  it('wraps past the start', () => {
    expect(getWrappedIndex([1, 2, 3], -1)).toBe(2)
    expect(getWrappedIndex([1, 2, 3], -4)).toBe(2)
  })
})

describe('hashFromString', () => {
  it('is deterministic', () => {
    expect(hashFromString('test')).toBe(hashFromString('test'))
  })

  it('returns 0 for empty string', () => {
    expect(hashFromString('')).toBe(0)
  })

  it('returns different hashes for different inputs', () => {
    expect(hashFromString('a')).not.toBe(hashFromString('b'))
  })
})

describe('isNumber', () => {
  it('accepts finite numbers', () => {
    expect(isNumber(0)).toBe(true)
    expect(isNumber(-1.5)).toBe(true)
  })

  it('rejects NaN and non-numbers', () => {
    expect(isNumber(NaN)).toBe(false)
    expect(isNumber('1')).toBe(false)
    expect(isNumber(undefined)).toBe(false)
  })
})

describe('toPascalCase', () => {
  it('converts space-separated words to PascalCase', () => {
    expect(toPascalCase('product name')).toBe('ProductName')
  })

  it('converts kebab-case to PascalCase', () => {
    expect(toPascalCase('product-name')).toBe('ProductName')
  })
})
