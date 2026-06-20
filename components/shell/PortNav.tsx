"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { ShipBondLogo } from "@/components/brand/ShipBondLogo";
import { Button } from "@/components/ui/Button";
import { ConnectWalletButton } from "@/components/wallet/ConnectWalletButton";
import { LayoutGrid, Anchor, Shield, Gavel, ChevronRight } from "lucide-react";

const navLinks = [
  { href: "/app/port",     label: "Proof Port",    icon: LayoutGrid },
  { href: "/app/sponsor",  label: "Control Tower", icon: Anchor },
  { href: "/app/builder",  label: "Bond Dock",     icon: Shield },
  { href: "/app/verdicts", label: "Verdicts",      icon: Gavel },
];

export function PortNav() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 bg-port-black/90 backdrop-blur-md border-b border-port-border">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center gap-6">
        <Link href="/" className="shrink-0">
          <ShipBondLogo size="sm" />
        </Link>

        <nav className="hidden md:flex items-center gap-0.5 flex-1">
          {navLinks.map(({ href, label, icon: Icon }) => {
            const active = pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-2 rounded-btn",
                  "font-body text-table transition-all duration-150",
                  active
                    ? "text-amber-bond bg-amber-bond/10"
                    : "text-steel hover:text-fog hover:bg-port-panel"
                )}
              >
                <Icon size={14} />
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto flex items-center gap-3">
          <Link href="/app/milestones/new" className="hidden sm:block">
            <Button size="sm" variant="primary">
              Create Milestone <ChevronRight size={14} />
            </Button>
          </Link>
          <ConnectWalletButton />
        </div>
      </div>
    </header>
  );
}
