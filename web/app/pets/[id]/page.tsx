"use client";

import {
  Cookie,
  Gamepad2,
  Hand,
  Heart,
  HeartHandshake,
  Loader2,
  ScanFace,
  Send,
  ShowerHead,
} from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { CreatureCanvas } from "../../../components/CreatureCanvas";
import { EventFeed } from "../../../components/EventFeed";
import { NeedsBars } from "../../../components/NeedsBars";
import {
  Chip,
  ClayButton,
  ClayCard,
  SectionTitle,
} from "../../../components/ui";
import {
  type InteractAction,
  type Pet,
  type PetEvent,
  getPet,
  getPetEvents,
  interactPet,
  talkToPet,
} from "../../../lib/api";
import { cn } from "../../../lib/cn";
import { buzz, isHapticName } from "../../../lib/haptics";

export const dynamic = "force-dynamic";

const ACTIONS: {
  id: InteractAction;
  label: string;
  icon: typeof Cookie;
}[] = [
  { id: "feed", label: "Feed", icon: Cookie },
  { id: "play", label: "Play", icon: Gamepad2 },
  { id: "pet", label: "Pet", icon: Hand },
  { id: "cuddle", label: "Cuddle", icon: Heart },
  { id: "comfort", label: "Comfort", icon: HeartHandshake },
  { id: "clean", label: "Clean", icon: ShowerHead },
];

/** Speech bubble with typewriter reveal. */
function ReactionBubble({ text }: { text: string }) {
  const [shown, setShown] = useState("");
  const reduced = useRef(false);

  useEffect(() => {
    reduced.current = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (reduced.current) {
      setShown(text);
      return;
    }
    setShown("");
    let i = 0;
    const timer = window.setInterval(() => {
      i += 2;
      setShown(text.slice(0, i));
      if (i >= text.length) window.clearInterval(timer);
    }, 24);
    return () => window.clearInterval(timer);
  }, [text]);

  return (
    <output
      className="clay-card-flat relative block bg-card p-4 text-left"
      aria-live="polite"
    >
      <p
        className={cn(
          "text-base font-semibold text-foreground",
          !reduced.current && "type-caret",
        )}
      >
        {shown}
      </p>
    </output>
  );
}

export default function PetHomePage() {
  const params = useParams();
  const id = typeof params.id === "string" ? params.id : "";

  const [pet, setPet] = useState<Pet | null>(null);
  const [events, setEvents] = useState<PetEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [reaction, setReaction] = useState<string | null>(null);
  const [busyAction, setBusyAction] = useState<InteractAction | null>(null);
  const [talkInput, setTalkInput] = useState("");
  const [talking, setTalking] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    if (!id) return;
    try {
      const [data, ev] = await Promise.all([getPet(id), getPetEvents(id)]);
      setPet(data.pet);
      // "While you were away" events first, then the rest (deduplicated).
      const awayIds = new Set(data.awayEvents.map((e) => e.id));
      setEvents([...data.awayEvents, ...ev.filter((e) => !awayIds.has(e.id))]);
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load your pet.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleAction(action: InteractAction) {
    if (!pet || busyAction) return;
    setBusyAction(action);
    try {
      const res = await interactPet(pet.id, action);
      setPet(res.pet);
      setReaction(res.reaction);
      // The server chooses the tactile signature — embodiment, not UI guesswork.
      buzz(isHapticName(res.haptic) ? res.haptic : "tap");
    } catch (err) {
      setReaction(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setBusyAction(null);
    }
  }

  async function handleTalk(e: React.FormEvent) {
    e.preventDefault();
    const msg = talkInput.trim();
    if (!pet || !msg || talking) return;
    setTalking(true);
    buzz("tap");
    try {
      const res = await talkToPet(pet.id, msg);
      setPet(res.pet);
      setReaction(res.reply);
      setTalkInput("");
    } catch (err) {
      setReaction(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setTalking(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[50dvh] flex-col items-center justify-center gap-3">
        <Loader2 size={36} className="animate-spin text-primary" aria-hidden />
        <p className="font-display text-lg font-semibold text-foreground/60">
          Finding your creature…
        </p>
      </div>
    );
  }

  if (error || !pet) {
    return (
      <ClayCard className="text-center">
        <p className="font-display text-xl font-semibold">
          Oh no — your pet wandered off.
        </p>
        <p className="mt-2 text-sm font-semibold text-foreground/60">{error}</p>
        <ClayButton onClick={load} variant="secondary" className="mt-4">
          Try again
        </ClayButton>
      </ClayCard>
    );
  }

  const unseen = events.filter((e) => !e.seen).length;

  return (
    <div className="space-y-6">
      {/* ---------- Creature header ---------- */}
      <ClayCard className="relative overflow-hidden text-center">
        <div className="flex items-start justify-between">
          <Chip className="capitalize">{pet.mood}</Chip>
          <Chip>Lvl {pet.level}</Chip>
        </div>
        <button
          type="button"
          aria-label={`Pet ${pet.name}`}
          onClick={() => {
            buzz("tap");
            setReaction(`${pet.name} leans into your hand.`);
          }}
          className="mx-auto block cursor-pointer rounded-full"
        >
          <div className="animate-float">
            <CreatureCanvas
              appearance={pet.appearance}
              mood={pet.mood}
              width={240}
              height={240}
            />
          </div>
        </button>
        <h1 className="font-display text-3xl font-bold">{pet.name}</h1>
        <p className="text-sm font-bold uppercase tracking-wide text-foreground/55">
          {pet.species}
        </p>
        {pet.activity && (
          <p className="mx-auto mt-2 max-w-xs text-sm font-semibold italic text-foreground/65">
            {pet.activity}
          </p>
        )}
        {reaction && (
          <div className="mx-auto mt-4 max-w-sm">
            <ReactionBubble text={reaction} />
          </div>
        )}
      </ClayCard>

      {/* ---------- Needs ---------- */}
      <ClayCard>
        <SectionTitle className="mb-4 text-xl">
          How {pet.name} feels
        </SectionTitle>
        <NeedsBars needs={pet.needs} />
      </ClayCard>

      {/* ---------- Care actions ---------- */}
      <ClayCard>
        <SectionTitle className="mb-4 text-xl">
          Care for {pet.name}
        </SectionTitle>
        <div className="grid grid-cols-3 gap-3">
          {ACTIONS.map(({ id: action, label, icon: Icon }) => (
            <button
              key={action}
              type="button"
              disabled={busyAction !== null}
              onClick={() => handleAction(action)}
              className="clay-btn flex min-h-[76px] flex-col items-center justify-center gap-1 bg-card px-2 py-3 text-sm font-extrabold text-foreground disabled:opacity-60"
            >
              {busyAction === action ? (
                <Loader2 size={22} className="animate-spin" aria-hidden />
              ) : (
                <Icon size={22} aria-hidden />
              )}
              {label}
            </button>
          ))}
        </div>
      </ClayCard>

      {/* ---------- Talk ---------- */}
      <ClayCard>
        <SectionTitle className="mb-3 text-xl">Talk to {pet.name}</SectionTitle>
        <form onSubmit={handleTalk} className="flex gap-2">
          <input
            value={talkInput}
            onChange={(e) => setTalkInput(e.target.value)}
            placeholder={`Say hi to ${pet.name}…`}
            maxLength={280}
            aria-label={`Message for ${pet.name}`}
            className="clay-input min-h-[44px] flex-1 p-3 text-base font-medium text-foreground placeholder:text-foreground/35"
          />
          <button
            type="submit"
            disabled={talking || !talkInput.trim()}
            aria-label="Send message"
            className="clay-btn flex h-[52px] w-[52px] shrink-0 items-center justify-center bg-primary text-on-primary disabled:opacity-60"
          >
            {talking ? (
              <Loader2 size={22} className="animate-spin" aria-hidden />
            ) : (
              <Send size={22} aria-hidden />
            )}
          </button>
        </form>
      </ClayCard>

      {/* ---------- AR teaser ---------- */}
      <Link href={`/pets/${pet.id}/ar`} className="block">
        <ClayCard
          className="flex items-center gap-4 bg-primary p-5"
          style={{ borderColor: "#fdba74" }}
        >
          <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border-[3px] border-on-primary/15 bg-card/90 text-primary">
            <ScanFace size={28} aria-hidden />
          </span>
          <span>
            <span className="font-display block text-xl font-bold text-on-primary">
              Visit {pet.name} in your world
            </span>
            <span className="block text-sm font-bold text-on-primary/75">
              AR placement · haptics · physical play
            </span>
          </span>
        </ClayCard>
      </Link>

      {/* ---------- While you were away ---------- */}
      <ClayCard>
        <div className="mb-4 flex items-center justify-between">
          <SectionTitle className="text-xl">While you were away…</SectionTitle>
          {unseen > 0 && <Chip>{unseen} new</Chip>}
        </div>
        <EventFeed events={events} />
      </ClayCard>
    </div>
  );
}
