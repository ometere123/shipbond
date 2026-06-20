import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getMilestone } from "@/lib/data/milestones";
import { getSubmissionByMilestone } from "@/lib/data/submissions";
import { getReviewForSubmission } from "@/lib/data/reviews";
import { getSettlementForMilestone } from "@/lib/data/settlements";
import { tryGetSessionWallet } from "@/lib/get-session-wallet";
import { EmptyState } from "@/components/ui/EmptyState";
import { PortPanel } from "@/components/ui/PortPanel";
import { SettlementActionsPanel } from "@/components/milestone/SettlementActionsPanel";

export const metadata = { title: "Settlement" };
export const dynamic = "force-dynamic";

export default async function SettlementPage({ params }: { params: Promise<{ milestoneId: string }> }) {
  const { milestoneId } = await params;
  const [milestone, submission, session] = await Promise.all([
    getMilestone(milestoneId),
    getSubmissionByMilestone(milestoneId),
    tryGetSessionWallet(),
  ]);

  if (!milestone) notFound();
  if (!session) redirect("/connect");

  const [review, settlement] = await Promise.all([
    submission ? getReviewForSubmission(submission.id) : Promise.resolve(null),
    getSettlementForMilestone(milestone.id),
  ]);

  const isSponsor = session.walletAddress === milestone.sponsor_wallet;
  const isBuilder = submission?.builder_wallet === session.walletAddress;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Link href={`/app/port/${milestone.id}`} className="inline-flex items-center gap-2 font-mono text-meta text-steel hover:text-fog">
        <ArrowLeft size={13} />
        Back to milestone
      </Link>

      <div>
        <p className="font-mono text-meta text-steel uppercase tracking-widest mb-2">Final Dock</p>
        <h1 className="font-display font-bold text-page-title text-signal">Settlement</h1>
      </div>

      {settlement ? (
        <PortPanel label="Already Settled" glow="amber">
          <p className="font-body text-table text-fog">
            This milestone has a recorded settlement. Verdict: <span className="font-mono text-signal uppercase">{settlement.verdict.replace(/_/g, " ")}</span>.
          </p>
        </PortPanel>
      ) : !submission ? (
        <EmptyState title="No submission" description="A builder must accept and submit evidence before settlement." />
      ) : !review?.verdict ? (
        <EmptyState title="No synced verdict" description="Run or sync GenLayer review before settlement." />
      ) : !isSponsor && !isBuilder ? (
        <EmptyState title="Restricted settlement" description="Only the sponsor or accepted builder can settle." />
      ) : !milestone.on_chain_id ? (
        <EmptyState title="Missing on-chain ID" description="The milestone must be linked to GenLayer before settlement." />
      ) : (
        <SettlementActionsPanel
          milestoneId={milestone.id}
          onChainId={milestone.on_chain_id}
          review={review}
          isSponsor={isSponsor}
          isBuilder={!!isBuilder}
        />
      )}
    </div>
  );
}
