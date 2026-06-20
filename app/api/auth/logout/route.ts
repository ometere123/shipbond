import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { writeAudit } from "@/lib/data/audit";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (session.walletAddress) {
    writeAudit(session.walletAddress, "sign_out");
  }
  session.destroy();
  return NextResponse.json({ ok: true });
}
