import { type SessionOptions, getIronSession } from "iron-session";
import { cookies } from "next/headers";

export interface SessionData {
  walletAddress?: string;
  profileId?: string;
  isAdmin?: boolean;
  nonce?: string;
}

export const sessionOptions: SessionOptions = {
  cookieName: process.env.SESSION_COOKIE_NAME ?? "__shipbond_session",
  password: process.env.SESSION_SECRET ?? "fallback-dev-secret-32-chars-min!!",
  cookieOptions: {
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    sameSite: "lax",
    maxAge: Number(process.env.SESSION_MAX_AGE ?? 604800), // 7 days
  },
};

export async function getSession() {
  const cookieStore = await cookies();
  return getIronSession<SessionData>(cookieStore, sessionOptions);
}

export async function requireSession(): Promise<{ walletAddress: string; profileId?: string; isAdmin: boolean }> {
  const session = await getSession();
  if (!session.walletAddress) {
    throw new Error("UNAUTHENTICATED");
  }
  return {
    walletAddress: session.walletAddress,
    profileId: session.profileId,
    isAdmin: session.isAdmin ?? false,
  };
}
