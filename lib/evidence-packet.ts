export interface EvidencePacket {
  // Repo — required
  repo_url: string;
  full_commit_hash: string;      // 40-char SHA-1 — pinned, fetchable by GenLayer
  readme_path: string;           // relative repo path, defaults to README.md
  raw_readme_url: string;        // derived raw.githubusercontent.com URL
  // Repo — optional
  repo_tree_url: string;         // github.com/owner/repo/tree/<hash> — pinned tree view
  key_file_path: string;         // relative repo path for a key source file
  raw_key_file_url: string;      // derived raw URL to a key source file
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
  deployment_url: 500,
  read_result_summary: 1000,
  smoke_test_result: 1000,
  builder_explanation_summary: 1500,
};

const OPTIONAL_FIELDS: Partial<Record<keyof Omit<EvidencePacket, "acceptance_criteria_checklist">, number>> = {
  readme_path: 300,
  repo_tree_url: 500,
  key_file_path: 300,
  raw_key_file_url: 500,
  contract_address: 120,
  accept_bond_tx_hash: 120,
};

function stripTrailingSlash(value: string): string {
  return value.replace(/\/+$/, "");
}

function parseGithubRepo(repoUrl: string): { owner: string; repo: string; repoUrl: string } {
  let normalized = stripTrailingSlash(repoUrl.trim());
  if (normalized.endsWith(".git")) normalized = normalized.slice(0, -4);

  const prefix = "https://github.com/";
  if (!normalized.startsWith(prefix)) {
    throw new Error("repo_url must be a canonical https://github.com/{owner}/{repo} URL");
  }

  const parts = normalized.slice(prefix.length).split("/");
  if (parts.length !== 2 || !parts[0] || !parts[1]) {
    throw new Error("repo_url must not include branches, commits, files, or query strings");
  }

  const safe = /^[A-Za-z0-9_.-]{1,100}$/;
  if (!safe.test(parts[0]) || !safe.test(parts[1]) || parts[0].startsWith(".") || parts[1].startsWith(".")) {
    throw new Error("repo_url contains an invalid GitHub owner or repository name");
  }

  return {
    owner: parts[0],
    repo: parts[1],
    repoUrl: `${prefix}${parts[0]}/${parts[1]}`,
  };
}

function normalizeRepoPath(path: string, field: string): string {
  const cleaned = path.trim().replace(/\\/g, "/");
  if (!cleaned) throw new Error(`${field} cannot be empty`);
  if (cleaned.startsWith("/") || cleaned.includes("//") || cleaned.split("/").includes("..")) {
    throw new Error(`${field} must be a relative repository path`);
  }
  return cleaned.slice(0, 300);
}

function deriveRawGithubUrl(owner: string, repo: string, hash: string, path: string): string {
  return `https://raw.githubusercontent.com/${owner}/${repo}/${hash}/${normalizeRepoPath(path, "evidence file path")}`;
}

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

  const repo = parseGithubRepo(packet.repo_url);
  packet.repo_url = repo.repoUrl;

  if (!/^[0-9a-f]{40}$/.test(packet.full_commit_hash)) {
    throw new Error("full_commit_hash must be a 40-character lowercase hex SHA-1 string");
  }

  packet.readme_path = normalizeRepoPath(packet.readme_path || "README.md", "readme_path");
  packet.raw_readme_url = deriveRawGithubUrl(
    repo.owner,
    repo.repo,
    packet.full_commit_hash,
    packet.readme_path,
  );

  packet.key_file_path = packet.key_file_path ? normalizeRepoPath(packet.key_file_path, "key_file_path") : "";
  packet.raw_key_file_url = packet.key_file_path
    ? deriveRawGithubUrl(repo.owner, repo.repo, packet.full_commit_hash, packet.key_file_path)
    : "";

  packet.repo_tree_url = packet.repo_tree_url || `https://github.com/${repo.owner}/${repo.repo}/tree/${packet.full_commit_hash}`;

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
    key_file_path: packet.key_file_path,
    raw_key_file_url: packet.raw_key_file_url,
    raw_readme_url: packet.raw_readme_url,
    readme_path: packet.readme_path,
    read_result_summary: packet.read_result_summary,
    repo_tree_url: packet.repo_tree_url,
    repo_url: packet.repo_url,
    smoke_test_result: packet.smoke_test_result,
  });
}

export function stableEvidenceDigestJson(packet: EvidencePacket): string {
  return JSON.stringify({
    accept_bond_tx_hash: packet.accept_bond_tx_hash,
    acceptance_criteria_checklist: packet.acceptance_criteria_checklist,
    builder_explanation_summary: packet.builder_explanation_summary,
    contract_address: packet.contract_address,
    deployment_url: packet.deployment_url,
    full_commit_hash: packet.full_commit_hash,
    key_file_path: packet.key_file_path,
    raw_key_file_url: packet.raw_key_file_url,
    raw_readme_url: packet.raw_readme_url,
    read_result_summary: packet.read_result_summary,
    readme_path: packet.readme_path,
    repo_tree_url: packet.repo_tree_url,
    repo_url: packet.repo_url,
    smoke_test_result: packet.smoke_test_result,
  });
}
