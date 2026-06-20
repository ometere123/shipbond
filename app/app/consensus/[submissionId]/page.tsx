import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { getSubmission } from "@/lib/data/submissions";
import { getMilestone } from "@/lib/data/milestones";
import { getReviewForSubmission } from "@/lib/data/reviews";
import { getSettlementForMilestone } from "@/lib/data/settlements";
import { readVerdict } from "@/lib/genlayer/server-client";
import { tryGetSessionWallet } from "@/lib/get-session-wallet";
import { PortPanel } from "@/components/ui/PortPanel";
import { HashPlate } from "@/components/ui/HashPlate";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";
import { VerdictStamp, SourceOfTruthBadge } from "@/components/consensus/VerdictStamp";
import { formatGEN, shortenAddress } from "@/lib/utils";
import { Gavel } from "lucide-react";
import type { Verdict } from "@/types";

export const metadata = { title: "Consensus Chamber" };
export const dynamic = "force-dynamic";

export default async function ConsensusChamberPage({
  params,
}: {
  params: Promise<{ submissionId: string }>;
}) {
  const { submissionId } = await params;
  const session = await tryGetSessionWallet();
  if (!session) redirect("/connect");

  const submission = await getSubmission(submissionId);
  if (!submission) notFound();

  const [milestone, review, settlement] = await Promise.all([
    getMilestone(submission.milestone_id),
    getReviewForSubmission(submission.id),
    getSettlementForMilestone(submission.milestone_id),
  ]);

  if (!milestone) notFound();

  const isSponsor = milestone.sponsor_wallet === session.walletAddress;
  const isBuilder = submission.builder_wallet === session.walletAddress;

  if (!isSponsor && !isBuilder) {
    return (
      <div className="max-w-3xl mx-auto mt-16">
        <EmptyState
          icon={<Gavel size={28} />}
          title="Access restricted"
          description="Only the sponsor and accepted builder can view the Consensus Chamber."
        />
      </div>
    );
  }

  // Live chain read for extended verdict fields — only if verdict is synced
  let chainVerdict: Awaited<ReturnType<typeof readVerdict>> | null = null;
  if (milestone.on_chain_id && review?.verdict) {
    chainVerdict = await readVerdict(milestone.on_chain_id).catch(() => null);
  }

  const evidenceRefs =
    submission.evidence_refs && typeof submission.evidence_refs === "object"
      ? (submission.evidence_refs as Record<string, unknown>)
      : null;

  const verdictForStamp = review?.verdict
    ? (review.verdict.toUpperCase() as Verdict)
    : null;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Link
        href={`/app/port/${milestone.id}`}
        className="inline-flex items-center gap-2 font-mono text-meta text-steel hover:text-fog"
      >
        <ArrowLeft size={13} />
        Back to milestone
      </Link>

      <div>
        <p className="font-mono text-meta text-steel uppercase tracking-widest mb-2">Consensus Chamber</p>
        <h1 className="font-display font-bold text-page-title text-signal">{milestone.title}</h1>
      </div>

      <SourceOfTruthBadge />

      {/* Milestone Facts */}
      <PortPanel label="Milestone Facts" padding="sm">
        <div className="space-y-2">
          <Row label="Sponsor"  value={shortenAddress(milestone.sponsor_wallet, 8)} />
          <Row label="Builder"  value={shortenAddress(submission.builder_wallet, 8)} />
          <Row label="Reward"   value={`${formatGEN(BigInt(milestone.reward_wei))} GEN`} />
          <Row label="Bond"     value={`${formatGEN(BigInt(milestone.bond_wei))} GEN`} />
          {milestone.on_chain_id && <Row label="On-chain ID" value={milestone.on_chain_id} />}
          {milestone.deadline && (
            <Row
              label="Deadline"
              value={new Date(milestone.deadline).toLocaleDateString("en-US", {
                month: "short", day: "numeric", year: "numeric",
              })}
            />
          )}
        </div>
      </PortPanel>

      {/* Evidence Digest */}
      {submission.evidence_digest && (
        <PortPanel label="Public Evidence Digest" glow="cyan" padding="sm">
          <div className="space-y-3">
            <HashPlate value={submission.evidence_digest} type="hash" explorerType="none" showFull />
            {evidenceRefs && (
              <div className="space-y-2 pt-3 border-t border-port-border">
                {Object.entries(evidenceRefs)
                  .filter(([key]) => key !== "acceptance_criteria_checklist")
                  .slice(0, 5)
                  .map(([key, value]) => (
                    <div key={key} className="grid gap-0.5">
                      <span className="font-mono text-meta text-steel uppercase tracking-wider">
                        {key.replace(/_/g, " ")}
                      </span>
                      <span className="font-body text-table text-fog break-words">
                        {String(value).slice(0, 140)}
                        {String(value).length > 140 ? "…" : ""}
                      </span>
                    </div>
                  ))}
                <Link
                  href={`/app/milestones/${milestone.id}/evidence`}
                  className="inline-flex items-center gap-1 font-mono text-meta text-cyan-evidence hover:text-signal"
                >
                  Full evidence packet <ExternalLink size={11} />
                </Link>
              </div>
            )}
          </div>
        </PortPanel>
      )}

      {/* GenLayer Verdict */}
      <PortPanel label="GenLayer Verdict" glow="violet">
        {!review ? (
          <p className="font-body text-table text-steel">
            No review has been synced. Request review first, then use Sync Verdict.
          </p>
        ) : (
          <div className="space-y-4">
            {verdictForStamp && (
              <div className="flex justify-center py-4">
                <VerdictStamp verdict={verdictForStamp} size="lg" animate />
              </div>
            )}

            <div className="space-y-2">
              <Row label="Verdict"     value={(review.verdict ?? "pending").replace(/_/g, " ")} />
              <Row label="Bond Action" value={review.bond_action ?? "pending"} />
              {chainVerdict?.recommended_payout_bps && (
                <Row
                  label="Recommended Payout"
                  value={`${Number(chainVerdict.recommended_payout_bps) / 100}%`}
                />
              )}
              {chainVerdict?.revision_required &&
                chainVerdict.revision_required !== "False" &&
                chainVerdict.revision_required !== "false" && (
                  <Row label="Revision Required" value={chainVerdict.revision_required} />
                )}
              {chainVerdict?.human_review_reason &&
                chainVerdict.human_review_reason !== "None" &&
                chainVerdict.human_review_reason !== "none" && (
                  <Row label="Human Review Reason" value={chainVerdict.human_review_reason} />
                )}
              {chainVerdict?.settlement_status && (
                <Row
                  label="Settlement Status"
                  value={chainVerdict.settlement_status.replace(/_/g, " ")}
                />
              )}
              {review.consensus_reached !== null && (
                <Row label="Consensus" value={review.consensus_reached ? "Reached" : "Pending"} />
              )}
              {review.synced_at && (
                <Row
                  label="Synced At"
                  value={new Date(review.synced_at).toLocaleString("en-US", {
                    dateStyle: "medium", timeStyle: "short",
                  })}
                />
              )}
            </div>

            {review.reasoning_summary && (
              <div className="border-t border-port-border pt-4">
                <p className="font-mono text-meta text-steel uppercase tracking-wider mb-2">
                  GenLayer Reasoning
                </p>
                <p className="font-body text-table text-fog leading-relaxed whitespace-pre-wrap">
                  {review.reasoning_summary}
                </p>
              </div>
            )}
          </div>
        )}
      </PortPanel>

      {/* Settlement Record */}
      {settlement && (
        <PortPanel label="Settlement Record" glow="amber" padding="sm">
          <div className="space-y-2">
            <Row label="Verdict"     value={settlement.verdict.replace(/_/g, " ")} />
            <Row label="Bond Action" value={settlement.bond_action} />
            {settlement.reward_to_builder && (
              <Row
                label="Builder Payout"
                value={`${formatGEN(BigInt(settlement.reward_to_builder))} GEN`}
              />
            )}
            {settlement.bond_returned && (
              <Row
                label="Bond Returned"
                value={`${formatGEN(BigInt(settlement.bond_returned))} GEN`}
              />
            )}
            {settlement.bond_slashed && (
              <Row
                label="Bond Slashed"
                value={`${formatGEN(BigInt(settlement.bond_slashed))} GEN`}
              />
            )}
            {settlement.settled_at && (
              <Row
                label="Settled At"
                value={new Date(settlement.settled_at).toLocaleString("en-US", {
                  dateStyle: "medium", timeStyle: "short",
                })}
              />
            )}
          </div>
        </PortPanel>
      )}

      {/* Contract Trace */}
      <PortPanel label="Contract Trace" glow="violet" padding="sm">
        <div className="space-y-3">
          {milestone.on_chain_id && (
            <TraceRow label="On-chain ID"          value={milestone.on_chain_id}          type="hash" />
          )}
          {submission.bond_tx_hash && (
            <TraceRow label="Bond TX"              value={submission.bond_tx_hash}         type="tx" />
          )}
          {submission.submit_tx_hash && (
            <TraceRow label="Submit Evidence TX"   value={submission.submit_tx_hash}       type="tx" />
          )}
          {review?.request_tx_hash && (
            <TraceRow label="Request Review TX"    value={review.request_tx_hash}          type="tx" />
          )}
          {review?.result_tx_hash && (
            <TraceRow label="Verdict TX"           value={review.result_tx_hash}           type="tx" />
          )}
          {settlement?.settle_tx_hash && (
            <TraceRow label="Settle TX"            value={settlement.settle_tx_hash}       type="tx" />
          )}
          {!submission.bond_tx_hash && !submission.submit_tx_hash && !review?.request_tx_hash && (
            <p className="font-body text-table text-steel">No on-chain activity recorded yet.</p>
          )}
        </div>
      </PortPanel>

      {/* CTA: proceed to settlement */}
      {!settlement && review?.verdict && review.verdict !== "needs_human_review" && (isSponsor || isBuilder) && (
        <Link href={`/app/milestones/${milestone.id}/settle`}>
          <Button variant="primary" size="lg">Proceed to Settlement</Button>
        </Link>
      )}
      {!settlement && review?.verdict === "needs_human_review" && (isSponsor || isBuilder) && (
        <Link href={`/app/milestones/${milestone.id}/settle`}>
          <Button variant="secondary" size="lg">Human Settlement Required</Button>
        </Link>
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="font-mono text-meta text-steel uppercase tracking-wider shrink-0">{label}</span>
      <span className="font-body text-table text-fog text-right capitalize">{value}</span>
    </div>
  );
}

function TraceRow({ label, value, type }: { label: string; value: string; type: "tx" | "hash" }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="font-mono text-meta text-steel uppercase tracking-wider shrink-0">{label}</span>
      <HashPlate value={value} type={type} explorerType={type === "hash" ? "none" : "bradbury"} />
    </div>
  );
}
