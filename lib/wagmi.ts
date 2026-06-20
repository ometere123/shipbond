import { createConfig, http } from "wagmi";
import { injected } from "wagmi/connectors";
import { defineChain } from "viem";

// Bradbury — wallet/ETH ops use the Chain RPC; IC reads use genlayer-js with Bradbury RPC
export const bradbury = defineChain({
  id: 4221,
  name: "GenLayer Bradbury",
  nativeCurrency: { name: "GEN", symbol: "GEN", decimals: 18 },
  rpcUrls: {
    default: {
      http: [
        process.env.NEXT_PUBLIC_GENLAYER_CHAIN_RPC ?? "https://rpc.testnet-chain.genlayer.com",
      ],
    },
  },
  blockExplorers: {
    default: {
      name: "Bradbury Explorer",
      url:
        process.env.NEXT_PUBLIC_BRADBURY_EXPLORER ??
        "https://explorer-bradbury.genlayer.com",
    },
    chain: {
      name: "Chain Explorer",
      url:
        process.env.NEXT_PUBLIC_CHAIN_EXPLORER ??
        "https://explorer.testnet-chain.genlayer.com",
    },
  },
  testnet: true,
});

export const wagmiConfig = createConfig({
  chains: [bradbury],
  // injected() covers MetaMask, Rabby, Frame, and any EIP-1193 browser wallet
  connectors: [injected()],
  transports: {
    [bradbury.id]: http(
      process.env.NEXT_PUBLIC_GENLAYER_CHAIN_RPC ?? "https://rpc.testnet-chain.genlayer.com"
    ),
  },
  ssr: true,
});

export const BRADBURY_CHAIN_ID = 4221;
