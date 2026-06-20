"use client";

/**
 * Browser hook: creates a signed genlayer-js client backed by the injected
 * wallet (MetaMask/Rabby). When account is a string address, genlayer-js
 * routes eth_* calls through window.ethereum automatically.
 *
 * Returns null when no wallet is connected.
 */
import { useMemo } from "react";
import { useAccount } from "wagmi";
import { createClient } from "genlayer-js";
import { studionetChain } from "@/lib/genlayer/studionet-chain";

export function useGenLayerClient() {
  const { address, isConnected } = useAccount();

  const client = useMemo(() => {
    if (!isConnected || !address) return null;
    return createClient({
      chain:   studionetChain as any,
      account: address,
    });
  }, [address, isConnected]);

  return { client, address, isConnected };
}
