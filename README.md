# 🌿 Prakriti AI — AI Biodiversity & Environmental Science Intelligence Platform

<p align="center">
  <img src="https://img.shields.io/badge/Status-Production%20Ready-10B981?style=for-the-badge&logo=statuspage&logoColor=white" alt="Production Ready" />
  <img src="https://img.shields.io/badge/Pytest-25%2F25%20Passed-10B981?style=for-the-badge&logo=pytest&logoColor=white" alt="Pytest Passed" />
  <img src="https://img.shields.io/badge/Qdrant%20Cloud-Hybrid%20RRF-009245?style=for-the-badge&logo=qdrant&logoColor=white" alt="Qdrant Hybrid" />
  <img src="https://img.shields.io/badge/LLM%20Chain-Gemini%20%2B%20Groq-4285F4?style=for-the-badge&logo=google&logoColor=white" alt="Gemini LLM" />
  <img src="https://img.shields.io/badge/Telemetry-Langfuse%20Tracing-FF6B6B?style=for-the-badge&logo=apacheairflow&logoColor=white" alt="Langfuse Tracing" />
  <img src="https://img.shields.io/badge/Security-JWKS%20Multi--Tenant-0E241C?style=for-the-badge&logo=auth0&logoColor=white" alt="Tenant Isolation" />
</p>

---

## 📑 Table of Contents
- [1. Overview & Core Specifications](#1-overview--core-specifications)
- [2. Live Deployments & Health Endpoints](#2-live-deployments--health-endpoints)
- [3. System Architecture](#3-system-architecture)
  - [3.1 High-Level Component Topology](#31-high-level-component-topology)
  - [3.2 End-to-End Query Execution Pipeline](#32-end-to-end-query-execution-pipeline)
  - [3.3 Zero-Trust Multi-Tenant Isolation Flow](#33-zero-trust-multi-tenant-isolation-flow)
  - [3.4 Hybrid Vector Retrieval & Server-Side RRF Fusion](#34-hybrid-vector-retrieval--server-side-rrf-fusion)
- [4. Technical Core & Invariants](#4-technical-core--invariants)
  - [4.1 Hybrid Retrieval Engine (Qdrant RRF)](#41-hybrid-retrieval-engine-qdrant-rrf)
  - [4.2 Deterministic Guardrails & Zero-LLM Pre-Filters](#42-deterministic-guardrails--zero-llm-pre-filters)
  - [4.3 3-Tier LLM Resiliency Chain](#43-3-tier-llm-resiliency-chain)
  - [4.4 Full-Lifecycle Observability (Langfuse)](#44-full-lifecycle-observability-langfuse)
  - [4.5 Sub-Second Latency & TTFT Optimizations](#45-sub-second-latency--ttft-optimizations)
- [5. Repository File Structure](#5-repository-file-structure)
- [6. Local Development & Deployment](#6-local-development--deployment)
- [7. Automated Test Suite](#7-automated-test-suite)
- [8. Security & Compliance Invariants](#8-security--compliance-invariants)

---

## 1. Overview & Core Specifications

**Prakriti AI** is an enterprise-grade AI conversational intelligence system engineered for **Darukaa.Earth**. It functions as an authoritative **AI Environmental Scientist**, processing complex ecological dynamics (soil organic carbon, rainfall gradients, agroforestry interventions, microbial biodiversity) into audit-ready scientific decisions grounded in peer-reviewed literature.

### Technical Baseline
* **Runtime Backend**: FastAPI (Python 3.11) on Render Linux Container.
* **Frontend Client**: React 18, TypeScript, Vite, Tailwind CSS on Vercel Edge.
* **Vector Knowledge Layer**: Qdrant Cloud (`darukaa_knowledge`, **1,143 points / 1,144 vectors indexed**).
* **Vector Models**:
  * Dense: `sentence-transformers/all-MiniLM-L6-v2` (384-dimensional, Cosine distance).
  * Sparse: Native lexical term frequency vectors (`Qdrant/bm25`).
* **Authentication**: Supabase Auth (Asymmetric JWKS RS256/ES256 verification with HS256 secret fallback).
* **Database & Persistence**: Supabase PostgreSQL with Row-Level Security (RLS).
* **Telemetry & Tracing**: Langfuse Open-Source Tracing SDK.
* **Streaming Protocol**: Server-Sent Events (SSE) via `@microsoft/fetch-event-source`.

---

## 2. Live Deployments & Health Endpoints

| Service | Host | Status | Endpoint / URL |
| :--- | :--- | :---: | :--- |
| **Web Client** | Vercel Edge CDN | 🟢 Active | [https://prakriti-ai-eta.vercel.app](https://prakriti-ai-eta.vercel.app) |
| **Backend API Gateway** | Render Linux Container | 🟢 Active | [https://prakriti-ai-jgsn.onrender.com](https://prakriti-ai-jgsn.onrender.com) |
| **Liveness Health Check** | Render | 🟢 200 OK | [`/health`](https://prakriti-ai-jgsn.onrender.com/health) |
| **Readiness Probe** | Render | 🟢 200 OK | [`/ready`](https://prakriti-ai-jgsn.onrender.com/ready) |

---

## 3. System Architecture

### 3.1 High-Level Component Topology

```mermaid
flowchart TB
    subgraph ClientTier ["1. Client Tier (Edge CDN — Vercel)"]
        UI["React 18 + TypeScript Interface"]
        Chat["Chat Command Center & Telemetry HUD"]
        History["Conversation Manager (Pinned / Chronological)"]
        ContextModal["Site Context Drawer (SOC %, pH, Rain, Tillage)"]
        SSEClient["fetch-event-source SSE Client"]
        UI --> Chat & History & ContextModal
        Chat --> SSEClient
    end

    subgraph GatewayTier ["2. Ingress & Security Boundary (Render)"]
        RateLimiter["Sliding-Window Rate Limiter<br/>(Anonymous: 5 rpm | Auth: 20 rpm)"]
        AuthFilter["Asymmetric JWKS JWT Verification<br/>(Extracts verified sub as user_id)"]
        SSEClient -->|HTTPS POST + Bearer JWT| RateLimiter
        RateLimiter --> AuthFilter
    end

    subgraph IntelligenceTier ["3. Deterministic Pipeline & Orchestrator (FastAPI)"]
        ScopeGate{"Deterministic Scope Gate<br/>(is_out_of_scope_query)"}
        CompletenessGate{"Zero-LLM Completeness Filter<br/>(<5ms parameter validation)"}
        RAGOrchestrator["RAG Query Orchestrator & TTFT Profiler"]
        QualityGate["Evidence Quality Evaluator<br/>(Strong / Moderate / Limited)"]
        LLMChain["3-Tier Model Fallback Engine<br/>(Gemini 3.5 / 3.1 / 3.6 / Groq Llama)"]
        DisconnectHook["Client Disconnect Cancellation Watcher"]

        AuthFilter --> ScopeGate
        ScopeGate -- "Out-of-Scope" --> LLMChain
        ScopeGate -- "In-Scope" --> CompletenessGate
        CompletenessGate -- "Missing Parameters" --> SSEClient
        CompletenessGate -- "Valid Query" --> RAGOrchestrator
        RAGOrchestrator --> QualityGate
        QualityGate --> LLMChain
        LLMChain --> DisconnectHook
        DisconnectHook -->|Streamed SSE Chunks| SSEClient
    end

    subgraph KnowledgeTier ["4. Vector Knowledge Layer (Qdrant Cloud)"]
        DenseModel["FastEmbed ONNX<br/>all-MiniLM-L6-v2 (384d)"]
        SparseModel["FastEmbed BM25<br/>Lexical Term Vectors"]
        QdrantEngine[("Qdrant Cluster: darukaa_knowledge<br/>1,143 Indexed Points")]
        RRFCore["Server-Side Reciprocal Rank Fusion<br/>Fusion.RRF(top_k=20)"]

        RAGOrchestrator --> DenseModel & SparseModel
        DenseModel & SparseModel --> QdrantEngine
        QdrantEngine --> RRFCore
        RRFCore --> RAGOrchestrator
    end

    subgraph PersistenceTier ["5. Persistence & Multi-Tenancy (Supabase)"]
        PostgresDB[("Supabase PostgreSQL<br/>(RLS + owner_user_id Scoping)")]
        FileVault[("Encrypted Storage Bucket<br/>(Private PDF Vault)")]
        History <--> PostgresDB
        RAGOrchestrator <--> FileVault
    end

    subgraph ObservabilityTier ["6. Telemetry & DevOps"]
        LangfuseSuite["Langfuse AI Observability<br/>(Root Traces, Spans, TTFT & Citations)"]
        KeepAlive["GitHub Actions Cron<br/>(10-min keep-alive ping)"]
        RAGOrchestrator -.->|Async Telemetry Batch| LangfuseSuite
        KeepAlive -.->|GET /health| RateLimiter
    end

    classDef client fill:#0B1A14,stroke:#009245,stroke-width:1.5px,color:#fff;
    classDef gateway fill:#07130E,stroke:#4285F4,stroke-width:1.5px,color:#fff;
    classDef logic fill:#0D241A,stroke:#A9EE70,stroke-width:1.5px,color:#fff;
    classDef vector fill:#040D09,stroke:#009245,stroke-width:2px,color:#fff;
    classDef db fill:#111827,stroke:#6B7280,stroke-width:1.5px,color:#fff;
    classDef telemetry fill:#1F1318,stroke:#FF6B6B,stroke-width:1.5px,color:#fff;

    class UI,Chat,History,ContextModal,SSEClient client;
    class RateLimiter,AuthFilter gateway;
    class ScopeGate,CompletenessGate,RAGOrchestrator,QualityGate,LLMChain,DisconnectHook logic;
    class DenseModel,SparseModel,QdrantEngine,RRFCore vector;
    class PostgresDB,FileVault db;
    class LangfuseSuite,KeepAlive telemetry;
```

---

### 3.2 End-to-End Query Execution Pipeline

```mermaid
flowchart TD
    Start(["Incoming Query: POST /api/v1/query/stream"]) --> AuthStep["1. Validate JWT via Supabase JWKS Endpoint"]
    AuthStep --> RateStep["2. Evaluate Sliding-Window Rate Limit"]
    
    RateStep --> ScopeStep{"3. Deterministic Scope Gate<br/>(Regex & Pattern Matcher)"}
    
    %% Branch A: Out of Scope
    ScopeStep -- "Out-of-Scope<br/>(Math, Pop Culture, Trivia)" --> BypassRetrieval["Bypass Qdrant Retrieval<br/>(Prevent bogus citations & save compute)"]
    BypassRetrieval --> RefusalPrompt["Construct Direct Domain Refusal Prompt"]
    RefusalPrompt --> StreamRefusal["Stream Polite Refusal & Suggest Environmental Topics"]
    StreamRefusal --> EndStream(["Emit done SSE Event & Flush Telemetry"])

    %% Branch B: In Scope
    ScopeStep -- "In-Scope Environmental Query" --> CompStep{"4. Completeness Filter<br/>(Check SOC%, Rain, Soil Type)"}
    
    CompStep -- "Missing Ecological Inputs" --> EmitClarification["Emit clarification SSE Event<br/>(Latency: <5ms | 0 LLM Tokens)"]
    EmitClarification --> EndStream

    CompStep -- "Parameters Sufficient" --> ParallelEmbedding["5. Generate Embeddings (In-Memory FastEmbed)<br/>• Dense: 384d ONNX Vector (~15ms)<br/>• Sparse: BM25 Token Weights (~0.1ms)"]
    
    ParallelEmbedding --> QdrantSearch["6. Execute Qdrant Hybrid Search<br/>• Filter: (scope == 'public') OR (scope == 'private' AND owner == verified_user_id)<br/>• Server-side Reciprocal Rank Fusion (RRF)"]
    
    QdrantSearch --> QualityStep["7. Evaluate Evidence Quality Gate<br/>(Strong / Moderate / Limited / Insufficient)"]
    
    QualityStep --> ManifestStep["8. Emit evidence Manifest Event<br/>[S1], [S2], ... with Excerpts, DOIs, and Provenance"]
    
    ManifestStep --> PromptBuild["9. Construct Multi-Metric Causal Prompt<br/>(Mandates >=3 connected ecological dimensions)"]
    
    PromptBuild --> LLMStream["10. Stream Tokens from 3-Tier Fallback Chain<br/>(Gemini 3.5-flash-lite -> 3.1-flash-lite -> 3.6-flash -> Groq)"]
    
    LLMStream --> CitationAudit["11. Post-Stream Citation Audit<br/>(Verify all emitted [SX] tags map to real retrieved chunks)"]
    
    CitationAudit --> EndStream
```

---

### 3.3 Zero-Trust Multi-Tenant Isolation Flow

```mermaid
sequenceDiagram
    autonumber
    actor Client as Authenticated Client
    participant Gateway as FastAPI Ingress Guard
    participant JWKS as Supabase JWKS Server
    participant Qdrant as Qdrant Cloud Cluster
    participant Postgres as Supabase PostgreSQL

    Client->>Gateway: POST /api/v1/query/stream (Authorization: Bearer <JWT>)
    Gateway->>JWKS: Fetch / Verify Public Key Signature (RS256 / ES256)
    alt Invalid Signature or Expired Token
        Gateway-->>Client: 401 Unauthorized (Terminated at Gateway)
    else Cryptographically Verified
        Gateway->>Gateway: Extract 'sub' claim as verified_user_id (Discard any client-sent user_id)
        Gateway->>Qdrant: Hybrid Search with Immutable Filter:<br/>(scope == 'public') OR (scope == 'private' AND owner_user_id == verified_user_id)
        Note over Qdrant: Zero data leakage across tenants.<br/>Security boundary is strictly non-relaxable.
        Qdrant-->>Gateway: Return Scored, Tenant-Isolated Evidence Chunks
        Gateway->>Postgres: Fetch / Update Chat History (owner_user_id = verified_user_id)
        Note over Postgres: Enforced via PostgreSQL Row-Level Security (RLS)
        Postgres-->>Gateway: Return Scoped Conversation Sessions
        Gateway-->>Client: Stream Response with Verified Evidence
    end
```

---

### 3.4 Hybrid Vector Retrieval & Server-Side RRF Fusion

```mermaid
flowchart LR
    UserQuery["User Query String"] --> DenseVector["FastEmbed ONNX<br/>all-MiniLM-L6-v2<br/>(384d Dense Vector)"]
    UserQuery --> SparseVector["FastEmbed BM25<br/>Qdrant/bm25<br/>(Lexical Sparse Vector)"]

    subgraph QdrantCloud ["Qdrant Cloud Cluster (darukaa_knowledge)"]
        DenseVector --> DenseIndex["Dense HNSW Index<br/>(Cosine Metric)"]
        SparseVector --> SparseIndex["Sparse Inverted Index<br/>(Term Frequency Weights)"]
        
        DenseIndex --> CandidateDense["Top-20 Dense Chunks"]
        SparseIndex --> CandidateSparse["Top-20 Sparse Chunks"]
        
        CandidateDense & CandidateSparse --> RRFEngine["Server-Side RRF Fusion<br/>Score = SUM( 1 / (60 + rank_i) )"]
    end

    RRFEngine --> ScoredResults["Top-K Deduplicated & Scored Evidence Chunks"]
    ScoredResults --> GroundingEngine["Scientific Evidence Rail & LLM Context"]
```

---

## 4. Technical Core & Invariants

### 4.1 Hybrid Retrieval Engine (Qdrant RRF)
* **Collection**: `darukaa_knowledge` hosted on Qdrant Cloud.
* **Dual Indexing**:
  * **Dense**: `sentence-transformers/all-MiniLM-L6-v2` generating 384-dimensional dense vectors evaluated via Cosine similarity.
  * **Sparse**: `Qdrant/bm25` producing token-frequency sparse representations for precise taxonomic species, soil thresholds (`pH 6.5`, `SOC 1.2%`), and legal frameworks (`IPBES SPM`).
* **Fusion Math**: Server-side Reciprocal Rank Fusion combines both ranking lists:
  $$RRF(d) = \sum_{m \in \{\text{dense}, \text{sparse}\}} \frac{1}{k + r_m(d)} \quad (k = 60)$$
* **Zero In-Memory Latency**: Unlike local `rank-bm25` implementations that require loading corpora into server RAM, Qdrant executes sparse and dense retrieval directly in Rust with sub-20ms latency.

### 4.2 Deterministic Guardrails & Zero-LLM Pre-Filters
* **Deterministic Scope Gate (`is_out_of_scope_query`)**:
  * Evaluates queries in `<1ms` via compiled regex matching across math, coding, pop culture, geography, and general trivia.
  * **Critical Defense**: Out-of-scope queries **completely bypass Qdrant retrieval**. This prevents the system from retrieving irrelevant environmental papers, burning vector operations, or hallucinating false citations.
* **Zero-LLM Fast Clarification Filter (`check_environmental_completeness`)**:
  * Detects missing operational parameters in restoration queries (soil organic carbon %, rainfall, land-use history).
  * Returns an immediate structured clarification response in **sub-5ms without consuming LLM generation tokens**.

### 4.3 3-Tier LLM Resiliency Chain
Implemented in [`llm_router.py`](backend/src/generator/llm_router.py) with automatic failover across error status codes (`429 Too Many Requests`, `503 Service Unavailable`, timeouts):

```text
Tier 1 (Primary):   gemini-3.5-flash-lite  (Low-latency ~400ms TTFT, cost-optimized)
        ↓  (On 429 Rate Limit / 503 / Timeout)
Tier 2 (Secondary): gemini-3.1-flash-lite  (High-availability backup)
        ↓  (On 429 Rate Limit / 503 / Timeout)
Tier 3 (Tertiary):  gemini-3.6-flash       (Complex reasoning fallback)
        ↓  (On Cross-Cloud Outage)
Emergency Tier:     llama-3.3-70b          (Groq cloud hardware failover)
```

### 4.4 Full-Lifecycle Observability (Langfuse)
Configured in [`tracer.py`](backend/src/intelligence/tracer.py) via a centralized non-blocking telemetry client:
* **Root Trace**: Tracks end-to-end execution (`rag-query-stream` or `out-of-scope-refusal`), capturing `user_id`, `session_id`, environment, and latency breakdown.
* **Granular Spans**:
  * `guardrails-and-completeness` (`as_type="guardrail"`)
  * `hybrid-retrieval` (`as_type="retriever"`, recording top chunk scores and hit counts)
  * `gemini-reasoning` (`as_type="generation"`, recording input prompt, streaming tokens, output length, and TTFT)
  * `citation-verification` (`as_type="evaluator"`, auditing cited vs. retrieved IDs)
* **Zero Overhead**: Telemetry batches are sent asynchronously in a background thread. If the Langfuse server is unreachable, the system transparently falls back to `NoOpObservation` without dropping or slowing the SSE stream.

### 4.5 Sub-Second Latency & TTFT Optimizations
* **FastAPI Lifespan Warmup**: During container startup, FastAPI executes dummy embedding inferences (`compute_dense_embedding("warmup")`), loading ONNX runtimes and model weights into memory. This eliminates the **320.7ms cold-load penalty** on the first user query.
* **Keep-Alive Cron**: A scheduled GitHub Actions workflow ([`keep_alive.yml`](.github/workflows/keep_alive.yml)) pings `/health` every 10 minutes between 08:00 and 23:00 IST to prevent Render free-tier container sleep.
* **Client Disconnect Cancellation**: Checks `request.is_disconnected()` on every yielded token, immediately halting upstream LLM streaming if a user navigates away.

---

## 5. Repository File Structure

```text
.
├── .github/
│   └── workflows/
│       ├── ci.yml                  # GitHub Actions CI: TypeScript checks & Pytest suite
│       └── keep_alive.yml          # Automated 10-minute Render health check cron
├── backend/
│   ├── requirements.txt            # Python dependencies (FastAPI, Qdrant, FastEmbed, Langfuse)
│   ├── scripts/
│   │   ├── seed_public_kb.py       # Seeds IPCC, IPBES, IUCN PDFs into Qdrant Cloud
│   │   └── test_qdrant_connection.py
│   ├── src/
│   │   ├── api/
│   │   │   ├── auth.py             # Supabase JWKS & Asymmetric JWT verification
│   │   │   ├── main.py             # FastAPI application entrypoint, lifespan & CORS
│   │   │   ├── rate_limit.py       # Sliding-window IP and user rate limiter
│   │   │   ├── schemas.py          # Pydantic schemas for requests, citations, SSE events
│   │   │   └── supabase_db.py      # PostgreSQL persistence with RLS scoping
│   │   ├── generator/
│   │   │   ├── llm_router.py       # 3-Tier Gemini & Groq fallback chain
│   │   │   ├── prompts.py          # Multi-metric causal reasoning & refusal prompts
│   │   │   └── stream.py           # SSE event generation & disconnect detection
│   │   ├── ingestion/
│   │   │   ├── chunker.py          # Markdown/text sentence-aware chunking
│   │   │   ├── indexer.py          # Dense + BM25 batch indexing into Qdrant
│   │   │   ├── parser.py           # PyMuPDF parser with quota enforcement
│   │   │   └── sanitizer.py        # PII & prompt injection protection
│   │   ├── intelligence/
│   │   │   ├── completeness.py     # Deterministic Scope Gate & Clarification Filter
│   │   │   ├── evidence_gate.py    # Evidence Quality rating & citation verification
│   │   │   └── tracer.py           # Langfuse telemetry suite & trace context managers
│   │   └── retriever/
│   │       ├── embeddings.py       # FastEmbed dense (all-MiniLM-L6-v2) & sparse (BM25)
│   │       ├── hybrid_search.py    # Qdrant Reciprocal Rank Fusion (RRF) search
│   │       └── qdrant_store.py     # Qdrant Cloud client & schema management
│   └── tests/
│       ├── test_citations.py       # Manifest integrity & citation verification tests
│       ├── test_completeness.py    # Zero-LLM clarification trigger tests
│       ├── test_guardrails.py      # Out-of-scope math/trivia refusal tests
│       ├── test_rate_limit.py      # Anonymous vs authenticated rate limiting tests
│       ├── test_security_isolation.py # Multi-tenant isolation & unsigned JWT tests
│       ├── test_streaming.py       # SSE events & client disconnect tests
│       ├── test_tracing.py         # Langfuse telemetry & no-op fallback tests
│       └── test_ttft_profiling.py  # Diagnostic TTFT benchmark & latency breakdown suite
├── data/
│   └── corpus/                     # Genuine scientific literature (IPCC, IPBES, IUCN)
├── frontend/
│   ├── src/
│   │   ├── App.tsx                 # App orchestration, user switching, SSE handling
│   │   ├── components/
│   │   │   ├── chat/               # ChatPanel, ChatInput, EnvironmentalContextModal
│   │   │   ├── evidence/           # EvidenceRail, EvidenceCard, Telemetry HUD
│   │   │   ├── layout/             # Shell, Sidebar (Chat History & Pinning)
│   │   │   └── uploads/            # DocumentManager (Private PDF Vault)
│   │   ├── index.css               # Luxury dark glassmorphism & typography
│   │   └── lib/                    # SSE streaming client & Supabase auth
│   └── tailwind.config.js          # Nature-tech dark palette & keyframes
├── knowledge.md                    # Detailed engineering dossier & trade-off rationale
├── render.yaml                     # Render backend deployment specification
├── supabase_schema.sql             # Supabase PostgreSQL schema, conversations, RLS
└── vercel.json                     # Vercel SPA routing configuration
```

---

## 6. Local Development & Deployment

### Prerequisites
* Python 3.11+
* Node.js 18+ and npm
* Qdrant Cloud account & cluster API key
* Google AI Studio Gemini API key
* Supabase project with PostgreSQL and Storage

### 1. Environment Configuration
```bash
cp .env.example .env
# Populate GEMINI_API_KEY, QDRANT_URL, QDRANT_API_KEY, SUPABASE_URL, SUPABASE_ANON_KEY
```

### 2. Backend Installation & Execution
```bash
# Install backend dependencies
pip install -r backend/requirements.txt

# Run complete test suite
python -m pytest backend/tests/ -v

# Seed authoritative scientific corpus into Qdrant Cloud
python -m backend.scripts.seed_public_kb

# Launch FastAPI development server
uvicorn backend.src.api.main:app --host 0.0.0.0 --port 8000 --reload
```

### 3. Frontend Installation & Build
```bash
cd frontend

# Install Node modules
npm install

# Start Vite development server
npm run dev

# Compile production bundle
npm run build
```

---

## 7. Automated Test Suite

Continuous Integration executes the full test suite on all branches:

```text
backend/tests/test_citations.py::test_evidence_manifest_and_citation_verification PASSED [  4%]
backend/tests/test_completeness.py::test_zero_llm_clarification_trigger PASSED            [  8%]
backend/tests/test_completeness.py::test_sufficient_context_bypasses_clarification PASSED [ 12%]
backend/tests/test_completeness.py::test_conceptual_definition_bypasses_clarification PASSED [ 16%]
backend/tests/test_guardrails.py::test_out_of_scope_detection_queries PASSED              [ 20%]
backend/tests/test_guardrails.py::test_legitimate_environmental_queries_not_flagged PASSED [ 24%]
backend/tests/test_rate_limit.py::test_anonymous_ip_rate_limiting PASSED                 [ 28%]
backend/tests/test_rate_limit.py::test_authenticated_user_rate_limiting PASSED            [ 32%]
backend/tests/test_security_isolation.py::test_query_and_ingestion_embedding_compatibility PASSED [ 36%]
backend/tests/test_security_isolation.py::test_multi_tenant_isolation_matrix PASSED      [ 40%]
backend/tests/test_security_isolation.py::test_production_mode_rejects_unsigned_jwt PASSED [ 44%]
backend/tests/test_streaming.py::test_sse_stream_events PASSED                           [ 48%]
backend/tests/test_streaming.py::test_client_disconnect_cancels_generation PASSED       [ 52%]
backend/tests/test_tracing.py::test_tracer_no_op_fallback PASSED                          [ 56%]
backend/tests/test_tracing.py::test_tracer_client_retrieval PASSED                       [ 60%]
backend/tests/test_ttft_profiling.py::test_embedding_load_time PASSED                    [ 64%]
backend/tests/test_ttft_profiling.py::test_parallel_vs_sequential PASSED                 [ 68%]
backend/tests/test_ttft_profiling.py::test_gemini_ttft PASSED                            [ 72%]
backend/tests/test_ttft_profiling.py::test_embedding_pipeline_e2e PASSED                 [ 76%]
backend/tests/test_ttft_profiling.py::test_auth_verification_latency PASSED             [ 80%]
backend/tests/test_ttft_profiling.py::test_embedding_load_pytest PASSED                  [ 84%]
backend/tests/test_ttft_profiling.py::test_parallel_embedding_pytest PASSED              [ 88%]
backend/tests/test_ttft_profiling.py::test_e2e_pipeline_pytest PASSED                    [ 92%]
backend/tests/test_ttft_profiling.py::test_auth_latency_pytest PASSED                    [ 96%]
backend/tests/test_ttft_profiling.py::test_gemini_ttft_pytest PASSED                     [100%]
=================================== 25 passed in 38.57s ===================================
```

---

## 8. Security & Compliance Invariants

1. **Zero Secret Leakage**: Private credentials (`.env`, `GEMINI_API_KEY`, `QDRANT_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY`) are git-ignored. The client only consumes the public `SUPABASE_ANON_KEY`.
2. **Deterministic Multi-Tenant Boundary**: The filter `(scope == "public") OR (scope == "private" AND owner_user_id == verified_user_id)` is non-negotiable and executed at the vector database level.
3. **No Unverified Claims**: The system requires valid citations `[S1]`, `[S2]` mapped to real, pre-indexed documents for factual claims.
4. **Resilient Telemetry**: Telemetry failures (Langfuse network partitions or missing keys) never interrupt or block the user response.

---

## 📄 License

MIT License. Engineered for **Darukaa.Earth**.
