// i18n.js — EN / 中文 toggle for Unique Scales site
(function(){
  const DICT = { en: window.__US_EN, zh: window.__US_ZH };
  if (!DICT.en || !DICT.zh) {
    console.warn("i18n dictionaries missing");
    return;
  }

  const KEY = "us_lang";
  function getLang(){ return localStorage.getItem(KEY) || "en"; }
  function setLang(l){ localStorage.setItem(KEY, l); apply(); }

  window.__us_dict = DICT;
  window.__us_getLang = getLang;
  window.__us_apply = apply;
  window.__us_setLang = setLang;

  function apply(){
    const lang = getLang();
    document.documentElement.lang = (lang==="zh"?"zh-CN":"en");
    document.querySelectorAll("[data-i18n]").forEach(el=>{
      const k = el.getAttribute("data-i18n");
      const v = DICT[lang][k];
      if (v === undefined) return;
      if (el.tagName === "INPUT" || el.tagName === "TEXTAREA"){
        if (el.placeholder !== undefined) el.placeholder = v;
      } else {
        el.textContent = v;
      }
    });
    document.querySelectorAll("[data-i18n-html]").forEach(el=>{
      const k = el.getAttribute("data-i18n-html");
      const v = DICT[lang][k];
      if (v !== undefined) el.innerHTML = v;
    });
    document.querySelectorAll("[data-i18n-attr]").forEach(el=>{
      const spec = el.getAttribute("data-i18n-attr");
      const [attr,key] = spec.split(":");
      const v = DICT[lang][key];
      if (v !== undefined) el.setAttribute(attr, v);
    });
    document.querySelectorAll("[data-lang]").forEach(b=>{
      b.classList.toggle("active", b.dataset.lang === lang);
    });
    const page = document.body && document.body.dataset.page;
    if (page && DICT[lang]["doc.title."+page]) document.title = DICT[lang]["doc.title."+page];
    const meta = document.querySelector('meta[name="description"]');
    if (meta && page && DICT[lang]["doc.desc."+page]) meta.setAttribute("content", DICT[lang]["doc.desc."+page]);
    const ogt = document.querySelector('meta[property="og:title"]');
    if (ogt && page && DICT[lang]["doc.title."+page]) ogt.setAttribute("content", DICT[lang]["doc.title."+page]);
    const ogd = document.querySelector('meta[property="og:description"]');
    if (ogd && page && DICT[lang]["doc.desc."+page]) ogd.setAttribute("content", DICT[lang]["doc.desc."+page]);
    document.dispatchEvent(new CustomEvent("us:i18n", { detail: { lang } }));
  }

  document.addEventListener("DOMContentLoaded", () => {
    apply();
    const mb = document.querySelector(".menu-btn");
    const nl = document.querySelector(".nav-links");
    if (mb && nl) mb.addEventListener("click", ()=> nl.classList.toggle("open"));
  });

  document.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-lang]");
    if (btn && btn.dataset.lang) setLang(btn.dataset.lang);
  });
})();
