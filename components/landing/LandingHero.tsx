"use client";

import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { VerdictStamp } from "@/components/consensus/VerdictStamp";
import { ChevronRight, Zap } from "lucide-react";

export function LandingHero() {
  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden">
      {/* Background layers */}
      <div className="absolute inset-0 bg-port-grid bg-grid opacity-100" />
      <div className="absolute inset-0 bg-amber-radial" />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-port-black" />

      {/* Floating milestone manifest — visual centrepiece */}
      <div className="absolute right-[6%] top-1/2 -translate-y-1/2 hidden xl:block w-80 select-none pointer-events-none">
        <FloatingManifest />
      </div>

      {/* Main copy */}
      <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
        {/* Protocol label */}
        <div className="flex items-center justify-center mb-8">
          <Badge variant="violet" className="gap-1.5">
            <Zap size={10} />
            GenLayer-Native Protocol
          </Badge>
        </div>

        {/* Hero headline */}
        <h1 className="font-display font-black leading-none tracking-tight mb-6">
          <span className="block text-[clamp(36px,8vw,80px)] text-signal">
            BOND THE WORK.
          </span>
          <span className="block text-[clamp(36px,8vw,80px)] text-signal">
            SHIP THE PROOF.
          </span>
          <span className="block text-[clamp(36px,8vw,80px)] text-amber-bond animate-glow">
            LET GENLAYER JUDGE.
          </span>
        </h1>

        {/* Subtext */}
        <p className="font-body text-[clamp(16px,2vw,20px)] text-fog max-w-2xl mx-auto mb-10 leading-relaxed">
          ShipBond is a GenLayer-native milestone bond protocol where sponsors fund
          builder tasks, builders lock delivery bonds, and GenLayer reviews evidence
          to decide whether the work was actually completed.
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link href="/app/milestones/new">
            <Button size="lg" variant="primary" className="min-w-52">
              Create Funded Milestone
              <ChevronRight size={16} />
            </Button>
          </Link>
          <Link href="/app/port">
            <Button size="lg" variant="secondary" className="min-w-52">
              Explore Bonded Work
            </Button>
          </Link>
        </div>

        {/* Protocol stats */}
        <div className="flex items-center justify-center gap-8 mt-14 pt-10 border-t border-port-border">
          {[
            { label: "GenLayer Powered", value: "100%" },
            { label: "Verdict Source",   value: "On-Chain" },
            { label: "Evidence Privacy", value: "Enforced" },
          ].map(({ label, value }) => (
            <div key={label} className="text-center">
              <div className="font-display font-bold text-xl text-signal">{value}</div>
              <div className="font-body text-meta text-steel mt-0.5">{label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// Floating milestone manifest — decorative right-side element
function FloatingManifest() {
  return (
    <div className="relative">
      {/* Main manifest card */}
      <div className="bg-port-card border border-amber-bond/25 rounded-card p-5 shadow-amber-glow animate-glow">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <span className="font-mono text-meta text-steel uppercase tracking-widest">MANIFEST #0042</span>
          <Badge variant="amber">FUNDED</Badge>
        </div>

        <p className="font-body text-table text-fog mb-4 leading-snug">
          Build a usable GenLayer frontend integration with wallet connect, deployed demo, and contract write/read flow.
        </p>

        {/* Stats row */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-port-panel rounded-btn p-3">
            <div className="font-mono text-meta text-steel mb-0.5">REWARD</div>
            <div className="font-display font-bold text-amber-bond text-lg">100 GEN</div>
          </div>
          <div className="bg-port-panel rounded-btn p-3">
            <div className="font-mono text-meta text-steel mb-0.5">BOND REQ.</div>
            <div className="font-display font-bold text-signal text-lg">10 GEN</div>
          </div>
        </div>

        {/* Rail */}
        <div className="flex items-center gap-1.5 mb-4">
          {["FUNDED", "BONDED", "SUBMITTED", "REVIEWING"].map((step, i) => (
            <div key={step} className="flex items-center gap-1.5">
              <div className={cn(
                "w-2 h-2 rounded-full",
                i < 3 ? "bg-amber-bond animate-rail" : "bg-port-border"
              )} />
              {i < 3 && <div className="w-4 h-px bg-port-border" />}
            </div>
          ))}
        </div>

        {/* Verdict area */}
        <div className="relative flex justify-center pt-2">
          <VerdictStamp verdict="PASSED" size="sm" animate />
        </div>
      </div>

      {/* Floating chips */}
      <div className="absolute -top-6 -left-8 bg-port-panel border border-cyan-evidence/30 rounded-btn px-3 py-1.5 shadow-cyan-glow">
        <span className="font-mono text-meta text-cyan-evidence">EVIDENCE SEALED</span>
      </div>
      <div className="absolute -bottom-4 -right-6 bg-port-panel border border-violet-consensus/30 rounded-btn px-3 py-1.5 shadow-violet-glow">
        <span className="font-mono text-meta text-violet-consensus">GENLAYER JUDGING</span>
      </div>
    </div>
  );
}

// cn needed inside this file too
function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}
