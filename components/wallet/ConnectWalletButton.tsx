"use client";

import { useAccount, useConnect, useDisconnect, useChainId, useSwitchChain } from "wagmi";
import { useWalletAuth } from "@/hooks/useWalletAuth";
import { Button } from "@/components/ui/Button";
import { shortenAddress } from "@/lib/utils";
import { STUDIONET_CHAIN_ID } from "@/lib/wagmi";
import { Wallet, LogOut, AlertTriangle, ChevronDown } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";

export function ConnectWalletButton() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { connect, connectors, isPending: isConnecting } = useConnect();
  const { disconnect } = useDisconnect();
  const { switchChain } = useSwitchChain();
  const { state: authState, signIn } = useWalletAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const wrongChain = isConnected && chainId !== STUDIONET_CHAIN_ID;
  const isAuthenticated = authState === "authenticated";
  const isSigning = authState === "waiting_signature" || authState === "verifying" || authState === "requesting_nonce";

  // Close menu on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Not connected — show connect button
  if (!isConnected) {
    const injectedConnector = connectors.find((c) => c.type === "injected");
    return (
      <Button
        variant="primary"
        size="sm"
        loading={isConnecting}
        onClick={() => injectedConnector && connect({ connector: injectedConnector })}
        disabled={!injectedConnector}
      >
        <Wallet size={14} />
        {injectedConnector ? "Connect Wallet" : "No Wallet Detected"}
      </Button>
    );
  }

  // Wrong chain — prompt switch
  if (wrongChain) {
    return (
      <button
        onClick={() => switchChain({ chainId: STUDIONET_CHAIN_ID })}
        className={cn(
          "inline-flex items-center gap-2 px-3 py-2 rounded-btn",
          "bg-amber-bond/10 border border-amber-bond/40 text-amber-bond",
          "font-body text-table font-medium",
          "hover:bg-amber-bond/20 transition-colors cursor-pointer"
        )}
      >
        <AlertTriangle size={13} />
        Switch to Studionet
      </button>
    );
  }

  // Connected, correct chain, not yet signed in
  if (!isAuthenticated) {
    return (
      <Button
        variant="secondary"
        size="sm"
        loading={isSigning}
        onClick={signIn}
      >
        <Wallet size={14} />
        {isSigning ? "Signing…" : "Sign In"}
      </Button>
    );
  }

  // Connected + authenticated — show address pill with dropdown
  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setMenuOpen((o) => !o)}
        className={cn(
          "inline-flex items-center gap-2 px-3 py-2 rounded-btn",
          "bg-port-card border border-port-border",
          "font-mono text-meta text-fog",
          "hover:border-port-border-bright hover:text-signal transition-colors cursor-pointer"
        )}
      >
        {/* Status dot */}
        <span className="w-2 h-2 rounded-full bg-lime-passed animate-pulse" />
        {address && shortenAddress(address)}
        <ChevronDown size={12} className={cn("transition-transform", menuOpen && "rotate-180")} />
      </button>

      {menuOpen && (
        <div className="absolute right-0 top-full mt-1.5 w-52 bg-port-panel border border-port-border rounded-panel shadow-card-lift z-50 py-1">
          {/* Network info */}
          <div className="px-3 py-2 border-b border-port-border">
            <p className="font-mono text-meta text-steel">GenLayer Studionet</p>
            <p className="font-mono text-meta text-fog">Chain ID 61999</p>
          </div>
          {/* Full address */}
          <div className="px-3 py-2 border-b border-port-border">
            <p className="font-mono text-meta text-steel break-all">{address}</p>
          </div>
          {/* Disconnect */}
          <button
            onClick={() => { disconnect(); setMenuOpen(false); }}
            className="w-full flex items-center gap-2 px-3 py-2.5 text-left font-body text-table text-fog hover:text-red-failed hover:bg-port-card transition-colors"
          >
            <LogOut size={13} />
            Disconnect
          </button>
        </div>
      )}
    </div>
  );
}
