// SERVER-ONLY
import { adminDb } from "@/lib/supabase-admin";
import type { Database } from "@/types/supabase";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];

export async function getOrCreateProfile(wallet: string): Promise<Profile> {
  const lc = wallet.toLowerCase();

  const { data: existing } = await adminDb
    .from("profiles")
    .select("*")
    .eq("wallet", lc)
    .maybeSingle();

  if (existing) return existing;

  const { data, error } = await adminDb
    .from("profiles")
    .insert({ wallet: lc })
    .select()
    .single();

  if (error || !data) throw new Error(`Failed to create profile: ${error?.message}`);
  return data;
}

export async function getProfile(wallet: string): Promise<Profile | null> {
  const { data } = await adminDb
    .from("profiles")
    .select("*")
    .eq("wallet", wallet.toLowerCase())
    .maybeSingle();
  return data ?? null;
}

export async function updateProfile(
  wallet: string,
  updates: { display_name?: string }
): Promise<Profile> {
  const { data, error } = await adminDb
    .from("profiles")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("wallet", wallet.toLowerCase())
    .select()
    .single();
  if (error || !data) throw new Error(`Failed to update profile: ${error?.message}`);
  return data;
}
