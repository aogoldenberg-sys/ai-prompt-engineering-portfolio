# Prompt Sample 1 — Structured Output (JSON Schema Response)

## Task

Customer support agent must classify an incoming message and return a machine-readable response that the downstream automation can act on immediately — no free-text parsing, no second LLM call to extract intent.

## Why This Approach

Free-form agent responses break pipelines. By specifying the exact JSON schema inside the system prompt and enforcing it with `response_format: {type: "json_object"}` (OpenAI) or output-prefilling (Anthropic), every response is directly deserializable. The `escalate` flag triggers a human handoff in n8n without any additional classification step.

---

## System Prompt

```
You are a customer support assistant for an online service platform.
Always respond in valid JSON that matches the schema below — no extra keys, no markdown fences.

Response schema:
{
  "answer": string,          // The reply to show the customer (1–4 sentences, polite, concrete)
  "intent": string,          // One of: order_status | refund_request | booking_change | general_faq | complaint | out_of_scope
  "confidence": number,      // 0.0–1.0 — your confidence in the intent classification
  "escalate": boolean,       // true if the issue requires a human agent
  "escalation_reason": string | null,  // Required when escalate=true; null otherwise
  "suggested_actions": [     // Up to 3 next-step suggestions to show the customer as quick-reply buttons
    {"label": string, "action_id": string}
  ]
}

Classification rules:
- Set escalate=true if: complaint with order value > mentioned threshold, legal threat, repeated contact (>2 mentions of "again" or "still not"), or confidence < 0.6.
- Keep answer focused; do not reveal internal logic or thresholds.
- If intent is out_of_scope, set answer to a polite redirect and escalate=false.
```

## User Message (example)

```
I placed an order three days ago and it still hasn't shipped. I've already written twice and nobody answered. I want a refund.
```

## Expected Output

```json
{
  "answer": "I'm sorry for the frustration — I can see this situation has gone on too long. I'm escalating your case to a senior agent right now who will respond within 1 hour with a resolution or refund confirmation.",
  "intent": "refund_request",
  "confidence": 0.91,
  "escalate": true,
  "escalation_reason": "Customer reports no response after 2+ contacts; explicit refund demand.",
  "suggested_actions": [
    {"label": "Check order status", "action_id": "order_status_lookup"},
    {"label": "Confirm refund request", "action_id": "refund_confirm"},
    {"label": "Talk to a human agent", "action_id": "escalate_human"}
  ]
}
```

## Key Design Decisions

| Decision | Reason |
|---|---|
| Schema in system prompt, not user turn | Keeps schema stable across all conversations; user cannot override it |
| `escalate` as boolean, not string | Directly usable in n8n IF node without parsing |
| `confidence` field | Allows the pipeline to route borderline cases differently (e.g., log for review at < 0.7) |
| `suggested_actions` with `action_id` | Buttons rendered by the chat widget; `action_id` maps to an n8n workflow trigger — no extra LLM call needed |
