import { HashPlate } from "@/components/ui/HashPlate";
import { cn } from "@/lib/utils";

interface TraceEntry {
  label: string;
  hash: string;
  type?: "tx" | "address" | "hash" | "contract";
}

interface ContractTraceStripProps {
  entries: TraceEntry[];
  className?: string;
}

export function ContractTraceStrip({ entries, className }: ContractTraceStripProps) {
  if (entries.length === 0) return null;

  return (
    <div className={cn("space-y-2", className)}>
      {entries.map((entry) => (
        <div key={entry.hash} className="flex items-center justify-between gap-4 py-2 border-b border-port-border/30 last:border-0">
          <span className="font-mono text-meta text-steel uppercase tracking-wider shrink-0">
            {entry.label}
          </span>
          <HashPlate value={entry.hash} type={entry.type ?? "tx"} />
        </div>
      ))}
    </div>
  );
}
