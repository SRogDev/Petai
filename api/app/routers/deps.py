"""Shared router dependencies: store, AI client, pet lookup helpers."""

from __future__ import annotations

from functools import lru_cache

from fastapi import HTTPException

from app.ai.openrouter import OpenRouterClient
from app.config import AI_PROVIDER, DATA_DIR, OPENROUTER_API_KEY
from app.models.pet import Pet, PetEvent
from app.store.json_store import JsonStore


@lru_cache
def get_store() -> JsonStore:
    return JsonStore(DATA_DIR)


def get_ai() -> OpenRouterClient:
    return OpenRouterClient(provider=AI_PROVIDER, api_key=OPENROUTER_API_KEY)


def get_pet_or_404(pet_id: str) -> Pet:
    record = get_store().get("pets", pet_id)
    if not record:
        raise HTTPException(status_code=404, detail=f"pet {pet_id} not found")
    return Pet.model_validate(record)


def save_pet(pet: Pet) -> None:
    get_store().save("pets", pet.id, pet.model_dump(mode="json"))


def save_event(event: PetEvent) -> None:
    get_store().save("events", event.id, event.model_dump(mode="json"))
