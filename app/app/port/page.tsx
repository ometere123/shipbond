import { listOpenMilestones } from "@/lib/data/milestones";
import { BondCard } from "@/components/milestone/BondCard";
import { PortPanel } from "@/components/ui/PortPanel";
import { Button } from "@/components/ui/Button";
import { LayoutGrid, Plus } from "lucide-react";
import Link from "next/link";

export const metadata = { title: "Proof Port" };
export const dynamic = "force-dynamic";

export default async function ProofPortPage() {
  let milestones: Awaited<ReturnType<typeof listOpenMilestones>> = [];
  let fetchError = false;

  try {
    milestones = await listOpenMilestones();
  } catch {
    fetchError = true;
  }

  return (
    <div>
      {/* Page header */}
      <div className="flex items-start justify-between mb-8 gap-4">
        <div>
          <p className="font-mono text-meta text-steel uppercase tracking-widest mb-2">
            Proofport OS Ã‚Â· Public Board
          </p>
          <h1 className="font-display font-bold text-page-title text-signal">
            Proof Port
          </h1>
          <p className="font-body text-base text-fog mt-2 max-w-lg">
            Browse open funded milestones. Accept one to lock your bond and start building.
          </p>
        </div>
        <Link href="/app/milestones/create">
          <Button variant="primary" size="sm">
            <Plus size={14} />
            Post Milestone
          </Button>
        </Link>
      </div>

      {/* Stats strip */}
      <PortPanel label="Port Status" className="mb-6" padding="sm">
        <div className="flex items-center gap-8 text-table">
          <Stat label="Open" value={milestones.filter(m => m.status === "open").length} color="amber" />
          <Stat label="Bonded" value={milestones.filter(m => m.status === "accepted").length} color="cyan" />
          <div className="h-4 w-px bg-port-border" />
          <span className="font-mono text-meta text-steel">
            GenLayer Studionet - Chain 61999
          </span>
        </div>
      </PortPanel>

      {/* Fetch error */}
      {fetchError && (
        <div className="bg-red-failed/10 border border-red-failed/30 rounded-panel p-4 mb-6">
          <p className="font-body text-table text-red-failed">
            Failed to load milestones. Check your Supabase environment variables.
          </p>
        </div>
      )}

      {/* Milestone grid */}
      {!fetchError && milestones.length === 0 ? (
        <EmptyPort />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {milestones.map((m) => (
            <BondCard key={m.id} milestone={m} />
          ))}
        </div>
      )}
    </div>
  );
}

function Stat({ label, value, color }: { label: string; value: number; color: "amber" | "cyan" }) {
  return (
    <div className="flex items-baseline gap-2">
      <span
        className={
          color === "amber"
            ? "font-display font-bold text-xl text-amber-bond"
            : "font-display font-bold text-xl text-cyan-evidence"
        }
      >
        {value}
      </span>
      <span className="font-mono text-meta text-steel uppercase tracking-wider">{label}</span>
    </div>
  );
}

function EmptyPort() {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="w-16 h-16 rounded-full bg-port-card border border-port-border flex items-center justify-center mb-4">
        <LayoutGrid size={28} className="text-steel" />
      </div>
      <h3 className="font-display font-semibold text-lg text-signal mb-2">
        No milestones docked yet
      </h3>
      <p className="font-body text-table text-fog max-w-xs mb-6">
        Be the first to post a funded milestone. Builders will lock bonds and start delivering.
      </p>
      <Link href="/app/milestones/create">
        <Button variant="primary">
          <Plus size={15} />
          Post First Milestone
        </Button>
      </Link>
    </div>
  );
}
