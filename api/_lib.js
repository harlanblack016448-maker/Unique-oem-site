// api/_lib.js — shared helpers for the Unique Scales chatbot serverless functions.
// Zero npm dependencies: uses global fetch (Node 18+) and Upstash-compatible
// Redis REST (Vercel KV injects KV_REST_API_URL / KV_REST_API_TOKEN automatically).
"use strict";

const KV_URL =
  process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL || "";
const KV_TOKEN =
  process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN || "";

const CONV_PREFIX = "conv:";
const INDEX_KEY = "conv:index";

// ---------------------------------------------------------------- storage ---

function kvConfigured() {
  return !!(KV_URL && KV_TOKEN);
}

async function kvCommand(args) {
  const res = await fetch(KV_URL, {
    method: "POST",
    headers: {
      Authorization: "Bearer " + KV_TOKEN,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(args),
  });
  if (!res.ok) throw new Error("KV HTTP " + res.status);
  const data = await res.json();
  if (data && data.error) throw new Error("KV error: " + data.error);
  return data.result;
}

// In-memory fallback so the widget still works (per warm instance) before
// Vercel KV is connected. Data is NOT durable in this mode — the admin page
// shows a warning banner when storage === "memory".
const mem = globalThis.__us_chat_mem || (globalThis.__us_chat_mem = new Map());

async function saveConv(conv) {
  if (!conv || !conv.id) return;
  conv.lastActive = new Date().toISOString();
  if (kvConfigured()) {
    await kvCommand(["SET", CONV_PREFIX + conv.id, JSON.stringify(conv)]);
    await kvCommand(["SADD", INDEX_KEY, conv.id]);
  } else {
    mem.set(conv.id, conv);
  }
}

async function getConv(id) {
  if (!id) return null;
  if (kvConfigured()) {
    const raw = await kvCommand(["GET", CONV_PREFIX + id]);
    return raw ? JSON.parse(raw) : null;
  }
  return mem.get(id) || null;
}

async function listConvs(limit) {
  const max = limit || 300;
  let convs = [];
  if (kvConfigured()) {
    const ids = (await kvCommand(["SMEMBERS", INDEX_KEY])) || [];
    const keyOf = (id) => CONV_PREFIX + id;
    for (let i = 0; i < ids.length; i += 100) {
      const chunk = ids.slice(i, i + 100);
      const raws = (await kvCommand(["MGET"].concat(chunk.map(keyOf)))) || [];
      raws.forEach((raw) => {
        if (!raw) return;
        try {
          convs.push(JSON.parse(raw));
        } catch (_) {
          /* skip malformed */
        }
      });
    }
  } else {
    convs = Array.from(mem.values());
  }
  convs.sort((a, b) =>
    String(b.lastActive || "").localeCompare(String(a.lastActive || ""))
  );
  return convs.slice(0, max);
}

// ------------------------------------------------------------------ http ----

function sendJson(res, status, obj) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.end(JSON.stringify(obj));
}

function readBody(req, maxBytes) {
  return new Promise((resolve, reject) => {
    const cap = maxBytes || 100 * 1024;
    let size = 0;
    const chunks = [];
    req.on("data", (c) => {
      size += c.length;
      if (size > cap) {
        reject(new Error("payload too large"));
        req.destroy();
        return;
      }
      chunks.push(c);
    });
    req.on("end", () => {
      try {
        const text = Buffer.concat(chunks).toString("utf8");
        resolve(text ? JSON.parse(text) : {});
      } catch (e) {
        reject(e);
      }
    });
    req.on("error", reject);
  });
}

function clientIp(req) {
  const fwd = req.headers["x-forwarded-for"];
  if (typeof fwd === "string" && fwd.length) return fwd.split(",")[0].trim();
  return (req.socket && req.socket.remoteAddress) || "unknown";
}

// Naive per-instance rate limit — enough to stop obvious abuse; not a WAF.
const RATE = { hits: new Map(), WINDOW_MS: 60 * 1000, MAX: 30 };
function rateLimited(ip) {
  const now = Date.now();
  const arr = (RATE.hits.get(ip) || []).filter((t) => now - t < RATE.WINDOW_MS);
  arr.push(now);
  RATE.hits.set(ip, arr);
  if (RATE.hits.size > 5000) {
    // occasional sweep to keep the map small
    for (const [k, v] of RATE.hits) {
      if (!v.some((t) => now - t < RATE.WINDOW_MS)) RATE.hits.delete(k);
    }
  }
  return arr.length > RATE.MAX;
}

// ------------------------------------------------------------------ LLM -----

function llmConfigured() {
  return !!(process.env.LLM_API_BASE && process.env.LLM_API_KEY);
}

async function callLLM(messages, timeoutMs) {
  const base = String(process.env.LLM_API_BASE || "").replace(/\/+$/, "");
  const key = process.env.LLM_API_KEY || "";
  const model = process.env.LLM_MODEL || "gpt-4o-mini";
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs || 25000);
  try {
    const res = await fetch(base + "/chat/completions", {
      method: "POST",
      headers: {
        Authorization: "Bearer " + key,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: 0.3,
        max_tokens: 600,
      }),
      signal: ctrl.signal,
    });
    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      throw new Error(
        "LLM HTTP " + res.status + " " + String(detail).slice(0, 200)
      );
    }
    const data = await res.json();
    const choice =
      data && data.choices && data.choices[0] && data.choices[0].message;
    return (choice && choice.content) || "";
  } finally {
    clearTimeout(timer);
  }
}

// The model is instructed to answer with strict JSON; be defensive anyway.
function parseAgentOutput(text) {
  const raw = String(text || "").trim();
  const unfenced = raw
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/```\s*$/, "")
    .trim();
  const start = unfenced.indexOf("{");
  const end = unfenced.lastIndexOf("}");
  if (start !== -1 && end > start) {
    try {
      const obj = JSON.parse(unfenced.slice(start, end + 1));
      if (obj && typeof obj.reply === "string" && obj.reply.trim()) {
        return {
          intent: ["product", "order", "technical", "other"].includes(obj.intent)
            ? obj.intent
            : "other",
          escalate: obj.escalate === true,
          reply: obj.reply.trim(),
        };
      }
    } catch (_) {
      /* fall through */
    }
  }
  return { intent: "other", escalate: false, reply: unfenced || raw };
}

// ---------------------------------------------------- human escalation ------

// Notify sales by reusing the site's existing FormSubmit endpoint.
// Failure is non-fatal: the session is still flagged `escalated` and shows up
// in the admin dashboard.
async function sendEscalationEmail(conv) {
  try {
    const transcript = (conv.messages || [])
      .slice(-10)
      .map((m) => (m.role === "user" ? "Visitor: " : "AI: ") + m.content)
      .join("\n");
    const res = await fetch("https://formsubmit.co/ajax/hanhan@lefu.cc", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        name: "AI Chat Assistant",
        email: "noreply@lefu.cc",
        _subject: "[AI Chat] Human follow-up needed - " + conv.id.slice(0, 8),
        _captcha: "false",
        message:
          "A website chat needs human follow-up.\n" +
          "Session: " +
          conv.id +
          "\nPage: " +
          (conv.page || "-") +
          "\nLanguage: " +
          (conv.lang || "-") +
          "\n\nRecent transcript:\n" +
          transcript,
      }),
    });
    return res.ok;
  } catch (_) {
    return false;
  }
}

module.exports = {
  kvConfigured,
  saveConv,
  getConv,
  listConvs,
  sendJson,
  readBody,
  clientIp,
  rateLimited,
  llmConfigured,
  callLLM,
  parseAgentOutput,
  sendEscalationEmail,
};
