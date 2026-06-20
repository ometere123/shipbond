import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getMilestone } from "@/lib/data/milestones";
import { getSubmissionByMilestone } from "@/lib/data/submissions";
import { getEvidenceFilesAsBuilder, getEvidenceFilesAsSponsor, getSignedEvidenceUrl } from "@/lib/data/evidence";
import { tryGetSessionWallet } from "@/lib/get-session-wallet";
import { EmptyState } from "@/components/ui/EmptyState";
import { PortPanel } from "@/components/ui/PortPanel";
import { HashPlate } from "@/components/ui/HashPlate";

export const metadata = { title: "Evidence" };
export const dynamic = "force-dynamic";

export default async function EvidencePage({ params }: { params: Promise<{ milestoneId: string }> }) {
  const { milestoneId } = await params;
  const [milestone, submission, session] = await Promise.all([
    getMilestone(milestoneId),
    getSubmissionByMilestone(milestoneId),
    tryGetSessionWallet(),
  ]);

  if (!milestone) notFound();
  if (!session) redirect("/connect");
  if (!submission) {
    return <EmptyState title="No evidence yet" description="A builder has not submitted evidence for this milestone." />;
  }

  const isSponsor = milestone.sponsor_wallet === session.walletAddress;
  const isBuilder = submission.builder_wallet === session.walletAddress;
  if (!isSponsor && !isBuilder) {
    return <EmptyState title="Evidence is restricted" description="Only the sponsor and accepted builder can inspect this evidence." />;
  }

  const files = isSponsor
    ? await getEvidenceFilesAsSponsor(submission.id, session.walletAddress)
    : await getEvidenceFilesAsBuilder(submission.id, session.walletAddress);

  const signedFiles = await Promise.all(files.map(async (file) => ({
    ...file,
    url: await getSignedEvidenceUrl(file.storage_path),
  })));

  const evidenceRefs = submission.evidence_refs && typeof submission.evidence_refs === "object"
    ? submission.evidence_refs as Record<string, unknown>
    : null;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Link href={`/app/port/${milestone.id}`} className="inline-flex items-center gap-2 font-mono text-meta text-steel hover:text-fog">
        <ArrowLeft size={13} />
        Back to milestone
      </Link>

      <div>
        <p className="font-mono text-meta text-steel uppercase tracking-widest mb-2">Evidence Vault</p>
        <h1 className="font-display font-bold text-page-title text-signal">{milestone.title}</h1>
      </div>

      <PortPanel label="Public Evidence Packet" glow="cyan">
        <div className="space-y-3">
          {submission.evidence_digest && (
            <div className="flex items-center gap-3 border-b border-port-border pb-3">
              <span className="font-mono text-meta text-steel uppercase tracking-wider">Digest</span>
              <HashPlate value={submission.evidence_digest} type="hash" explorerType="none" />
            </div>
          )}
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

      <PortPanel label="Private Files" glow="violet">
        {signedFiles.length === 0 ? (
          <p className="font-body text-table text-steel">No private files uploaded.</p>
        ) : (
          <div className="divide-y divide-port-border">
            {signedFiles.map((file) => (
              <a
                key={file.id}
                href={file.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between gap-4 py-3 font-body text-table text-fog hover:text-signal"
              >
                <span>{file.file_name}</span>
                <span className="font-mono text-meta text-steel">{file.size_bytes ?? 0} bytes</span>
              </a>
            ))}
          </div>
        )}
      </PortPanel>
    </div>
  );
}
