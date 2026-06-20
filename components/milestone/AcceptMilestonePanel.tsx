"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAccount } from "wagmi";
import { Button } from "@/components/ui/Button";
import { PortPanel } from "@/components/ui/PortPanel";
import { HashPlate } from "@/components/ui/HashPlate";
import { formatGEN } from "@/lib/utils";
import { useAcceptMilestone } from "@/hooks/useContractActions";
import { AlertTriangle, Lock } from "lucide-react";

interface AcceptMilestonePanelProps {
  milestoneId: string;
  onChainId: string;
  title: string;
  bondWei: string;
}

export function AcceptMilestonePanel({ milestoneId, onChainId, title, bondWei }: AcceptMilestonePanelProps) {
  const router = useRouter();
  const { isConnected } = useAccount();
  const { execute } = useAcceptMilestone();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function accept() {
    setError(null);
    if (!isConnected) {
      setError("Connect and sign in before locking a builder bond.");
      return;
    }

    setBusy(true);
    try {
      const txHash = await execute(onChainId, BigInt(bondWei));
      if (!txHash) {
        setError("Bond transaction failed or was rejected.");
        return;
      }

      const res = await fetch(`/api/milestones/${milestoneId}/accept`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tx_hash: txHash }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error ?? "Failed to record acceptance");

      router.push(`/app/milestones/${milestoneId}/submit`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not accept milestone");
    } finally {
      setBusy(false);
    }
  }

  return (
    <PortPanel label="Lock Builder Bond" glow="cyan" className="max-w-2xl">
      <div className="space-y-5">
        <div>
          <h2 className="font-display text-panel-title text-signal mb-2">{title}</h2>
          <p className="font-body text-table text-fog">
            Lock exactly <span className="font-mono text-cyan-evidence">{formatGEN(BigInt(bondWei))} GEN</span>.
            This bond returns on a passing or partial verdict and is slashed on failure.
          </p>
        </div>

        <div className="flex items-center gap-3 border-t border-port-border pt-4">
          <span className="font-mono text-meta text-steel uppercase tracking-wider">On-chain ID</span>
          <HashPlate value={onChainId} type="hash" explorerType="none" />
        </div>

        {error && (
          <div className="flex items-start gap-2 rounded-btn border border-red-failed/30 bg-red-failed/10 p-3">
            <AlertTriangle size={14} className="text-red-failed shrink-0 mt-0.5" />
            <p className="font-body text-table text-red-failed">{error}</p>
          </div>
        )}

        <Button variant="primary" size="lg" loading={busy} onClick={accept}>
          <Lock size={16} />
          Lock Bond & Accept
        </Button>
      </div>
    </PortPanel>
  );
}
