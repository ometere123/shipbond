"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { PortPanel } from "@/components/ui/PortPanel";
import {
  normalizeEvidencePacket,
  stableEvidenceJson,
  type EvidencePacket,
} from "@/lib/evidence-packet";
import { useSubmitEvidence } from "@/hooks/useContractActions";
import { AlertTriangle, Loader2, Upload } from "lucide-react";

interface EvidenceSubmitFormProps {
  milestoneId: string;
  onChainId: string;
  title: string;
}

const EMPTY: EvidencePacket = {
  repo_url: "",
  full_commit_hash: "",
  raw_readme_url: "",
  repo_tree_url: "",
  raw_key_file_url: "",
  deployment_url: "",
  contract_address: "",
  accept_bond_tx_hash: "",
  read_result_summary: "",
  smoke_test_result: "",
  builder_explanation_summary: "",
  acceptance_criteria_checklist: [""],
};

function deriveGithubUrls(repoUrl: string, hash: string): { rawReadme: string; treeUrl: string } {
  if (!repoUrl || !hash || hash.length < 7) return { rawReadme: "", treeUrl: "" };
  try {
    const url = new URL(repoUrl);
    if (!url.hostname.includes("github.com")) return { rawReadme: "", treeUrl: "" };
    const path = url.pathname.replace(/^\//, "").replace(/\/$/, "").split("/").slice(0, 2).join("/");
    if (!path || !path.includes("/")) return { rawReadme: "", treeUrl: "" };
    return {
      rawReadme: `https://raw.githubusercontent.com/${path}/${hash}/README.md`,
      treeUrl: `https://github.com/${path}/tree/${hash}`,
    };
  } catch {
    return { rawReadme: "", treeUrl: "" };
  }
}

export function EvidenceSubmitForm({ milestoneId, onChainId, title }: EvidenceSubmitFormProps) {
  const router = useRouter();
  const { execute } = useSubmitEvidence();
  const [form, setForm] = useState<EvidencePacket>(EMPTY);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [step, setStep] = useState<string | null>(null);

  // Auto-derive raw_readme_url and repo_tree_url from repo_url + full_commit_hash
  useEffect(() => {
    const { rawReadme, treeUrl } = deriveGithubUrls(form.repo_url, form.full_commit_hash);
    if (rawReadme) {
      setForm((f) => ({
        ...f,
        raw_readme_url: f.raw_readme_url || rawReadme,
        repo_tree_url: f.repo_tree_url || treeUrl,
      }));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.repo_url, form.full_commit_hash]);

  function setField(field: keyof Omit<EvidencePacket, "acceptance_criteria_checklist">) {
    return (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setForm((current) => ({ ...current, [field]: event.target.value }));
    };
  }

  function setCriterion(index: number, value: string) {
    setForm((current) => {
      const next = [...current.acceptance_criteria_checklist];
      next[index] = value;
      return { ...current, acceptance_criteria_checklist: next };
    });
  }

  function removeCriterion(index: number) {
    setForm((current) => {
      const next = current.acceptance_criteria_checklist.filter((_, i) => i !== index);
      return { ...current, acceptance_criteria_checklist: next.length > 0 ? next : [""] };
    });
  }

  async function browserSha256(value: string): Promise<string> {
    const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
    return Array.from(new Uint8Array(digest)).map((byte) => byte.toString(16).padStart(2, "0")).join("");
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setBusy(true);

    try {
      const packet = normalizeEvidencePacket(form);
      const evidenceJson = stableEvidenceJson(packet);
      const digest = await browserSha256(evidenceJson);

      setStep("Waiting for wallet confirmation...");
      const txHash = await execute(onChainId, digest, evidenceJson);
      if (!txHash) throw new Error("Evidence transaction failed or was rejected");

      router.push(`/app/milestones/${milestoneId}/review`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not submit evidence");
    } finally {
      setBusy(false);
      setStep(null);
    }
  }

  return (
    <form onSubmit={submit} className="max-w-3xl space-y-5">
      {/* Public evidence */}
      <PortPanel label="Public Evidence Packet" glow="cyan">
        <div className="space-y-4">
          <div>
            <h2 className="font-display text-panel-title text-signal mb-1">{title}</h2>
            <p className="font-body text-table text-fog">
              These fields are public and sent to the GenLayer contract — validators fetch and inspect them directly. If you have supplementary proof (a screen recording, logs), host it publicly and paste the link into &quot;Raw Key File URL&quot; or reference it in your explanation below.
            </p>
          </div>

          <Field label="Repo URL" hint="Public GitHub repository URL">
            <input className={inputClass} value={form.repo_url} onChange={setField("repo_url")} placeholder="https://github.com/owner/repo" />
          </Field>

          <Field label="Full Commit Hash" hint="40-character SHA-1 commit hash — get it from git log or GitHub">
            <input className={inputClass} value={form.full_commit_hash} onChange={setField("full_commit_hash")} placeholder="e.g. 2f706ae2b5c1d3f8a9e0c4b7d6e2f1a3b4c5d6e7" maxLength={40} />
          </Field>

          <Field label="Raw README URL" hint="Auto-derived from repo + commit hash. GenLayer fetches this directly — stable plain text.">
            <input className={inputClass} value={form.raw_readme_url} onChange={setField("raw_readme_url")} placeholder="https://raw.githubusercontent.com/owner/repo/HASH/README.md" />
          </Field>

          <Field label="Pinned Repo Tree URL" hint="Optional — GitHub tree view pinned to commit">
            <input className={inputClass} value={form.repo_tree_url} onChange={setField("repo_tree_url")} placeholder="https://github.com/owner/repo/tree/HASH" />
          </Field>

          <Field label="Raw Key File URL" hint="Optional — raw URL to your main contract, package.json, or key source file">
            <input className={inputClass} value={form.raw_key_file_url} onChange={setField("raw_key_file_url")} placeholder="https://raw.githubusercontent.com/owner/repo/HASH/contracts/MyContract.py" />
          </Field>

          <Field label="Deployment URL" hint="Live public URL — GenLayer will fetch and inspect this page">
            <input className={inputClass} value={form.deployment_url} onChange={setField("deployment_url")} placeholder="https://yourapp.vercel.app" />
          </Field>

          <Field label="Contract Address" hint="Optional — StudioNet smart contract address if the milestone requires one">
            <input className={inputClass} value={form.contract_address} onChange={setField("contract_address")} placeholder="0x..." />
          </Field>

          <Field label="Accept Bond TX Hash" hint="Optional — your StudioNet accept_milestone transaction hash (proves real bond was locked)">
            <input className={inputClass} value={form.accept_bond_tx_hash} onChange={setField("accept_bond_tx_hash")} placeholder="0x..." />
          </Field>

          <Field label="Read Result Summary" hint="What did your contract/app return when tested? Be specific.">
            <textarea className={textareaClass} value={form.read_result_summary} onChange={setField("read_result_summary")} />
          </Field>

          <Field label="Smoke Test Result" hint="Describe specific actions you took to verify it works — routes, wallet flow, tx hashes seen.">
            <textarea className={textareaClass} value={form.smoke_test_result} onChange={setField("smoke_test_result")} />
          </Field>

          <Field label="Builder Explanation" hint="Explain what you built and how it satisfies the milestone terms.">
            <textarea className={textareaClass} value={form.builder_explanation_summary} onChange={setField("builder_explanation_summary")} />
          </Field>

          <div className="space-y-2">
            <label className="font-mono text-meta text-steel uppercase tracking-wider">Acceptance Criteria Checklist</label>
            <p className="font-body text-meta text-steel">One entry per criterion. Be specific — generic answers weaken your evidence.</p>
            {form.acceptance_criteria_checklist.map((item, index) => (
              <div key={index} className="flex gap-2">
                <input
                  className={`${inputClass} flex-1`}
                  value={item}
                  onChange={(event) => setCriterion(index, event.target.value)}
                  placeholder={`Criterion ${index + 1} result`}
                />
                {form.acceptance_criteria_checklist.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeCriterion(index)}
                    className="px-2 font-mono text-meta text-steel hover:text-red-failed"
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setForm((current) => ({
                ...current,
                acceptance_criteria_checklist: [...current.acceptance_criteria_checklist, ""],
              }))}
            >
              Add Criterion
            </Button>
          </div>
        </div>
      </PortPanel>

      {error && (
        <div className="flex items-start gap-2 rounded-btn border border-red-failed/30 bg-red-failed/10 p-3">
          <AlertTriangle size={14} className="text-red-failed shrink-0 mt-0.5" />
          <p className="font-body text-table text-red-failed">{error}</p>
        </div>
      )}

      <div className="flex items-center gap-4">
        <Button type="submit" variant="genlayer" size="lg" loading={busy}>
          <Upload size={16} />
          Submit Evidence
        </Button>
        {step && (
          <span className="inline-flex items-center gap-2 font-body text-table text-fog">
            <Loader2 size={14} className="animate-spin" />
            {step}
          </span>
        )}
      </div>
    </form>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1.5">
      <span className="font-mono text-meta text-steel uppercase tracking-wider">{label}</span>
      {hint && <span className="block font-body text-meta text-steel/60">{hint}</span>}
      {children}
    </label>
  );
}

const inputClass = "w-full rounded-btn border border-port-border bg-port-black px-3 py-2.5 font-body text-table text-signal focus:border-cyan-evidence focus:outline-none";
const textareaClass = `${inputClass} min-h-[96px] resize-y`;
