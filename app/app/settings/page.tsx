import { PortPanel } from "@/components/ui/PortPanel";
import { HashPlate } from "@/components/ui/HashPlate";
import { BRADBURY_CHAIN_EXPLORER, BRADBURY_EXPLORER, BRADBURY_RPC, BRADBURY_CHAIN_RPC, SHIPBOND_CONTRACT } from "@/lib/genlayer/bradbury-chain";

export const metadata = { title: "Settings" };

export default function SettingsPage() {
  return (
    <div className="max-w-3xl">
      <div className="mb-8">
        <h1 className="font-display font-bold text-page-title text-signal">Settings</h1>
        <p className="font-body text-base text-fog mt-2">Network, protocol, and explorer configuration.</p>
      </div>

      <PortPanel label="Bradbury Network" glow="violet">
        <div className="space-y-3">
          <Row label="Chain ID" value="4221" />
          <Row label="IC RPC" value={process.env.NEXT_PUBLIC_GENLAYER_RPC_URL ?? BRADBURY_RPC} />
          <Row label="Chain RPC" value={process.env.NEXT_PUBLIC_GENLAYER_CHAIN_RPC ?? BRADBURY_CHAIN_RPC} />
          <Row label="Bradbury Explorer" value={process.env.NEXT_PUBLIC_BRADBURY_EXPLORER ?? BRADBURY_EXPLORER} />
          <Row label="Chain Explorer" value={process.env.NEXT_PUBLIC_CHAIN_EXPLORER ?? BRADBURY_CHAIN_EXPLORER} />
          <div className="flex items-center justify-between gap-4 border-t border-port-border pt-3">
            <span className="font-mono text-meta text-steel uppercase tracking-wider">Protocol Contract</span>
            <HashPlate value={SHIPBOND_CONTRACT} type="address" explorerType="bradbury" />
          </div>
        </div>
      </PortPanel>
    </div>
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
