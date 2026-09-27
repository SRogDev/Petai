"use client";

import { PawPrint, Plus } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { type Pet, listPets } from "../lib/api";
import { CreatureCanvas } from "./CreatureCanvas";
import { ClayButton } from "./ui";

/** "Your companions" strip on the landing page. */
export function PetList() {
  const [pets, setPets] = useState<Pet[] | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    listPets()
      .then((p) => {
        if (!cancelled) setPets(p);
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (failed || pets === null || pets.length === 0) {
    return (
      <div className="clay-card-flat flex items-center justify-between gap-4 p-5">
        <div className="flex items-center gap-3">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl border-[3px] border-border bg-primary/15 text-primary">
            <PawPrint size={24} aria-hidden />
          </span>
          <p className="text-sm font-bold text-foreground/70">
            No creatures yet. Yours is waiting to be imagined.
          </p>
        </div>
        <Link href="/create">
          <ClayButton variant="secondary" className="px-4 py-2 text-base">
            <Plus size={18} aria-hidden /> Create
          </ClayButton>
        </Link>
      </div>
    );
  }

  return (
    <div className="strip-scroll flex gap-4 overflow-x-auto pb-2">
      {pets.map((pet) => (
        <Link
          key={pet.id}
          href={`/pets/${pet.id}`}
          className="clay-card-flat w-40 shrink-0 p-3 text-center transition-transform hover:-translate-y-1"
        >
          <CreatureCanvas
            appearance={pet.appearance}
            mood={pet.mood}
            width={120}
            height={120}
          />
          <p className="font-display text-base font-semibold">{pet.name}</p>
          <p className="text-xs font-bold text-foreground/55">{pet.species}</p>
        </Link>
      ))}
    </div>
  );
}
