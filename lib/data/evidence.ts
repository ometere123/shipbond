// SERVER-ONLY — evidence access: builder writes, sponsor reads (no builder-to-builder access)
import { adminDb } from "@/lib/supabase-admin";
import type { Database } from "@/types/supabase";

type EvidenceFile = Database["public"]["Tables"]["evidence_files"]["Row"];

/** Records file metadata after upload. Returns signed URL valid for 1 hour. */
export async function recordEvidenceFile(
  submissionId: string,
  uploaderWallet: string,
  file: {
    file_name: string;
    storage_path: string;
    content_type?: string;
    size_bytes?: number;
  }
): Promise<EvidenceFile> {
  const { data, error } = await adminDb
    .from("evidence_files")
    .insert({
      submission_id: submissionId,
      uploader_wallet: uploaderWallet.toLowerCase(),
      ...file,
    })
    .select()
    .single();
  if (error || !data) throw new Error(`Failed to record evidence: ${error?.message}`);
  return data;
}

/** Builder reads their own evidence files */
export async function getEvidenceFilesAsBuilder(
  submissionId: string,
  builderWallet: string
): Promise<EvidenceFile[]> {
  // First verify this builder owns the submission
  const { data: submission } = await adminDb
    .from("submissions")
    .select("id, builder_wallet")
    .eq("id", submissionId)
    .maybeSingle();
  if (!submission) throw notFound("Submission");
  if (submission.builder_wallet !== builderWallet.toLowerCase()) throw forbidden("Submission");

  const { data } = await adminDb
    .from("evidence_files")
    .select("*")
    .eq("submission_id", submissionId)
    .order("created_at", { ascending: true });
  return data ?? [];
}

/** Sponsor reads evidence for a submission on their milestone */
export async function getEvidenceFilesAsSponsor(
  submissionId: string,
  sponsorWallet: string
): Promise<EvidenceFile[]> {
  // Verify milestone belongs to sponsor
  const { data: submission } = await adminDb
    .from("submissions")
    .select("id, milestone_id")
    .eq("id", submissionId)
    .maybeSingle();
  if (!submission) throw notFound("Submission");

  const { data: milestone } = await adminDb
    .from("milestones")
    .select("id, sponsor_wallet")
    .eq("id", submission.milestone_id)
    .maybeSingle();
  if (!milestone) throw notFound("Milestone");
  if (milestone.sponsor_wallet !== sponsorWallet.toLowerCase()) throw forbidden("Milestone");

  const { data } = await adminDb
    .from("evidence_files")
    .select("*")
    .eq("submission_id", submissionId)
    .order("created_at", { ascending: true });
  return data ?? [];
}

/** Issues a signed URL for a storage path. Only call after ownership check. */
export async function getSignedEvidenceUrl(storagePath: string, expiresInSeconds = 3600): Promise<string> {
  const { data, error } = await adminDb.storage
    .from("shipbond-evidence")
    .createSignedUrl(storagePath, expiresInSeconds);
  if (error || !data) throw new Error(`Failed to create signed URL: ${error?.message}`);
  return data.signedUrl;
}

function notFound(entity: string) {
  return Object.assign(new Error(`${entity} not found`), { code: "NOT_FOUND" });
}
function forbidden(entity: string) {
  return Object.assign(new Error(`Not authorized to access ${entity}`), { code: "FORBIDDEN" });
}
