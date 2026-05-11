import BaseComponent from '@/components/base'
import { setConsent, hasDecided, type ConsentChoice } from './consent'

const selectors = {
  action: '[data-cookie-action]',
  customize: '.cookie-banner__customize'
}

const classes = {
  visible: 'is-visible'
}

/**
 * Cookie Banner
 * --------------------------------------------------------------------------
 * Bottom-right card on desktop, full-width-bottom on mobile. Surfaces on the
 * first visit when the user hasn't made a consent decision yet.
 *
 * Buttons:
 *   - "Accept" → grants analytics + marketing, hides banner
 *   - "Decline" → denies analytics + marketing, hides banner
 *   - "Customize" → opens the cookie drawer (handled via aria-controls)
 *
 * Visibility is gated by `hasDecided()` from the consent module — once a
 * choice is recorded (via banner OR drawer), the banner stays hidden until
 * the user reopens the drawer from the footer.
 */
export default class CookieBanner extends BaseComponent {
  static TYPE = 'cookie-banner'

  #onClick: (e: MouseEvent) => void
  #onConsentChange: () => void

  constructor(el: HTMLElement) {
    super(el)

    this.#onClick = this.onClick.bind(this)
    this.#onConsentChange = this.onConsentChange.bind(this)

    this.el.addEventListener('click', this.#onClick)
    document.addEventListener('cookie-consent:change', this.#onConsentChange)

    // Show after a tick if the user hasn't decided yet.
    // requestAnimationFrame so the slide-in transition runs smoothly after layout.
    if (!hasDecided()) {
      requestAnimationFrame(() => this.show())
    }
  }

  destroy() {
    this.el.removeEventListener('click', this.#onClick)
    document.removeEventListener('cookie-consent:change', this.#onConsentChange)
    super.destroy()
  }

  show() {
    this.el.hidden = false
    // Force layout flush before adding the class so transition runs from hidden state
    void this.el.offsetHeight
    this.el.classList.add(classes.visible)
  }

  hide() {
    this.el.classList.remove(classes.visible)
    // Match transition duration (250ms exit). Re-hide via `hidden` after transition
    // so the banner is fully removed from the a11y tree.
    setTimeout(() => {
      if (!this.el.classList.contains(classes.visible)) {
        this.el.hidden = true
      }
    }, 300)
  }

  onClick(e: MouseEvent) {
    const target = e.target as HTMLElement
    const action = target.closest<HTMLElement>(selectors.action)
    if (!action) return

    const choice = action.dataset.cookieAction as ConsentChoice | undefined
    if (choice === 'accept-all' || choice === 'reject-all') {
      e.preventDefault()
      setConsent(choice)
    }
    // 'customize' is left to bubble — the aria-controls on the button opens the drawer
  }

  onConsentChange() {
    // Whether banner or drawer set the consent, hide the banner once a decision is made
    if (hasDecided()) {
      this.hide()
    }
  }
}
