# API Contract — Darukaa.Earth

## POST /api/v1/query/stream

Headers:

```text
Authorization: Bearer <supabase_access_token>
Content-Type: application/json
Accept: text/event-stream
```

Body:

```json
{
  "question": "Why is biodiversity declining?",
  "environmental_context": {
    "region_or_coords": "Western India",
    "current_land_use": "Monoculture agriculture",
    "annual_rainfall_mm": 350
  },
  "conversation_context": [
    {"role":"user","content":"..."},
    {"role":"assistant","content":"..."}
  ],
  "filters": {
    "region": null,
    "source_type": null
  }
}
```

## SSE events

```text
event: status
data: {"stage":"auth"}

event: status
data: {"stage":"retrieval"}

event: evidence
data: {
  "id":"S1",
  "title":"...",
  "page":12,
  "organization":"FAO"
}

event: status
data: {"stage":"reasoning"}

event: token
data: {"text":"..."}
```

Completion:

```text
event: done
data: {
  "request_id":"uuid",
  "metrics":{
    "first_sse_ms": 812,
    "retrieval_ms": 93,
    "llm_ttft_ms": 580
  }
}
```

Errors:

```text
event: error
data: {
  "code":"PROVIDER_TIMEOUT",
  "retryable":true,
  "request_id":"uuid"
}
```
