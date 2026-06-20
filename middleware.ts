import { NextRequest, NextResponse } from "next/server";
import { getIronSession } from "iron-session";
import { sessionOptions, type SessionData } from "@/lib/session";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const res = NextResponse.next();
  const session = await getIronSession<SessionData>(req, res, sessionOptions);
  const isAuthenticated = !!session.walletAddress;

  // Protect all /app/* routes — redirect to /connect if not signed in
  if (pathname.startsWith("/app")) {
    if (!isAuthenticated) {
      return NextResponse.redirect(new URL("/connect", req.url));
    }
  }

  // If already signed in, skip the connect page
  if (pathname === "/connect" && isAuthenticated) {
    return NextResponse.redirect(new URL("/app/port", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/app/:path*", "/connect"],
};
