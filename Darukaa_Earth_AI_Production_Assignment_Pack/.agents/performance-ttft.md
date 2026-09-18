# .agents/performance-ttft.md

## Goal

Optimize first visible output, not just total completion time.

## TTFT decomposition

```text
request
→ auth
→ completeness
→ Qdrant hybrid retrieval
→ parent/evidence assembly
→ prompt
→ LLM request
→ first provider token
→ first SSE write
```

## Instrument

Use `time.perf_counter()`.

Log:

```text
auth_ms
completeness_ms
retrieval_ms
parent_ms
prompt_ms
llm_ttft_ms
first_sse_ms
total_ms
```

## Retrieval optimization order

1. Remove application-side BM25.
2. Use Qdrant dense+sparse hybrid.
3. Use server-side RRF.
4. Keep prefetch sizes modest.
5. Hydrate only unique top parents.
6. Avoid huge prompt contexts.
7. Reuse HTTP clients.
8. Cache short-lived retrieval results.

## Do not

- migrate hosting before measuring;
- add another LLM call in the hot path without evidence it helps;
- stream giant JSON;
- retrieve 20 parents when 4 are enough.
