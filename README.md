# AI / Prompt Engineer · Automation Developer

I build conversational AI assistants and end-to-end automation pipelines — not demos, but production systems with measurable business value. In IT since the late 1990s; working with LLMs since GPT-3.

---

## Skills

| Area | Stack / Methods |
|---|---|
| Prompt Engineering | Structured output, function calling, chain-of-thought, few-shot, system prompt design, context window management |
| AI Agents & RAG | Multi-agent orchestration, knowledge-base retrieval, LLM context enrichment, vector search |
| Automation | n8n, webhook pipelines, event-driven workflows |
| APIs & Cloud | Claude API, OpenAI API, Firebase (Firestore + FCM), Cloudflare Workers, Telegram Bot API |
| Languages | Python, JavaScript (Node / Workers) |
| Other | Serverless architecture, payment integrations, CRM design |

---

## Case Studies

### 1 · Business Management CRM with Embedded Business Plan

**Problem:** A static business plan in a spreadsheet — no connection to real operations, no early warnings.

**Solution:** Built a live management layer on top of Firestore + Cloudflare Workers:
- The **roadmap** generates task cards with deadlines and owners automatically from strategic milestones.
- **Site & call metrics** (UTM, session data, call-tracking) feed a revenue forecast updated daily — leads → conversion rate → projected MRR.
- **Bank statement integration** parses incoming transactions, compares actual cash flow against the plan, and fires a Telegram alert when a cash-gap is forecast ≥ 14 days ahead.

**Results:** Cash-gap forecasting accuracy ~85 %; roadmap task completion rate increased from ad-hoc to 78 % on-time delivery within 60 days.

**Stack:** Cloudflare Workers · Firebase Firestore · Telegram Bot API · Claude API (anomaly narration) · Python (ETL scripts)

---

### 2 · AI Customer Support Agent

**Problem:** Support team answered the same 40 questions repeatedly; response time ~4 h.

**Solution:** Deployed a Claude-based conversational agent with:
- **System prompt** with persona, guardrails, and escalation rules.
- **RAG layer** — knowledge base chunked into ~400-token passages, embedded and retrieved per user query.
- **Structured output** — every agent response returns a JSON envelope: `{answer, confidence, intent, escalate: bool, suggested_actions[]}`.
- **Function calling** — agent can look up order status, check booking availability, and trigger refund requests via internal APIs without human involvement.

**Results:** First-contact resolution 67 % (was 0 % automated); average response latency 3 s vs. 4 h human.

**Stack:** Claude API · n8n (orchestration) · Python (embedding pipeline) · Telegram / web widget

---

### 3 · Mobility Platform (Carsharing & Transfer)

**Problem:** Launch a self-service carsharing + transfer booking service from zero.

**Solution:** Fully serverless platform built on Cloudflare Workers + Firebase:
- **Booking flow** — real-time availability check, dynamic pricing (per-minute rate with step-down multiplier for long rentals), online payment via acquiring API.
- **Telegram bot** — customer onboarding, document upload (driver licence OCR via external API), ride management commands.
- **Operations layer** — automated push notifications (FCM), ride-state machine (booked → active → finished → billed), trip cost recalculation on timeout.

**Stack:** Cloudflare Workers · Firebase Firestore + FCM · Telegram Bot API · Payment acquiring API (serverless) · Document OCR API

---

## Repository Contents

```
prompt-samples/         ← Annotated prompt templates (structured output, function calling, CoT/few-shot)
n8n-workflows/          ← Anonymised n8n workflow export + description
code-samples/           ← Runnable code snippets (LLM API call, serverless webhook handler)
```

---

## Contact

Open to freelance projects, part-time, and full-time remote roles.

- Telegram: @aogoldenberg
- Email: aogoldenberg@gmail.com
- GitHub: github.com/aogoldenberg-sys

---
---

# RU · Русская версия

## AI / Prompt Engineer · Разработчик автоматизаций

Строю диалоговых AI-ассистентов и сквозную автоматизацию — не демо, а рабочие системы с измеримой бизнес-ценностью. В ИТ с конца 1990-х; с LLM работаю с эпохи GPT-3.

---

## Навыки

| Область | Стек / методы |
|---|---|
| Промпт-инжиниринг | Structured output, function calling, chain-of-thought, few-shot, дизайн системных промптов, управление контекстом |
| AI-агенты и RAG | Мультиагентная оркестрация, поиск по базе знаний, обогащение контекста LLM, векторный поиск |
| Автоматизация | n8n, webhook-пайплайны, событийные воркфлоу |
| API и облако | Claude API, OpenAI API, Firebase, Cloudflare Workers, Telegram Bot API |
| Языки | Python, JavaScript (Node / Workers) |
| Прочее | Serverless-архитектура, интеграции с платёжными системами, проектирование CRM |

---

## Кейсы

### 1 · CRM с встроенным живым бизнес-планом

Статичный бизнес-план в таблице превратили в живую систему: дорожная карта сама ставит задачи, метрики сайта и звонков считают прогноз выручки, интеграция банковской выписки предупреждает о кассовых разрывах за 14+ дней.

### 2 · AI-агент поддержки клиентов

Диалоговый ассистент на Claude с RAG по базе знаний, structured output и function calling — статус заказа, бронирование, инициация возврата без оператора. First-contact resolution 67 %.

### 3 · Платформа мобильности (каршеринг и трансфер)

Полностью serverless: Cloudflare Workers + Firebase + Telegram-бот + OCR документов + динамическое ценообразование + автоматические уведомления.

---

## Контакты

Открыт к фриланс-проектам, частичной и полной удалённой занятости.

- Telegram: @aogoldenberg
- Email: aogoldenberg@gmail.com
