import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getMilestone } from "@/lib/data/milestones";
import { getSubmissionAsSponsor } from "@/lib/data/submissions";
import { getReviewForSubmission } from "@/lib/data/reviews";
import { tryGetSessionWallet } from "@/lib/get-session-wallet";
import { EmptyState } from "@/components/ui/EmptyState";
import { PortPanel } from "@/components/ui/PortPanel";
import { Button } from "@/components/ui/Button";
import { HashPlate } from "@/components/ui/HashPlate";
import { shortenAddress } from "@/lib/utils";

export const metadata = { title: "Submissions Room" };
export const dynamic = "force-dynamic";

export default async function SubmissionsRoomPage({ params }: { params: Promise<{ milestoneId: string }> }) {
  const { milestoneId } = await params;
  const session = await tryGetSessionWallet();
  if (!session) redirect("/connect");

  const milestone = await getMilestone(milestoneId);
  if (!milestone) notFound();
  if (milestone.sponsor_wallet !== session.walletAddress) {
    return <EmptyState title="Sponsor access required" description="Only the milestone sponsor can inspect submissions here." />;
  }

  const submission = await getSubmissionAsSponsor(milestoneId, session.walletAddress);
  const review = submission ? await getReviewForSubmission(submission.id) : null;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Link href={`/app/port/${milestone.id}`} className="inline-flex items-center gap-2 font-mono text-meta text-steel hover:text-fog">
        <ArrowLeft size={13} />
        Back to milestone
      </Link>

      <div>
        <p className="font-mono text-meta text-steel uppercase tracking-widest mb-2">Role: Sponsor</p>
        <h1 className="font-display font-bold text-page-title text-signal">Submissions Room</h1>
        <p className="font-body text-base text-fog mt-2">{milestone.title}</p>
      </div>

      {!submission ? (
        <EmptyState title="No builder submission" description="No builder has locked the bond for this milestone yet." />
      ) : (
        <PortPanel label="Builder Submission" glow="cyan">
          <div className="space-y-3">
            <Row label="Builder" value={shortenAddress(submission.builder_wallet, 6)} />
            <Row label="Status" value={submission.status.replace(/_/g, " ")} />
            {submission.bond_tx_hash && <Trace label="Bond TX" value={submission.bond_tx_hash} />}
            {submission.evidence_digest && <Trace label="Evidence Digest" value={submission.evidence_digest} type="hash" />}
            {review?.verdict && <Row label="Verdict" value={review.verdict.replace(/_/g, " ")} />}
            <div className="flex flex-wrap gap-2 pt-3 border-t border-port-border">
              <Link href={`/app/milestones/${milestone.id}/evidence`}><Button variant="secondary" size="sm">View Evidence</Button></Link>
              {milestone.status === "submitted" && <Link href={`/app/milestones/${milestone.id}/review`}><Button variant="genlayer" size="sm">Request Review</Button></Link>}
              {milestone.status === "reviewing" && <Link href={`/app/milestones/${milestone.id}/settle`}><Button variant="primary" size="sm">Settle</Button></Link>}
            </div>
          </div>
        </PortPanel>
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="font-mono text-meta text-steel uppercase tracking-wider">{label}</span>
      <span className="font-body text-table text-fog capitalize">{value}</span>
    </div>
  );
}

function Trace({ label, value, type = "tx" }: { label: string; value: string; type?: "tx" | "hash" }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="font-mono text-meta text-steel uppercase tracking-wider">{label}</span>
      <HashPlate value={value} type={type} explorerType={type === "hash" ? "none" : "bradbury"} />
    </div>
  );
}
