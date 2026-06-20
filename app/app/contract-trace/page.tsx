import Link from "next/link";
import { Activity } from "lucide-react";
import { listAllMilestones } from "@/lib/data/milestones";
import { listAllSubmissions } from "@/lib/data/submissions";
import { listReviews } from "@/lib/data/reviews";
import { listSettlements } from "@/lib/data/settlements";
import { EmptyState } from "@/components/ui/EmptyState";
import { PortPanel } from "@/components/ui/PortPanel";
import { HashPlate } from "@/components/ui/HashPlate";

export const metadata = { title: "Contract Trace" };
export const dynamic = "force-dynamic";

export default async function ContractTracePage() {
  const [milestones, submissions, reviews, settlements] = await Promise.all([
    listAllMilestones(),
    listAllSubmissions(),
    listReviews(),
    listSettlements(),
  ]);
  const submissionByMilestone = new Map(submissions.map((item) => [item.milestone_id, item]));
  const reviewBySubmission = new Map(reviews.map((item) => [item.submission_id, item]));
  const settlementByMilestone = new Map(settlements.map((item) => [item.milestone_id, item]));

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-display font-bold text-page-title text-signal">Contract Trace</h1>
        <p className="font-body text-base text-fog mt-2">Milestone-level chain trail across funding, bond, evidence, review, and settlement.</p>
      </div>

      {milestones.length === 0 ? (
        <EmptyState icon={<Activity size={28} />} title="No contract activity" description="Create a milestone to begin the trace." />
      ) : (
        <div className="space-y-4">
          {milestones.map((milestone) => {
            const submission = submissionByMilestone.get(milestone.id);
            const review = submission ? reviewBySubmission.get(submission.id) : null;
            const settlement = settlementByMilestone.get(milestone.id);
            return (
              <PortPanel key={milestone.id} label={milestone.status.toUpperCase()} padding="sm">
                <div className="space-y-3">
                  <Link href={`/app/port/${milestone.id}`} className="font-display text-card-title text-signal hover:text-amber-bond">
                    {milestone.title}
                  </Link>
                  <Trace label="Protocol" value={milestone.contract_address} type="address" />
                  <Trace label="Terms Hash" value={milestone.terms_hash} type="hash" explorerType="none" />
                  <Trace label="Bond TX" value={submission?.bond_tx_hash ?? null} type="tx" />
                  <Trace label="Submit TX" value={submission?.submit_tx_hash ?? null} type="tx" />
                  <Trace label="Review TX" value={review?.request_tx_hash ?? null} type="tx" />
                  <Trace label="Settlement TX" value={settlement?.settle_tx_hash ?? null} type="tx" />
                </div>
              </PortPanel>
            );
          })}
        </div>
      )}
    </div>
  );
}

function Trace({
  label,
  value,
  type,
  explorerType = "chain",
}: {
  label: string;
  value: string | null | undefined;
  type: "tx" | "address" | "hash";
  explorerType?: "chain" | "bradbury" | "none";
}) {
  if (!value) return null;
  return (
    <div className="flex items-center justify-between gap-4 border-t border-port-border/40 pt-2">
      <span className="font-mono text-meta text-steel uppercase tracking-wider">{label}</span>
      <HashPlate value={value} type={type} explorerType={explorerType} />
    </div>
  );
}
