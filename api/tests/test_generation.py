"""TDD tests for procedural creature generation (mock AI provider)."""

from app.ai.openrouter import OpenRouterClient, create_pet

DEMO_DESC = (
    "A tiny blue dragon that thinks it is a cat, loves pancakes, "
    "gets scared of thunderstorms and is extremely curious."
)


def test_blue_dragon_keyword_extraction():
    client = OpenRouterClient(provider="mock")
    gen = client.generate_creature(DEMO_DESC)
    assert gen["appearance"]["body_shape"] == "dragon"
    assert gen["appearance"]["base_color"] == "#5B8DEF"


def test_traits_extracted_from_description():
    client = OpenRouterClient(provider="mock")
    gen = client.generate_creature(DEMO_DESC)
    traits = gen["personality"]["traits"]
    assert "curious" in traits
    assert "pancakes" in gen["preferences"]["favorite_foods"]
    assert "thunderstorms" in gen["preferences"]["fears"]


def test_robot_uses_energy_cell_instead_of_hunger():
    pet = create_pet("A small robot dog that loves pizza", name="Bolt")
    assert "hunger" not in pet.need_model
    assert "energy_cell" in pet.need_model
    assert "energy_cell" in pet.needs


def test_default_creature_when_no_keywords_match():
    client = OpenRouterClient(provider="mock")
    gen = client.generate_creature("A mysterious creature")
    assert gen["appearance"]["body_shape"] == "blob"
    assert len(gen["personality"]["traits"]) > 0
    assert gen["origin"]["backstory"]
