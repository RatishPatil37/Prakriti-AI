# .agents/security-multitenancy.md

## Threat model

Primary threat:

> User A uploads proprietary environmental material and User B retrieves it through semantic search, BM25, parent resolution, cache, history, or fallback logic.

## Required controls

### Identity

Verify Supabase JWT server-side.

Use JWT `sub` as authoritative user UUID.

### Qdrant

Every query includes an access filter.

Public:

```text
scope = public
```

Authenticated:

```text
scope = public
OR
scope = private AND owner_user_id = current_user_id
```

### Cache

Cache keys include:

```text
user_id
knowledge_version
query
conversation_context_hash
```

### Parent lookup

Only parent IDs originating from the tenant-scoped retrieval result may be resolved.

### Supabase

Use RLS for user-owned tables.

### Storage

Use private bucket paths:

```text
user_id/document_id/file
```

### Frontend

Never expose:

- Supabase service role key;
- Qdrant secret API key;
- Gemini server API key;
- Groq key.

## Forbidden patterns

```python
user_id = body.user_id
```

```python
if not results:
    results = global_search()
```

```python
GLOBAL_PARENT_STORE[chunk_id] = document
```

```python
CACHE[(question, subject)] = answer
```
