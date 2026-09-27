"use client";

import { Heart, Loader2, Sparkles, Wand2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { CreatureCanvas } from "../../components/CreatureCanvas";
import { Chip, ClayButton, ClayCard, SectionTitle } from "../../components/ui";
import { type Pet, createPet } from "../../lib/api";
import { buzz } from "../../lib/haptics";

export const dynamic = "force-dynamic";

const EXAMPLES = [
  "A tiny blue dragon that thinks it's a cat, loves pancakes, gets scared of thunderstorms and is extremely curious.",
  "A grumpy robot raven who collects shiny bottle caps and speaks in riddles.",
  "A shy mushroom sprite that glows when happy and hides from loud noises.",
  "A chaotic three-eyed alien puppy that eats socks and loves bubble baths.",
];

type Status = "idle" | "generating" | "preview" | "error";

export default function CreatePage() {
  const router = useRouter();
  const [description, setDescription] = useState("");
  const [name, setName] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [pet, setPet] = useState<Pet | null>(null);
  const [error, setError] = useState("");

  const canGenerate =
    description.trim().length >= 10 && status !== "generating";

  async function handleGenerate() {
    if (!canGenerate) return;
    setStatus("generating");
    setError("");
    try {
      const created = await createPet({
        description: description.trim(),
        name: name.trim() || undefined,
      });
      setPet(created);
      setStatus("preview");
      buzz("excited");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Generation failed.");
      setStatus("error");
    }
  }

  function handleAdopt() {
    if (!pet) return;
    buzz("happy");
    router.push(`/pets/${pet.id}`);
  }

  return (
    <div className="space-y-6">
      <header className="text-center">
        <SectionTitle className="text-3xl">Imagine your creature</SectionTitle>
        <p className="mx-auto mt-2 max-w-md text-sm font-semibold text-foreground/65">
          Describe anything you can dream up. Petai generates its appearance,
          personality, needs and backstory — then it starts living.
        </p>
      </header>

      <ClayCard className="space-y-4">
        <div>
          <label
            htmlFor="creature-desc"
            className="font-display mb-2 block text-lg font-semibold"
          >
            Describe your creature…
          </label>
          <textarea
            id="creature-desc"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            placeholder="A tiny blue dragon that thinks it's a cat…"
            className="clay-input min-h-[120px] w-full resize-y p-4 text-base font-medium text-foreground placeholder:text-foreground/35"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          {EXAMPLES.map((ex) => (
            <button
              key={ex}
              type="button"
              onClick={() => setDescription(ex)}
              className="clay-chip bg-card px-3 py-2 text-left text-xs font-bold text-foreground/75 hover:text-foreground"
            >
              {ex.length > 52 ? `${ex.slice(0, 52)}…` : ex}
            </button>
          ))}
        </div>

        <div>
          <label
            htmlFor="creature-name"
            className="font-display mb-2 block text-lg font-semibold"
          >
            Name{" "}
            <span className="text-sm font-medium text-foreground/50">
              (optional)
            </span>
          </label>
          <input
            id="creature-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Luna"
            maxLength={24}
            className="clay-input w-full p-4 text-base font-medium text-foreground placeholder:text-foreground/35"
          />
        </div>

        <ClayButton
          onClick={handleGenerate}
          disabled={!canGenerate}
          className="w-full"
        >
          {status === "generating" ? (
            <>
              <Loader2 size={20} className="animate-spin" aria-hidden />{" "}
              Dreaming it up…
            </>
          ) : (
            <>
              <Wand2 size={20} aria-hidden /> Generate creature
            </>
          )}
        </ClayButton>

        {status === "error" && (
          <p
            role="alert"
            className="rounded-2xl border-[3px] border-red-200 bg-red-50 p-4 text-sm font-bold text-red-600"
          >
            {error}
          </p>
        )}
      </ClayCard>

      {status === "preview" && pet && (
        <ClayCard className="space-y-4 text-center">
          <div className="flex justify-center">
            <div className="animate-float">
              <CreatureCanvas
                appearance={pet.appearance}
                mood="ecstatic"
                width={220}
                height={220}
              />
            </div>
          </div>
          <div>
            <h2 className="font-display text-3xl font-bold">{pet.name}</h2>
            <p className="text-sm font-bold uppercase tracking-wide text-foreground/55">
              {pet.species}
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-2">
            {pet.personality.traits.map((t) => (
              <Chip key={t}>
                <Sparkles size={12} aria-hidden /> {t}
              </Chip>
            ))}
          </div>
          <p className="mx-auto max-w-md text-sm font-medium italic text-foreground/70">
            “{pet.origin.backstory}”
          </p>
          <ClayButton onClick={handleAdopt} className="w-full">
            <Heart size={20} aria-hidden /> Adopt {pet.name}
          </ClayButton>
          <button
            type="button"
            onClick={() => {
              setStatus("idle");
              setPet(null);
            }}
            className="text-sm font-bold text-foreground/55 underline underline-offset-4"
          >
            Dream up a different one
          </button>
        </ClayCard>
      )}
    </div>
  );
}
