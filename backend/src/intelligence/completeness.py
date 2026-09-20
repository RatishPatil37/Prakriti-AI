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

# Patterns representing non-environmental queries (math, trivia, capitals, coding, pop culture, etc.)
OUT_OF_SCOPE_PATTERNS = [
    # Math & arithmetic calculations
    r"\b(multiplied\s+by|divided\s+by|\bplus\b|\bminus\b|\btimes\b|\bsquare\s+root|\bsin\(|\bcos\(|\btan\()",
    r"^\s*(\d+\s*[\+\-\*\/\^xX%]\s*\d+)",
    r"^\s*whats?\s+(\d+|one|two|three|four|five|six|seven|eight|nine|ten)\s+(multiplied|divided|plus|minus|times)",
    r"\b(calculate|compute|solve)\s+(the\s+)?(equation|derivative|integral|\d+)",
    # Political, geography & general trivia (capitals, leaders, populations)
    r"\bcapital\s+of\s+[A-Za-z]+",
    r"\b(president|prime\s+minister|king|queen|governor|ceo|founder)\s+of\b",
    r"\bwho\s+is\s+(the\s+)?(president|prime\s+minister|ceo|founder|actor|actress|singer|celebrity)\b",
    r"\bwho\s+won\s+(the\s+)?(world\s+cup|super\s+bowl|oscar|grammy|election|match|championship)\b",
    r"\bpopulation\s+of\s+[A-Za-z]+",
    # Software & programming
    r"\b(write|create|code|generate)\s+(a\s+)?(python|javascript|typescript|c\+\+|java|rust|html|css|sql|bash|react|docker)\s+(code|script|function|program|app|algorithm)\b",
    r"\bhow\s+to\s+(install|debug|fix|compile|deploy)\s+(docker|kubernetes|node|npm|pip|git|linux|windows|react)\b",
    r"\b(binary\s+search|linked\s+list|regex|bubble\s+sort|quicksort|merge\s+sort)\b",
    # Entertainment, media, sports
    r"\b(movie|film|song|album|lyrics|netflix|hollywood|bollywood|taylor\s+swift|messi|ronaldo)\b",
    # Clinical human medicine (not environmental toxicology)
    r"\b(symptoms\s+of\s+(covid|flu|cancer|diabetes|headache|fever)|cure\s+for\s+(covid|headache|fever)|dosage\s+of\s+\w+)\b",
    # Financial markets / crypto
    r"\b(buy|sell)\s+(bitcoin|crypto|stocks|shares|ethereum)\b",
    r"\bstock\s+price\s+of\b",
    # Small talk / greetings / persona questions
    r"^\s*(hello|hi|hey|greetings|howdy|good\s+(morning|afternoon|evening|day)|sup|yo)\b",
    r"^\s*(how\s+are\s+you|who\s+are\s+you|what\s+is\s+your\s+name|what\s+can\s+you\s+do|whats\s+up|what's\s+up)\b",
    r"^\s*(tell\s+me\s+a\s+joke|who\s+made\s+you|who\s+created\s+you|are\s+you\s+sentient|what\s+is\s+your\s+favorite\s+color)\s*\??$"
]

ENVIRONMENTAL_KEYWORDS = [
    "soil", "carbon", "soc", "biodiversity", "ph", "rainfall", "tillage", "crop",
    "species", "forest", "ecosystem", "water", "agroforestry", "climate", "nitrogen",
    "fallowing", "cover crop", "pollinator", "land", "pasture", "degradation", "restoration",
    "moisture", "habitat", "pollution", "deforestation", "mycorrhiz", "canopy", "tilling"
]

def is_out_of_scope_query(question: str) -> bool:
    """
    Returns True if the query is unambiguously outside the environmental & ecological science domain.
    """
    q_lower = question.lower().strip()
    has_environmental_topic = any(re.search(rf"\b{kw}", q_lower) for kw in ENVIRONMENTAL_KEYWORDS)

    for pattern in OUT_OF_SCOPE_PATTERNS:
        if re.search(pattern, q_lower):
            # If greeting/smalltalk pattern but user explicitly asked an environmental question, keep in scope
            if has_environmental_topic and re.search(r"^\s*(hello|hi|hey|greetings|howdy|good\s+(morning|afternoon|evening|day))\b", q_lower):
                continue
            return True
    return False

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
