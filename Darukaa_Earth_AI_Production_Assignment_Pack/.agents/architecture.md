# .agents/architecture.md

## Canonical service boundaries

### Frontend

Owns:

- UI;
- auth session;
- conversation selection;
- recent conversation context;
- SSE rendering;
- upload UI.

### FastAPI

Owns:

- authentication enforcement;
- request validation;
- query orchestration;
- Qdrant access;
- ingestion;
- LLM provider calls;
- citation validation;
- streaming.

### Qdrant

Owns:

- dense vectors;
- BM25 sparse vectors;
- chunk text;
- evidence metadata;
- visibility metadata.

### Supabase Postgres

Owns:

- users;
- conversations;
- messages;
- document metadata;
- feedback.

### Supabase Storage

Owns:

- private original files.

### LLM

Owns:

- ecological explanation;
- synthesis;
- recommendations;
- clarification wording only when deterministic clarification is insufficient.

## Hot-path rule

Do not query Supabase just to reconstruct a large conversation before every answer.

Prefer short recent context supplied by the authenticated client and persist history separately.

## Retrieval rule

Prefer one Qdrant hybrid request with dense+sparse prefetch and server-side fusion.
