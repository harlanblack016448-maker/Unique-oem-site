// api/feedback.js — POST /api/feedback
// Satisfaction rating for a chat session (thumbs up / down + optional note).
// Body: { sessionId, rating: "up"|"down", comment?, messageId? }
"use strict";

const {
  kvConfigured,
  saveConv,
  getConv,
  sendJson,
  readBody,
  clientIp,
  rateLimited,
} = require("./_lib.js");

module.exports = async (req, res) => {
  if (req.method === "OPTIONS") {
    res.statusCode = 204;
    return res.end();
  }
  if (req.method !== "POST") return sendJson(res, 405, { error: "method_not_allowed" });
  if (rateLimited(clientIp(req))) return sendJson(res, 429, { error: "rate_limited" });

  let body;
  try {
    body = await readBody(req);
  } catch (_) {
    return sendJson(res, 400, { error: "bad_request" });
  }

  const rating = body.rating === "up" || body.rating === "down" ? body.rating : null;
  if (!rating) return sendJson(res, 400, { error: "invalid_rating" });

  const sid = typeof body.sessionId === "string" ? body.sessionId.slice(0, 64) : "";
  let conv = null;
  try {
    conv = sid ? await getConv(sid) : null;
  } catch (_) {
    conv = null;
  }
  if (!conv) {
    // Rating for a session we don't know (e.g. KV was connected later).
    if (!sid) return sendJson(res, 400, { error: "missing_session" });
    conv = {
      id: sid,
      created: new Date().toISOString(),
      page: "",
      lang: "",
      messages: [],
      escalated: false,
      escalationNotified: false,
      rating: null,
      ratingEvents: [],
      ratingComment: "",
    };
  }

  conv.rating = rating; // latest rating wins
  conv.ratingEvents = conv.ratingEvents || [];
  conv.ratingEvents.push({ ts: new Date().toISOString(), rating });
  if (typeof body.comment === "string" && body.comment.trim()) {
    conv.ratingComment = body.comment.trim().slice(0, 500);
  }

  let stored = true;
  try {
    await saveConv(conv);
  } catch (_) {
    stored = false;
  }
  sendJson(res, 200, { ok: true, storage: kvConfigured() ? "kv" : "memory", stored });
};
