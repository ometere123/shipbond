import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getMilestone } from "@/lib/data/milestones";
import { getSubmissionByMilestone } from "@/lib/data/submissions";
import { tryGetSessionWallet } from "@/lib/get-session-wallet";
import { updateOnChainId } from "@/lib/data/milestones";
import { resolveCreatedMilestoneId } from "@/lib/genlayer/resolve-milestone-id";
import { SHIPBOND_CONTRACT } from "@/lib/genlayer/studionet-chain";
import { AcceptMilestonePanel } from "@/components/milestone/AcceptMilestonePanel";
import { EmptyState } from "@/components/ui/EmptyState";

export const metadata = { title: "Accept Milestone" };
export const dynamic = "force-dynamic";

export default async function AcceptMilestonePage({ params }: { params: Promise<{ milestoneId: string }> }) {
  const { milestoneId } = await params;
  const [initialMilestone, submission, session] = await Promise.all([
    getMilestone(milestoneId),
    getSubmissionByMilestone(milestoneId),
    tryGetSessionWallet(),
  ]);

  if (!initialMilestone) notFound();
  if (!session) redirect("/connect");

  let milestone = initialMilestone;
  if (!milestone.on_chain_id && milestone.terms_hash) {
    const recoveredOnChainId = await resolveCreatedMilestoneId({
      sponsorWallet: milestone.sponsor_wallet,
      termsHash: milestone.terms_hash,
      title: milestone.title,
      rewardWei: milestone.reward_wei,
      bondWei: milestone.bond_wei,
      maxRetries: 2,
      retryDelayMs: 1000,
    });

    if (recoveredOnChainId) {
      await updateOnChainId(milestone.id, recoveredOnChainId, SHIPBOND_CONTRACT, "");
      milestone = {
        ...milestone,
        on_chain_id: recoveredOnChainId,
        contract_address: SHIPBOND_CONTRACT,
      };
    }
  }

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
        <EmptyState
          title="Waiting for on-chain link"
          description="The sponsor transaction exists locally but has not been linked to a GenLayer milestone ID yet. Refresh this page in a few seconds; ShipBond now retries the link automatically."
          actionHref={{ label: "Refresh milestone", href: `/app/milestones/${milestone.id}/accept` }}
        />
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
