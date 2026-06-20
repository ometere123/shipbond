import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getMilestone } from "@/lib/data/milestones";
import { getSubmissionByMilestone } from "@/lib/data/submissions";
import { tryGetSessionWallet } from "@/lib/get-session-wallet";
import { RequestReviewPanel } from "@/components/milestone/RequestReviewPanel";
import { EmptyState } from "@/components/ui/EmptyState";

export const metadata = { title: "Request Review" };
export const dynamic = "force-dynamic";

export default async function RequestReviewPage({ params }: { params: Promise<{ milestoneId: string }> }) {
  const { milestoneId } = await params;
  const [milestone, submission, session] = await Promise.all([
    getMilestone(milestoneId),
    getSubmissionByMilestone(milestoneId),
    tryGetSessionWallet(),
  ]);

  if (!milestone) notFound();
  if (!session) redirect("/connect");

  const isSponsor = session.walletAddress === milestone.sponsor_wallet;
  const isBuilder = submission?.builder_wallet === session.walletAddress;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Link href={`/app/port/${milestone.id}`} className="inline-flex items-center gap-2 font-mono text-meta text-steel hover:text-fog">
        <ArrowLeft size={13} />
        Back to milestone
      </Link>

      <div>
        <p className="font-mono text-meta text-steel uppercase tracking-widest mb-2">Consensus Chamber</p>
        <h1 className="font-display font-bold text-page-title text-signal">Request GenLayer Review</h1>
      </div>

      {!isSponsor ? (
        <EmptyState title="Sponsor only" description="Only the milestone sponsor can request a GenLayer review." />
      ) : !submission?.evidence_digest ? (
        <EmptyState title="No evidence submitted" description="Evidence must be submitted before GenLayer can judge it." />
      ) : !milestone.on_chain_id ? (
        <EmptyState title="Missing on-chain ID" description="The milestone must be linked to GenLayer before review." />
      ) : milestone.status !== "submitted" ? (
        <EmptyState title="Review is not available" description={`Current milestone status: ${milestone.status}`} />
      ) : (
        <RequestReviewPanel
          milestoneId={milestone.id}
          onChainId={milestone.on_chain_id}
          evidenceDigest={submission.evidence_digest}
        />
      )}
    </div>
  );
}
