import { Badge } from "@/components/ui/Badge";
import type { ContractStatus } from "@/lib/genlayer/contract";

const STATUS_MAP: Record<ContractStatus, { variant: "amber" | "cyan" | "violet" | "lime" | "red" | "steel" | "default"; label: string }> = {
  OPEN:                       { variant: "amber",  label: "OPEN" },
  ACCEPTED:                   { variant: "amber",  label: "BONDED" },
  SUBMITTED:                  { variant: "cyan",   label: "SUBMITTED" },
  REVIEWING:                  { variant: "violet", label: "REVIEWING" },
  REVIEWED:                   { variant: "violet", label: "REVIEWED" },
  HUMAN_SETTLEMENT_PROPOSED:  { variant: "violet", label: "HUMAN REVIEW" },
  SETTLED:                    { variant: "lime",   label: "SETTLED" },
  CANCELLED:                  { variant: "red",    label: "CANCELLED" },
};

export function CargoStatusBadge({ status }: { status: ContractStatus }) {
  const { variant, label } = STATUS_MAP[status] ?? { variant: "default", label: status };
  return <Badge variant={variant}>{label}</Badge>;
}
