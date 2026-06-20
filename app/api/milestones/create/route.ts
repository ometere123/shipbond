/**
 * POST /api/milestones/create
 *
 * Flow:
 *  1. Auth + validation
 *  2. Convert GEN → wei; sanitize text
 *  3. Create Supabase record (no terms_hash yet — we need the DB ID first)
 *  4. Compute terms_hash including local_milestone_id + sponsor_wallet + created_at_iso
 *     so the hash is globally unique and safe for on-chain ID resolution
 *  5. Store terms_hash back on the DB row
 *  6. Return { id, terms_hash, reward_wei, bond_wei, deadline_ts } to client
 *
 * The client uses the returned terms_hash directly when calling create_milestone
 * on the GenLayer contract — no client-side hash recomputation needed.
 */
import { NextRequest, NextResponse } from "next/server";
import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import { sessionOptions } from "@/lib/session";
import type { SessionData } from "@/lib/session";
import { adminDb } from "@/lib/supabase-admin";
import { hashTermsServer } from "@/lib/terms-hash";
import { writeAudit } from "@/lib/data/audit";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
  if (!session.walletAddress) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }
  const wallet = session.walletAddress.toLowerCase();

  let body: {
    title?:       string;
    description?: string;
    reward_gen?:  string;
    bond_gen?:    string;
    deadline?:    string | null;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { title, description, reward_gen, bond_gen, deadline } = body;

  if (!title?.trim() || title.trim().length < 5)
    return NextResponse.json({ error: "Title must be at least 5 characters" }, { status: 400 });
  if (!description?.trim() || description.trim().length < 20)
    return NextResponse.json({ error: "Description must be at least 20 characters" }, { status: 400 });
  if (!reward_gen || isNaN(Number(reward_gen)) || Number(reward_gen) <= 0)
    return NextResponse.json({ error: "Reward must be a positive number" }, { status: 400 });
  if (!bond_gen || isNaN(Number(bond_gen)) || Number(bond_gen) <= 0)
    return NextResponse.json({ error: "Bond must be a positive number" }, { status: 400 });
  if (deadline && isNaN(Date.parse(deadline)))
    return NextResponse.json({ error: "Invalid deadline date" }, { status: 400 });

  // GEN → wei (avoid floating-point drift)
  const rewardWei = (BigInt(Math.round(Number(reward_gen) * 1e9)) * BigInt(1e9)).toString();
  const bondWei   = (BigInt(Math.round(Number(bond_gen)   * 1e9)) * BigInt(1e9)).toString();

  // Unix timestamp for contract (0 = no deadline)
  const deadlineTs = deadline
    ? Math.floor(new Date(deadline).getTime() / 1000).toString()
    : "0";

  // Sanitize: strip LLM prompt-injection patterns
  const safeTitle = sanitizeText(title.trim());
  const safeDesc  = sanitizeText(description.trim());

  // Pre-generate the UUID so it can be embedded in the terms_hash before insert.
  // terms_hash is NOT NULL in DB — must compute before writing the row.
  const { randomUUID } = await import("crypto");
  const milestoneId    = randomUUID();
  const createdAtIso   = new Date().toISOString();

  // Compute terms_hash with the pre-generated ID — makes it globally unique
  const termsHash = await hashTermsServer({
    title:              safeTitle,
    description:        safeDesc,
    reward_wei:         rewardWei,
    bond_wei:           bondWei,
    deadline:           deadline ? new Date(deadline).toISOString() : null,
    local_milestone_id: milestoneId,
    sponsor_wallet:     wallet,
    created_at_iso:     createdAtIso,
  });

  // Insert everything in one shot — no two-step update needed
  const { data: row, error: insertError } = await adminDb
    .from("milestones")
    .insert({
      id:             milestoneId,
      sponsor_wallet: wallet,
      title:          safeTitle,
      description:    safeDesc,
      terms_hash:     termsHash,
      reward_wei:     rewardWei,
      bond_wei:       bondWei,
      deadline:       deadline ? new Date(deadline).toISOString() : null,
      status:         "open",
      created_at:     createdAtIso,
    })
    .select()
    .single();

  if (insertError || !row) {
    return NextResponse.json(
      { error: `Failed to create milestone: ${insertError?.message}` },
      { status: 500 },
    );
  }

  writeAudit(
    wallet,
    "create_milestone",
    `milestone:${milestoneId}`,
    req.headers.get("x-forwarded-for") ?? undefined,
  );

  return NextResponse.json({
    id:          milestoneId,
    terms_hash:  termsHash,
    reward_wei:  rewardWei,
    bond_wei:    bondWei,
    deadline_ts: deadlineTs,
  });
}

function sanitizeText(text: string): string {
  return text
    .replace(/ignore\s+(all\s+)?(previous|prior|above)\s+instructions?/gi, "[removed]")
    .replace(/system\s*prompt/gi, "[removed]")
    .replace(/you\s+are\s+(now\s+)?a/gi, "[removed]")
    .trim();
}
