# Unique Scales — OEM/ODM website

Bilingual (English / 中文) static site for **Shenzhen Unique Scales Co., Ltd.** (乐福衡器). For overseas OEM/ODM buyers. No build step, no backend.

Visual system is a documented hybrid — **40% Apple** (product photography, whitespace, black nav, pill CTAs) + **40% IBM Carbon** (data, OEM process, certs, inquiry form) + **20% BMW** (factory / lab plates). One typeface: **IBM Plex Sans** (`--font-primary`). Token map: [`design/TRACE.md`](design/TRACE.md). Design specs live in the parent Workbuddy folder (`DESIGN-apple.md`, `DESIGN-ibm.md`, `DESIGN-bmw.md`) — they are not part of the GitHub site tree.

Nav is **text-only** “Unique Scales” (no graphic logomark). Favicon is a black rounded square + white “U”.

**Production URL:** https://unique-oem-site.vercel.app — this folder **matches live byte-for-byte** as of 2026-09-01 (`style.css?v=24`, `i18n.js?v=18`, `partials.js?v=17`, `form.js?v=6`, complete 1600×957 CK869BLE packshot). Motion follows the standing contract in [`design/TRACE.md`](design/TRACE.md) → "Motion discipline" (easing tokens only, UI ≤300ms).  
**Repo:** https://github.com/harlanblack016448-maker/Unique-oem-site

## AI chat assistant (chatbot)

Floating assistant on every page (`/api/chat`, `/api/feedback`, `/api/admin`) + admin dashboard at `/admin.html` (token-protected). Zero npm dependencies; LLM via OpenAI-compatible env keys; persistence via Vercel KV (falls back to per-instance memory until connected). **Setup guide: [`SETUP-CHATBOT.md`](SETUP-CHATBOT.md)** — env vars, KV connection, acceptance checklist. Edit FAQ knowledge base in `api/kb.js` (site-public facts only — no UL / prices / exclusivity claims). Bump `chat-widget.js?v=` inside `assets/partials.js` when the widget changes.

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
