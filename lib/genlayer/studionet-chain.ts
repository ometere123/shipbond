/**
 * GenLayer Studionet chain definition for genlayer-js.
 *
 * Studionet uses one Studio RPC endpoint for intelligent contract calls and
 * wallet RPC calls. ShipBond is fully configured for Studionet.
 */
import { studionet } from "genlayer-js/chains";

export const STUDIONET_RPC = "https://studio.genlayer.com/api";
export const STUDIONET_EXPLORER = "https://explorer-studio.genlayer.com";
export const STUDIONET_FAUCET = "https://studio.genlayer.com";
export const STUDIONET_CHAIN_ID = 61999;

export const studionetChain = {
  ...studionet,
  id: STUDIONET_CHAIN_ID,
  name: "GenLayer Studionet",
  rpcUrls: {
    default: {
      http: [process.env.NEXT_PUBLIC_GENLAYER_RPC_URL ?? STUDIONET_RPC],
    },
  },
  blockExplorers: {
    default: {
      name: "GenLayer Studionet Explorer",
      url: process.env.NEXT_PUBLIC_GENLAYER_EXPLORER ?? STUDIONET_EXPLORER,
    },
  },
} as const;

/** Global ShipBond protocol contract — one contract, all milestones */
export const SHIPBOND_CONTRACT = (
  process.env.NEXT_PUBLIC_SHIPBOND_PROTOCOL_ADDRESS ??
  process.env.NEXT_PUBLIC_SHIPBOND_CONTRACT_ADDRESS ??
  "0x9D780f42c16F0D2237325f62Ea55B0E3Df5FA102"
) as `0x${string}`;
