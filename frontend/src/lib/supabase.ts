import { createClient, SupabaseClient } from "@supabase/supabase-js";

// Cloud sync is OPTIONAL. If these env vars are not set, the app runs fully
// local-first (browser storage only) and no auth/sync UI is shown.
//   NEXT_PUBLIC_SUPABASE_URL       e.g. https://xxxx.supabase.co
//   NEXT_PUBLIC_SUPABASE_ANON_KEY  the public anon/publishable key (safe in client; protected by RLS)
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const isCloudConfigured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

let client: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient | null {
  if (!isCloudConfigured) return null;
  if (typeof window === "undefined") return null; // client-side only
  if (!client) {
    client = createClient(SUPABASE_URL as string, SUPABASE_ANON_KEY as string, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    });
  }
  return client;
}
