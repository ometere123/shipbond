/**
 * Contract address constant and type definitions mirroring deployed
 * ShipBondProtocol.py on Studionet (0xd840A072C6B491698E53e469f214f6c6D2750Dc4).
 *
 * Status/verdict values are UPPERCASE to match the Python contract.
 */

export { SHIPBOND_CONTRACT } from "@/lib/genlayer/studionet-chain";

// ── Status values (mirror Python contract) ───────────────────────────────────
export type ContractStatus =
  | "OPEN"
  | "ACCEPTED"
  | "SUBMITTED"
  | "REVIEWING"
  | "REVIEWED"
  | "HUMAN_SETTLEMENT_PROPOSED"
  | "SETTLED"
  | "CANCELLED";

export type ContractVerdict =
  | "PASSED"
  | "PARTIAL_PASS"
  | "FAILED"
  | "NEEDS_HUMAN_REVIEW";

export type ContractBondAction = "RETURN" | "SLASH" | "HOLD";

export type ContractSettlementStatus =
  | "AUTO_SETTLEABLE"
  | "PARTIAL_AUTO_SETTLEABLE"
  | "BLOCKED_HUMAN_REVIEW"
  | "HUMAN_PROPOSED"
  | "COMPLETED";

// ── Read response shapes ─────────────────────────────────────────────────────
// Mirrors the full state dict returned by ShipBondProtocol.get_milestone().
export interface OnChainMilestone {
  milestone_id:               string;
  sponsor:                    string;
  builder:                    string;
  title:                      string;
  description:                string;
  terms_hash:                 string;
  reward_wei:                 string;
  reward_deposited:           string;
  bond_wei:                   string;
  bond_deposited:             string;
  deadline:                   string;
  status:                     ContractStatus;
  evidence_digest:            string;
  evidence_refs_json:         string;
  submitted_at:                string;
  review_count:                string;
  verdict:                     ContractVerdict | "";
  bond_action:                 ContractBondAction | "";
  recommended_payout_bps:      string;
  reasoning:                   string;
  revision_required:           string;
  human_review_reason:         string;
  settlement_status:           ContractSettlementStatus | "";
  verification_summary:        string;
  fetched_repo_status:         string;
  fetched_deployment_status:   string;
  fetched_tx_status:           string;
  created_at:                  string;
  reviewed_at:                 string;
  settled_at:                  string;
  human_payout_bps:            string;
  human_bond_action:           ContractBondAction | "";
  human_settlement_reason:     string;
  human_settlement_accepted:   boolean;
  cancelled_at:                string;
}

export interface OnChainVerdict {
  milestone_id:           string;
  verdict:                ContractVerdict;
  bond_action:            ContractBondAction;
  recommended_payout_bps: string;
  reasoning:              string;
  revision_required:      string;
  human_review_reason:    string;
  settlement_status:      ContractSettlementStatus;
  status:                 ContractStatus;
  reviewed_at:            string;
}

/** Returns true when the contract status means GenLayer consensus has run */
export function isReviewed(s: ContractStatus): boolean {
  return s === "REVIEWED" || s === "HUMAN_SETTLEMENT_PROPOSED" || s === "SETTLED";
}
