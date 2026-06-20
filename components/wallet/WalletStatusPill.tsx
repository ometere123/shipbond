"use client";

import { useAccount, useChainId } from "wagmi";
import { BRADBURY_CHAIN_ID } from "@/lib/wagmi";
import { shortenAddress } from "@/lib/utils";
import { cn } from "@/lib/utils";

export function WalletStatusPill() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const onBradbury = chainId === BRADBURY_CHAIN_ID;

  if (!isConnected || !address) return null;

  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 px-2.5 py-1 rounded-badge border",
        "font-mono text-meta",
        onBradbury
          ? "bg-lime-passed/8 border-lime-passed/20 text-lime-passed"
          : "bg-amber-bond/10 border-amber-bond/30 text-amber-bond"
      )}
    >
      <span
        className={cn(
          "w-1.5 h-1.5 rounded-full",
          onBradbury ? "bg-lime-passed animate-pulse" : "bg-amber-bond"
        )}
      />
      {shortenAddress(address)}
      {!onBradbury && <span className="text-amber-partial">Wrong chain</span>}
    </div>
  );
}
