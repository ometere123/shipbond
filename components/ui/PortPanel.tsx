import { cn } from "@/lib/utils";

interface PortPanelProps {
  children: React.ReactNode;
  className?: string;
  glow?: "amber" | "cyan" | "violet" | "none";
  label?: string;
  headerRight?: React.ReactNode;
  scanline?: boolean;
  padding?: "sm" | "md" | "lg";
}

const glowClasses = {
  amber:  "border-amber-bond/25 shadow-amber-glow",
  cyan:   "border-cyan-evidence/25 shadow-cyan-glow",
  violet: "border-violet-consensus/25 shadow-violet-glow",
  none:   "border-port-border",
};

const paddingClasses = {
  sm: "p-4",
  md: "p-6",
  lg: "p-8",
};

export function PortPanel({
  children,
  className,
  glow = "none",
  label,
  headerRight,
  scanline = false,
  padding = "md",
}: PortPanelProps) {
  return (
    <div
      className={cn(
        "bg-port-panel border rounded-panel",
        "relative overflow-hidden",
        glowClasses[glow],
        scanline && "scanline-overlay",
        className
      )}
    >
      {label || headerRight ? (
        <>
          <div className="flex items-center justify-between border-b border-port-border px-6 py-3">
            {label && (
              <span className="font-mono text-meta text-steel uppercase tracking-[0.08em]">
                {label}
              </span>
            )}
            {headerRight && <div className="ml-auto">{headerRight}</div>}
          </div>
          <div className={cn(paddingClasses[padding])}>{children}</div>
        </>
      ) : (
        <div className={cn(paddingClasses[padding])}>{children}</div>
      )}
    </div>
  );
}

// Cargo-style card — used in the Proof Port grid
interface CargoCardProps {
  children: React.ReactNode;
  className?: string;
  funded?: boolean;
  onClick?: () => void;
}

export function CargoCard({ children, className, funded = false, onClick }: CargoCardProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        "bg-port-card border rounded-card",
        "relative overflow-hidden cargo-tilt",
        "transition-all duration-200",
        funded
          ? "border-amber-bond/20 animate-border-glow"
          : "border-port-border hover:border-port-border-bright",
        onClick && "cursor-pointer",
        className
      )}
    >
      {/* Corner accent */}
      <div className="absolute top-0 right-0 w-12 h-12 overflow-hidden">
        <div
          className={cn(
            "absolute top-0 right-0 w-0 h-0",
            "border-l-[48px] border-l-transparent",
            funded ? "border-t-[48px] border-t-amber-bond/20" : "border-t-[48px] border-t-port-border/50"
          )}
        />
      </div>
      {children}
    </div>
  );
}
