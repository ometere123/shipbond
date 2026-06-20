import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { ChevronRight, Lock, Eye, Gavel } from "lucide-react";

const privacyPoints = [
  {
    icon: Lock,
    title: "Builder submissions are sealed",
    text: "Competing builders cannot see each other's evidence. Your submission is visible only to you and the sponsor.",
  },
  {
    icon: Eye,
    title: "Sponsors inspect all submissions",
    text: "The sponsor who created the milestone can see every builder's evidence, files, and smoke test results.",
  },
  {
    icon: Gavel,
    title: "GenLayer receives public evidence only",
    text: "Validators judge on publicly verifiable evidence: repo URL, commit hash, deployment link, transaction hash, and smoke test summary.",
  },
];

export function FinalCTA() {
  return (
    <>
      {/* Privacy section */}
      <section className="py-24 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-3 mb-6">
            <span className="font-mono text-meta text-steel uppercase tracking-widest">
              Privacy
            </span>
          </div>

          <h2 className="font-display font-bold text-section-title text-signal mb-10">
            Evidence is sealed. Access is enforced.
          </h2>

          <div className="grid md:grid-cols-3 gap-4">
            {privacyPoints.map(({ icon: Icon, title, text }) => (
              <div
                key={title}
                className="bg-port-card border border-port-border rounded-card p-5 hover:border-port-border-bright transition-colors"
              >
                <div className="w-9 h-9 rounded-btn bg-port-panel border border-port-border flex items-center justify-center mb-4">
                  <Icon size={16} className="text-cyan-evidence" />
                </div>
                <h3 className="font-display font-semibold text-card-title text-signal mb-2">{title}</h3>
                <p className="font-body text-table text-fog">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 px-6 border-t border-port-border relative overflow-hidden">
        <div className="absolute inset-0 bg-violet-radial" />
        <div className="relative z-10 max-w-2xl mx-auto text-center">
          <h2 className="font-display font-black text-[clamp(28px,5vw,52px)] text-signal leading-tight mb-4">
            Create a milestone that pays
            <br />
            <span className="text-amber-bond">only when the work is proven.</span>
          </h2>
          <p className="font-body text-base text-fog mb-10">
            Bond the work. Ship the proof. Let GenLayer judge.
          </p>
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
        </div>
      </section>
    </>
  );
}
