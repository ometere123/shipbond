import { redirect } from "next/navigation";
import { ShieldAlert } from "lucide-react";
import { tryGetSessionWallet } from "@/lib/get-session-wallet";
import { listAuditEntries } from "@/lib/data/audit";
import { listReviews } from "@/lib/data/reviews";
import { listAllMilestones } from "@/lib/data/milestones";
import { listAllSubmissions } from "@/lib/data/submissions";
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

  const [audit, reviews, milestones, submissions] = await Promise.all([
    listAuditEntries(),
    listReviews(),
    listAllMilestones(),
    listAllSubmissions(),
  ]);
  const humanReviews = reviews.filter((review) => review.verdict === "needs_human_review");

  return (
    <div>
      <div className="mb-8">
        <p className="font-mono text-meta text-steel uppercase tracking-widest mb-2">Role: Admin</p>
        <h1 className="font-display font-bold text-page-title text-signal">Admin Review</h1>
        <p className="font-body text-base text-fog mt-2">Audit sensitive access, human review queue, and protocol mirror health.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-6">
        <AdminStat label="Milestones" value={milestones.length} />
        <AdminStat label="Submissions" value={submissions.length} />
        <AdminStat label="Reviews" value={reviews.length} />
        <AdminStat label="Human Queue" value={humanReviews.length} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <PortPanel label="Human Review Queue" glow="amber">
          {humanReviews.length === 0 ? (
            <p className="font-body text-table text-steel">No human review items.</p>
          ) : (
            <div className="space-y-3">
              {humanReviews.map((review) => (
                <div key={review.id} className="border-b border-port-border pb-3 last:border-0">
                  <Badge variant="steel">needs human review</Badge>
                  <p className="font-body text-table text-fog mt-2">{review.reasoning_summary ?? "No reasoning synced."}</p>
                </div>
              ))}
            </div>
          )}
        </PortPanel>

        <PortPanel label="Access Audit" glow="violet">
          <div className="max-h-[520px] overflow-auto divide-y divide-port-border">
            {audit.map((entry) => (
              <div key={entry.id} className="py-2">
                <div className="flex items-center justify-between gap-3">
                  <span className="font-mono text-meta text-violet-consensus uppercase">{entry.action}</span>
                  <span className="font-mono text-meta text-steel">{new Date(entry.created_at).toLocaleString()}</span>
                </div>
                <p className="font-mono text-meta text-fog break-all">{entry.wallet}</p>
                {entry.resource && <p className="font-mono text-meta text-steel">{entry.resource}</p>}
              </div>
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
