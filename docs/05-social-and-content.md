# Petai — Social Pets & Generated Content

> Source: Petai product plan §§10–12.

## Social pets — a major pillar

Pets meet other pets. They can: play together, talk, play-fight, become
friends, exchange gifts, visit each other's environments, play minigames,
create content together, form relationships, develop recurring dynamics.

The important thing: **the pets themselves have relationships, not merely
their owners.**

- "Mochi really likes Luna."
- "Luna doesn't trust that weird dragon."
- "Your pet and Alex's pet spent the afternoon playing."

This creates emergent stories.

## The distribution loop

Petai naturally generates shareable content: short videos, screenshots,
memes, stories, "what my pet did today" clips, pet reactions, pet
adventures, pet conversations — ideally created inside the app.

The loop: **pet → event → content → sharing → new user → new pet.**

## Media generation

OpenRouter orchestrates models/providers. Video is not the product — it
is a way for the creature to express itself (birthday video, adventure
recording, music video, funny clip, "what I did while you were away").

The abstraction is always:

```
Pet Event → Media Generation
```

never `User → AI video generator`. The creature is the protagonist.
Current MVP status: image postcards are procedurally generated (mock);
video is an honest stub until an `OPENROUTER_API_KEY` is configured.
