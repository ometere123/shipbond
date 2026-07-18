// SERVER-ONLY — in-memory nonce store, no database required.
import * as nonceStore from "@/lib/nonce-store";

export async function createNonce(wallet: string): Promise<{ nonce: string; message: string }> {
  const nonce = nonceStore.createNonce(wallet);
  const message = buildSignMessage(wallet, nonce);
  return { nonce, message };
}

export async function consumeNonce(wallet: string, nonce: string): Promise<boolean> {
  return nonceStore.consumeNonce(wallet, nonce);
}

export function buildSignMessage(wallet: string, nonce: string): string {
  return `Sign in to ShipBond\n\nWallet: ${wallet}\nNonce:  ${nonce}\n\nThis signature proves wallet ownership.\nIt does not send a transaction or cost gas.`;
}
