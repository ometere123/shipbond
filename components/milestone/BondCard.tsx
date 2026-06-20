"use client";

import Link from "next/link";
import { formatGEN, shortenAddress } from "@/lib/utils";
import { CargoCard } from "@/components/ui/PortPanel";
import { CargoStatusBadge } from "@/components/milestone/CargoStatusBadge";
import { ProofRail } from "@/components/milestone/ProofRail";
import { Coins, Lock, Calendar, ArrowRight } from "lucide-react";
import type { Database } from "@/types/supabase";
import { cn } from "@/lib/utils";

type Milestone = Database["public"]["Tables"]["milestones"]["Row"];

interface BondCardProps {
  milestone: Milestone;
  className?: string;
}

export function BondCard({ milestone, className }: BondCardProps) {
  const reward = formatGEN(BigInt(milestone.reward_wei));
  const bond   = formatGEN(BigInt(milestone.bond_wei));
  const isFunded = milestone.status === "open";

  return (
    <Link href={`/app/port/${milestone.id}`} className="block group" prefetch={false}>
      <CargoCard funded={isFunded} className={cn("transition-shadow duration-200 group-hover:shadow-card-lift", className)}>
        <div className="p-5 space-y-4">

          {/* Header row */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <CargoStatusBadge status={milestone.status} />
              <h3 className="font-display font-semibold text-base text-signal mt-2 leading-snug line-clamp-2">
                {milestone.title}
              </h3>
            </div>
            <ArrowRight
              size={16}
              className="text-steel shrink-0 mt-1 group-hover:text-amber-bond transition-colors"
            />
          </div>

          {/* Description */}
          <p className="font-body text-table text-fog line-clamp-2 leading-relaxed">
            {milestone.description}
          </p>

          {/* Stats row */}
          <div className="grid grid-cols-2 gap-3">
            <StatBox
              icon={<Coins size={12} />}
              label="Reward"
              value={`${reward} GEN`}
              highlight="amber"
            />
            <StatBox
              icon={<Lock size={12} />}
              label="Bond Required"
              value={`${bond} GEN`}
              highlight="cyan"
            />
          </div>

          {/* Deadline */}
          {milestone.deadline && (
            <div className="flex items-center gap-1.5 text-steel">
              <Calendar size={12} />
              <span className="font-mono text-meta">
                Due {new Date(milestone.deadline).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </span>
            </div>
          )}

          {/* Proof Rail */}
          <div className="pt-2 border-t border-port-border/40">
            <ProofRail status={milestone.status} compact />
          </div>

          {/* Sponsor */}
          <div className="flex items-center justify-between">
            <span className="font-mono text-meta text-steel">
              by{" "}
              <span className="text-fog">{shortenAddress(milestone.sponsor_wallet, 4)}</span>
            </span>
            {milestone.contract_address && (
              <span className="font-mono text-meta text-violet-consensus/70">IC deployed</span>
            )}
          </div>
        </div>
      </CargoCard>
    </Link>
  );
}

function StatBox({
  icon,
  label,
  value,
  highlight,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  highlight: "amber" | "cyan";
}) {
  return (
    <div
      className={cn(
        "rounded-btn border p-2.5",
        highlight === "amber"
          ? "border-amber-bond/20 bg-amber-bond/5"
          : "border-cyan-evidence/20 bg-cyan-evidence/5"
      )}
    >
      <div
        className={cn(
          "flex items-center gap-1 mb-1",
          highlight === "amber" ? "text-amber-bond/70" : "text-cyan-evidence/70"
        )}
      >
        {icon}
        <span className="font-mono text-meta uppercase tracking-wider">{label}</span>
      </div>
      <span
        className={cn(
          "font-display font-bold text-sm",
          highlight === "amber" ? "text-amber-bond" : "text-cyan-evidence"
        )}
      >
        {value}
      </span>
    </div>
  );
}
