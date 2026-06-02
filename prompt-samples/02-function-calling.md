# Prompt Sample 2 — Function Calling (Tool Use)

## Task

An AI booking assistant must handle natural-language requests like "Is the conference room free tomorrow at 3 pm?" or "Cancel my reservation for Friday" — without hardcoded slot parsing. The model decides which tool to call, extracts parameters from the conversation, and executes via the host application.

## Why This Approach

Regex-based intent parsing breaks on paraphrases and multi-step requests. With function calling the model handles entity extraction, ambiguity resolution ("which room?"), and multi-turn clarification — while the host application stays in control of all actual data mutations.

---

## System Prompt

```
You are a booking assistant for a co-working space.
You help members check availability, make reservations, and manage existing bookings.

Rules:
- Always use a tool call to fetch or modify data — never invent availability or booking IDs.
- If required parameters are missing, ask ONE clarifying question before calling the tool.
- After a successful mutation (create / cancel), confirm the action in plain language.
- Do not expose internal IDs to the user unless they ask.
```

## Tool Definitions (Anthropic / Claude format)

```json
[
  {
    "name": "check_availability",
    "description": "Returns available time slots for a given resource on a specific date.",
    "input_schema": {
      "type": "object",
      "properties": {
        "resource_type": {
          "type": "string",
          "enum": ["meeting_room", "desk", "phone_booth"],
          "description": "Type of bookable resource"
        },
        "date": {
          "type": "string",
          "description": "Date in YYYY-MM-DD format"
        },
        "duration_minutes": {
          "type": "integer",
          "description": "Required duration in minutes (default 60)",
          "default": 60
        }
      },
      "required": ["resource_type", "date"]
    }
  },
  {
    "name": "create_booking",
    "description": "Creates a reservation for an authenticated member.",
    "input_schema": {
      "type": "object",
      "properties": {
        "resource_type": {"type": "string", "enum": ["meeting_room", "desk", "phone_booth"]},
        "date": {"type": "string", "description": "YYYY-MM-DD"},
        "start_time": {"type": "string", "description": "HH:MM (24h)"},
        "duration_minutes": {"type": "integer"},
        "member_id": {"type": "string", "description": "Authenticated member ID (injected by system)"},
        "title": {"type": "string", "description": "Optional booking title / purpose"}
      },
      "required": ["resource_type", "date", "start_time", "duration_minutes", "member_id"]
    }
  },
  {
    "name": "cancel_booking",
    "description": "Cancels an existing booking by ID. Only the booking owner can cancel.",
    "input_schema": {
      "type": "object",
      "properties": {
        "booking_id": {"type": "string"},
        "member_id": {"type": "string", "description": "Must match booking owner (injected by system)"}
      },
      "required": ["booking_id", "member_id"]
    }
  },
  {
    "name": "list_member_bookings",
    "description": "Returns upcoming bookings for the authenticated member.",
    "input_schema": {
      "type": "object",
      "properties": {
        "member_id": {"type": "string"},
        "from_date": {"type": "string", "description": "YYYY-MM-DD, defaults to today"}
      },
      "required": ["member_id"]
    }
  }
]
```

## Conversation Example

**User:** Is the conference room free on Friday afternoon?

**Model (internal reasoning → tool call):**
```json
{
  "name": "check_availability",
  "input": {
    "resource_type": "meeting_room",
    "date": "2026-06-05",
    "duration_minutes": 60
  }
}
```

**Tool result:** `[{"start": "14:00", "end": "15:00"}, {"start": "16:00", "end": "18:00"}]`

**Model reply to user:**
> "Friday afternoon we have two meeting-room slots: 14:00–15:00 and 16:00–18:00. Which would you like to book, and for how long?"

---

## Key Design Decisions

| Decision | Reason |
|---|---|
| `member_id` marked "injected by system" in description | Prevents prompt-injection attacks where a user claims to be another member |
| `check_availability` before `create_booking` in every flow | Model never creates a booking on an unavailable slot — avoids a race condition |
| Separate `cancel_booking` vs. `create_booking` tools | Keeps authorization logic clean; cancellation path can enforce a different policy (e.g., 24h notice) in the backend |
| Tool descriptions include data format details (YYYY-MM-DD, HH:MM) | Reduces hallucinated date formats without extra prompt tokens |
