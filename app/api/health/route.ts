import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    status: "ok",
    product: "ShipBond",
    network: process.env.NEXT_PUBLIC_GENLAYER_NETWORK ?? "testnetBradbury",
    chainId: process.env.NEXT_PUBLIC_CHAIN_ID ?? "4221",
    contract: process.env.NEXT_PUBLIC_SHIPBOND_CONTRACT_ADDRESS ?? "not_deployed",
    timestamp: new Date().toISOString(),
  });
}
