import re
from typing import Optional, Dict, Any, List
from backend.src.api.schemas import EnvironmentalContext, ClarificationPayload

# Keywords that indicate intervention, land management, diagnosis, or restoration queries
INTERVENTION_PATTERNS = [
    r"\b(declin\w*|degrad\w*|improv\w*|restor\w*|rehabilitat\w*)\b",
    r"\b(yield|crop|soil health|productivity|erosion|loss)\b",
    r"\b(what should i do|how can i|interven\w*|treatment|solution)\b",
    r"\b(plant\w*|till\w*|cover crop|fertiliz\w*|irriga\w*)\b",
    r"\b(biodiversity on my land|farm|field|acre|hectare)\b"
]

# Keywords that indicate general conceptual, educational, or theoretical queries
CONCEPTUAL_PATTERNS = [
    r"^what is\b",
    r"^explain\b",
    r"^define\b",
    r"^how does .* work\b",
    r"^difference between\b"
]

def is_intervention_query(question: str) -> bool:
    q_lower = question.lower().strip()
    # Check if purely conceptual
    for cp in CONCEPTUAL_PATTERNS:
        if re.search(cp, q_lower):
            # If it doesn't mention "my land", "my farm", etc., treat as conceptual
            if not any(k in q_lower for k in ["my land", "my farm", "my field", "my soil", "our property"]):
                return False

    for ip in INTERVENTION_PATTERNS:
        if re.search(ip, q_lower):
            return True
    return False

def check_environmental_completeness(
    question: str,
    context: Optional[EnvironmentalContext] = None
) -> Optional[ClarificationPayload]:
    """
    Zero-LLM Fast Clarification Engine.
    If the user asks an action/intervention question but provides virtually zero ecological context,
    halts the pipeline early without incurring LLM latency/cost, returning 2-3 targeted questions.
    """
    if not is_intervention_query(question):
        return None

    ctx = context or EnvironmentalContext()

    has_soil = (
        ctx.soil_organic_carbon_pct is not None or
        ctx.soil_ph is not None or
        bool(re.search(r"\b(soc|ph|carbon|loam|clay|sand)\b", question.lower()))
    )
    has_climate_water = (
        ctx.annual_rainfall_mm is not None or
        ctx.climate_zone is not None or
        ctx.water_availability is not None or
        bool(re.search(r"\b(rain\w*|semi-arid|arid|drought|humid|water)\b", question.lower()))
    )
    has_land_use = (
        ctx.current_land_use is not None or
        ctx.crop_or_vegetation is not None or
        bool(re.search(r"\b(wheat|corn|rice|monoculture|pasture|forest|grazing|tillage)\b", question.lower()))
    )

    missing = []
    suggested = []

    if not has_soil:
        missing.append("soil_health")
        suggested.append("What is your current soil condition (e.g. Soil Organic Carbon %, pH, or soil type)?")

    if not has_climate_water:
        missing.append("climate_water")
        suggested.append("What are your regional rainfall patterns or climate conditions (e.g. annual rainfall in mm, semi-arid)?")

    if not has_land_use:
        missing.append("land_use")
        suggested.append("What is your current land use or cropping system (e.g. monoculture wheat, continuous grazing)?")

    # If 2 or more critical variables are completely missing, trigger zero-LLM clarification
    if len(missing) >= 2:
        return ClarificationPayload(
            is_incomplete=True,
            missing_fields=missing,
            suggested_questions=suggested[:3],
            context_extracted={
                "has_soil": has_soil,
                "has_climate_water": has_climate_water,
                "has_land_use": has_land_use
            }
        )

    return None
