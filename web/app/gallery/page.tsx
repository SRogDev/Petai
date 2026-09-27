"use client";

import { Clapperboard, ImagePlus, Images, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Chip, ClayButton, ClayCard, SectionTitle } from "../../components/ui";
import {
  type MediaArtifact,
  type Pet,
  createMedia,
  listMedia,
  listPets,
} from "../../lib/api";
import { buzz } from "../../lib/haptics";

export const dynamic = "force-dynamic";

function timeAgo(iso: string): string {
  const mins = Math.max(
    0,
    Math.round((Date.now() - new Date(iso).getTime()) / 60000),
  );
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}

export default function GalleryPage() {
  const [pets, setPets] = useState<Pet[]>([]);
  const [petId, setPetId] = useState("");
  const [items, setItems] = useState<MediaArtifact[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    listPets()
      .then((p) => {
        if (cancelled) return;
        setPets(p);
        if (p[0]) setPetId(p[0].id);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!petId) {
      setItems([]);
      return;
    }
    let cancelled = false;
    listMedia(petId)
      .then((m) => {
        if (!cancelled) setItems(m);
      })
      .catch(() => {
        if (!cancelled) setItems([]);
      });
    return () => {
      cancelled = true;
    };
  }, [petId]);

  async function handleCreatePostcard() {
    if (!petId || creating) return;
    setCreating(true);
    setError("");
    buzz("excited");
    try {
      const art = await createMedia(petId, "image");
      setItems((prev) => [art, ...prev]);
      buzz("happy");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not create the postcard.",
      );
    } finally {
      setCreating(false);
    }
  }

  const pet = pets.find((p) => p.id === petId);

  if (loading) {
    return (
      <div className="flex min-h-[50dvh] flex-col items-center justify-center gap-3">
        <Loader2 size={36} className="animate-spin text-primary" aria-hidden />
        <p className="font-display text-lg font-semibold text-foreground/60">
          Opening the gallery…
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="text-center">
        <SectionTitle className="text-3xl">Moments & creations</SectionTitle>
        <p className="mx-auto mt-2 max-w-md text-sm font-semibold text-foreground/65">
          Everything your creatures make — postcards, clips, little films about
          their day. Pet event → media, starring them.
        </p>
      </header>

      {pets.length === 0 ? (
        <ClayCard className="text-center">
          <Images
            size={40}
            className="mx-auto text-foreground/40"
            aria-hidden
          />
          <p className="font-display mt-3 text-xl font-semibold">
            No gallery yet
          </p>
          <p className="mt-2 text-sm font-semibold text-foreground/60">
            Adopt a creature first — then it will start creating things for you.
          </p>
        </ClayCard>
      ) : (
        <>
          <div className="flex flex-col gap-3 sm:flex-row">
            <label className="flex-1">
              <span className="sr-only">Choose a creature</span>
              <select
                value={petId}
                onChange={(e) => setPetId(e.target.value)}
                className="clay-input min-h-[52px] w-full p-3 text-base font-bold text-foreground"
              >
                {pets.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}’s creations
                  </option>
                ))}
              </select>
            </label>
            <ClayButton
              onClick={handleCreatePostcard}
              disabled={creating}
              className="sm:w-auto"
            >
              {creating ? (
                <>
                  <Loader2 size={20} className="animate-spin" aria-hidden />{" "}
                  Creating…
                </>
              ) : (
                <>
                  <ImagePlus size={20} aria-hidden /> Create postcard
                </>
              )}
            </ClayButton>
          </div>

          {error && (
            <p
              role="alert"
              className="rounded-2xl border-[3px] border-red-200 bg-red-50 p-4 text-sm font-bold text-red-600"
            >
              {error}
            </p>
          )}

          {items.length === 0 ? (
            <ClayCard className="text-center">
              <Clapperboard
                size={40}
                className="mx-auto text-foreground/40"
                aria-hidden
              />
              <p className="font-display mt-3 text-xl font-semibold">
                {pet
                  ? `${pet.name} hasn't made anything yet`
                  : "Nothing here yet"}
              </p>
              <p className="mt-2 text-sm font-semibold text-foreground/60">
                Creatures create on their own — or tap “Create postcard” to
                nudge one.
              </p>
            </ClayCard>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              {items.map((art) => (
                <figure
                  key={art.id}
                  className="clay-card-flat overflow-hidden p-0"
                >
                  <img
                    src={art.url}
                    alt={art.caption || `${art.kind} by your pet`}
                    className="aspect-square w-full object-cover"
                    loading="lazy"
                  />
                  <figcaption className="p-3">
                    <div className="mb-1 flex items-center justify-between">
                      <Chip className="text-[10px] uppercase">{art.kind}</Chip>
                      <span className="text-[11px] font-bold text-foreground/50">
                        {timeAgo(art.created_at)}
                      </span>
                    </div>
                    {art.caption && (
                      <p className="text-xs font-semibold text-foreground/70">
                        {art.caption}
                      </p>
                    )}
                  </figcaption>
                </figure>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
