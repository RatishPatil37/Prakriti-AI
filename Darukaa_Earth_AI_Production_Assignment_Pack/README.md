# Darukaa.Earth AI Environmental Scientist

A production-minded, evidence-grounded environmental reasoning system built for the Darukaa.Earth AI biodiversity assignment.

## Architecture

- React/Vite frontend
- Supabase Auth + PostgreSQL + Storage
- FastAPI streaming backend
- Qdrant Cloud dense + BM25 hybrid retrieval
- Gemini streaming synthesis
- optional Groq fallback

## Core differentiators

1. Public scientific knowledge is the primary RAG corpus.
2. User uploads are private and tenant-isolated.
3. Retrieval is hybrid and server-side.
4. Evidence IDs are validated before being displayed.
5. Recommendations connect multiple environmental variables.
6. Quantitative claims require retrieved evidence.
7. SSE is used to minimize perceived latency.
8. The backend is stateless apart from small caches.

## Assignment submission checklist

See:

- `MASTER_PROMPT.md`
- `IMPLEMENTATION_ROADMAP.md`
- `docs/WEB_RESEARCH_NOTES.md`
- `.agents/*`
