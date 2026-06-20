import { redirect } from "next/navigation";
import { tryGetSessionWallet } from "@/lib/get-session-wallet";
import { CreateMilestoneForm } from "@/components/milestone/CreateMilestoneForm";
import { Shield } from "lucide-react";

export const metadata = { title: "Create Milestone" };

export default async function CreateMilestonePage() {
  const session = await tryGetSessionWallet();
  if (!session) redirect("/connect");

  return (
    <div>
      <div className="mb-8">
        <p className="font-mono text-meta text-steel uppercase tracking-widest mb-2">
          Role: Sponsor
        </p>
        <h1 className="font-display font-bold text-page-title text-signal">
          Post a Milestone
        </h1>
        <p className="font-body text-base text-fog mt-2 max-w-xl">
          Write a plain-language promise. Set the reward and required builder bond.
          A SHA-256 terms hash is computed and anchored on GenLayer — the IC uses it to adjudicate.
        </p>
      </div>

      {/* Security notice */}
      <div className="flex items-start gap-3 px-4 py-3 bg-violet-consensus/8 border border-violet-consensus/20 rounded-btn mb-8 max-w-2xl">
        <Shield size={15} className="text-violet-consensus shrink-0 mt-0.5" />
        <div>
          <p className="font-mono text-meta text-violet-consensus uppercase tracking-wider mb-0.5">
            GenLayer Adjudication
          </p>
          <p className="font-body text-meta text-fog">
            Your milestone terms are hashed and passed to the Intelligent Contract. Verdict is determined exclusively by GenLayer consensus — no sponsor can override it.
          </p>
        </div>
      </div>

      <CreateMilestoneForm />
    </div>
  );
}
