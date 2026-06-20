// ─── Verdict types ───────────────────────────────────────────────────────────
export type Verdict = "PASSED" | "PARTIAL_PASS" | "FAILED" | "NEEDS_HUMAN_REVIEW";
export type BondAction = "RETURN" | "SLASH" | "HOLD";
export type SettlementAction = "RELEASE_FULL" | "RELEASE_PARTIAL" | "REFUND_SPONSOR" | "FREEZE";
export type ConfidenceLabel = "high" | "moderate" | "low";
export type SupportLevel = "strong" | "moderate" | "weak" | "insufficient";

// ─── Milestone ───────────────────────────────────────────────────────────────
// Must match DB enum and contractStatusToDb() in lib/genlayer/contract.ts
export type MilestoneStatus =
  | "open"
  | "accepted"
  | "submitted"
  | "reviewing"
  | "settled"
  | "cancelled";

export interface Milestone {
  id: string;
  onchain_milestone_id: string;
  sponsor_wallet: string;
  title: string;
  short_summary: string;
  plain_language_promise: string;
  acceptance_criteria: string;
  required_evidence: string;
  reward_amount: string; // wei string
  builder_bond_amount: string; // wei string
  deadline: number; // unix timestamp
  status: MilestoneStatus;
  terms_hash: string;
  funding_tx_hash: string | null;
  created_at: string;
  updated_at: string;
}

// ─── Builder bond ─────────────────────────────────────────────────────────────
export type BondStatus = "active" | "returned" | "slashed" | "held";

export interface MilestoneBuilder {
  id: string;
  milestone_id: string;
  builder_wallet: string;
  bond_amount: string;
  bond_tx_hash: string | null;
  status: BondStatus;
  accepted_at: string;
}

// ─── Submission ───────────────────────────────────────────────────────────────
export type SubmissionStatus = "draft" | "submitted" | "reviewing" | "verdict_issued" | "settled";

export interface Submission {
  id: string;
  milestone_id: string;
  builder_wallet: string;
  repo_link: string;
  full_commit_hash: string;
  readme_url: string;
  deployment_link: string;
  contract_address: string;
  transaction_hash: string;
  smoke_test_summary: string;
  implementation_explanation: string;
  known_limitations: string;
  final_delivery_note: string;
  public_evidence_summary: string;
  evidence_digest: string;
  submission_hash: string;
  status: SubmissionStatus;
  submitted_at: string | null;
  created_at: string;
}

// ─── Review ───────────────────────────────────────────────────────────────────
export interface GenLayerReview {
  id: string;
  milestone_id: string;
  submission_id: string;
  review_tx_hash: string | null;
  verdict_tx_hash: string | null;
  verdict: Verdict;
  confidence_label: ConfidenceLabel;
  support_level: SupportLevel;
  recommended_payout_bps: number;
  bond_action: BondAction;
  settlement_action: SettlementAction;
  reasoning_summary: string;
  revision_summary: string;
  human_review_reason: string;
  evidence_digest: string;
  source_of_truth: "genlayer_contract";
  reviewed_at: string | null;
  created_at: string;
}

// ─── Settlement ───────────────────────────────────────────────────────────────
export type SettlementStatus = "pending" | "completed" | "failed";

export interface Settlement {
  id: string;
  milestone_id: string;
  submission_id: string;
  settlement_tx_hash: string | null;
  reward_amount: string;
  bond_amount: string;
  payout_amount: string;
  refund_amount: string;
  bond_returned_amount: string;
  bond_slashed_amount: string;
  settlement_status: SettlementStatus;
  created_at: string;
}

// ─── Profile ──────────────────────────────────────────────────────────────────
export type UserRole = "sponsor" | "builder" | "admin" | "viewer";

export interface Profile {
  id: string;
  wallet_address: string;
  display_name: string | null;
  avatar_url: string | null;
  role: UserRole;
  is_admin: boolean;
  created_at: string;
}

// ─── Proof Rail step ─────────────────────────────────────────────────────────
export type RailStepStatus = "completed" | "active" | "pending";

export interface RailStep {
  id: string;
  label: string;
  status: RailStepStatus;
  tx_hash?: string;
  timestamp?: string;
}

// ─── Contract activity ────────────────────────────────────────────────────────
export interface ContractActivity {
  id: string;
  activity_type: string;
  tx_hash: string | null;
  status: "pending" | "confirmed" | "failed";
  error_message: string | null;
  created_at: string;
}
