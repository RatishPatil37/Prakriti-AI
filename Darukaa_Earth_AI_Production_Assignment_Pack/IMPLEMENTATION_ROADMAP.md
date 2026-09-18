# IMPLEMENTATION_ROADMAP.md

## Stage 0 — Environment

Create:

```text
Qdrant Free cluster
Supabase Free project
Google AI Studio key
optional Groq key
Vercel project
Render service
```

## Stage 1 — Public corpus

Target:

```text
5–15 authoritative documents
50–5000 chunks
```

Do not spend time finding 1000 documents.

The quality of a small curated corpus is more useful for the assignment.

## Stage 2 — Retrieval

Implement:

```text
dense
+
BM25 sparse
↓
Qdrant RRF
↓
top 8
↓
top 3–5 parents
```

Then log retrieval latency.

## Stage 3 — Streaming

Implement:

```text
FastAPI StreamingResponse
+
SSE
+
Gemini streaming
```

Show status events immediately.

## Stage 4 — Security

Implement:

```text
Supabase JWT
RLS
Qdrant scope filters
private document metadata
private storage
```

## Stage 5 — User uploads

Implement:

```text
PDF
TXT
MD
```

with:

```text
25MB PDF cap
100 page cap
content hash
deterministic chunk IDs
ready/failed statuses
```

## Stage 6 — Premium UX

Build only the screens that strengthen evaluation:

1. landing page;
2. scientist workspace;
3. evidence panel;
4. upload manager.

## Stage 7 — Verification

Demonstrate:

```text
same query across two users
private document isolation
citation rendering
clarification flow
first token timing
```

## Stage 8 — Polish

Only now add:

- subtle motion;
- map;
- charts;
- topographic background;
- animated evidence graph.
