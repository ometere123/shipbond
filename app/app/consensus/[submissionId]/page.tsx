import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { getMilestone } from "@/lib/data/milestones";
import { tryGetSessionWallet } from "@/lib/get-session-wallet";
import { PortPanel } from "@/components/ui/PortPanel";
import { HashPlate } from "@/components/ui/HashPlate";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";
import { VerdictStamp, SourceOfTruthBadge } from "@/components/consensus/VerdictStamp";
import { formatGEN, formatDeadline, shortenAddress } from "@/lib/utils";
import { Gavel } from "lucide-react";
import type { Verdict } from "@/types";

export const metadata = { title: "Consensus Chamber" };
export const dynamic = "force-dynamic";

// The dynamic segment here is the on-chain milestone_id — one milestone has
// exactly one builder/submission/verdict, so there's no separate submission id.
export default async function ConsensusChamberPage({
  params,
}: {
  params: Promise<{ submissionId: string }>;
}) {
  const { submissionId: milestoneId } = await params;
  const session = await tryGetSessionWallet();
  if (!session) redirect("/connect");

  const milestone = await getMilestone(milestoneId);
  if (!milestone) notFound();

  const wallet = session.walletAddress.toLowerCase();
  const isSponsor = milestone.sponsor.toLowerCase() === wallet;
  const isBuilder = !!milestone.builder && milestone.builder.toLowerCase() === wallet;

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

  let evidenceRefs: Record<string, unknown> | null = null;
  try {
    evidenceRefs = milestone.evidence_refs_json ? JSON.parse(milestone.evidence_refs_json) : null;
  } catch {
    evidenceRefs = null;
  }

  const verdictForStamp = milestone.verdict ? (milestone.verdict as Verdict) : null;
  const isSettled = milestone.status === "SETTLED";

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Link
        href={`/app/port/${milestone.milestone_id}`}
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
          <Row label="Sponsor"     value={shortenAddress(milestone.sponsor, 8)} />
          <Row label="Builder"     value={milestone.builder ? shortenAddress(milestone.builder, 8) : "Unbonded"} />
          <Row label="Reward"      value={`${formatGEN(BigInt(milestone.reward_wei))} GEN`} />
          <Row label="Bond"        value={`${formatGEN(BigInt(milestone.bond_wei))} GEN`} />
          <Row label="On-chain ID" value={milestone.milestone_id} />
          {Number(milestone.deadline) > 0 && (
            <Row label="Deadline" value={formatDeadline(Number(milestone.deadline))} />
          )}
        </div>
      </PortPanel>

      {/* Evidence Digest */}
      {milestone.evidence_digest && (
        <PortPanel label="Public Evidence Digest" glow="cyan" padding="sm">
          <div className="space-y-3">
            <HashPlate value={milestone.evidence_digest} type="hash" explorerType="none" showFull />
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
                  href={`/app/milestones/${milestone.milestone_id}/evidence`}
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
        {!milestone.verdict ? (
          <p className="font-body text-table text-steel">
            No verdict yet. Request review first.
          </p>
        ) : (
          <div className="space-y-4">
            {verdictForStamp && (
              <div className="flex justify-center py-4">
                <VerdictStamp verdict={verdictForStamp} size="lg" animate />
              </div>
            )}

            <div className="space-y-2">
              <Row label="Verdict"     value={milestone.verdict.replace(/_/g, " ")} />
              <Row label="Bond Action" value={milestone.bond_action || "pending"} />
              {milestone.recommended_payout_bps && Number(milestone.recommended_payout_bps) > 0 && (
                <Row
                  label="Recommended Payout"
                  value={`${Number(milestone.recommended_payout_bps) / 100}%`}
                />
              )}
              {milestone.revision_required && (
                <Row label="Revision Required" value={milestone.revision_required} />
              )}
              {milestone.human_review_reason && (
                <Row label="Human Review Reason" value={milestone.human_review_reason} />
              )}
              {milestone.settlement_status && (
                <Row
                  label="Settlement Status"
                  value={milestone.settlement_status.replace(/_/g, " ")}
                />
              )}
              {milestone.reviewed_at && (
                <Row
                  label="Reviewed At"
                  value={new Date(milestone.reviewed_at).toLocaleString("en-US", {
                    dateStyle: "medium", timeStyle: "short",
                  })}
                />
              )}
            </div>

            {milestone.reasoning && (
              <div className="border-t border-port-border pt-4">
                <p className="font-mono text-meta text-steel uppercase tracking-wider mb-2">
                  GenLayer Reasoning
                </p>
                <p className="font-body text-table text-fog leading-relaxed whitespace-pre-wrap">
                  {milestone.reasoning}
                </p>
              </div>
            )}
          </div>
        )}
      </PortPanel>

      {/* Settlement Record */}
      {isSettled && (
        <PortPanel label="Settlement Record" glow="amber" padding="sm">
          <div className="space-y-2">
            <Row label="Verdict"     value={milestone.verdict.replace(/_/g, " ")} />
            <Row label="Bond Action" value={milestone.bond_action || "n/a"} />
            {milestone.settled_at && (
              <Row
                label="Settled At"
                value={new Date(milestone.settled_at).toLocaleString("en-US", {
                  dateStyle: "medium", timeStyle: "short",
                })}
              />
            )}
          </div>
        </PortPanel>
      )}

      {/* CTA: proceed to settlement */}
      {!isSettled && milestone.verdict && milestone.verdict !== "NEEDS_HUMAN_REVIEW" && (isSponsor || isBuilder) && (
        <Link href={`/app/milestones/${milestone.milestone_id}/settle`}>
          <Button variant="primary" size="lg">Proceed to Settlement</Button>
        </Link>
      )}
      {!isSettled && milestone.verdict === "NEEDS_HUMAN_REVIEW" && (isSponsor || isBuilder) && (
        <Link href={`/app/milestones/${milestone.milestone_id}/settle`}>
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
