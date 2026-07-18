import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getMilestone } from "@/lib/data/milestones";
import { tryGetSessionWallet } from "@/lib/get-session-wallet";
import { EmptyState } from "@/components/ui/EmptyState";
import { PortPanel } from "@/components/ui/PortPanel";
import { HashPlate } from "@/components/ui/HashPlate";

export const metadata = { title: "Evidence" };
export const dynamic = "force-dynamic";

export default async function EvidencePage({ params }: { params: Promise<{ milestoneId: string }> }) {
  const { milestoneId } = await params;
  const [milestone, session] = await Promise.all([
    getMilestone(milestoneId),
    tryGetSessionWallet(),
  ]);

  if (!milestone) notFound();
  if (!session) redirect("/connect");
  if (!milestone.evidence_digest) {
    return <EmptyState title="No evidence yet" description="A builder has not submitted evidence for this milestone." />;
  }

  const wallet = session.walletAddress.toLowerCase();
  const isSponsor = milestone.sponsor.toLowerCase() === wallet;
  const isBuilder = !!milestone.builder && milestone.builder.toLowerCase() === wallet;
  if (!isSponsor && !isBuilder) {
    return <EmptyState title="Evidence is restricted" description="Only the sponsor and accepted builder can inspect this evidence." />;
  }

  let evidenceRefs: Record<string, unknown> | null = null;
  try {
    evidenceRefs = milestone.evidence_refs_json ? JSON.parse(milestone.evidence_refs_json) : null;
  } catch {
    evidenceRefs = null;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Link href={`/app/port/${milestone.milestone_id}`} className="inline-flex items-center gap-2 font-mono text-meta text-steel hover:text-fog">
        <ArrowLeft size={13} />
        Back to milestone
      </Link>

      <div>
        <p className="font-mono text-meta text-steel uppercase tracking-widest mb-2">Evidence Vault</p>
        <h1 className="font-display font-bold text-page-title text-signal">{milestone.title}</h1>
      </div>

      <PortPanel label="Public Evidence Packet" glow="cyan">
        <div className="space-y-3">
          <div className="flex items-center gap-3 border-b border-port-border pb-3">
            <span className="font-mono text-meta text-steel uppercase tracking-wider">Digest</span>
            <HashPlate value={milestone.evidence_digest} type="hash" explorerType="none" />
          </div>
          {evidenceRefs ? (
            Object.entries(evidenceRefs).map(([key, value]) => (
              <div key={key} className="grid gap-1 border-b border-port-border/40 pb-2 last:border-0">
                <span className="font-mono text-meta text-steel uppercase tracking-wider">{key.replace(/_/g, " ")}</span>
                <span className="font-body text-table text-fog break-words">
                  {Array.isArray(value) ? value.join("; ") : String(value)}
                </span>
              </div>
            ))
          ) : (
            <p className="font-body text-table text-steel">No public evidence packet has been recorded.</p>
          )}
        </div>
      </PortPanel>
    </div>
  );
}
