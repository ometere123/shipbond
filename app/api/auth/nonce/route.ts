import { NextRequest, NextResponse } from "next/server";
import { createNonce } from "@/lib/data/nonces";
import { isAddress } from "viem";

export async function GET(req: NextRequest) {
  const wallet = req.nextUrl.searchParams.get("wallet");

  if (!wallet || !isAddress(wallet)) {
    return NextResponse.json({ error: "Invalid wallet address" }, { status: 400 });
  }

  try {
    const { nonce, message } = await createNonce(wallet);
    return NextResponse.json({ nonce, message });
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err);
    console.error("[nonce]", detail);
    return NextResponse.json({ error: "Failed to create nonce", detail }, { status: 500 });
  }
}
