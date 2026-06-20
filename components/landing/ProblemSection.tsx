import { AlertTriangle } from "lucide-react";

const problems = [
  { text: "Screenshots can lie." },
  { text: "Demos can be incomplete." },
  { text: "Repos can be shallow." },
  { text: "Sponsors don't always have time to inspect every claim." },
  { text: "Normal smart contracts cannot judge whether a usable integration was actually delivered." },
];

export function ProblemSection() {
  return (
    <section className="py-24 px-6 border-y border-port-border bg-port-panel/40">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-6 h-6 rounded-full bg-red-failed/15 flex items-center justify-center">
            <AlertTriangle size={13} className="text-red-failed" />
          </div>
          <span className="font-mono text-meta text-steel uppercase tracking-widest">
            The Problem
          </span>
        </div>

        <h2 className="font-display font-bold text-section-title text-signal mb-8">
          Builder work is hard to verify.
        </h2>

        <div className="space-y-4">
          {problems.map(({ text }, i) => (
            <div key={i} className="flex items-start gap-4">
              <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-red-failed/60 shrink-0" />
              <p className="font-body text-base text-fog">{text}</p>
            </div>
          ))}
        </div>

        <div className="mt-10 p-5 bg-port-card border border-port-border rounded-panel">
          <p className="font-body text-base text-fog">
            A normal smart contract can check whether money was deposited.
            A normal smart contract can check whether a deadline has passed.
            <br /><br />
            <span className="text-signal font-medium">
              A normal smart contract cannot reliably judge whether a submitted repo,
              deployment, screenshots, smoke test result, and transaction hash actually prove
              that a builder delivered a usable integration.
            </span>
          </p>
        </div>
      </div>
    </section>
  );
}
