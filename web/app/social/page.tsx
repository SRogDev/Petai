"use client";

import { Heart, Loader2, MessagesSquare, Sparkles, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { CreatureCanvas } from "../../components/CreatureCanvas";
import { Chip, ClayButton, ClayCard, SectionTitle } from "../../components/ui";
import { type MeetResponse, type Pet, listPets, meetPets } from "../../lib/api";
import { buzz } from "../../lib/haptics";

export const dynamic = "force-dynamic";

function PetSelect({
  label,
  pets,
  value,
  exclude,
  onChange,
}: {
  label: string;
  pets: Pet[];
  value: string;
  exclude: string;
  onChange: (id: string) => void;
}) {
  return (
    <label className="block flex-1">
      <span className="font-display mb-2 block text-base font-semibold">
        {label}
      </span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="clay-input min-h-[52px] w-full p-3 text-base font-bold text-foreground"
      >
        {pets
          .filter((p) => p.id !== exclude)
          .map((p) => (
            <option key={p.id} value={p.id}>
              {p.name} · {p.species}
            </option>
          ))}
      </select>
    </label>
  );
}

export default function SocialPage() {
  const [pets, setPets] = useState<Pet[]>([]);
  const [loading, setLoading] = useState(true);
  const [petA, setPetA] = useState("");
  const [petB, setPetB] = useState("");
  const [meeting, setMeeting] = useState(false);
  const [result, setResult] = useState<MeetResponse | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    listPets()
      .then((p) => {
        if (cancelled) return;
        setPets(p);
        if (p[0]) setPetA(p[0].id);
        if (p[1]) setPetB(p[1].id);
        else if (p[0]) setPetB(p[0].id);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const creatureA = pets.find((p) => p.id === petA);
  const creatureB = pets.find((p) => p.id === petB);
  const canMeet = petA && petB && petA !== petB && !meeting;

  async function handleMeet() {
    if (!canMeet) return;
    setMeeting(true);
    setError("");
    setResult(null);
    buzz("excited");
    try {
      const res = await meetPets(petA, petB);
      setResult(res);
      buzz("happy");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "The meeting fell through.",
      );
    } finally {
      setMeeting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[50dvh] flex-col items-center justify-center gap-3">
        <Loader2 size={36} className="animate-spin text-primary" aria-hidden />
        <p className="font-display text-lg font-semibold text-foreground/60">
          Gathering the creatures…
        </p>
      </div>
    );
  }

  if (pets.length < 2) {
    return (
      <ClayCard className="text-center">
        <Users size={40} className="mx-auto text-foreground/40" aria-hidden />
        <p className="font-display mt-3 text-xl font-semibold">
          Not enough creatures yet
        </p>
        <p className="mt-2 text-sm font-semibold text-foreground/60">
          Social life needs at least two pets. Create another creature and let
          them meet.
        </p>
      </ClayCard>
    );
  }

  return (
    <div className="space-y-6">
      <header className="text-center">
        <SectionTitle className="text-3xl">Creature social club</SectionTitle>
        <p className="mx-auto mt-2 max-w-md text-sm font-semibold text-foreground/65">
          Pets have relationships of their own — friendships, rivalries, play
          dates. Pick two and let them meet.
        </p>
      </header>

      <ClayCard className="space-y-4">
        <div className="flex items-center justify-center gap-4">
          {creatureA && (
            <CreatureCanvas
              appearance={creatureA.appearance}
              mood="happy"
              width={110}
              height={110}
            />
          )}
          <span
            className="font-display text-3xl font-bold text-primary"
            aria-hidden
          >
            ×
          </span>
          {creatureB && (
            <CreatureCanvas
              appearance={creatureB.appearance}
              mood="happy"
              width={110}
              height={110}
            />
          )}
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <PetSelect
            label="First creature"
            pets={pets}
            value={petA}
            exclude=""
            onChange={setPetA}
          />
          <PetSelect
            label="Second creature"
            pets={pets}
            value={petB}
            exclude={petA}
            onChange={setPetB}
          />
        </div>
        <ClayButton onClick={handleMeet} disabled={!canMeet} className="w-full">
          {meeting ? (
            <>
              <Loader2 size={20} className="animate-spin" aria-hidden /> They’re
              meeting…
            </>
          ) : (
            <>
              <MessagesSquare size={20} aria-hidden /> Let them meet
            </>
          )}
        </ClayButton>
        {petA === petB && (
          <p className="text-center text-sm font-bold text-foreground/55">
            A creature meeting itself is just a mirror. Pick two different pets.
          </p>
        )}
        {error && (
          <p
            role="alert"
            className="rounded-2xl border-[3px] border-red-200 bg-red-50 p-4 text-sm font-bold text-red-600"
          >
            {error}
          </p>
        )}
      </ClayCard>

      {result && creatureA && creatureB && (
        <ClayCard className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-2xl font-bold">{result.title}</h2>
            <Chip>
              <Heart size={14} aria-hidden /> {result.friendship}% friends
            </Chip>
          </div>
          <div
            className="h-4 overflow-hidden rounded-full border-[3px] border-border bg-muted"
            role="progressbar"
            tabIndex={0}
            aria-label="Friendship level"
            aria-valuenow={result.friendship}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div
              className="h-full rounded-full bg-gradient-to-r from-secondary to-primary transition-all duration-1000"
              style={{
                width: `${Math.max(0, Math.min(100, result.friendship))}%`,
              }}
            />
          </div>
          <ol className="space-y-3">
            {result.dialogue.map((line, i) => {
              const speaker = i % 2 === 0 ? creatureA : creatureB;
              const left = i % 2 === 0;
              return (
                <li
                  key={`dialogue-${i}-${line.length}`}
                  className={`flex ${left ? "justify-start" : "justify-end"}`}
                >
                  <div
                    className={`clay-card-flat max-w-[85%] p-3 ${left ? "" : "bg-primary/10"}`}
                  >
                    <p className="text-xs font-extrabold uppercase tracking-wide text-foreground/50">
                      {speaker.name}
                    </p>
                    <p className="mt-0.5 text-sm font-semibold text-foreground">
                      {line}
                    </p>
                  </div>
                </li>
              );
            })}
          </ol>
          <p className="flex items-center justify-center gap-2 text-center text-xs font-bold text-foreground/50">
            <Sparkles size={14} aria-hidden />
            Their relationship evolves — meet them again tomorrow.
          </p>
        </ClayCard>
      )}
    </div>
  );
}
