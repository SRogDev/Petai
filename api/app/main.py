"""Petai FastAPI application."""

from __future__ import annotations

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers import demo, events, media, pets, physical, social


def create_app() -> FastAPI:
    app = FastAPI(title="Petai API", version="0.1.0")

    # MVP: the web PWA talks to this API from any origin.
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    @app.get("/api/v1/health")
    def health():
        return {"ok": True}

    for router in (
        pets.router,
        events.router,
        social.router,
        media.router,
        physical.router,
        demo.router,
    ):
        app.include_router(router, prefix="/api/v1")

    return app


app = create_app()
