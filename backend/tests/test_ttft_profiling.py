"""
TTFT & Latency Profiling Suite for Prakriti AI Backend
=======================================================
Measures stage-by-stage latencies to identify bottlenecks in the query pipeline.

Run:
    cd "c:/Users/patil/OneDrive/Prakriti AI"
    python -m pytest backend/tests/test_ttft_profiling.py -s -v

Or standalone:
    python backend/tests/test_ttft_profiling.py
"""

import asyncio
import time
import statistics
import os
import sys

# Ensure the project root is in the path
ROOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
sys.path.insert(0, ROOT_DIR)

from dotenv import load_dotenv
load_dotenv(os.path.join(ROOT_DIR, ".env"), override=False)


# ── Helper ──────────────────────────────────────────────────────────────────

def section(title: str):
    print(f"\n{'='*60}")
    print(f"  {title}")
    print(f"{'='*60}")


def result(label: str, ms: float, note: str = ""):
    status = "✓" if ms < 2000 else ("⚠" if ms < 5000 else "✗")
    note_str = f"  [{note}]" if note else ""
    print(f"  {status}  {label:<45} {ms:>8.1f} ms{note_str}")


# ── Stage 1: Embedding Model Cold vs Warm Load ───────────────────────────────

def test_embedding_load_time():
    section("Stage 1: Embedding Model Initialization")
    try:
        from backend.src.retriever.embeddings import (
            compute_dense_embedding,
            compute_sparse_embedding,
        )

        # Cold load — first call triggers model initialization
        t0 = time.perf_counter()
        _ = compute_dense_embedding("test warm-up query")
        cold_ms = (time.perf_counter() - t0) * 1000
        result("Dense model cold load (ONNX)", cold_ms, "includes model file load")

        # Warm load — model already in memory
        t0 = time.perf_counter()
        _ = compute_dense_embedding("test warm-up query")
        warm_ms = (time.perf_counter() - t0) * 1000
        result("Dense model warm inference", warm_ms, "cached in memory")

        # Sparse model cold
        t0 = time.perf_counter()
        _ = compute_sparse_embedding("test warm-up query")
        sparse_cold_ms = (time.perf_counter() - t0) * 1000
        result("Sparse BM25 model cold load", sparse_cold_ms)

        t0 = time.perf_counter()
        _ = compute_sparse_embedding("test warm-up query")
        sparse_warm_ms = (time.perf_counter() - t0) * 1000
        result("Sparse BM25 model warm inference", sparse_warm_ms)

        print(f"\n  Cold-start overhead (dense):  {cold_ms - warm_ms:.1f} ms")

    except Exception as e:
        print(f"  ✗ Could not test embedding load: {e}")


# ── Stage 2: Sequential vs Parallel Embeddings ───────────────────────────────

async def _parallel_embeddings(query: str):
    from backend.src.retriever.embeddings import (
        compute_dense_embedding,
        compute_sparse_embedding,
    )
    dense, sparse = await asyncio.gather(
        asyncio.to_thread(compute_dense_embedding, query),
        asyncio.to_thread(compute_sparse_embedding, query),
    )
    return dense, sparse


def _sequential_embeddings(query: str):
    from backend.src.retriever.embeddings import (
        compute_dense_embedding,
        compute_sparse_embedding,
    )
    dense = compute_dense_embedding(query)
    sparse = compute_sparse_embedding(query)
    return dense, sparse


def test_parallel_vs_sequential():
    section("Stage 2: Sequential vs Parallel Embedding Computation")

    query = "What is the effect of soil organic carbon on biodiversity in semi-arid regions?"

    # Pre-warm models
    try:
        _sequential_embeddings("warm-up")
    except Exception:
        pass

    # Sequential
    t0 = time.perf_counter()
    try:
        _sequential_embeddings(query)
        seq_ms = (time.perf_counter() - t0) * 1000
        result("Sequential (dense → sparse)", seq_ms)
    except Exception as e:
        print(f"  ✗ Sequential failed: {e}")
        seq_ms = None

    # Parallel
    t0 = time.perf_counter()
    try:
        asyncio.run(_parallel_embeddings(query))
        par_ms = (time.perf_counter() - t0) * 1000
        result("Parallel asyncio.gather", par_ms)
    except Exception as e:
        print(f"  ✗ Parallel failed: {e}")
        par_ms = None

    if seq_ms and par_ms:
        gain = seq_ms - par_ms
        pct = (gain / seq_ms) * 100
        print(f"\n  Latency reduction:  {gain:.1f} ms ({pct:.0f}% faster)")


# ── Stage 3: Gemini TTFT Benchmark ───────────────────────────────────────────

async def _measure_ttft(model_name: str, prompt: str) -> float:
    """Time to first token from Gemini."""
    from backend.src.generator.llm_router import get_genai_client
    client = get_genai_client()
    if not client:
        return -1.0

    t0 = time.perf_counter()
    first_token_time = None
    try:
        stream = await asyncio.to_thread(
            client.models.generate_content_stream,
            model=model_name,
            contents=prompt,
        )
        for chunk in stream:
            if chunk.text and first_token_time is None:
                first_token_time = time.perf_counter()
                break
    except Exception as e:
        print(f"  ✗ {model_name}: {e}")
        return -1.0

    if first_token_time is None:
        return -1.0
    return (first_token_time - t0) * 1000


def test_gemini_ttft():
    section("Stage 3: Gemini TTFT (Time-To-First-Token) Benchmark")

    from backend.src.config import settings

    models = [
        (settings.LLM_PRIMARY_MODEL, "Primary"),
        (settings.LLM_SECONDARY_MODEL, "Secondary"),
        (settings.LLM_TERTIARY_MODEL, "Tertiary"),
    ]

    prompt = (
        "In one sentence, what is the primary driver of soil carbon loss in "
        "semi-arid agricultural systems?"
    )

    if not settings.GEMINI_API_KEY:
        print("  ⚠ GEMINI_API_KEY not set — skipping live TTFT test")
        return

    for model_name, label in models:
        ttft_ms = asyncio.run(_measure_ttft(model_name, prompt))
        if ttft_ms >= 0:
            result(f"{label}: {model_name}", ttft_ms, "TTFT")
        else:
            print(f"  ✗  {label}: {model_name:<40} FAILED / unavailable")


# ── Stage 4: End-to-End Pipeline Timing (no network) ─────────────────────────

def test_embedding_pipeline_e2e():
    section("Stage 4: End-to-End Embedding Pipeline (local only)")

    queries = [
        "soil organic carbon restoration cover crops",
        "deforestation drivers amazon basin rainfall",
        "wetland biodiversity species richness restoration",
    ]

    try:
        from backend.src.retriever.embeddings import (
            compute_dense_embedding,
            compute_sparse_embedding,
        )

        # Warm models first
        compute_dense_embedding("warm-up")
        compute_sparse_embedding("warm-up")

        times = []
        for q in queries:
            t0 = time.perf_counter()
            asyncio.run(_parallel_embeddings(q))
            elapsed = (time.perf_counter() - t0) * 1000
            times.append(elapsed)
            result(f"'{q[:40]}...'", elapsed)

        print(f"\n  Mean:   {statistics.mean(times):.1f} ms")
        print(f"  Median: {statistics.median(times):.1f} ms")
        print(f"  Max:    {max(times):.1f} ms")
        print(f"  Min:    {min(times):.1f} ms")

    except Exception as e:
        print(f"  ✗ Pipeline test failed: {e}")


# ── Stage 5: Auth Token Verification Latency ─────────────────────────────────

def test_auth_verification_latency():
    section("Stage 5: JWT Verification Latency")

    from backend.src.config import settings

    # Create a dummy expired token for structure testing
    import jwt as pyjwt

    if settings.SUPABASE_JWT_SECRET:
        # Test HS256 local decode speed
        dummy_payload = {
            "sub": "test-user-id",
            "email": "test@example.com",
            "role": "authenticated",
            "exp": int(time.time()) + 3600,
        }
        token = pyjwt.encode(dummy_payload, settings.SUPABASE_JWT_SECRET, algorithm="HS256")

        times = []
        for _ in range(20):
            t0 = time.perf_counter()
            try:
                pyjwt.decode(
                    token,
                    settings.SUPABASE_JWT_SECRET,
                    algorithms=["HS256"],
                    options={"verify_exp": True},
                )
            except Exception:
                pass
            times.append((time.perf_counter() - t0) * 1000)

        result("HS256 local decode (20 iterations avg)", statistics.mean(times))
        print(f"  → P99: {max(times):.3f} ms  (sub-millisecond target)")
    else:
        print("  ⚠ SUPABASE_JWT_SECRET not set — skipping local HS256 bench")
        print("  ℹ JWKS verification will add ~20-100ms network round-trip on first call")


# ── Main ──────────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    print("\n" + "="*60)
    print("  Prakriti AI — TTFT & Latency Profiling Suite")
    print("="*60)

    test_embedding_load_time()
    test_parallel_vs_sequential()
    test_embedding_pipeline_e2e()
    test_auth_verification_latency()
    test_gemini_ttft()

    print("\n" + "="*60)
    print("  Profiling complete.")
    print("="*60 + "\n")


# ── pytest-compatible test functions ──────────────────────────────────────────

def test_embedding_load_pytest():
    test_embedding_load_time()

def test_parallel_embedding_pytest():
    test_parallel_vs_sequential()

def test_e2e_pipeline_pytest():
    test_embedding_pipeline_e2e()

def test_auth_latency_pytest():
    test_auth_verification_latency()

def test_gemini_ttft_pytest():
    test_gemini_ttft()
