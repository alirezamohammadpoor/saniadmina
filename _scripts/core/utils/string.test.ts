import { describe, it, expect } from 'vitest'
import { upperFirst, camelCase, pluralize, toHandle } from '@/core/utils/string'

describe('upperFirst', () => {
  it('uppercases the first character', () => {
    expect(upperFirst('hello')).toBe('Hello')
  })

  it('leaves already-capitalized strings untouched', () => {
    expect(upperFirst('Hello')).toBe('Hello')
  })

  it('handles empty input', () => {
    expect(upperFirst('')).toBe('')
  })
})

describe('camelCase', () => {
  it('converts space-separated to camelCase', () => {
    expect(camelCase('hello world')).toBe('helloWorld')
  })

  it('converts kebab-case to camelCase', () => {
    expect(camelCase('hello-world')).toBe('helloWorld')
  })

  it('converts snake_case to camelCase', () => {
    expect(camelCase('hello_world')).toBe('helloWorld')
  })
})

describe('pluralize', () => {
  it('returns singular form for 1', () => {
    expect(pluralize(1, 'item')).toBe('item')
  })

  it('returns auto-plural for non-1', () => {
    expect(pluralize(2, 'item')).toBe('items')
    expect(pluralize(0, 'item')).toBe('items')
  })

  it('uses custom plural when provided', () => {
    expect(pluralize(2, 'mouse', 'mice')).toBe('mice')
  })
})

describe('toHandle', () => {
  it('lowercases and kebab-cases', () => {
    expect(toHandle('Product Name')).toBe('product-name')
  })

  it('strips special characters', () => {
    expect(toHandle('Carla 7 — heels!')).toBe('carla-7-heels')
  })

  it('strips trailing dashes', () => {
    expect(toHandle('hello-')).toBe('hello')
  })
})
