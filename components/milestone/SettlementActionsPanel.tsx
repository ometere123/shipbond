"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { PortPanel } from "@/components/ui/PortPanel";
import {
  useAcceptHumanSettlement,
  useProposeHumanSettlement,
  useSettle,
  useSettleHumanAgreement,
} from "@/hooks/useContractActions";
import { AlertTriangle, CheckCircle, Handshake, Send } from "lucide-react";
import type { Database } from "@/types/supabase";

type Review = Database["public"]["Tables"]["reviews"]["Row"];

interface SettlementActionsPanelProps {
  milestoneId: string;
  onChainId: string;
  review: Review | null;
  isSponsor: boolean;
  isBuilder: boolean;
}

export function SettlementActionsPanel({ milestoneId, onChainId, review, isSponsor, isBuilder }: SettlementActionsPanelProps) {
  const router = useRouter();
  const settle = useSettle();
  const proposeHuman = useProposeHumanSettlement();
  const acceptHuman = useAcceptHumanSettlement();
  const settleHuman = useSettleHumanAgreement();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [humanPayoutBps, setHumanPayoutBps] = useState("5000");
  const [humanBondAction, setHumanBondAction] = useState<"RETURN" | "SLASH">("RETURN");
  const [humanReason, setHumanReason] = useState("");

  const needsHuman = review?.verdict === "needs_human_review";
  const autoReady = review?.verdict && !needsHuman;

  async function recordSettlement(txHash: string, human = false) {
    const res = await fetch(`/api/milestones/${milestoneId}/settle`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tx_hash: txHash, human }),
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(body.error ?? "Failed to record settlement");
  }

  async function run(label: string, action: () => Promise<string | null>, human = false) {
    setBusy(label);
    setError(null);
    try {
      const txHash = await action();
      if (!txHash) throw new Error("Wallet transaction failed or was rejected");
      if (label.includes("Settle")) await recordSettlement(txHash, human);
      router.refresh();
      if (label.includes("Settle")) router.push(`/app/port/${milestoneId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Settlement action failed");
    } finally {
      setBusy(null);
    }
  }

  return (
    <PortPanel label="Settlement Console" glow={needsHuman ? "amber" : "lime" as any} className="max-w-2xl">
      <div className="space-y-5">
        <p className="font-body text-table text-fog">
          Verdict: <span className="font-mono text-signal uppercase">{review?.verdict?.replace(/_/g, " ") ?? "Not synced"}</span>.
          Bond action: <span className="font-mono text-signal uppercase">{review?.bond_action ?? "pending"}</span>.
        </p>

        {autoReady && (
          <Button
            variant="primary"
            size="lg"
            loading={busy === "Auto Settle"}
            onClick={() => run("Auto Settle", () => settle.execute(onChainId))}
          >
            <CheckCircle size={16} />
            Auto Settle
          </Button>
        )}

        {needsHuman && isSponsor && (
          <div className="space-y-3 rounded-btn border border-amber-bond/20 bg-amber-bond/5 p-4">
            <p className="font-body text-table text-fog">
              GenLayer blocked automatic settlement. Propose a payout split for builder approval.
            </p>
            <input
              className={inputClass}
              value={humanPayoutBps}
              onChange={(event) => setHumanPayoutBps(event.target.value)}
              placeholder="Builder payout bps, e.g. 5000"
            />
            <select
              className={inputClass}
              value={humanBondAction}
              onChange={(event) => setHumanBondAction(event.target.value as "RETURN" | "SLASH")}
            >
              <option value="RETURN">Return builder bond</option>
              <option value="SLASH">Slash builder bond</option>
            </select>
            <textarea
              className={`${inputClass} min-h-[90px] resize-y`}
              value={humanReason}
              onChange={(event) => setHumanReason(event.target.value)}
              placeholder="Reason for the human settlement proposal"
            />
            <Button
              variant="secondary"
              loading={busy === "Propose Human Settlement"}
              onClick={() => run("Propose Human Settlement", () =>
                proposeHuman.execute(onChainId, Number(humanPayoutBps), humanBondAction, humanReason)
              )}
            >
              <Send size={15} />
              Propose Agreement
            </Button>
          </div>
        )}

        {needsHuman && isBuilder && (
          <Button
            variant="secondary"
            loading={busy === "Accept Human Settlement"}
            onClick={() => run("Accept Human Settlement", () => acceptHuman.execute(onChainId), true)}
          >
            <Handshake size={15} />
            Accept Human Agreement
          </Button>
        )}

        {needsHuman && (
          <Button
            variant="primary"
            loading={busy === "Settle Human Agreement"}
            onClick={() => run("Settle Human Agreement", () => settleHuman.execute(onChainId), true)}
          >
            Settle Human Agreement
          </Button>
        )}

        {error && (
          <div className="flex items-start gap-2 rounded-btn border border-red-failed/30 bg-red-failed/10 p-3">
            <AlertTriangle size={14} className="text-red-failed shrink-0 mt-0.5" />
            <p className="font-body text-table text-red-failed">{error}</p>
          </div>
        )}
      </div>
    </PortPanel>
  );
}

const inputClass = "w-full rounded-btn border border-port-border bg-port-black px-3 py-2.5 font-body text-table text-signal focus:border-amber-bond focus:outline-none";
