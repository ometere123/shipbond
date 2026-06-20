import { NextRequest, NextResponse } from "next/server";
import { verifyMessage, isAddress } from "viem";
import { consumeNonce, buildSignMessage } from "@/lib/data/nonces";
import { getOrCreateProfile } from "@/lib/data/profiles";
import { writeAudit } from "@/lib/data/audit";
import { getSession } from "@/lib/session";
import { normalizeAddress } from "@/lib/utils";

export async function POST(req: NextRequest) {
  let body: { wallet?: string; signature?: string; nonce?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { wallet, signature, nonce } = body;

  if (!wallet || !isAddress(wallet)) {
    return NextResponse.json({ error: "Invalid wallet address" }, { status: 400 });
  }
  if (!signature || typeof signature !== "string") {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }
  if (!nonce || typeof nonce !== "string") {
    return NextResponse.json({ error: "Missing nonce" }, { status: 400 });
  }

  const normalizedWallet = normalizeAddress(wallet);

  // Verify nonce is valid and consume it (one-time use)
  const nonceValid = await consumeNonce(normalizedWallet, nonce);
  if (!nonceValid) {
    return NextResponse.json(
      { error: "Nonce is invalid, expired, or already used" },
      { status: 401 }
    );
  }

  // Rebuild the exact message that was signed
  const message = buildSignMessage(wallet, nonce);

  let valid = false;
  try {
    valid = await verifyMessage({
      address: wallet as `0x${string}`,
      message,
      signature: signature as `0x${string}`,
    });
  } catch {
    return NextResponse.json({ error: "Signature verification failed" }, { status: 401 });
  }

  if (!valid) {
    return NextResponse.json({ error: "Signature does not match wallet" }, { status: 401 });
  }

  // Upsert profile and get profileId
  let profile;
  try {
    profile = await getOrCreateProfile(normalizedWallet);
  } catch (err) {
    console.error("[verify] profile upsert failed:", err);
    // Don't block sign-in if profile creation fails
  }

  const session = await getSession();
  const adminWallets = (process.env.SHIPBOND_ADMIN_WALLETS ?? "")
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
  session.walletAddress = normalizedWallet;
  if (profile) session.profileId = profile.id;
  session.isAdmin = adminWallets.includes(normalizedWallet);
  await session.save();

  writeAudit(normalizedWallet, "sign_in", undefined, req.headers.get("x-forwarded-for") ?? undefined);

  return NextResponse.json({
    ok: true,
    walletAddress: normalizedWallet,
  });
}
