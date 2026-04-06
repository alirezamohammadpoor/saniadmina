import BaseComponent from '@/components/base'

export default class ProductInfoModal extends BaseComponent {
  static TYPE = 'product-info-modal'

  backdrop: HTMLElement | null
  panel: HTMLElement | null
  tabs: HTMLElement[]
  panels: HTMLElement[]

  constructor(el: HTMLElement) {
    super(el)

    this.backdrop = this.qs('[data-modal-backdrop]')
    this.panel = this.qs('[data-modal-panel]')
    this.tabs = this.qsa('[data-info-tab]') as HTMLElement[]
    this.panels = this.qsa('[data-info-panel]') as HTMLElement[]

    this.el.addEventListener('click', this.onClick.bind(this))
    document.addEventListener('keydown', this.onKeydown.bind(this))
  }

  open(tabId?: string) {
    if (tabId) this.switchTab(tabId)

    this.el.classList.remove('pointer-events-none')
    this.backdrop?.classList.add('opacity-100')
    this.backdrop?.classList.remove('opacity-0')
    this.panel?.classList.remove('translate-x-full')
    this.panel?.classList.add('translate-x-0')
  }

  close() {
    this.backdrop?.classList.remove('opacity-100')
    this.backdrop?.classList.add('opacity-0')
    this.panel?.classList.add('translate-x-full')
    this.panel?.classList.remove('translate-x-0')

    setTimeout(() => {
      this.el.classList.add('pointer-events-none')
    }, 300)
  }

  switchTab(id: string) {
    this.tabs.forEach(t => {
      const isActive = t.dataset.infoTab === id
      t.classList.toggle('font-medium', isActive)
      t.classList.toggle('text-fg', isActive)
      t.classList.toggle('font-normal', !isActive)
      t.classList.toggle('text-muted', !isActive)
    })

    this.panels.forEach(p => {
      p.classList.toggle('hidden', p.dataset.infoPanel !== id)
    })
  }

  onClick(e: Event) {
    const target = e.target as HTMLElement

    const tab = target.closest('[data-info-tab]') as HTMLElement
    if (tab) {
      this.switchTab(tab.dataset.infoTab!)
      return
    }

    if (target.closest('[data-modal-close]')) {
      this.close()
      return
    }

    if (target.hasAttribute('data-modal-backdrop')) {
      this.close()
    }
  }

  onKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape' && !this.el.classList.contains('pointer-events-none')) {
      this.close()
    }
  }
}
