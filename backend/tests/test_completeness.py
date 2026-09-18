import pytest
from backend.src.api.schemas import EnvironmentalContext
from backend.src.intelligence.completeness import check_environmental_completeness

def test_zero_llm_clarification_trigger():
    # Incomplete intervention query (from assignment brief: "Biodiversity is declining on my land")
    # Missing SOC, rainfall, land use
    incomplete_query = "Biodiversity is declining on my land, what should I do?"
    clarification = check_environmental_completeness(incomplete_query, None)

    assert clarification is not None, "Zero-LLM clarification was not triggered for incomplete intervention query!"
    assert clarification.is_incomplete is True
    assert len(clarification.suggested_questions) >= 2
    assert "soil_health" in clarification.missing_fields
    assert "climate_water" in clarification.missing_fields

def test_sufficient_context_bypasses_clarification():
    # Sufficient context provided
    ctx = EnvironmentalContext(
        soil_organic_carbon_pct=0.3,
        annual_rainfall_mm=350.0,
        current_land_use="Monoculture wheat",
        climate_zone="semi-arid"
    )
    query = "What should I change on my land to restore biodiversity?"
    clarification = check_environmental_completeness(query, ctx)

    assert clarification is None, "Clarification was triggered despite sufficient context!"

def test_conceptual_definition_bypasses_clarification():
    # Conceptual definition query (e.g. "What is soil organic carbon?")
    query = "What is soil organic carbon?"
    clarification = check_environmental_completeness(query, None)

    assert clarification is None, "Clarification was incorrectly triggered for conceptual educational query!"
