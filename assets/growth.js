// Consent-gated advertising and session attribution. No personal inquiry data leaves here.
(function(root, factory){
  if (typeof module === "object" && module.exports) module.exports = factory;
  else root.__us_growth = factory(root);
})(typeof window !== "undefined" ? window : globalThis, function(w){
  const VERSION = 1, TTL = 180 * 86400000;
  const CONSENT = "us_ads_consent", SOURCE = "us_ads_source";
  const UTM = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"];
  let memoryConsent, loaded = false;
  const sent = new Set();
  function storage(name, method, key, value){
    try { return w[name][method](key, value); } catch (_) { return null; }
  }
  function choice(){
    let c = memoryConsent;
    if (!c) { try { c = JSON.parse(storage("localStorage", "getItem", CONSENT)); } catch (_) {} }
    if (!c || c.version !== VERSION || !["granted", "denied"].includes(c.value) ||
        !Number.isFinite(c.expires) || c.expires <= Date.now() || c.expires > Date.now() + TTL + 60000) return null;
    return c.value;
  }
  function clean(value){ return String(value || "").replace(/[\x00-\x1f\x7f]/g, "").slice(0, 160); }
  function path(){ return String(w.location.pathname || "/").slice(0, 500); }
  function current(){
    const params = new URLSearchParams(w.location.search || ""), item = {};
    UTM.forEach(key => { const v = clean(params.get(key)); if (v) item[key] = v; });
    return Object.keys(item).length ? Object.assign(item, {landing_path:path()}) : null;
  }
  function capture(){
    if (choice() !== "granted") { storage("sessionStorage", "removeItem", SOURCE); return; }
    const item = current();
    if (item) storage("sessionStorage", "setItem", SOURCE, JSON.stringify(item));
  }
  function source(){
    const direct = current();
    if (choice() !== "granted") return direct || {source_status:"unknown"};
    let cached;
    try { cached = JSON.parse(storage("sessionStorage", "getItem", SOURCE)); } catch (_) {}
    if (direct) return direct;
    if (!cached || typeof cached !== "object") return {source_status:"unknown"};
    const safe = {};
    UTM.forEach(key => { if (typeof cached[key] === "string") safe[key] = clean(cached[key]); });
    if (!Object.keys(safe).length) return {source_status:"unknown"};
    safe.landing_path = typeof cached.landing_path === "string" ? cached.landing_path.split(/[?#]/)[0].slice(0,500) : "";
    return safe;
  }
  function metadata(id){
    return Object.assign({source_status:"tagged"}, source(), {inquiry_id:id, inquiry_path:path(), submitted_at:new Date().toISOString()});
  }
  function id(){
    try { return "US-" + w.crypto.randomUUID(); }
    catch (_) { return "US-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2,12); }
  }
  function load(){
    if (loaded || choice() !== "granted") return;
    loaded = true;
    w._linkedin_partner_id = "9831228";
    w._linkedin_data_partner_ids = ["9831228"];
    if (!w.lintrk) { w.lintrk = function(a,b){ w.lintrk.q.push([a,b]); }; w.lintrk.q = []; }
    const s = w.document.createElement("script");
    s.async = true; s.src = "https://snap.licdn.com/li.lms-analytics/insight.min.js";
    w.document.head.appendChild(s);
  }
  function trackLead(conversion, inquiry, allowedAtSubmit){
    if (!allowedAtSubmit || choice() !== "granted" || !conversion || !inquiry || sent.has(inquiry)) return;
    sent.add(inquiry);
    try { if (typeof w.lintrk === "function") w.lintrk("track", {conversion_id:conversion}); } catch (_) {}
  }
  function setChoice(value){
    if (!["granted", "denied"].includes(value)) return;
    const previous = choice();
    memoryConsent = {version:VERSION, value, expires:Date.now() + TTL};
    storage("localStorage", "setItem", CONSENT, JSON.stringify(memoryConsent));
    if (value === "granted") { capture(); load(); }
    else { storage("sessionStorage", "removeItem", SOURCE); if (w.lintrk && w.lintrk.q) w.lintrk.q.length = 0; }
    const panel = w.document && w.document.getElementById("ads-consent");
    if (panel) panel.hidden = true;
    fit();
    if (value === "denied" && (loaded || previous === "granted")) w.location.reload();
  }
  // Reserve page space under the fixed consent panel while it is visible, so it never hides content.
  function fit(){
    const d = w.document, panel = d && d.getElementById && d.getElementById("ads-consent");
    if (!d || !d.body || !d.documentElement) return;
    const open = !!panel && !panel.hidden;
    if (open) d.documentElement.style.setProperty("--ads-consent-space", Math.max(0, Math.ceil(w.innerHeight - panel.getBoundingClientRect().top)) + "px");
    d.body.classList.toggle("ads-consent-open", open);
  }
  function show(){
    const panel = w.document.getElementById("ads-consent");
    if (!panel) return;
    panel.hidden = false;
    fit();
    panel.querySelector("button").focus({preventScroll:true});
  }
  function init(){
    capture(); load();
    const panel = w.document.createElement("aside");
    panel.id = "ads-consent"; panel.className = "ads-consent";
    panel.setAttribute("role", "region"); panel.setAttribute("aria-labelledby", "ads-consent-title");
    panel.innerHTML = '<h2 id="ads-consent-title" data-i18n="ads.title">Advertising privacy</h2><p data-i18n="ads.text">Allow LinkedIn to measure visits and successful inquiries? Your choice does not affect inquiry submission.</p><div class="ads-actions"><button type="button" data-ads-choice="granted" data-i18n="ads.accept">Accept</button><button type="button" data-ads-choice="denied" data-i18n="ads.reject">Reject</button><a href="/privacy.html" data-i18n="nav.privacy">Privacy</a></div><p class="ads-small" data-i18n="ads.withdraw">Change your choice on the Privacy page. Withdrawal stops future tracking, but cannot recall data already sent.</p>';
    panel.hidden = choice() !== null;
    w.document.body.appendChild(panel);
    w.document.addEventListener("click", function(e){
      const button = e.target.closest("[data-ads-choice]");
      if (button) setChoice(button.dataset.adsChoice);
      const settings = e.target.closest("[data-ads-settings]");
      if (settings) show();
    });
    if (w.__us_apply) w.__us_apply();
    fit();
    if (typeof w.ResizeObserver === "function") new w.ResizeObserver(fit).observe(panel);
    w.addEventListener("resize", fit);
    // Another tab can revoke consent. Reload unloads already active third-party code.
    w.addEventListener("storage", function(e){
      if (e.key !== CONSENT && e.key !== null) return;
      memoryConsent = undefined;
      if (choice() !== "granted") {
        storage("sessionStorage", "removeItem", SOURCE);
        if (loaded) w.location.reload(); else { panel.hidden = choice() !== null; fit(); }
      }
    });
  }
  if (w.document && w.document.addEventListener) w.document.addEventListener("DOMContentLoaded", init);
  return {choice, setChoice, capture, source, metadata, id, trackLead, show};
});
