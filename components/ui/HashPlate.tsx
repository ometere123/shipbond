"use client";

import { useState } from "react";
import { Copy, ExternalLink, Check } from "lucide-react";
import { cn, shortenHash, shortenAddress, buildExplorerTxUrl, buildBradburyTxUrl, buildContractUrl } from "@/lib/utils";

type HashType = "tx" | "address" | "hash" | "contract";

interface HashPlateProps {
  value: string;
  type?: HashType;
  label?: string;
  className?: string;
  showFull?: boolean;
  explorerType?: "chain" | "bradbury" | "none";
}

function buildUrl(value: string, type: HashType, explorerType: "chain" | "bradbury" | "none"): string | null {
  if (explorerType === "none") return null;
  if (type === "tx")      return explorerType === "bradbury" ? buildBradburyTxUrl(value) : buildExplorerTxUrl(value);
  if (type === "address" || type === "contract") return buildContractUrl(value);
  return null;
}

export function HashPlate({
  value,
  type = "hash",
  label,
  className,
  showFull = false,
  explorerType = "bradbury",
}: HashPlateProps) {
  const [copied, setCopied] = useState(false);
  const [hovered, setHovered] = useState(false);

  const display = showFull
    ? value
    : hovered
    ? value
    : type === "address" || type === "contract"
    ? shortenAddress(value)
    : shortenHash(value);

  const explorerUrl = buildUrl(value, type, explorerType);

  async function handleCopy() {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1.5",
        "bg-port-black border border-port-border rounded-btn",
        "px-2.5 py-1.5",
        className
      )}
    >
      {label && (
        <span className="font-body text-meta text-steel mr-1 uppercase tracking-wider whitespace-nowrap">
          {label}
        </span>
      )}

      <span
        className="hash-text text-fog cursor-default transition-colors hover:text-signal whitespace-nowrap"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        title={value}
      >
        {display}
      </span>

      <button
        onClick={handleCopy}
        className="text-steel hover:text-amber-bond transition-colors p-0.5 rounded"
        title="Copy"
      >
        {copied ? (
          <Check size={12} className="text-lime-passed" />
        ) : (
          <Copy size={12} />
        )}
      </button>

      {explorerUrl && (
        <a
          href={explorerUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-steel hover:text-cyan-evidence transition-colors p-0.5 rounded"
          title="View in explorer"
        >
          <ExternalLink size={12} />
        </a>
      )}
    </div>
  );
}
