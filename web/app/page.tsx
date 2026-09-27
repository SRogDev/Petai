import { Check, MoonStar, ScanFace, Users, Wand2, X } from "lucide-react";
import Link from "next/link";
import { CreatureCanvas } from "../components/CreatureCanvas";
import { PetList } from "../components/PetList";
import { Chip, ClayButton, SectionTitle } from "../components/ui";
import type { Appearance } from "../lib/api";

export const metadata = {
  title: "Petai — A living digital creature that belongs to you",
};

const HERO_CREATURE: Appearance = {
  body_shape: "dragon",
  base_color: "#7dd3fc",
  belly_color: "#fef3c7",
  accent_color: "#f97316",
  eye_style: "big_round",
  size: "small",
  features: ["wings", "horns", "tail"],
  accessories: ["scarf"],
  visual_style: "clay",
};

const FEATURES = [
  {
    icon: Wand2,
    title: "Create any creature",
    body: "Describe it in words — a tiny blue dragon that thinks it's a cat. AI generates its look, personality, needs and backstory.",
  },
  {
    icon: MoonStar,
    title: "Alive between sessions",
    body: "Close the app and life goes on. Come back to surprises: new hobbies, little videos, stories from its day.",
  },
  {
    icon: Users,
    title: "Meets other pets",
    body: "Creatures form real relationships — friendships, rivalries, play dates. Mochi really likes Luna. Luna is not so sure about your dragon.",
  },
  {
    icon: ScanFace,
    title: "Lives in your world",
    body: "Place your creature in your room with AR. It walks on your furniture, naps on your couch, follows you around.",
  },
];

const WILL_DO = [
  "Play games and get obsessed with them",
  "Make little videos just for you",
  "Miss you when you're gone",
  "Discover new hobbies on its own",
  "Befriend (or distrust) other pets",
];

const WILL_NEVER = [
  "Manage your calendar",
  "Summarize your work emails",
  "Organize your tasks",
  "Act as a productivity agent",
];

export default function LandingPage() {
  return (
    <div className="space-y-14">
      {/* ---------- HERO ---------- */}
      <section className="clay-card relative overflow-hidden p-8 text-center">
        <div
          aria-hidden
          className="pointer-events-none absolute -left-10 -top-10 h-40 w-40 rounded-full bg-secondary/30 blur-2xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-12 -right-8 h-44 w-44 rounded-full bg-primary/20 blur-2xl"
        />
        <div className="relative">
          <div className="flex justify-center">
            <div className="animate-float">
              <CreatureCanvas
                appearance={HERO_CREATURE}
                mood="happy"
                width={220}
                height={220}
              />
            </div>
          </div>
          <h1 className="font-display mx-auto mt-2 max-w-md text-4xl font-bold leading-tight">
            A living digital creature that{" "}
            <span className="text-primary">belongs to you</span>
          </h1>
          <p className="mx-auto mt-4 max-w-md text-base font-semibold text-foreground/70">
            Imagine any creature. Raise it. Play with it. And discover the life
            it lives when you're not looking.
          </p>
          <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link href="/create">
              <ClayButton>
                <Wand2 size={20} aria-hidden /> Create your creature
              </ClayButton>
            </Link>
            <Link href="/gallery">
              <ClayButton variant="secondary">See what pets do</ClayButton>
            </Link>
          </div>
        </div>
      </section>

      {/* ---------- NOT AN ASSISTANT ---------- */}
      <section className="space-y-4">
        <SectionTitle className="text-center">
          Not an assistant. A companion.
        </SectionTitle>
        <p className="mx-auto max-w-md text-center text-sm font-semibold text-foreground/65">
          Petai will never try to be productive for you. Its only job is to be
          alive — and to be yours.
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="clay-card-flat p-5">
            <h3 className="font-display mb-3 text-lg font-semibold text-emerald-700">
              Your creature will
            </h3>
            <ul className="space-y-2.5">
              {WILL_DO.map((item) => (
                <li
                  key={item}
                  className="flex items-start gap-2 text-sm font-semibold text-foreground/80"
                >
                  <Check
                    size={18}
                    className="mt-0.5 shrink-0 text-emerald-600"
                    aria-hidden
                  />
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div className="clay-card-flat p-5">
            <h3 className="font-display mb-3 text-lg font-semibold text-red-500">
              Your creature will never
            </h3>
            <ul className="space-y-2.5">
              {WILL_NEVER.map((item) => (
                <li
                  key={item}
                  className="flex items-start gap-2 text-sm font-semibold text-foreground/80"
                >
                  <X
                    size={18}
                    className="mt-0.5 shrink-0 text-red-400"
                    aria-hidden
                  />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ---------- FEATURES ---------- */}
      <section className="space-y-4">
        <SectionTitle className="text-center">Why it feels alive</SectionTitle>
        <div className="grid gap-4 sm:grid-cols-2">
          {FEATURES.map(({ icon: Icon, title, body }) => (
            <article key={title} className="clay-card-flat p-5">
              <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl border-[3px] border-border bg-primary/15 text-primary">
                <Icon size={24} aria-hidden />
              </span>
              <h3 className="font-display mt-3 text-lg font-semibold">
                {title}
              </h3>
              <p className="mt-1 text-sm font-medium text-foreground/70">
                {body}
              </p>
            </article>
          ))}
        </div>
      </section>

      {/* ---------- YOUR COMPANIONS ---------- */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <SectionTitle>Your companions</SectionTitle>
          <Chip>Beta</Chip>
        </div>
        <PetList />
      </section>

      {/* ---------- CTA ---------- */}
      <section
        className="clay-card bg-primary p-8 text-center"
        style={{ borderColor: "#fdba74" }}
      >
        <h2 className="font-display text-3xl font-bold text-on-primary">
          Your creature is waiting to exist.
        </h2>
        <p className="mx-auto mt-2 max-w-sm text-base font-bold text-on-primary/80">
          One sentence is enough. Describe it, and watch it take its first
          breath.
        </p>
        <Link href="/create" className="mt-6 inline-block">
          <ClayButton
            variant="secondary"
            className="border-on-primary/20 text-lg"
          >
            <Wand2 size={20} aria-hidden /> Start creating
          </ClayButton>
        </Link>
      </section>

      <footer className="pb-4 text-center text-xs font-bold text-foreground/45">
        Petai — raise a creature, not a chatbot.
      </footer>
    </div>
  );
}
