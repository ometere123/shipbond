"use client";

/**
 * All ShipBond write actions against the global protocol contract.
 *
 * Every action uses the injected wallet (window.ethereum) via genlayer-js —
 * when account is a string address, eth_* calls route through window.ethereum.
 *
 * value: 0n is required for non-payable calls (genlayer-js contract).
 * All actions wait for ACCEPTED for fast UX. settle/settle_human_agreement
 * wait for FINALIZED since those are the actual payout calls.
 */
import { useState, useCallback } from "react";
import { TransactionStatus } from "genlayer-js/types";
import { useGenLayerClient } from "@/hooks/useGenLayerClient";
import { SHIPBOND_CONTRACT } from "@/lib/genlayer/bradbury-chain";

export type TxState =
  | { status: "idle" }
  | { status: "pending" }
  | { status: "accepted"; hash: string }
  | { status: "finalized"; hash: string }
  | { status: "error"; message: string };

function useTxAction<TArgs extends unknown[]>(
  fn: (...args: TArgs) => Promise<string>,
) {
  const [tx, setTx] = useState<TxState>({ status: "idle" });

  const execute = useCallback(
    async (...args: TArgs): Promise<string | null> => {
      setTx({ status: "pending" });
      try {
        const hash = await fn(...args);
        setTx({ status: "finalized", hash });
        return hash;
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        setTx({ status: "error", message: msg });
        return null;
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [fn],
  );

  return { tx, execute, reset: () => setTx({ status: "idle" }) };
}

// ── Individual action hooks ──────────────────────────────────────────────────

export function useCreateMilestone() {
  const { client } = useGenLayerClient();

  const action = useCallback(
    async (
      title: string,
      description: string,
      termsHash: string,
      bondWei: bigint,
      deadline: bigint,
      rewardWei: bigint,
    ): Promise<string> => {
      if (!client) throw new Error("Wallet not connected");
      const hash = await client.writeContract({
        address:      SHIPBOND_CONTRACT,
        functionName: "create_milestone",
        args:         [title, description, termsHash, bondWei, deadline],
        value:        rewardWei,
      });
      await client.waitForTransactionReceipt({
        hash,
        status:  TransactionStatus.ACCEPTED,
        retries: 60,
      });
      return hash as string;
    },
    [client],
  );

  return useTxAction(action);
}

export function useAcceptMilestone() {
  const { client } = useGenLayerClient();

  const action = useCallback(
    async (milestoneId: string, bondWei: bigint): Promise<string> => {
      if (!client) throw new Error("Wallet not connected");
      const hash = await client.writeContract({
        address:      SHIPBOND_CONTRACT,
        functionName: "accept_milestone",
        args:         [milestoneId],
        value:        bondWei,
      });
      await client.waitForTransactionReceipt({
        hash,
        status:  TransactionStatus.ACCEPTED,
        retries: 60,
      });
      return hash as string;
    },
    [client],
  );

  return useTxAction(action);
}

export function useSubmitEvidence() {
  const { client } = useGenLayerClient();

  const action = useCallback(
    async (
      milestoneId: string,
      evidenceDigest: string,
      evidenceRefsJson: string,
    ): Promise<string> => {
      if (!client) throw new Error("Wallet not connected");
      const hash = await client.writeContract({
        address:      SHIPBOND_CONTRACT,
        functionName: "submit_evidence",
        args:         [milestoneId, evidenceDigest, evidenceRefsJson],
        value:        0n,
      });
      await client.waitForTransactionReceipt({
        hash,
        status:  TransactionStatus.ACCEPTED,
        retries: 60,
      });
      return hash as string;
    },
    [client],
  );

  return useTxAction(action);
}

export function useRequestReview() {
  const { client } = useGenLayerClient();

  const action = useCallback(
    async (milestoneId: string): Promise<string> => {
      if (!client) throw new Error("Wallet not connected");
      const hash = await client.writeContract({
        address:      SHIPBOND_CONTRACT,
        functionName: "request_review",
        args:         [milestoneId],
        value:        0n,
      });
      await client.waitForTransactionReceipt({
        hash,
        status:  TransactionStatus.ACCEPTED,
        retries: 60,
      });
      return hash as string;
    },
    [client],
  );

  return useTxAction(action);
}

export function useSettle() {
  const { client } = useGenLayerClient();

  const action = useCallback(
    async (milestoneId: string): Promise<string> => {
      if (!client) throw new Error("Wallet not connected");
      const hash = await client.writeContract({
        address:      SHIPBOND_CONTRACT,
        functionName: "settle",
        args:         [milestoneId],
        value:        0n,
      });
      // Payout — wait for FINALIZED to confirm funds moved
      await client.waitForTransactionReceipt({
        hash,
        status:  TransactionStatus.FINALIZED,
        retries: 180,
      });
      return hash as string;
    },
    [client],
  );

  return useTxAction(action);
}

export function useCancelMilestone() {
  const { client } = useGenLayerClient();

  const action = useCallback(
    async (milestoneId: string): Promise<string> => {
      if (!client) throw new Error("Wallet not connected");
      const hash = await client.writeContract({
        address:      SHIPBOND_CONTRACT,
        functionName: "cancel_milestone",
        args:         [milestoneId],
        value:        0n,
      });
      await client.waitForTransactionReceipt({
        hash,
        status:  TransactionStatus.ACCEPTED,
        retries: 60,
      });
      return hash as string;
    },
    [client],
  );

  return useTxAction(action);
}

export function useProposeHumanSettlement() {
  const { client } = useGenLayerClient();

  const action = useCallback(
    async (
      milestoneId: string,
      builderPayoutBps: number,
      bondAction: "RETURN" | "SLASH" | "HOLD",
      reason: string,
    ): Promise<string> => {
      if (!client) throw new Error("Wallet not connected");
      const hash = await client.writeContract({
        address:      SHIPBOND_CONTRACT,
        functionName: "propose_human_settlement",
        args:         [milestoneId, builderPayoutBps, bondAction, reason],
        value:        0n,
      });
      // State write, no money moves — ACCEPTED sufficient.
      await client.waitForTransactionReceipt({
        hash,
        status:  TransactionStatus.ACCEPTED,
        retries: 120,
      });
      return hash as string;
    },
    [client],
  );

  return useTxAction(action);
}

export function useAcceptHumanSettlement() {
  const { client } = useGenLayerClient();

  const action = useCallback(
    async (milestoneId: string): Promise<string> => {
      if (!client) throw new Error("Wallet not connected");
      const hash = await client.writeContract({
        address:      SHIPBOND_CONTRACT,
        functionName: "accept_human_settlement",
        args:         [milestoneId],
        value:        0n,
      });
      // State write, no money moves — ACCEPTED sufficient.
      await client.waitForTransactionReceipt({
        hash,
        status:  TransactionStatus.ACCEPTED,
        retries: 120,
      });
      return hash as string;
    },
    [client],
  );

  return useTxAction(action);
}

export function useSettleHumanAgreement() {
  const { client } = useGenLayerClient();

  const action = useCallback(
    async (milestoneId: string): Promise<string> => {
      if (!client) throw new Error("Wallet not connected");
      const hash = await client.writeContract({
        address:      SHIPBOND_CONTRACT,
        functionName: "settle_human_agreement",
        args:         [milestoneId],
        value:        0n,
      });
      await client.waitForTransactionReceipt({
        hash,
        status:  TransactionStatus.FINALIZED,
        retries: 180,
      });
      return hash as string;
    },
    [client],
  );

  return useTxAction(action);
}
