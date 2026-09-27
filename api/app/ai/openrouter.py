"""OpenRouter client with a provider switch.

- ``mock`` (default): procedural, keyword-driven creature generation seeded by
  sha256(description). No network, fully deterministic for the same input.
- ``openrouter``: HONEST STUB — raises HTTP 501. Real model orchestration is
  wired here once an OPENROUTER_API_KEY is provided.
"""

from __future__ import annotations

import hashlib
import random
import re
import uuid
from datetime import UTC, datetime

from fastapi import HTTPException

from app.models.pet import Appearance, Origin, Personality, Pet, Preferences
from app.simulation.engine import derive_mood, derive_need_model

SPECIES_KEYWORDS: list[tuple[str, str, str, list[str]]] = [
    # (keyword, species, body_shape, features)
    ("dragon", "dragon", "dragon", ["wings", "horns"]),
    ("robot", "robot", "robot", ["antenna", "glowing core"]),
    ("alien", "alien", "blob", ["antenna"]),
    ("cat", "cat", "cat", ["whiskers"]),
    ("kitten", "cat", "cat", ["whiskers"]),
    ("dog", "dog", "round", ["floppy ears"]),
    ("puppy", "dog", "round", ["floppy ears"]),
    ("bird", "bird", "round", ["wings"]),
]

COLORS: dict[str, str] = {
    "blue": "#5B8DEF",
    "pink": "#FF8FB3",
    "green": "#6FD598",
    "purple": "#A78BFA",
    "orange": "#FB923C",
    "red": "#F87171",
    "yellow": "#FBBF24",
    "black": "#4B5563",
    "white": "#F8FAFC",
}
DEFAULT_COLOR = "#A78BFA"

# Warm accent for cool bases, cool accent for warm bases.
WARM_ACCENT = "#FB923C"
COOL_ACCENT = "#5B8DEF"
COOL_BASES = {"#5B8DEF", "#6FD598", "#A78BFA", "#4B5563", "#F8FAFC"}

TRAITS = [
    "playful",
    "shy",
    "chaotic",
    "affectionate",
    "curious",
    "mischievous",
    "calm",
    "energetic",
    "arrogant",
]

VOICE_STYLES = {
    "playful": "bouncy and playful",
    "shy": "soft and shy",
    "chaotic": "wild and chaotic",
    "affectionate": "sweet and affectionate",
    "curious": "curious and wonder-filled",
    "mischievous": "mischievous and cheeky",
    "calm": "calm and gentle",
    "energetic": "hyper and energetic",
    "arrogant": "proud and sassy",
}

FOODS = ["pancakes", "fish", "berries", "pizza", "honey", "carrots"]
GAMES = ["hide and seek", "tag", "puzzle games", "racing", "dance party"]
ACTIVITIES = ["exploring", "napping", "drawing", "singing", "collecting hats"]
DISLIKES = ["loud noises", "baths", "vegetables", "being ignored"]
FEARS = ["thunderstorms", "loud noises", "darkness", "vacuum cleaners"]
ACCESSORY_WORDS = ["hat", "scarf", "bow", "cape", "glasses"]

BACKSTORY_TEMPLATES = [
    (
        "{name} appeared one rainy afternoon at the edge of the garden, humming "
        "a tune nobody taught them. Ever since, this {t1} little {species} has been "
        "{t2} about absolutely everything."
    ),
    (
        "Nobody knows where {name} came from — some say a shooting star, others a "
        "dream that refused to wake up. What is certain is that this {t1} {species} "
        "chose you, and has been {t2} ever since."
    ),
    (
        "{name} was discovered inside a box labeled 'do not shake', already {t1} "
        "and plotting something {t2}. The {species} has lived for mischief and naps "
        "ever since."
    ),
]

DEFAULT_NAMES = ["Mochi", "Pip", "Luna", "Ziggy", "Nori", "Bubbles"]


def _lighten(hex_color: str, amount: float = 0.55) -> str:
    """Mix a hex color toward white by ``amount`` (0..1)."""
    hex_color = hex_color.lstrip("#")
    r, g, b = (int(hex_color[i : i + 2], 16) for i in (0, 2, 4))
    r = int(r + (255 - r) * amount)
    g = int(g + (255 - g) * amount)
    b = int(b + (255 - b) * amount)
    return f"#{r:02X}{g:02X}{b:02X}"


def _seed(description: str) -> random.Random:
    n = int(hashlib.sha256(description.encode()).hexdigest(), 16) % (2**32)
    return random.Random(n)


class OpenRouterClient:
    """Creature-generation client with a mock/openrouter provider switch."""

    def __init__(self, provider: str = "mock", api_key: str | None = None):
        self.provider = (provider or "mock").lower()
        self.api_key = api_key

    def generate_creature(self, description: str, name: str | None = None) -> dict:
        if self.provider == "openrouter":
            raise HTTPException(
                status_code=501,
                detail=(
                    "OPENROUTER_API_KEY not configured (mock provider active)"
                    if not self.api_key
                    else "OpenRouter generation is not wired yet in this MVP build"
                ),
            )
        if self.provider != "mock":
            raise HTTPException(status_code=400, detail=f"unknown AI provider: {self.provider!r}")
        return self._generate_mock(description, name)

    def _generate_mock(self, description: str, name: str | None = None) -> dict:
        desc = description.lower()
        rng = _seed(description)

        species, body_shape, features = "blob", "blob", []
        for keyword, sp, shape, feats in SPECIES_KEYWORDS:
            if keyword in desc:
                species, body_shape, features = sp, shape, list(feats)
                break

        found_colors = re.findall("|".join(COLORS.keys()), desc)
        base_color = COLORS.get(found_colors[0], DEFAULT_COLOR) if found_colors else DEFAULT_COLOR
        belly_color = _lighten(base_color, 0.55)
        accent_color = WARM_ACCENT if base_color in COOL_BASES else COOL_ACCENT

        if "sleepy" in desc:
            eye_style = "sleepy"
        elif "star" in desc:
            eye_style = "starry"
        elif "happy" in desc:
            eye_style = "happy"
        else:
            eye_style = "big_round"

        if "tiny" in desc:
            size = "tiny"
        elif "small" in desc:
            size = "small"
        elif any(w in desc for w in ("big", "large", "huge", "giant")):
            size = "medium"
        else:
            size = "small"

        accessories = [w for w in ACCESSORY_WORDS if re.search(rf"\b{re.escape(w)}\b", desc)]

        if "pixel" in desc:
            visual_style = "pixel-art"
        elif "realistic" in desc:
            visual_style = "soft-3d"
        elif "anime" in desc:
            visual_style = "anime"
        else:
            visual_style = "kawaii"

        traits = [t for t in TRAITS if t in desc][:4] or ["curious", "playful"]
        voice_style = " and ".join(VOICE_STYLES[t] for t in traits[:2])

        foods = [f for f in FOODS if f in desc] or ["pancakes"]
        games = [g for g in GAMES if g in desc] or ["hide and seek"]
        activities = [a for a in ACTIVITIES if a in desc] or ["exploring"]
        dislikes = [d for d in DISLIKES if d in desc] or ["loud noises"]
        fears = [f for f in FEARS if f in desc]

        pet_name = name or rng.choice(DEFAULT_NAMES)
        t1, t2 = traits[0], traits[1] if len(traits) > 1 else traits[0]
        backstory = BACKSTORY_TEMPLATES[
            int(hashlib.sha256(description.encode()).hexdigest(), 16)
            % len(BACKSTORY_TEMPLATES)
        ].format(name=pet_name, species=species, t1=t1, t2=t2)

        return {
            "name": pet_name,
            "species": species,
            "appearance": {
                "body_shape": body_shape,
                "base_color": base_color,
                "belly_color": belly_color,
                "accent_color": accent_color,
                "eye_style": eye_style,
                "size": size,
                "features": features,
                "accessories": accessories,
                "visual_style": visual_style,
            },
            "personality": {
                "traits": traits,
                "description": f"A {', '.join(traits)} little {species}.",
                "voice_style": voice_style,
            },
            "preferences": {
                "favorite_foods": foods,
                "favorite_games": games,
                "favorite_activities": activities,
                "dislikes": dislikes,
                "fears": fears,
            },
            "origin": {"backstory": backstory},
        }


def create_pet(
    description: str,
    name: str | None = None,
    owner_id: str | None = None,
    provider: str = "mock",
    api_key: str | None = None,
) -> Pet:
    """Generate a creature and materialize it as a Pet with initial needs."""
    gen = OpenRouterClient(provider=provider, api_key=api_key).generate_creature(description, name)
    need_model = derive_need_model(gen["species"])
    needs = {need: 80.0 for need in need_model}
    now = datetime.now(UTC)
    return Pet(
        id=uuid.uuid4().hex,
        name=gen["name"],
        species=gen["species"],
        appearance=Appearance(**gen["appearance"]),
        personality=Personality(**gen["personality"]),
        preferences=Preferences(**gen["preferences"]),
        origin=Origin(**gen["origin"]),
        needs=needs,
        need_model=need_model,
        mood=derive_mood(needs),
        activity="waking up",
        level=1,
        xp=0,
        owner_id=owner_id,
        created_at=now,
        last_seen_at=now,
    )
