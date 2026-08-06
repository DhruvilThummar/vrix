import { createClient, SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Create Supabase client if credentials are configured, else export safe fallback dummy client
export const supabase: SupabaseClient =
  supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
          persistSession: typeof window !== "undefined",
          autoRefreshToken: typeof window !== "undefined",
          detectSessionInUrl: typeof window !== "undefined",
          storageKey: "vrix-supabase-auth-token",
        },
      })
    : ({
        auth: {
          getSession: async () => ({ data: { session: null }, error: null }),
          onAuthStateChange: () => ({
            data: { subscription: { unsubscribe: () => {} } },
          }),
          signOut: async () => ({ error: null }),
          signInWithOAuth: async () => ({ error: new Error("Supabase credentials not configured.") }),
        },
      } as unknown as SupabaseClient);



