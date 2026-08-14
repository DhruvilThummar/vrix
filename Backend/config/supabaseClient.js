import { createClient } from "@supabase/supabase-js";

// Use service-role key so the backend Supabase client bypasses Row Level Security.
// This is safe — database/server code is server-only, never sent to the browser.
const supabaseUrl = process.env.SUPABASE_URL || "https://snvifoikeixkgrdkgyme.supabase.co";
const hasServiceRoleKey = Boolean(process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY);
const supabaseServiceKey =
  process.env.SUPABASE_SECRET_KEY ||
  process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!hasServiceRoleKey) {
  console.warn("⚠️ [SECURITY WARNING] SUPABASE_SERVICE_ROLE_KEY / SUPABASE_SECRET_KEY is missing in server environment. Backend Supabase fallback will operate under anon key (RLS restricted).");
}

export const supabase = (supabaseUrl && (supabaseServiceKey || process.env.SUPABASE_ANON_KEY))
  ? createClient(supabaseUrl, supabaseServiceKey || process.env.SUPABASE_ANON_KEY, { auth: { persistSession: false } })
  : null;
