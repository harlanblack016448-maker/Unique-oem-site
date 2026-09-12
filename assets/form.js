// form.js — handle lead form + dynamic volume options (8-electrode vs others)
(function(){
  // Volume option sets, keyed by interest value.
  const VOL_SETS = {
    "8-electrode": [
      { v: "500-first", k: "contact.volume.8.0" },
      { v: "500-1000",  k: "contact.volume.8.1" },
      { v: "1000-2000", k: "contact.volume.8.2" },
      { v: "2000-5000", k: "contact.volume.8.3" },
      { v: "5000+",     k: "contact.volume.8.4" }
    ],
    // kitchen / bathroom / oem / full — first option is the 1,000 floor
    // as a range (do not also offer a standalone "1,000 minimum").
    "_default": [
      { v: "1000-2000", k: "contact.volume.std.1" },
      { v: "2000-5000", k: "contact.volume.std.2" },
      { v: "5000+",     k: "contact.volume.std.3" }
    ]
  };

  // LinkedIn 转化事件（用于付费投放按「询盘」而非「点击」优化）
  // 取值：LinkedIn Campaign Manager → Measure → Conversions → 新建 "Lead" → 手动事件，
  // 把生成的 conversion_id 填进下面这个空字符串即可生效。留空 = 只记页面浏览，不报转化。
  // 详见 GROWTH-PLAN.md §3.2
  const LI_CONVERSION_ID = "28515124";

  function trackLeadConversion(){
    if (!LI_CONVERSION_ID) return;
    try {
      if (window.lintrk) window.lintrk("track", { conversion_id: LI_CONVERSION_ID });
    } catch (_) {}
  }

  function getLang(){
    return (window.__us_getLang && window.__us_getLang()) || "en";
  }

  function renderVolumes(){
    const vol = document.getElementById("volume-select");
    if (!vol) return;
    const interest = document.getElementById("interest-select");
    const previous = vol.value;
    const lang = getLang();
    const dict = window.__us_dict || {};
    const set = VOL_SETS[interest && interest.value] || VOL_SETS._default;

    const placeholderLabel = (dict[lang] && dict[lang]["contact.volume.opt"]) || "Select…";

    vol.innerHTML = "";
    const ph = document.createElement("option");
    ph.value = "";
    ph.textContent = placeholderLabel;
    ph.setAttribute("data-i18n", "contact.volume.opt");
    vol.appendChild(ph);

    set.forEach(item => {
      const opt = document.createElement("option");
      opt.value = item.v;
      opt.textContent = (dict[lang] && dict[lang][item.k]) || "";
      vol.appendChild(opt);
    });
    // Keep a valid selection when only the language changes. If the buyer
    // changed product interest and the old range is no longer available,
    // clear it so the form cannot submit a mismatched volume.
    vol.value = set.some(item => item.v === previous) ? previous : "";
  }

  document.addEventListener("DOMContentLoaded", () => {
    const interest = document.getElementById("interest-select");
    if (interest) {
      // Ensure id exists (older contact.html didn't have one).
      interest.id = "interest-select";
      interest.addEventListener("change", renderVolumes);
      // Product cards can link here with ?interest=8-electrode|kitchen|bathroom.
      // Ignore unknown values so arbitrary query strings never alter the form.
      try {
        const requested = new URLSearchParams(window.location.search).get("interest");
        if (requested && Array.from(interest.options).some(o => o.value === requested)) {
          interest.value = requested;
        }
      } catch (_) {}
    }
    renderVolumes();

    // Re-render when language changes.
    document.addEventListener("us:i18n", renderVolumes);

    // ---- form submission ----
    const form = document.getElementById("lead-form");
    if (!form) return;
    const success = form.querySelector(".form-success");
    // Email stored as base64 to reduce plain-text scraping while keeping mailto fallback functional.
    const EMAIL = atob("aGFuaGFuQGxlZnUuY2M=");

    const errBox = form.querySelector(".form-error");
    const submitBtn = form.querySelector('button[type="submit"]');

    // ---- inline validation (apple-design §16: validate inline, not on submit) ----
    // novalidate is set from JS only, so a no-JS client still gets native validation.
    form.noValidate = true;

    const t = (k, fallback) => {
      const lang = getLang();
      const dict = window.__us_dict || {};
      return (dict[lang] && dict[lang][k]) || fallback;
    };

    const RULES = [
      { el: document.getElementById("f-name"), msg: "contact.err.required" },
      { el: document.getElementById("type-select"), msg: "contact.err.required" },
      { el: document.getElementById("f-email"), msg: "contact.err.required", format: "email" },
      { el: document.getElementById("interest-select"), msg: "contact.err.required" },
      { el: document.getElementById("volume-select"), msg: "contact.err.required" }
    ].filter((r) => r.el);

    const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    function validateField(rule){
      const el = rule.el;
      const v = (el.value || "").trim();
      let key = "";
      if (!v) key = rule.msg;
      else if (rule.format === "email" && !EMAIL_RE.test(v)) key = "contact.err.email";
      el.setAttribute("aria-invalid", key ? "true" : "false");
      const wrap = el.closest(".form-field");
      let box = wrap && wrap.querySelector(".field-error");
      if (key) {
        if (!box) {
          box = document.createElement("p");
          box.className = "field-error";
          box.id = (el.id || el.name) + "-err";
          box.setAttribute("role", "alert");
          wrap.appendChild(box);
        }
        box.setAttribute("data-err-key", key);
        box.textContent = t(key, key === "contact.err.email" ? "Enter a valid email address." : "This field is required.");
        el.setAttribute("aria-describedby", box.id);
      } else if (box) {
        box.remove();
        el.removeAttribute("aria-describedby");
      }
      return !key;
    }

    RULES.forEach((rule) => {
      const el = rule.el;
      el.addEventListener("blur", () => {
        el.dataset.touched = "1";
        validateField(rule);
      });
      el.addEventListener(el.tagName === "SELECT" ? "change" : "input", () => {
        if (el.dataset.touched) validateField(rule);
      });
    });

    // Changing product interest re-renders the volume options — re-validate it too.
    if (interest) {
      interest.addEventListener("change", () => {
        const vol = RULES.find((r) => r.el.id === "volume-select");
        if (vol && vol.el.dataset.touched) validateField(vol);
      });
    }

    function validateAll(){
      let firstBad = null;
      RULES.forEach((rule) => {
        rule.el.dataset.touched = "1";
        if (!validateField(rule) && !firstBad) firstBad = rule.el;
      });
      return firstBad;
    }

    function clearValidation(){
      RULES.forEach((rule) => {
        delete rule.el.dataset.touched;
        rule.el.setAttribute("aria-invalid", "false");
        rule.el.removeAttribute("aria-describedby");
        const wrap = rule.el.closest(".form-field");
        const box = wrap && wrap.querySelector(".field-error");
        if (box) box.remove();
      });
    }

    // Re-render visible error messages in the new language.
    document.addEventListener("us:i18n", () => {
      RULES.forEach((rule) => {
        if (rule.el.getAttribute("aria-invalid") === "true") validateField(rule);
      });
    });
    let submitting = false;
    const sendingKey = "contact.sending";
    document.addEventListener("us:i18n", () => {
      if (submitting && submitBtn) submitBtn.textContent = t(sendingKey, "Sending…");
    });
    const idleLabel = () => {
      const lang = getLang();
      const dict = window.__us_dict || {};
      return (dict[lang] && dict[lang]["contact.submit"]) || "Send inquiry";
    };

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      if (submitting) return;
      if (success) success.classList.remove("show");
      if (errBox) errBox.classList.remove("show");
      const honey = form.querySelector('[name="_honey"]');
      if (honey && honey.value) return;
      const firstBad = validateAll();
      if (firstBad) {
        firstBad.focus();
        return;
      }
      const action = form.getAttribute("action") || "";
      const data = new FormData(form);
      data.delete("_honey");
      if (submitBtn) {
        submitBtn.disabled = true;
        const lang = getLang();
        const dict = window.__us_dict || {};
        submitBtn.textContent = (dict[lang] && dict[lang][sendingKey]) || "Sending…";
      }
      if (!action || action.indexOf("REPLACE") !== -1) {
        if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = idleLabel(); }
        mailtoFallback();
        return;
      }
      const ajaxUrl = action.indexOf("formsubmit.co/") !== -1 && action.indexOf("/ajax/") === -1
        ? action.replace("https://formsubmit.co/", "https://formsubmit.co/ajax/")
        : action;

      submitting = true;
      try {
        await window.__us_sendInquiry(ajaxUrl, data);
        form.reset();
        renderVolumes();
        clearValidation();
        trackLeadConversion();
        if (success) {
          success.classList.add("show");
          success.setAttribute("tabindex", "-1");
          success.focus({ preventScroll: true });
          success.scrollIntoView({behavior:"smooth", block:"center"});
        }
      } catch (err) {
        mailtoFallback();
      } finally {
        submitting = false;
        if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = idleLabel(); }
      }
    });

    function mailtoFallback(){
      const val = (n) => (form.querySelector('[name="'+n+'"]') || {}).value || "";
      const body = encodeURIComponent(
        "Name: " + val("name") + "\nEmail: " + val("email") +
        "\nCompany: " + val("company") + "\nCountry: " + val("country") +
        "\nPhone/WhatsApp: " + val("phone") + "\nInquiry type: " + val("inquiry_type") +
        "\nInterest: " + val("interest") +
        "\nVolume: " + val("volume") + "\n\n" + val("message")
      );
      window.location.href = "mailto:" + EMAIL + "?subject=" +
        encodeURIComponent("Website inquiry — " + (val("interest") || "Smart scale")) + "&body=" + body;
      if (errBox) {
        errBox.classList.add("show");
        errBox.scrollIntoView({behavior:"smooth", block:"center"});
      }
    }
  });
})();
