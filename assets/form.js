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
    // kitchen / bathroom / oem / full — body-fat-scale ranges (1000+)
    "_default": [
      { v: "1000",      k: "contact.volume.std.0" },
      { v: "1000-2000", k: "contact.volume.std.1" },
      { v: "2000-5000", k: "contact.volume.std.2" },
      { v: "5000+",     k: "contact.volume.std.3" }
    ]
  };

  function getLang(){
    return (window.__us_getLang && window.__us_getLang()) || "en";
  }

  function renderVolumes(){
    const vol = document.getElementById("volume-select");
    if (!vol) return;
    const interest = document.getElementById("interest-select");
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
    vol.value = ""; // reset selection
  }

  document.addEventListener("DOMContentLoaded", () => {
    const interest = document.getElementById("interest-select");
    if (interest) {
      // Ensure id exists (older contact.html didn't have one).
      interest.id = "interest-select";
      interest.addEventListener("change", renderVolumes);
    }
    renderVolumes();

    // Re-render when language changes.
    document.addEventListener("us:i18n", renderVolumes);

    // ---- form submission ----
    const form = document.getElementById("lead-form");
    if (!form) return;
    const success = form.querySelector(".form-success");
    const EMAIL = "hanhan@lefu.cc";

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const action = form.getAttribute("action") || "";
      const data = new FormData(form);
      if (!action || action.indexOf("REPLACE") !== -1) { mailtoFallback(); return; }

      try {
        const res = await fetch(action, {
          method: "POST",
          body: data,
          headers: { Accept: "application/json" }
        });
        let ok = res.ok;
        try {
          const j = await res.json();
          if (j && (j.success === "true" || j.success === true)) ok = true;
        } catch (_) {}
        if (ok) {
          form.reset();
          renderVolumes(); // re-render empty placeholder after reset
          if (success) { success.classList.add("show"); success.scrollIntoView({behavior:"smooth", block:"center"}); }
        } else {
          mailtoFallback();
        }
      } catch (err) {
        mailtoFallback();
      }
    });

    function mailtoFallback(){
      const val = (n) => (form.querySelector('[name="'+n+'"]') || {}).value || "";
      const body = encodeURIComponent(
        "Name: " + val("name") + "\nEmail: " + val("email") +
        "\nCompany: " + val("company") + "\nCountry: " + val("country") +
        "\nPhone/WhatsApp: " + val("phone") + "\nInterest: " + val("interest") +
        "\nVolume: " + val("volume") + "\n\n" + val("message")
      );
      window.location.href = "mailto:" + EMAIL + "?subject=" +
        encodeURIComponent("Website inquiry — " + (val("interest") || "Smart scale")) + "&body=" + body;
      if (success) success.classList.add("show");
    }
  });
})();