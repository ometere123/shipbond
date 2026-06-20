"use client";

import { useAccount, useConnect, useSwitchChain } from "wagmi";
import { useWalletAuth } from "@/hooks/useWalletAuth";
import { ShipBondLogo } from "@/components/brand/ShipBondLogo";
import { Button } from "@/components/ui/Button";
import { BRADBURY_CHAIN_ID } from "@/lib/wagmi";
import { shortenAddress } from "@/lib/utils";
import { cn } from "@/lib/utils";
import Link from "next/link";
import {
  Wallet,
  CheckCircle,
  AlertTriangle,
  ArrowRight,
  ExternalLink,
  Zap,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";

const BRADBURY_CHAIN_PARAMS = {
  chainId: "0x107D", // 4221 in hex
  chainName: "GenLayer Bradbury",
  nativeCurrency: { name: "GEN", symbol: "GEN", decimals: 18 },
  rpcUrls: ["https://rpc.testnet-chain.genlayer.com"],
  blockExplorerUrls: ["https://explorer-bradbury.genlayer.com"],
};

async function addAndSwitchToBradbury() {
  const provider = (window as any).ethereum;
  if (!provider) throw new Error("No wallet detected");
  try {
    await provider.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: BRADBURY_CHAIN_PARAMS.chainId }],
    });
  } catch (err: any) {
    // 4902 = chain not added yet
    if (err?.code === 4902 || err?.code === -32603) {
      await provider.request({
        method: "wallet_addEthereumChain",
        params: [BRADBURY_CHAIN_PARAMS],
      });
    } else {
      throw err;
    }
  }
}

const STEPS = [
  { id: "connect", label: "Connect Wallet" },
  { id: "network", label: "Switch to Bradbury" },
  { id: "sign",    label: "Sign to Verify" },
] as const;

export function ConnectWalletPanel() {
  const { address, isConnected, chainId } = useAccount();
  const { connect, connectors, isPending: isConnecting } = useConnect();
  const { switchChain } = useSwitchChain();
  const { state: authState, error: authError, signIn } = useWalletAuth();
  const router = useRouter();
  const [isSwitching, setIsSwitching] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [switchError, setSwitchError] = useState<string | null>(null);

  const handleSwitchNetwork = useCallback(async () => {
    setSwitchError(null);
    setIsSwitching(true);
    try {
      await addAndSwitchToBradbury();
    } catch (err: any) {
      setSwitchError(err?.message ?? "Failed to switch network");
    } finally {
      setIsSwitching(false);
    }
  }, []);

  const onBradbury = chainId === BRADBURY_CHAIN_ID;
  const isSigning = ["requesting_nonce","waiting_signature","verifying"].includes(authState);
  const isAuthenticated = authState === "authenticated";

  // Redirect after successful auth
  useEffect(() => {
    if (!isAuthenticated || isRedirecting) return;

    setIsRedirecting(true);
    router.replace("/app/port");
    router.refresh();

    const fallback = window.setTimeout(() => {
      if (window.location.pathname === "/connect") {
        window.location.assign("/app/port");
      }
    }, 1200);

    return () => window.clearTimeout(fallback);
  }, [isAuthenticated, isRedirecting, router]);

  const injectedConnector = connectors.find((c) => c.type === "injected");

  // Active step index
  const activeStep = !isConnected ? 0 : !onBradbury ? 1 : 2;

  return (
    <div className="min-h-screen bg-port-black flex items-center justify-center px-6 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-port-grid bg-grid opacity-60" />
      <div className="absolute inset-0 bg-amber-radial" />

      <div className="relative z-10 w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-10">
          <ShipBondLogo size="lg" className="justify-center mb-4" />
          <p className="font-body text-table text-fog">
            Connect your browser wallet to access ShipBond.
          </p>
        </div>

        {/* Step progress */}
        <div className="flex items-center gap-2 mb-6">
          {STEPS.map((step, i) => {
            const done = i < activeStep || isAuthenticated;
            const active = i === activeStep && !isAuthenticated;
            return (
              <div key={step.id} className="flex items-center gap-2 flex-1">
                <div className="flex items-center gap-1.5">
                  <div
                    className={cn(
                      "w-6 h-6 rounded-full flex items-center justify-center text-meta font-mono shrink-0",
                      done
                        ? "bg-lime-passed/20 text-lime-passed border border-lime-passed/40"
                        : active
                        ? "bg-amber-bond/20 text-amber-bond border border-amber-bond/40"
                        : "bg-port-card text-steel border border-port-border"
                    )}
                  >
                    {done ? <CheckCircle size={12} /> : i + 1}
                  </div>
                  <span
                    className={cn(
                      "font-body text-meta whitespace-nowrap",
                      done ? "text-lime-passed" : active ? "text-signal" : "text-steel"
                    )}
                  >
                    {step.label}
                  </span>
                </div>
                {i < STEPS.length - 1 && (
                  <div
                    className={cn(
                      "flex-1 h-px",
                      i < activeStep ? "bg-lime-passed/30" : "bg-port-border"
                    )}
                  />
                )}
              </div>
            );
          })}
        </div>

        {/* Main panel */}
        <div className="bg-port-card border border-port-border rounded-panel p-6 space-y-5">

          {/* Step 1 — Connect */}
          <div
            className={cn(
              "rounded-btn border p-4 transition-colors",
              activeStep === 0
                ? "border-amber-bond/30 bg-amber-bond/5"
                : isConnected
                ? "border-port-border/50 opacity-60"
                : "border-port-border"
            )}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Wallet size={15} className={isConnected ? "text-lime-passed" : "text-amber-bond"} />
                <span className="font-body text-table font-medium text-signal">
                  Connect Injected Wallet
                </span>
              </div>
              {isConnected && <CheckCircle size={15} className="text-lime-passed" />}
            </div>

            {!isConnected ? (
              <>
                {/* Injected wallet notice */}
                <div className="bg-port-panel rounded-btn px-3 py-2 mb-3 border border-port-border">
                  <p className="font-mono text-meta text-amber-bond uppercase tracking-wider mb-0.5">
                    Recommended
                  </p>
                  <p className="font-body text-meta text-fog">
                    MetaMask, Rabby, Frame, or any EIP-1193 browser wallet.
                  </p>
                </div>

                {injectedConnector ? (
                  <Button
                    fullWidth
                    variant="primary"
                    loading={isConnecting}
                    onClick={() => connect({ connector: injectedConnector })}
                  >
                    <Wallet size={15} />
                    Connect Browser Wallet
                  </Button>
                ) : (
                  <div className="text-center space-y-3">
                    <p className="font-body text-table text-fog">
                      No injected wallet detected. Install one of:
                    </p>
                    {[
                      { name: "MetaMask", url: "https://metamask.io" },
                      { name: "Rabby",    url: "https://rabby.io" },
                    ].map(({ name, url }) => (
                      <a
                        key={name}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-between w-full px-4 py-2.5 bg-port-panel border border-port-border rounded-btn hover:border-port-border-bright transition-colors"
                      >
                        <span className="font-body text-table text-fog">{name}</span>
                        <ExternalLink size={13} className="text-steel" />
                      </a>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <p className="font-mono text-meta text-fog">{address && shortenAddress(address, 6)}</p>
            )}
          </div>

          {/* Step 2 — Network */}
          <div
            className={cn(
              "rounded-btn border p-4 transition-colors",
              !isConnected
                ? "border-port-border opacity-40 pointer-events-none"
                : activeStep === 1
                ? "border-amber-bond/30 bg-amber-bond/5"
                : onBradbury
                ? "border-port-border/50 opacity-60"
                : "border-port-border"
            )}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Zap size={15} className={onBradbury ? "text-lime-passed" : "text-amber-bond"} />
                <span className="font-body text-table font-medium text-signal">
                  Switch to Bradbury
                </span>
              </div>
              {onBradbury && <CheckCircle size={15} className="text-lime-passed" />}
            </div>

            {isConnected && !onBradbury && (
              <>
                <div className="flex items-center gap-2 mb-3">
                  <AlertTriangle size={13} className="text-amber-bond" />
                  <p className="font-body text-meta text-fog">
                    Currently on chain{" "}
                    <span className="font-mono text-signal">{chainId}</span>. Need{" "}
                    <span className="font-mono text-amber-bond">4221</span>.
                  </p>
                </div>
                {switchError && (
                  <p className="font-body text-meta text-red-failed mb-3">{switchError}</p>
                )}
                <Button
                  fullWidth
                  variant="primary"
                  loading={isSwitching}
                  onClick={handleSwitchNetwork}
                >
                  Add &amp; Switch to GenLayer Bradbury
                </Button>
              </>
            )}
            {onBradbury && (
              <p className="font-mono text-meta text-fog">GenLayer Bradbury · Chain 4221</p>
            )}
          </div>

          {/* Step 3 — Sign */}
          <div
            className={cn(
              "rounded-btn border p-4 transition-colors",
              activeStep < 2
                ? "border-port-border opacity-40 pointer-events-none"
                : isAuthenticated
                ? "border-lime-passed/30 bg-lime-passed/5"
                : "border-violet-consensus/30 bg-violet-consensus/5"
            )}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <CheckCircle
                  size={15}
                  className={isAuthenticated ? "text-lime-passed" : "text-violet-consensus"}
                />
                <span className="font-body text-table font-medium text-signal">
                  Sign to Verify
                </span>
              </div>
              {isAuthenticated && <CheckCircle size={15} className="text-lime-passed" />}
            </div>

            <p className="font-body text-meta text-fog mb-3">
              Sign a message to prove wallet ownership. No transaction. No gas.
            </p>

            {authError && (
              <p className="font-body text-meta text-red-failed mb-3">{authError}</p>
            )}

            {isConnected && onBradbury && !isAuthenticated && (
              <Button
                fullWidth
                variant="genlayer"
                loading={isSigning}
                onClick={signIn}
              >
                Sign Message
                <ArrowRight size={15} />
              </Button>
            )}

            {(isAuthenticated || isRedirecting) && (
              <p className="font-mono text-meta text-lime-passed">
                Verified — redirecting…
              </p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-6 space-y-2">
          <p className="font-mono text-meta text-steel">
            GenLayer Bradbury · Chain 4221 · GEN
          </p>
          <Link href="/" className="font-body text-meta text-steel hover:text-fog transition-colors">
            ← Back to landing
          </Link>
        </div>
      </div>
    </div>
  );
}
