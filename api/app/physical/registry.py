"""Physical World Layer capability registry.

AR is a replaceable capability, not the whole product. Capabilities marked
``available`` work in this MVP build; ``planned`` ones document the roadmap
(world anchors, geolocation context) so any future physical pet<->world
interaction can be added behind the same registry.
"""

from __future__ import annotations

CAPABILITIES: list[dict] = [
    {
        "id": "ar_placement",
        "name": "AR Placement",
        "description": (
            "Place your pet in the real world through the phone camera: walking "
            "around, sitting on furniture, sleeping, playing, exploring, reacting "
            "to the environment and following the owner."
        ),
        "platforms": ["android-scene-viewer", "ios-quick-look", "webxr"],
        "status": "available",
    },
    {
        "id": "haptic_feedback",
        "name": "Haptic Feedback",
        "description": (
            "The pet feels physically present in the device: jumps, excitement, "
            "touch responses, waking up and fear each get their own vibration "
            "pattern. Embodiment, not notification spam."
        ),
        "platforms": ["android", "ios", "web-vibration-api"],
        "status": "available",
        "patterns": {
            "tap": [15],
            "excited": [15, 40, 15],
            "happy": [25],
            "scared": [50, 40, 50],
            "wake": [10, 60, 10],
            "heartbeat": [20, 30, 20, 30, 60],
        },
    },
    {
        "id": "ambient_presence",
        "name": "Ambient Presence",
        "description": (
            "The creature communicates presence between sessions: subtle sounds, "
            "animations and haptics when it wakes, gets excited, or notices the "
            "owner returning."
        ),
        "platforms": ["pwa", "android", "ios"],
        "status": "available",
    },
    {
        "id": "world_anchor_persistence",
        "name": "World Anchor Persistence",
        "description": (
            "Remember where the pet was placed in the physical world so it is "
            "still there when the owner returns. Requires ARKit/ARCore anchors."
        ),
        "platforms": ["arkit", "arcore"],
        "status": "planned",
    },
    {
        "id": "geolocation_context",
        "name": "Geolocation Context",
        "description": (
            "The pet reacts to real places: home, the park, a friend's house. "
            "Context for future physical-world routines."
        ),
        "platforms": ["pwa", "android", "ios"],
        "status": "planned",
    },
]


def get_capability(capability_id: str) -> dict | None:
    for capability in CAPABILITIES:
        if capability["id"] == capability_id:
            return capability
    return None
