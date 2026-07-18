import { cn } from "@/lib/utils";
import { CheckCircle, Circle, Zap } from "lucide-react";
import type { ContractStatus } from "@/lib/genlayer/contract";

interface RailStep {
  id: string;
  label: string;
  status: "completed" | "active" | "pending";
}

const ORDER: ContractStatus[] = ["OPEN", "ACCEPTED", "SUBMITTED", "REVIEWING", "SETTLED"];

function milestoneToSteps(status: ContractStatus): RailStep[] {
  // REVIEWED / HUMAN_SETTLEMENT_PROPOSED both fall under the "Consensus" stage.
  const normalized = status === "REVIEWED" || status === "HUMAN_SETTLEMENT_PROPOSED" ? "REVIEWING" : status;
  const currentIdx = ORDER.indexOf(normalized);

  return [
    { id: "funded",    label: "Funded" },
    { id: "bonded",    label: "Bond Locked" },
    { id: "submitted", label: "Evidence In" },
    { id: "reviewing", label: "Consensus" },
    { id: "settled",   label: "Settled" },
  ].map((step, i) => ({
    ...step,
    status:
      status === "CANCELLED"
        ? "pending"
        : i < currentIdx
        ? "completed"
        : i === currentIdx
        ? "active"
        : "pending",
  }));
}

interface ProofRailProps {
  status: ContractStatus;
  className?: string;
  compact?: boolean;
}

export function ProofRail({ status, className, compact = false }: ProofRailProps) {
  const steps = milestoneToSteps(status);

  return (
    <div className={cn("flex items-center gap-0", className)}>
      {steps.map((step, i) => (
        <div key={step.id} className="flex items-center flex-1 min-w-0">
          {/* Step node */}
          <div className="flex flex-col items-center gap-1 shrink-0">
            <StepIcon step={step} />
            {!compact && (
              <span
                className={cn(
                  "font-mono text-[9px] uppercase tracking-wider text-center leading-tight whitespace-nowrap",
                  step.status === "completed" ? "text-lime-passed/70" :
                  step.status === "active"    ? "text-amber-bond"     :
                                               "text-steel/50"
                )}
              >
                {step.label}
              </span>
            )}
          </div>
          {/* Connector line */}
          {i < steps.length - 1 && (
            <div
              className={cn(
                "flex-1 h-px mx-1",
                step.status === "completed" ? "bg-lime-passed/40" : "bg-port-border/40"
              )}
            />
          )}
        </div>
      ))}
    </div>
  );
}

function StepIcon({ step }: { step: RailStep }) {
  if (step.status === "completed") {
    return <CheckCircle size={14} className="text-lime-passed" />;
  }
  if (step.status === "active") {
    return (
      <div className="relative">
        <Zap size={14} className="text-amber-bond animate-pulse" />
      </div>
    );
  }
  return <Circle size={14} className="text-steel/30" />;
}
