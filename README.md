# Unique Scales — OEM/ODM Website

A bilingual (English / 中文) static marketing site for Shenzhen Unique Scales Co., Ltd., focused on overseas OEM/ODM customer acquisition. Built as plain HTML/CSS/JS — no build step, no backend.

## Structure

```
oem-landing/
├── index.html              # Home (hero, products, services, why us, certs)
├── about.html              # Company story + timeline + KPIs + IP/R&D/privacy
├── capabilities.html       # Org chart + labs + production lines + partners
├── contact.html            # Lead-collection form (FormSubmit → hanhan@lefu.cc)
├── products/
│   ├── 8-electrode.html    # Flagship 8-electrode body composition (DEXA 0.97)
│   ├── kitchen.html        # Kitchen & nutrition scales + IoT
│   └── bathroom.html       # Bathroom scales
└── assets/
    ├── style.css           # Design system
    ├── i18n.js             # EN/中文 dictionary + toggle (localStorage)
    ├── partials.js         # Shared nav + footer injection
    ├── form.js             # Lead form handler + dynamic volume options
    └── img/                # Product photos (catalog) + production-line photos (PPT)
```

## Deploy to Vercel (beginner, no git commands)

1. Create a GitHub account → New repository → name it `oem-site` → Public → Add a README → Create.
2. In the repo: **Add file → Upload files** → drag the **contents** of this `oem-landing` folder in (keep the folder structure). Commit.
3. Go to vercel.com → **Sign Up → Continue with GitHub**.
4. **Add New → Project** → find `oem-site` → **Import**.
5. Framework Preset: **Other** → **Deploy**. Done in ~30s.

## Lead form: receive inquiries in your inbox (no signup needed)

The contact form posts to [FormSubmit.co](https://formsubmit.co) — **free, no account, no registration**. It's already wired to `hanhan@lefu.cc`.

**First-time activation (do this once):**
1. Open the live site → go to the Contact page → submit a test inquiry.
2. FormSubmit sends a **confirmation email** to `hanhan@lefu.cc`. Open it and click the confirm link.
3. Done. Every future submission lands directly in your inbox — no further setup.

To change the recipient email, edit the `action` URL in `contact.html` (and the `EMAIL` constant in `assets/form.js`). If the network call ever fails, the form automatically falls back to opening the visitor's email client addressed to `hanhan@lefu.cc`, so no lead is lost.

## Customize

- **Company contact:** the sales email `hanhan@lefu.cc` appears in `contact.html`, `assets/form.js`, `assets/partials.js`, and `assets/i18n.js`.
- **Text:** every translatable string lives in `assets/i18n.js` under the `en` and `zh` dictionaries, keyed by `data-i18n`.
- **Product photos:** replace files in `assets/img/` (keep the same filenames, or update the `src` paths).
- **Language default:** `assets/i18n.js` defaults to English; the toggle remembers the visitor's choice.

## Notes

- Content sourced from two official documents: the product catalog "Shenzhen Unique Scales — all kinds of products (260414).pdf" and "Company Profile 20260422.pptx". Company facts (capacity, IP, DEXA correlation, global coverage) follow the PPT as the authoritative source.
- Product emphasis: 8-electrode body composition (flagship) → kitchen & nutrition (core) → bathroom (volume).
- Partners section is text-only by design — no third-party logos are shipped, to avoid trademark-usage issues. Add a logo only after written authorization from that brand.
- Lead form posts to FormSubmit.co (`hanhan@lefu.cc`); first submission triggers a one-time confirmation email. `form.js` falls back to `mailto:` if the network call fails.
