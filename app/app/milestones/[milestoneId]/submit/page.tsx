import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getMilestone } from "@/lib/data/milestones";
import { getSubmissionByMilestone } from "@/lib/data/submissions";
import { tryGetSessionWallet } from "@/lib/get-session-wallet";
import { EvidenceSubmitForm } from "@/components/milestone/EvidenceSubmitForm";
import { EmptyState } from "@/components/ui/EmptyState";

export const metadata = { title: "Evidence Vault" };
export const dynamic = "force-dynamic";

export default async function EvidenceVaultPage({ params }: { params: Promise<{ milestoneId: string }> }) {
  const { milestoneId } = await params;
  const [milestone, submission, session] = await Promise.all([
    getMilestone(milestoneId),
    getSubmissionByMilestone(milestoneId),
    tryGetSessionWallet(),
  ]);

  if (!milestone) notFound();
  if (!session) redirect("/connect");

  const isBuilder = submission?.builder_wallet === session.walletAddress;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Link href={`/app/port/${milestone.id}`} className="inline-flex items-center gap-2 font-mono text-meta text-steel hover:text-fog">
        <ArrowLeft size={13} />
        Back to milestone
      </Link>

      <div>
        <p className="font-mono text-meta text-steel uppercase tracking-widest mb-2">Role: Builder</p>
        <h1 className="font-display font-bold text-page-title text-signal">Evidence Vault</h1>
        <p className="font-body text-base text-fog mt-2 max-w-2xl">
          Submit the public evidence packet GenLayer can judge, plus optional private files for sponsor inspection.
        </p>
      </div>

      {!submission ? (
        <EmptyState title="No bonded submission" description="Accept the milestone and lock the builder bond before submitting evidence." />
      ) : !isBuilder ? (
        <EmptyState title="Only the accepted builder can submit evidence" description="This page is restricted to the wallet that locked the bond." />
      ) : !milestone.on_chain_id ? (
        <EmptyState title="Missing on-chain ID" description="The milestone must be linked to GenLayer before evidence can be submitted." />
      ) : milestone.status !== "accepted" ? (
        <EmptyState title="Evidence already moved forward" description={`Current milestone status: ${milestone.status}`} />
      ) : (
        <EvidenceSubmitForm milestoneId={milestone.id} onChainId={milestone.on_chain_id} title={milestone.title} />
      )}
    </div>
  );
}
