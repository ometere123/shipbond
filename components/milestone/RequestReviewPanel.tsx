"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { PortPanel } from "@/components/ui/PortPanel";
import { HashPlate } from "@/components/ui/HashPlate";
import { useRequestReview } from "@/hooks/useContractActions";
import { AlertTriangle, Gavel } from "lucide-react";

interface RequestReviewPanelProps {
  milestoneId: string;
  onChainId: string;
  evidenceDigest: string;
}

export function RequestReviewPanel({ milestoneId, onChainId, evidenceDigest }: RequestReviewPanelProps) {
  const router = useRouter();
  const { execute } = useRequestReview();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function requestReview() {
    setBusy(true);
    setError(null);
    try {
      const txHash = await execute(onChainId);
      if (!txHash) throw new Error("Review transaction failed or was rejected");

      const res = await fetch(`/api/milestones/${milestoneId}/request-review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tx_hash: txHash }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error ?? "Failed to record review request");

      await fetch("/api/contract/sync-verdict", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ milestoneId }),
      }).catch(() => undefined);

      router.push(`/app/port/${milestoneId}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not request GenLayer review");
    } finally {
      setBusy(false);
    }
  }

  return (
    <PortPanel label="Consensus Request" glow="violet" className="max-w-2xl">
      <div className="space-y-5">
        <p className="font-body text-table text-fog">
          GenLayer validators will compare the milestone terms against the public evidence packet and write a structured verdict to the contract.
        </p>
        <div className="flex items-center gap-3 border-t border-port-border pt-4">
          <span className="font-mono text-meta text-steel uppercase tracking-wider">Evidence Digest</span>
          <HashPlate value={evidenceDigest} type="hash" explorerType="none" />
        </div>
        {error && (
          <div className="flex items-start gap-2 rounded-btn border border-red-failed/30 bg-red-failed/10 p-3">
            <AlertTriangle size={14} className="text-red-failed shrink-0 mt-0.5" />
            <p className="font-body text-table text-red-failed">{error}</p>
          </div>
        )}
        <Button variant="genlayer" size="lg" loading={busy} onClick={requestReview}>
          <Gavel size={16} />
          Request GenLayer Review
        </Button>
      </div>
    </PortPanel>
  );
}
