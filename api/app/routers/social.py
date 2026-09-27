"""Pet-to-pet social interaction routes."""

from __future__ import annotations

from fastapi import APIRouter
from pydantic import BaseModel

from app.memory import experiences
from app.routers.deps import get_pet_or_404, get_store
from app.social.engine import meet

router = APIRouter(prefix="/pets", tags=["social"])


class MeetRequest(BaseModel):
    other_pet_id: str


@router.post("/{pet_id}/social/meet")
def meet_pets(pet_id: str, body: MeetRequest):
    pet_a = get_pet_or_404(pet_id)
    pet_b = get_pet_or_404(body.other_pet_id)
    interaction = meet(pet_a, pet_b)
    experiences.append_experience(
        get_store(), pet_a.id, f"Met {pet_b.name}: {interaction['summary']}", significance=0.6
    )
    experiences.append_experience(
        get_store(), pet_b.id, f"Met {pet_a.name}: {interaction['summary']}", significance=0.6
    )
    return {"interaction": interaction}
