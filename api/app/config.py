"""Environment configuration for the Petai backend."""

import os
from pathlib import Path

API_DIR = Path(__file__).resolve().parent.parent

# AI provider switch: "mock" (default, procedural generation) or "openrouter" (honest 501 stub).
AI_PROVIDER: str = os.getenv("AI_PROVIDER", "mock").lower()
OPENROUTER_API_KEY: str | None = os.getenv("OPENROUTER_API_KEY")

# JSON file persistence directory. Absolute by default so tests and the server agree.
DATA_DIR: str = os.getenv("DATA_DIR", str(API_DIR / "data"))
