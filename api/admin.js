// api/admin.js — GET /api/admin
// Auth: header "x-admin-token" must equal env ADMIN_TOKEN.
// Returns { storage, stats, conversations } — records + satisfaction stats.
"use strict";

const crypto = require("crypto");
const {
  kvConfigured,
  listConvs,
  sendJson,
} = require("./_lib.js");

const MAX_LIST = 200;

function tokenOk(provided, expected) {
  if (!expected || !provided) return false;
  const a = Buffer.from(String(provided));
  const b = Buffer.from(String(expected));
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

function summarize(conv) {
  const intents = {};
  let messageCount = 0;
  for (const m of conv.messages || []) {
    messageCount++;
    if (m.role === "assistant" && m.intent) {
      intents[m.intent] = (intents[m.intent] || 0) + 1;
    }
  }
  const topIntent = Object.keys(intents).sort((x, y) => intents[y] - intents[x])[0] || "other";
  return {
    id: conv.id,
    created: conv.created,
    lastActive: conv.lastActive || conv.created,
    page: conv.page || "",
    lang: conv.lang || "",
    messageCount,
    topIntent,
    intents,
    escalated: !!conv.escalated,
    rating: conv.rating || null,
    ratingComment: conv.ratingComment || "",
    messages: (conv.messages || []).map((m) => ({
      role: m.role,
      content: m.content,
      ts: m.ts,
      intent: m.intent || undefined,
    })),
  };
}

function computeStats(convSummaries) {
  const stats = {
    sessions: convSummaries.length,
    messages: 0,
    escalated: 0,
    ratingsUp: 0,
    ratingsDown: 0,
    satisfaction: null,
    intents: { product: 0, order: 0, technical: 0, other: 0 },
    last7days: { sessions: 0, messages: 0 },
  };
  const weekAgo = Date.now() - 7 * 24 * 3600 * 1000;
  for (const c of convSummaries) {
    stats.messages += c.messageCount;
    if (c.escalated) stats.escalated++;
    if (c.rating === "up") stats.ratingsUp++;
    if (c.rating === "down") stats.ratingsDown++;
    for (const [k, v] of Object.entries(c.intents || {})) {
      if (stats.intents[k] !== undefined) stats.intents[k] += v;
    }
    const t = Date.parse(c.lastActive || "") || 0;
    if (t >= weekAgo) {
      stats.last7days.sessions++;
      stats.last7days.messages += c.messageCount;
    }
  }
  const rated = stats.ratingsUp + stats.ratingsDown;
  if (rated > 0) stats.satisfaction = Math.round((stats.ratingsUp / rated) * 100);
  return stats;
}

module.exports = async (req, res) => {
  if (req.method === "OPTIONS") {
    res.statusCode = 204;
    return res.end();
  }
  if (req.method !== "GET") return sendJson(res, 405, { error: "method_not_allowed" });

  const adminToken = process.env.ADMIN_TOKEN;
  if (!adminToken) {
    return sendJson(res, 503, { error: "admin_not_configured" });
  }
  if (!tokenOk(req.headers["x-admin-token"], adminToken)) {
    return sendJson(res, 401, { error: "unauthorized" });
  }

  let convs = [];
  try {
    convs = await listConvs(MAX_LIST);
  } catch (e) {
    return sendJson(res, 500, { error: "storage_error", detail: String(e && e.message) });
  }

  const summaries = convs.map(summarize);
  sendJson(res, 200, {
    ok: true,
    storage: kvConfigured() ? "kv" : "memory",
    generatedAt: new Date().toISOString(),
    stats: computeStats(summaries),
    conversations: summaries,
  });
};
