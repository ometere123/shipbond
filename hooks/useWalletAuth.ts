"use client";

import { useState, useCallback, useEffect } from "react";
import { useAccount, useSignMessage, useDisconnect } from "wagmi";

type AuthState = "idle" | "requesting_nonce" | "waiting_signature" | "verifying" | "authenticated" | "error";

interface UseWalletAuthResult {
  state: AuthState;
  error: string | null;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
}

export function useWalletAuth(): UseWalletAuthResult {
  const { address } = useAccount();
  const { signMessageAsync } = useSignMessage();
  const { disconnect } = useDisconnect();
  const [state, setState] = useState<AuthState>("idle");
  const [error, setError] = useState<string | null>(null);

  // Rehydrate auth state from session cookie on mount
  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => { if (d.authenticated) setState("authenticated"); })
      .catch(() => {});
  }, []);

  const signIn = useCallback(async () => {
    if (!address) {
      setError("No wallet connected");
      return;
    }

    setError(null);
    try {
      // 1. Request nonce from server
      setState("requesting_nonce");
      const nonceRes = await fetch(`/api/auth/nonce?wallet=${address}`);
      if (!nonceRes.ok) throw new Error("Failed to fetch nonce");
      const { nonce, message } = await nonceRes.json();

      // 2. Ask wallet to sign the message
      setState("waiting_signature");
      let signature: string;
      try {
        signature = await signMessageAsync({ message });
      } catch (e: unknown) {
        // User rejected
        const msg = e instanceof Error ? e.message : String(e);
        if (msg.toLowerCase().includes("reject") || msg.toLowerCase().includes("denied")) {
          setState("idle");
          return;
        }
        throw e;
      }

      // 3. Verify on server — creates session cookie
      setState("verifying");
      const verifyRes = await fetch("/api/auth/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ wallet: address, signature, nonce }),
      });
      if (!verifyRes.ok) {
        const body = await verifyRes.json().catch(() => ({}));
        throw new Error(body.error ?? "Verification failed");
      }

      setState("authenticated");
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Sign-in failed";
      setError(msg);
      setState("error");
    }
  }, [address, signMessageAsync]);

  const signOut = useCallback(async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    disconnect();
    setState("idle");
    setError(null);
  }, [disconnect]);

  return { state, error, signIn, signOut };
}
