// SERVER-ONLY — never import from client components or hooks.
// This file must not be prefixed with NEXT_PUBLIC_ and must never reach the browser bundle.
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";

if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  throw new Error("NEXT_PUBLIC_SUPABASE_URL is not set");
}
if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error("SUPABASE_SERVICE_ROLE_KEY is not set");
}

// Service-role client: bypasses RLS, used only in API routes and Server Actions.
export const adminDb = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);
