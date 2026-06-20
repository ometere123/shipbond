import type { Json } from "@/types/supabase";

export interface EvidencePacket {
  // Repo — required
  repo_url: string;
  full_commit_hash: string;      // 40-char SHA-1 — pinned, fetchable by GenLayer
  raw_readme_url: string;        // raw.githubusercontent.com URL — stable plain text
  // Repo — optional
  repo_tree_url: string;         // github.com/owner/repo/tree/<hash> — pinned tree view
  raw_key_file_url: string;      // raw URL to a key source file (contract, package.json, etc.)
  // Deployment — required
  deployment_url: string;
  // On-chain evidence (StudioNet) — optional
  contract_address: string;
  accept_bond_tx_hash: string;   // StudioNet tx hash for builder's accept_milestone call
  // Builder attestation — required
  read_result_summary: string;
  smoke_test_result: string;
  builder_explanation_summary: string;
  acceptance_criteria_checklist: string[];
}

const REQUIRED_FIELDS: Partial<Record<keyof Omit<EvidencePacket, "acceptance_criteria_checklist">, number>> = {
  repo_url: 500,
  full_commit_hash: 40,
  raw_readme_url: 500,
  deployment_url: 500,
  read_result_summary: 1000,
  smoke_test_result: 1000,
  builder_explanation_summary: 1500,
};

const OPTIONAL_FIELDS: Partial<Record<keyof Omit<EvidencePacket, "acceptance_criteria_checklist">, number>> = {
  repo_tree_url: 500,
  raw_key_file_url: 500,
  contract_address: 120,
  accept_bond_tx_hash: 120,
};

export function normalizeEvidencePacket(input: Partial<EvidencePacket>): EvidencePacket {
  const packet = {} as EvidencePacket;

  for (const [key, max] of Object.entries(REQUIRED_FIELDS)) {
    const value = String(input[key as keyof EvidencePacket] ?? "").trim();
    if (!value) throw new Error(`Missing evidence field: ${key}`);
    packet[key as keyof Omit<EvidencePacket, "acceptance_criteria_checklist">] = value.slice(0, max);
  }

  for (const [key, max] of Object.entries(OPTIONAL_FIELDS)) {
    const value = String(input[key as keyof EvidencePacket] ?? "").trim();
    packet[key as keyof Omit<EvidencePacket, "acceptance_criteria_checklist">] = value.slice(0, max);
  }

  const checklist = input.acceptance_criteria_checklist ?? [];
  if (!Array.isArray(checklist) || checklist.length === 0) {
    throw new Error("At least one acceptance criterion result is required");
  }

  packet.acceptance_criteria_checklist = checklist
    .map((item) => String(item).trim())
    .filter(Boolean)
    .slice(0, 20)
    .map((item) => item.slice(0, 500));

  if (packet.acceptance_criteria_checklist.length === 0) {
    throw new Error("At least one acceptance criterion result is required");
  }

  return packet;
}

export function stableEvidenceJson(packet: EvidencePacket): string {
  return JSON.stringify({
    accept_bond_tx_hash: packet.accept_bond_tx_hash,
    acceptance_criteria_checklist: packet.acceptance_criteria_checklist,
    builder_explanation_summary: packet.builder_explanation_summary,
    contract_address: packet.contract_address,
    deployment_url: packet.deployment_url,
    full_commit_hash: packet.full_commit_hash,
    raw_key_file_url: packet.raw_key_file_url,
    raw_readme_url: packet.raw_readme_url,
    read_result_summary: packet.read_result_summary,
    repo_tree_url: packet.repo_tree_url,
    repo_url: packet.repo_url,
    smoke_test_result: packet.smoke_test_result,
  });
}

export async function hashEvidenceServer(packet: EvidencePacket): Promise<string> {
  const { createHash } = await import("crypto");
  return createHash("sha256").update(stableEvidenceJson(packet)).digest("hex");
}

export function evidencePacketToJson(packet: EvidencePacket): Json {
  return JSON.parse(stableEvidenceJson(packet)) as Json;
}
