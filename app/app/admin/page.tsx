import { redirect } from "next/navigation";
import Link from "next/link";
import { ShieldAlert } from "lucide-react";
import { tryGetSessionWallet } from "@/lib/get-session-wallet";
import { listAllMilestones } from "@/lib/data/milestones";
import { EmptyState } from "@/components/ui/EmptyState";
import { PortPanel } from "@/components/ui/PortPanel";
import { Badge } from "@/components/ui/Badge";

export const metadata = { title: "Admin Review" };
export const dynamic = "force-dynamic";

export default async function AdminReviewPage() {
  const session = await tryGetSessionWallet();
  if (!session) redirect("/connect");
  if (!session.isAdmin) {
    return <EmptyState icon={<ShieldAlert size={28} />} title="Admin access required" description="Add this wallet to SHIPBOND_ADMIN_WALLETS and sign in again." />;
  }

  const milestones = await listAllMilestones();
  const withVerdict = milestones.filter((m) => m.verdict !== "");
  const humanReviews = milestones.filter((m) => m.verdict === "NEEDS_HUMAN_REVIEW");
  const settled = milestones.filter((m) => m.status === "SETTLED");

  return (
    <div>
      <div className="mb-8">
        <p className="font-mono text-meta text-steel uppercase tracking-widest mb-2">Role: Admin</p>
        <h1 className="font-display font-bold text-page-title text-signal">Admin Review</h1>
        <p className="font-body text-base text-fog mt-2">Protocol-wide milestone activity, read directly from the contract.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-6">
        <AdminStat label="Milestones" value={milestones.length} />
        <AdminStat label="Reviewed" value={withVerdict.length} />
        <AdminStat label="Settled" value={settled.length} />
        <AdminStat label="Human Queue" value={humanReviews.length} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <PortPanel label="Human Review Queue" glow="amber">
          {humanReviews.length === 0 ? (
            <p className="font-body text-table text-steel">No human review items.</p>
          ) : (
            <div className="space-y-3">
              {humanReviews.map((milestone) => (
                <Link
                  key={milestone.milestone_id}
                  href={`/app/port/${milestone.milestone_id}`}
                  className="block border-b border-port-border pb-3 last:border-0"
                >
                  <Badge variant="steel">needs human review</Badge>
                  <p className="font-body text-table text-fog mt-2">{milestone.title}</p>
                  <p className="font-body text-meta text-steel mt-1">{milestone.human_review_reason || "No reasoning recorded."}</p>
                </Link>
              ))}
            </div>
          )}
        </PortPanel>

        <PortPanel label="Recent Milestones" glow="violet">
          <div className="max-h-[520px] overflow-auto divide-y divide-port-border">
            {milestones.map((milestone) => (
              <Link
                key={milestone.milestone_id}
                href={`/app/port/${milestone.milestone_id}`}
                className="flex items-center justify-between gap-3 py-2"
              >
                <span className="font-body text-table text-fog truncate">{milestone.title}</span>
                <span className="font-mono text-meta text-violet-consensus uppercase shrink-0">{milestone.status}</span>
              </Link>
            ))}
          </div>
        </PortPanel>
      </div>
    </div>
  );
}

function AdminStat({ label, value }: { label: string; value: number }) {
  return (
    <PortPanel padding="sm">
      <span className="font-display text-xl text-amber-bond">{value}</span>
      <span className="ml-2 font-mono text-meta text-steel uppercase tracking-wider">{label}</span>
    </PortPanel>
  );
}
