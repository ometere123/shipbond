// SERVER-ONLY — ownership checks are PRIMARY; RLS is defense-in-depth
import { adminDb } from "@/lib/supabase-admin";
import type { Database, SubmissionStatus } from "@/types/supabase";

type Submission = Database["public"]["Tables"]["submissions"]["Row"];
type SubmissionInsert = Database["public"]["Tables"]["submissions"]["Insert"];

/** Creates the initial submission record when builder locks their bond */
export async function createSubmission(
  builderWallet: string,
  data: Omit<SubmissionInsert, "builder_wallet">
): Promise<Submission> {
  const { data: row, error } = await adminDb
    .from("submissions")
    .insert({ ...data, builder_wallet: builderWallet.toLowerCase(), status: "bonded" })
    .select()
    .single();
  if (error || !row) throw new Error(`Failed to create submission: ${error?.message}`);
  return row;
}

export async function getSubmission(id: string): Promise<Submission | null> {
  const { data } = await adminDb.from("submissions").select("*").eq("id", id).maybeSingle();
  return data ?? null;
}

export async function getSubmissionByMilestone(milestoneId: string): Promise<Submission | null> {
  const { data } = await adminDb
    .from("submissions")
    .select("*")
    .eq("milestone_id", milestoneId)
    .maybeSingle();
  return data ?? null;
}

export async function listBuilderSubmissions(builderWallet: string): Promise<Submission[]> {
  const { data } = await adminDb
    .from("submissions")
    .select("*")
    .eq("builder_wallet", builderWallet.toLowerCase())
    .order("created_at", { ascending: false });
  return data ?? [];
}

export async function listAllSubmissions(): Promise<Submission[]> {
  const { data } = await adminDb
    .from("submissions")
    .select("*")
    .order("created_at", { ascending: false });
  return data ?? [];
}

/** Builder reads their own submission */
export async function getSubmissionAsBuilder(
  id: string,
  builderWallet: string
): Promise<Submission> {
  const row = await getSubmission(id);
  if (!row) throw notFound("Submission");
  if (row.builder_wallet !== builderWallet.toLowerCase()) throw forbidden("Submission");
  return row;
}

/** Sponsor reads the submission for their milestone */
export async function getSubmissionAsSponsor(
  milestoneId: string,
  sponsorWallet: string
): Promise<Submission | null> {
  // Verify milestone belongs to sponsor first
  const { data: milestone } = await adminDb
    .from("milestones")
    .select("id, sponsor_wallet")
    .eq("id", milestoneId)
    .maybeSingle();
  if (!milestone) throw notFound("Milestone");
  if (milestone.sponsor_wallet !== sponsorWallet.toLowerCase()) throw forbidden("Milestone");

  return getSubmissionByMilestone(milestoneId);
}

export async function updateSubmissionStatus(
  id: string,
  status: SubmissionStatus,
  extra?: Database["public"]["Tables"]["submissions"]["Update"]
): Promise<void> {
  const { error } = await adminDb
    .from("submissions")
    .update({ status, updated_at: new Date().toISOString(), ...extra })
    .eq("id", id);
  if (error) throw new Error(`Failed to update submission: ${error.message}`);
}

function notFound(entity: string) {
  return Object.assign(new Error(`${entity} not found`), { code: "NOT_FOUND" });
}
function forbidden(entity: string) {
  return Object.assign(new Error(`Not authorized to access ${entity}`), { code: "FORBIDDEN" });
}
