import Link from "next/link";
import { redirect } from "next/navigation";
import { Gavel, Anchor, Shield } from "lucide-react";
import { tryGetSessionWallet } from "@/lib/get-session-wallet";
import { listVerdictsAsBuilder, listVerdictsAsSponsor } from "@/lib/data/milestones";
import { EmptyState } from "@/components/ui/EmptyState";
import { PortPanel } from "@/components/ui/PortPanel";
import { Badge } from "@/components/ui/Badge";
import { formatGEN } from "@/lib/utils";
import { cn } from "@/lib/utils";

export const metadata = { title: "Verdicts" };
export const dynamic = "force-dynamic";

export default async function VerdictsPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string }>;
}) {
  const session = await tryGetSessionWallet();
  if (!session) redirect("/connect");

  const wallet = session.walletAddress;
  const { view } = await searchParams;

  const [builderRows, sponsorRows] = await Promise.all([
    listVerdictsAsBuilder(wallet),
    listVerdictsAsSponsor(wallet),
  ]);

  const hasBuilder = builderRows.length > 0;
  const hasSponsor = sponsorRows.length > 0;
  const hasBoth    = hasBuilder && hasSponsor;

  const activeView: "builder" | "sponsor" =
    hasBoth ? (view === "sponsor" ? "sponsor" : "builder")
    : hasSponsor ? "sponsor"
    : "builder";

  const rows = activeView === "builder" ? builderRows : sponsorRows;

  return (
    <div>
      <div className="flex items-start justify-between gap-4 mb-8">
        <div>
          <p className="font-mono text-meta text-steel uppercase tracking-widest mb-2">Personal History</p>
          <h1 className="font-display font-bold text-page-title text-signal">Verdicts</h1>
          <p className="font-body text-base text-fog mt-2">
            GenLayer IC verdicts for milestones you participated in.
          </p>
        </div>

        {hasBoth && (
          <div className="flex items-center gap-1 bg-port-panel border border-port-border rounded-btn p-1 shrink-0">
            <Link
              href="/app/verdicts?view=builder"
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded font-mono text-meta transition-colors",
                activeView === "builder"
                  ? "bg-cyan-evidence/10 text-cyan-evidence"
                  : "text-steel hover:text-fog",
              )}
            >
              <Shield size={13} /> As Builder
            </Link>
            <Link
              href="/app/verdicts?view=sponsor"
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded font-mono text-meta transition-colors",
                activeView === "sponsor"
                  ? "bg-amber-bond/10 text-amber-bond"
                  : "text-steel hover:text-fog",
              )}
            >
              <Anchor size={13} /> As Sponsor
            </Link>
          </div>
        )}
      </div>

      {rows.length > 0 && (
        <PortPanel
          label={activeView === "builder" ? "Builder Track Record" : "Sponsor Funding History"}
          className="mb-6"
          padding="sm"
        >
          <div className="flex flex-wrap gap-8">
            <Stat label="Total"              value={rows.length}                                              color="fog"    />
            <Stat label="Passed"             value={rows.filter((m) => m.verdict === "PASSED").length}         color="lime"   />
            <Stat label="Partial"            value={rows.filter((m) => m.verdict === "PARTIAL_PASS").length}   color="amber"  />
            <Stat label="Failed"             value={rows.filter((m) => m.verdict === "FAILED").length}         color="red"    />
            <Stat label="Needs Human Review" value={rows.filter((m) => m.verdict === "NEEDS_HUMAN_REVIEW").length} color="violet" />
          </div>
        </PortPanel>
      )}

      {rows.length === 0 ? (
        <EmptyState
          icon={<Gavel size={28} />}
          title={activeView === "builder" ? "No builder verdicts yet" : "No sponsor verdicts yet"}
          description={
            activeView === "builder"
              ? "Accept a milestone bond, submit evidence, and request review to receive a GenLayer IC verdict."
              : "Your sponsored milestones will show verdicts here once GenLayer reviews are complete."
          }
          actionHref={
            activeView === "builder"
              ? { label: "Explore Proof Port", href: "/app/port" }
              : { label: "Create Milestone",   href: "/app/milestones/new" }
          }
        />
      ) : (
        <div className="space-y-3">
          {rows.map((milestone) => (
            <PortPanel
              key={milestone.milestone_id}
              padding="sm"
              glow={milestone.verdict === "NEEDS_HUMAN_REVIEW" ? "violet" : "none"}
            >
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <Badge variant={
                      milestone.verdict === "PASSED"       ? "lime"    :
                      milestone.verdict === "PARTIAL_PASS" ? "partial" :
                      milestone.verdict === "FAILED"       ? "red"     : "steel"
                    }>
                      {milestone.verdict.replace(/_/g, " ")}
                    </Badge>
                    {milestone.bond_action && (
                      <span className="font-mono text-meta text-steel uppercase">
                        Bond: {milestone.bond_action}
                      </span>
                    )}
                    {activeView === "sponsor" && milestone.builder && (
                      <span className="font-mono text-meta text-steel">
                        Builder: {milestone.builder.slice(0, 8)}…{milestone.builder.slice(-6)}
                      </span>
                    )}
                  </div>

                  <Link
                    href={`/app/port/${milestone.milestone_id}`}
                    className="font-display text-card-title text-signal hover:text-amber-bond block mb-1"
                  >
                    {milestone.title}
                  </Link>

                  <div className="flex items-center gap-4 font-mono text-meta text-steel">
                    <span>Reward {formatGEN(BigInt(milestone.reward_wei))} GEN</span>
                    <span>Bond {formatGEN(BigInt(milestone.bond_wei))} GEN</span>
                  </div>

                  {milestone.reasoning && (
                    <p className="font-body text-table text-fog mt-2 max-w-2xl line-clamp-3">
                      {milestone.reasoning}
                    </p>
                  )}
                </div>
              </div>
            </PortPanel>
          ))}
        </div>
      )}
    </div>
  );
}

function Stat({ label, value, color }: { label: string; value: number; color: string }) {
  const colorClass: Record<string, string> = {
    fog:    "text-fog",
    lime:   "text-lime-passed",
    amber:  "text-amber-bond",
    red:    "text-red-failed",
    violet: "text-violet-consensus",
  };
  return (
    <div className="flex items-baseline gap-2">
      <span className={cn("font-display font-bold text-xl", colorClass[color] ?? "text-fog")}>{value}</span>
      <span className="font-mono text-meta text-steel uppercase tracking-wider">{label}</span>
    </div>
  );
}
