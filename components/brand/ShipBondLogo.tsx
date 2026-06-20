"use client";

import { cn } from "@/lib/utils";

interface ShipBondLogoProps {
  size?: "sm" | "md" | "lg";
  className?: string;
  showTagline?: boolean;
}

const sizes = {
  sm: { mark: 24, title: "text-sm",   tagline: "text-[9px]"  },
  md: { mark: 32, title: "text-base", tagline: "text-[10px]" },
  lg: { mark: 44, title: "text-xl",   tagline: "text-xs"     },
};

export function ShipBondLogo({ size = "md", className, showTagline = false }: ShipBondLogoProps) {
  const s = sizes[size];
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      {/* Mark — stylised SB glyph */}
      <svg
        width={s.mark}
        height={s.mark}
        viewBox="0 0 44 44"
        fill="none"
        aria-hidden="true"
      >
        {/* Outer hexagon frame */}
        <path
          d="M22 2L40 12V32L22 42L4 32V12L22 2Z"
          fill="#06070A"
          stroke="#FFB000"
          strokeWidth="1.5"
        />
        {/* Bond chain links */}
        <rect x="12" y="17" width="8" height="4" rx="2" fill="#FFB000" />
        <rect x="24" y="23" width="8" height="4" rx="2" fill="#00E5FF" />
        {/* Connector */}
        <path d="M20 19H24V25" stroke="#FFB000" strokeWidth="1.5" strokeLinecap="round" />
        {/* Proof dot */}
        <circle cx="24" cy="19" r="2" fill="#7C5CFF" />
      </svg>

      <div className="flex flex-col">
        <span
          className={cn(
            "font-display font-bold tracking-tight leading-none text-signal",
            s.title
          )}
        >
          Ship<span className="text-amber-bond">Bond</span>
        </span>
        {showTagline && (
          <span className={cn("font-mono text-steel tracking-widest uppercase mt-0.5", s.tagline)}>
            Proof-of-Delivery Protocol
          </span>
        )}
      </div>
    </div>
  );
}
