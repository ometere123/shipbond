import { NextRequest, NextResponse } from "next/server";
import { getSessionWallet } from "@/lib/get-session-wallet";
import { getMilestone, updateMilestoneStatus } from "@/lib/data/milestones";
import { getSubmissionByMilestone, updateSubmissionStatus } from "@/lib/data/submissions";
import { upsertReview } from "@/lib/data/reviews";
import { writeAudit } from "@/lib/data/audit";

export const runtime = "nodejs";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSessionWallet(req);
  const wallet = session.walletAddress.toLowerCase();
  const { id } = await params;
  const body = await req.json().catch(() => ({})) as { tx_hash?: string };

  if (!body.tx_hash) return NextResponse.json({ error: "Missing tx_hash" }, { status: 400 });

  const [milestone, submission] = await Promise.all([
    getMilestone(id),
    getSubmissionByMilestone(id),
  ]);
  if (!milestone) return NextResponse.json({ error: "Milestone not found" }, { status: 404 });
  if (!submission) return NextResponse.json({ error: "Submission not found" }, { status: 404 });

  const isSponsor = milestone.sponsor_wallet.toLowerCase() === wallet;
  const isBuilder = submission.builder_wallet.toLowerCase() === wallet;
  if (!isSponsor && !isBuilder) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  if (milestone.status !== "submitted") {
    return NextResponse.json({ error: "Evidence must be submitted first" }, { status: 409 });
  }

  await updateSubmissionStatus(submission.id, "review_requested");
  await updateMilestoneStatus(id, "reviewing");
  const review = await upsertReview(submission.id, {
    request_tx_hash: body.tx_hash,
    consensus_reached: false,
  });
  await writeAudit(wallet, "request_review", `milestone:${id}`, req.headers.get("x-forwarded-for") ?? undefined);

  return NextResponse.json({ ok: true, review });
}
