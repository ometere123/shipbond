import { PortPanel } from "@/components/ui/PortPanel";
import { HashPlate } from "@/components/ui/HashPlate";
import { STUDIONET_CHAIN_ID, STUDIONET_EXPLORER, STUDIONET_RPC, SHIPBOND_CONTRACT } from "@/lib/genlayer/studionet-chain";

export const metadata = { title: "Settings" };

export default function SettingsPage() {
  return (
    <div className="max-w-3xl">
      <div className="mb-8">
        <h1 className="font-display font-bold text-page-title text-signal">Settings</h1>
        <p className="font-body text-base text-fog mt-2">Network, protocol, and explorer configuration.</p>
      </div>

      <PortPanel label="Studionet Network" glow="violet">
        <div className="space-y-3">
          <Row label="Chain ID" value={String(STUDIONET_CHAIN_ID)} />
          <Row label="IC RPC" value={process.env.NEXT_PUBLIC_GENLAYER_RPC_URL ?? STUDIONET_RPC} />
          <Row label="Chain RPC" value={process.env.NEXT_PUBLIC_GENLAYER_CHAIN_RPC ?? STUDIONET_RPC} />
          <Row label="Studionet Explorer" value={process.env.NEXT_PUBLIC_GENLAYER_EXPLORER ?? STUDIONET_EXPLORER} />
          <div className="flex items-center justify-between gap-4 border-t border-port-border pt-3">
            <span className="font-mono text-meta text-steel uppercase tracking-wider">Protocol Contract</span>
            <HashPlate value={SHIPBOND_CONTRACT} type="address" explorerType="protocol" />
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
