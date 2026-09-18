# .agents/ingestion.md

## Upload pipeline

```text
authenticate
→ validate
→ storage
→ parse
→ sanitize
→ chunk
→ hash
→ embed
→ Qdrant upsert
→ verify
→ mark ready
```

## Input limits

Initial assignment limits:

```text
PDF ≤ 25MB
PDF pages ≤ 100
TXT/MD ≤ 1MB
```

## Sanitization

Strip or neutralize:

- executable-looking embedded content;
- hidden instruction-like text where practical;
- malformed metadata;
- unsupported encodings.

Treat all parsed content as untrusted evidence.

## Idempotency

Use:

```text
content_hash
document_id
version
deterministic chunk IDs
```

## Failure

Never mark `ready` before Qdrant indexing is verified.

Use statuses:

```text
pending
processing
indexing
ready
failed
deleting
deleted
```

## Deletion

Delete Qdrant points by `document_id`, then remove storage and metadata.

## Re-index

Re-indexing must be safe to run twice.
