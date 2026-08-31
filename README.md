# Unique Scales — OEM/ODM website

Bilingual (English / 中文) static site for **Shenzhen Unique Scales Co., Ltd.** (乐福衡器). For overseas OEM/ODM buyers. No build step, no backend.

Visual system is a documented hybrid — **40% Apple** (product photography, whitespace, black nav, pill CTAs) + **40% IBM Carbon** (data, OEM process, certs, inquiry form) + **20% BMW** (factory / lab plates). One typeface: **IBM Plex Sans** (`--font-primary`). Token map: [`design/TRACE.md`](design/TRACE.md). Design specs live in the parent Workbuddy folder (`DESIGN-apple.md`, `DESIGN-ibm.md`, `DESIGN-bmw.md`) — they are not part of the GitHub site tree.

Nav is **text-only** “Unique Scales” (no graphic logomark). Favicon is a black rounded square + white “U”.

**Production URL:** https://unique-oem-site.vercel.app — chrome / CSS / JS / `index.html` match this folder as of 2026-08-21 (`style.css?v=18`, `partials.js?v=12`). The kitchen-page CK869BLE packshot on this machine is **ahead** of live (complete 1600×957 vs cropped 1012×759) until the next upload.  
**Repo:** https://github.com/harlanblack016448-maker/Unique-oem-site

```bash
python3 -m http.server 8090
```

http://127.0.0.1:8090

This folder is the working copy. Vercel serves the GitHub `main` tree (site root, not wrapped in `oem-landing/`). Upload or push file changes there to redeploy. Preset: **Other**.

## Pages

`index.html` · `about.html` · `capabilities.html` · `contact.html` · `privacy.html` · `404.html` · `products/{8-electrode,kitchen,bathroom}.html`

Shared: `assets/style.css`, `assets/i18n.js`, `assets/partials.js`, `assets/form.js`, `assets/img/`, `assets/docs/` (DEXA/InBody PDF).

LinkedIn Insight Tag partner `9831228` loads from `partials.js`; each page also has the official noscript pixel.

## Edit

| What | Where |
| --- | --- |
| Visible copy (EN + 中文) | `assets/i18n.js` |
| Photos | `assets/img/` (keep names or update `src`) |
| Sales email | `contact.html`, `assets/form.js`, `assets/partials.js`, `assets/i18n.js` |
| Language default | `assets/i18n.js` (`localStorage` key `us_lang`) |

Lead form → FormSubmit `/ajax/` → `hanhan@lefu.cc`. If that fails, `mailto:`.

Partners are text-only until you have written logo permission. Company numbers follow *Company Profile 20260422.pptx* (DEXA **0.97**). The CF597/CF661/CF625 comparison file is a separate **r = 0.987** vs InBody and hospital DEXA — details on `/products/8-electrode.html#accuracy`. Primary nav is Home + three platforms + Contact; About / Capabilities are footer and in-page CTAs. Do not put `logo-unique-official.png` back in the header.

© 2026 Shenzhen Unique Scales Co., Ltd. All rights reserved.
