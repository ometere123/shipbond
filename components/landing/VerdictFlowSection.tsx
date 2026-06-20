import { Anchor, Lock, Send, Gavel, Banknote } from "lucide-react";

const steps = [
  {
    icon: Anchor,
    number: "01",
    title: "Sponsor funds a milestone",
    description: "Write a plain-language milestone. Lock the reward in the GenLayer contract.",
    color: "text-amber-bond",
    bg: "bg-amber-bond/10",
    border: "border-amber-bond/20",
  },
  {
    icon: Lock,
    number: "02",
    title: "Builder locks a bond",
    description: "Builder accepts the milestone and locks a delivery bond on-chain.",
    color: "text-amber-bond",
    bg: "bg-amber-bond/10",
    border: "border-amber-bond/20",
  },
  {
    icon: Send,
    number: "03",
    title: "Builder ships evidence",
    description: "Submit repo, commit hash, deployment, transaction hash, smoke test, and explanation. Evidence is sealed — only the sponsor can see it.",
    color: "text-cyan-evidence",
    bg: "bg-cyan-evidence/10",
    border: "border-cyan-evidence/20",
  },
  {
    icon: Gavel,
    number: "04",
    title: "GenLayer reviews the proof",
    description: "Validators independently reason over the milestone terms vs. submitted evidence and reach consensus on a verdict.",
    color: "text-violet-consensus",
    bg: "bg-violet-consensus/10",
    border: "border-violet-consensus/20",
  },
  {
    icon: Banknote,
    number: "05",
    title: "Contract settles the result",
    description: "Passed: builder receives reward + bond returned. Failed: sponsor refunded. Partial: split per GenLayer recommendation.",
    color: "text-lime-passed",
    bg: "bg-lime-passed/10",
    border: "border-lime-passed/20",
  },
];

export function VerdictFlowSection() {
  return (
    <section className="py-24 px-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <span className="font-mono text-meta text-steel uppercase tracking-widest">
            The ShipBond Flow
          </span>
        </div>

        <h2 className="font-display font-bold text-section-title text-signal mb-12">
          Five steps. One authoritative verdict.
        </h2>

        <div className="relative">
          {/* Connecting line */}
          <div className="absolute left-7 top-8 bottom-8 w-px bg-gradient-to-b from-amber-bond/40 via-violet-consensus/40 to-lime-passed/40" />

          <div className="space-y-6">
            {steps.map(({ icon: Icon, number, title, description, color, bg, border }) => (
              <div key={number} className="flex gap-6 relative">
                {/* Step icon */}
                <div
                  className={`w-14 h-14 rounded-panel border ${border} ${bg} flex items-center justify-center shrink-0 z-10`}
                >
                  <Icon size={20} className={color} />
                </div>

                {/* Content */}
                <div className="flex-1 py-2">
                  <div className="flex items-center gap-3 mb-1">
                    <span className="font-mono text-meta text-steel">{number}</span>
                    <h3 className="font-display font-semibold text-card-title text-signal">{title}</h3>
                  </div>
                  <p className="font-body text-table text-fog">{description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
