/**
 * GenLayer Bradbury chain definition for genlayer-js.
 *
 * genlayer-js@1.1.8 exports testnetBradbury with all correct Bradbury values:
 *   - Chain ID 4221
 *   - IC RPC: https://rpc-bradbury.genlayer.com
 *   - consensusMainContract: 0x0112Bf6e83497965A5fdD6Dad1E447a6E004271D (updated in 1.1.8)
 *
 * We extend it with our preferred name, both explorer entries,
 * and the chain/EVM RPC constant. All internal contract fields
 * come directly from testnetBradbury — no manual construction.
 *
 * Chain ID 4221 — Bradbury only. Never StudioNet (61999).
 */
import { testnetBradbury } from "genlayer-js/chains";

export const bradburyChain = {
  ...testnetBradbury,
  name: "GenLayer Bradbury",
  blockExplorers: {
    default: {
      name: "GenLayer Bradbury Explorer",
      url:  "https://explorer-bradbury.genlayer.com",
    },
    chain: {
      name: "GenLayer Chain Explorer",
      url:  "https://explorer.testnet-chain.genlayer.com",
    },
  },
} as const;

// ── URL constants ─────────────────────────────────────────────────────────────

/** GenLayer Bradbury IC RPC — for genlayer-js createClient */
export const BRADBURY_RPC = "https://rpc-bradbury.genlayer.com";

/** Standard EVM chain RPC — for wagmi / MetaMask wallet ops */
export const BRADBURY_CHAIN_RPC = "https://rpc.testnet-chain.genlayer.com";

/** IC transaction explorer */
export const BRADBURY_EXPLORER = "https://explorer-bradbury.genlayer.com";

/** Underlying chain explorer */
export const BRADBURY_CHAIN_EXPLORER = "https://explorer.testnet-chain.genlayer.com";

export const BRADBURY_FAUCET   = "https://testnet-faucet.genlayer.foundation";
export const BRADBURY_CHAIN_ID = 4221;

/** Global ShipBond protocol contract — one contract, all milestones */
export const SHIPBOND_CONTRACT = (
  process.env.NEXT_PUBLIC_SHIPBOND_PROTOCOL_ADDRESS ??
  "0xfb305e9011C58ebc1303795693026769E955e6B7"
) as `0x${string}`;
