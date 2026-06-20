import { redirect } from "next/navigation";
import Link from "next/link";
import { Shield } from "lucide-react";
import { tryGetSessionWallet } from "@/lib/get-session-wallet";
import { listBuilderSubmissions } from "@/lib/data/submissions";
import { getMilestone } from "@/lib/data/milestones";
import { EmptyState } from "@/components/ui/EmptyState";
import { PortPanel } from "@/components/ui/PortPanel";
import { Button } from "@/components/ui/Button";
import { formatGEN } from "@/lib/utils";

export const metadata = { title: "Bond Dock" };
export const dynamic = "force-dynamic";

export default async function BondDockPage() {
  const session = await tryGetSessionWallet();
  if (!session) redirect("/connect");

  const submissions = await listBuilderSubmissions(session.walletAddress);
  const rows = await Promise.all(submissions.map(async (submission) => ({
    submission,
    milestone: await getMilestone(submission.milestone_id),
  })));

  return (
    <div>
      <div className="mb-8">
        <p className="font-mono text-meta text-steel uppercase tracking-widest mb-2">Role: Builder</p>
        <h1 className="font-display font-bold text-page-title text-signal">Bond Dock</h1>
        <p className="font-body text-base text-fog mt-2">Monitor accepted bonds, evidence packets, review requests, and settlements.</p>
      </div>

      {rows.length === 0 ? (
        <EmptyState
          icon={<Shield size={28} />}
          title="No builder bonds yet"
          description="Browse the Proof Port and accept an open milestone to start building."
        />
      ) : (
        <div className="space-y-3">
          {rows.map(({ submission, milestone }) => milestone && (
            <PortPanel key={submission.id} padding="sm">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <p className="font-display text-card-title text-signal">{milestone.title}</p>
                  <p className="font-mono text-meta text-steel uppercase tracking-wider">
                    {submission.status.replace(/_/g, " ")} · Bond {formatGEN(BigInt(milestone.bond_wei))} GEN
                  </p>
                </div>
                <div className="flex gap-2">
                  <Link href={`/app/port/${milestone.id}`}><Button variant="secondary" size="sm">Open</Button></Link>
                  {milestone.status === "accepted" && <Link href={`/app/milestones/${milestone.id}/submit`}><Button variant="genlayer" size="sm">Submit Evidence</Button></Link>}
                  {milestone.status === "submitted" && <Link href={`/app/milestones/${milestone.id}/review`}><Button variant="genlayer" size="sm">Request Review</Button></Link>}
                  {milestone.status === "reviewing" && <Link href={`/app/milestones/${milestone.id}/settle`}><Button variant="primary" size="sm">Settle</Button></Link>}
                </div>
              </div>
            </PortPanel>
          ))}
        </div>
      )}
    </div>
  );
}
