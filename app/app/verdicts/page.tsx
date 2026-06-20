import Link from "next/link";
import { Gavel } from "lucide-react";
import { listReviews } from "@/lib/data/reviews";
import { listAllSubmissions } from "@/lib/data/submissions";
import { listAllMilestones } from "@/lib/data/milestones";
import { EmptyState } from "@/components/ui/EmptyState";
import { PortPanel } from "@/components/ui/PortPanel";
import { Badge } from "@/components/ui/Badge";
import { HashPlate } from "@/components/ui/HashPlate";

export const metadata = { title: "Verdict Registry" };
export const dynamic = "force-dynamic";

export default async function VerdictRegistryPage() {
  const [reviews, submissions, milestones] = await Promise.all([
    listReviews(),
    listAllSubmissions(),
    listAllMilestones(),
  ]);
  const submissionMap = new Map(submissions.map((item) => [item.id, item]));
  const milestoneMap = new Map(milestones.map((item) => [item.id, item]));

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-display font-bold text-page-title text-signal">Verdict Registry</h1>
        <p className="font-body text-base text-fog mt-2">Public GenLayer verdicts mirrored from the protocol contract.</p>
      </div>

      {reviews.length === 0 ? (
        <EmptyState icon={<Gavel size={28} />} title="No verdicts yet" description="Verdicts appear here after GenLayer review is requested and synced." />
      ) : (
        <div className="space-y-3">
          {reviews.map((review) => {
            const submission = submissionMap.get(review.submission_id);
            const milestone = submission ? milestoneMap.get(submission.milestone_id) : null;
            return (
              <PortPanel key={review.id} padding="sm" glow={review.verdict === "failed" ? "none" : "violet"}>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant={
                        review.verdict === "passed" ? "lime" :
                        review.verdict === "partial_pass" ? "partial" :
                        review.verdict === "failed" ? "red" : "steel"
                      }>
                        {(review.verdict ?? "pending").replace(/_/g, " ")}
                      </Badge>
                      <span className="font-mono text-meta text-steel uppercase">{review.bond_action ?? "pending"}</span>
                    </div>
                    <Link href={milestone ? `/app/port/${milestone.id}` : "#"} className="font-display text-card-title text-signal hover:text-amber-bond">
                      {milestone?.title ?? "Unknown milestone"}
                    </Link>
                    {review.reasoning_summary && <p className="font-body text-table text-fog mt-1 max-w-3xl">{review.reasoning_summary}</p>}
                  </div>
                  {review.request_tx_hash && <HashPlate value={review.request_tx_hash} type="tx" />}
                </div>
              </PortPanel>
            );
          })}
        </div>
      )}
    </div>
  );
}
