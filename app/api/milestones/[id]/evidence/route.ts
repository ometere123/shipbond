import { NextRequest, NextResponse } from "next/server";
import { getSessionWallet } from "@/lib/get-session-wallet";
import { getMilestone, updateMilestoneStatus } from "@/lib/data/milestones";
import { getSubmissionByMilestone, updateSubmissionStatus } from "@/lib/data/submissions";
import { adminDb } from "@/lib/supabase-admin";
import {
  evidencePacketToJson,
  hashEvidenceServer,
  normalizeEvidencePacket,
  stableEvidenceJson,
  type EvidencePacket,
} from "@/lib/evidence-packet";
import { writeAudit } from "@/lib/data/audit";

export const runtime = "nodejs";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSessionWallet(req);
  const wallet = session.walletAddress.toLowerCase();
  const { id } = await params;
  const body = await req.json().catch(() => ({})) as {
    tx_hash?: string;
    evidence?: Partial<EvidencePacket>;
    evidence_digest?: string;
  };

  if (!body.tx_hash) return NextResponse.json({ error: "Missing tx_hash" }, { status: 400 });
  if (!body.evidence) return NextResponse.json({ error: "Missing evidence packet" }, { status: 400 });

  const milestone = await getMilestone(id);
  if (!milestone) return NextResponse.json({ error: "Milestone not found" }, { status: 404 });
  if (milestone.status !== "accepted") {
    return NextResponse.json({ error: "Milestone is not ready for evidence" }, { status: 409 });
  }

  const submission = await getSubmissionByMilestone(id);
  if (!submission) return NextResponse.json({ error: "Submission not found" }, { status: 404 });
  if (submission.builder_wallet.toLowerCase() !== wallet) {
    return NextResponse.json({ error: "Only the accepted builder can submit evidence" }, { status: 403 });
  }

  let packet: EvidencePacket;
  let digest: string;
  try {
    packet = normalizeEvidencePacket(body.evidence);
    digest = await hashEvidenceServer(packet);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Invalid evidence packet";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  if (body.evidence_digest && body.evidence_digest !== digest) {
    return NextResponse.json({ error: "Evidence digest does not match payload" }, { status: 400 });
  }

  await updateSubmissionStatus(submission.id, "evidence_submitted", {
    evidence_refs: evidencePacketToJson(packet),
    evidence_digest: digest,
    submit_tx_hash: body.tx_hash,
  });
  await updateMilestoneStatus(id, "submitted");
  await writeAudit(wallet, "submit_evidence", `submission:${submission.id}`, req.headers.get("x-forwarded-for") ?? undefined);

  return NextResponse.json({
    ok: true,
    evidence_digest: digest,
    evidence_refs_json: stableEvidenceJson(packet),
  });
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSessionWallet(req);
  const wallet = session.walletAddress.toLowerCase();
  const { id } = await params;

  const [milestone, submission] = await Promise.all([
    getMilestone(id),
    getSubmissionByMilestone(id),
  ]);
  if (!milestone) return NextResponse.json({ error: "Milestone not found" }, { status: 404 });
  if (!submission) return NextResponse.json({ error: "Submission not found" }, { status: 404 });

  const isSponsor = milestone.sponsor_wallet.toLowerCase() === wallet;
  const isBuilder = submission.builder_wallet.toLowerCase() === wallet;
  if (!isSponsor && !isBuilder) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await writeAudit(wallet, "view_evidence", `submission:${submission.id}`, req.headers.get("x-forwarded-for") ?? undefined);

  const { data: files } = await adminDb
    .from("evidence_files")
    .select("*")
    .eq("submission_id", submission.id)
    .order("created_at", { ascending: true });

  return NextResponse.json({ submission, files: files ?? [] });
}
