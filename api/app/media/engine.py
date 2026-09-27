"""Media engine: the creature expresses itself through generated media.

- ``image``: mock postcard — a data-URL SVG rendered in the creature's colors.
- ``video``: HONEST STUB — real generation needs OPENROUTER_API_KEY.
"""

from __future__ import annotations

import base64
import uuid
from datetime import UTC, datetime
from html import escape

from app.models.pet import MediaArtifact, Pet

_EYE_STYLES = {"big_round", "sleepy", "starry", "happy"}


def _eyes_svg(eye_style: str, base: str) -> str:
    if eye_style == "sleepy":
        return (
            '<path d="M 322 300 q 28 18 56 0" stroke="#1F2937" stroke-width="8" '
            'fill="none" stroke-linecap="round"/>'
            '<path d="M 422 300 q 28 18 56 0" stroke="#1F2937" stroke-width="8" '
            'fill="none" stroke-linecap="round"/>'
        )
    if eye_style == "starry":
        star = (
            '<polygon points="{cx},{cy0} {x1},{y1} {x2},{y2}" fill="#FBBF24" '
            'stroke="#1F2937" stroke-width="4"/>'
        )
        return star.format(cx=350, cy0=272, x1=340, y1=300, x2=360, y2=300) + star.format(
            cx=450, cy0=272, x1=440, y1=300, x2=460, y2=300
        )
    if eye_style == "happy":
        return (
            '<path d="M 322 308 q 28 -28 56 0" stroke="#1F2937" stroke-width="8" '
            'fill="none" stroke-linecap="round"/>'
            '<path d="M 422 308 q 28 -28 56 0" stroke="#1F2937" stroke-width="8" '
            'fill="none" stroke-linecap="round"/>'
        )
    # big_round (default)
    return (
        '<circle cx="350" cy="295" r="30" fill="white" stroke="#1F2937" stroke-width="5"/>'
        '<circle cx="450" cy="295" r="30" fill="white" stroke="#1F2937" stroke-width="5"/>'
        f'<circle cx="356" cy="300" r="13" fill="{base}"/>'
        f'<circle cx="456" cy="300" r="13" fill="{base}"/>'
        '<circle cx="360" cy="295" r="4" fill="white"/>'
        '<circle cx="460" cy="295" r="4" fill="white"/>'
    )


def render_postcard_svg(pet: Pet, caption: str) -> str:
    """Render a cute blob postcard of the pet as an SVG string."""
    ap = pet.appearance
    eye_style = ap.eye_style if ap.eye_style in _EYE_STYLES else "big_round"
    svg = f"""<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600">
<defs><linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
<stop offset="0" stop-color="{ap.belly_color}"/><stop offset="1" stop-color="{ap.base_color}"/>
</linearGradient></defs>
<rect width="800" height="600" fill="url(#bg)"/>
<ellipse cx="400" cy="330" rx="150" ry="130" fill="{ap.base_color}"/>
<ellipse cx="400" cy="385" rx="88" ry="68" fill="{ap.belly_color}"/>
{_eyes_svg(eye_style, ap.accent_color)}
<path d="M 378 350 q 22 18 44 0" stroke="#1F2937" stroke-width="7" fill="none" stroke-linecap="round"/>
<circle cx="300" cy="345" r="16" fill="{ap.accent_color}" opacity="0.55"/>
<circle cx="500" cy="345" r="16" fill="{ap.accent_color}" opacity="0.55"/>
<text x="400" y="545" text-anchor="middle" font-family="sans-serif" font-size="34" fill="#1F2937">{escape(caption)}</text>
</svg>"""
    return svg


def generate_image(pet: Pet, caption: str) -> MediaArtifact:
    """Mock image generation: an SVG postcard starring the pet (data URL)."""
    svg = render_postcard_svg(pet, caption)
    data_url = "data:image/svg+xml;base64," + base64.b64encode(svg.encode()).decode()
    return MediaArtifact(
        id=uuid.uuid4().hex,
        pet_id=pet.id,
        kind="image",
        url=data_url,
        caption=caption,
        created_at=datetime.now(UTC),
    )


def generate_video(pet: Pet, prompt_hint: str | None = None) -> dict:
    """HONEST STUB: video generation is queued until an OpenRouter key exists."""
    return {
        "status": "queued",
        "note": "video generation requires OPENROUTER_API_KEY",
        "pet_id": pet.id,
        "prompt_hint": prompt_hint,
    }
