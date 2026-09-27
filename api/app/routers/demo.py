"""Demo routes: one-shot seeding for trying the product instantly."""

from __future__ import annotations

from fastapi import APIRouter

from app.routers.pets import PetCreate, create_pet_route

router = APIRouter(prefix="/demo", tags=["demo"])

MOCHI_DESCRIPTION = (
    "A tiny blue dragon that thinks it is a cat, loves pancakes, "
    "is scared of thunderstorms and is extremely curious."
)


@router.post("/seed", status_code=201)
def seed_demo():
    """Create Mochi, the canonical demo pet."""
    return create_pet_route(PetCreate(description=MOCHI_DESCRIPTION, name="Mochi"))
