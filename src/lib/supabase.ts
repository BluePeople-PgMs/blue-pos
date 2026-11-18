import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let client: SupabaseClient | null | undefined;

/** Cliente compartido. Null si faltan las variables públicas. */
export function getSupabaseBrowser(): SupabaseClient | null {
  if (client !== undefined) {
    return client;
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim();
  if (!url || !key) {
    client = null;
    return null;
  }

  client = createClient(url, key);
  return client;
}
