/**
 * Contract address constant and type definitions mirroring deployed
 * ShipBondProtocol.py on Bradbury (0xfb305e9011C58ebc1303795693026769E955e6B7).
 *
 * Status/verdict values are UPPERCASE to match the Python contract.
 */

export { SHIPBOND_CONTRACT } from "@/lib/genlayer/bradbury-chain";

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
export interface OnChainMilestone {
  milestone_id:  string;
  sponsor:       string;
  builder:       string;
  title:         string;
  description:   string;
  terms_hash:    string;
  reward_wei:    string;
  bond_wei:      string;
  deadline:      string;
  status:        ContractStatus;
  created_at:    string;
  accepted_at:   string;
  submitted_at:  string;
  reviewed_at:   string;
  settled_at:    string;
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

// ── DB verdict/bond_action types (lowercase, match migration 009) ────────────
export type DbVerdict    = "passed" | "partial_pass" | "failed" | "needs_human_review";
export type DbBondAction = "return" | "slash" | "hold";

/** Maps contract UPPERCASE verdict → DB lowercase */
export function mapContractVerdict(v: string): DbVerdict {
  switch (v) {
    case "PASSED":             return "passed";
    case "PARTIAL_PASS":       return "partial_pass";
    case "FAILED":             return "failed";
    case "NEEDS_HUMAN_REVIEW": return "needs_human_review";
    default:                   return "needs_human_review";
  }
}

/** Maps contract UPPERCASE bond_action → DB lowercase */
export function mapContractBondAction(b: string): DbBondAction {
  switch (b) {
    case "RETURN": return "return";
    case "SLASH":  return "slash";
    case "HOLD":   return "hold";
    default:       return "hold";
  }
}

// ── DB status mapping helpers ─────────────────────────────────────────────────
// Contract status (UPPERCASE) → DB status (lowercase)
const CONTRACT_TO_DB: Record<ContractStatus, string> = {
  OPEN:                       "open",
  ACCEPTED:                   "accepted",
  SUBMITTED:                  "submitted",
  REVIEWING:                  "reviewing",
  REVIEWED:                   "reviewing",  // DB has no REVIEWED; stays reviewing until settled
  HUMAN_SETTLEMENT_PROPOSED:  "reviewing",
  SETTLED:                    "settled",
  CANCELLED:                  "cancelled",
};

export function contractStatusToDb(s: ContractStatus): string {
  return CONTRACT_TO_DB[s] ?? "open";
}

/** Returns true when the contract status means GenLayer consensus has run */
export function isReviewed(s: ContractStatus): boolean {
  return s === "REVIEWED" || s === "HUMAN_SETTLEMENT_PROPOSED" || s === "SETTLED";
}
