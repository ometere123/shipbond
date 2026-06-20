import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getSubmission } from "@/lib/data/submissions";
import { getMilestone } from "@/lib/data/milestones";
import { getReviewForSubmission } from "@/lib/data/reviews";
import { PortPanel } from "@/components/ui/PortPanel";
import { Badge } from "@/components/ui/Badge";
import { HashPlate } from "@/components/ui/HashPlate";
import { SourceOfTruthBadge } from "@/components/consensus/VerdictStamp";

export const metadata = { title: "Consensus Chamber" };
export const dynamic = "force-dynamic";

export default async function ConsensusChamberPage({ params }: { params: Promise<{ submissionId: string }> }) {
  const { submissionId } = await params;
  const submission = await getSubmission(submissionId);
  if (!submission) notFound();

  const [milestone, review] = await Promise.all([
    getMilestone(submission.milestone_id),
    getReviewForSubmission(submission.id),
  ]);

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Link href={milestone ? `/app/port/${milestone.id}` : "/app/verdicts"} className="inline-flex items-center gap-2 font-mono text-meta text-steel hover:text-fog">
        <ArrowLeft size={13} />
        Back
      </Link>

      <div>
        <p className="font-mono text-meta text-steel uppercase tracking-widest mb-2">Consensus Chamber</p>
        <h1 className="font-display font-bold text-page-title text-signal">{milestone?.title ?? "Submission Review"}</h1>
      </div>

      <SourceOfTruthBadge />

      <PortPanel label="GenLayer Verdict" glow="violet">
        {!review ? (
          <p className="font-body text-table text-steel">No review has been requested for this submission.</p>
        ) : (
          <div className="space-y-3">
            <Badge variant={
              review.verdict === "passed" ? "lime" :
              review.verdict === "partial_pass" ? "partial" :
              review.verdict === "failed" ? "red" : "steel"
            }>
              {(review.verdict ?? "pending").replace(/_/g, " ")}
            </Badge>
            <Row label="Bond Action" value={review.bond_action ?? "pending"} />
            <Row label="Consensus" value={review.consensus_reached ? "reached" : "pending"} />
            {review.reasoning_summary && <Row label="Reasoning" value={review.reasoning_summary} />}
            {review.request_tx_hash && (
              <div className="flex items-center justify-between gap-4 border-t border-port-border pt-3">
                <span className="font-mono text-meta text-steel uppercase tracking-wider">Review TX</span>
                <HashPlate value={review.request_tx_hash} type="tx" />
              </div>
            )}
          </div>
        )}
      </PortPanel>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid gap-1 border-t border-port-border pt-3 first:border-0 first:pt-0">
      <span className="font-mono text-meta text-steel uppercase tracking-wider">{label}</span>
      <span className="font-body text-table text-fog">{value}</span>
    </div>
  );
}
