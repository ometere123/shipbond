import { redirect } from "next/navigation";
import Link from "next/link";
import { Shield } from "lucide-react";
import { tryGetSessionWallet } from "@/lib/get-session-wallet";
import { listBuilderMilestones } from "@/lib/data/milestones";
import { EmptyState } from "@/components/ui/EmptyState";
import { PortPanel } from "@/components/ui/PortPanel";
import { Button } from "@/components/ui/Button";
import { formatGEN } from "@/lib/utils";

export const metadata = { title: "Bond Dock" };
export const dynamic = "force-dynamic";

export default async function BondDockPage() {
  const session = await tryGetSessionWallet();
  if (!session) redirect("/connect");

  const milestones = await listBuilderMilestones(session.walletAddress);

  return (
    <div>
      <div className="mb-8">
        <p className="font-mono text-meta text-steel uppercase tracking-widest mb-2">Role: Builder</p>
        <h1 className="font-display font-bold text-page-title text-signal">Bond Dock</h1>
        <p className="font-body text-base text-fog mt-2">Monitor accepted bonds, evidence packets, review requests, and settlements.</p>
      </div>

      {milestones.length === 0 ? (
        <EmptyState
          icon={<Shield size={28} />}
          title="No accepted bonds yet"
          description="Browse Proof Port to find funded work and lock a bond."
          actionHref={{ label: "Explore Proof Port", href: "/app/port" }}
        />
      ) : (
        <div className="space-y-3">
          {milestones.map((milestone) => (
            <PortPanel key={milestone.milestone_id} padding="sm">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <p className="font-display text-card-title text-signal">{milestone.title}</p>
                  <p className="font-mono text-meta text-steel uppercase tracking-wider">
                    {milestone.status.replace(/_/g, " ")} · Bond {formatGEN(BigInt(milestone.bond_wei))} GEN
                  </p>
                </div>
                <div className="flex gap-2">
                  <Link href={`/app/port/${milestone.milestone_id}`}><Button variant="secondary" size="sm">Open</Button></Link>
                  {milestone.status === "ACCEPTED" && <Link href={`/app/milestones/${milestone.milestone_id}/submit`}><Button variant="genlayer" size="sm">Submit Evidence</Button></Link>}
                  {milestone.status === "SUBMITTED" && <span className="font-mono text-meta text-steel uppercase tracking-wider">Awaiting sponsor review</span>}
                  {(milestone.status === "REVIEWING" || milestone.status === "REVIEWED") && <Link href={`/app/milestones/${milestone.milestone_id}/settle`}><Button variant="primary" size="sm">Settle</Button></Link>}
                </div>
              </div>
            </PortPanel>
          ))}
        </div>
      )}
    </div>
  );
}
