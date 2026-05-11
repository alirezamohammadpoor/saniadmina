/**
 * Consent module — single source of truth for cookie consent state.
 * --------------------------------------------------------------------------
 * Wraps Shopify's Customer Privacy API
 * (https://shopify.dev/docs/api/customer-privacy) so analytics + marketing
 * pixels are gated automatically. Falls back to localStorage when the Shopify
 * API isn't available (e.g. theme dev environment without storefront).
 *
 * The single decision flag is stored in localStorage so we know whether to
 * show the banner on next visit. Shopify's own cookie set is the source of
 * truth for what tracking is allowed.
 */

const STORAGE_KEY = 'sania:cookie-consent-decided'
const EVENT = 'cookie-consent:change'

export interface CategoryConsent {
  analytics: boolean
  marketing: boolean
}

export type ConsentChoice = 'accept-all' | 'reject-all' | CategoryConsent

interface ShopifyCustomerPrivacy {
  setTrackingConsent(
    consent: {
      analytics?: boolean
      marketing?: boolean
      preferences?: boolean
      sale_of_data?: boolean
    },
    callback?: (err?: unknown) => void
  ): void
  currentVisitorConsent?(): {
    analytics: 'yes' | 'no' | ''
    marketing: 'yes' | 'no' | ''
    preferences?: 'yes' | 'no' | ''
    sale_of_data?: 'yes' | 'no' | ''
  }
  shouldShowGDPRBanner?(): boolean
}

declare global {
  interface Window {
    Shopify?: {
      customerPrivacy?: ShopifyCustomerPrivacy
    }
  }
}

/**
 * Has the user made a decision yet (via banner or drawer)?
 * Used to gate banner visibility on first paint.
 */
export function hasDecided(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === '1'
  }
  catch {
    return false
  }
}

/**
 * Read the current consent state. Prefers Shopify's API if available,
 * falls back to localStorage.
 */
export function getConsent(): CategoryConsent {
  const cp = window.Shopify?.customerPrivacy
  if (cp?.currentVisitorConsent) {
    try {
      const c = cp.currentVisitorConsent()
      return {
        analytics: c.analytics === 'yes',
        marketing: c.marketing === 'yes'
      }
    }
  catch {
      // fall through to localStorage
    }
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY + ':state')
    if (!raw) return { analytics: false, marketing: false }
    const parsed = JSON.parse(raw)
    return {
      analytics: !!parsed.analytics,
      marketing: !!parsed.marketing
    }
  }
  catch {
    return { analytics: false, marketing: false }
  }
}

/**
 * Apply a consent choice. Updates Shopify's tracking consent, persists the
 * decision flag, and dispatches a `cookie-consent:change` event so the banner
 * can hide and other components can react.
 */
export function setConsent(choice: ConsentChoice): void {
  let state: CategoryConsent
  if (choice === 'accept-all') {
    state = { analytics: true, marketing: true }
  }
  else if (choice === 'reject-all') {
    state = { analytics: false, marketing: false }
  }
  else {
    state = { ...choice }
  }

  // Push to Shopify Customer Privacy API
  const cp = window.Shopify?.customerPrivacy
  if (cp?.setTrackingConsent) {
    try {
      cp.setTrackingConsent(
        {
          analytics: state.analytics,
          marketing: state.marketing,
          preferences: state.analytics, // pair preferences with analytics consent
          sale_of_data: state.marketing
        },
        () => {
          // No-op; errors are logged below if the call throws synchronously
        }
      )
    }
    catch (err) {
      console.warn('[cookie-consent] Shopify customerPrivacy.setTrackingConsent failed', err)
    }
  }

  // Persist the decision flag + state for next visit
  try {
    localStorage.setItem(STORAGE_KEY, '1')
    localStorage.setItem(STORAGE_KEY + ':state', JSON.stringify(state))
  }
  catch {
    // ignore quota / privacy mode failures
  }

  // Notify other components
  document.dispatchEvent(new CustomEvent(EVENT, { detail: state }))
}
