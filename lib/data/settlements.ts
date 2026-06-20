// SERVER-ONLY — settlement records written only after GenLayer verdict
import { adminDb } from "@/lib/supabase-admin";
import type { Database } from "@/types/supabase";

type Settlement = Database["public"]["Tables"]["settlements"]["Row"];

export async function recordSettlement(data: {
  milestone_id: string;
  submission_id: string;
  review_id?: string;
  verdict: "passed" | "partial_pass" | "failed";
  bond_action: "return" | "slash" | "hold";
  reward_to_builder?: string;
  bond_returned?: string;
  bond_slashed?: string;
  settle_tx_hash?: string;
  settled_at?: string;
}): Promise<Settlement> {
  const { data: row, error } = await adminDb
    .from("settlements")
    .insert({ ...data, settled_at: data.settled_at ?? new Date().toISOString() })
    .select()
    .single();
  if (error || !row) throw new Error(`Failed to record settlement: ${error?.message}`);
  return row;
}

export async function getSettlementForMilestone(milestoneId: string): Promise<Settlement | null> {
  const { data } = await adminDb
    .from("settlements")
    .select("*")
    .eq("milestone_id", milestoneId)
    .maybeSingle();
  return data ?? null;
}

export async function getSettlement(id: string): Promise<Settlement | null> {
  const { data } = await adminDb
    .from("settlements")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  return data ?? null;
}

export async function listSettlements(): Promise<Settlement[]> {
  const { data } = await adminDb
    .from("settlements")
    .select("*")
    .order("created_at", { ascending: false });
  return data ?? [];
}
