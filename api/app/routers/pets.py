"""Pet CRUD, interaction and simulation tick routes."""

from __future__ import annotations

import uuid
from datetime import UTC, datetime

from fastapi import APIRouter
from pydantic import BaseModel, Field

from app.ai.openrouter import create_pet
from app.config import AI_PROVIDER, OPENROUTER_API_KEY
from app.memory import experiences
from app.models.pet import PetEvent
from app.routers.deps import get_pet_or_404, get_store, save_event, save_pet
from app.simulation.engine import interact, tick

router = APIRouter(prefix="/pets", tags=["pets"])


class PetCreate(BaseModel):
    description: str = Field(min_length=3, max_length=2000)
    name: str | None = Field(default=None, max_length=60)


class InteractRequest(BaseModel):
    action: str
    detail: str | None = None


class TickRequest(BaseModel):
    minutes: int = Field(default=60, ge=1, le=10080)


def _pet_summary(pet) -> dict:
    return {
        "id": pet.id,
        "name": pet.name,
        "species": pet.species,
        "mood": pet.mood,
        "level": pet.level,
    }


def _created_event(pet_id: str) -> PetEvent:
    return PetEvent(
        id=uuid.uuid4().hex,
        pet_id=pet_id,
        type="pet_created",
        title="A new creature is born!",
        body="Your pet just hatched. Say hi!",
        created_at=datetime.now(UTC),
    )


@router.post("", status_code=201)
def create_pet_route(body: PetCreate):
    # create_pet raises HTTP 501 when the openrouter provider is selected.
    pet = create_pet(
        body.description, name=body.name, provider=AI_PROVIDER, api_key=OPENROUTER_API_KEY
    )
    save_pet(pet)
    save_event(_created_event(pet.id))
    return {"pet": pet}


@router.get("")
def list_pets():
    pets = [get_pet_or_404(r["id"]) for r in get_store().all("pets")]
    return {"pets": [_pet_summary(p) for p in pets]}


@router.get("/{pet_id}")
def get_pet(pet_id: str):
    """Return the pet, silently simulating the time since the last visit.

    This is the "alive between sessions" loop: the creature lived while the
    owner was away, and the fresh events are reported as away_events.
    """
    pet = get_pet_or_404(pet_id)
    last_seen = pet.last_seen_at
    if last_seen.tzinfo is None:
        last_seen = last_seen.replace(tzinfo=UTC)
    elapsed = int((datetime.now(UTC) - last_seen).total_seconds() // 60)

    away_events: list[PetEvent] = []
    if elapsed > 0:
        pet, away_events = tick(pet, elapsed)
        away_events = away_events[-5:]
        for event in away_events:
            event.seen = True
            save_event(event)
        save_pet(pet)
    return {"pet": pet, "away_events": away_events}


@router.post("/{pet_id}/interact")
def interact_with_pet(pet_id: str, body: InteractRequest):
    pet = get_pet_or_404(pet_id)
    try:
        pet, reaction = interact(pet, body.action, body.detail or "")
    except ValueError as exc:
        from fastapi import HTTPException

        raise HTTPException(status_code=400, detail=str(exc)) from exc
    save_pet(pet)
    experiences.append_experience(
        get_store(),
        pet.id,
        f"Owner {body.action} interaction: {reaction.text}",
        significance=0.4,
    )
    return {"pet": pet, "reaction": reaction}


@router.post("/{pet_id}/tick")
def tick_pet(pet_id: str, body: TickRequest):
    pet = get_pet_or_404(pet_id)
    pet, events = tick(pet, body.minutes)
    for event in events:
        save_event(event)
    save_pet(pet)
    return {"pet": pet, "events": events}
