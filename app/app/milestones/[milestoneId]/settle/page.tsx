import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getMilestone } from "@/lib/data/milestones";
import { tryGetSessionWallet } from "@/lib/get-session-wallet";
import { EmptyState } from "@/components/ui/EmptyState";
import { PortPanel } from "@/components/ui/PortPanel";
import { SettlementActionsPanel } from "@/components/milestone/SettlementActionsPanel";

export const metadata = { title: "Settlement" };
export const dynamic = "force-dynamic";

export default async function SettlementPage({ params }: { params: Promise<{ milestoneId: string }> }) {
  const { milestoneId } = await params;
  const [milestone, session] = await Promise.all([
    getMilestone(milestoneId),
    tryGetSessionWallet(),
  ]);

  if (!milestone) notFound();
  if (!session) redirect("/connect");

  const wallet = session.walletAddress.toLowerCase();
  const isSponsor = wallet === milestone.sponsor.toLowerCase();
  const isBuilder = !!milestone.builder && wallet === milestone.builder.toLowerCase();

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Link href={`/app/port/${milestone.milestone_id}`} className="inline-flex items-center gap-2 font-mono text-meta text-steel hover:text-fog">
        <ArrowLeft size={13} />
        Back to milestone
      </Link>

      <div>
        <p className="font-mono text-meta text-steel uppercase tracking-widest mb-2">Final Dock</p>
        <h1 className="font-display font-bold text-page-title text-signal">Settlement</h1>
      </div>

      {milestone.status === "SETTLED" ? (
        <PortPanel label="Already Settled" glow="amber">
          <p className="font-body text-table text-fog">
            This milestone has been settled. Verdict: <span className="font-mono text-signal uppercase">{milestone.verdict.replace(/_/g, " ")}</span>.
          </p>
        </PortPanel>
      ) : !milestone.builder ? (
        <EmptyState title="No submission" description="A builder must accept and submit evidence before settlement." />
      ) : !milestone.verdict ? (
        <EmptyState title="No verdict yet" description="Run GenLayer review before settlement." />
      ) : !isSponsor && !isBuilder ? (
        <EmptyState title="Restricted settlement" description="Only the sponsor or accepted builder can settle." />
      ) : (
        <SettlementActionsPanel
          milestoneId={milestone.milestone_id}
          onChainId={milestone.milestone_id}
          verdict={milestone.verdict}
          bondAction={milestone.bond_action}
          isSponsor={isSponsor}
          isBuilder={isBuilder}
        />
      )}
    </div>
  );
}
