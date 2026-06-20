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
