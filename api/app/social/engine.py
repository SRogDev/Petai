"""Pet-to-pet social engine: pets meet, play, and form relationships.

Mock templates, pet-voiced dialogue. The relationship belongs to the pets,
not just their owners.
"""

from __future__ import annotations

import hashlib

from app.models.pet import Pet


def _pick(seed_key: str, options: list[str]) -> str:
    n = int(hashlib.sha256(seed_key.encode()).hexdigest(), 16)
    return options[n % len(options)]


def _dialogue(pet_a: Pet, pet_b: Pet, became_friends: bool) -> list[str]:
    a, b = pet_a.name, pet_b.name
    seed = f"{pet_a.id}:{pet_b.id}"
    if became_friends:
        lines = [
            f"{a}: Hi hi hi! I'm {a}! Do you want to play?",
            f"{b}: I'm {b}! I was just about to explore. Come with me!",
            f"{a}: Look what I found yesterday — a shiny pebble! You can hold it.",
            f"{b}: Whoa... best friends share shiny things. We're best friends now.",
            f"{a}: Best friends! Let's meet here again tomorrow!",
        ]
    else:
        lines = [
            f"{a}: ...Who are you? You look weird.",
            f"{b}: I'm {b}. You're the weird one.",
            f"{a}: *sniff sniff* Okay, you smell fine. Truce?",
            f"{b}: Truce. But I'm still watching you.",
        ]
    # Deterministic playful opener swap for variety.
    opener = _pick(seed, ["excited", "shy", "dramatic"])
    if opener == "shy":
        lines[0] = f"{a}: ...hi. I'm {a}. *hides behind owner*"
    elif opener == "dramatic":
        lines[0] = f"{a}: BEHOLD! I am {a}! Tremble before my cuteness!"
    return lines


def meet(pet_a: Pet, pet_b: Pet) -> dict:
    """Two pets meet. Returns the interaction summary and dialogue."""
    traits_a = set(pet_a.personality.traits)
    traits_b = set(pet_b.personality.traits)
    shared = sorted(traits_a & traits_b)
    union = traits_a | traits_b
    compatibility = round(len(shared) / max(len(union), 1), 2)
    became_friends = compatibility >= 0.4 or len(shared) >= 2
    relationship_delta = (
        round(0.2 + compatibility * 0.8, 2)
        if became_friends
        else round(compatibility * 0.3, 2)
    )

    if became_friends:
        summary = (
            f"{pet_a.name} really likes {pet_b.name}! "
            f"They bonded over being {', '.join(shared) or 'adorable'} together."
        )
    else:
        summary = (
            f"{pet_a.name} and {pet_b.name} had a playful encounter. "
            "They are still deciding what they think of each other."
        )

    return {
        "pet_a_id": pet_a.id,
        "pet_b_id": pet_b.id,
        "summary": summary,
        "dialogue": _dialogue(pet_a, pet_b, became_friends),
        "shared_traits": shared,
        "compatibility": compatibility,
        "relationship_delta": relationship_delta,
        "became_friends": became_friends,
    }
