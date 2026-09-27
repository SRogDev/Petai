"""JSON file persistence with atomic writes (tmp file + rename)."""

from __future__ import annotations

import json
import os
import tempfile
from pathlib import Path


class JsonStore:
    """One JSON object file per collection under the data directory."""

    def __init__(self, data_dir: str | Path):
        self.data_dir = Path(data_dir)
        self.data_dir.mkdir(parents=True, exist_ok=True)

    def _path(self, collection: str) -> Path:
        safe = "".join(c for c in collection if c.isalnum() or c in ("_", "-"))
        return self.data_dir / f"{safe}.json"

    def _read(self, collection: str) -> dict:
        path = self._path(collection)
        if not path.exists():
            return {}
        try:
            return json.loads(path.read_text(encoding="utf-8"))
        except json.JSONDecodeError:
            return {}

    def _write(self, collection: str, data: dict) -> None:
        path = self._path(collection)
        fd, tmp = tempfile.mkstemp(
            dir=str(self.data_dir), prefix=path.name + ".", suffix=".tmp"
        )
        try:
            with os.fdopen(fd, "w", encoding="utf-8") as f:
                json.dump(data, f, indent=2)
            os.replace(tmp, path)
        except Exception:
            try:
                os.unlink(tmp)
            except OSError:
                pass
            raise

    def save(self, collection: str, record_id: str, record: dict) -> None:
        data = self._read(collection)
        data[record_id] = record
        self._write(collection, data)

    def get(self, collection: str, record_id: str) -> dict | None:
        return self._read(collection).get(record_id)

    def all(self, collection: str) -> list[dict]:
        return list(self._read(collection).values())

    def delete(self, collection: str, record_id: str) -> None:
        data = self._read(collection)
        if record_id in data:
            del data[record_id]
            self._write(collection, data)
