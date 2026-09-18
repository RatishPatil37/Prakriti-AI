# Darukaa.Earth — AI Biodiversity Intelligence Chatbot Challenge
## Official Project Submission Document

### 1. Repository Link
- **GitHub Repository**: [https://github.com/RatishPatil37/Prakriti-AI](https://github.com/RatishPatil37/Prakriti-AI)
- **Reviewer Access**: If private, full collaborator access is granted to:
  - `ankita.dasgupta@darukaa.com`
  - `harsh.kumar@darukaa.com`
  - `utkarsh.gauniyal@darukaa.com`
  - `guneet.mutreja@darukaa.com`

---

### 2. Live Demo URL
- **Production Web Application**: [https://darukaa-earth-ai.vercel.app](https://darukaa-earth-ai.vercel.app)
- **Backend Health Check**: `https://darukaa-earth-ai-api.onrender.com/health`
- **Readiness Probe**: `https://darukaa-earth-ai-api.onrender.com/ready`

---

### 3. Architecture & Technical Overview

#### A. Multi-Tenant Knowledge Architecture
- **Vector System of Record**: Qdrant Cloud collection (`darukaa_knowledge`) using named vectors (`dense`: 384d, Cosine; `bm25`: sparse IDF vector) with server-side Reciprocal Rank Fusion (RRF).
- **Tenant Isolation**: Strict JWT-derived user identity (`sub` claim). Every query enforces the immutable visibility filter:
  `scope = 'public' OR (scope = 'private' AND owner_user_id = verified_user_id)`.
  Fallback logic relaxes topical filters, but **NEVER** relaxes the tenant boundary.
- **Synchronous Deletion**: Deletions invoke `qdrant.delete(..., wait=True)` ensuring immediate purge before database confirmation.
- **IDOR Protection**: `GET /api/v1/sources/<built-in function id>` strictly enforces tenant access boundaries.

#### B. Conversational Intelligence & Reasoning
- **Zero-LLM Fast Clarification**: Incomplete intervention requests (e.g. missing SOC %, rainfall, land use) trigger an immediate SSE clarification event with 2–3 targeted questions without consuming LLM tokens.
- **Conditional Multi-Metric Scaffold**:
  - Intervention / Restoration queries explicitly connect $\ge 3$ environmental dimensions (e.g., Cover crops/Tillage → SOC & Moisture → Microbial & Pollinators).
  - Conceptual queries (e.g., "What is soil organic carbon?") provide direct, unforced scientific definitions.
- **Evidence Quality Gate**: Replaces uncalibrated mathematical formulas with qualitative scientific assessment (`Strong`, `Moderate`, `Limited`, `Insufficient`) grounded in source corroboration and provenance.
- **Streaming Citation Integrity**: Pre-generation manifest `[S1]`, `[S2]`, ... emitted in real-time. Strict system prompt prohibits unlisted citations. Post-stream verification records citation audit status before database persistence.

#### C. API Abuse Controls & Defense-in-Depth
- **Rate Limiting**: Sliding window rate limits (5 req/min for anonymous IP; 20 req/min for authenticated `user_id`).
- **Input Quotas**: Max 1,000 chars for questions; max 25MB, max 100 pages, max 10 documents per user.
- **Client Disconnect Cancellation**: SSE stream checks `request.is_disconnected()` and cancels upstream LLM token generation immediately upon client abort.
- **Zero Secret Exposure**: Public client only receives `SUPABASE_ANON_KEY`. All service-role keys remain on the backend.

---

### 4. Database Schema & Setup

#### Postgres Tables (Supabase)
- `documents`: `(id UUID, owner_user_id UUID, title TEXT, scope TEXT, status TEXT, content_hash TEXT, page_count INT, chunk_count INT, created_at TIMESTAMPTZ)`
- `conversations`: `(id UUID, owner_user_id UUID, title TEXT, created_at TIMESTAMPTZ)`
- `messages`: `(id UUID, conversation_id UUID, owner_user_id UUID, role TEXT, content TEXT, citations JSONB, request_id UUID, created_at TIMESTAMPTZ)`
- **RLS Policies**: Row-Level Security enabled on all tables for `owner_user_id = auth.uid()`. Server-side queries explicitly scope to `owner_user_id` as defense-in-depth.

---

### 5. Local Setup & Verification

```bash
# 1. Backend Setup
pip install -r backend/requirements.txt
cp .env.example .env

# 2. Run Automated Test Suite (100% Passing)
pytest backend/tests/ -v

# 3. Start Backend
uvicorn backend.src.api.main:app --reload --port 8000

# 4. Start Frontend
cd frontend
npm install
npm run dev
```

---

### 6. Verification Results
- **Security Isolation Tests A–F**: Passed (User B cannot retrieve User A's private documents or query unique phrases; synchronous deletion verified; IDOR guarded).
- **Citation Integrity & Quality Assessment**: Passed.
- **Zero-LLM Clarification**: Passed.
- **Streaming & Disconnect Cancellation**: Passed.
