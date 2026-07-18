import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getMilestone } from "@/lib/data/milestones";
import { PortPanel } from "@/components/ui/PortPanel";
import { formatGEN, shortenAddress } from "@/lib/utils";

export const metadata = { title: "Settlement Receipt" };
export const dynamic = "force-dynamic";

// The dynamic segment is the on-chain milestone_id — settlement state lives
// on the milestone itself once status is SETTLED, there's no separate record.
export default async function SettlementReceiptPage({ params }: { params: Promise<{ settlementId: string }> }) {
  const { settlementId: milestoneId } = await params;
  const milestone = await getMilestone(milestoneId);
  if (!milestone || milestone.status !== "SETTLED") notFound();

  const payoutBps = Number(milestone.recommended_payout_bps || milestone.human_payout_bps || "0");
  const reward = BigInt(milestone.reward_wei);
  const bond = BigInt(milestone.bond_wei);
  const builderReward = (reward * BigInt(payoutBps)) / BigInt(10000);
  const bondAction = milestone.human_bond_action || milestone.bond_action;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Link href={`/app/port/${milestone.milestone_id}`} className="inline-flex items-center gap-2 font-mono text-meta text-steel hover:text-fog">
        <ArrowLeft size={13} />
        Back
      </Link>

      <div>
        <p className="font-mono text-meta text-steel uppercase tracking-widest mb-2">Final Payout Record</p>
        <h1 className="font-display font-bold text-page-title text-signal">{milestone.title}</h1>
      </div>

      <PortPanel label="Settlement Terms" glow="amber">
        <div className="space-y-3">
          <Row label="Verdict" value={milestone.verdict.replace(/_/g, " ")} />
          <Row label="Bond Action" value={bondAction} />
          <Row label="Builder" value={milestone.builder ? shortenAddress(milestone.builder, 6) : "Unknown"} />
          <Row label="Reward to Builder" value={`${formatGEN(builderReward)} GEN`} />
          {bondAction === "RETURN" && <Row label="Bond Returned" value={`${formatGEN(bond)} GEN`} />}
          {bondAction === "SLASH" && <Row label="Bond Slashed" value={`${formatGEN(bond)} GEN`} />}
          {milestone.settled_at && (
            <Row label="Settled At" value={new Date(milestone.settled_at).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" })} />
          )}
        </div>
      </PortPanel>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 border-t border-port-border/40 pt-3 first:border-0 first:pt-0">
      <span className="font-mono text-meta text-steel uppercase tracking-wider">{label}</span>
      <span className="font-body text-table text-fog capitalize">{value}</span>
    </div>
  );
}
