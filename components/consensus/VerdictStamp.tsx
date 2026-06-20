"use client";

import { cn } from "@/lib/utils";
import type { Verdict } from "@/types";

interface VerdictStampProps {
  verdict: Verdict;
  animate?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const verdictConfig: Record<
  Verdict,
  { label: string; color: string; border: string; bg: string; glow: string }
> = {
  PASSED: {
    label: "PASSED",
    color: "text-lime-passed",
    border: "border-lime-passed/60",
    bg: "bg-lime-passed/8",
    glow: "shadow-lime-glow",
  },
  PARTIAL_PASS: {
    label: "PARTIAL PASS",
    color: "text-amber-partial",
    border: "border-amber-partial/60",
    bg: "bg-amber-partial/8",
    glow: "shadow-amber-glow",
  },
  FAILED: {
    label: "FAILED",
    color: "text-red-failed",
    border: "border-red-failed/60",
    bg: "bg-red-failed/8",
    glow: "",
  },
  NEEDS_HUMAN_REVIEW: {
    label: "HUMAN REVIEW",
    color: "text-fog",
    border: "border-fog/30",
    bg: "bg-fog/5",
    glow: "",
  },
};

const sizeClasses = {
  sm: { outer: "px-4 py-2", text: "text-sm",        rotate: "-rotate-1" },
  md: { outer: "px-8 py-4", text: "text-xl",         rotate: "-rotate-2" },
  lg: { outer: "px-12 py-6", text: "text-3xl",       rotate: "-rotate-2" },
};

export function VerdictStamp({ verdict, animate = false, size = "md", className }: VerdictStampProps) {
  const cfg = verdictConfig[verdict];
  const sz = sizeClasses[size];

  return (
    <div
      className={cn(
        "inline-flex items-center justify-center",
        "border-2 rounded-sm",
        cfg.border,
        cfg.bg,
        cfg.glow,
        sz.outer,
        sz.rotate,
        animate && "animate-stamp-in",
        className
      )}
    >
      <span
        className={cn(
          "font-display font-black tracking-[0.15em] uppercase",
          cfg.color,
          sz.text
        )}
      >
        {cfg.label}
      </span>

      {/* Corner marks — stamp aesthetic */}
      <span className={cn("absolute top-1 left-1 w-1.5 h-1.5 border-t border-l", cfg.border)} />
      <span className={cn("absolute top-1 right-1 w-1.5 h-1.5 border-t border-r", cfg.border)} />
      <span className={cn("absolute bottom-1 left-1 w-1.5 h-1.5 border-b border-l", cfg.border)} />
      <span className={cn("absolute bottom-1 right-1 w-1.5 h-1.5 border-b border-r", cfg.border)} />
    </div>
  );
}

// Source of truth badge — displayed in Consensus Chamber
export function SourceOfTruthBadge({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "inline-flex items-center gap-2",
        "bg-violet-consensus/10 border border-violet-consensus/30 rounded-panel",
        "px-4 py-2",
        className
      )}
    >
      {/* GenLayer mark */}
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <polygon points="8,1 15,4.5 15,11.5 8,15 1,11.5 1,4.5" stroke="#7C5CFF" strokeWidth="1.2" fill="none"/>
        <circle cx="8" cy="8" r="2.5" fill="#7C5CFF" />
      </svg>
      <span className="font-mono text-meta text-violet-consensus tracking-wider uppercase">
        Source of truth: GenLayer Intelligent Contract
      </span>
    </div>
  );
}
