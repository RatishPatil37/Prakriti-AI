import pytest
from backend.src.intelligence.completeness import is_out_of_scope_query

def test_out_of_scope_detection_queries():
    # Math & Arithmetic
    assert is_out_of_scope_query("whats 2 multiplied by 4") is True
    assert is_out_of_scope_query("whats 2 multiplied b 4") is True
    assert is_out_of_scope_query("calculate 25 * 4") is True
    assert is_out_of_scope_query("50 + 12") is True
    assert is_out_of_scope_query("solve the equation 3x + 5 = 20") is True

    # Trivia, Geography & Politics
    assert is_out_of_scope_query("whats the capital of india") is True
    assert is_out_of_scope_query("capital of france") is True
    assert is_out_of_scope_query("who is the president of the united states") is True
    assert is_out_of_scope_query("who won the world cup") is True
    assert is_out_of_scope_query("population of tokyo") is True

    # Software & Programming
    assert is_out_of_scope_query("write python code for binary search") is True
    assert is_out_of_scope_query("how to install docker on ubuntu") is True
    assert is_out_of_scope_query("implement quicksort in javascript") is True

    # Pop culture & Small talk
    assert is_out_of_scope_query("who is taylor swift") is True
    assert is_out_of_scope_query("tell me a joke") is True
    assert is_out_of_scope_query("what is your favorite color") is True

def test_legitimate_environmental_queries_not_flagged():
    # Legitimate environmental science queries must NOT be marked out-of-scope
    assert is_out_of_scope_query("How can I increase soil organic carbon in semi-arid soils?") is False
    assert is_out_of_scope_query("What is the effect of cover crops on mycorrhizal fungi?") is False
    assert is_out_of_scope_query("Explain the relationship between deforestation and regional rainfall") is False
    assert is_out_of_scope_query("What are the primary drivers of biodiversity loss in wetland ecosystems?") is False
    assert is_out_of_scope_query("Recommended agroforestry species for nitrogen fixation in drylands") is False
    assert is_out_of_scope_query("How does biochar application influence soil microbial biomass?") is False
