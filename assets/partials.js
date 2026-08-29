// partials.js — inject skip link, global nav, sub-nav, and footer
(function(){
  const UTIL = `
<div class="utility-bar-inner">
  <span data-i18n="util.place">Longgang, Shenzhen</span>
  <span class="util-dot" aria-hidden="true"></span>
  <span data-i18n="util.mode">OEM / ODM</span>
  <span class="util-dot" aria-hidden="true"></span>
  <span data-i18n="util.since">Est. 2010</span>
  <a class="util-mail" href="mailto:hanhan@lefu.cc">hanhan@lefu.cc</a>
</div>`;

  const NAV = `
<a href="/index.html" class="brand">Unique Scales</a>
<button class="menu-btn-global" type="button" aria-label="Menu" aria-expanded="false" aria-controls="global-nav-links">☰</button>
<div class="global-nav-links" id="global-nav-links">
  <a href="/index.html" data-nav="home" data-i18n="nav.home">Home</a>
  <a href="/products/8-electrode.html" data-nav="8" data-i18n="nav.eight">8-Electrode</a>
  <a href="/products/kitchen.html" data-nav="k" data-i18n="nav.kitchen">Kitchen Scales</a>
  <a href="/products/bathroom.html" data-nav="b" data-i18n="nav.bathroom">Bathroom Scales</a>
  <a href="/contact.html" data-nav="contact" data-i18n="nav.contact">Contact</a>
  <div class="lang-toggle lang-toggle-global" role="group" aria-label="Language">
    <button type="button" data-lang="en">EN</button>
    <button type="button" data-lang="zh">中文</button>
  </div>
</div>`;

  const SUB = `
<div class="sub-nav-inner">
  <div class="cat" data-i18n="subnav.title">Unique Scales</div>
  <div class="sub-nav-links">
    <a href="/products/8-electrode.html" data-nav="8" data-i18n="nav.eight">8-Electrode</a>
    <a href="/products/kitchen.html" data-nav="k" data-i18n="nav.kitchen">Kitchen Scales</a>
    <a href="/products/bathroom.html" data-nav="b" data-i18n="nav.bathroom">Bathroom Scales</a>
    <a href="/contact.html" class="btn-pill" style="font-size:14px;padding:8px 18px" data-i18n="nav.cta">Request a Quote</a>
  </div>
</div>`;


  const CHAPTER = `
<div class="chapter-bar-inner">
  <div class="chapter-links" role="navigation" aria-label="On this page">
    <a href="#main" data-chapter="main" data-i18n="8.ch.overview">Overview</a>
    <a href="#accuracy" data-chapter="accuracy" data-i18n="8.ch.accuracy">Accuracy</a>
    <a href="#specs" data-chapter="specs" data-i18n="8.ch.specs">Specs</a>
    <a href="#inquire" data-chapter="inquire" data-i18n="8.ch.inquire">Inquire</a>
  </div>
  <a href="/contact.html" class="btn-pill chapter-cta" data-i18n="nav.cta">Request a Quote</a>
</div>`;

  const FOOT = `
<div class="container">
  <div class="foot-grid">
    <div>
      <h4>Shenzhen Unique Scales Co., Ltd.</h4>
      <p data-i18n="footer.address">Longgang District, Shenzhen, China</p>
      <p style="margin-top:6px"><a href="mailto:hanhan@lefu.cc">hanhan@lefu.cc</a></p>
    </div>
    <div>
      <h4 data-i18n="nav.products">Products</h4>
      <p><a href="/products/8-electrode.html" data-i18n="nav.eight">8-Electrode</a></p>
      <p><a href="/products/kitchen.html" data-i18n="nav.kitchen">Kitchen Scales</a></p>
      <p><a href="/products/bathroom.html" data-i18n="nav.bathroom">Bathroom Scales</a></p>
    </div>
    <div>
      <h4 data-i18n="footer.company">Company</h4>
      <p><a href="/about.html" data-i18n="nav.about">About</a></p>
      <p><a href="/capabilities.html" data-i18n="nav.cap">Capabilities</a></p>
      <p><a href="/contact.html" data-i18n="nav.contact">Contact</a></p>
    </div>
    <div>
      <h4 data-i18n="footer.legal">Legal</h4>
      <p><a href="/privacy.html" data-i18n="nav.privacy">Privacy</a></p>
      <p data-i18n="footer.app">Unique Health App</p>
      <p data-i18n="footer.app.d">iOS / Android / HarmonyOS</p>
    </div>
  </div>
  <div class="foot-bottom" data-i18n="footer.copy">© 2026 Shenzhen Unique Scales Co., Ltd. All rights reserved.</div>
</div>`;

  function ensureSkip(){
    if (document.querySelector(".skip-link")) return;
    const a = document.createElement("a");
    a.className = "skip-link";
    a.href = "#main";
    a.textContent = "Skip to content";
    document.body.insertBefore(a, document.body.firstChild);
  }

  function ensureMain(){
    if (document.getElementById("main")) return;
    const first = document.querySelector("section, .tile, .page-hero");
    if (first) first.id = "main";
  }

  function ensureUtility(){
    if (document.querySelector(".utility-bar")) return;
    const page = document.body && document.body.dataset.page;
    if (page === "8" || page === "k" || page === "b") return;
    const nav = document.querySelector(".global-nav");
    if (!nav) return;
    const bar = document.createElement("div");
    bar.className = "utility-bar";
    bar.setAttribute("data-design", "ibm");
    bar.setAttribute("data-token", "utility-bar");
    bar.innerHTML = UTIL;
    nav.parentNode.insertBefore(bar, nav);
  }

  function ensureSubnav(){
    if (document.querySelector(".sub-nav") || document.querySelector(".chapter-bar")) return;
    const page = document.body && document.body.dataset.page;
    const nav = document.querySelector(".global-nav");
    if (!nav) return;
    if (page === "8") {
      const bar = document.createElement("div");
      bar.className = "chapter-bar";
      bar.setAttribute("data-design", "apple");
      bar.setAttribute("data-token", "floating-sticky-bar");
      bar.innerHTML = CHAPTER;
      nav.insertAdjacentElement("afterend", bar);
      return;
    }
    if (page !== "k" && page !== "b") return;
    const bar = document.createElement("div");
    bar.className = "sub-nav";
    bar.setAttribute("data-design", "apple");
    bar.setAttribute("data-token", "sub-nav-frosted");
    bar.innerHTML = SUB;
    nav.insertAdjacentElement("afterend", bar);
  }

  function ensureStickyCta(){
    if (document.querySelector(".sticky-cta")) return;
    if (document.body.dataset.page === "contact") return;
    const bar = document.createElement("div");
    bar.className = "sticky-cta";
    bar.innerHTML = `<a href="/contact.html" class="btn-pill" data-i18n="nav.cta">Request a Quote</a>`;
    document.body.appendChild(bar);
    const hero = document.getElementById("main");
    const inquire = document.getElementById("inquire");
    if (!hero || !("IntersectionObserver" in window)) {
      bar.classList.add("is-visible");
      return;
    }
    let heroOut = false;
    let inquireIn = false;
    const paint = () => bar.classList.toggle("is-visible", heroOut && !inquireIn);
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.target === hero) heroOut = !e.isIntersecting;
        if (inquire && e.target === inquire) inquireIn = e.isIntersecting;
      });
      paint();
    }, { threshold: 0.12 });
    io.observe(hero);
    if (inquire) io.observe(inquire);
  }

  document.addEventListener("DOMContentLoaded", () => {
    ensureSkip();
    ensureUtility();
    const navBar = document.querySelector(".global-nav");
    if (navBar) {
      navBar.setAttribute("data-design", "apple");
      navBar.setAttribute("data-token", "global-nav");
    }
    const nav = document.getElementById("nav-mount");
    if (nav) nav.innerHTML = NAV;
    ensureSubnav();
    const foot = document.getElementById("foot-mount");
    if (foot) foot.innerHTML = FOOT;
    ensureMain();
    ensureStickyCta();

    const cur = document.body.dataset.page;
    const subKeys = { "8":"nav.eight", k:"nav.kitchen", b:"nav.bathroom", about:"nav.about", cap:"nav.cap", contact:"nav.contact", privacy:"nav.privacy" };
    if (cur) {
      document.querySelectorAll(`.global-nav-links a[data-nav="${cur}"], .sub-nav-links a[data-nav="${cur}"]`).forEach(a => a.classList.add("active"));
      const cat = document.querySelector(".sub-nav .cat");
      if (cat && subKeys[cur]) cat.setAttribute("data-i18n", subKeys[cur]);
    }

    const mb = document.querySelector(".menu-btn-global");
    const nl = document.querySelector(".global-nav-links");
    function closeMenu(){
      if (!nl || !mb) return;
      nl.classList.remove("open");
      mb.setAttribute("aria-expanded", "false");
    }
    if (mb && nl) {
      mb.addEventListener("click", () => {
        const open = nl.classList.toggle("open");
        mb.setAttribute("aria-expanded", open ? "true" : "false");
      });
      nl.querySelectorAll("a").forEach(a => a.addEventListener("click", closeMenu));
      document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeMenu(); });
    }

    const og = document.querySelector('meta[property="og:image"]');
    if (og) {
      const src = og.getAttribute("content") || "";
      if (src.startsWith("/")) og.setAttribute("content", location.origin + src);
    }

    if (window.__us_apply) window.__us_apply();
    revealOnView();
    chapterScrollSpy();
    countUpOnView();
    initHotspots();
    injectLinkedIn();
  });


  function revealOnView(){
    const nodes = document.querySelectorAll(".reveal");
    if (!nodes.length) return;
    const reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce || !("IntersectionObserver" in window)) {
      nodes.forEach((n) => n.classList.add("is-in"));
      return;
    }
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        e.target.classList.add("is-in");
        io.unobserve(e.target);
      });
    }, { threshold: 0.14, rootMargin: "0px 0px -8% 0px" });
    nodes.forEach((n) => io.observe(n));
  }



  function chapterScrollSpy(){
    const links = document.querySelectorAll(".chapter-links a[data-chapter]");
    if (!links.length) return;
    const ids = Array.from(links).map((a) => a.getAttribute("data-chapter"));
    const sections = ids.map((id) => document.getElementById(id)).filter(Boolean);
    const setActive = (id) => {
      links.forEach((a) => a.classList.toggle("is-active", a.getAttribute("data-chapter") === id));
    };
    setActive("main");
    if (!("IntersectionObserver" in window) || !sections.length) return;
    const io = new IntersectionObserver((entries) => {
      const vis = entries.filter((e) => e.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio);
      if (vis[0] && vis[0].target.id) setActive(vis[0].target.id);
    }, { rootMargin: "-40% 0px -50% 0px", threshold: [0, 0.25, 0.5] });
    sections.forEach((s) => io.observe(s));
  }

  function countUpOnView(){
    const nodes = document.querySelectorAll(".spec-num[data-count]");
    if (!nodes.length) return;
    const reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const fmt = (el, n) => {
      const dec = parseInt(el.getAttribute("data-decimals") || "0", 10);
      const suffix = el.getAttribute("data-suffix") || "";
      const prefix = el.getAttribute("data-prefix") || "";
      const num = dec > 0 ? n.toFixed(dec) : String(Math.round(n));
      return prefix + num + suffix;
    };
    const run = (el) => {
      const target = parseFloat(el.getAttribute("data-count"));
      if (!isFinite(target)) return;
      if (reduce) { el.textContent = fmt(el, target); return; }
      const start = performance.now();
      const dur = 1100;
      const tick = (now) => {
        const t = Math.min(1, (now - start) / dur);
        const eased = 1 - Math.pow(1 - t, 3);
        el.textContent = fmt(el, target * eased);
        if (t < 1) requestAnimationFrame(tick);
        else el.textContent = fmt(el, target);
      };
      requestAnimationFrame(tick);
    };
    if (!("IntersectionObserver" in window)) {
      nodes.forEach(run);
      return;
    }
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        run(e.target);
        io.unobserve(e.target);
      });
    }, { threshold: 0.4 });
    nodes.forEach((n) => io.observe(n));
  }

  function initHotspots(){
    const stage = document.querySelector(".hotspot-stage");
    if (!stage) return;
    const cap = document.querySelector(".hotspot-caption");
    const dots = stage.querySelectorAll(".hotspot-dot");
    const cards = {};
    document.querySelectorAll("[data-spot-copy]").forEach((el) => { cards[el.getAttribute("data-spot-copy")] = el; });
    const show = (id) => {
      dots.forEach((d) => d.setAttribute("aria-expanded", d.getAttribute("data-spot") === id ? "true" : "false"));
      const src = cards[id];
      if (!cap || !src) return;
      cap.innerHTML = src.innerHTML;
    };
    let current = dots[0] ? dots[0].getAttribute("data-spot") : null;
    dots.forEach((d) => d.addEventListener("click", () => {
      current = d.getAttribute("data-spot");
      show(current);
    }));
    if (current) show(current);
    document.addEventListener("us:i18n", () => { if (current) show(current); });
  }

  function injectLinkedIn(){
    if (window._linkedin_partner_id) return;
    window._linkedin_partner_id = "9831228";
    window._linkedin_data_partner_ids = window._linkedin_data_partner_ids || [];
    window._linkedin_data_partner_ids.push(window._linkedin_partner_id);
    (function(l){
      if (!l){
        window.lintrk = function(a,b){ window.lintrk.q.push([a,b]); };
        window.lintrk.q = [];
      }
      var s = document.getElementsByTagName("script")[0];
      var b = document.createElement("script");
      b.type = "text/javascript";
      b.async = true;
      b.src = "https://snap.licdn.com/li.lms-analytics/insight.min.js";
      s.parentNode.insertBefore(b, s);
    })(window.lintrk);
    if (!document.getElementById("li-insight-noscript")) {
      var ns = document.createElement("noscript");
      ns.id = "li-insight-noscript";
      ns.innerHTML = '<img height="1" width="1" style="display:none;" alt="" src="https://px.ads.linkedin.com/collect/?pid=9831228&fmt=gif" />';
      document.body.appendChild(ns);
    }
  }
})();
