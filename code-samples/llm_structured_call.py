"""
LLM Structured Output — Python snippet
---------------------------------------
Demonstrates calling the Anthropic Claude API with a strict JSON schema response.
The model is instructed to always return a machine-parseable envelope; the caller
validates the schema with Pydantic before acting on the result.

Replace YOUR_API_KEY with your actual key (use an environment variable in production).
"""

import json
import os
from typing import Literal

import anthropic
from pydantic import BaseModel, ValidationError


# ── Response schema ──────────────────────────────────────────────────────────

class SupportTicketTriage(BaseModel):
    answer: str
    intent: Literal[
        "order_status",
        "refund_request",
        "booking_change",
        "general_faq",
        "complaint",
        "out_of_scope",
    ]
    confidence: float          # 0.0 – 1.0
    escalate: bool
    escalation_reason: str | None
    suggested_actions: list[dict]  # [{"label": str, "action_id": str}]


# ── System prompt ─────────────────────────────────────────────────────────────

SYSTEM_PROMPT = """
You are a customer support assistant. Respond ONLY in valid JSON matching this schema exactly:
{
  "answer": string,
  "intent": "order_status" | "refund_request" | "booking_change" | "general_faq" | "complaint" | "out_of_scope",
  "confidence": number (0.0–1.0),
  "escalate": boolean,
  "escalation_reason": string | null,
  "suggested_actions": [{"label": string, "action_id": string}]
}

Rules:
- escalate=true if confidence < 0.6, legal threat, or repeated failed contacts.
- suggested_actions: up to 3 items.
- Do not wrap output in markdown fences.
""".strip()


# ── API call ─────────────────────────────────────────────────────────────────

def triage_ticket(user_message: str) -> SupportTicketTriage:
    client = anthropic.Anthropic(api_key=os.environ.get("ANTHROPIC_API_KEY", "YOUR_API_KEY"))

    response = client.messages.create(
        model="claude-sonnet-4-5",
        max_tokens=512,
        temperature=0,          # deterministic output for classification tasks
        system=SYSTEM_PROMPT,
        messages=[{"role": "user", "content": user_message}],
    )

    raw_text: str = response.content[0].text

    # Strip accidental markdown fences (belt-and-suspenders)
    clean = raw_text.strip().removeprefix("```json").removeprefix("```").removesuffix("```").strip()

    try:
        data = json.loads(clean)
        return SupportTicketTriage(**data)
    except (json.JSONDecodeError, ValidationError) as exc:
        # In production: log the raw response and re-raise or return a safe default
        raise ValueError(f"Model returned invalid JSON: {exc}\n\nRaw: {raw_text}") from exc


# ── Example usage ─────────────────────────────────────────────────────────────

if __name__ == "__main__":
    sample_message = (
        "I ordered last Tuesday and it still hasn't shipped. "
        "I already emailed twice and got no reply. I want a refund."
    )

    result = triage_ticket(sample_message)

    print(f"Intent     : {result.intent}")
    print(f"Confidence : {result.confidence:.2f}")
    print(f"Escalate   : {result.escalate}")
    if result.escalation_reason:
        print(f"Reason     : {result.escalation_reason}")
    print(f"\nAnswer:\n{result.answer}")
    print(f"\nSuggested actions:")
    for action in result.suggested_actions:
        print(f"  [{action['action_id']}] {action['label']}")
