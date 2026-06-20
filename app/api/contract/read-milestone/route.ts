import { NextRequest, NextResponse } from "next/server";
import { readMilestone, readPublicEvidenceRefs } from "@/lib/genlayer/server-client";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "Missing milestone id" }, { status: 400 });
  }

  try {
    const [milestone, evidenceRefs] = await Promise.all([
      readMilestone(id),
      readPublicEvidenceRefs(id).catch(() => ""),
    ]);

    return NextResponse.json({ milestone, evidenceRefs });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
