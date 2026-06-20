// SERVER-ONLY — GenLayer verdict records, mirrored from on-chain
import { adminDb } from "@/lib/supabase-admin";
import type { Database, Verdict, BondAction } from "@/types/supabase";

type Review = Database["public"]["Tables"]["reviews"]["Row"];

export async function upsertReview(
  submissionId: string,
  data: {
    request_tx_hash?: string;
    verdict?: Verdict;
    bond_action?: BondAction;
    reasoning_summary?: string;
    validator_count?: number;
    consensus_reached?: boolean;
    result_tx_hash?: string;
    synced_at?: string;
  }
): Promise<Review> {
  const { data: existing } = await adminDb
    .from("reviews")
    .select("id")
    .eq("submission_id", submissionId)
    .maybeSingle();

  if (existing) {
    const { data: updated, error } = await adminDb
      .from("reviews")
      .update({ ...data, updated_at: new Date().toISOString() })
      .eq("id", existing.id)
      .select()
      .single();
    if (error || !updated) throw new Error(`Failed to update review: ${error?.message}`);
    return updated;
  }

  const { data: created, error } = await adminDb
    .from("reviews")
    .insert({ submission_id: submissionId, ...data })
    .select()
    .single();
  if (error || !created) throw new Error(`Failed to create review: ${error?.message}`);
  return created;
}

export async function getReviewForSubmission(submissionId: string): Promise<Review | null> {
  const { data } = await adminDb
    .from("reviews")
    .select("*")
    .eq("submission_id", submissionId)
    .maybeSingle();
  return data ?? null;
}

export async function listReviews(): Promise<Review[]> {
  const { data } = await adminDb
    .from("reviews")
    .select("*")
    .order("created_at", { ascending: false });
  return data ?? [];
}

export interface VerdictRow {
  review: Review;
  submissionId: string;
  milestoneId: string;
  milestoneTitle: string;
  rewardWei: string;
  bondWei: string;
  onChainId: string | null;
  builderWallet: string;
  role: "builder" | "sponsor";
}

export async function listVerdictsAsBuilder(builderWallet: string): Promise<VerdictRow[]> {
  const wallet = builderWallet.toLowerCase();
  const { data: subs } = await adminDb
    .from("submissions")
    .select("id, milestone_id, builder_wallet")
    .eq("builder_wallet", wallet);
  if (!subs?.length) return [];

  const subIds = subs.map((s) => s.id);
  const milestoneIds = [...new Set(subs.map((s) => s.milestone_id))];
  const [{ data: reviews }, { data: milestones }] = await Promise.all([
    adminDb.from("reviews").select("*").in("submission_id", subIds).order("created_at", { ascending: false }),
    adminDb.from("milestones").select("id, title, reward_wei, bond_wei, on_chain_id").in("id", milestoneIds),
  ]);

  const subMap = new Map(subs.map((s) => [s.id, s]));
  const msMap = new Map(milestones?.map((m) => [m.id, m]) ?? []);

  return (reviews ?? []).flatMap((r) => {
    const sub = subMap.get(r.submission_id);
    const ms = sub ? msMap.get(sub.milestone_id) : undefined;
    if (!sub || !ms) return [];
    return [{ review: r, submissionId: sub.id, milestoneId: ms.id, milestoneTitle: ms.title, rewardWei: ms.reward_wei, bondWei: ms.bond_wei, onChainId: ms.on_chain_id ?? null, builderWallet: sub.builder_wallet, role: "builder" as const }];
  });
}

export async function listVerdictsAsSponsor(sponsorWallet: string): Promise<VerdictRow[]> {
  const wallet = sponsorWallet.toLowerCase();
  const { data: milestones } = await adminDb
    .from("milestones")
    .select("id, title, reward_wei, bond_wei, on_chain_id")
    .eq("sponsor_wallet", wallet);
  if (!milestones?.length) return [];

  const milestoneIds = milestones.map((m) => m.id);
  const { data: subs } = await adminDb
    .from("submissions")
    .select("id, milestone_id, builder_wallet")
    .in("milestone_id", milestoneIds);
  if (!subs?.length) return [];

  const subIds = subs.map((s) => s.id);
  const { data: reviews } = await adminDb
    .from("reviews")
    .select("*")
    .in("submission_id", subIds)
    .order("created_at", { ascending: false });

  const subMap = new Map(subs.map((s) => [s.id, s]));
  const msMap = new Map(milestones.map((m) => [m.id, m]));

  return (reviews ?? []).flatMap((r) => {
    const sub = subMap.get(r.submission_id);
    const ms = sub ? msMap.get(sub.milestone_id) : undefined;
    if (!sub || !ms) return [];
    return [{ review: r, submissionId: sub.id, milestoneId: ms.id, milestoneTitle: ms.title, rewardWei: ms.reward_wei, bondWei: ms.bond_wei, onChainId: ms.on_chain_id ?? null, builderWallet: sub.builder_wallet, role: "sponsor" as const }];
  });
}
