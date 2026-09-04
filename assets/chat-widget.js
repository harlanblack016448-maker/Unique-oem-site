// chat-widget.js — Unique Scales AI assistant, floating chat widget.
// Loaded on every page via partials.js. Same-origin API: /api/chat, /api/feedback.
// Language follows the site i18n setting (localStorage "us_lang" / __us_getLang).
(function () {
  "use strict";
  if (window.__usChatLoaded) return;
  window.__usChatLoaded = true;

  var CSS_URL = "/assets/chat-widget.css?v=1";
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
      sub: "OEM / ODM · 通常几秒内回复",
      greeting:
        "您好！我是 Unique Scales 智能客服，可以解答机型、MOQ、认证和 OEM 流程等问题——也可以点「转人工」联系我们团队。",
      placeholder: "询问 MOQ、规格、打样…",
      send: "发送",
      offline:
        "AI 客服暂时不可用，请发邮件至 hanhan@lefu.cc，我们会在 1 个工作日内回复。",
      fbThanks: "感谢您的反馈！",
      chips: ["MOQ 多少？", "有哪些认证？", "交期多久？", "能否打样？", "转人工"],
      humanMsg: "我想转人工客服。",
      emailUs: "发邮件给我们",
      quote: "请求报价",
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
    var existing = document.querySelector('link[href="' + CSS_URL + '"]');
    if (existing) { onReady(); return; }
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
    // Anti-FOUC: keep the widget invisible until its stylesheet is ready,
    // then reveal with a soft fade. Never leave it hidden for long.
    var booted = false;
    function reveal() {
      if (booted || !fab || !panel) return;
      booted = true;
      fab.style.visibility = "";
      panel.style.visibility = "";
      fab.style.opacity = "0";
      if (window.requestAnimationFrame) {
        requestAnimationFrame(function () { fab.style.opacity = ""; });
      } else {
        fab.style.opacity = "";
      }
    }
    ensureCss(reveal);
    var t = function () { return T[lang()]; };

    var fab = el("button", "uschat-fab");
    fab.type = "button";
    fab.setAttribute("aria-label", t().ariaOpen);
    fab.innerHTML =
      '<svg class="uschat-fab-chat" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">' +
      '<path d="M12 3C6.9 3 3 6.6 3 11c0 2.2 1 4.2 2.7 5.6-.1 1-.5 2.4-1.6 3.4 1.8 0 3.4-.8 4.4-1.5 1.1.3 2.3.5 3.5.5 5.1 0 9-3.6 9-8S17.1 3 12 3z"/></svg>' +
      '<svg class="uschat-fab-close" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true">' +
      '<path d="M6 6l12 12M18 6L6 18"/></svg>';
    fab.style.visibility = "hidden"; // anti-FOUC: revealed by reveal()

    var panel = el("div", "uschat-panel");
    panel.setAttribute("role", "dialog");
    panel.setAttribute("aria-label", t().title);
    panel.style.visibility = "hidden"; // anti-FOUC: revealed by reveal()

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
    document.body.appendChild(root);
    document.body.appendChild(fab);

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

    function setOpen(v) {
      open = v;
      document.body.classList.toggle("uschat-open", v);
      fab.setAttribute("aria-label", v ? t().ariaClose : t().ariaOpen);
      if (v && !greeted) {
        greeted = true;
        addBot(t().greeting, { noFeedback: true });
      }
      if (v) input.focus();
    }

    fab.addEventListener("click", function () { setOpen(!open); });
    closeBtn.addEventListener("click", function () { setOpen(false); });
    sendBtn.addEventListener("click", function () { send(input.value); });
    input.addEventListener("keydown", function (e) {
      if (e.key === "Enter") { e.preventDefault(); send(input.value); }
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && open) setOpen(false);
    });
    document.addEventListener("us:i18n", paintLang);
    paintLang();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", build);
  } else {
    build();
  }
})();
