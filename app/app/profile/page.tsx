import { redirect } from "next/navigation";
import { tryGetSessionWallet } from "@/lib/get-session-wallet";
import { listSponsorMilestones, listBuilderMilestones } from "@/lib/data/milestones";
import { PortPanel } from "@/components/ui/PortPanel";
import { WalletStatusPill } from "@/components/wallet/WalletStatusPill";
import { shortenAddress } from "@/lib/utils";

export const metadata = { title: "Profile" };
export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const session = await tryGetSessionWallet();
  if (!session) redirect("/connect");

  const [sponsored, builderBonds] = await Promise.all([
    listSponsorMilestones(session.walletAddress),
    listBuilderMilestones(session.walletAddress),
  ]);

  return (
    <div className="max-w-3xl">
      <div className="mb-8">
        <h1 className="font-display font-bold text-page-title text-signal">Profile</h1>
        <p className="font-body text-base text-fog mt-2">Wallet identity and ShipBond activity.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <PortPanel padding="sm"><Stat label="Sponsored" value={sponsored.length} /></PortPanel>
        <PortPanel padding="sm"><Stat label="Builder Bonds" value={builderBonds.length} /></PortPanel>
        <PortPanel padding="sm"><Stat label="Admin" value={session.isAdmin ? 1 : 0} /></PortPanel>
      </div>

      <PortPanel label="Wallet" glow="cyan">
        <div className="space-y-3">
          <WalletStatusPill />
          <Row label="Address" value={session.walletAddress} />
        </div>
      </PortPanel>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <>
      <span className="font-display text-xl text-amber-bond">{value}</span>
      <span className="ml-2 font-mono text-meta text-steel uppercase tracking-wider">{label}</span>
    </>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid gap-1 border-t border-port-border pt-3 first:border-0 first:pt-0">
      <span className="font-mono text-meta text-steel uppercase tracking-wider">{label}</span>
      <span className="font-mono text-table text-fog break-all">{value}</span>
    </div>
  );
}
