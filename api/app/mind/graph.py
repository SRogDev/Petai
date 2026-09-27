"""Pet Mind: a LangGraph graph (sense -> consider -> decide -> narrate).

The mind chooses intentions and produces pet-voiced narration. It NEVER
mutates needs directly — all numbers are owned by the deterministic
simulation engine (app/simulation/engine.py).
"""

from __future__ import annotations

import hashlib
from typing import TypedDict

from langgraph.graph import END, StateGraph


class MindState(TypedDict, total=False):
    pet_name: str
    species: str
    voice_style: str
    trigger: str
    context: str
    needs: dict
    needs_summary: str
    intention: str
    narration: str


ALLOWED_INTENTIONS = [
    "play",
    "explore",
    "rest",
    "socialize",
    "create",
    "snack",
    "nap",
    "greet",
    "cuddle_up",
    "show_off",
]

# Owner action -> intention the pet expresses while being interacted with.
OWNER_ACTION_INTENTIONS = {
    "feed": "snack",
    "play": "play",
    "pet": "cuddle_up",
    "cuddle": "cuddle_up",
    "comfort": "cuddle_up",
    "clean": "show_off",
    "talk": "socialize",
    "give_gift": "show_off",
}

# Lowest need -> autonomous intention when the pet is left to its own devices.
NEED_INTENTIONS = {
    "hunger": "snack",
    "energy_cell": "snack",
    "energy": "nap",
    "social": "socialize",
    "stimulation": "play",
    "affection": "cuddle_up",
    "curiosity": "explore",
    "happiness": "play",
    "cleanliness": "show_off",
}

INTENTION_NARRATIONS: dict[str, list[str]] = {
    "greet": [
        "{name} sprints to the door at full speed. \"You're back! You're back! Tell me everything!\"",
        "{name} pretends not to care for exactly three seconds, then tackles you with a hug.",
    ],
    "snack": [
        "{name} does a happy little spin as the food appears. Crunch, crunch... gone. \"More?\"",
        "{name} sniffs the food very seriously, like a tiny food critic, then inhales it.",
    ],
    "play": [
        "{name} is already bouncing off the walls. \"Again! Again! One more round!\"",
        "{name} invents a new game on the spot. The rules make no sense, but it is the best game ever.",
    ],
    "nap": [
        "{name} curls into the tiniest ball and starts snoring softly. Do not wake them. Okay, maybe one photo.",
        "{name}'s eyelids get heavier and heavier... zzz...",
    ],
    "explore": [
        "{name} tiptoes toward the unknown with their nose in the air. Adventure smells like dust and possibility.",
        "{name} found a corner they have never sniffed before. This is huge.",
    ],
    "socialize": [
        "{name} waves both arms at the new friend. \"Hi! Hi! Do you like pancakes too?\"",
        "{name} does three excited laps around the visitor, then offers them a shiny pebble.",
    ],
    "create": [
        "{name} is making something. It is lopsided, glittery, and absolutely perfect.",
        "{name} hums while drawing. The drawing is of you. You look majestic.",
    ],
    "cuddle_up": [
        "{name} melts into your arms like warm pudding. This is their favorite place in the universe.",
        "{name} nuzzles your hand and lets out the tiniest happy sigh.",
    ],
    "show_off": [
        "{name} strikes a pose. \"Look at me. No, really. LOOK at me.\"",
        "{name} cleans behind their ears and presents themselves for admiration.",
    ],
    "rest": [
        "{name} flops over dramatically. \"I need a minute. That was a lot of existing.\"",
        "{name} finds a sunbeam and becomes one with it.",
    ],
}


def sense(state: MindState) -> dict:
    """Summarize the pet's current needs into low/high lists."""
    needs = state.get("needs", {}) or {}
    low = sorted(n for n, v in needs.items() if v < 35)
    high = sorted(n for n, v in needs.items() if v > 80)
    summary = f"low: {', '.join(low) or 'none'}; high: {', '.join(high) or 'none'}"
    return {"needs_summary": summary}


def consider(state: MindState) -> dict:
    """Pick a candidate intention from the trigger and the sensed state."""
    trigger = state.get("trigger", "")
    if trigger.startswith("owner_"):
        action = trigger[len("owner_") :]
        intention = OWNER_ACTION_INTENTIONS.get(action, "greet")
    elif trigger == "owner_returned":
        intention = "greet"
    else:  # autonomous ("away", "bored", "hungry", ...)
        needs = state.get("needs", {}) or {}
        lowest = min(needs, key=lambda n: needs[n]) if needs else None
        intention = NEED_INTENTIONS.get(lowest, "explore") if lowest else "explore"
    return {"intention": intention}


def decide(state: MindState) -> dict:
    """Validate the intention against the allowed list (safety gate)."""
    intention = state.get("intention", "explore")
    if intention not in ALLOWED_INTENTIONS:
        intention = "explore"
    return {"intention": intention}


def narrate_node(state: MindState) -> dict:
    """Render 1-2 sentences in the pet's voice from mock templates (no LLM)."""
    intention = state.get("intention", "explore")
    name = state.get("pet_name", "your pet")
    voice = state.get("voice_style", "")
    trigger = state.get("trigger", "")
    templates = INTENTION_NARRATIONS.get(intention, INTENTION_NARRATIONS["explore"])
    seed = int(hashlib.sha256(f"{name}:{voice}:{trigger}:{intention}".encode()).hexdigest(), 16)
    text = templates[seed % len(templates)].format(name=name)
    return {"narration": text}


def _build_graph():
    graph = StateGraph(MindState)
    graph.add_node("sense", sense)
    graph.add_node("consider", consider)
    graph.add_node("decide", decide)
    graph.add_node("narrate", narrate_node)
    graph.set_entry_point("sense")
    graph.add_edge("sense", "consider")
    graph.add_edge("consider", "decide")
    graph.add_edge("decide", "narrate")
    graph.add_edge("narrate", END)
    return graph.compile()


_graph = _build_graph()


def run_mind(pet, trigger: str, context: str = "") -> str:
    """Run the Pet Mind graph and return the narration text."""
    state: MindState = {
        "pet_name": pet.name,
        "species": pet.species,
        "voice_style": pet.personality.voice_style,
        "trigger": trigger,
        "context": context,
        "needs": dict(pet.needs),
    }
    result = _graph.invoke(state)
    return result["narration"]


# Backwards-compatible alias used by the simulation engine.
def narrate(pet, trigger: str, context: str = "") -> str:
    return run_mind(pet, trigger, context)
