# n8n Workflow — AI Support Ticket Triage

## What It Does

Receives support tickets from any channel (web form, Telegram, email parser), classifies them with Claude (priority P1–P4, category, recommended action), logs everything to Google Sheets, and fires an immediate Telegram alert for P1 incidents.

## Flow

```
Webhook (POST /support-ticket)
  → Normalise Payload        # unify field names from different sources
  → Claude — Triage          # zero-temp classification, JSON output
  → Parse Triage Result      # strip markdown fences, error-safe JSON.parse
  → Is P1?
      ├─ YES → Telegram Alert → Log to Sheets → Respond
      └─ NO  → Log to Sheets → Respond
```

## Before Importing

Replace all placeholder values:

| Placeholder | Replace with |
|---|---|
| `YOUR_ONCALL_CHAT_ID` | Telegram chat or group ID for on-call notifications |
| `YOUR_GOOGLE_SHEET_ID` | Google Sheets document ID |
| `YOUR_CREDENTIAL_ID` (×2) | n8n credential IDs after you configure Telegram Bot and Google Sheets OAuth |

## Credentials Required in n8n

1. **Anthropic API** — `anthropicApi` — your Claude API key
2. **Telegram Bot** — `telegramApi` — your bot token
3. **Google Sheets OAuth2** — `googleSheetsOAuth2Api` — service account or OAuth consent

## Extending the Workflow

- Add a second IF node to route P2 tickets to a Slack channel.
- Connect a **Set** node before Claude to inject RAG context (retrieved knowledge-base passages) into the prompt.
- Add a **Wait** node + follow-up webhook to track whether P1 tickets were acknowledged within SLA.
