import { createClient } from "@supabase/supabase-js";

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  "https://snvifoikeixkgrdkgyme.supabase.co";

const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNudmlmb2lrZWl4a2dyZGtneW1lIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI5OTA0NjIsImV4cCI6MjA5ODU2NjQ2Mn0.H-mxdmhjHGg0RVF35ifWIvYgGRBS3oMgq08dGE3bbTw";

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storageKey: "vrix-supabase-auth-token",
  },
});
