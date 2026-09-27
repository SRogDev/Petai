"""TDD tests for the deterministic needs simulation engine."""

from app.ai.openrouter import create_pet
from app.simulation.engine import interact, tick

DEMO_DESC = (
    "A tiny blue dragon that thinks it is a cat, loves pancakes, "
    "gets scared of thunderstorms and is extremely curious."
)


def make_pet():
    return create_pet(DEMO_DESC, name="Mochi")


def test_tick_determinism_same_pet_same_minutes():
    pet = make_pet()
    ticked_a, _ = tick(pet, 60)
    ticked_b, _ = tick(pet, 60)
    assert ticked_a.needs == ticked_b.needs


def test_tick_does_not_mutate_input():
    pet = make_pet()
    before = dict(pet.needs)
    tick(pet, 60)
    assert pet.needs == before


def test_tick_decay_rates_per_hour():
    pet = make_pet()
    for key in pet.needs:
        pet.needs[key] = 80.0
    ticked, _ = tick(pet, 60)
    assert ticked.needs["hunger"] == 72.0  # -8/hr
    assert ticked.needs["energy"] == 75.0  # -5/hr
    assert ticked.needs["happiness"] == 77.0  # -3/hr
    assert ticked.needs["social"] == 74.0  # -6/hr
    assert ticked.xp == pet.xp + 2  # xp += minutes // 30


def test_clamping_never_below_zero_or_above_100():
    pet = make_pet()
    ticked, _ = tick(pet, 100_000)
    for value in ticked.needs.values():
        assert 0.0 <= value <= 100.0


def test_interact_feed_delta():
    pet = make_pet()
    pet.needs["hunger"] = 50.0
    updated, reaction = interact(pet, "feed")
    assert updated.needs["hunger"] == 75.0
    assert reaction.text
    assert reaction.haptic == "happy"


def test_interact_clamps_at_100():
    pet = make_pet()
    pet.needs["hunger"] = 95.0
    updated, _ = interact(pet, "feed")
    assert updated.needs["hunger"] == 100.0
