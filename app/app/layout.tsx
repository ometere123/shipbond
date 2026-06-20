import { PortNav } from "@/components/shell/PortNav";
import { ChainMismatchBanner } from "@/components/wallet/ChainMismatchBanner";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-port-black">
      <PortNav />
      <ChainMismatchBanner />
      <main className="max-w-7xl mx-auto px-6 py-8">{children}</main>
    </div>
  );
}
