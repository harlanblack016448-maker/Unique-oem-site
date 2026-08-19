# Design TRACE — Unique Scales hybrid

**Rollback:** `git checkout 8b68777 -- oem-landing/ CHANGELOG.md CLAUDE.md` then drop untracked `DESIGN-ibm.md`, `DESIGN-bmw.md`, `oem-landing/design/`.  
**Publish (2026-08-19):** local working copy only. Production https://unique-oem-site.vercel.app is still pre-hybrid.  
**Specs (repo root, not the live site root):**

| Weight | Spec | Path |
| --- | --- | --- |
| 40% | Apple — product photography, whitespace, premium chrome | `../DESIGN-apple.md` |
| 40% | IBM Carbon — B2B IA, specs, OEM process, certs, inquiry | `../DESIGN-ibm.md` |
| 20% | BMW corporate — factory / lab / material photography | `../DESIGN-bmw.md` |

Every visible section carries `data-design` + `data-token`. Tokens below are **source keys**, not invented names.

## Single accent (resolved conflict)

Three specs each ship a blue. This site keeps **one** interactive color so the page does not look like three brands:

| Decision | Token used | Tokens not used on this site |
| --- | --- | --- |
| Accent | Apple `colors.primary` `#0066cc` | IBM `colors.primary` `#0f62fe`, BMW `colors.primary` `#1c69d4` |
| Focus ring | Apple `colors.primary-focus` `#0071e3` | — |
| Link on dark tiles | Apple `colors.primary-on-dark` `#2997ff` | — |
| Form focus rule | IBM treatment (2px bottom underline) | painted with Apple primary, not IBM Blue |

## Zone map

| `#id` / surface | Job in the 30s scan | `data-design` | Source component tokens |
| --- | --- | --- | --- |
| `.utility-bar` | Who / where | ibm | `utility-bar` |
| `.global-nav` | Site chrome — Home / 3 platforms / Contact. About + Capabilities live in the footer and on Home factory CTAs, not as peer destinations | apple | `global-nav` |
| `.sub-nav` (product pages only) | Category + quote | apple | `sub-nav-frosted` |
| `#main` hero | Product thesis | apple | `product-tile-light`, `button-primary`, `button-secondary-pill` |
| `#scan` jump | IBM IA: skip to proof | ibm | `product-tab` / `product-tab-selected` |
| `#data` | Core numbers | ibm + bmw | IBM `feature-card` plate + BMW `spec-cell` |
| `#products` | Three platforms | apple | `store-utility-card` + product shadow |
| `#process` | How OEM works | ibm | `feature-card` sequence (numbered because it is a process) |
| `#factory` | Factory proof (3 stills). Depth: `capabilities.html`. Story: `about.html` | bmw | `hero-band-dark`, `feature-photo-card` |
| `#certs` | Why we are trusted | ibm | `customer-logo-tile` / `resource-tile` |
| `#inquire` | How to buy | ibm | `text-input`, `text-input-focused`, `button-primary` (Carbon square, Apple fill) |
| `footer` | Dense company IA | ibm | `footer` inverse-canvas |

## Token → CSS custom property

CSS variables are prefixed by source (`--apple-*`, `--ibm-*`, `--bmw-*`). Resolved aliases (`--accent`, `--font-primary`) are documented here so a later edit can be traced.

**Type (2026-08-19):** one family sitewide — IBM Plex Sans, with `Noto Sans SC` / `PingFang SC` / `Microsoft YaHei` for Chinese. `--font-product` and `--font-data` alias `--font-primary`. SF Pro is not loaded. Apple 40% is whitespace, product photography, black nav, and pill CTAs — not a second typeface. `html[lang="zh-CN"]` zeroes tracking and sets `p` line-height 1.65.

### Apple (`DESIGN-apple.md` → 40%)

| Spec token | CSS | Used for |
| --- | --- | --- |
| `colors.primary` | `--apple-primary` → `--accent` | All links and marketing CTAs |
| `colors.primary-focus` | `--apple-primary-focus` | `:focus-visible` |
| `colors.primary-on-dark` | `--apple-primary-on-dark` | Links on dark product tiles |
| `colors.ink` | `--apple-ink` | Product headlines |
| `colors.ink-muted-48` | `--apple-ink-muted` | Product subcopy |
| `colors.canvas` | `--apple-canvas` | Light product tiles |
| `colors.canvas-parchment` | `--apple-parchment` | Alternating light tile |
| `colors.surface-tile-1/2/3` | `--apple-tile-1/2/3` | Dark product tiles |
| `colors.surface-black` | `--apple-black` | Global nav |
| `colors.hairline` | `--apple-hairline` | Utility card border |
| `rounded.pill` | `--apple-pill` | Product CTAs only |
| `rounded.lg` | `--apple-r-lg` | Product cards (18px) |
| `rounded.md` | `--apple-r-md` | Product image frames |
| `typography.hero-display` | `.type-hero` (Plex 600 / −0.2px; tracking 0 on `zh-CN`) | Product H1 |
| Product shadow `rgba(0,0,0,0.22) 3px 5px 30px` | `--apple-product-shadow` | Product renders only |

### IBM (`DESIGN-ibm.md` → 40%)

| Spec token | CSS | Used for |
| --- | --- | --- |
| `colors.ink` | `--ibm-ink` | Process / form / cert type |
| `colors.ink-muted` | `--ibm-ink-muted` | Meta, helper |
| `colors.ink-subtle` | `--ibm-ink-subtle` | Captions |
| `colors.canvas` | `--ibm-canvas` | Default B2B band |
| `colors.surface-1` | `--ibm-surface-1` | Alternate B2B band, inputs |
| `colors.hairline` | `--ibm-hairline` | Card / table rules |
| `colors.inverse-canvas` | `--ibm-inverse` | Footer |
| `colors.inverse-ink` / `inverse-ink-muted` | `--ibm-inverse-ink` / `--ibm-inverse-muted` | Footer type |
| `colors.semantic-error` | `--ibm-error` | Form error |
| `colors.semantic-success` | `--ibm-success` | Form success |
| `typography.body` 16 / 400 | `--font-primary` (was `--font-data`) | Process, certs, form |
| `typography.display-md` 42 / 300 | `.type-ibm-display` + `tabular-nums` | Data numerals |
| `rounded.none` | `--ibm-radius` 0 | Process cards, inputs, form CTA, cert tiles |
| `utility-bar` 32px / surface-1 | `.utility-bar` | Top ribbon |
| `text-input` + focused 2px underline | `.ibm-field` | Inquiry form |
| Carbon 4px grid / max ~1312–1584 | `.container` | B2B bands |

### BMW (`DESIGN-bmw.md` → 20%)

| Spec token | CSS | Used for |
| --- | --- | --- |
| `colors.surface-dark` | `--bmw-navy` | Factory / lab band only |
| `colors.surface-dark-elevated` | `--bmw-navy-elev` | Hovered factory plate |
| `colors.surface-card` | `--bmw-card` | Material photo plates |
| `colors.on-dark` / `on-dark-soft` | `--bmw-on-dark` / `--bmw-on-dark-soft` | Type on navy |
| `colors.hairline` | `--bmw-hairline` | Photo plate rules |
| `hero-band-dark` | `.bmw-band` | Factory section |
| `feature-photo-card` | `.bmw-photo-card` | Line / lab shots |
| `spec-cell` | `.spec-cell` | Big number + label |
| `label-uppercase` 13 / 700 / 1.5px | `.bmw-label` | Factory eyebrows only |
| `rounded.none` | photos have 0 radius | Manufacturing frames |
| Photography: no drop-shadow | factory imgs have no `--apple-product-shadow` | Depth from navy vs photo |

BMW Type Next Latin is licensed. Factory labels use **IBM Plex Sans 600** with BMW tracking (`letter-spacing: 1.5px; text-transform: uppercase`) — the only remaining non-zero display tracking, and it is still Plex, not a third family.

## What each spec is forbidden to do here

- Apple does **not** own process cards, cert tiles, or the form (those stay square / Carbon).
- IBM Blue is **not** painted anywhere.
- BMW Blue, M tricolor, and 700-weight display headlines are **not** used. Navy is factory-only.
- Product shadow is **never** applied to factory photos, cards, or buttons.

## Copy / facts

Company numbers follow *Company Profile 20260422.pptx* (same contract as `CLAUDE.md`): 12M+ capacity, DEXA 0.97, 306 patents, 400+ hardware, 100+ countries. Legal name 深圳市乐福衡器有限公司.

## Iteration notes (browser-verified 2026-08-19)

- `.scan-nav` is sticky under Apple `global-nav` on desktop; **hidden below 672px** so it does not stack with the mobile hamburger + sticky quote bar.
- IBM `utility-bar` is injected on B2B pages only. Product pages (`8` / `k` / `b`) keep Apple `sub-nav-frosted` and skip the ribbon — two chrome bars on a product hero felt like a third brand.
- Matrix photos use `object-fit: cover` on an Apple parchment plate so portrait lifestyle shots are not letterboxed.
- Inquiry is a two-column IBM plate (form + response-time aside), not a 720px orphan on a gray field.
- Homepage cert tiles are flex 12.5% so a 17th mark (JATE) does not open an empty eight-column row.
- **IA (2026-08-19):** Home owns the OEM pitch (product, numbers, process, 3 factory frames, certs, inquire). Primary nav is Home / 8-Electrode / Kitchen / Bathroom / Contact. About = company identity (mission, timeline, 2024 ops, coverage). Capabilities = org + unified line/lab stills + station list + partners. Both depth pages are footer + in-page CTA only.
- Factory / lab stills on Home and Capabilities are the same cool 16:9 set (`studio-line`, `studio-calibrate`, `studio-chamber`, `studio-drop`). Phone snapshots `prodline_*.jpg` are not shown in those bands.
- Accuracy: homepage **0.97** is the Company Profile / Beijing Sport University vs-DEXA figure. The CF597 / CF661 / CF625 file (`assets/docs/CF597_CF661_CF625_DEXA_Inbody_Correlation_EN.pdf`) is a separate comparison (overall r = 0.987 vs InBody 270 / 570 and hospital DEXA). Do not collapse the two into one unlabeled number.
