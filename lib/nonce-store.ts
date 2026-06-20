// In-memory nonce store for Stage 2.
// Stage 3 migrates this to the Supabase login_nonces table.

interface NonceRecord {
  nonce: string;
  expiresAt: number;
  used: boolean;
}

const store = new Map<string, NonceRecord>();

const TTL_MS = 5 * 60 * 1000; // 5 minutes

export function createNonce(walletAddress: string): string {
  const nonce = crypto.randomUUID();
  store.set(walletAddress.toLowerCase(), {
    nonce,
    expiresAt: Date.now() + TTL_MS,
    used: false,
  });
  return nonce;
}

export function consumeNonce(walletAddress: string, nonce: string): boolean {
  const record = store.get(walletAddress.toLowerCase());
  if (!record) return false;
  if (record.used) return false;
  if (Date.now() > record.expiresAt) {
    store.delete(walletAddress.toLowerCase());
    return false;
  }
  if (record.nonce !== nonce) return false;
  // Mark used immediately — prevents replay
  record.used = true;
  store.delete(walletAddress.toLowerCase());
  return true;
}
