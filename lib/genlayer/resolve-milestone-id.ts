/**
 * SERVER-ONLY — resolves the on-chain milestone_id after create_milestone.
 *
 * The protocol is global (one contract, many sponsors). get_count() is unsafe
 * because another sponsor can create a milestone concurrently. Instead:
 *
 *  1. Call get_sponsor_milestone_ids(sponsorWallet) → comma-separated IDs
 *  2. Sort descending (most recent first — contract increments an integer counter)
 *  3. For each candidate, call get_milestone(id)
 *  4. Match on terms_hash (globally unique: includes local DB UUID + sponsor + timestamp)
 *     Also verify title, reward_wei, bond_wei, and sponsor address.
 *  5. Return the matched ID, or null if not found within retries.
 *
 * Retries with backoff because Bradbury state may need a moment to be visible
 * even after ACCEPTED status (edge nodes can lag slightly).
 */

import { readSponsorMilestoneIds, readMilestone } from "@/lib/genlayer/server-client";
import { getAddress } from "viem";

const MAX_RETRIES     = 8;
const RETRY_DELAY_MS  = 3000;

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export interface ResolveMilestoneIdParams {
  sponsorWallet: string;
  termsHash:     string;
  title:         string;
  rewardWei:     string;
  bondWei:       string;
  maxRetries?:   number;
  retryDelayMs?: number;
}

export async function resolveCreatedMilestoneId(
  params: ResolveMilestoneIdParams,
): Promise<string | null> {
  const {
    sponsorWallet,
    termsHash,
    title,
    rewardWei,
    bondWei,
    maxRetries = MAX_RETRIES,
    retryDelayMs = RETRY_DELAY_MS,
  } = params;
  const wallet = sponsorWallet.toLowerCase();
  const checksumWallet = getAddress(sponsorWallet);

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    if (attempt > 0) {
      await sleep(retryDelayMs * attempt);
    }

    try {
      const ids = await readSponsorMilestoneIds(checksumWallet);
      if (ids.length === 0) continue;

      // Sort descending — contract uses an incrementing integer key ("1", "2", "3"…)
      // The milestone we just created will be near the top.
      const sorted = [...ids].sort((a, b) => Number(b) - Number(a));

      for (const candidateId of sorted) {
        try {
          const m = await readMilestone(candidateId);

          const sponsorMatch    = String(m.sponsor ?? "").toLowerCase() === wallet;
          const termsHashMatch  = String(m.terms_hash ?? "") === termsHash;
          const titleMatch      = String(m.title ?? "").trim() === title.trim();
          const rewardMatch     = String(m.reward_wei ?? "") === rewardWei;
          const bondMatch       = String(m.bond_wei ?? "") === bondWei;

          if (sponsorMatch && termsHashMatch && titleMatch && rewardMatch && bondMatch) {
            return candidateId;
          }

          // If terms_hash already matched but something else differs, that's a
          // collision or data error — stop scanning; don't return wrong ID.
          if (termsHashMatch && !sponsorMatch) {
            // terms_hash includes sponsor_wallet, so this cannot happen honestly;
            // skip but log in dev.
            if (process.env.NODE_ENV === "development") {
              console.warn(
                "[resolveCreatedMilestoneId] terms_hash matched but sponsor mismatch",
                { candidateId, contractSponsor: m.sponsor, expectedSponsor: wallet },
              );
            }
          }
        } catch {
          // Individual read failed (network); continue to next candidate
        }
      }
    } catch {
      // Sponsor ID list read failed; will retry
    }
  }

  return null;
}
