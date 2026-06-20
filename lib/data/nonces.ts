// SERVER-ONLY
import { adminDb } from "@/lib/supabase-admin";
import crypto from "crypto";

export async function createNonce(wallet: string): Promise<{ nonce: string; message: string }> {
  // Purge expired nonces for this wallet first
  await adminDb
    .from("login_nonces")
    .delete()
    .eq("wallet", wallet.toLowerCase())
    .lt("expires_at", new Date().toISOString());

  const nonce = crypto.randomUUID();
  const { error } = await adminDb.from("login_nonces").insert({
    wallet: wallet.toLowerCase(),
    nonce,
  });
  if (error) throw new Error(`Failed to create nonce: ${error.message}`);

  const message = buildSignMessage(wallet, nonce);
  return { nonce, message };
}

export async function consumeNonce(wallet: string, nonce: string): Promise<boolean> {
  const now = new Date().toISOString();
  const { data, error } = await adminDb
    .from("login_nonces")
    .select("id, used, expires_at")
    .eq("wallet", wallet.toLowerCase())
    .eq("nonce", nonce)
    .single();

  if (error || !data) return false;
  if (data.used) return false;
  if (data.expires_at < now) return false;

  const { error: updateError } = await adminDb
    .from("login_nonces")
    .update({ used: true })
    .eq("id", data.id);

  return !updateError;
}

export function buildSignMessage(wallet: string, nonce: string): string {
  return `Sign in to ShipBond\n\nWallet: ${wallet}\nNonce:  ${nonce}\n\nThis signature proves wallet ownership.\nIt does not send a transaction or cost gas.`;
}
