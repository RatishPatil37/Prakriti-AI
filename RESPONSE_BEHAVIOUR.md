
**PRAKRITI-AI — QUERY HANDLING REFACTOR**

Inspect the existing repository first. Do not rewrite the architecture.

**Goal:**
Make Prakriti feel natural for casual conversation while using
semantic relevance + evidence gating for environmental questions.

**IMPORTANT:**
Do NOT solve this by adding a huge list of regexes/prompts for
pizza, riddles, trivia, sports, etc.

Use a layered approach:

1. SIMPLE CONVERSATION
   Handle only genuinely lightweight cases deterministically:

- hi / hello / hey
- thanks / thank you
- okay / ok / got it
- bye / goodbye
- help
- what can you do?

Responses should be short and human.

Example:

"hi"
→ "Hi. What are you researching?"

"thanks"
→ "You're welcome."

"what can you do?"
→ concise explanation of Prakriti.

NEVER produce long responses like:

"Hello! My name is Prakriti, an advanced ecological intelligence
assistant..."

Do not repeatedly explain Prakriti's mandate.

2. MIXED QUERIES

A greeting must NOT override scientific intent.

Examples:

"hi, my soil carbon is declining"
"hello, how does biodiversity loss affect agriculture?"

These must enter the scientific pipeline.

3. SEMANTIC DOMAIN RELEVANCE

Inspect the existing `search_hybrid_evidence()` and Qdrant
retrieval implementation.

Use the existing embedding/retrieval infrastructure to determine
whether a query is sufficiently relevant to Prakriti's environmental
knowledge base.

Do NOT hardcode individual trivia questions.

Examples that should normally be rejected before expensive
retrieval:

"recipe for pizza"
"tell me a joke"
"what is 7 * 19?"
"who won the football match?"

Examples that should retrieve:

"how does soil carbon affect biodiversity?"
"what causes land degradation?"
"how can agroforestry improve soil health?"

IMPORTANT:
Do NOT assume embeddings are a perfect classifier.

Inspect existing score behavior and choose/configure thresholds
carefully.

Handle ambiguous queries such as:

"soil"
"carbon"
"water"
"trees"

with clarification rather than automatically rejecting them.

4. EVIDENCE RELEVANCE

After hybrid retrieval:

dense + sparse/BM25
        ↓
RRF
        ↓
relevance threshold
        ↓
usable evidence

Do not pass obviously irrelevant documents into the LLM merely
because Qdrant returned them.

If no sufficiently relevant evidence remains, return an honest
no-evidence/clarification response rather than hallucinating.

5. CITATION-BOUND SOURCES

Preserve the existing `cited_ids` system.

Important invariant:

retrieved sources ≠ displayed sources

Only display a source if:

- it was actually retrieved
- it passed validation
- its citation ID is valid
- the generated answer actually cited it

Therefore:

cited_ids = []
→ UI displays 0 sources

If the model cites S1 and S3:
→ UI displays S1 and S3 only.

Never allow the model to invent citation IDs.

6. OUT-OF-DOMAIN RESPONSES

Keep them short.

Example:

"That's outside what I can help with. I focus on environmental and
ecological questions."

Optionally add one short redirection.

Do not generate a long explanation.

7. PERFORMANCE

Do not claim specific latency/token improvements unless measured.

Add lightweight instrumentation if practical so we can compare:

- retrieval attempted
- number of retrieved candidates
- accepted evidence count
- prompt context size
- latency

The goal is to avoid unnecessary retrieval/generation for clearly
irrelevant queries.

8. PRESERVE EVERYTHING ELSE

Do not break:

- Supabase authentication
- JWT verification
- public/private document isolation
- Qdrant
- dense + BM25 retrieval
- RRF
- evidence validation
- citations
- SSE streaming
- conversation persistence
- uploads/deletion
- rate limiting
- existing API contracts

Do not introduce Redis, Kafka, Celery, Kubernetes, another vector DB,
or another LLM provider.

9. TESTS

Add/update tests for:

CONVERSATIONAL:
"hi"
"thanks"
"okay"
"bye"

MIXED:
"hi, my soil carbon is declining"

IRRELEVANT:
"recipe for pizza"
"tell me a joke"
"what is 7 * 19?"

RELEVANT:
"how does soil carbon affect biodiversity?"

AMBIGUOUS:
"soil"
"carbon"

CITATION:
retrieved S1,S2,S3 + cited S1
→ UI only shows S1

invalid citation ID
→ must never reach UI

no valid evidence
→ honest no-evidence behavior

Run all existing tests before and after the change.

Also run frontend type-check/build.

10. FINAL CHECK

Before finishing, inspect the diff and make sure:

- no giant regex list was introduced
- no duplicate frontend/backend business logic was created
- no security behavior was weakened
- no unrelated UI/backend functionality was changed
- no unsupported performance claims were added

Report:

- files changed
- implementation summary
- thresholds introduced
- tests added/updated
- test/build results
- any remaining limitations
