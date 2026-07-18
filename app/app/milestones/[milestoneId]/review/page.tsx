import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getMilestone } from "@/lib/data/milestones";
import { tryGetSessionWallet } from "@/lib/get-session-wallet";
import { RequestReviewPanel } from "@/components/milestone/RequestReviewPanel";
import { EmptyState } from "@/components/ui/EmptyState";

export const metadata = { title: "Request Review" };
export const dynamic = "force-dynamic";

export default async function RequestReviewPage({ params }: { params: Promise<{ milestoneId: string }> }) {
  const { milestoneId } = await params;
  const [milestone, session] = await Promise.all([
    getMilestone(milestoneId),
    tryGetSessionWallet(),
  ]);

  if (!milestone) notFound();
  if (!session) redirect("/connect");

  const isSponsor = session.walletAddress.toLowerCase() === milestone.sponsor.toLowerCase();

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Link href={`/app/port/${milestone.milestone_id}`} className="inline-flex items-center gap-2 font-mono text-meta text-steel hover:text-fog">
        <ArrowLeft size={13} />
        Back to milestone
      </Link>

      <div>
        <p className="font-mono text-meta text-steel uppercase tracking-widest mb-2">Consensus Chamber</p>
        <h1 className="font-display font-bold text-page-title text-signal">Request GenLayer Review</h1>
      </div>

      {!isSponsor ? (
        <EmptyState title="Sponsor only" description="Only the milestone sponsor can request a GenLayer review." />
      ) : !milestone.evidence_digest ? (
        <EmptyState title="No evidence submitted" description="Evidence must be submitted before GenLayer can judge it." />
      ) : milestone.status !== "SUBMITTED" ? (
        <EmptyState title="Review is not available" description={`Current milestone status: ${milestone.status}`} />
      ) : (
        <RequestReviewPanel
          milestoneId={milestone.milestone_id}
          onChainId={milestone.milestone_id}
          evidenceDigest={milestone.evidence_digest}
        />
      )}
    </div>
  );
}
