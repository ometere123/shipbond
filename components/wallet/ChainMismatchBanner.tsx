"use client";

import { useAccount, useChainId, useSwitchChain } from "wagmi";
import { STUDIONET_CHAIN_ID } from "@/lib/wagmi";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/Button";

export function ChainMismatchBanner() {
  const { isConnected } = useAccount();
  const chainId = useChainId();
  const { switchChain, isPending } = useSwitchChain();

  if (!isConnected || chainId === STUDIONET_CHAIN_ID) return null;

  return (
    <div className="bg-amber-bond/10 border-b border-amber-bond/30 px-6 py-2.5">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <AlertTriangle size={15} className="text-amber-bond shrink-0" />
          <p className="font-body text-table text-fog">
            Your wallet is on chain{" "}
            <span className="font-mono text-signal">{chainId}</span>.
            ShipBond requires{" "}
            <span className="font-mono text-amber-bond">GenLayer Studionet (61999)</span>.
          </p>
        </div>
        <Button
          variant="primary"
          size="sm"
          loading={isPending}
          onClick={() => switchChain({ chainId: STUDIONET_CHAIN_ID })}
          className="shrink-0"
        >
          Switch Network
        </Button>
      </div>
    </div>
  );
}
