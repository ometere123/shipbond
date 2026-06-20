import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function shortenAddress(address: string, chars = 4): string {
  if (!address) return "";
  return `${address.slice(0, chars + 2)}…${address.slice(-chars)}`;
}

export function shortenHash(hash: string, chars = 6): string {
  if (!hash) return "";
  return `${hash.slice(0, chars + 2)}…${hash.slice(-chars)}`;
}

export function formatGEN(wei: bigint, decimals = 4): string {
  const gen = Number(wei) / 1e18;
  return gen.toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals,
  });
}

export function weiToGEN(wei: bigint): number {
  return Number(wei) / 1e18;
}

export function genToWei(gen: number): bigint {
  return BigInt(Math.floor(gen * 1e18));
}

export function formatDeadline(timestamp: number): string {
  const date = new Date(timestamp * 1000);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function isDeadlinePassed(timestamp: number): boolean {
  return Date.now() > timestamp * 1000;
}

export function daysUntilDeadline(timestamp: number): number {
  const ms = timestamp * 1000 - Date.now();
  return Math.ceil(ms / (1000 * 60 * 60 * 24));
}

export function normalizeAddress(address: string): string {
  return address.toLowerCase();
}

export function buildExplorerTxUrl(hash: string): string {
  const base = process.env.NEXT_PUBLIC_CHAIN_EXPLORER ?? "https://explorer.testnet-chain.genlayer.com";
  return `${base}/tx/${hash}`;
}

export function buildBradburyTxUrl(hash: string): string {
  const base = process.env.NEXT_PUBLIC_BRADBURY_EXPLORER ?? "https://explorer-bradbury.genlayer.com";
  return `${base}/tx/${hash}`;
}

export function buildContractUrl(address: string): string {
  const base = process.env.NEXT_PUBLIC_BRADBURY_EXPLORER ?? "https://explorer-bradbury.genlayer.com";
  return `${base}/address/${address}`;
}
