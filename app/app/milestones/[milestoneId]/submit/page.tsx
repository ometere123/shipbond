import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getMilestone } from "@/lib/data/milestones";
import { tryGetSessionWallet } from "@/lib/get-session-wallet";
import { EvidenceSubmitForm } from "@/components/milestone/EvidenceSubmitForm";
import { EmptyState } from "@/components/ui/EmptyState";

export const metadata = { title: "Evidence Vault" };
export const dynamic = "force-dynamic";

export default async function EvidenceVaultPage({ params }: { params: Promise<{ milestoneId: string }> }) {
  const { milestoneId } = await params;
  const [milestone, session] = await Promise.all([
    getMilestone(milestoneId),
    tryGetSessionWallet(),
  ]);

  if (!milestone) notFound();
  if (!session) redirect("/connect");

  const isBuilder = !!milestone.builder && milestone.builder.toLowerCase() === session.walletAddress.toLowerCase();

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Link href={`/app/port/${milestone.milestone_id}`} className="inline-flex items-center gap-2 font-mono text-meta text-steel hover:text-fog">
        <ArrowLeft size={13} />
        Back to milestone
      </Link>

      <div>
        <p className="font-mono text-meta text-steel uppercase tracking-widest mb-2">Role: Builder</p>
        <h1 className="font-display font-bold text-page-title text-signal">Evidence Vault</h1>
        <p className="font-body text-base text-fog mt-2 max-w-2xl">
          Submit the public evidence packet GenLayer validators will fetch and judge.
        </p>
      </div>

      {!milestone.builder ? (
        <EmptyState title="No bonded builder" description="Accept the milestone and lock the builder bond before submitting evidence." />
      ) : !isBuilder ? (
        <EmptyState title="Only the accepted builder can submit evidence" description="This page is restricted to the wallet that locked the bond." />
      ) : milestone.status !== "ACCEPTED" ? (
        <EmptyState title="Evidence already moved forward" description={`Current milestone status: ${milestone.status}`} />
      ) : (
        <EvidenceSubmitForm milestoneId={milestone.milestone_id} onChainId={milestone.milestone_id} title={milestone.title} />
      )}
    </div>
  );
}
