"""Meaningful experience memory: the pet remembers significant moments,
not every interaction."""

from __future__ import annotations

import uuid
from datetime import UTC, datetime

from app.store.json_store import JsonStore


def append_experience(
    store: JsonStore, pet_id: str, text: str, significance: float = 0.5
) -> dict:
    record = {
        "id": uuid.uuid4().hex,
        "pet_id": pet_id,
        "text": text,
        "significance": max(0.0, min(1.0, significance)),
        "created_at": datetime.now(UTC).isoformat(),
    }
    store.save("experiences", record["id"], record)
    return record


def recent(store: JsonStore, pet_id: str, limit: int = 10) -> list[dict]:
    experiences = [e for e in store.all("experiences") if e["pet_id"] == pet_id]
    experiences.sort(key=lambda e: e["created_at"], reverse=True)
    return experiences[:limit]
