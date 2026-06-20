import { NextRequest, NextResponse } from "next/server";
import { getSessionWallet } from "@/lib/get-session-wallet";
import { getMilestone, updateMilestoneStatus } from "@/lib/data/milestones";
import { createSubmission, getSubmissionByMilestone } from "@/lib/data/submissions";
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

  if (!body.tx_hash) {
    return NextResponse.json({ error: "Missing tx_hash" }, { status: 400 });
  }

  const milestone = await getMilestone(id);
  if (!milestone) return NextResponse.json({ error: "Milestone not found" }, { status: 404 });
  if (milestone.sponsor_wallet.toLowerCase() === wallet) {
    return NextResponse.json({ error: "Sponsor cannot accept own milestone" }, { status: 403 });
  }
  if (milestone.status !== "open") {
    return NextResponse.json({ error: "Milestone is not open" }, { status: 409 });
  }
  if (!milestone.on_chain_id) {
    return NextResponse.json({ error: "Milestone is not linked on-chain yet" }, { status: 422 });
  }

  const existing = await getSubmissionByMilestone(id);
  if (existing) {
    return NextResponse.json({ error: "Milestone already has a builder" }, { status: 409 });
  }

  const submission = await createSubmission(wallet, {
    milestone_id: id,
    bond_tx_hash: body.tx_hash,
  });
  await updateMilestoneStatus(id, "accepted");
  await writeAudit(wallet, "accept_milestone", `milestone:${id}`, req.headers.get("x-forwarded-for") ?? undefined);

  return NextResponse.json({ ok: true, submission });
}
