"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { PortPanel } from "@/components/ui/PortPanel";
import {
  normalizeEvidencePacket,
  stableEvidenceJson,
  type EvidencePacket,
} from "@/lib/evidence-packet";
import { useSubmitEvidence } from "@/hooks/useContractActions";
import { AlertTriangle, FileUp, Loader2, Upload } from "lucide-react";

interface EvidenceSubmitFormProps {
  milestoneId: string;
  onChainId: string;
  title: string;
}

const EMPTY: EvidencePacket = {
  repo_url: "",
  commit_hash: "",
  deployment_url: "",
  contract_address: "",
  write_tx_hash: "",
  read_result_summary: "",
  smoke_test_result: "",
  acceptance_criteria_checklist: [""],
  builder_explanation_summary: "",
};

export function EvidenceSubmitForm({ milestoneId, onChainId, title }: EvidenceSubmitFormProps) {
  const router = useRouter();
  const { execute } = useSubmitEvidence();
  const [form, setForm] = useState<EvidencePacket>(EMPTY);
  const [files, setFiles] = useState<FileList | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [step, setStep] = useState<string | null>(null);

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

      if (files && files.length > 0) {
        setStep("Uploading private files...");
        const uploadData = new FormData();
        Array.from(files).forEach((file) => uploadData.append("files", file));
        const uploadRes = await fetch(`/api/milestones/${milestoneId}/evidence-files`, {
          method: "POST",
          body: uploadData,
        });
        const uploadBody = await uploadRes.json().catch(() => ({}));
        if (!uploadRes.ok) throw new Error(uploadBody.error ?? "Private file upload failed");
      }

      setStep("Waiting for wallet confirmation...");
      const txHash = await execute(onChainId, digest, evidenceJson);
      if (!txHash) throw new Error("Evidence transaction failed or was rejected");

      setStep("Recording evidence...");
      const res = await fetch(`/api/milestones/${milestoneId}/evidence`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tx_hash: txHash, evidence: packet, evidence_digest: digest }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error ?? "Failed to record evidence");

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
      <PortPanel label="Public Evidence Packet" glow="cyan">
        <div className="space-y-4">
          <div>
            <h2 className="font-display text-panel-title text-signal mb-1">{title}</h2>
            <p className="font-body text-table text-fog">
              These fields are public and sent to the GenLayer contract. Private files are uploaded separately for sponsor inspection.
            </p>
          </div>

          <Field label="Repo URL"><input className={inputClass} value={form.repo_url} onChange={setField("repo_url")} /></Field>
          <Field label="Commit Hash"><input className={inputClass} value={form.commit_hash} onChange={setField("commit_hash")} /></Field>
          <Field label="Deployment URL"><input className={inputClass} value={form.deployment_url} onChange={setField("deployment_url")} /></Field>
          <Field label="Contract Address"><input className={inputClass} value={form.contract_address} onChange={setField("contract_address")} /></Field>
          <Field label="Write TX Hash"><input className={inputClass} value={form.write_tx_hash} onChange={setField("write_tx_hash")} /></Field>
          <Field label="Read Result Summary"><textarea className={textareaClass} value={form.read_result_summary} onChange={setField("read_result_summary")} /></Field>
          <Field label="Smoke Test Result"><textarea className={textareaClass} value={form.smoke_test_result} onChange={setField("smoke_test_result")} /></Field>
          <Field label="Builder Explanation"><textarea className={textareaClass} value={form.builder_explanation_summary} onChange={setField("builder_explanation_summary")} /></Field>

          <div className="space-y-2">
            <label className="font-mono text-meta text-steel uppercase tracking-wider">Acceptance Criteria Checklist</label>
            {form.acceptance_criteria_checklist.map((item, index) => (
              <input
                key={index}
                className={inputClass}
                value={item}
                onChange={(event) => setCriterion(index, event.target.value)}
                placeholder={`Criterion ${index + 1} result`}
              />
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

      <PortPanel label="Private Files" glow="violet">
        <div className="flex items-center gap-3">
          <FileUp size={18} className="text-violet-consensus" />
          <input
            type="file"
            multiple
            className="font-body text-table text-fog file:mr-4 file:rounded-btn file:border-0 file:bg-port-card file:px-3 file:py-2 file:text-fog"
            onChange={(event) => setFiles(event.target.files)}
          />
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

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1.5">
      <span className="font-mono text-meta text-steel uppercase tracking-wider">{label}</span>
      {children}
    </label>
  );
}

const inputClass = "w-full rounded-btn border border-port-border bg-port-black px-3 py-2.5 font-body text-table text-signal focus:border-cyan-evidence focus:outline-none";
const textareaClass = `${inputClass} min-h-[96px] resize-y`;
