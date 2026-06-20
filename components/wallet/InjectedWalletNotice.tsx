// Small notice used inline anywhere we want to nudge users toward injected wallets
export function InjectedWalletNotice() {
  return (
    <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-amber-bond/8 border border-amber-bond/20 rounded-btn">
      <span className="font-mono text-meta text-amber-bond uppercase tracking-wider">
        Recommended:
      </span>
      <span className="font-body text-meta text-fog">
        Browser / Injected Wallet — MetaMask, Rabby, Frame
      </span>
    </div>
  );
}
