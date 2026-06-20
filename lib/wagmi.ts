import { createConfig, http } from "wagmi";
import { injected } from "wagmi/connectors";
import { defineChain } from "viem";

export const STUDIONET_CHAIN_ID = 61999;
export const STUDIONET_RPC = "https://studio.genlayer.com/api";
export const STUDIONET_EXPLORER = "https://explorer-studio.genlayer.com";

export const studionet = defineChain({
  id: STUDIONET_CHAIN_ID,
  name: "GenLayer Studionet",
  nativeCurrency: { name: "GEN", symbol: "GEN", decimals: 18 },
  rpcUrls: {
    default: {
      http: [
        process.env.NEXT_PUBLIC_GENLAYER_CHAIN_RPC ??
        process.env.NEXT_PUBLIC_GENLAYER_RPC_URL ??
        STUDIONET_RPC,
      ],
    },
  },
  blockExplorers: {
    default: {
      name: "Studionet Explorer",
      url:
        process.env.NEXT_PUBLIC_GENLAYER_EXPLORER ??
        STUDIONET_EXPLORER,
    },
  },
  testnet: true,
});

export const wagmiConfig = createConfig({
  chains: [studionet],
  connectors: [injected()],
  transports: {
    [studionet.id]: http(
      process.env.NEXT_PUBLIC_GENLAYER_CHAIN_RPC ??
      process.env.NEXT_PUBLIC_GENLAYER_RPC_URL ??
      STUDIONET_RPC,
    ),
  },
  ssr: true,
});
