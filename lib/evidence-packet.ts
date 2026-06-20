import type { Json } from "@/types/supabase";

export interface EvidencePacket {
  repo_url: string;
  commit_hash: string;
  deployment_url: string;
  contract_address: string;
  write_tx_hash: string;
  read_result_summary: string;
  smoke_test_result: string;
  acceptance_criteria_checklist: string[];
  builder_explanation_summary: string;
}

const REQUIRED_FIELD_LIMITS: Partial<Record<keyof Omit<EvidencePacket, "acceptance_criteria_checklist">, number>> = {
  repo_url: 500,
  commit_hash: 120,
  deployment_url: 500,
  read_result_summary: 1000,
  smoke_test_result: 1000,
  builder_explanation_summary: 1500,
};

const OPTIONAL_FIELD_LIMITS: Partial<Record<keyof Omit<EvidencePacket, "acceptance_criteria_checklist">, number>> = {
  contract_address: 120,
  write_tx_hash: 120,
};

export function normalizeEvidencePacket(input: Partial<EvidencePacket>): EvidencePacket {
  const packet = {} as EvidencePacket;

  for (const [key, max] of Object.entries(REQUIRED_FIELD_LIMITS)) {
    const value = String(input[key as keyof EvidencePacket] ?? "").trim();
    if (!value) throw new Error(`Missing evidence field: ${key}`);
    packet[key as keyof Omit<EvidencePacket, "acceptance_criteria_checklist">] = value.slice(0, max);
  }

  for (const [key, max] of Object.entries(OPTIONAL_FIELD_LIMITS)) {
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
    acceptance_criteria_checklist: packet.acceptance_criteria_checklist,
    builder_explanation_summary: packet.builder_explanation_summary,
    commit_hash: packet.commit_hash,
    contract_address: packet.contract_address,
    deployment_url: packet.deployment_url,
    read_result_summary: packet.read_result_summary,
    repo_url: packet.repo_url,
    smoke_test_result: packet.smoke_test_result,
    write_tx_hash: packet.write_tx_hash,
  });
}

export async function hashEvidenceServer(packet: EvidencePacket): Promise<string> {
  const { createHash } = await import("crypto");
  return createHash("sha256").update(stableEvidenceJson(packet)).digest("hex");
}

export function evidencePacketToJson(packet: EvidencePacket): Json {
  return JSON.parse(stableEvidenceJson(packet)) as Json;
}
