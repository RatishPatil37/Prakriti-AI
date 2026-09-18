# .agents/deployment-free-tier.md

## Default topology

```text
Vercel Hobby
  → React frontend

Render Free
  → FastAPI backend

Supabase Free
  → Auth + Postgres + Storage

Qdrant Cloud Free
  → hybrid scientific retrieval

Gemini Free Tier
  → primary LLM

Groq
  → optional fallback, subject to current free availability
```

## Free-tier realities

Free services may pause or suspend after inactivity.

Therefore:

- do not promise zero cold starts;
- surface a warm-up state in the UI;
- benchmark warm and cold requests separately;
- keep initialization tiny.

## Render

Do not initialize a large local corpus on startup.

The service should become ready quickly because Qdrant contains the searchable corpus.

## Qdrant

Monitor:

- disk;
- RAM;
- point count;
- collection health.

## Supabase

Use RLS.

Keep original file storage private.

## Secrets

Only backend:

```text
QDRANT_API_KEY
GEMINI_API_KEY
GROQ_API_KEY
SUPABASE_SERVICE_ROLE_KEY
```

Frontend gets only the public/publishable Supabase key and application URL.
