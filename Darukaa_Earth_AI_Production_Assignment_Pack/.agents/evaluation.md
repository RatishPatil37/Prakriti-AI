# .agents/evaluation.md

## Mandatory tests

### Retrieval

- dense-only baseline
- sparse-only baseline
- hybrid
- no-evidence response

### Scientific grounding

Verify that all quantitative claims have supporting evidence.

### Multi-metric

At least three linked variables in intervention answers where evidence supports it.

### Clarification

Incomplete query produces 2–3 focused questions.

### Security

- user A cannot retrieve user B private document;
- cache cannot leak;
- deletion removes retrieval;
- fallback cannot cross tenant boundary.

### Streaming

Measure:

```text
first SSE byte
first token
total time
```

### Failure

Test:

- Qdrant timeout;
- Gemini 429;
- Gemini 5xx;
- malformed model output;
- corrupted PDF;
- oversized file.
