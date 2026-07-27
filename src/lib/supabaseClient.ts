import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

/**
 * Null until VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY are set (see
 * .env.example). Until then, useOwnership() falls back to in-memory state so
 * the app is fully click-through-able without a backend.
 */
export const supabase: SupabaseClient | null =
  url && anonKey ? createClient(url, anonKey) : null;

export const isSupabaseConfigured = supabase !== null;
