import { NextRequest, NextResponse } from "next/server";
import { getSessionWallet } from "@/lib/get-session-wallet";
import { getSubmissionByMilestone } from "@/lib/data/submissions";
import { recordEvidenceFile } from "@/lib/data/evidence";
import { adminDb } from "@/lib/supabase-admin";

export const runtime = "nodejs";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSessionWallet(req);
  const wallet = session.walletAddress.toLowerCase();
  const { id } = await params;
  const submission = await getSubmissionByMilestone(id);

  if (!submission) return NextResponse.json({ error: "Submission not found" }, { status: 404 });
  if (submission.builder_wallet.toLowerCase() !== wallet) {
    return NextResponse.json({ error: "Only the accepted builder can upload files" }, { status: 403 });
  }

  const form = await req.formData();
  const files = form.getAll("files").filter((file): file is File => file instanceof File);
  if (files.length === 0) return NextResponse.json({ error: "No files uploaded" }, { status: 400 });

  const uploaded = [];
  for (const file of files.slice(0, 6)) {
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 120);
    const storagePath = `${submission.id}/${crypto.randomUUID()}-${safeName}`;
    const { error } = await adminDb.storage
      .from("shipbond-evidence")
      .upload(storagePath, file, { contentType: file.type || "application/octet-stream" });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    uploaded.push(await recordEvidenceFile(submission.id, wallet, {
      file_name: safeName,
      storage_path: storagePath,
      content_type: file.type || undefined,
      size_bytes: file.size,
    }));
  }

  return NextResponse.json({ ok: true, files: uploaded });
}
