# Testing

## Philosophy

> Prefer the cheapest tier that can prove the behavior. E2E gives the most confidence per test but is slowest and flakiest — reserve it for flows a customer actually sees. When a bug class can only manifest with real Shopify or real SPA navigation, reach for E2E; otherwise, stay cheaper.

## Tier map

| Tier | Tool | Environment | What it tests | Speed |
|---|---|---|---|---|
| 1 — Unit | Vitest | Node (no DOM) | Pure logic, data transforms, helpers | ms |
| 2 — Integration | Vitest | happy-dom | Component lifecycle, DOM behavior with HTML fixtures, mocked Shopify APIs | ~100 ms |
| 3 — E2E | Playwright *(Phase 2)* | Real Chromium against staging theme | Real customer flows + a11y sweep | 10s+ per flow |

## Folder layout

```
_scripts/**/*.test.ts          Colocated Tier 1 + Tier 2 tests
tests/
  e2e/                         Playwright specs (Phase 2+)
  fixtures/
    html/                      Reusable DOM fixtures for Tier 2
    store.json                 Per-project store shape (Phase 2+)
    features.config.ts         Feature flags gating specs (Phase 2+)
  setup/
    vitest.setup.ts            Observer polyfills, global shims
```

Colocated for Vitest — fast source-to-test navigation. Centralized for E2E — shared fixtures + clean CI target.

## Running locally

```
bun run test          # one-shot Tier 1+2 run
bun run test:watch    # watch mode while iterating
bun run test:ui       # Vitest UI (browser reporter)
```

## How CI runs it

- `.github/workflows/test.yml` runs `bun run test` on every PR and on pushes to `main` / `staging`. **Blocking** on PR.
- Phase 2 adds post-staging canary + `staging → main` PR gate for Playwright E2E.

## How to add a Tier 1 test (pure logic)

Create `foo.test.ts` next to `foo.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { doThing } from '@/core/utils/foo'

describe('doThing', () => {
  it('handles the happy path', () => {
    expect(doThing(5)).toBe(10)
  })

  it('handles edge cases', () => {
    expect(doThing(0)).toBe(0)
  })
})
```

## How to add a Tier 2 test (DOM / component)

Create `foo.test.ts` next to `foo.ts`. Seed `document.body.innerHTML` with the markup the component expects, then instantiate:

```ts
import { describe, it, expect, beforeEach } from 'vitest'
import MyComponent from '@/components/myComponent'

describe('MyComponent', () => {
  beforeEach(() => {
    document.body.innerHTML = `<div data-component="my-component"></div>`
  })

  it('destroy() releases listeners', () => {
    const el = document.querySelector('[data-component="my-component"]') as HTMLElement
    const c = new MyComponent(el)
    c.destroy()
    // assert no listeners remain / isActive flipped / etc.
  })
})
```

If the component imports `CartAPI` or another Shopify-runtime module, mock it:

```ts
import { vi } from 'vitest'
vi.mock('@/core/cartAPI', () => ({
  default: { EVENTS: { UPDATE: 'cart:update' }, getCart: vi.fn() },
}))
```

## What NOT to test

- Liquid rendering in isolation — Shopify runs Liquid, not us.
- Shopify's cart API behavior — test **our integration**, not their API.
- Tailwind class output or computed styles — that's a design-review loop.
- Taxi.js internals or `SectionManager` lifecycle — covered transitively by E2E smoke.
- Klaviyo form submission — third-party, out of our control.
- Theme-editor block select/deselect — not user-facing.
- Full customer flow simulation in Tier 2 — push it to Tier 3 (E2E).

## Phase status

- **Phase 1 — Vitest scaffolding** — landed. Config, setup, 3 sample specs (utils × 2, focusTrap), CI workflow, Node 22 alignment.
- **Phase 2 — Playwright + a11y + error-state** — pending.
- **Phase 3 — Expand + document + standardize** — pending.

Full testing brief: `.claude/plans/go-through-the-entire-abundant-candy.md` (local) or ask in PR.
