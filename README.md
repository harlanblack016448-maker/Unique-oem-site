# Unique Scales — OEM/ODM website

Bilingual (English / 中文) static site for **Shenzhen Unique Scales Co., Ltd.** (乐福衡器). For overseas OEM/ODM buyers. No build step, no backend.

Visual system is a documented hybrid — **40% Apple** (product photography, whitespace, black nav, pill CTAs) + **40% IBM Carbon** (data, OEM process, certs, inquiry form) + **20% BMW** (factory / lab / material plates). Token map: [`design/TRACE.md`](design/TRACE.md). Specs live next to this folder: `DESIGN-apple.md`, `DESIGN-ibm.md`, `DESIGN-bmw.md`.

**Production URL:** https://unique-oem-site.vercel.app — still the pre-hybrid site as of 2026-08-19. This folder is ahead of live.  
**Repo:** https://github.com/harlanblack016448-maker/Unique-oem-site

```bash
python3 -m http.server 8090
```

http://127.0.0.1:8090

This folder is the working copy. Vercel serves the GitHub `main` tree (site root, not wrapped in `oem-landing/`). Upload or push file changes there to redeploy. Preset: **Other**.

## Pages

`index.html` · `about.html` · `capabilities.html` · `contact.html` · `privacy.html` · `404.html` · `products/{8-electrode,kitchen,bathroom}.html`

Shared: `assets/style.css`, `assets/i18n.js`, `assets/partials.js`, `assets/form.js`, `assets/img/`.

LinkedIn Insight Tag partner `9831228` loads from `partials.js`; each page also has the official noscript pixel.

## Edit

| What | Where |
| --- | --- |
| Visible copy (EN + 中文) | `assets/i18n.js` |
| Photos | `assets/img/` (keep names or update `src`) |
| Sales email | `contact.html`, `assets/form.js`, `assets/partials.js`, `assets/i18n.js` |
| Language default | `assets/i18n.js` (`localStorage` key `us_lang`) |

Lead form → FormSubmit → `hanhan@lefu.cc`. First live submit needs the confirmation email. Network failure opens `mailto:`.

Partners are text-only until you have written logo permission. Company numbers follow *Company Profile 20260422.pptx*.

© 2026 Shenzhen Unique Scales Co., Ltd. All rights reserved.
