"use client";

import { FlaskConical } from "lucide-react";
import { isSupabaseConfigured } from "../utils/supabase/client";

/**
 * Shown when Supabase env vars are unset. The app keeps working fully
 * against the FastAPI backend — this banner just explains why there
 * are no accounts yet.
 */
export function DemoBanner() {
  if (isSupabaseConfigured()) return null;
  return (
    <div className="border-b-[3px] border-border bg-amber-100 px-4 py-2 text-center">
      <p className="inline-flex items-center gap-2 text-xs font-extrabold uppercase tracking-wide text-amber-800">
        <FlaskConical size={14} aria-hidden />
        Demo mode — connect Supabase to enable accounts
      </p>
    </div>
  );
}
