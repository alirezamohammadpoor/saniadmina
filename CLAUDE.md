# Sania D'Mina — Shopify Theme

Spec work redesign of saniadmina.com — Swedish luxury shoe brand, handmade in Italy, SEK 5,600–13,200 price range. Portfolio case study targeting Grebban.

## Stack

- **Platform:** Shopify Online Store 2.0
- **Boilerplate:** cadaver-2.0 (kept architecture, stripped branding)
- **CSS:** Tailwind V4 (via `_styles/app.css`)
- **JS:** TypeScript, Vite, Taxi.js (SPA navigation)
- **Architecture:** Section/component pattern — sections registered in `_scripts/app.ts`, components auto-init via `data-component` attributes

## Figma

- File: https://www.figma.com/design/xCLRBen7fd1LIpnnNaU5wu/Sania
- All templates complete: Homepage, PDP, PLP (mobile + desktop)

## Design System

### Colors (3 tokens, monochrome — code-owned in `_styles/app.css`, not theme settings)

| Token | Hex | Usage |
|---|---|---|
| bg | #FAFAF9 | Page background |
| fg | #1A1A18 | Text, borders, icons |
| muted | #75736E | Secondary text, labels (WCAG AA on bg, 4.7:1) |

### Typography (system Helvetica Neue / Helvetica / Arial)

| Role | Size | Weight | Notes |
|---|---|---|---|
| Display | 48px | 300 | — |
| H1 | 40px | 400 | — |
| H2 | 28px | 400 | — |
| H3 | 20px | 400 | — |
| Body | 16px | 400 | line-height 150% |
| Label | 12px | 500 | Uppercase, tracking 0.08em |

### Rules

- **Always use Tailwind classes for styling. Never write raw CSS.** The only exception is the existing `_product.css` hover swap which predates this rule.
- **Always use `const`/`let` and arrow functions in JavaScript. Never use `var`.**
- No accent colors. No shadows. No border radius.
- Labels/nav/tags: uppercase + letter-spaced
- Depth via whitespace and weight contrast only
- Hierarchy through color (muted vs fg), not weight/size changes on headings

### Layout

- 8px container padding (mobile and desktop)
- 24px section spacing mobile, 40px desktop
- 3:4 image ratio on product cards
- 4:5 image ratio on PDP gallery

## Data Contracts

- **Swatches:** Shopify native `option.values[].swatch`, color option named "Color"
- **Gallery mapping:** `image.alt` = color name (existing cadaver pattern)
- **Product tags:** `badge:best-seller`, `badge:new` prefix convention
- **Editorial images (PLP):** Collection metafield `custom.editorial_images`
- **Heel height:** Product metafield `custom.heel_height_mm`
- **As seen on:** Product metafield `custom.as_seen_on` (JSON list)
- **Size toggle:** EU default, US/UK from shop metafields `shop.metafields.custom.sizes_us`, `shop.metafields.custom.sizes_uk` (type: `list.single_line_text_field`)
- **Copy:** "Add to bag" (not "Add to cart"), "Bag" (not "Cart"), "Checkout"

## Key Architecture Notes

- Global sections (header, footer, mobile-menu, ajax-cart) are registered in `_scripts/app.ts` lines 44–47. Keep `data-section-type` and `data-component` attributes intact when restyling.
- `config/settings_data.json` must have section defaults for all global sections or pages break.
- Design tokens are code-owned in `_styles/app.css` `@theme` block — not exposed as theme editor settings.
- Locale strings in `locales/en.default.json`, exported to JS via `snippets/head-scripts.liquid` → `window.app.strings`.
- **Never use inline `<script>` in any Liquid file (sections or snippets) for interactive behavior.** Taxi.js SPA navigation does not re-execute inline scripts after page transitions — they fire once on full load and then never again. `window.__xxxInit` guards make this worse by blocking re-init entirely. All event listeners and DOM behavior must live in TypeScript components (`_scripts/components/`), extended from `BaseComponent`, wired in `constructor()` and cleaned up in `destroy()`. Register standalone components in `app.ts`. The header menu script in `sections/header.liquid` is existing legacy debt — do not copy that pattern.

## Product Range

14 models, 57 SKUs: Heels (CARLA 7, ELENA, PERLINO), Sandals (GIANNA, DUN, YUNA, BONDI, VENUS), Boots (AVENUE HIGH/MID, CHER, ROE). All sizes EU 35–43.5.

## Build

```
bun run dev                  # Vite dev (asset bundle, watch mode)
bun run build                # Production build
shopify theme dev -e dev     # Local preview on an ephemeral dev theme
```

**Always pass `-e <env>`** to any `shopify theme` command. Without it, the CLI falls back to its last-used-store cache and may target a different project entirely (silently). Environments are defined in `shopify.theme.toml`.

## Deploy

GitHub-native: Shopify auto-syncs branches to themes — no CLI push, no GitHub Actions deploy workflow.

```
git push origin staging      # → auto-deploys to draft theme `saniadmina/staging` (158043832572)
git push origin main         # → auto-deploys to draft theme `saniadmina/main` (158043799804)
```

To go live: in Shopify admin, click **Publish** on `saniadmina/main`. The previously-live theme moves to the theme library (one-click rollback if needed).

CI still runs `.github/workflows/test.yml` on every PR (blocking on Tier 1+2 tests). E2E (Phase 2) will hook into post-deploy via the Shopify GitHub-sync completion, not via a dedicated deploy workflow.

## Workflow

**Always ask for review before committing or opening PRs.** Even in auto mode, do not run `git commit` or `gh pr create` until you've shown the user:
- A concise summary of the changes (file list + brief per-file description, or `git diff --stat` for larger changes)
- The proposed commit message and/or PR title + body

Wait for an explicit affirmative ("yes", "go", "ship it", "looks good") before proceeding. If the user wants changes, iterate first. Auto mode does not bypass this — explicit confirmation is the rule even during autonomous execution.

Local file edits, reads, builds, and tests do not need this gate. Pushing a branch is fine if it's just to back up the work, but a PR-creating push (`-u` to a new remote branch followed by `gh pr create`) requires the same review handshake.
