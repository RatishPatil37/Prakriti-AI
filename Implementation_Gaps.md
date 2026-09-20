
MASTER PROMPT — PRAKRITI-AI FINAL HARDENING PASS

You are working on the existing repository:

https://github.com/RatishPatil37/Prakriti-AI

PROJECT:
Prakriti-AI — AI Environmental Scientist / biodiversity intelligence system for the Darukaa.Earth assignment.

IMPORTANT:
This is the FINAL HARDENING PASS.
Do NOT redesign the application.
Do NOT replace working architecture.
Do NOT add random frameworks, unnecessary services, or speculative features.
Do NOT invent capabilities that are not supported by the existing code.
Preserve the current frontend design and working deployment.
Make the smallest safe changes necessary to close the remaining implementation gaps.

CURRENT STACK:

- Frontend: React + TypeScript + Vite + Tailwind
- Backend: FastAPI
- Auth: Supabase Auth / JWT
- Database: Supabase Postgres
- Vector DB: Qdrant Cloud
- Retrieval: Dense + BM25 sparse + RRF
- Embeddings: FastEmbed / all-MiniLM-L6-v2
- LLM: Gemini
- Streaming: SSE
- Deployment: Vercel frontend + Render backend
- Public scientific corpus: 4 PDFs already present in data/corpus/

KNOWN CURRENT STRENGTHS THAT MUST NOT BE BROKEN:

- Qdrant hybrid retrieval
- dense + sparse retrieval
- server-side RRF
- public/private tenant isolation
- verified JWT identity
- private document ownership checks
- IDOR protection
- synchronous Qdrant deletion
- rate limiting
- zero-LLM completeness / clarification logic
- multi-metric reasoning scaffold
- evidence manifest
- citation ID validation
- SSE streaming
- client disconnect handling
- existing automated backend tests
- current frontend UI
- current Vercel/Render deployment

==================================================
PHASE 0 — INSPECT BEFORE MODIFYING
===================================

First inspect the CURRENT main branch and understand the actual implementation.

Inspect at minimum:

backend/src/api/auth.py
backend/src/api/main.py
backend/src/api/schemas.py
backend/src/api/supabase_db.py
backend/src/api/rate_limit.py

backend/src/retriever/hybrid_search.py
backend/src/retriever/qdrant_store.py
backend/src/retriever/embeddings.py

backend/src/intelligence/completeness.py
backend/src/intelligence/reasoning_graph.py
backend/src/intelligence/evidence_gate.py

backend/src/generator/prompts.py
backend/src/generator/llm_router.py
backend/src/generator/stream.py

backend/src/ingestion/parser.py
backend/src/ingestion/chunker.py
backend/src/ingestion/indexer.py
backend/src/ingestion/sanitizer.py

backend/scripts/seed_public_kb.py

backend/tests/
supabase_schema.sql
supabase_migration.sql
README.md
Implementation_Gaps.md

frontend/src/
frontend/package.json
render.yaml
vercel.json
.github/workflows/

Before editing, determine which of the issues below are:

1. already fixed,
2. partially fixed,
3. still actually present.

Do NOT blindly implement something that already exists.

==================================================
ISSUE 1 — SCIENTIFIC KNOWLEDGE MODEL / ENVIRONMENTAL METRICS
=============================================================

The system currently has structured environmental input fields such as:

- soil organic carbon / SOC
- soil pH
- rainfall
- temperature
- land use
- crop / vegetation
- water availability
- region / coordinates

The remaining gap is that some challenge-relevant environmental dimensions are not explicitly modeled as structured data.

Review the existing schemas and architecture.

Where appropriate, add structured support for the following environmental indicators WITHOUT creating an unnecessary separate database or overengineering the system:

- soil_moisture
- species_richness
- habitat_diversity
- pollution
- deforestation / forest-cover impact

Requirements:

- Keep fields optional.
- Do not force these values into every query.
- Preserve the existing completeness behavior.
- Intervention queries should only request fields that are actually needed.
- Conceptual questions must continue to work without these metrics.
- Do not invent default values.
- Missing metrics must remain explicitly missing/null.
- Do not fabricate environmental measurements.

Use the existing EnvironmentalContext / QueryRequest architecture where possible.

Also make sure the metrics are used consistently across:

- schema
- completeness detection
- reasoning logic
- prompts
- frontend context UI if the UI already has a natural place for them

Do NOT build a geospatial engine just to claim geo support.

==================================================
ISSUE 2 — SCIENTIFIC CLAIM → EVIDENCE GROUNDING
=================================================

Current citation validation is good at checking whether the model cites valid evidence IDs such as [S1], [S2].

However, valid citation ID != proof that the actual claim is supported by the cited source.

Strengthen the existing evidence layer without trying to build a full scientific theorem prover.

Goal:
Make quantitative/scientific claims more defensible.

Implement a lightweight claim/evidence integrity mechanism around the existing pipeline.

Preferred approach:

1. Build an evidence manifest containing:

   - source_id
   - title
   - organization
   - publication year
   - page
   - section
   - excerpt/text
   - source URL / DOI where available
2. Ensure the generation prompt explicitly requires:

   - factual claims must be grounded in retrieved evidence
   - quantitative claims require evidence
   - do not invent percentages, thresholds, timelines, or numerical improvements
   - when evidence does not support a number, state that the evidence is insufficient
   - do not treat generic model knowledge as retrieved evidence
3. Strengthen post-generation validation where practical:

   - detect numerical claims
   - detect unsupported quantitative statements
   - detect citations attached to claims
   - reject or flag clearly unsupported quantitative claims
   - do NOT blindly reject every sentence without a citation
   - allow general explanatory statements where scientifically appropriate
4. Preserve the existing citation manifest behavior.
5. If full semantic claim verification would require an additional LLM/API call or expensive infrastructure, do NOT add it unless clearly necessary.
   Prefer deterministic safeguards plus strong evidence-grounded prompting.

IMPORTANT:
Do not create fake "verification" logic that merely checks whether [S1] exists.
The implementation should distinguish citation-reference validity from claim-support confidence.

==================================================
ISSUE 3 — PUBLIC CORPUS SOURCE METADATA
========================================

Audit the public ingestion pipeline, especially:

backend/scripts/seed_public_kb.py
backend/src/ingestion/indexer.py
backend/src/intelligence/evidence_gate.py

The actual public corpus currently contains these four documents:

1. IPBES_2018_Land_Degradation_and_Restoration_SPM.pdf
2. IPBES_2019_Global_Biodiversity_Assessment_SPM.pdf
3. IPCC_2019_Climate_Change_and_Land_SPM.pdf
4. IUCN_Global_Ecosystem_Typology_2.0.pdf

Make sure their metadata preserves the real source organization.

Do NOT collapse everything into:
"Public Scientific Corpus"

Instead preserve source-specific organization metadata such as:

- IPBES
- IPCC
- IUCN

Where available, also preserve:

- source title
- publication year
- official URL
- DOI
- section
- page
- license
- source type

Most importantly:
The evidence quality gate must correctly recognize authoritative organizations from these actual documents.

Audit the complete flow:

PDF
→ parser
→ chunker
→ indexer
→ Qdrant payload
→ retrieval
→ evidence manifest
→ evidence quality gate
→ frontend evidence card

Do not fix only one layer.

Add/update tests so source metadata survives ingestion and retrieval.

==================================================
ISSUE 4 — HARD-CODED QUANTITATIVE FALLBACK CLAIMS
==================================================

Audit:

backend/src/generator/llm_router.py
backend/src/generator/prompts.py
backend/src/intelligence/evidence_gate.py

Look specifically for hard-coded quantitative claims such as:

- percentage improvements
- SOC changes
- water holding capacity percentages
- biodiversity increases
- 12–24 month claims
- numeric ecological benchmarks

If any fallback/mock/demo response contains scientific numbers that are not dynamically grounded in retrieved evidence:

REMOVE or replace them with clearly labeled non-quantitative fallback text.

Fallback/demo mode must NEVER look like real scientific evidence.

Examples of acceptable fallback behavior:

- "Insufficient retrieved evidence to support a quantitative estimate."
- "The available evidence supports the direction of the intervention, but not a reliable numerical effect size."
- "A site-specific estimate would require additional field measurements."

Do NOT hard-code invented scientific results just to make the UI look impressive.

==================================================
ISSUE 5 — CONVERSATION MEMORY
==============================

Audit the current conversation architecture.

There is already:

- Supabase conversation/message schema
- recent conversation context passed to the model

Determine exactly what is implemented today.

Goal:
Support genuine conversation continuity while preserving the current architecture.

At minimum:

- the current conversation context should remain available to the next request
- user messages and assistant responses should be persistable
- conversation ownership must be tied to verified JWT user_id
- one user must never read another user's conversation
- conversation retrieval must be scoped by owner_user_id
- do not trust conversation ownership from request body
- do not expose another user's messages through IDs

If the current UI/API already has conversation persistence functionality, FIX only the missing restoration/read path.

If full persistence is already implemented, do not rewrite it.

Add security tests for conversation isolation if absent.

IMPORTANT:
Anonymous scientific queries may continue to work publicly.
Do not break public querying just because conversation persistence requires authentication.

==================================================
ISSUE 6 — STRICT OUTPUT STRUCTURE
==================================

Audit the current response format.

The current system prompts the model to produce useful sections such as:

- recommendation
- reasoning
- impacted metrics
- time horizon
- uncertainty/evidence

However, a prompt is not the same thing as a strict response schema.

Determine whether the current API actually enforces a structured response model.

If it does NOT:
Add a lightweight typed response contract where practical.

Preferred fields:

{
  "answer": "...",
  "recommendations": [...],
  "impacted_metrics": [...],
  "time_horizon": "...",
  "uncertainty": "...",
  "evidence_quality": "...",
  "citations": [...]
}

Requirements:

- preserve current SSE streaming UX
- do not break free-form scientific explanations
- do not force meaningless recommendations for conceptual questions
- fields can be empty/null where not applicable
- citation IDs must still match retrieved evidence
- frontend should continue rendering naturally

If strict structured parsing would destabilize the existing streaming implementation, introduce a safe response envelope rather than rewriting the entire streaming architecture.

==================================================
ISSUE 7 — GEO/SPATIAL CLAIMS
=============================

Audit current region/coordinate support.

Do NOT claim:
"full geospatial intelligence"
"GIS analysis"
"spatial reasoning engine"

unless such functionality actually exists.

It is acceptable to support:

- region text
- coordinates as environmental context
- retrieval filters or contextual inputs

Document and implement this accurately.

If region_or_coords already exists and works, preserve it.

Do not add PostGIS, maps, geocoding APIs, satellite APIs, etc. unless they are already part of the project.

==================================================
ISSUE 8 — README / DOCUMENTATION HONESTY
=========================================

Audit README.md and remove marketing-heavy or potentially overclaimed wording.

Do NOT describe the project using claims that are not directly demonstrated by the code.

Examples to avoid unless objectively verified:

- "enterprise-grade"
- "audit-ready"
- "scientifically verified"
- "fully autonomous scientist"
- "sub-second" as a guaranteed response-time promise
- "claim validation" if only citation-ID validation exists
- "persistent memory" if only recent prompt context exists
- "full geospatial intelligence" if only coordinates are accepted

Use precise wording instead.

Documentation should say what is implemented, not what is planned.

Keep it professional and technical.

Do NOT mention:

- "vibe coded"
- how the project was generated
- Antigravity
- internal development workflow
- AI-generated-code disclaimers

==================================================
ISSUE 9 — FOUR-DOCUMENT KNOWLEDGE BASE DOCUMENTATION
=====================================================

Make the README explicitly identify the actual public knowledge base.

Add a concise section:

"Public Scientific Knowledge Base"

List exactly these four currently seeded documents:

1. IPBES 2018 — Land Degradation and Restoration — Summary for Policymakers
2. IPBES 2019 — Global Assessment Report on Biodiversity and Ecosystem Services — Summary for Policymakers
3. IPCC 2019 — Climate Change and Land — Summary for Policymakers
4. IUCN — Global Ecosystem Typology 2.0

Use the repository filenames where helpful.

Make it clear these are the four documents currently present in data/corpus/.

Do NOT claim the fifth ~111 MB document is indexed if it is not.

Do NOT invent additional corpus sources.

==================================================
ISSUE 10 — TESTING
===================

After changes, expand the existing tests only where necessary.

At minimum verify:

A. Environmental context

- optional metrics accepted
- missing metrics remain missing
- conceptual query does not unnecessarily trigger clarification
- intervention query asks for actually relevant missing context

B. Scientific grounding

- valid citation ID passes
- unknown citation ID fails
- unsupported quantitative claim is flagged/rejected where applicable
- no fake fallback scientific numbers

C. Source metadata

- IPCC metadata remains IPCC
- IPBES metadata remains IPBES
- IUCN metadata remains IUCN

D. Tenant security

- User A private document invisible to User B
- User A private source inaccessible to User B
- anonymous user sees public corpus only
- topical-filter relaxation never removes tenant isolation

E. Conversation security

- User A cannot load User B conversation
- User A cannot load User B messages

F. Production auth

- unsigned JWT rejected in production
- no client-supplied user_id can override verified JWT identity

G. Streaming

- SSE still works
- disconnect cancellation still works

H. Frontend

- TypeScript build passes
- Vite production build passes

Run the FULL existing backend test suite after modifications.

Do not delete existing tests just to make the suite pass.

==================================================
ISSUE 11 — PERFORMANCE / DEPLOYMENT SAFETY
===========================================

Do not introduce:

- Redis
- Kafka
- Celery
- Kubernetes
- background worker infrastructure
- another vector DB
- another database
- unnecessary external APIs

The current deployment architecture is intentionally simple:

Vercel
→ Render
→ Qdrant Cloud
→ Supabase
→ Gemini

Preserve that.

Keep warm-request latency instrumentation if it exists.

Do not make "sub-second TTFT" a guaranteed claim.
Describe it as a measured warm-target/observed metric only if the code actually measures it.

Do not compromise deployment stability for speculative optimization.

==================================================
ISSUE 12 — SECURITY REVIEW
===========================

Perform one final security audit of:

- auth
- document upload
- source lookup
- deletion
- query retrieval
- conversation retrieval
- Supabase service-role access
- Qdrant filters
- request-body user IDs
- CORS
- secrets

Critical invariant:

PUBLIC:
scope == "public"

PRIVATE:
scope == "private"
AND
owner_user_id == verified JWT sub

This invariant MUST NEVER be relaxed.

Any fallback retrieval/filter relaxation may only remove topical filters.
It must NEVER remove tenant ownership restrictions.

Never trust:

- user_id from JSON body
- user_id from query parameter
- user_id from frontend state
- conversation owner_id from client payload

Identity must come from verified JWT.

Also verify:
GET /api/v1/sources/{source_id}
cannot become an IDOR path.

==================================================
PHASE 1 — IMPLEMENT CAREFULLY
==============================

After inspection:

1. Fix only confirmed issues.
2. Preserve existing architecture.
3. Keep changes minimal and readable.
4. Reuse existing classes/functions.
5. Avoid duplicate logic.
6. Do not silently change API contracts unless necessary.
7. Add tests for each important fix.
8. Keep frontend behavior visually consistent.
9. Do not add speculative features.

==================================================
PHASE 2 — VERIFY
=================

Run:

Backend:
python -m pytest backend/tests/ -v

Frontend:
cd frontend
npm run build

Also perform static inspection of:

- auth boundaries
- Qdrant filters
- source metadata
- fallback generation
- conversation ownership
- structured output path

If possible, run the relevant deployed endpoint smoke tests as well.

Expected final condition:

- existing tests still pass
- new tests pass
- frontend builds
- no secrets committed
- no existing core functionality broken

==================================================
PHASE 3 — FINAL REPORT
=======================

At the end, report:

1. Files changed
2. Bugs/gaps actually fixed
3. Issues that were already fixed before this pass
4. Tests added
5. Full test result
6. Frontend build result
7. Any remaining limitations
8. Any changes that were intentionally NOT made because they would be overengineering

DO NOT claim something is fixed unless you actually verified it.

IMPORTANT FINAL RULE:
This is a production/submission hardening pass, NOT a feature-generation pass.

Prioritize:
correctness
security
scientific honesty
evidence grounding
maintainability
deployment stability

over:
adding more features
adding more infrastructure
marketing language
visual gimmicks
complexity
