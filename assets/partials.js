// partials.js — inject shared global nav and footer across pages
(function(){
  const NAV = `
<a href="/index.html" class="brand">Unique Scales</a>
<button class="menu-btn-global" aria-label="Menu">☰</button>
<div class="global-nav-links">
  <a href="/index.html" data-nav="home" data-i18n="nav.home">Home</a>
  <a href="/products/8-electrode.html" data-nav="8" data-i18n="nav.eight">8-Electrode</a>
  <a href="/products/kitchen.html" data-nav="k" data-i18n="nav.kitchen">Kitchen Scales</a>
  <a href="/products/bathroom.html" data-nav="b" data-i18n="nav.bathroom">Bathroom Scales</a>
  <a href="/about.html" data-nav="about" data-i18n="nav.about">About</a>
  <a href="/capabilities.html" data-nav="cap" data-i18n="nav.cap">Capabilities</a>
  <a href="/contact.html" data-nav="contact" data-i18n="nav.contact">Contact</a>
  <div class="lang-toggle-global">
    <button data-lang="en">EN</button>
    <button data-lang="zh">中文</button>
  </div>
</div>`;

  const FOOT = `
<div class="container">
  <div class="foot-grid">
    <div>
      <h4>Shenzhen Unique Scales Co., Ltd.</h4>
      <p style="color:var(--ink-muted-48);font-size:14px;letter-spacing:-0.224px" data-i18n="footer.address">Longgang District, Shenzhen, China</p>
      <p style="color:var(--ink-muted-48);font-size:14px;margin-top:6px;letter-spacing:-0.224px">hanhan@lefu.cc</p>
    </div>
    <div>
      <h4 data-i18n="nav.products">Products</h4>
      <p><a href="/products/8-electrode.html" data-i18n="nav.eight">8-Electrode</a></p>
      <p><a href="/products/kitchen.html" data-i18n="nav.kitchen">Kitchen Scales</a></p>
      <p><a href="/products/bathroom.html" data-i18n="nav.bathroom">Bathroom Scales</a></p>
    </div>
    <div>
      <h4>Company</h4>
      <p><a href="/about.html" data-i18n="nav.about">About</a></p>
      <p><a href="/capabilities.html" data-i18n="nav.cap">Capabilities</a></p>
      <p><a href="/contact.html" data-i18n="nav.contact">Contact</a></p>
    </div>
    <div>
      <h4 data-i18n="footer.app">Unique Health App</h4>
      <p style="color:var(--ink-muted-48);font-size:14px;letter-spacing:-0.224px" data-i18n="footer.app.d">iOS / Android / HarmonyOS</p>
    </div>
  </div>
  <div class="foot-bottom" data-i18n="footer.copy">© 2026 Shenzhen Unique Scales Co., Ltd. All rights reserved.</div>
</div>`;

  document.addEventListener("DOMContentLoaded", () => {
    const nav = document.getElementById("nav-mount");
    if (nav) nav.innerHTML = NAV;
    const foot = document.getElementById("foot-mount");
    if (foot) foot.innerHTML = FOOT;
    // active link
    const cur = document.body.dataset.page;
    if (cur) {
      const a = document.querySelector(`.global-nav-links a[data-nav="${cur}"]`);
      if (a) a.classList.add("active");
    }
    // mobile menu
    const mb = document.querySelector(".menu-btn-global");
    const nl = document.querySelector(".global-nav-links");
    if (mb && nl) mb.addEventListener("click", ()=> nl.classList.toggle("open"));
    // Re-apply translations now that the nav/footer (with data-i18n attrs) are in the DOM.
    if (window.__us_apply) window.__us_apply();
  });
})();
