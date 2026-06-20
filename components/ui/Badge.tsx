import { cn } from "@/lib/utils";
import type { Verdict, MilestoneStatus } from "@/types";

type BadgeVariant =
  | "amber"
  | "cyan"
  | "violet"
  | "lime"
  | "red"
  | "partial"
  | "steel"
  | "default";

interface BadgeProps {
  variant?: BadgeVariant;
  className?: string;
  children: React.ReactNode;
}

const variants: Record<BadgeVariant, string> = {
  amber:   "bg-amber-bond/15 text-amber-bond   border border-amber-bond/30",
  cyan:    "bg-cyan-evidence/10 text-cyan-evidence border border-cyan-evidence/25",
  violet:  "bg-violet-consensus/15 text-violet-consensus border border-violet-consensus/30",
  lime:    "bg-lime-passed/15 text-lime-passed   border border-lime-passed/30",
  red:     "bg-red-failed/15 text-red-failed     border border-red-failed/30",
  partial: "bg-amber-partial/15 text-amber-partial border border-amber-partial/30",
  steel:   "bg-port-border/60 text-fog            border border-port-border",
  default: "bg-port-card text-steel              border border-port-border",
};

export function Badge({ variant = "default", className, children }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-2 py-0.5 rounded-badge",
        "font-body text-badge font-semibold uppercase tracking-[0.06em]",
        "whitespace-nowrap",
        variants[variant],
        className
      )}
    >
      {children}
    </span>
  );
}

// Verdict-aware badge
export function VerdictBadge({ verdict }: { verdict: Verdict }) {
  const map: Record<Verdict, { variant: BadgeVariant; label: string }> = {
    PASSED:             { variant: "lime",    label: "PASSED" },
    PARTIAL_PASS:       { variant: "partial", label: "PARTIAL PASS" },
    FAILED:             { variant: "red",     label: "FAILED" },
    NEEDS_HUMAN_REVIEW: { variant: "steel",   label: "HUMAN REVIEW" },
  };
  const { variant, label } = map[verdict];
  return <Badge variant={variant}>{label}</Badge>;
}

// Milestone status badge
export function StatusBadge({ status }: { status: MilestoneStatus }) {
  const map: Record<MilestoneStatus, { variant: BadgeVariant; label: string }> = {
    open:       { variant: "amber",  label: "OPEN" },
    accepted:   { variant: "amber",  label: "BONDED" },
    submitted:  { variant: "cyan",   label: "SUBMITTED" },
    reviewing:  { variant: "violet", label: "REVIEWING" },
    settled:    { variant: "lime",   label: "SETTLED" },
    cancelled:  { variant: "red",    label: "CANCELLED" },
  };
  const { variant, label } = map[status] ?? { variant: "default", label: status };
  return <Badge variant={variant}>{label}</Badge>;
}
