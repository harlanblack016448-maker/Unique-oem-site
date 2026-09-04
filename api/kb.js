// api/kb.js — FAQ knowledge base for the Unique Scales assistant.
// Every fact below is sourced from the public site (index / capabilities /
// products / contact / privacy) or the official FAQ copy in assets/i18n.js.
// EDIT RULE: only add facts that are already public on the site or confirmed
// in an official quote. Never add UL, prices, or exclusivity claims.
"use strict";

const COMPANY = {
  name: "Shenzhen Unique Scales Co., Ltd.",
  brand: "Unique Scales",
  city: "Longgang District, Shenzhen, China",
  since: "2010",
  email: "hanhan@lefu.cc",
  replyTime: "within 1 business day",
  site: "https://unique-oem-site.vercel.app",
  quoteForm: "https://unique-oem-site.vercel.app/contact.html",
  scaleBrands: "50+ brands across 100+ countries",
  factory:
    "Two fully automated production lines; 18+ in-house test stations and labs covering mechanical, environmental, electrical safety and material compliance.",
};

const KB = [
  {
    id: "company",
    intents: ["product", "other"],
    keywords: ["about", "company", "who are you", "factory", "supplier", "manufacturer", "乐福", "公司", "工厂", "供应商"],
    a: "Shenzhen Unique Scales Co., Ltd. (brand: Unique Scales) is an OEM/ODM smart-scale manufacturer in Longgang District, Shenzhen, China, est. 2010. We serve " + COMPANY.scaleBrands + ". The factory runs " + COMPANY.factory,
  },
  {
    id: "products-8electrode",
    intents: ["product"],
    keywords: ["8-electrode", "8 electrode", "body fat", "body composition", "analyzer", "model", "models", "cf658", "cf577", "cf689", "cf636", "cf625", "cf650", "cf661", "cf687", "cf669", "cf586", "体脂", "八电极", "型号"],
    a: "Our flagship line is 8-electrode body-composition analyzers (BLE or BLE+WiFi). Models in production include CF658 (3.5\" TFT + fingerprint), CF577 (3.5\" TFT + ITO glass), CF689 (4.3\" TFT), CF636 (3.36\" TFT + SUS electrodes), CF625 (4.25\" VA, slim), CF650 (3.14\" LED + SUS plates), CF661 / CF687 (child mode), CF669 and CF586 (LED, slim). Details: " + COMPANY.site + "/products/8-electrode.html",
  },
  {
    id: "products-bathroom-kitchen",
    intents: ["product"],
    keywords: ["bathroom", "kitchen", "food scale", "4-electrode", "glass", "ito", "厨房秤", "浴室秤"],
    a: "Beyond the 8-electrode flagship we make 4-electrode bathroom platforms (glass and ITO, several BOM tiers) for volume retail, plus kitchen/food scales. See " + COMPANY.site + "/products/bathroom.html and /products/kitchen.html",
  },
  {
    id: "accuracy",
    intents: ["product"],
    keywords: ["accuracy", "accurate", "dexa", "inbody", "correlation", "0.97", "0.987", "validation", "precision", "精度", "准确"],
    a: "8-electrode BIA shows 0.97 correlation with DEXA (Beijing Sport University). CF597 / CF661 / CF625 reach r = 0.987 vs InBody 270/570 and hospital DEXA at two Shenzhen hospitals. This is our company comparison file, not a peer-reviewed paper; the PDF is on the product page under \"Accuracy\".",
  },
  {
    id: "certifications",
    intents: ["product", "order"],
    keywords: ["certificate", "certification", "ce", "fcc", "rohs", "rcm", "iso", "smeta", "lfgb", "compliance", "认证", "证书"],
    a: "We ship with CE, FCC, RoHS, RCM, ISO 9001 / 13485 / 14001 / 45001, SMETA, plus material files such as LFGB, DGCCRF, MSDS and 21 CFR 1303. Regional certification packs are specified on the quote. (We do not claim UL.)",
  },
  {
    id: "moq",
    intents: ["order"],
    keywords: ["moq", "minimum", "minimum order", "起订量", "最小起订"],
    a: "Bathroom and kitchen platforms start at 1,000 units. For the 8-electrode line, first orders can start at 500 units, by negotiation.",
  },
  {
    id: "oem-odm",
    intents: ["order"],
    keywords: ["oem", "odm", "private label", "custom", "branding", "logo", "packaging", "贴牌", "定制", "打样"],
    a: "Yes — OEM to your spec, or ODM from our existing platforms: your brand, packaging, color IDs, and a custom-branded Unique Health app if you need it. Share your market, volume and target price and sales will confirm what's possible: " + COMPANY.quoteForm,
  },
  {
    id: "app",
    intents: ["product", "technical"],
    keywords: ["app", "unique health", "apple health", "google fit", "fitbit", "harmonyos", "bluetooth", "wifi", "应用", "app"],
    a: "The Unique Health App runs on iOS / Android / HarmonyOS and syncs with Apple Health, Google Fit and Fitbit. Scales connect via BLE (WiFi on BLE+WiFi models). For OEM projects a custom-branded app is available.",
  },
  {
    id: "lead-time",
    intents: ["order"],
    keywords: ["lead time", "how long", "delivery", "production time", "交期", "货期", "多久"],
    a: "Production lead time is quoted per model and volume — I don't want to guess a number. Inquiries are answered within 1 business day; share your model and target volume and sales will give you the exact schedule.",
  },
  {
    id: "response",
    intents: ["other"],
    keywords: ["contact", "email", "reply", "reach you", "human", "sales", "联系", "邮箱", "人工"],
    a: "You can reach the team at " + COMPANY.email + " or via the quote form " + COMPANY.quoteForm + " — inquiries are answered " + COMPANY.replyTime + ".",
  },
  {
    id: "8-vs-4",
    intents: ["product"],
    keywords: ["8 vs 4", "why 8", "segmental", "electrode difference", "八电极", "区别"],
    a: "Four foot electrodes are enough for a bathroom weight-and-estimate scale. Eight electrodes (handle + platform) measure segmental fat and muscle — that's the flagship body-composition line for gyms, clinics and serious retail programs.",
  },
  {
    id: "specs-example",
    intents: ["product"],
    keywords: ["spec", "specs", "dimensions", "size", "cf658", "carton", "规格", "尺寸"],
    a: "Example — CF658BLE+WiFi: 386 x 360 x 36 mm; 3.5\" TFT; BLE + 2.4G/5G WiFi; 8 electrodes; app: Unique Health (Apple Health / Google Fit / Fitbit); carton 450 x 395 x 488 mm (5 pcs), N.W. 13.5 kg / G.W. 14.1 kg.",
  },
  {
    id: "samples",
    intents: ["order"],
    keywords: ["sample", "samples", "样品"],
    a: "Sample units can be arranged for serious OEM/ODM projects. Sample cost and lead time are confirmed by sales per model — tell me the model you're interested in, or leave your email and sales will follow up " + COMPANY.replyTime + ".",
  },
  {
    id: "programs",
    intents: ["product"],
    keywords: ["gym", "clinic", "studio", "retail", "program", "健身房", "诊所", "零售"],
    a: "Buyers spec the same platform four ways: gym/studio programs (segmental fat & muscle), clinic & sports-science programs (BIA correlated with DEXA in company files; no diagnostic claims), volume retail (4-electrode glass/ITO platforms), and private label.",
  },
  {
    id: "privacy",
    intents: ["technical", "other"],
    keywords: ["privacy", "data", "gdpr", "security", "隐私", "数据"],
    a: "Measurement data is processed by the Unique Health App according to its privacy policy. Our site privacy policy is at " + COMPANY.site + "/privacy.html. For compliance documents (e.g. EU Data Act transparency) a human colleague can help — leave your email.",
  },
  {
    id: "regional",
    intents: ["order", "other"],
    keywords: ["distributor", "exclusive", "territory", "region", "agent", "代理", "区域"],
    a: "Territory and distribution arrangements vary by model and market — a human colleague should answer that one properly. Share your email and market and sales will follow up " + COMPANY.replyTime + ".",
  },
  {
    id: "warranty",
    intents: ["technical"],
    keywords: ["warranty", "guarantee", "repair", "after-sales", "after sales", "保修", "售后"],
    a: "Warranty terms are specified per order agreement. For after-sales or repairs, please leave your model, purchase channel and issue details — a human colleague will follow up.",
  },
  {
    id: "price",
    intents: ["order"],
    keywords: ["price", "pricing", "cost", "quotation", "quote", "how much", "价格", "报价"],
    a: "Pricing depends on model, configuration, volume and the certification pack, so it goes through a formal quote — sales replies " + COMPANY.replyTime + ". Fastest way: the quote form " + COMPANY.quoteForm + " (or leave your email here and I'll pass it on).",
  },
  {
    id: "technical-troubleshoot",
    intents: ["technical"],
    keywords: ["not working", "error", "pair", "connect", "battery", "firmware", "sync", "无法", "连接", "故障"],
    a: "Quick checks: fresh batteries, Bluetooth on, and re-pair the scale in the Unique Health app (device settings), then update firmware in-app if offered. If it still fails, tell me the model, app version and purchase channel — I'll hand it to a human colleague.",
  },
  {
    id: "shipping",
    intents: ["order"],
    keywords: ["shipping", "fob", "exw", "cif", "container", "freight", "海运", "运输"],
    a: "Shipping terms (EXW / FOB / CIF), consolidation and container loading are confirmed on the quote — I'd rather not guess. Leave your destination port and volume and sales will include it in the quotation.",
  },
];

module.exports = { COMPANY, KB };
