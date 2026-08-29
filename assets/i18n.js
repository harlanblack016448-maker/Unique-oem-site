// i18n.js — EN / 中文 toggle for Unique Scales site
(function(){
  const DICT = {
    en: { "nav.home":"Home" },
    zh: { "nav.home":"首页" }
  };
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
      el.textContent = v;
    });
  }
  document.addEventListener("DOMContentLoaded", apply);
  document.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-lang]");
    if (btn && btn.dataset.lang) setLang(btn.dataset.lang);
  });
})();
