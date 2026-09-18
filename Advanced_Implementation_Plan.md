
I reviewed the **entire IDE-generated implementation plan** against the architecture and constraints we established. The core architecture is strong, but **I would not let Antigravity start coding this exact plan yet**. There are a few important corrections.

## Overall verdict

**Architecture: ✅ correct and well aligned**

The plan correctly carries over the most important things we designed: Qdrant as the primary knowledge layer, dense + sparse retrieval with RRF, public/private knowledge separation, JWT-derived identity, no tenant-filter fallback, evidence IDs, SSE streaming, security tests, and a dedicated scientific reasoning layer.

But I found **7 things that need adjustment before implementation**.

---

# 🔴 1. JWT verification needs to be fixed

The plan says:

> “Decodes and verifies RS256/HS256 tokens using `SUPABASE_JWT_SECRET`.”

That is too loose technically. Supabase JWTs can use asymmetric signing, where verification should use the issuer/JWKS public keys; `sub` is indeed the user identifier. Supabase explicitly recommends verified claims/JWKS rather than implementing token verification yourself. ([Supabase][1])

### Change it to

```text
Supabase Auth JWT
        ↓
verify signature + issuer + audience + expiry
        ↓
JWKS / appropriate signing key
        ↓
verified sub
        ↓
verified_user_id
```

Support legacy HS256 only where the project actually uses the legacy JWT secret.

**This is a must-fix.**

---

# 🔴 2. The embedding architecture has a missing piece

This is probably the biggest implementation gap.

The plan defines:

```text
DENSE_MODEL_NAME=sentence-transformers/all-MiniLM-L6-v2
DENSE_VECTOR_SIZE=384
```

but explicitly says the backend will omit `sentence-transformers` and `torch`.

So Antigravity must answer:

> **Who actually generates the 384-dimensional dense embeddings?**

The clean solution is to explicitly use **Qdrant Cloud Inference** for both dense and BM25 query/document embeddings. Qdrant documents this exact hybrid pattern with `all-minilm-l6-v2`, native BM25, and RRF. ([Qdrant][2])

### Change the plan to explicitly say

```text
Document text
   ↓
Qdrant Cloud Inference
   ├── dense: all-MiniLM-L6-v2
   └── sparse: Qdrant/bm25
   ↓
Qdrant
```

Then the dependency list makes sense.

**Must-fix.**

---

# 🟢 3. Qdrant hybrid architecture is correct

This part is actually very good.

The plan uses:

```text
dense prefetch: 20
sparse BM25 prefetch: 20
        ↓
      RRF
        ↓
      top 8
```

Qdrant officially supports running dense + sparse prefetches in one query and fusing them with RRF. ([Qdrant][2])

The immutable filter is also correctly structured around:

```text
PUBLIC
OR
PRIVATE + owner_user_id == verified_user_id
```

and the plan explicitly says there will be **no fallback that removes the tenant boundary**.

That is exactly what I wanted.

---

# 🔴 4. Do NOT promise “sub-second TTFT”

The plan calls this an architectural guarantee:

> “sub-second TTFT streaming over SSE”

That's too strong.

You're planning to deploy the backend on **Render Free**, and Render currently says free services spin down after 15 minutes idle and can take about a minute to wake up. Render also explicitly says free instances aren't intended for production applications. ([Render][3])

So:

```text
sub-second TTFT
```

should be a **performance target under warm conditions**, not a guarantee.

Change it to:

```text
TTFT is instrumented and optimized toward a sub-second warm-request target.
Cold-start latency is measured separately.
```

And report:

```text
warm TTFT
cold TTFT
P50
P95
```

That is much more credible.

**Must-fix wording.**

---

# 🔴 5. The confidence formula should NOT be implemented as written

This is the part I most strongly disagree with:

```text
Confidence =
0.30 × retrieval_score
+ 0.25 × authority
+ 0.20 × count
+ ...
```

The problem is that these numbers are presented as though they are scientifically meaningful, but there is no calibration/evaluation dataset establishing those weights. Worse, after RRF, the retrieval score isn't naturally a normalized 0–1 confidence probability.

The plan itself currently defines this formula.

### Better approach

Use an **Evidence Quality / Coverage assessment**, for example:

```text
Evidence status:
Strong
Moderate
Limited
Insufficient
```

based on explicitly defined rules such as:

* relevant evidence retrieved
* source provenance available
* multiple independent sources
* query variables covered
* citations map correctly
* contradictory evidence detected

Then later you can experimentally calibrate a numerical score.

This will make the project scientifically much more defensible.

**Must-fix.**

---

# 🔴 6. “Minimum 3 variables” should not be blindly enforced

The plan says the system prompt demands:

> “minimum 3 variables”

and the reasoning graph pushes chains such as:

```text
Cover Crops
↓
SOC + Microbial Biomass
↓
Moisture Retention
↓
Pollinators
```

The **idea is excellent**, but don't force three variables into every answer.

A simple question such as:

> “What is soil organic carbon?”

doesn't need an artificial three-variable explanation.

Instead:

```text
For intervention / diagnosis / recommendation queries:
    reason across multiple relevant variables.

For simple explanatory queries:
    use only variables necessary to answer correctly.
```

Also, the reasoning graph must be treated as a **reasoning scaffold**, not as proof of a causal relationship. The retrieved evidence must support the actual relationship.

---

# 🔴 7. Your SSE frontend choice should be unambiguous

The plan says:

> `EventSource / fetch-event-source`

and your query endpoint is:

```text
POST /api/v1/query/stream
```

For this architecture, I would simply standardize on:

```text
fetch-event-source
```

because you need POST + Authorization header + request body.

Don't leave Antigravity deciding between two client models.

---

# 🟡 One more important performance consideration

This part:

> “Child payloads carry `parent_text` ... eliminating additional network round-trips.”

is reasonable, but it isn't automatically faster.

If every retrieved child carries a 700–1100-token parent, you may transfer and send a **lot** of duplicated text.

I'd benchmark:

```text
Option A:
child + parent_text in payload

versus

Option B:
retrieve children
→ batch unique parent IDs
→ fetch parents once
```

Whichever produces better:

```text
retrieval_ms
payload_bytes
prompt_tokens
llm_ttft_ms
```

wins.

Don't hard-code the assumption before measuring.

---

# 🟡 The public corpus needs stronger provenance

The ingestion plan is good and the source organizations are sensible.

But `data/corpus/` should not become merely a collection of AI-written summaries.

Ideally each knowledge record should preserve:

```text
source_id
organization
title
publication_year
official_url
DOI (if applicable)
license
page
section
original/extracted text
```

Then the answer can say:

```text
[S1] IPCC AR6, Chapter X, p. 123
[S2] FAO, Report Y, p. 47
```

rather than citing a generated summary that happens to mention the source.

That matters a lot for your assignment's scientific-grounding score.

---

# 🟡 Document deletion needs `wait=true`

The plan promises:

> “deleted document is immediately purged from Qdrant retrieval.”

Qdrant documents that writes/deletes can be acknowledged before the change is fully applied; `wait=true` is available when you need the operation completed before continuing. ([Qdrant][4])

So your delete flow should be:

```text
DELETE request
 ↓
verify owner_user_id
 ↓
Qdrant delete(wait=True)
 ↓
verify / update Supabase metadata
 ↓
success
```

Then test it.

---

# 🟡 `/sources/{source_id}` is an access-control surface

This endpoint is easy to overlook:

```text
GET /api/v1/sources/{source_id}
```

Every source lookup must enforce the **same public/private authorization rule** as retrieval.

Otherwise you could have:

```text
Search endpoint → secure ✅
Source endpoint → IDOR vulnerability ❌
```

So make this explicit in the plan.

---

# 🟡 Render + Vercel architecture is okay, but don't make Vercel proxy mandatory

For the frontend/backend split:

```text
Vercel
   ↓
Render FastAPI
```

is fine.

But for your performance-focused SSE architecture, I'd prefer the browser to connect directly to the FastAPI API in production:

```text
Browser
 ├── Vercel static frontend
 │
 └── HTTPS → Render API
```

with strict CORS.

A proxy/rewrite adds another layer to streaming without solving the underlying TTFT problem.

---

# 🟢 The testing plan is excellent

This is one of the strongest parts.

Especially:

```text
User A private document
        ↓
User B exact-text query
        ↓
must NOT retrieve
```

and:

```text
filter relaxation
        ↓
tenant boundary must remain
```

That's exactly the kind of test that demonstrates you understood the multi-tenancy problem rather than just writing:

```python
if user_id == ...
```

---

# Final assessment

### Keep exactly as designed

```text
React/Vite
      ↓
Supabase Auth
      ↓
FastAPI
      ↓
Completeness Engine
      ↓
Qdrant Cloud
  dense + BM25
      ↓
RRF
      ↓
Evidence validation
      ↓
Gemini
      ↓
SSE
      ↓
UI
```

This core architecture is sound.

### Modify before coding

```text
1. Fix Supabase JWT verification
2. Explicitly define Qdrant Cloud Inference for embeddings
3. Change "sub-second TTFT guarantee" → measurable warm-request target
4. Replace arbitrary confidence formula
5. Make 3-variable reasoning conditional on query type
6. Standardize frontend on fetch-event-source
7. Enforce authorization on /sources and document operations
8. Use wait=True for deletion verification
9. Preserve primary-source provenance in the KB
```
