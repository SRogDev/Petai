"""Pet media generation routes."""

from __future__ import annotations

from fastapi import APIRouter
from fastapi.responses import JSONResponse
from pydantic import BaseModel

from app.media import engine as media_engine
from app.models.pet import MediaArtifact
from app.routers.deps import get_pet_or_404, get_store

router = APIRouter(prefix="/pets", tags=["media"])


class MediaRequest(BaseModel):
    kind: str
    prompt_hint: str | None = None


def save_media(artifact: MediaArtifact) -> None:
    get_store().save("media", artifact.id, artifact.model_dump(mode="json"))


@router.get("/{pet_id}/media")
def list_media(pet_id: str):
    get_pet_or_404(pet_id)  # 404 if unknown
    media = [m for m in get_store().all("media") if m["pet_id"] == pet_id]
    media.sort(key=lambda m: m["created_at"], reverse=True)
    return {"media": media}


@router.post("/{pet_id}/media", status_code=201)
def create_media(pet_id: str, body: MediaRequest):
    pet = get_pet_or_404(pet_id)
    if body.kind == "image":
        caption = body.prompt_hint or f"{pet.name}'s day"
        artifact = media_engine.generate_image(pet, caption)
        save_media(artifact)
        return {"media": artifact}
    if body.kind == "video":
        # HONEST STUB: 202 accepted-but-queued until an OpenRouter key exists.
        stub = media_engine.generate_video(pet, body.prompt_hint)
        return JSONResponse(status_code=202, content=stub)
    from fastapi import HTTPException

    raise HTTPException(status_code=400, detail=f"unknown media kind: {body.kind!r}")
