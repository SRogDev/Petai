"""Physical World Layer routes: capability registry + AR/haptic sessions."""

from __future__ import annotations

import uuid
from datetime import UTC, datetime

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.physical.registry import CAPABILITIES, get_capability
from app.routers.deps import get_pet_or_404, get_store

router = APIRouter(prefix="/physical", tags=["physical"])


class SessionRequest(BaseModel):
    pet_id: str
    capability_id: str
    context: dict | None = None


@router.get("/capabilities")
def list_capabilities():
    return {"capabilities": CAPABILITIES}


@router.post("/sessions", status_code=201)
def create_session(body: SessionRequest):
    get_pet_or_404(body.pet_id)  # 404 if unknown
    capability = get_capability(body.capability_id)
    if not capability:
        raise HTTPException(status_code=404, detail=f"capability {body.capability_id} not found")
    if capability["status"] != "available":
        raise HTTPException(
            status_code=409,
            detail=f"capability {body.capability_id} is '{capability['status']}', not available yet",
        )
    session = {
        "id": uuid.uuid4().hex,
        "pet_id": body.pet_id,
        "capability_id": body.capability_id,
        "context": body.context or {},
        "started_at": datetime.now(UTC).isoformat(),
    }
    get_store().save("sessions", session["id"], session)
    return {"session": session}
