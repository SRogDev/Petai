import { createBrowserClient } from "@supabase/ssr";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/** True when Supabase env vars are present. False => the app runs in DEMO MODE. */
export function isSupabaseConfigured(): boolean {
  return Boolean(url && anonKey);
}

/**
 * Browser Supabase client. Returns null in DEMO MODE (env vars unset)
 * so pages can render a friendly "connect Supabase" state instead of crashing.
 */
export function createClient() {
  if (!isSupabaseConfigured()) return null;
  return createBrowserClient(url as string, anonKey as string);
}
