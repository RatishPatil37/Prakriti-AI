import asyncio
import logging
from typing import AsyncGenerator, Optional
from backend.src.config import settings

logger = logging.getLogger("llm_router")

# Lazy Google GenAI Client
_genai_client = None

def get_genai_client():
    global _genai_client
    if _genai_client is None and settings.GEMINI_API_KEY:
        try:
            from google import genai
            _genai_client = genai.Client(api_key=settings.GEMINI_API_KEY)
        except Exception as e:
            logger.warning(f"Could not initialize Google GenAI client: {e}")
            _genai_client = None
    return _genai_client


async def _stream_model(client, model_name: str, prompt: str) -> AsyncGenerator[str, None]:
    """Helper: stream from a single model and yield text chunks."""
    response_stream = await asyncio.to_thread(
        client.models.generate_content_stream,
        model=model_name,
        contents=prompt,
    )
    for chunk in response_stream:
        if chunk.text:
            yield chunk.text
            await asyncio.sleep(0.001)  # Yield control to event loop


async def stream_gemini_tokens(prompt: str, model_name: Optional[str] = None) -> AsyncGenerator[str, None]:
    """
    Streams tokens asynchronously from Gemini using the official google-genai SDK.

    3-Tier Fallback Chain:
      1. gemini-3.5-flash-lite  (primary — fastest, lowest TTFT)
      2. gemini-3.1-flash-lite  (secondary — balance of speed and capability)
      3. gemini-3.6-flash       (tertiary — highest capability, final safety net)

    Falls back to deterministic offline simulation ONLY when all live models fail
    or API key is not configured.
    """
    client = get_genai_client()
    explicit_model = model_name  # Caller can override the whole chain with a specific model

    if client:
        # Build the ordered model chain
        if explicit_model:
            model_chain = [explicit_model]
        else:
            model_chain = [
                settings.LLM_PRIMARY_MODEL,    # gemini-2.5-flash-lite
                settings.LLM_SECONDARY_MODEL,  # gemini-2.0-flash-lite
                settings.LLM_TERTIARY_MODEL,   # gemini-2.5-flash
            ]

        last_error = None
        for tier_idx, tier_model in enumerate(model_chain):
            try:
                logger.info(f"LLM tier {tier_idx + 1}: using {tier_model}")
                yielded_any = False
                async for token in _stream_model(client, tier_model, prompt):
                    yield token
                    yielded_any = True
                if yielded_any:
                    return  # Successful stream — done
                # Empty response — treat as a soft failure and try next tier
                logger.warning(f"Model {tier_model} returned empty response; trying next tier")
            except Exception as e:
                last_error = e
                logger.warning(f"Model {tier_model} failed (tier {tier_idx + 1}): {e}")
                if tier_idx < len(model_chain) - 1:
                    logger.info(f"Falling over to tier {tier_idx + 2}: {model_chain[tier_idx + 1]}")

        # All live models exhausted
        logger.error(f"All {len(model_chain)} LLM tiers failed. Last error: {last_error}")

    # ── Offline / Test Simulation Mode ──────────────────────────────────────────
    logger.info("Running in offline test simulation mode")
    simulated_tokens = [
        "### Ecological Analysis & Recommendation\n\n",
        "Based on the available agroecological literature, ",
        "declining biodiversity and soil degradation in agricultural systems ",
        "are strongly driven by intensive mechanical tillage and reduced organic matter inputs.\n\n",
        "#### Multi-Metric Causal Chain\n",
        "1. **Tillage Reduction & Cover Cropping** → Protects fungal hyphae networks and minimizes soil aggregate disruption.\n",
        "2. **Soil Organic Matter Accumulation** → Enhances soil moisture retention and microbial biomass.\n",
        "3. **Microhabitat Heterogeneity** → Sustains diverse belowground microbial communities and beneficial insect corridors.\n\n",
        "#### Recommended Actionable Interventions\n",
        "- **Integrate multi-species cover crops** during fallow windows to enhance biomass inputs and nutrient cycling.\n",
        "- **Transition toward conservation tillage or strip-till** to minimize soil disturbance and organic carbon oxidation.\n\n",
        "#### Evidence & Uncertainty Notice\n",
        "- *Quantitative Benchmarks*: Insufficient site-specific empirical evidence to support exact numerical effect sizes or percentage improvements without dedicated field baseline testing.\n",
        "- *Direction of Intervention*: Directionally supported by global land management benchmarks; localized trials are recommended before scaling."
    ]
    for token in simulated_tokens:
        yield token
        await asyncio.sleep(0.03)
