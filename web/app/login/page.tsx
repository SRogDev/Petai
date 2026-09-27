"use client";

import { FlaskConical, Loader2, Mail, PawPrint } from "lucide-react";
import { useState } from "react";
import { ClayButton, ClayCard, SectionTitle } from "../../components/ui";
import {
  createClient,
  isSupabaseConfigured,
} from "../../utils/supabase/client";

export const dynamic = "force-dynamic";

/**
 * Email magic-link login. In DEMO MODE (Supabase not configured) this page
 * explains the situation instead of crashing — the app works fully
 * against the FastAPI backend meanwhile.
 */
export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">(
    "idle",
  );
  const [error, setError] = useState("");

  if (!isSupabaseConfigured()) {
    return (
      <div className="mx-auto max-w-md">
        <ClayCard className="space-y-4 text-center">
          <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl border-[3px] border-border bg-amber-100 text-amber-600">
            <FlaskConical size={30} aria-hidden />
          </span>
          <SectionTitle>Accounts are not set up yet</SectionTitle>
          <p className="text-sm font-semibold text-foreground/65">
            Petai is running in <strong>demo mode</strong>: Supabase isn’t
            connected, so there are no accounts right now. Everything else —
            creating creatures, caring for them, AR — works against the Petai
            backend.
          </p>
          <p className="text-sm font-semibold text-foreground/65">
            To enable login, create a Supabase project, apply{" "}
            <code className="rounded bg-muted px-1.5 py-0.5 text-xs font-bold">
              supabase/db.sql
            </code>
            , and set{" "}
            <code className="rounded bg-muted px-1.5 py-0.5 text-xs font-bold">
              NEXT_PUBLIC_SUPABASE_URL
            </code>{" "}
            and{" "}
            <code className="rounded bg-muted px-1.5 py-0.5 text-xs font-bold">
              NEXT_PUBLIC_SUPABASE_ANON_KEY
            </code>
            .
          </p>
        </ClayCard>
      </div>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const supabase = createClient();
    if (!supabase || !email.trim()) return;
    setStatus("sending");
    setError("");
    const { error: otpError } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: `${window.location.origin}/` },
    });
    if (otpError) {
      setError(otpError.message);
      setStatus("error");
    } else {
      setStatus("sent");
    }
  }

  return (
    <div className="mx-auto max-w-md">
      <ClayCard className="space-y-4 text-center">
        <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl border-[3px] border-border bg-primary/15 text-primary">
          <PawPrint size={30} aria-hidden />
        </span>
        <SectionTitle>Welcome back</SectionTitle>
        <p className="text-sm font-semibold text-foreground/65">
          Enter your email and we’ll send you a magic link. No passwords — your
          creatures wouldn’t remember them anyway.
        </p>
        {status === "sent" ? (
          <div className="rounded-2xl border-[3px] border-emerald-200 bg-emerald-50 p-4">
            <p className="flex items-center justify-center gap-2 text-sm font-extrabold text-emerald-700">
              <Mail size={18} aria-hidden /> Check your inbox!
            </p>
            <p className="mt-1 text-sm font-semibold text-emerald-700/80">
              Tap the magic link to meet your creatures again.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              aria-label="Email address"
              className="clay-input min-h-[52px] w-full p-4 text-base font-medium text-foreground placeholder:text-foreground/35"
            />
            <ClayButton
              type="submit"
              disabled={status === "sending"}
              className="w-full"
            >
              {status === "sending" ? (
                <>
                  <Loader2 size={20} className="animate-spin" aria-hidden />{" "}
                  Sending…
                </>
              ) : (
                <>
                  <Mail size={20} aria-hidden /> Send magic link
                </>
              )}
            </ClayButton>
            {status === "error" && (
              <p
                role="alert"
                className="rounded-2xl border-[3px] border-red-200 bg-red-50 p-3 text-sm font-bold text-red-600"
              >
                {error}
              </p>
            )}
          </form>
        )}
      </ClayCard>
    </div>
  );
}
