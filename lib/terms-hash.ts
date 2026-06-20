// Canonical terms hash: deterministic SHA-256 of milestone terms.
//
// Includes local_milestone_id (Supabase UUID), sponsor_wallet, and created_at_iso
// so that the hash is globally unique even if two sponsors post identical terms.
// This uniqueness is critical for safe on-chain ID resolution after create_milestone.
//
// The server computes and stores the hash after creating the DB record.
// The client receives the hash from the API and passes it directly to create_milestone.

export interface MilestoneTerms {
  title:               string;
  description:         string;
  reward_wei:          string;
  bond_wei:            string;
  deadline:            string | null; // ISO string or null
  // Uniqueness fields — populated server-side after DB record is created
  local_milestone_id:  string;  // Supabase UUID of the DB row
  sponsor_wallet:      string;  // lowercase 0x address
  created_at_iso:      string;  // ISO 8601 timestamp from DB
}

export function buildTermsPayload(terms: MilestoneTerms): string {
  return JSON.stringify({
    title:              terms.title.trim(),
    description:        terms.description.trim(),
    reward_wei:         terms.reward_wei,
    bond_wei:           terms.bond_wei,
    deadline:           terms.deadline ?? "none",
    local_milestone_id: terms.local_milestone_id,
    sponsor_wallet:     terms.sponsor_wallet.toLowerCase(),
    created_at_iso:     terms.created_at_iso,
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

/** Server: uses Node crypto */
export async function hashTermsServer(terms: MilestoneTerms): Promise<string> {
  const { createHash } = await import("crypto");
  const payload = buildTermsPayload(terms);
  return createHash("sha256").update(payload).digest("hex");
}
