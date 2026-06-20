import { Badge } from "@/components/ui/Badge";
import type { MilestoneStatus } from "@/types/supabase";

const STATUS_MAP: Record<MilestoneStatus, { variant: "amber" | "cyan" | "violet" | "lime" | "red" | "steel" | "default"; label: string }> = {
  open:       { variant: "amber",   label: "OPEN" },
  accepted:   { variant: "amber",   label: "BONDED" },
  submitted:  { variant: "cyan",    label: "SUBMITTED" },
  reviewing:  { variant: "violet",  label: "REVIEWING" },
  settled:    { variant: "lime",    label: "SETTLED" },
  cancelled:  { variant: "red",     label: "CANCELLED" },
};

export function CargoStatusBadge({ status }: { status: MilestoneStatus }) {
  const { variant, label } = STATUS_MAP[status] ?? { variant: "default", label: status.toUpperCase() };
  return <Badge variant={variant}>{label}</Badge>;
}
