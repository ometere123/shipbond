/**
 * POST /api/contract/sync-verdict
 *
 * Reads the GenLayer verdict for a milestone and mirrors it to Supabase.
 * GenLayer is the source of truth. Supabase is a read mirror only.
 *
 * Requires a known on_chain_id — does NOT discover it.
 * Call set-on-chain-id first if on_chain_id is not yet stored.
 *
 * Verdict mapping (contract UPPERCASE → DB lowercase):
 *   PASSED             → passed
 *   PARTIAL_PASS       → partial_pass
 *   FAILED             → failed
 *   NEEDS_HUMAN_REVIEW → needs_human_review
 *
 * Bond action mapping:
 *   RETURN → return
 *   SLASH  → slash
 *   HOLD   → hold
 */
import { NextRequest, NextResponse } from "next/server";
import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import { sessionOptions } from "@/lib/session";
import type { SessionData } from "@/lib/session";
import { readVerdict, readMilestone } from "@/lib/genlayer/server-client";
import { adminDb } from "@/lib/supabase-admin";
import {
  contractStatusToDb,
  isReviewed,
  mapContractVerdict,
  mapContractBondAction,
} from "@/lib/genlayer/contract";
import type { ContractStatus } from "@/lib/genlayer/contract";
import { writeAudit } from "@/lib/data/audit";
import { getMilestone } from "@/lib/data/milestones";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
  if (!session.walletAddress) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const wallet = session.walletAddress.toLowerCase();

  const body = await req.json().catch(() => ({})) as { milestoneId?: string };
  if (!body.milestoneId) {
    return NextResponse.json({ error: "Missing milestoneId" }, { status: 400 });
  }
  const { milestoneId } = body;

  // Load DB milestone
  const dbMilestone = await getMilestone(milestoneId);
  if (!dbMilestone) {
    return NextResponse.json({ error: "Milestone not found" }, { status: 404 });
  }

  // Require on_chain_id to be set — this route does not discover it
  if (!dbMilestone.on_chain_id) {
    return NextResponse.json(
      {
        error:  "on_chain_id not set for this milestone",
        detail: "Call set-on-chain-id first.",
      },
      { status: 422 },
    );
  }

  // Verify caller is sponsor or builder
  const { data: submission } = await adminDb
    .from("submissions")
    .select("id, builder_wallet")
    .eq("milestone_id", milestoneId)
    .maybeSingle();

  const isSponsor = dbMilestone.sponsor_wallet.toLowerCase() === wallet;
  const isBuilder = submission?.builder_wallet?.toLowerCase() === wallet;

  if (!isSponsor && !isBuilder) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Read from GenLayer using on_chain_id
  const [onChain, verdict] = await Promise.all([
    readMilestone(dbMilestone.on_chain_id),
    readVerdict(dbMilestone.on_chain_id).catch(() => null),
  ]);

  const contractStatus = (onChain.status as ContractStatus) ?? "OPEN";
  const dbStatus = contractStatusToDb(contractStatus);

  // Update milestone status
  await adminDb
    .from("milestones")
    .update({ status: dbStatus as any, updated_at: new Date().toISOString() })
    .eq("id", milestoneId);

  // Mirror verdict if available and consensus has run
  if (verdict && isReviewed(contractStatus) && submission?.id) {
    const dbVerdict    = mapContractVerdict(verdict.verdict);
    const dbBondAction = mapContractBondAction(verdict.bond_action);

    const { data: existingReview } = await adminDb
      .from("reviews")
      .select("id")
      .eq("submission_id", submission.id)
      .maybeSingle();

    const reviewData = {
      submission_id:    submission.id,
      verdict:          dbVerdict,
      bond_action:      dbBondAction,
      reasoning_summary: verdict.reasoning
        ? String(verdict.reasoning).slice(0, 2000)
        : null,
      consensus_reached: true,
      synced_at:        new Date().toISOString(),
    };

    if (existingReview) {
      await adminDb.from("reviews").update(reviewData).eq("id", existingReview.id);
    } else {
      await adminDb.from("reviews").insert(reviewData);
    }

    // Mirror settlement if the contract has settled
    if (contractStatus === "SETTLED") {
      const rewardWei = BigInt(String(onChain.reward_wei ?? "0"));
      const bondWei   = BigInt(String(onChain.bond_wei   ?? "0"));
      const payoutBps = Number(verdict.recommended_payout_bps ?? 0);

      const builderPayout = (rewardWei * BigInt(payoutBps)) / BigInt(10000);
      const bondReturn    = dbBondAction === "return" ? bondWei : BigInt(0);
      const bondSlashed   = dbBondAction === "slash"  ? bondWei : BigInt(0);

      // Only settled verdicts land in settlements (not needs_human_review)
      if (dbVerdict !== "needs_human_review") {
        const settlementVerdict =
          dbVerdict === "partial_pass" ? "partial_pass" :
          dbVerdict === "passed"       ? "passed"       : "failed";

        const { data: existing } = await adminDb
          .from("settlements")
          .select("id")
          .eq("milestone_id", milestoneId)
          .maybeSingle();

        if (!existing) {
          await adminDb.from("settlements").insert({
            milestone_id:      milestoneId,
            submission_id:     submission.id,
            verdict:           settlementVerdict,
            bond_action:       dbBondAction,
            reward_to_builder: dbVerdict !== "failed" ? String(builderPayout) : null,
            bond_returned:     dbBondAction === "return" ? String(bondReturn)  : null,
            bond_slashed:      dbBondAction === "slash"  ? String(bondSlashed) : null,
            settled_at:        new Date().toISOString(),
          });
        }
      }
    }
  }

  await writeAudit(
    session.walletAddress,
    "sync_verdict",
    milestoneId,
    req.headers.get("x-forwarded-for") ?? undefined,
  );

  return NextResponse.json({ status: dbStatus, verdict: verdict ?? null });
}
