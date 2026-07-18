// SERVER-ONLY — reads milestone state directly from the GenLayer contract.
// There is no database mirror: the contract is the only source of truth.
import {
  readMilestone,
  readCount,
  readSponsorMilestoneIds,
  readBuilderMilestoneIds,
} from "@/lib/genlayer/server-client";
import type { OnChainMilestone } from "@/lib/genlayer/contract";

export async function getMilestone(id: string): Promise<OnChainMilestone | null> {
  try {
    const data = await readMilestone(id);
    if (!data || !data.milestone_id) return null;
    return data as unknown as OnChainMilestone;
  } catch {
    return null;
  }
}

export async function listSponsorMilestones(sponsorWallet: string): Promise<OnChainMilestone[]> {
  const ids = await readSponsorMilestoneIds(sponsorWallet);
  return hydrate(ids);
}

export async function listBuilderMilestones(builderWallet: string): Promise<OnChainMilestone[]> {
  const ids = await readBuilderMilestoneIds(builderWallet);
  return hydrate(ids);
}

/** Every milestone id 1..count — ids are sequential, assigned by the contract at create time. */
export async function listAllMilestones(): Promise<OnChainMilestone[]> {
  const count = Number(await readCount());
  if (!Number.isFinite(count) || count <= 0) return [];
  const ids = Array.from({ length: count }, (_, i) => String(i + 1));
  return hydrate(ids);
}

export async function listOpenMilestones(): Promise<OnChainMilestone[]> {
  const all = await listAllMilestones();
  return all.filter((m) => m.status === "OPEN" || m.status === "ACCEPTED");
}

/** Milestones a wallet built for, that already have a verdict recorded on-chain. */
export async function listVerdictsAsBuilder(builderWallet: string): Promise<OnChainMilestone[]> {
  const milestones = await listBuilderMilestones(builderWallet);
  return milestones.filter((m) => m.verdict !== "");
}

/** Milestones a wallet sponsored, that already have a verdict recorded on-chain. */
export async function listVerdictsAsSponsor(sponsorWallet: string): Promise<OnChainMilestone[]> {
  const milestones = await listSponsorMilestones(sponsorWallet);
  return milestones.filter((m) => m.verdict !== "");
}

async function hydrate(ids: string[]): Promise<OnChainMilestone[]> {
  const results = await Promise.all(ids.map((id) => getMilestone(id)));
  return results
    .filter((m): m is OnChainMilestone => m !== null)
    .sort((a, b) => Number(b.milestone_id) - Number(a.milestone_id));
}
