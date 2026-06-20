// SERVER-ONLY — all functions enforce ownership before reading/writing
import { adminDb } from "@/lib/supabase-admin";
import type { Database, MilestoneStatus } from "@/types/supabase";

type Milestone = Database["public"]["Tables"]["milestones"]["Row"];
type MilestoneInsert = Database["public"]["Tables"]["milestones"]["Insert"];

export async function createMilestone(
  sponsorWallet: string,
  data: Omit<MilestoneInsert, "sponsor_wallet">
): Promise<Milestone> {
  const { data: row, error } = await adminDb
    .from("milestones")
    .insert({ ...data, sponsor_wallet: sponsorWallet.toLowerCase(), status: "open" })
    .select()
    .single();
  if (error || !row) throw new Error(`Failed to create milestone: ${error?.message}`);
  return row;
}

export async function getMilestone(id: string): Promise<Milestone | null> {
  const { data } = await adminDb.from("milestones").select("*").eq("id", id).maybeSingle();
  return data ?? null;
}

/** Enforces: requestor is the sponsor */
export async function getMilestoneAsSponsor(
  id: string,
  sponsorWallet: string
): Promise<Milestone> {
  const row = await getMilestone(id);
  if (!row) throw notFound("Milestone");
  if (row.sponsor_wallet !== sponsorWallet.toLowerCase()) throw forbidden("Milestone");
  return row;
}

export async function listOpenMilestones(): Promise<Milestone[]> {
  const { data } = await adminDb
    .from("milestones")
    .select("*")
    .in("status", ["open", "accepted"])
    .order("created_at", { ascending: false });
  return data ?? [];
}

export async function listSponsorMilestones(sponsorWallet: string): Promise<Milestone[]> {
  const { data } = await adminDb
    .from("milestones")
    .select("*")
    .eq("sponsor_wallet", sponsorWallet.toLowerCase())
    .order("created_at", { ascending: false });
  return data ?? [];
}

export async function listAllMilestones(): Promise<Milestone[]> {
  const { data } = await adminDb
    .from("milestones")
    .select("*")
    .order("created_at", { ascending: false });
  return data ?? [];
}

export async function updateMilestoneStatus(
  id: string,
  status: MilestoneStatus,
  extra?: Database["public"]["Tables"]["milestones"]["Update"]
): Promise<void> {
  const { error } = await adminDb
    .from("milestones")
    .update({ status, updated_at: new Date().toISOString(), ...extra })
    .eq("id", id);
  if (error) throw new Error(`Failed to update milestone: ${error.message}`);
}

/**
 * Called after create_milestone tx is ACCEPTED on chain.
 * Stores the milestone_id returned by the contract and the funding tx hash.
 */
export async function updateOnChainId(
  id: string,
  onChainId: string,
  contractAddress: string,
  _txHash: string,
): Promise<void> {
  const { error } = await adminDb
    .from("milestones")
    .update({
      on_chain_id:      onChainId,
      contract_address: contractAddress,
      updated_at:       new Date().toISOString(),
    })
    .eq("id", id);
  if (error) throw new Error(`Failed to set on_chain_id: ${error.message}`);
}

// Helpers
function notFound(entity: string) {
  return Object.assign(new Error(`${entity} not found`), { code: "NOT_FOUND" });
}
function forbidden(entity: string) {
  return Object.assign(new Error(`Not authorized to access ${entity}`), { code: "FORBIDDEN" });
}
