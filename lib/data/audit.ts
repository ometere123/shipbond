// SERVER-ONLY — writes immutable access audit log entries
import { adminDb } from "@/lib/supabase-admin";
import crypto from "crypto";

export type AuditAction =
  | "sign_in"
  | "sign_out"
  | "create_milestone"
  | "accept_milestone"
  | "submit_evidence"
  | "view_evidence"
  | "request_review"
  | "sync_verdict"
  | "settle"
  | "view_settlement"
  | "set_on_chain_id";

export async function writeAudit(
  wallet: string,
  action: AuditAction,
  resource?: string,
  ip?: string
): Promise<void> {
  const ipHash = ip ? crypto.createHash("sha256").update(ip).digest("hex").slice(0, 16) : null;
  // Fire-and-forget: audit failures must not block the request
  adminDb
    .from("access_audit")
    .insert({ wallet: wallet.toLowerCase(), action, resource: resource ?? null, ip_hash: ipHash })
    .then(({ error }) => {
      if (error) console.error("[audit]", error.message);
    });
}

export async function listAuditEntries(limit = 80) {
  const { data } = await adminDb
    .from("access_audit")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);
  return data ?? [];
}
