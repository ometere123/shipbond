// Canonical terms hash: deterministic SHA-256 of milestone terms.
//
// Includes a client-generated nonce, sponsor_wallet, and created_at_iso so
// the hash is globally unique even if two sponsors post identical terms.
// This uniqueness is critical for safe on-chain ID resolution after
// create_milestone (matching by terms_hash among a sponsor's milestone ids).
//
// The client generates the nonce and computes the hash itself, then passes
// it directly to create_milestone — no server round trip needed.

export interface MilestoneTerms {
  title:           string;
  description:     string;
  reward_wei:      string;
  bond_wei:        string;
  deadline:        string | null; // ISO string or null
  // Uniqueness fields
  client_nonce:    string;  // crypto.randomUUID(), generated once per submit
  sponsor_wallet:  string;  // lowercase 0x address
  created_at_iso:  string;  // ISO 8601 timestamp, generated client-side
}

export function buildTermsPayload(terms: MilestoneTerms): string {
  return JSON.stringify({
    title:          terms.title.trim(),
    description:    terms.description.trim(),
    reward_wei:     terms.reward_wei,
    bond_wei:       terms.bond_wei,
    deadline:       terms.deadline ?? "none",
    client_nonce:   terms.client_nonce,
    sponsor_wallet: terms.sponsor_wallet.toLowerCase(),
    created_at_iso: terms.created_at_iso,
  });
}

/** Browser: uses Web Crypto API */
export async function hashTermsBrowser(terms: MilestoneTerms): Promise<string> {
  const payload = buildTermsPayload(terms);
  const encoded = new TextEncoder().encode(payload);
  const digest  = await crypto.subtle.digest("SHA-256", encoded);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
