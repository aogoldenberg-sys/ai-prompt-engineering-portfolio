/**
 * Serverless Webhook Handler — Cloudflare Workers
 * ------------------------------------------------
 * Receives a POST from an external service (e.g. payment gateway or booking system),
 * validates the HMAC signature, writes the event to a database, and triggers
 * an AI-powered notification via Claude API.
 *
 * Secrets are read from the Workers environment — never hardcoded.
 * Replace placeholder values in wrangler.toml / dashboard secrets:
 *   WEBHOOK_SECRET   — HMAC signing secret provided by the upstream service
 *   ANTHROPIC_API_KEY — your Claude API key
 *   TELEGRAM_BOT_TOKEN — bot token for operator notifications
 *   TELEGRAM_CHAT_ID   — chat/group ID to receive alerts
 */

export default {
  async fetch(request, env) {
    if (request.method !== "POST") {
      return new Response("Method Not Allowed", { status: 405 });
    }

    // ── 1. Verify HMAC signature ─────────────────────────────────────────────
    const body = await request.text();
    const signature = request.headers.get("X-Webhook-Signature") ?? "";

    const isValid = await verifyHmac(body, signature, env.WEBHOOK_SECRET);
    if (!isValid) {
      return new Response("Unauthorized", { status: 401 });
    }

    // ── 2. Parse event ───────────────────────────────────────────────────────
    let event;
    try {
      event = JSON.parse(body);
    } catch {
      return new Response("Bad Request: invalid JSON", { status: 400 });
    }

    // ── 3. Write event to Firestore (or any DB) ──────────────────────────────
    await persistEvent(event, env);

    // ── 4. Generate a human-readable summary via Claude ──────────────────────
    if (event.type === "payment.completed" || event.type === "booking.confirmed") {
      const summary = await generateEventSummary(event, env);
      await notifyOperator(summary, env);
    }

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  },
};


// ── HMAC verification ────────────────────────────────────────────────────────

async function verifyHmac(payload, signature, secret) {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["verify"]
  );

  // Signature expected as hex string; convert to ArrayBuffer
  const sigBytes = hexToBuffer(signature.replace(/^sha256=/, ""));
  return crypto.subtle.verify("HMAC", key, sigBytes, encoder.encode(payload));
}

function hexToBuffer(hex) {
  const pairs = hex.match(/.{1,2}/g) ?? [];
  return new Uint8Array(pairs.map((b) => parseInt(b, 16))).buffer;
}


// ── Persist event (Firestore REST example) ───────────────────────────────────

async function persistEvent(event, env) {
  const url = `https://firestore.googleapis.com/v1/projects/YOUR_PROJECT_ID/databases/(default)/documents/webhook_events`;

  const firestoreDoc = {
    fields: {
      event_id: { stringValue: event.id ?? crypto.randomUUID() },
      type: { stringValue: event.type ?? "unknown" },
      payload: { stringValue: JSON.stringify(event) },
      created_at: { timestampValue: new Date().toISOString() },
    },
  };

  await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      // In production: use a service-account token obtained via Workload Identity
      Authorization: `Bearer ${env.FIRESTORE_ACCESS_TOKEN}`,
    },
    body: JSON.stringify(firestoreDoc),
  });
}


// ── Claude API — generate operator-friendly event summary ────────────────────

async function generateEventSummary(event, env) {
  const prompt = `Summarise this webhook event in one short sentence for an operations dashboard.
Be concrete: include amount, customer reference, and status if present.
Event JSON:
${JSON.stringify(event, null, 2)}`;

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": env.ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-haiku-4-5-20251001", // fast + cheap for single-sentence summaries
      max_tokens: 100,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  const data = await response.json();
  return data?.content?.[0]?.text ?? "Event received (summary unavailable).";
}


// ── Telegram notification ────────────────────────────────────────────────────

async function notifyOperator(text, env) {
  await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: env.TELEGRAM_CHAT_ID,
      text: `📦 ${text}`,
    }),
  });
}
