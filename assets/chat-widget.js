// chat-widget.js — Unique Scales AI assistant, floating chat widget.
// Loaded on every page via partials.js. Same-origin API: /api/chat, /api/feedback.
// Language follows the site i18n setting (localStorage "us_lang" / __us_getLang).
(function () {
  "use strict";
  if (window.__usChatLoaded) return;
  window.__usChatLoaded = true;

  var CSS_URL = "/assets/chat-widget.css?v=10";
  var SID_KEY = "us_chat_sid_v1";

  var T = {
    en: {
      title: "Unique Assistant",
      sub: "OEM / ODM · usually replies in seconds",
      greeting:
        "Hi! I'm the Unique Scales assistant. Ask me about models, MOQ, certifications or the OEM process — or tap \u201cTalk to a human\u201d to reach our team.",
      placeholder: "Ask about MOQ, specs, samples\u2026",
      send: "Send",
      offline:
        "The AI assistant isn't available right now. Please email hanhan@lefu.cc — we reply within 1 business day.",
      fbThanks: "Thanks for the feedback!",
      chips: ["MOQ?", "Certifications", "Lead time", "Samples", "Talk to a human"],
      humanMsg: "I'd like to talk to a human, please.",
      emailUs: "Email us",
      quote: "Request a quote",
      ariaOpen: "Open chat",
      ariaClose: "Close chat",
    },
    zh: {
      title: "Unique 智能客服",
      sub: "OEM / ODM · 通常数秒内回复",
      greeting:
        "你好，我是 Unique Scales 智能客服。你可以咨询型号、起订量、认证或 OEM 流程，也可以选择“转人工”联系我们的团队。",
      placeholder: "咨询起订量、规格或样品",
      send: "发送",
      offline:
        "智能客服暂时不可用。请发送邮件至 hanhan@lefu.cc，销售团队将在 1 个工作日内回复。",
      fbThanks: "感谢你的反馈",
      chips: ["起订量是多少？", "有哪些认证？", "生产交期多久？", "可以申请样品吗？", "转人工"],
      humanMsg: "我想联系人工客服。",
      emailUs: "发送邮件",
      quote: "获取报价",
      ariaOpen: "打开客服对话",
      ariaClose: "关闭客服对话",
    },
  };

  function lang() {
    try {
      if (window.__us_getLang) {
        var l = window.__us_getLang();
        if (l === "zh" || l === "en") return l;
      }
      var saved = localStorage.getItem("us_lang");
      if (saved === "zh" || saved === "en") return saved;
    } catch (e) { /* private mode */ }
    return (navigator.language || "en").toLowerCase().indexOf("zh") === 0 ? "zh" : "en";
  }

  function sessionId() {
    try {
      var sid = localStorage.getItem(SID_KEY);
      if (!sid) {
        sid = "s" + Date.now().toString(36) + Math.random().toString(36).slice(2, 10);
        localStorage.setItem(SID_KEY, sid);
      }
      return sid;
    } catch (e) {
      return "s" + Date.now().toString(36) + Math.random().toString(36).slice(2, 10);
    }
  }

  var SID = sessionId();

  function ensureCss(onReady) {
    // partials.js pre-creates the stylesheet link (parallel prefetch) and
    // flips data-us-chat-css to "done" on load/error. Support both paths.
    var existing = document.querySelector('link[data-us-chat-css]');
    if (existing) {
      if (existing.getAttribute("data-us-chat-css") === "done") { onReady(); return; }
      var once2 = function () {
        if (existing.getAttribute("data-us-chat-css") !== "done") {
          existing.setAttribute("data-us-chat-css", "done");
          onReady();
        }
      };
      existing.addEventListener("load", once2);
      existing.addEventListener("error", once2);
      setTimeout(once2, 1200); // safety net
      return;
    }
    var link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = CSS_URL;
    var done = false;
    var once = function () { if (!done) { done = true; onReady(); } };
    link.onload = once;
    link.onerror = once; // if CSS fails, show unstyled rather than invisible forever
    document.head.appendChild(link);
    setTimeout(once, 1200); // safety net
  }

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }

  function build() {
    // Anti-FOUC: keep the widget invisible until BOTH (a) the stylesheet is
    // ready and (b) the DOM is built — whichever finishes last triggers the
    // reveal. Order-independent: fixes the race where a cached stylesheet
    // finished loading before this script ran and the early reveal was
    // swallowed by the !fab guard (widget stayed hidden forever).
    var booted = false, cssReady = false, built = false;
    function tryReveal() {
      if (booted || !cssReady || !built) return;
      booted = true;
      root.classList.add("uschat-ready");
      // One-shot entrance; drop uschat-in on end so later occlusion toggles
      // never reassign animation (restarting pop left opacity/visibility wrong).
      fab.classList.add("uschat-in");
      var onPopEnd = function (e) {
        if (e && e.animationName && e.animationName !== "uschat-pop") return;
        fab.classList.remove("uschat-in");
        fab.removeEventListener("animationend", onPopEnd);
      };
      fab.addEventListener("animationend", onPopEnd);
    }
    ensureCss(function () { cssReady = true; tryReveal(); });
    var t = function () { return T[lang()]; };

    var fab = el("button", "uschat-fab");
    fab.type = "button";
    fab.setAttribute("aria-label", t().ariaOpen);
    fab.innerHTML =
      '<svg class="uschat-fab-chat" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">' +
      '<path d="M12 3C6.9 3 3 6.6 3 11c0 2.2 1 4.2 2.7 5.6-.1 1-.5 2.4-1.6 3.4 1.8 0 3.4-.8 4.4-1.5 1.1.3 2.3.5 3.5.5 5.1 0 9-3.6 9-8S17.1 3 12 3z"/></svg>' +
      '<svg class="uschat-fab-close" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true">' +
      '<path d="M6 6l12 12M18 6L6 18"/></svg>';
    /* anti-FOUC: .uschat-root:not(.uschat-ready) hides via CSS, no inline */

    var panel = el("div", "uschat-panel");
    panel.setAttribute("role", "dialog");
    panel.setAttribute("aria-label", t().title);
    panel.setAttribute("aria-hidden", "true");
    panel.setAttribute("inert", "");

    var head = el("div", "uschat-head");
    var mark = el("div", "uschat-head-mark", "U");
    var headText = el("div");
    var title = el("div", "uschat-head-title", t().title);
    var sub = el("div", "uschat-head-sub", t().sub);
    headText.appendChild(title);
    headText.appendChild(sub);
    var closeBtn = el("button", "uschat-head-close", "\u00d7");
    closeBtn.type = "button";
    closeBtn.setAttribute("aria-label", t().ariaClose);
    head.appendChild(mark);
    head.appendChild(headText);
    head.appendChild(closeBtn);

    var msgs = el("div", "uschat-msgs");

    var chips = el("div", "uschat-chips");

    var inputbar = el("div", "uschat-inputbar");
    var input = el("input");
    input.type = "text";
    input.placeholder = t().placeholder;
    var sendBtn = el("button", null, t().send);
    sendBtn.type = "button";
    inputbar.appendChild(input);
    inputbar.appendChild(sendBtn);

    panel.appendChild(head);
    panel.appendChild(msgs);
    panel.appendChild(chips);
    panel.appendChild(inputbar);

    var root = el("div", "uschat-root");
    root.appendChild(panel);
    root.appendChild(fab); /* same stacking context as panel; panel z-index wins */
    document.body.appendChild(root);

    // Hide the FAB only when a section photo is actually painted under it.
    // AABB against every section img rect is not enough: lazy/offscreen
    // images can report a viewport-sized box (e.g. 1280x720 at 0,0 from
    // width/height attrs) that still intersects a bottom-right FAB after
    // the user has scrolled to a text-only section (capabilities org
    // chart). elementsFromPoint uses the painted hit stack.
    // Same media scope as sticky-cta — section/…, never bare main.
    var FAB_MEDIA = "section img, section picture, section video, section svg.figure, .model-chip";
    var FAB_HIT_SKIP = ".uschat-root, .sticky-cta";
    function fabOverlapsMedia(rect, rects, gap) {
      if (typeof window.__ctaOverlapsMedia === "function") {
        return window.__ctaOverlapsMedia(rect, rects, gap);
      }
      var g = gap || 0;
      for (var i = 0; i < rects.length; i++) {
        var r = rects[i];
        if (!r || r.width === 0 || r.height === 0) continue;
        if (r.left < rect.right + g && r.right > rect.left - g &&
            r.top < rect.bottom + g && r.bottom > rect.top - g) return true;
      }
      return false;
    }
    window.__fabOverlapsMedia = fabOverlapsMedia;

    function fabMediaUnderPoint(x, y) {
      var stack;
      if (typeof document.elementsFromPoint === "function") {
        stack = document.elementsFromPoint(x, y) || [];
      } else if (typeof document.elementFromPoint === "function") {
        var one = document.elementFromPoint(x, y);
        stack = one ? [one] : [];
      } else {
        return null; // no hit-test API; caller may fall back
      }
      for (var i = 0; i < stack.length; i++) {
        var node = stack[i];
        if (!node || !node.closest) continue;
        if (node.closest(FAB_HIT_SKIP)) continue;
        var media = node.closest("img, picture, video, svg.figure, .model-chip");
        if (!media) {
          var fig = node.closest("figure");
          if (fig && fig.querySelector("img, picture, video, svg.figure")) media = fig;
        }
        if (!media) continue;
        if (media.classList && media.classList.contains("model-chip")) return media;
        if (media.closest && media.closest(".model-chip")) return media;
        if (media.closest && media.closest("section")) return media;
      }
      return null;
    }
    window.__fabMediaUnderPoint = fabMediaUnderPoint;

    function fabClamp(n, a, b) {
      return n < a ? a : (n > b ? b : n);
    }
    function fabIntersectRects(a, b) {
      var left = Math.max(a.left, b.left);
      var top = Math.max(a.top, b.top);
      var right = Math.min(a.right, b.right);
      var bottom = Math.min(a.bottom, b.bottom);
      if (right <= left || bottom <= top) return null;
      return { left: left, top: top, right: right, bottom: bottom,
        width: right - left, height: bottom - top };
    }
    /* 56x56 disc (border-radius 50%), not the square AABB corners. */
    function fabDiscOverlapsRect(cx, cy, radius, r) {
      var qx = fabClamp(cx, r.left, r.right);
      var qy = fabClamp(cy, r.top, r.bottom);
      var dx = qx - cx, dy = qy - cy;
      return (dx * dx + dy * dy) <= (radius * radius);
    }
    function fabSampleIntersection(fab, r, cx, cy, radius) {
      var inter = fabIntersectRects(fab, r);
      if (!inter || !fabDiscOverlapsRect(cx, cy, radius, r)) return [];
      var points = [];
      function add(x, y) {
        var dx = x - cx, dy = y - cy;
        if ((dx * dx + dy * dy) <= (radius * radius)) points.push([x, y]);
      }
      /* Closest point on the media to the disc center: the contact point
         when the center sits just outside the photo (bathroom hero edge). */
      add(fabClamp(cx, r.left, r.right), fabClamp(cy, r.top, r.bottom));
      /* Midpoint of the true overlap box — covers a thin strip the center
         misses, without a sparse grid that can skip a 15x50 sliver. */
      add((inter.left + inter.right) / 2, (inter.top + inter.bottom) / 2);
      /* Corners of that overlap that still lie on the disc. */
      add(inter.left, inter.top);
      add(inter.right, inter.top);
      add(inter.left, inter.bottom);
      add(inter.right, inter.bottom);
      return points;
    }
    function fabShouldOcclude(fabEl) {
      var fab = fabEl.getBoundingClientRect();
      if (!(fab.width > 0 && fab.height > 0)) return false;
      var nodes = document.querySelectorAll(FAB_MEDIA);
      var hasHit = typeof document.elementsFromPoint === "function" ||
        typeof document.elementFromPoint === "function";
      var i, r, rects, pts, p;
      if (hasHit) {
        var cx = fab.left + fab.width / 2;
        var cy = fab.top + fab.height / 2;
        var radius = Math.min(fab.width, fab.height) / 2;
        for (i = 0; i < nodes.length; i++) {
          r = nodes[i].getBoundingClientRect();
          if (!r || r.width === 0 || r.height === 0) continue;
          pts = fabSampleIntersection(fab, r, cx, cy, radius);
          for (p = 0; p < pts.length; p++) {
            /* Painted stack at the sample, not the layout rect: phantom
               1280x720@0,0 can AABB-hit the FAB but paint the org chart. */
            if (fabMediaUnderPoint(pts[p][0], pts[p][1])) return true;
          }
        }
        return false;
      }
      // Legacy fallback only when hit-testing is unavailable.
      rects = [];
      for (i = 0; i < nodes.length; i++) rects.push(nodes[i].getBoundingClientRect());
      return fabOverlapsMedia(fab, rects, 8);
    }
    window.__fabShouldOcclude = fabShouldOcclude;
    window.__fabSampleIntersection = fabSampleIntersection;
    window.__fabDiscOverlapsRect = fabDiscOverlapsRect;

    function watchFabOcclusion(fabEl, panelEl) {
      if (!window.requestAnimationFrame || !window.MutationObserver) return;
      var queued = false;
      function check() {
        queued = false;
        var hide = false;
        var chatOpen = document.body.classList.contains("uschat-open");
        var focused = fabEl.contains(document.activeElement) ||
          (panelEl && panelEl.contains(document.activeElement));
        if (!chatOpen && !focused) {
          hide = fabShouldOcclude(fabEl);
        }
        fabEl.classList.toggle("uschat-occluding", hide);
        if (hide) {
          fabEl.setAttribute("tabindex", "-1");
          fabEl.setAttribute("aria-hidden", "true");
        } else {
          fabEl.removeAttribute("tabindex");
          fabEl.setAttribute("aria-hidden", "false");
        }
      }
      function queue() {
        if (!queued) { queued = true; requestAnimationFrame(check); }
      }
      window.addEventListener("scroll", queue, { passive: true });
      window.addEventListener("resize", queue);
      window.addEventListener("load", queue);
      fabEl.addEventListener("focusout", queue);
      if (panelEl) panelEl.addEventListener("focusout", queue);
      new MutationObserver(queue).observe(document.body, { attributes: true, attributeFilter: ["class"] });
      var sticky = document.querySelector(".sticky-cta");
      if (sticky) new MutationObserver(queue).observe(sticky, { attributes: true, attributeFilter: ["class"] });
      queue();
    }

    watchFabOcclusion(fab, panel);

    var open = false;
    var busy = false;
    var greeted = false;

    function paintLang() {
      var tt = t();
      title.textContent = tt.title;
      sub.textContent = tt.sub;
      input.placeholder = tt.placeholder;
      sendBtn.textContent = tt.send;
      fab.setAttribute("aria-label", open ? tt.ariaClose : tt.ariaOpen);
      closeBtn.setAttribute("aria-label", tt.ariaClose);
      renderChips();
    }

    function renderChips() {
      chips.innerHTML = "";
      t().chips.forEach(function (label) {
        var b = el("button", null, label);
        b.type = "button";
        b.addEventListener("click", function () {
          var msg = label.toLowerCase().indexOf("human") !== -1 || label.indexOf("人工") !== -1
            ? t().humanMsg
            : label;
          send(msg);
        });
        chips.appendChild(b);
      });
    }

    function setBusy(v) {
      busy = v;
      sendBtn.disabled = v;
      input.disabled = v;
    }

    function scroll() {
      msgs.scrollTop = msgs.scrollHeight;
    }

    function addUser(text) {
      var row = el("div", "uschat-row user");
      row.appendChild(el("div", "uschat-bubble", text));
      msgs.appendChild(row);
      scroll();
    }

    function addBot(text, opts) {
      opts = opts || {};
      var row = el("div", "uschat-row bot");
      row.appendChild(el("div", "uschat-bubble", text));

      if (opts.escalate) {
        var ctas = el("div", "uschat-ctas");
        var mail = el("a", "uschat-cta-solid", t().emailUs);
        mail.href = "mailto:hanhan@lefu.cc?subject=" +
          encodeURIComponent("Chat follow-up — " + location.pathname);
        var quote = el("a", null, t().quote);
        quote.href = "/contact.html";
        ctas.appendChild(mail);
        ctas.appendChild(quote);
        row.appendChild(ctas);
      }

      if (!opts.noFeedback) {
        var fb = el("div", "uschat-fb");
        var up = el("button", null, "\ud83d\udc4d");
        var down = el("button", null, "\ud83d\udc4e");
        up.type = down.type = "button";
        function rate(v, onBtn, offBtn) {
          if (onBtn.classList.contains("uschat-fb-on")) return;
          onBtn.classList.add("uschat-fb-on");
          offBtn.disabled = true;
          up.disabled = true;
          down.disabled = true;
          fetch("/api/feedback", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ sessionId: SID, rating: v }),
          }).catch(function () {});
          var note = el("div", "uschat-fb-note", t().fbThanks);
          row.appendChild(note);
          scroll();
        }
        up.addEventListener("click", function () { rate("up", up, down); });
        down.addEventListener("click", function () { rate("down", down, up); });
        fb.appendChild(up);
        fb.appendChild(down);
        row.appendChild(fb);
      }

      msgs.appendChild(row);
      scroll();
      return row;
    }

    function typing() {
      var row = el("div", "uschat-row bot");
      var tip = el("div", "uschat-typing");
      tip.appendChild(el("i"));
      tip.appendChild(el("i"));
      tip.appendChild(el("i"));
      row.appendChild(tip);
      msgs.appendChild(row);
      scroll();
      return row;
    }

    function send(text) {
      var msg = String(text || "").trim();
      if (!msg || busy) return;
      if (!open) setOpen(true);
      addUser(msg);
      input.value = "";
      setBusy(true);
      var tipRow = typing();
      fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: SID,
          message: msg,
          lang: lang(),
          page: location.pathname,
        }),
      })
        .then(function (res) { return res.json(); })
        .then(function (data) {
          msgs.removeChild(tipRow);
          if (data && data.reply) {
            if (data.sessionId && data.sessionId !== SID) {
              SID = data.sessionId;
              try { localStorage.setItem(SID_KEY, SID); } catch (e) {}
            }
            addBot(data.reply, { escalate: !!data.escalate });
          } else {
            addBot(t().offline, { noFeedback: true });
          }
        })
        .catch(function () {
          msgs.removeChild(tipRow);
          addBot(t().offline, { noFeedback: true });
        })
        .then(function () { setBusy(false); if (open) input.focus(); });
    }

    /* Pointer close (mouse/touch click, event.detail >= 1 or pointerType
       mouse/touch/pen) must not programmatically focus the FAB: that left
       activeElement on the opener and the occlusion focus-guard refused to
       hide it over lab photos. Keyboard close (Escape, or a button click
       with detail === 0 from Enter/Space) restores focus to the FAB when
       it is not over media, so the control stays keyboard-reachable.
       Intended exception: a genuinely keyboard-focused FAB is not hidden
       while it holds focus (do not drop the user's tab stop). */
    function isKeyboardCloseEvent(e) {
      if (!e) return false;
      if (e.key === "Escape") return true;
      if (e.pointerType) {
        return e.pointerType !== "mouse" && e.pointerType !== "touch" &&
          e.pointerType !== "pen";
      }
      return e.detail === 0;
    }
    window.__isKeyboardCloseEvent = isKeyboardCloseEvent;

    function restoreFocusAfterClose(fromKeyboard) {
      var over = fabShouldOcclude(fab);
      if (over) {
        fab.classList.add("uschat-occluding");
        fab.setAttribute("tabindex", "-1");
        fab.setAttribute("aria-hidden", "true");
        return;
      }
      fab.classList.remove("uschat-occluding");
      fab.removeAttribute("tabindex");
      fab.setAttribute("aria-hidden", "false");
      /* Only keyboard close moves focus back to the opener. */
      if (fromKeyboard) {
        try { fab.focus(); } catch (e) { /* ignore */ }
      }
    }

    function setOpen(v, ev) {
      open = !!v;
      document.body.classList.toggle("uschat-open", open);
      fab.setAttribute("aria-label", open ? t().ariaClose : t().ariaOpen);
      if (open) {
        panel.removeAttribute("inert");
        panel.setAttribute("aria-hidden", "false");
        if (!greeted) {
          greeted = true;
          addBot(t().greeting, { noFeedback: true });
        }
        try { input.focus(); } catch (e) { /* ignore */ }
      } else {
        var fromKeyboard = isKeyboardCloseEvent(ev);
        var active = document.activeElement;
        /* Pointer close: also blur the FAB itself (clicking the open FAB
           would otherwise leave it focused and trap the focus guard). */
        if (active && (panel.contains(active) || fab === active || fab.contains(active))) {
          try { active.blur(); } catch (e) { /* ignore */ }
        }
        panel.setAttribute("inert", "");
        panel.setAttribute("aria-hidden", "true");
        restoreFocusAfterClose(fromKeyboard);
      }
    }

    fab.addEventListener("click", function (e) { setOpen(!open, e); });
    closeBtn.addEventListener("click", function (e) { setOpen(false, e); });
    sendBtn.addEventListener("click", function () { send(input.value); });
    input.addEventListener("keydown", function (e) {
      if (e.key === "Enter") { e.preventDefault(); send(input.value); }
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && open) setOpen(false, e);
    });
    document.addEventListener("us:i18n", paintLang);
    paintLang();
    built = true; // DOM ready — reveal now if the stylesheet already arrived
    tryReveal();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", build);
  } else {
    build();
  }
})();
