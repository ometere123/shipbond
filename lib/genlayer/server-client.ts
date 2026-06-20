/**
 * SERVER-ONLY read-only GenLayer client.
 * Uses Studionet RPC directly - no wallet, no account.
 * Import only in API routes and Server Actions.
 */
import { createClient } from "genlayer-js";
import { studionetChain, SHIPBOND_CONTRACT } from "@/lib/genlayer/studionet-chain";

// Singleton Ã¢â‚¬â€ reused across requests in the same process
let _client: ReturnType<typeof createClient> | null = null;

function getClient() {
  if (!_client) {
    _client = createClient({ chain: studionetChain as any });
  }
  return _client;
}

// Ã¢â€â‚¬Ã¢â€â‚¬ Read helpers Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬

export async function readMilestone(milestoneId: string): Promise<Record<string, unknown>> {
  const client = getClient();
  const result = await client.readContract({
    address:      SHIPBOND_CONTRACT,
    functionName: "get_milestone",
    args:         [milestoneId],
  });
  return result as Record<string, unknown>;
}

export async function readMilestoneJson(milestoneId: string): Promise<string> {
  const client = getClient();
  const result = await client.readContract({
    address:      SHIPBOND_CONTRACT,
    functionName: "get_milestone_json",
    args:         [milestoneId],
  });
  return result as string;
}

export async function readVerdict(milestoneId: string): Promise<{
  milestone_id: string;
  verdict: string;
  bond_action: string;
  recommended_payout_bps: string;
  reasoning: string;
  revision_required: string;
  human_review_reason: string;
  settlement_status: string;
  status: string;
  reviewed_at: string;
}> {
  const client = getClient();
  const result = await client.readContract({
    address:      SHIPBOND_CONTRACT,
    functionName: "get_verdict",
    args:         [milestoneId],
  });
  return result as any;
}

export async function readPublicEvidenceRefs(milestoneId: string): Promise<string> {
  const client = getClient();
  const result = await client.readContract({
    address:      SHIPBOND_CONTRACT,
    functionName: "get_public_evidence_refs",
    args:         [milestoneId],
  });
  return result as string;
}

export async function readIsAutoSettleable(milestoneId: string): Promise<boolean> {
  const client = getClient();
  const result = await client.readContract({
    address:      SHIPBOND_CONTRACT,
    functionName: "is_auto_settleable",
    args:         [milestoneId],
  });
  return result as boolean;
}

export async function readIsSettled(milestoneId: string): Promise<boolean> {
  const client = getClient();
  const result = await client.readContract({
    address:      SHIPBOND_CONTRACT,
    functionName: "is_settled",
    args:         [milestoneId],
  });
  return result as boolean;
}

export async function readCount(): Promise<string> {
  const client = getClient();
  const result = await client.readContract({
    address:      SHIPBOND_CONTRACT,
    functionName: "get_count",
    args:         [],
  });
  return result as string;
}

export async function readSponsorMilestoneIds(sponsorAddress: string): Promise<string[]> {
  const client = getClient();
  const result = await client.readContract({
    address:      SHIPBOND_CONTRACT,
    functionName: "get_sponsor_milestone_ids",
    args:         [sponsorAddress],
  });
  const raw = result as string;
  if (!raw) return [];
  return raw.split(",").map((s) => s.trim()).filter(Boolean);
}

export async function readBuilderMilestoneIds(builderAddress: string): Promise<string[]> {
  const client = getClient();
  const result = await client.readContract({
    address:      SHIPBOND_CONTRACT,
    functionName: "get_builder_milestone_ids",
    args:         [builderAddress],
  });
  const raw = result as string;
  if (!raw) return [];
  return raw.split(",").map((s) => s.trim()).filter(Boolean);
}
