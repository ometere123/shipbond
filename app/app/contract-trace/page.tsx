import Link from "next/link";
import { Activity } from "lucide-react";
import { listAllMilestones } from "@/lib/data/milestones";
import { SHIPBOND_CONTRACT } from "@/lib/genlayer/studionet-chain";
import { EmptyState } from "@/components/ui/EmptyState";
import { PortPanel } from "@/components/ui/PortPanel";
import { HashPlate } from "@/components/ui/HashPlate";

export const metadata = { title: "Contract Trace" };
export const dynamic = "force-dynamic";

export default async function ContractTracePage() {
  const milestones = await listAllMilestones();

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-display font-bold text-page-title text-signal">Contract Trace</h1>
        <p className="font-body text-base text-fog mt-2">Milestone-level chain trail across funding, bond, evidence, review, and settlement.</p>
      </div>

      {milestones.length === 0 ? (
        <EmptyState icon={<Activity size={28} />} title="No contract activity" description="Create a milestone to begin the trace." />
      ) : (
        <div className="space-y-4">
          {milestones.map((milestone) => (
            <PortPanel key={milestone.milestone_id} label={milestone.status} padding="sm">
              <div className="space-y-3">
                <Link href={`/app/port/${milestone.milestone_id}`} className="font-display text-card-title text-signal hover:text-amber-bond">
                  {milestone.title}
                </Link>
                <Trace label="Protocol" value={SHIPBOND_CONTRACT} type="address" />
                <Trace label="Terms Hash" value={milestone.terms_hash} type="hash" explorerType="none" />
                {milestone.evidence_digest && <Trace label="Evidence Digest" value={milestone.evidence_digest} type="hash" explorerType="none" />}
              </div>
            </PortPanel>
          ))}
        </div>
      )}
    </div>
  );
}

function Trace({
  label,
  value,
  type,
  explorerType = "chain",
}: {
  label: string;
  value: string | null | undefined;
  type: "tx" | "address" | "hash";
  explorerType?: "chain" | "protocol" | "none";
}) {
  if (!value) return null;
  return (
    <div className="flex items-center justify-between gap-4 border-t border-port-border/40 pt-2">
      <span className="font-mono text-meta text-steel uppercase tracking-wider">{label}</span>
      <HashPlate value={value} type={type} explorerType={explorerType} />
    </div>
  );
}
