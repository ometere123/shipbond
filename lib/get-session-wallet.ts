// Server-only helper — import only in API routes and Server Actions, never in client components.
import { getSession } from "@/lib/session";
import { NextRequest } from "next/server";

export interface SessionWallet {
  walletAddress: string;
  profileId?: string;
  isAdmin: boolean;
}

/**
 * Reads the session cookie and returns the authenticated wallet.
 * Throws "UNAUTHENTICATED" if no valid session exists.
 * Use in API route handlers: const wallet = await getSessionWallet(request)
 */
export async function getSessionWallet(_req?: NextRequest): Promise<SessionWallet> {
  const session = await getSession();
  if (!session.walletAddress) {
    throw Object.assign(new Error("Not authenticated"), { code: "UNAUTHENTICATED" });
  }
  return {
    walletAddress: session.walletAddress,
    profileId: session.profileId,
    isAdmin: session.isAdmin ?? false,
  };
}

/** Returns null instead of throwing — use for optional auth checks */
export async function tryGetSessionWallet(): Promise<SessionWallet | null> {
  try {
    return await getSessionWallet();
  } catch {
    return null;
  }
}
