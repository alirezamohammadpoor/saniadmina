import Drawer from '@/components/drawer'
import { setConsent, getConsent, hasDecided, type CategoryConsent } from './consent'

const selectors = {
  action: '[data-cookie-action]',
  category: '[data-cookie-category]'
}

/**
 * Cookie Preferences Drawer
 * --------------------------------------------------------------------------
 * Right-side drawer offering granular cookie consent by category. Reuses the
 * Drawer base class for open/close/focus-trap/backdrop behavior. Triggered by:
 *   - Banner "Customize" button (via aria-controls)
 *   - Footer "Cookie settings" link (via aria-controls)
 *
 * Categories: Analytics, Marketing. Necessary is always-on (no toggle).
 *
 * Footer actions:
 *   - "Accept all" → analytics + marketing on
 *   - "Save preferences" → use current toggle state
 *   - "Reject all" → analytics + marketing off
 */
export default class CookieDrawer extends Drawer {
  static TYPE = 'cookie-drawer'

  #onClick: (e: MouseEvent) => void

  constructor(el: HTMLElement) {
    super(el, { backdrop: true })

    this.#onClick = this.onDrawerClick.bind(this)
    this.el.addEventListener('click', this.#onClick)

    // Hydrate toggles from any existing consent state
    this.syncTogglesFromConsent()
  }

  destroy() {
    this.el.removeEventListener('click', this.#onClick)
    super.destroy()
  }

  open() {
    // Re-sync each open in case consent was changed elsewhere
    this.syncTogglesFromConsent()
    super.open()
  }

  syncTogglesFromConsent() {
    if (!hasDecided()) return
    const consent = getConsent()
    this.el.querySelectorAll<HTMLInputElement>(selectors.category).forEach((input) => {
      const category = input.dataset.cookieCategory as keyof CategoryConsent | undefined
      if (category && category in consent) {
        input.checked = !!consent[category]
      }
    })
  }

  readToggleState(): CategoryConsent {
    const state: CategoryConsent = { analytics: false, marketing: false }
    this.el.querySelectorAll<HTMLInputElement>(selectors.category).forEach((input) => {
      const category = input.dataset.cookieCategory as keyof CategoryConsent | undefined
      if (category && category in state) {
        state[category] = input.checked
      }
    })
    return state
  }

  onDrawerClick(e: MouseEvent) {
    const target = e.target as HTMLElement
    const action = target.closest<HTMLElement>(selectors.action)
    if (!action) return

    const choice = action.dataset.cookieAction
    e.preventDefault()

    switch (choice) {
      case 'accept-all':
        setConsent('accept-all')
        this.close()
        break
      case 'reject-all':
        setConsent('reject-all')
        this.close()
        break
      case 'save-preferences':
        setConsent(this.readToggleState())
        this.close()
        break
    }
  }
}
