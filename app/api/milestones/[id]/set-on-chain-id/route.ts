/**
 * POST /api/milestones/[id]/set-on-chain-id
 *
 * Called by the client after create_milestone tx reaches ACCEPTED status.
 * Client sends only { tx_hash } — on_chain_id is resolved SERVER-SIDE here.
 *
 * Resolution flow:
 *  1. Auth: must be the milestone's sponsor.
 *  2. Read DB milestone to get terms_hash, title, reward_wei, bond_wei.
 *  3. Call resolveCreatedMilestoneId (scans sponsor's chain IDs, matches terms_hash).
 *  4. Verify the resolved ID by reading get_milestone and confirming sponsor + terms_hash.
 *  5. Reject if not found or if verification fails.
 *  6. Store on_chain_id + contract_address in Supabase.
 *
 * Placeholder IDs (e.g. Supabase UUID) are never stored — the route only writes
 * after contract verification succeeds.
 */
import { NextRequest, NextResponse } from "next/server";
import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import { sessionOptions } from "@/lib/session";
import type { SessionData } from "@/lib/session";
import { getMilestone } from "@/lib/data/milestones";
import { resolveCreatedMilestoneId } from "@/lib/genlayer/resolve-milestone-id";
import { readMilestone } from "@/lib/genlayer/server-client";
import { SHIPBOND_CONTRACT } from "@/lib/genlayer/bradbury-chain";
import { adminDb } from "@/lib/supabase-admin";
import { writeAudit } from "@/lib/data/audit";

export const runtime = "nodejs";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
  if (!session.walletAddress) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const wallet = session.walletAddress.toLowerCase();

  const { id } = await params;

  const body = await req.json().catch(() => ({})) as { tx_hash?: string };
  if (!body.tx_hash) {
    return NextResponse.json({ error: "Missing tx_hash" }, { status: 400 });
  }

  // Load DB record and verify ownership
  const dbMilestone = await getMilestone(id);
  if (!dbMilestone) {
    return NextResponse.json({ error: "Milestone not found" }, { status: 404 });
  }
  if (dbMilestone.sponsor_wallet.toLowerCase() !== wallet) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (!dbMilestone.terms_hash) {
    return NextResponse.json(
      { error: "Milestone has no terms_hash — cannot resolve on-chain ID" },
      { status: 422 },
    );
  }

  // Resolve the on-chain milestone_id by scanning sponsor's chain IDs
  const onChainId = await resolveCreatedMilestoneId({
    sponsorWallet: wallet,
    termsHash:     dbMilestone.terms_hash,
    title:         dbMilestone.title,
    rewardWei:     dbMilestone.reward_wei,
    bondWei:       dbMilestone.bond_wei,
  });

  if (!onChainId) {
    return NextResponse.json(
      {
        error:  "Could not resolve on-chain milestone ID after retries",
        detail: "The transaction may not yet be visible. Retry in a few seconds.",
      },
      { status: 404 },
    );
  }

  // Final verification: read the contract record and confirm it matches
  let verified = false;
  try {
    const onChainData = await readMilestone(onChainId);
    const sponsorOk    = String(onChainData.sponsor ?? "").toLowerCase() === wallet;
    const termsHashOk  = String(onChainData.terms_hash ?? "") === dbMilestone.terms_hash;
    verified = sponsorOk && termsHashOk;
  } catch {
    // Verification read failed — don't store unverified ID
  }

  if (!verified) {
    return NextResponse.json(
      {
        error:  "on_chain_id verification failed",
        detail: "Contract data did not match expected sponsor and terms_hash.",
      },
      { status: 422 },
    );
  }

  // Store verified on_chain_id and contract address
  const { error: updateError } = await adminDb
    .from("milestones")
    .update({
      on_chain_id:      onChainId,
      contract_address: SHIPBOND_CONTRACT,
      updated_at:       new Date().toISOString(),
    })
    .eq("id", id);

  if (updateError) {
    return NextResponse.json(
      { error: `DB update failed: ${updateError.message}` },
      { status: 500 },
    );
  }

  await writeAudit(
    session.walletAddress,
    "set_on_chain_id",
    `milestone:${id}:on_chain_id:${onChainId}`,
    req.headers.get("x-forwarded-for") ?? undefined,
  );

  return NextResponse.json({ ok: true, on_chain_id: onChainId });
}
