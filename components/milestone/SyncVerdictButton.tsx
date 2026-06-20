"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { RefreshCw } from "lucide-react";

export function SyncVerdictButton({ milestoneId }: { milestoneId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function sync() {
    setBusy(true);
    try {
      await fetch("/api/contract/sync-verdict", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ milestoneId }),
      });
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <Button variant="secondary" size="lg" loading={busy} onClick={sync}>
      <RefreshCw size={16} />
      Sync Verdict
    </Button>
  );
}
