import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    status: "ok",
    product: "ShipBond",
    network: process.env.NEXT_PUBLIC_GENLAYER_NETWORK ?? "studionet",
    chainId: process.env.NEXT_PUBLIC_CHAIN_ID ?? "61999",
    contract: process.env.NEXT_PUBLIC_SHIPBOND_CONTRACT_ADDRESS ?? "not_deployed",
    timestamp: new Date().toISOString(),
  });
}
