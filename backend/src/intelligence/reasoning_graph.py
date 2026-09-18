from typing import List, Dict, Any
from backend.src.intelligence.completeness import is_intervention_query

# Environmental Causal Relationships (Reasoning Scaffold)
CAUSAL_SCAFFOLD = {
    "soil_carbon": {
        "affects": ["moisture_retention", "microbial_biomass", "soil_structure"],
        "mechanism": "Higher SOC improves soil aggregation and water retention, sustaining microbial communities and root resilience."
    },
    "moisture_retention": {
        "affects": ["microbial_activity", "plant_survival", "nutrient_cycling"],
        "mechanism": "Consistent pore moisture enables enzymatic activity and prevents plant wilting during dry spells."
    },
    "crop_diversification": {
        "affects": ["habitat_heterogeneity", "pollinator_richness", "pest_suppression"],
        "mechanism": "Intercropping and cover crops provide multi-season floral resources and shelter for beneficial insects."
    },
    "tillage_reduction": {
        "affects": ["soil_carbon", "fungal_networks", "erosion_control"],
        "mechanism": "Minimizing disturbance preserves mycorrhizal fungal hyphae and prevents topsoil detachment."
    }
}

def get_reasoning_scaffold_instructions(question: str) -> str:
    """
    Returns tailored system prompt instructions based on query intent.
    For intervention/recommendation: explicitly mandates connecting at least 3 relevant variables.
    For conceptual/definitions: provides direct, unforced scientific explanation.
    """
    if is_intervention_query(question):
        return (
            "MULTI-METRIC INTERVENTION REQUIREMENT:\n"
            "- This is an intervention, restoration, or ecological diagnosis query.\n"
            "- You MUST explicitly connect at least three relevant environmental variables in your causal mechanism.\n"
            "  (e.g., Variable A [e.g. Cover crops/Tillage] -> Variable B [e.g. Soil Organic Carbon/Moisture] -> Variable C [e.g. Microbial Activity/Pollinator Diversity]).\n"
            "- Clearly explain the directional mechanism: Why does altering Variable A affect B, and how does B drive C?\n"
            "- Ground all quantitative claims (e.g., % improvements, timescales) strictly in the retrieved evidence."
        )
    else:
        return (
            "CONCEPTUAL EXPLANATION MODE:\n"
            "- This is a conceptual or educational query.\n"
            "- Answer directly, rigorously, and concisely using the retrieved scientific evidence.\n"
            "- Do not artificially force a 3-variable intervention chain if only direct definitions or relationships are required."
        )
