import pytest
from backend.src.intelligence.completeness import (
    is_out_of_scope_query,
    classify_conversational_intent,
)


# ─── Out-of-scope detection ────────────────────────────────────────────────────

def test_out_of_scope_math_and_arithmetic():
    assert is_out_of_scope_query("whats 2 multiplied by 4") is True
    assert is_out_of_scope_query("What's 2 multiplied by 4") is True
    assert is_out_of_scope_query("calculate 25 * 4") is True
    assert is_out_of_scope_query("50 + 12") is True
    assert is_out_of_scope_query("solve the equation 3x + 5 = 20") is True


def test_out_of_scope_trivia_and_politics():
    assert is_out_of_scope_query("whats the capital of india") is True
    assert is_out_of_scope_query("capital of france") is True
    assert is_out_of_scope_query("who is the president of the united states") is True
    assert is_out_of_scope_query("who won the world cup") is True
    assert is_out_of_scope_query("population of tokyo") is True


def test_out_of_scope_software():
    assert is_out_of_scope_query("write python code for binary search") is True
    assert is_out_of_scope_query("how to install docker on ubuntu") is True
    assert is_out_of_scope_query("implement quicksort in javascript") is True


def test_out_of_scope_pop_culture():
    assert is_out_of_scope_query("who is taylor swift") is True
    assert is_out_of_scope_query("tell me a joke") is True
    assert is_out_of_scope_query("what is your favorite color") is True


def test_out_of_scope_weather_forecast():
    assert is_out_of_scope_query("what's the weather today") is True
    assert is_out_of_scope_query("weather tomorrow in Mumbai") is True
    assert is_out_of_scope_query("weather forecast for this week") is True


def test_out_of_scope_wordplay_and_recipes():
    assert is_out_of_scope_query("how many r's in rainbow") is True
    assert is_out_of_scope_query("how many r in rainbow") is True
    assert is_out_of_scope_query("how many 's' in mississippi") is True
    assert is_out_of_scope_query("recipe for pizza") is True
    assert is_out_of_scope_query("how to bake cookies") is True
    assert is_out_of_scope_query("tell me a story about a dragon") is True


def test_out_of_scope_greetings_and_smalltalk():
    assert is_out_of_scope_query("hi") is True
    assert is_out_of_scope_query("hello") is True
    assert is_out_of_scope_query("hey there") is True
    assert is_out_of_scope_query("good morning") is True
    assert is_out_of_scope_query("how are you") is True
    assert is_out_of_scope_query("thank you") is True
    assert is_out_of_scope_query("thanks") is True
    assert is_out_of_scope_query("ok") is True
    assert is_out_of_scope_query("got it") is True
    assert is_out_of_scope_query("bye") is True
    assert is_out_of_scope_query("goodbye") is True
    assert is_out_of_scope_query("help") is True
    assert is_out_of_scope_query("who are you?") is True
    assert is_out_of_scope_query("what can you do?") is True


# ─── Legitimate environmental queries — must NOT be flagged ───────────────────

def test_legitimate_environmental_queries_not_flagged():
    assert is_out_of_scope_query("How can I increase soil organic carbon in semi-arid soils?") is False
    assert is_out_of_scope_query("Hello! How can I increase soil organic carbon in semi-arid soils?") is False
    assert is_out_of_scope_query("Hi there, what is the effect of cover crops on mycorrhizal fungi?") is False
    assert is_out_of_scope_query("Explain the relationship between deforestation and regional rainfall") is False
    assert is_out_of_scope_query("What are the primary drivers of biodiversity loss in wetland ecosystems?") is False
    assert is_out_of_scope_query("Recommended agroforestry species for nitrogen fixation in drylands") is False
    assert is_out_of_scope_query("How does biochar application influence soil microbial biomass?") is False


def test_single_word_environmental_queries_not_flagged():
    # Single-word environmental terms should not be flagged
    assert is_out_of_scope_query("soil") is False
    assert is_out_of_scope_query("biodiversity") is False
    assert is_out_of_scope_query("trees dying") is False
    assert is_out_of_scope_query("erosion") is False
    assert is_out_of_scope_query("wetland") is False


def test_mixed_greeting_plus_env_not_flagged():
    # Greetings combined with environmental content must NOT be out-of-scope
    assert is_out_of_scope_query("hi, my soil carbon is declining") is False
    assert is_out_of_scope_query("hello can you explain biodiversity loss?") is False
    assert is_out_of_scope_query("good morning, what's the best cover crop for dryland wheat?") is False


# ─── Conversational intent classifier ─────────────────────────────────────────

def test_conversational_intent_greetings():
    assert classify_conversational_intent("hi") == "greeting"
    assert classify_conversational_intent("hello") == "greeting"
    assert classify_conversational_intent("hey") == "greeting"
    assert classify_conversational_intent("hey there") == "greeting"
    assert classify_conversational_intent("good morning") == "greeting"
    assert classify_conversational_intent("Good Morning!") == "greeting"
    assert classify_conversational_intent("howdy") == "greeting"


def test_conversational_intent_thanks():
    assert classify_conversational_intent("thanks") == "thanks"
    assert classify_conversational_intent("thank you") == "thanks"
    assert classify_conversational_intent("Thank you!") == "thanks"
    assert classify_conversational_intent("thx") == "thanks"


def test_conversational_intent_acknowledgement():
    assert classify_conversational_intent("ok") == "acknowledgement"
    assert classify_conversational_intent("okay") == "acknowledgement"
    assert classify_conversational_intent("got it") == "acknowledgement"
    assert classify_conversational_intent("understood") == "acknowledgement"
    assert classify_conversational_intent("noted") == "acknowledgement"


def test_conversational_intent_farewell():
    assert classify_conversational_intent("bye") == "farewell"
    assert classify_conversational_intent("goodbye") == "farewell"
    assert classify_conversational_intent("see you") == "farewell"
    assert classify_conversational_intent("cya") == "farewell"


def test_conversational_intent_identity():
    assert classify_conversational_intent("who are you") == "identity"
    assert classify_conversational_intent("who are you?") == "identity"
    assert classify_conversational_intent("what can you do") == "identity"
    assert classify_conversational_intent("who made you") == "identity"
    assert classify_conversational_intent("what is your name") == "identity"


def test_conversational_intent_help():
    assert classify_conversational_intent("help") == "help"
    assert classify_conversational_intent("Help!") == "help"


def test_conversational_intent_mixed():
    # Greeting + environmental topic → mixed (scientific pipeline should handle)
    assert classify_conversational_intent("hi, my soil carbon is declining") == "mixed"
    assert classify_conversational_intent("hello, can you explain biodiversity loss?") == "mixed"
    assert classify_conversational_intent("good morning, what cover crop works for dryland wheat?") == "mixed"


def test_conversational_intent_none_for_scientific():
    # Pure scientific questions return None (no conversational intent)
    assert classify_conversational_intent("How can I restore soil carbon?") is None
    assert classify_conversational_intent("What drives biodiversity loss in wetlands?") is None
    assert classify_conversational_intent("Explain agroforestry benefits for degraded land") is None

