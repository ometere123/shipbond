import { redirect } from "next/navigation";
import Link from "next/link";
import { Anchor, Plus } from "lucide-react";
import { tryGetSessionWallet } from "@/lib/get-session-wallet";
import { listSponsorMilestones } from "@/lib/data/milestones";
import { BondCard } from "@/components/milestone/BondCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";
import { PortPanel } from "@/components/ui/PortPanel";

export const metadata = { title: "Control Tower" };
export const dynamic = "force-dynamic";

export default async function ControlTowerPage() {
  const session = await tryGetSessionWallet();
  if (!session) redirect("/connect");
  const milestones = await listSponsorMilestones(session.walletAddress);

  return (
    <div>
      <div className="flex items-start justify-between gap-4 mb-8">
        <div>
          <p className="font-mono text-meta text-steel uppercase tracking-widest mb-2">Role: Sponsor</p>
          <h1 className="font-display font-bold text-page-title text-signal">Control Tower</h1>
          <p className="font-body text-base text-fog mt-2">Track funded milestones, submissions, reviews, and settlement readiness.</p>
        </div>
        <Link href="/app/milestones/create">
          <Button variant="primary" size="sm"><Plus size={14} /> Post Milestone</Button>
        </Link>
      </div>

      <PortPanel label="Sponsor Totals" className="mb-6" padding="sm">
        <div className="flex flex-wrap gap-8">
          <Stat label="Total" value={milestones.length} />
          <Stat label="Open" value={milestones.filter((m) => m.status === "OPEN").length} />
          <Stat label="Reviewing" value={milestones.filter((m) => m.status === "REVIEWING" || m.status === "REVIEWED").length} />
          <Stat label="Settled" value={milestones.filter((m) => m.status === "SETTLED").length} />
        </div>
      </PortPanel>

      {milestones.length === 0 ? (
        <EmptyState
          icon={<Anchor size={28} />}
          title="No sponsored milestones yet"
          description="Post a funded milestone to start receiving bonded builder submissions."
          actionHref={{ label: "Create Milestone", href: "/app/milestones/new" }}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {milestones.map((milestone) => <BondCard key={milestone.milestone_id} milestone={milestone} />)}
        </div>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-baseline gap-2">
      <span className="font-display font-bold text-xl text-amber-bond">{value}</span>
      <span className="font-mono text-meta text-steel uppercase tracking-wider">{label}</span>
    </div>
  );
}
