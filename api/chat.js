// api/chat.js — POST /api/chat
// Multi-turn customer-service agent for Unique Scales.
// Body: { sessionId?, message, lang? ("en"|"zh"), page? }
// Resp: { sessionId, reply, intent, escalate, storage, error? }
"use strict";

const {
  kvConfigured,
  saveConv,
  getConv,
  sendJson,
  readBody,
  clientIp,
  rateLimited,
  llmConfigured,
  callLLM,
  parseAgentOutput,
  sendEscalationEmail,
} = require("./_lib.js");
const { COMPANY, KB } = require("./kb.js");

const SID_RE = /^[A-Za-z0-9_-]{8,64}$/;
const HISTORY_TURNS = 10; // messages (user+assistant) sent to the model

// ------------------------------------------------------------- retrieval ----

function tokenize(text) {
  return String(text || "")
    .toLowerCase()
    .split(/[^a-z0-9\u4e00-\u9fff]+/)
    .filter((t) => t.length > 1);
}

// Light keyword-overlap retrieval: rank KB entries for this user message and
// keep the best ones (plus a guaranteed base set). The full text of the
// selected entries becomes the model's only source of facts.
function retrieveKB(message) {
  // Normalized full-text match. Handles multi-word keywords like "lead time"
  // that token-by-token matching would miss (e.g. the "Lead time" quick chip).
  const norm =
    " " +
    String(message || "")
      .toLowerCase()
      .replace(/[^a-z0-9\u4e00-\u9fff]+/g, " ")
      .trim() +
    " ";
  const hit = (k) => {
    if (/[\u4e00-\u9fff]/.test(k)) return norm.includes(k); // CJK: substring
    if (k.length <= 4) return norm.includes(" " + k + " "); // short ASCII: whole word only
    return norm.includes(k); // long ASCII: substring
  };
  const scored = KB.map((entry) => {
    let score = 0;
    for (const kw of entry.keywords) {
      if (hit(kw.toLowerCase())) {
        score += kw.length > 4 ? 2 : 1;
      }
    }
    return { entry, score };
  });
  scored.sort((a, b) => b.score - a.score);
  const picked = scored.filter((s) => s.score > 0).slice(0, 10).map((s) => s.entry);
  if (!picked.length) {
    // Cold start / chit-chat: give the model the orientation basics only.
    return KB.filter((e) =>
      ["company", "products-8electrode", "moq", "response"].includes(e.id)
    );
  }
  // Always keep MOQ + contact available so basic buyer questions never miss.
  const must = KB.filter((e) => ["moq", "response"].includes(e.id));
  const ids = new Set(picked.map((e) => e.id));
  for (const m of must) if (!ids.has(m.id)) picked.push(m);
  return picked;
}

// ---------------------------------------------------------------- prompt ----

function buildSystemPrompt(lang, page, kbEntries) {
  const kbText = kbEntries
    .map((e) => "[" + e.id + "] " + e.a)
    .join("\n");
  return [
    'You are "Unique Assistant", the AI customer-service agent on the website of ' +
      COMPANY.name + ' (brand "Unique Scales"), an OEM/ODM smart-scale factory in ' +
      COMPANY.city + ". Site: " + COMPANY.site,
    "AUDIENCE: overseas B2B buyers (importers, brands, gyms, clinics, retailers) asking about 8-electrode body-composition scales, bathroom/kitchen scales and OEM/ODM projects.",
    'INTENT - classify the user\'s latest message into exactly one: "product" (models, specs, accuracy, materials, app, certifications), "order" (MOQ, samples, pricing, lead time, shipping, OEM process, payment), "technical" (app issues, pairing, troubleshooting, warranty), or "other".',
    "RULES:",
    "1. Ground every factual claim in the KNOWLEDGE BASE below. If the answer is not there, do not invent it - say a human colleague will follow up, and set escalate=true.",
    "2. NEVER claim UL certification. NEVER invent prices, lead times, certifications or exclusive distribution arrangements. Concrete prices and quotes always go to a human colleague.",
    "3. If the user asks for a quotation, a sample order, or explicitly asks for a human: set escalate=true, reply warmly, and point to " + COMPANY.email + ".",
    "4. When the user shows buying intent, it is good to gently ask for market, target volume and target price (like the site quote form does).",
    "5. Reply in the same language as the user's latest message. If unclear, use the site language in CONTEXT. Keep replies under 120 words, friendly, professional. Short paragraphs or bullets.",
    "6. Output STRICT JSON only, no markdown fences, exactly this shape:",
    '{"intent":"product|order|technical|other","escalate":true,"reply":"your answer"}',
    "CONTEXT: siteLang=" + (lang || "en") + "; page=" + (page || "/") + "; today=" + new Date().toISOString().slice(0, 10),
    "KNOWLEDGE BASE (authoritative facts; use only these):",
    kbText,
  ].join("\n");
}

function fallbackReply(lang) {
  return lang === "zh"
    ? "我们的 AI 助手正在准备中，暂时无法回答。请发邮件至 " +
        COMPANY.email + "，或使用报价表单 " + COMPANY.quoteForm +
        "，我们会在 1 个工作日内回复。"
    : "Our AI assistant is warming up and can't answer right now. Please email " +
        COMPANY.email + " or use the quote form " + COMPANY.quoteForm +
        " — we reply within 1 business day.";
}

// ---------------------------------------------------------------- handler ---

module.exports = async (req, res) => {
  if (req.method === "OPTIONS") {
    res.statusCode = 204;
    return res.end();
  }
  if (req.method !== "POST") return sendJson(res, 405, { error: "method_not_allowed" });

  const ip = clientIp(req);
  if (rateLimited(ip)) return sendJson(res, 429, { error: "rate_limited" });

  let body;
  try {
    body = await readBody(req);
  } catch (_) {
    return sendJson(res, 400, { error: "bad_request" });
  }

  const message = typeof body.message === "string" ? body.message.trim().slice(0, 2000) : "";
  if (!message) return sendJson(res, 400, { error: "empty_message" });

  let sessionId = typeof body.sessionId === "string" && SID_RE.test(body.sessionId)
    ? body.sessionId
    : "s" + Date.now().toString(36) + Math.random().toString(36).slice(2, 10);

  const lang = body.lang === "zh" ? "zh" : "en";
  const page = typeof body.page === "string" ? body.page.slice(0, 120) : "";

  let conv = (await getConv(sessionId).catch(() => null)) || {
    id: sessionId,
    created: new Date().toISOString(),
    page,
    lang,
    messages: [],
    escalated: false,
    escalationNotified: false,
    rating: null,
    ratingEvents: [],
    ratingComment: "",
  };

  conv.lang = lang;
  if (page && !conv.page) conv.page = page;
  conv.messages.push({ role: "user", content: message, ts: new Date().toISOString() });

  let agent = { intent: "other", escalate: false, reply: fallbackReply(lang) };
  let error = null;

  if (llmConfigured()) {
    try {
      const kbEntries = retrieveKB(message);
      const history = conv.messages
        .slice(-(HISTORY_TURNS + 1), -1)
        .map((m) => ({ role: m.role, content: m.content }));
      const llmMessages = [
        { role: "system", content: buildSystemPrompt(lang, conv.page, kbEntries) },
      ].concat(history);
      llmMessages.push({ role: "user", content: message });
      const out = await callLLM(llmMessages);
      agent = parseAgentOutput(out);
    } catch (e) {
      error = "llm_error";
      agent.reply = fallbackReply(lang);
      agent.escalate = false;
    }
  } else {
    error = "not_configured";
  }

  conv.messages.push({
    role: "assistant",
    content: agent.reply,
    ts: new Date().toISOString(),
    intent: agent.intent,
    escalate: agent.escalate,
  });

  if (agent.escalate && !conv.escalated) conv.escalated = true;
  if (
    agent.escalate &&
    !conv.escalationNotified &&
    llmConfigured()
  ) {
    conv.escalationNotified = await sendEscalationEmail(conv); // true|false, either way continue
  }

  await saveConv(conv).catch(() => {});

  sendJson(res, 200, {
    sessionId: conv.id,
    reply: agent.reply,
    intent: agent.intent,
    escalate: agent.escalate,
    storage: kvConfigured() ? "kv" : "memory",
    error: error || undefined,
  });
};
