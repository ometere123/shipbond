import Link from "next/link";
import { ShipBondLogo } from "@/components/brand/ShipBondLogo";
import { LandingHero } from "@/components/landing/LandingHero";
import { ProblemSection } from "@/components/landing/ProblemSection";
import { VerdictFlowSection } from "@/components/landing/VerdictFlowSection";
import { GenLayerJudgeSection } from "@/components/landing/GenLayerJudgeSection";
import { FinalCTA } from "@/components/landing/FinalCTA";
import { Button } from "@/components/ui/Button";
import { ChevronRight } from "lucide-react";
import { getSession } from "@/lib/session";

export default async function LandingPage() {
  const session = await getSession();
  const isSignedIn = !!session.walletAddress;

  return (
    <div className="min-h-screen bg-port-black">
      {/* Landing nav */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-port-black/80 backdrop-blur-md border-b border-port-border/60">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <ShipBondLogo size="sm" />
          <div className="flex items-center gap-3">
            <Link href="/app/port">
              <Button variant="ghost" size="sm">Explore</Button>
            </Link>
            {isSignedIn ? (
              <Link href="/app/port">
                <Button variant="primary" size="sm">
                  Go to App
                  <ChevronRight size={14} />
                </Button>
              </Link>
            ) : (
              <Link href="/connect">
                <Button variant="primary" size="sm">
                  Connect Wallet
                  <ChevronRight size={14} />
                </Button>
              </Link>
            )}
          </div>
        </div>
      </header>

      <main className="pt-16">
        <LandingHero />
        <ProblemSection />
        <VerdictFlowSection />
        <GenLayerJudgeSection />
        <FinalCTA />
      </main>

      {/* Footer */}
      <footer className="border-t border-port-border py-8 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <ShipBondLogo size="sm" showTagline />
          <div className="flex items-center gap-6">
            <a
              href={process.env.NEXT_PUBLIC_BRADBURY_EXPLORER ?? "https://explorer-bradbury.genlayer.com"}
              target="_blank"
              rel="noopener noreferrer"
              className="font-mono text-meta text-steel hover:text-fog transition-colors"
            >
              Bradbury Explorer
            </a>
            <a
              href={process.env.NEXT_PUBLIC_FAUCET_URL ?? "https://testnet-faucet.genlayer.foundation"}
              target="_blank"
              rel="noopener noreferrer"
              className="font-mono text-meta text-steel hover:text-fog transition-colors"
            >
              GEN Faucet
            </a>
            <span className="font-mono text-meta text-steel">
              Chain ID: {process.env.NEXT_PUBLIC_CHAIN_ID ?? "4221"}
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
