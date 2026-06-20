import { notFound } from "next/navigation";
import { getMilestone } from "@/lib/data/milestones";
import { getSubmissionByMilestone } from "@/lib/data/submissions";
import { PortPanel } from "@/components/ui/PortPanel";
import { CargoStatusBadge } from "@/components/milestone/CargoStatusBadge";
import { ProofRail } from "@/components/milestone/ProofRail";
import { ContractTraceStrip } from "@/components/milestone/ContractTraceStrip";
import { Button } from "@/components/ui/Button";
import { HashPlate } from "@/components/ui/HashPlate";
import { SyncVerdictButton } from "@/components/milestone/SyncVerdictButton";
import { formatGEN, shortenAddress } from "@/lib/utils";
import { Coins, Lock, Calendar, FileText, ArrowLeft, Shield, Gavel } from "lucide-react";
import Link from "next/link";
import type { Metadata } from "next";
import { tryGetSessionWallet } from "@/lib/get-session-wallet";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const milestone = await getMilestone(id);
  if (!milestone) return { title: "Milestone Not Found" };
  return { title: milestone.title };
}

export const dynamic = "force-dynamic";

export default async function MilestoneManifestPage({ params }: Props) {
  const { id } = await params;
  const [milestone, submission, session] = await Promise.all([
    getMilestone(id),
    getSubmissionByMilestone(id),
    tryGetSessionWallet(),
  ]);

  if (!milestone) notFound();

  const reward = formatGEN(BigInt(milestone.reward_wei));
  const bond   = formatGEN(BigInt(milestone.bond_wei));

  const isSponsor = session?.walletAddress === milestone.sponsor_wallet;
  const isBuilder = submission?.builder_wallet === session?.walletAddress;
  const isOpen    = milestone.status === "open";

  const txEntries: { label: string; hash: string; type: "tx" | "address" | "hash" | "contract" }[] = [];
  if (milestone.contract_address) {
    txEntries.push({ label: "Contract", hash: milestone.contract_address, type: "address" });
  }

  if (submission?.bond_tx_hash) {
    txEntries.push({ label: "Bond TX", hash: submission.bond_tx_hash, type: "tx" });
  }
  if (submission?.submit_tx_hash) {
    txEntries.push({ label: "Submit TX", hash: submission.submit_tx_hash, type: "tx" });
  }

  return (
    <div className="max-w-3xl mx-auto">
      {/* Back */}
      <Link
        href="/app/port"
        className="inline-flex items-center gap-2 font-mono text-meta text-steel hover:text-fog transition-colors mb-6"
      >
        <ArrowLeft size={13} />
        Back to Port
      </Link>

      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-3 flex-wrap">
          <CargoStatusBadge status={milestone.status} />
          {isSponsor && (
            <span className="font-mono text-meta text-amber-bond border border-amber-bond/30 bg-amber-bond/8 rounded-badge px-2 py-0.5 uppercase tracking-wider">
              Your Milestone
            </span>
          )}
          {isBuilder && (
            <span className="font-mono text-meta text-cyan-evidence border border-cyan-evidence/30 bg-cyan-evidence/8 rounded-badge px-2 py-0.5 uppercase tracking-wider">
              Your Submission
            </span>
          )}
        </div>
        <h1 className="font-display font-bold text-2xl text-signal leading-snug mb-2">
          {milestone.title}
        </h1>
        <div className="flex items-center gap-2 text-steel">
          <span className="font-mono text-meta">Sponsor:</span>
          <span className="font-mono text-meta text-fog">{shortenAddress(milestone.sponsor_wallet, 6)}</span>
        </div>
      </div>

      {/* Proof Rail */}
      <PortPanel glow="amber" className="mb-6" padding="sm">
        <ProofRail status={milestone.status} className="px-2" />
      </PortPanel>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {/* Reward */}
        <StatCard
          icon={<Coins size={16} className="text-amber-bond" />}
          label="Reward"
          value={`${reward} GEN`}
          sub="Paid on passing verdict"
          color="amber"
        />
        {/* Bond */}
        <StatCard
          icon={<Lock size={16} className="text-cyan-evidence" />}
          label="Builder Bond"
          value={`${bond} GEN`}
          sub="Returned on pass · Slashed on fail"
          color="cyan"
        />
        {/* Deadline */}
        <StatCard
          icon={<Calendar size={16} className="text-violet-consensus" />}
          label="Deadline"
          value={milestone.deadline
            ? new Date(milestone.deadline).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
            : "No deadline"
          }
          sub={milestone.deadline ? "UTC" : "Open-ended"}
          color="violet"
        />
      </div>

      {/* Description / Terms */}
      <PortPanel label="Milestone Terms" className="mb-4">
        <div className="space-y-4">
          <p className="font-body text-base text-fog leading-relaxed whitespace-pre-wrap">
            {milestone.description}
          </p>
          {milestone.terms_hash && (
            <div className="flex items-center gap-3 pt-3 border-t border-port-border/40">
              <Shield size={13} className="text-violet-consensus shrink-0" />
              <span className="font-mono text-meta text-steel">Terms Hash</span>
              <HashPlate value={milestone.terms_hash} type="hash" explorerType="none" />
            </div>
          )}
        </div>
      </PortPanel>

      {/* On-chain trace */}
      {txEntries.length > 0 && (
        <PortPanel label="On-Chain Trace" glow="violet" className="mb-4">
          <ContractTraceStrip entries={txEntries} />
        </PortPanel>
      )}

      {/* Submission status (builder view) */}
      {submission && (
        <PortPanel label="Your Submission" glow="cyan" className="mb-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-mono text-meta text-steel uppercase tracking-wider">Status</span>
              <span className="font-mono text-meta text-cyan-evidence uppercase">
                {submission.status.replace(/_/g, " ")}
              </span>
            </div>
            {submission.evidence_digest && (
              <div className="flex items-center justify-between">
                <span className="font-mono text-meta text-steel uppercase tracking-wider">Evidence Digest</span>
                <HashPlate value={submission.evidence_digest} type="hash" explorerType="none" />
              </div>
            )}
          </div>
        </PortPanel>
      )}

      {/* Action buttons */}
      <div className="flex flex-wrap gap-3">
        {/* Open milestone — builder can accept */}
        {isOpen && !submission && session && !isSponsor && (
          <Link href={`/app/milestones/${milestone.id}/accept`}>
            <Button variant="primary" size="lg">
              <Lock size={16} />
              Lock Bond &amp; Accept
            </Button>
          </Link>
        )}

        {/* Builder has accepted — submit evidence */}
        {isBuilder && milestone.status === "accepted" && (
          <Link href={`/app/milestones/${milestone.id}/submit`}>
            <Button variant="genlayer" size="lg">
              <FileText size={16} />
              Submit Evidence
            </Button>
          </Link>
        )}

        {/* Builder submitted — request review */}
        {(isBuilder || isSponsor) && milestone.status === "submitted" && (
          <Link href={`/app/milestones/${milestone.id}/review`}>
            <Button variant="genlayer" size="lg">
              <Gavel size={16} />
              Request GenLayer Review
            </Button>
          </Link>
        )}

        {/* Sponsor can view evidence when submitted */}
        {isSponsor && submission && (
          <Link href={`/app/sponsor/milestones/${milestone.id}/submissions`}>
            <Button variant="secondary" size="lg">
              <FileText size={16} />
              Review Submission
            </Button>
          </Link>
        )}

        {(isSponsor || isBuilder) && milestone.status === "reviewing" && (
          <>
            <SyncVerdictButton milestoneId={milestone.id} />
            <Link href={`/app/milestones/${milestone.id}/settle`}>
              <Button variant="primary" size="lg">
                Settle
              </Button>
            </Link>
          </>
        )}

        {(isSponsor || isBuilder) && milestone.status === "settled" && (
          <Link href="/app/verdicts">
            <Button variant="secondary" size="lg">
              View Verdict Registry
            </Button>
          </Link>
        )}

        {/* Not signed in */}
        {!session && isOpen && (
          <Link href="/connect">
            <Button variant="primary" size="lg">
              Connect Wallet to Accept
            </Button>
          </Link>
        )}
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  sub,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub: string;
  color: "amber" | "cyan" | "violet";
}) {
  const border =
    color === "amber" ? "border-amber-bond/20 bg-amber-bond/5" :
    color === "cyan"  ? "border-cyan-evidence/20 bg-cyan-evidence/5" :
                        "border-violet-consensus/20 bg-violet-consensus/5";
  const valueColor =
    color === "amber" ? "text-amber-bond" :
    color === "cyan"  ? "text-cyan-evidence" :
                        "text-violet-consensus";

  return (
    <div className={`rounded-card border p-4 ${border}`}>
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <span className="font-mono text-meta text-steel uppercase tracking-wider">{label}</span>
      </div>
      <div className={`font-display font-bold text-lg ${valueColor} mb-1`}>{value}</div>
      <div className="font-body text-meta text-steel/70">{sub}</div>
    </div>
  );
}
