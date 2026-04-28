import { describe, it, expect, beforeEach } from 'vitest'
import FocusTrap from '@/core/focusTrap'

describe('FocusTrap', () => {
  beforeEach(() => {
    document.body.innerHTML = ''
  })

  it('throws if given a null element', () => {
    expect(() => new FocusTrap(null as unknown as HTMLElement)).toThrow()
  })

  it('throws if given a non-Element value', () => {
    expect(
      () => new FocusTrap({} as unknown as HTMLElement),
    ).toThrow()
  })

  it('isActive toggles via activate() and deactivate()', () => {
    const el = document.createElement('div')
    document.body.appendChild(el)

    const trap = new FocusTrap(el, { autofocus: false, returnFocus: false })
    expect(trap.isActive).toBe(false)

    trap.activate()
    expect(trap.isActive).toBe(true)

    trap.deactivate()
    expect(trap.isActive).toBe(false)
  })

  it('destroy() ends the active state (Taxi SPA cleanup contract)', () => {
    const el = document.createElement('div')
    document.body.appendChild(el)

    const trap = new FocusTrap(el, { autofocus: false, returnFocus: false })
    trap.activate()
    trap.destroy()

    expect(trap.isActive).toBe(false)
  })

  it('activate() is idempotent — calling twice does not flip state back', () => {
    const el = document.createElement('div')
    document.body.appendChild(el)

    const trap = new FocusTrap(el, { autofocus: false, returnFocus: false })
    trap.activate()
    trap.activate()
    expect(trap.isActive).toBe(true)

    trap.destroy()
  })
})
