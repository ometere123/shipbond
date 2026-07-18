/**
 * POST /api/contract/resolve-milestone-id
 *
 * Pure contract read — no database. After create_milestone confirms on-chain,
 * the client calls this to find the real numeric milestone_id by scanning
 * get_sponsor_milestone_ids and matching terms_hash (+ title/reward/bond as
 * a sanity check). See lib/genlayer/resolve-milestone-id.ts.
 */
import { NextRequest, NextResponse } from "next/server";
import { resolveCreatedMilestoneId } from "@/lib/genlayer/resolve-milestone-id";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  let body: {
    sponsorWallet?: string;
    termsHash?:     string;
    title?:         string;
    rewardWei?:     string;
    bondWei?:       string;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { sponsorWallet, termsHash, title, rewardWei, bondWei } = body;
  if (!sponsorWallet || !termsHash || !title || !rewardWei || !bondWei) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const milestoneId = await resolveCreatedMilestoneId({
    sponsorWallet,
    termsHash,
    title,
    rewardWei,
    bondWei,
  });

  if (!milestoneId) {
    return NextResponse.json({ error: "Could not resolve milestone id" }, { status: 404 });
  }

  return NextResponse.json({ milestone_id: milestoneId });
}
