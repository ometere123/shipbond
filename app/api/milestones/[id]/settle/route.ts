import { NextRequest, NextResponse } from "next/server";
import { getSessionWallet } from "@/lib/get-session-wallet";
import { getMilestone } from "@/lib/data/milestones";
import { getSubmissionByMilestone, updateSubmissionStatus } from "@/lib/data/submissions";
import { getReviewForSubmission } from "@/lib/data/reviews";
import { getSettlementForMilestone } from "@/lib/data/settlements";
import { adminDb } from "@/lib/supabase-admin";
import { writeAudit } from "@/lib/data/audit";

export const runtime = "nodejs";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSessionWallet(req);
  const wallet = session.walletAddress.toLowerCase();
  const { id } = await params;
  const body = await req.json().catch(() => ({})) as { tx_hash?: string; human?: boolean };

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

  await adminDb.from("milestones").update({ status: "settled", updated_at: new Date().toISOString() }).eq("id", id);
  await updateSubmissionStatus(submission.id, "settled");

  const review = await getReviewForSubmission(submission.id);
  const existing = await getSettlementForMilestone(id);
  const verdict = review?.verdict === "partial_pass" ? "partial_pass" : review?.verdict === "failed" ? "failed" : "passed";
  const bondAction = review?.bond_action ?? "return";
  const reward = BigInt(milestone.reward_wei);
  const bond = BigInt(milestone.bond_wei);
  const payoutBps = verdict === "passed" ? 10000 : verdict === "failed" ? 0 : 5000;
  const rewardToBuilder = (reward * BigInt(payoutBps)) / BigInt(10000);

  if (existing) {
    await adminDb.from("settlements").update({
      settle_tx_hash: body.tx_hash,
      settled_at: new Date().toISOString(),
    }).eq("id", existing.id);
  } else {
    await adminDb.from("settlements").insert({
      milestone_id: id,
      submission_id: submission.id,
      review_id: review?.id ?? null,
      verdict,
      bond_action: bondAction,
      reward_to_builder: verdict === "failed" ? null : String(rewardToBuilder),
      bond_returned: bondAction === "return" ? String(bond) : null,
      bond_slashed: bondAction === "slash" ? String(bond) : null,
      settle_tx_hash: body.tx_hash,
      settled_at: new Date().toISOString(),
    });
  }

  await writeAudit(wallet, "settle", `milestone:${id}`, req.headers.get("x-forwarded-for") ?? undefined);

  return NextResponse.json({ ok: true });
}
