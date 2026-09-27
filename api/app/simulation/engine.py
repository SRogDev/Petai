"""Deterministic needs simulation engine.

The LLM (Pet Mind) never touches numbers. This module owns every numeric
transition: need decay over time, interaction deltas, clamping, XP and mood.
All functions are pure: they return a new Pet and never mutate the input.
"""

from __future__ import annotations

import hashlib
import random
import uuid
from datetime import UTC, datetime

from app.mind.graph import narrate as mind_narrate
from app.models.pet import Pet, PetEvent, Reaction

STANDARD_NEEDS = [
    "hunger",
    "energy",
    "happiness",
    "social",
    "stimulation",
    "affection",
    "cleanliness",
    "curiosity",
]

# Need points lost per hour of simulated time.
DECAY_PER_HOUR: dict[str, float] = {
    "hunger": 8.0,
    "energy_cell": 8.0,
    "energy": 5.0,
    "happiness": 3.0,
    "social": 6.0,
    "stimulation": 4.0,
    "affection": 5.0,
    "cleanliness": 2.0,
    "curiosity": 3.0,
}

INTERACT_DELTAS: dict[str, dict[str, float]] = {
    "feed": {"hunger": 25, "happiness": 5},
    "play": {"stimulation": 20, "happiness": 10, "energy": -10},
    "pet": {"affection": 15, "happiness": 5},
    "cuddle": {"affection": 25, "energy": -5},
    "comfort": {"happiness": 15, "affection": 10},
    "clean": {"cleanliness": 30},
    "talk": {"social": 10, "stimulation": 5},
    "give_gift": {"happiness": 20, "affection": 10},
}

INTERACT_ANIMATION = {
    "feed": "eat",
    "play": "spin",
    "pet": "wiggle",
    "cuddle": "snuggle",
    "comfort": "nuzzle",
    "clean": "sparkle",
    "talk": "bounce",
    "give_gift": "jump",
}

INTERACT_HAPTIC = {
    "feed": "happy",
    "play": "excited",
    "pet": "tap",
    "cuddle": "heartbeat",
    "comfort": "calm",
    "clean": "tap",
    "talk": "happy",
    "give_gift": "excited",
}


def clamp(value: float) -> float:
    return max(0.0, min(100.0, value))


def derive_need_model(species: str) -> list[str]:
    """The creature's mechanics derive from what the creature is.

    Robots run on an energy cell instead of hunger; every other species
    uses the standard need model.
    """
    if "robot" in species.lower():
        return ["energy_cell" if n == "hunger" else n for n in STANDARD_NEEDS]
    return list(STANDARD_NEEDS)


def derive_mood(needs: dict[str, float]) -> str:
    avg = (
        needs.get("happiness", 50.0)
        + needs.get("energy", 50.0)
        + needs.get("affection", 50.0)
    ) / 3.0
    if avg >= 80:
        return "ecstatic"
    if avg >= 60:
        return "happy"
    if avg >= 40:
        return "content"
    if avg >= 25:
        return "sleepy"
    if avg >= 15:
        return "grumpy"
    return "lonely"


def _new_id() -> str:
    return uuid.uuid4().hex


def _now():
    return datetime.now(UTC)


# Away-event templates: the pet lives while the owner is gone.
def _away_templates():
    return [
        {
            "type": "discovery",
            "title": lambda p: f"{p.name} discovered a new hobby",
            "body": lambda p, r: (
                f"{p.name} spent the morning trying a brand-new hobby and now "
                "won't stop talking about it."
            ),
        },
        {
            "type": "game",
            "title": lambda p: f"{p.name} tried to learn a new game",
            "body": lambda p, r: (
                f"It took {p.name} seventeen tries, but they finally beat level one. "
                "They are unbearably proud."
            ),
        },
        {
            "type": "media",
            "title": lambda p: f"{p.name} made something for you",
            "body": lambda p, r: (
                f"{p.name} put together a little surprise for you. Check the gallery!"
            ),
        },
        {
            "type": "social",
            "title": lambda p: f"{p.name} played with another creature",
            "body": lambda p, r: (
                f"{p.name} met a neighbor's pet and they chased each other "
                "around until naptime."
            ),
        },
        {
            "type": "collection",
            "title": lambda p: f"{p.name} started a collection",
            "body": lambda p, r: (
                f"{p.name} is now obsessed with collecting hats. "
                f"There are already {r.randint(2, 7)} of them."
            ),
        },
        {
            "type": "exploration",
            "title": lambda p: f"{p.name} explored and found something strange",
            "body": lambda p, r: (
                f"{p.name} wandered past the garden fence and found a shiny "
                "pebble that hums when it rains."
            ),
        },
    ]


_MISSED_OWNER = {
    "type": "missed_owner",
    "title": lambda p: f"{p.name} missed you",
    "body": lambda p, r: (
        f"{p.name} sat by the window and waited. "
        "They perked up the moment they sensed you coming back."
    ),
}


def _seeded_rng(pet: Pet, minutes: int) -> random.Random:
    seed = int(
        hashlib.sha256(
            f"{pet.id}:{pet.last_seen_at.isoformat()}:{minutes}".encode()
        ).hexdigest(),
        16,
    ) % (2**32)
    return random.Random(seed)


def _apply_level(new: Pet, events: list[PetEvent], now: datetime) -> None:
    new_level = 1 + new.xp // 100
    if new_level > new.level:
        new.level = new_level
        events.append(
            PetEvent(
                id=_new_id(),
                pet_id=new.id,
                type="level_up",
                title=f"{new.name} leveled up!",
                body=f"{new.name} reached level {new_level}. They feel stronger and prouder.",
                created_at=now,
            )
        )


def tick(pet: Pet, minutes: int) -> tuple[Pet, list[PetEvent]]:
    """Advance the deterministic simulation by ``minutes``.

    Returns (new_pet, events). Pure: the input pet is never mutated.
    """
    minutes = max(0, int(minutes))
    new = pet.model_copy(deep=True)
    now = _now()

    factor = minutes / 60.0
    for need, rate in DECAY_PER_HOUR.items():
        if need in new.needs:
            new.needs[need] = clamp(round(new.needs[need] - rate * factor, 2))

    events: list[PetEvent] = []
    if minutes >= 5:
        rng = _seeded_rng(pet, minutes)
        pool = _away_templates()
        if new.needs.get("affection", 100.0) < 30:
            pool = pool + [_MISSED_OWNER]
        count = 1 if minutes < 60 else rng.randint(1, 3)
        for template in rng.sample(pool, k=min(count, len(pool))):
            events.append(
                PetEvent(
                    id=_new_id(),
                    pet_id=new.id,
                    type=template["type"],
                    title=template["title"](new),
                    body=template["body"](new, rng),
                    created_at=now,
                )
            )

    new.xp += minutes // 30
    _apply_level(new, events, now)
    new.mood = derive_mood(new.needs)
    new.last_seen_at = now
    return new, events


def interact(pet: Pet, action: str, detail: str = "") -> tuple[Pet, Reaction]:
    """Apply a deterministic owner interaction and get the pet's reaction.

    Numbers come from INTERACT_DELTAS (clamped); the words come from the
    Pet Mind (mock templates, never an LLM call in this build).
    """
    if action not in INTERACT_DELTAS:
        raise ValueError(f"unknown interaction action: {action!r}")

    new = pet.model_copy(deep=True)
    deltas = dict(INTERACT_DELTAS[action])

    # Robots eat energy cells, not food.
    if "hunger" in deltas and "hunger" not in new.needs and "energy_cell" in new.needs:
        deltas["energy_cell"] = deltas.pop("hunger")

    for need, delta in deltas.items():
        if need in new.needs:
            new.needs[need] = clamp(round(new.needs[need] + delta, 2))

    new.xp += 5
    new.level = 1 + new.xp // 100
    new.mood = derive_mood(new.needs)
    new.last_seen_at = _now()

    text = mind_narrate(new, trigger=f"owner_{action}", context=detail or "")
    reaction = Reaction(
        text=text,
        animation=INTERACT_ANIMATION[action],
        haptic=INTERACT_HAPTIC[action],
        mood=new.mood,
    )
    return new, reaction
