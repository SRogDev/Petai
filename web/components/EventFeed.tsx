"use client";

import { Sparkles } from "lucide-react";
import type { PetEvent } from "../lib/api";
import { cn } from "../lib/cn";

function timeAgo(iso: string): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "";
  const mins = Math.max(0, Math.round((Date.now() - then) / 60000));
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  return `${days}d ago`;
}

export function EventFeed({ events }: { events: PetEvent[] }) {
  if (events.length === 0) {
    return (
      <p className="text-sm font-semibold text-foreground/60">
        Nothing has happened yet — your creature's story starts the moment you
        adopt it.
      </p>
    );
  }
  return (
    <ol className="relative space-y-4 border-l-[3px] border-border pl-5">
      {events.map((ev) => (
        <li key={ev.id} className="relative">
          <span
            aria-hidden
            className="absolute -left-[31px] top-1 h-4 w-4 rounded-full border-[3px] border-border bg-primary"
          />
          <div className="flex flex-wrap items-center gap-2">
            <h4 className="font-display text-base font-semibold text-foreground">
              {ev.title}
            </h4>
            {!ev.seen && (
              <span className="inline-flex items-center gap-1 rounded-full bg-primary px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wide text-on-primary">
                <Sparkles size={10} aria-hidden /> New
              </span>
            )}
          </div>
          <p className="mt-0.5 text-sm font-medium text-foreground/75">
            {ev.body}
          </p>
          <p className={cn("mt-1 text-xs font-bold text-foreground/50")}>
            {timeAgo(ev.created_at)}
          </p>
        </li>
      ))}
    </ol>
  );
}
