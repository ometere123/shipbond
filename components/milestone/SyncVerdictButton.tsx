"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { RefreshCw } from "lucide-react";

export function SyncVerdictButton({ milestoneId: _milestoneId }: { milestoneId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  function sync() {
    setBusy(true);
    // Milestone/verdict state is now read live from the contract on every
    // page load — refreshing the server component is all that's needed.
    router.refresh();
    setBusy(false);
  }

  return (
    <Button variant="secondary" size="lg" loading={busy} onClick={sync}>
      <RefreshCw size={16} />
      Refresh from Chain
    </Button>
  );
}
