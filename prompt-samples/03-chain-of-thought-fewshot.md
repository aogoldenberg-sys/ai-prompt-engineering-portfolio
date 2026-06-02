# Prompt Sample 3 — Chain-of-Thought + Few-Shot

## Task

Classify and triage incoming support tickets: assign priority (P1–P4), category, and a one-line action summary. The model must explain its reasoning step-by-step before giving the final verdict — this makes the output auditable and allows QA to catch misclassification without re-running the model.

## Why This Approach

For classification tasks where wrong labels have different costs (a P1 missed as P3 is far worse than the reverse), chain-of-thought forces the model to surface its reasoning. Few-shot examples anchor the priority rubric better than a long list of rules — the model generalises from concrete cases rather than trying to memorise an abstract policy.

---

## Prompt

```
You are a support triage specialist. Given a ticket, reason step-by-step, then output your verdict.

## Priority rubric
P1 — Production down or data loss; all customers affected. Respond in 15 min.
P2 — Major feature broken; significant % of users affected. Respond in 2 h.
P3 — Feature degraded; workaround exists. Respond in 1 business day.
P4 — Cosmetic issue, question, or feature request. Respond in 3 business days.

## Output format (after your reasoning)
VERDICT
priority: <P1|P2|P3|P4>
category: <billing|auth|performance|data|ui|feature_request|other>
action: <one-line description of the recommended next step>

---

## Examples

TICKET: "Login is completely broken for all users since 09:00. Nobody can sign in."
REASONING:
- Scope: all users → high blast radius.
- Impact: auth is completely down → service unusable, not degraded.
- Duration: started at 09:00, ongoing → no self-recovery.
- Conclusion: production auth outage affecting 100% of users = P1.
VERDICT
priority: P1
category: auth
action: Page on-call engineer immediately; check auth service health dashboard and recent deploys.

---

TICKET: "The CSV export button produces a file with wrong date format (MM/DD instead of DD/MM). It was fine last week."
REASONING:
- Scope: affects users who rely on CSV export; workaround is manual date reformatting.
- Impact: data is present but in wrong format — not missing, not blocking core workflow.
- Regression: "was fine last week" suggests a recent deploy introduced it.
- Conclusion: degraded feature with a workaround = P3; tag as regression for dev team.
VERDICT
priority: P3
category: data
action: Assign to backend team with regression label; check recent date-formatting changes in export module.

---

TICKET: "Can you add dark mode to the mobile app? It would be much easier on the eyes."
REASONING:
- This is an enhancement request, not a bug.
- No current functionality is broken or degraded.
- Impact: cosmetic / UX preference.
- Conclusion: feature request = P4.
VERDICT
priority: P4
category: feature_request
action: Log in product backlog with user vote count; no immediate engineering action required.

---

## Your ticket

TICKET: "{ticket_text}"
REASONING:
```

## Usage Notes

- Replace `{ticket_text}` with the actual ticket body at runtime.
- The prompt ends with `REASONING:` — this primes the model to start with its reasoning trace, not jump straight to a verdict.
- Three few-shot examples cover the full P1/P3/P4 spectrum; P2 is left for the model to generalise (avoids over-fitting to a single example per class).
- In production, pass `stop: ["---"]` to prevent the model from generating a second imaginary ticket.

## Evaluation Tip

Log all reasoning traces for the first 200 tickets. Review cases where `priority=P1` or `priority=P2` — these are the high-cost misclassification zones. Use disagreements to add or refine few-shot examples rather than adding more rule text.
