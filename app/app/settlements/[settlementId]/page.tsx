import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getSettlement } from "@/lib/data/settlements";
import { getMilestone } from "@/lib/data/milestones";
import { getSubmission } from "@/lib/data/submissions";
import { PortPanel } from "@/components/ui/PortPanel";
import { HashPlate } from "@/components/ui/HashPlate";
import { formatGEN, shortenAddress } from "@/lib/utils";

export const metadata = { title: "Settlement Receipt" };
export const dynamic = "force-dynamic";

export default async function SettlementReceiptPage({ params }: { params: Promise<{ settlementId: string }> }) {
  const { settlementId } = await params;
  const settlement = await getSettlement(settlementId);
  if (!settlement) notFound();

  const [milestone, submission] = await Promise.all([
    getMilestone(settlement.milestone_id),
    getSubmission(settlement.submission_id),
  ]);

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Link href={milestone ? `/app/port/${milestone.id}` : "/app/verdicts"} className="inline-flex items-center gap-2 font-mono text-meta text-steel hover:text-fog">
        <ArrowLeft size={13} />
        Back
      </Link>

      <div>
        <p className="font-mono text-meta text-steel uppercase tracking-widest mb-2">Final Payout Record</p>
        <h1 className="font-display font-bold text-page-title text-signal">{milestone?.title ?? "Settlement Receipt"}</h1>
      </div>

      <PortPanel label="Settlement Terms" glow="amber">
        <div className="space-y-3">
          <Row label="Verdict" value={settlement.verdict.replace(/_/g, " ")} />
          <Row label="Bond Action" value={settlement.bond_action} />
          <Row label="Builder" value={submission ? shortenAddress(submission.builder_wallet, 6) : "Unknown"} />
          {settlement.reward_to_builder && <Row label="Reward to Builder" value={`${formatGEN(BigInt(settlement.reward_to_builder))} GEN`} />}
          {settlement.bond_returned && <Row label="Bond Returned" value={`${formatGEN(BigInt(settlement.bond_returned))} GEN`} />}
          {settlement.bond_slashed && <Row label="Bond Slashed" value={`${formatGEN(BigInt(settlement.bond_slashed))} GEN`} />}
          {settlement.settle_tx_hash && (
            <div className="flex items-center justify-between gap-4 border-t border-port-border pt-3">
              <span className="font-mono text-meta text-steel uppercase tracking-wider">Settlement TX</span>
              <HashPlate value={settlement.settle_tx_hash} type="tx" />
            </div>
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
