# Unique Scales — OEM/ODM website

Bilingual (English / 中文) static site for **Shenzhen Unique Scales Co., Ltd.** (乐福衡器). Aimed at overseas OEM/ODM buyers. No build step, no backend.

Local preview:

```bash
python3 -m http.server 8090
```

Open http://127.0.0.1:8090

---

## Repo layout

This folder **is** the site root. Upload or push it as-is — do not wrap it in another `oem-landing/` directory.

```
.
├── index.html
├── about.html
├── capabilities.html
├── contact.html
├── privacy.html
├── 404.html
├── products/
│   ├── 8-electrode.html
│   ├── kitchen.html
│   └── bathroom.html
├── assets/
│   ├── style.css
│   ├── i18n.js
│   ├── partials.js
│   ├── form.js
│   └── img/
├── vercel.json
├── robots.txt
├── sitemap.xml
└── site.webmanifest
```

---

## Upload to GitHub + Vercel

### A. Drag-and-drop (no git)

1. GitHub → **New repository** → name `oem-site` → Public or Private → Create (skip adding a README if the page asks).
2. **Add file → Upload files** → drop **everything in this folder** (keep the same tree). Commit.
3. [vercel.com](https://vercel.com) → Sign up with GitHub → **Add New → Project** → import `oem-site`.
4. Framework Preset: **Other** → **Deploy**.

### B. Command line

```bash
cd /Users/harlan/Grok/outputs/oem-site
git remote add origin https://github.com/YOUR_USER/oem-site.git
git push -u origin main
```

Then import the same repo in Vercel as above.

After a custom domain is attached, replace the paths in `sitemap.xml` with absolute URLs (`https://your-domain.com/...`).

---

## Lead form

The contact form posts to [FormSubmit](https://formsubmit.co) → `hanhan@lefu.cc`.

Activate once on the live site: submit a test inquiry → open the confirmation email → click the link. Later submissions go straight to the inbox.

If the network call fails, the page opens a `mailto:` draft so the lead is not lost.

To change the inbox, edit all of: `contact.html` (`action`), `assets/form.js` (`EMAIL`), `assets/partials.js`, `assets/i18n.js`.

---

## Edit content

| What | Where |
| --- | --- |
| All visible copy (EN + 中文) | `assets/i18n.js` |
| Photos | `assets/img/` (keep filenames, or update `src`) |
| Sales email | `contact.html`, `assets/form.js`, `assets/partials.js`, `assets/i18n.js` |
| Language default | `assets/i18n.js` (saved in `localStorage` as `us_lang`) |

Partners stay text-only until you have written permission to use a brand logo.

Company facts (capacity, patents, DEXA 0.97, coverage) follow *Company Profile 20260422*.

© 2026 Shenzhen Unique Scales Co., Ltd. All rights reserved.
