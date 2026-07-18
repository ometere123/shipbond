import { VerdictStamp } from "@/components/consensus/VerdictStamp";
import { SourceOfTruthBadge } from "@/components/consensus/VerdictStamp";

export function GenLayerJudgeSection() {
  return (
    <section className="py-24 px-6 bg-port-panel/40 border-y border-port-border">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <span className="font-mono text-meta text-steel uppercase tracking-widest">
            Why GenLayer
          </span>
        </div>

        <h2 className="font-display font-bold text-section-title text-signal mb-6">
          The milestone is in natural language.
          <br />
          <span className="text-violet-consensus">The evidence is messy.</span>
          <br />
          The protocol needs reasoning.
        </h2>

        <p className="font-body text-base text-fog max-w-2xl mb-12">
          GenLayer is the judge because no deterministic smart contract can reliably
          decide whether a submitted repo, deployment link, smoke test, and explanation
          actually prove a usable integration was delivered.
        </p>

        {/* Demo verdict — the ShipBond story */}
        <div className="bg-port-card border border-violet-consensus/20 rounded-panel p-6 shadow-violet-glow">
          <div className="flex items-center justify-between mb-5">
            <span className="font-mono text-meta text-steel uppercase tracking-widest">
              GenLayer Verdict — Example
            </span>
            <SourceOfTruthBadge />
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Milestone */}
            <div>
              <div className="font-mono text-meta text-steel uppercase tracking-widest mb-2">
                Original Milestone
              </div>
              <div className="bg-port-panel rounded-btn p-4 border border-port-border">
                <p className="font-body text-table text-fog">
                  Build a usable GenLayer frontend integration with wallet connect,
                  deployed demo, GitHub repo, and successful contract write/read flow.
                </p>
                <div className="mt-3 flex gap-2 flex-wrap">
                  <span className="font-mono text-meta text-amber-bond">Reward: 100 GEN</span>
                  <span className="font-mono text-meta text-steel">·</span>
                  <span className="font-mono text-meta text-fog">Bond: 10 GEN</span>
                </div>
              </div>
            </div>

            {/* Verdict */}
            <div>
              <div className="font-mono text-meta text-steel uppercase tracking-widest mb-2">
                GenLayer Consensus Result
              </div>
              <div className="bg-port-panel rounded-btn p-4 border border-violet-consensus/20 space-y-3">
                <VerdictStamp verdict="PARTIAL_PASS" size="sm" animate />
                <p className="font-body text-table text-fog leading-snug">
                  The repo and deployed demo demonstrate a working wallet connection and
                  GenLayer write flow, but the{" "}
                  <span className="text-amber-partial font-medium">
                    read flow is not clearly shown
                  </span>{" "}
                  and the smoke test lacks reproducible instructions.
                </p>
                <div className="font-mono text-meta text-violet-consensus">
                  Recommended payout: 7000 bps · Bond: HOLD
                </div>
              </div>
            </div>
          </div>

          <div className="mt-5 pt-5 border-t border-port-border">
            <p className="font-body text-table text-steel text-center">
              This verdict was not decided by the frontend or the sponsor.
              <span className="text-violet-consensus font-medium">
                {" "}GenLayer validator consensus is the source of truth.
              </span>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
