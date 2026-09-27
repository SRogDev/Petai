"""Pet event feed and SSE stream routes."""

from __future__ import annotations

import asyncio
import json
import time

from fastapi import APIRouter, Query
from fastapi.responses import StreamingResponse

from app.routers.deps import get_pet_or_404, get_store

router = APIRouter(prefix="/pets", tags=["events"])


@router.get("/{pet_id}/events")
def list_events(pet_id: str, limit: int = Query(default=50, ge=1, le=200)):
    get_pet_or_404(pet_id)  # 404 if unknown
    events = [e for e in get_store().all("events") if e["pet_id"] == pet_id]
    events.sort(key=lambda e: e["created_at"], reverse=True)
    return {"events": events[:limit]}


@router.get("/{pet_id}/stream")
def stream_events(pet_id: str, max_wait: int = Query(default=30, ge=1, le=300)):
    """Server-sent events: streams new pet events as they happen.

    Polls the store every 2 seconds for up to ``max_wait`` seconds.
    """
    get_pet_or_404(pet_id)  # 404 if unknown

    async def event_generator():
        seen_ids = {
            e["id"] for e in get_store().all("events") if e["pet_id"] == pet_id
        }
        start = time.monotonic()
        yield ": connected\n\n"
        while time.monotonic() - start < max_wait:
            await asyncio.sleep(2)
            fresh = [
                e
                for e in get_store().all("events")
                if e["pet_id"] == pet_id and e["id"] not in seen_ids
            ]
            for event in sorted(fresh, key=lambda e: e["created_at"]):
                seen_ids.add(event["id"])
                yield f"data: {json.dumps(event)}\n\n"
        yield ": stream closed\n\n"

    return StreamingResponse(event_generator(), media_type="text/event-stream")
