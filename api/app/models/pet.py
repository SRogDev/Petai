"""Pydantic v2 domain models for the Petai backend."""

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field


class Appearance(BaseModel):
    body_shape: Literal["blob", "round", "long", "dragon", "robot", "cat"]
    base_color: str
    belly_color: str
    accent_color: str
    eye_style: Literal["big_round", "sleepy", "starry", "happy"]
    size: Literal["tiny", "small", "medium"]
    features: list[str] = Field(default_factory=list)
    accessories: list[str] = Field(default_factory=list)
    visual_style: str = "kawaii"


class Personality(BaseModel):
    traits: list[str] = Field(default_factory=list)
    description: str = ""
    voice_style: str = ""


class Preferences(BaseModel):
    favorite_foods: list[str] = Field(default_factory=list)
    favorite_games: list[str] = Field(default_factory=list)
    favorite_activities: list[str] = Field(default_factory=list)
    dislikes: list[str] = Field(default_factory=list)
    fears: list[str] = Field(default_factory=list)


class Origin(BaseModel):
    backstory: str = ""


class Pet(BaseModel):
    id: str
    name: str
    species: str
    appearance: Appearance
    personality: Personality
    preferences: Preferences
    origin: Origin
    needs: dict[str, float] = Field(default_factory=dict)
    need_model: list[str] = Field(default_factory=list)
    mood: str = "content"
    activity: str = "waking up"
    level: int = 1
    xp: int = 0
    owner_id: str | None = None
    created_at: datetime
    last_seen_at: datetime


class PetEvent(BaseModel):
    id: str
    pet_id: str
    type: str
    title: str
    body: str
    media_url: str | None = None
    created_at: datetime
    seen: bool = False


class Reaction(BaseModel):
    text: str
    animation: str
    haptic: str
    mood: str


class MediaArtifact(BaseModel):
    id: str
    pet_id: str
    kind: str
    url: str
    caption: str
    created_at: datetime
