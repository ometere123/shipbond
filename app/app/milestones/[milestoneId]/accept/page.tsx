import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getMilestone } from "@/lib/data/milestones";
import { getSubmissionByMilestone } from "@/lib/data/submissions";
import { tryGetSessionWallet } from "@/lib/get-session-wallet";
import { AcceptMilestonePanel } from "@/components/milestone/AcceptMilestonePanel";
import { EmptyState } from "@/components/ui/EmptyState";

export const metadata = { title: "Accept Milestone" };
export const dynamic = "force-dynamic";

export default async function AcceptMilestonePage({ params }: { params: Promise<{ milestoneId: string }> }) {
  const { milestoneId } = await params;
  const [milestone, submission, session] = await Promise.all([
    getMilestone(milestoneId),
    getSubmissionByMilestone(milestoneId),
    tryGetSessionWallet(),
  ]);

  if (!milestone) notFound();
  if (!session) redirect("/connect");

  const isSponsor = session.walletAddress === milestone.sponsor_wallet;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Link href={`/app/port/${milestone.id}`} className="inline-flex items-center gap-2 font-mono text-meta text-steel hover:text-fog">
        <ArrowLeft size={13} />
        Back to milestone
      </Link>

      {isSponsor ? (
        <EmptyState title="Sponsors cannot accept their own milestones" description="Connect with a builder wallet to lock the delivery bond." />
      ) : submission ? (
        <EmptyState title="Milestone already accepted" description="This milestone already has a bonded builder." />
      ) : !milestone.on_chain_id ? (
        <EmptyState title="Waiting for on-chain link" description="The sponsor transaction exists locally but has not been linked to a GenLayer milestone ID yet." />
      ) : milestone.status !== "open" ? (
        <EmptyState title="Milestone is not open" description={`Current status: ${milestone.status}`} />
      ) : (
        <AcceptMilestonePanel
          milestoneId={milestone.id}
          onChainId={milestone.on_chain_id}
          title={milestone.title}
          bondWei={milestone.bond_wei}
        />
      )}
    </div>
  );
}
