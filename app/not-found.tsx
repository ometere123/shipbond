import Link from "next/link";
import { Button } from "@/components/ui/Button";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-port-black flex items-center justify-center px-6">
      <div className="text-center max-w-lg">
        <div className="font-mono text-meta text-steel uppercase tracking-widest mb-4">
          Error 404
        </div>
        <h1 className="font-display font-black text-[64px] text-signal leading-none mb-4">
          LOST AT <span className="text-amber-bond">PORT</span>
        </h1>
        <p className="font-body text-base text-fog mb-10">
          This manifest does not exist. It may have been settled, cancelled, or never created.
        </p>
        <Link href="/">
          <Button variant="primary">Return to Port</Button>
        </Link>
      </div>
    </div>
  );
}
