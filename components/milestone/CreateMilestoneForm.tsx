"use client";

/**
 * CreateMilestoneForm — 4-step flow:
 *
 *  1. POST /api/milestones/create
 *     Server creates DB record, embeds local DB ID in terms_hash, returns
 *     { id, terms_hash, reward_wei, bond_wei, deadline_ts }.
 *
 *  2. useCreateMilestone hook
 *     Signs and sends create_milestone(title, description, terms_hash, bond_wei, deadline)
 *     with reward_wei attached as msg.value. Wallet prompt (MetaMask/Rabby).
 *     Waits for ACCEPTED status before returning.
 *
 *  3. POST /api/milestones/[id]/set-on-chain-id with { tx_hash }
 *     Server resolves the real on-chain milestone_id by scanning
 *     get_sponsor_milestone_ids and matching terms_hash. Verifies against
 *     the contract before storing. No placeholder IDs.
 *
 *  4. Redirect to /app/port/[id]
 */

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAccount } from "wagmi";
import { Button } from "@/components/ui/Button";
import { PortPanel } from "@/components/ui/PortPanel";
import { cn } from "@/lib/utils";
import { useCreateMilestone } from "@/hooks/useContractActions";
import { AlertTriangle, CheckCircle, Coins, Lock, FileText, Calendar, Loader2, ExternalLink } from "lucide-react";
import { buildBradburyTxUrl } from "@/lib/utils";

interface FormState {
  title:       string;
  description: string;
  reward_gen:  string;
  bond_gen:    string;
  deadline:    string;
}

const INITIAL: FormState = {
  title:       "",
  description: "",
  reward_gen:  "",
  bond_gen:    "",
  deadline:    "",
};

type Step = "idle" | "saving" | "wallet" | "linking" | "done";

export function CreateMilestoneForm() {
  const router = useRouter();
  const { address, isConnected } = useAccount();
  const [form, setForm]           = useState<FormState>(INITIAL);
  const [errors, setErrors]       = useState<Partial<FormState>>({});
  const [busy, setBusy]           = useState(false);
  const [step, setStep]           = useState<Step>("idle");
  const [serverError, setServerError] = useState<string | null>(null);
  const [confirmedHash, setConfirmedHash] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);

  const { execute: createOnChain } = useCreateMilestone();

  function set(field: keyof FormState) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setForm((f) => ({ ...f, [field]: e.target.value }));
      setErrors((err) => ({ ...err, [field]: undefined }));
    };
  }

  function validate(): boolean {
    const e: Partial<FormState> = {};
    if (!form.title.trim() || form.title.trim().length < 5)
      e.title = "At least 5 characters required";
    if (!form.description.trim() || form.description.trim().length < 20)
      e.description = "At least 20 characters required";
    if (!form.reward_gen || isNaN(Number(form.reward_gen)) || Number(form.reward_gen) <= 0)
      e.reward_gen = "Enter a positive GEN amount";
    if (!form.bond_gen || isNaN(Number(form.bond_gen)) || Number(form.bond_gen) <= 0)
      e.bond_gen = "Enter a positive GEN amount";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    if (!isConnected || !address) {
      setServerError("Connect your wallet first");
      return;
    }

    setBusy(true);
    setServerError(null);

    try {
      // ── Step 1: Create DB record, get terms_hash from server ──────────────
      setStep("saving");
      const res = await fetch("/api/milestones/create", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title:       form.title.trim(),
          description: form.description.trim(),
          reward_gen:  form.reward_gen,
          bond_gen:    form.bond_gen,
          deadline:    form.deadline || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setServerError(data.error ?? "Failed to create milestone record");
        return;
      }

      const {
        id:          dbId,
        terms_hash:  termsHash,
        reward_wei:  rewardWei,
        bond_wei:    bondWei,
        deadline_ts: deadlineTs,
      } = data as {
        id:          string;
        terms_hash:  string;
        reward_wei:  string;
        bond_wei:    string;
        deadline_ts: string;
      };

      setConfirmedHash(termsHash);

      // ── Step 2: Publish to GenLayer — wallet signs ────────────────────────
      setStep("wallet");
      const txHash = await createOnChain(
        form.title.trim(),
        form.description.trim(),
        termsHash,
        BigInt(bondWei),
        BigInt(deadlineTs),
        BigInt(rewardWei),
      );

      if (txHash) setTxHash(txHash);
      if (!txHash) {
        setServerError(
          "Wallet transaction was rejected or failed. " +
          "Your DB record is saved — you can retry publishing from the milestone page.",
        );
        router.push(`/app/port/${dbId}`);
        return;
      }

      // ── Step 3: Resolve real on_chain_id server-side ─────────────────────
      setStep("linking");
      const linkRes = await fetch(`/api/milestones/${dbId}/set-on-chain-id`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ tx_hash: txHash }),
      });

      if (!linkRes.ok) {
        const linkData = await linkRes.json().catch(() => ({}));
        // Non-fatal: milestone exists on chain, ID resolution can be retried
        console.warn("[CreateMilestoneForm] set-on-chain-id failed:", linkData);
        setServerError(
          "Milestone created on chain, but ID linking timed out. " +
          "It will resolve automatically — proceed to your milestone.",
        );
      }

      setStep("done");
      router.push(`/app/port/${dbId}`);
    } catch (err: unknown) {
      setServerError(err instanceof Error ? err.message : "Unexpected error");
    } finally {
      setBusy(false);
      setStep("idle");
    }
  }

  const stepLabel: Record<Step, string | null> = {
    idle:    null,
    saving:  "Saving to database…",
    wallet:  "Waiting for wallet confirmation…",
    linking: "Linking on-chain ID…",
    done:    "Done — redirecting…",
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">

      {/* Title */}
      <PortPanel label="Milestone Title">
        <div className="space-y-2">
          <p className="font-body text-meta text-fog">
            A plain-language promise. What must the builder deliver?
          </p>
          <Field icon={<FileText size={14} />} error={errors.title}>
            <input
              className={inputClass(!!errors.title)}
              placeholder="e.g. Deploy a working ERC-20 contract on Bradbury with test coverage"
              value={form.title}
              onChange={set("title")}
              maxLength={200}
            />
          </Field>
          <CharCount value={form.title} max={200} />
        </div>
      </PortPanel>

      {/* Description */}
      <PortPanel label="Terms & Acceptance Criteria">
        <div className="space-y-2">
          <p className="font-body text-meta text-fog">
            Describe exactly what counts as completion. Be specific — the GenLayer IC evaluates this verbatim.
          </p>
          <textarea
            className={cn(inputClass(!!errors.description), "min-h-[140px] resize-y")}
            placeholder={"The builder must:\n1. Deploy an ERC-20 token contract to Bradbury\n2. Provide a public GitHub repo with ≥ 80% test coverage\n3. Submit contract address and deployment tx hash"}
            value={form.description}
            onChange={set("description")}
            maxLength={3000}
          />
          {errors.description && <FieldError>{errors.description}</FieldError>}
          <CharCount value={form.description} max={3000} />
        </div>
      </PortPanel>

      {/* Reward + Bond */}
      <PortPanel label="Reward & Bond">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="flex items-center gap-1.5 font-mono text-meta text-amber-bond uppercase tracking-wider">
              <Coins size={13} /> Reward (GEN)
            </label>
            <p className="font-body text-meta text-steel/70">Paid to builder on passing verdict</p>
            <Field icon={null} error={errors.reward_gen}>
              <input
                type="number" min="0.0001" step="any"
                className={inputClass(!!errors.reward_gen)}
                placeholder="100"
                value={form.reward_gen}
                onChange={set("reward_gen")}
              />
            </Field>
          </div>
          <div className="space-y-2">
            <label className="flex items-center gap-1.5 font-mono text-meta text-cyan-evidence uppercase tracking-wider">
              <Lock size={13} /> Builder Bond (GEN)
            </label>
            <p className="font-body text-meta text-steel/70">Returned on pass · Slashed on fail</p>
            <Field icon={null} error={errors.bond_gen}>
              <input
                type="number" min="0.0001" step="any"
                className={inputClass(!!errors.bond_gen)}
                placeholder="20"
                value={form.bond_gen}
                onChange={set("bond_gen")}
              />
            </Field>
          </div>
        </div>
        <p className="font-mono text-meta text-steel/50 mt-3">
          Values stored in wei on-chain. GenLayer Bradbury · GEN token.
        </p>
      </PortPanel>

      {/* Deadline */}
      <PortPanel label="Deadline (Optional)">
        <div className="space-y-2">
          <p className="font-body text-meta text-fog">
            Leave blank for open-ended. Builders will see this prominently.
          </p>
          <Field icon={<Calendar size={14} />} error={undefined}>
            <input
              type="datetime-local"
              className={inputClass(false)}
              value={form.deadline}
              onChange={set("deadline")}
              min={new Date().toISOString().slice(0, 16)}
            />
          </Field>
        </div>
      </PortPanel>

      {/* Confirmed terms hash (set by server after DB record created) */}
      {confirmedHash && (
        <div className="flex items-center gap-2 px-4 py-3 bg-violet-consensus/8 border border-violet-consensus/25 rounded-btn">
          <CheckCircle size={14} className="text-lime-passed shrink-0" />
          <span className="font-mono text-meta text-fog">Terms hash confirmed:</span>
          <span className="hash-text text-violet-consensus text-meta truncate">{confirmedHash}</span>
        </div>
      )}

      {/* TX hash link → Bradbury explorer */}
      {txHash && (
        <div className="flex items-center gap-2 px-4 py-3 bg-lime-passed/8 border border-lime-passed/25 rounded-btn">
          <CheckCircle size={14} className="text-lime-passed shrink-0" />
          <span className="font-mono text-meta text-fog">TX confirmed:</span>
          <a
            href={buildBradburyTxUrl(txHash)}
            target="_blank"
            rel="noopener noreferrer"
            className="hash-text text-lime-passed text-meta truncate hover:text-signal flex items-center gap-1"
          >
            {txHash.slice(0, 10)}…{txHash.slice(-8)}
            <ExternalLink size={11} />
          </a>
        </div>
      )}

      {/* Error */}
      {serverError && (
        <div className="flex items-start gap-2 px-4 py-3 bg-red-failed/10 border border-red-failed/30 rounded-btn">
          <AlertTriangle size={14} className="text-red-failed shrink-0 mt-0.5" />
          <span className="font-body text-table text-red-failed">{serverError}</span>
        </div>
      )}

      {/* Submit */}
      <div className="flex items-center gap-4 pt-2">
        <Button type="submit" variant="primary" size="lg" loading={busy && step !== "wallet"}>
          {step === "wallet" ? (
            <span className="flex items-center gap-2">
              <Loader2 size={14} className="animate-spin" />
              Waiting for wallet…
            </span>
          ) : "Create Milestone"}
        </Button>
        <p className="font-body text-meta text-steel">
          {stepLabel[step] ?? (
            <>Status will be <span className="text-amber-bond font-mono">OPEN</span> after on-chain confirmation.</>
          )}
        </p>
      </div>
    </form>
  );
}

// ── Helpers ────────────────────────────────────────────────────────────────

function inputClass(hasError: boolean) {
  return cn(
    "w-full bg-port-black border rounded-btn px-3 py-2.5",
    "font-body text-table text-signal placeholder:text-steel/40",
    "focus:outline-none focus:ring-1 focus:ring-amber-bond/50",
    "transition-colors",
    hasError
      ? "border-red-failed/40 focus:border-red-failed/60"
      : "border-port-border focus:border-amber-bond/50",
  );
}

function Field({
  children,
  icon,
  error,
}: {
  children: React.ReactNode;
  icon: React.ReactNode | null;
  error: string | undefined;
}) {
  return (
    <div className="relative">
      {icon && (
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-steel pointer-events-none">
          {icon}
        </div>
      )}
      <div className={icon ? "pl-8" : ""}>{children}</div>
      {error && <FieldError>{error}</FieldError>}
    </div>
  );
}

function FieldError({ children }: { children: React.ReactNode }) {
  return (
    <p className="flex items-center gap-1 font-body text-meta text-red-failed mt-1">
      <AlertTriangle size={11} />
      {children}
    </p>
  );
}

function CharCount({ value, max }: { value: string; max: number }) {
  const pct = value.length / max;
  return (
    <p className={cn("font-mono text-meta text-right", pct > 0.9 ? "text-amber-bond" : "text-steel/40")}>
      {value.length}/{max}
    </p>
  );
}
