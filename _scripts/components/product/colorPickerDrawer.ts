import Drawer from '@/components/drawer'

const selectors = {
  card: '[data-color-picker-select]',
  // The variant-picker-option snippet tags color radios with `.color-radio`
  // — robust against the merchant renaming the option (e.g. "Colour" or
  // a translated label) since we're not matching by the input's `name` attr.
  colorRadio: 'input.color-radio'
}

/**
 * Color Picker Drawer
 * --------------------------------------------------------------------------
 * Right-side drawer that lists every available color for a PDP. Opens when
 * the user clicks the "All N Colors +" trigger in the variant picker.
 *
 * Behavior:
 * - Toggle via any trigger element with `aria-controls` matching the drawer id
 *   (handled by the base Drawer class)
 * - Close via the header [data-close] button or the backdrop
 *   (handled by the base Drawer class)
 * - On color card click: locate the matching color radio in the variant
 *   picker, mark it `checked`, and dispatch a native `change` event. That
 *   event bubbles through `VariantPickerOption` → `VariantPicker` →
 *   `ProductDetailForm.onVariantChange` and updates everything (price, ATC
 *   button, gallery, URL, selected-color label) for free.
 */
export default class ColorPickerDrawer extends Drawer {
  static TYPE = 'color-picker-drawer'

  #onCardClick: (e: MouseEvent) => void

  constructor(el: HTMLElement) {
    super(el, { backdrop: true })

    this.#onCardClick = this.onCardClick.bind(this)
    this.el.addEventListener('click', this.#onCardClick)
  }

  destroy() {
    this.el.removeEventListener('click', this.#onCardClick)
    super.destroy()
  }

  onCardClick(e: MouseEvent) {
    const target = e.target as HTMLElement
    const card = target.closest(selectors.card) as HTMLButtonElement | null
    if (!card || card.disabled) return

    const color = card.dataset.color
    if (!color) return

    const radios = document.querySelectorAll<HTMLInputElement>(selectors.colorRadio)
    const match = Array.from(radios).find(r => r.value === color)

    if (match && !match.checked) {
      match.checked = true
      match.dispatchEvent(new Event('change', { bubbles: true }))
    }

    this.close()
  }
}
