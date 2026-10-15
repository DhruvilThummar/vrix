"use client";

import React, { useState } from "react";
import Link from "next/link";
import { SaleDiscountCardData } from "./vrix-chat-types";

interface SaleDiscountCardProps {
  data: SaleDiscountCardData;
}

export default function SaleDiscountCard({ data }: SaleDiscountCardProps) {
  const [copied, setCopied] = useState(false);

  const handleCopyCode = () => {
    if (!data.code) return;
    navigator.clipboard.writeText(data.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const ctaUrl = data.ctaUrl || "/collections";

  return (
    <div className="w-full my-2.5 p-3.5 bg-gradient-to-br from-surface-container-low via-surface to-amber-950/20 border border-amber-500/40 rounded-xs space-y-2.5 font-jost text-xs shadow-xs">
      <div className="flex items-center justify-between gap-2 border-b border-outline-variant/40 pb-2">
        <div className="flex items-center gap-1.5">
          <span className="material-symbols-outlined text-amber-500 text-base">local_offer</span>
          <span className="font-inter text-xs font-bold text-amber-500 uppercase tracking-widest">
            {data.highlight || "SPECIAL ATELIER OFFER"}
          </span>
        </div>
        {data.validUntil && (
          <span className="font-label-caps text-[9px] text-on-surface-variant bg-surface px-1.5 py-0.5 rounded-xs border border-outline-variant/50">
            {data.validUntil}
          </span>
        )}
      </div>

      <p className="text-[11px] text-on-surface-variant leading-relaxed">
        {data.description || "Limited-time pricing across signature lab-grown solitaires, minimal rings, and pavé bands."}
      </p>

      {data.code && (
        <div className="flex items-center justify-between gap-2 p-2 bg-surface border border-dashed border-amber-500/50 rounded-xs">
          <div className="flex flex-col">
            <span className="font-inter text-[9px] uppercase tracking-wider text-on-surface-variant">
              Promotion Code
            </span>
            <span className="font-mono text-xs font-bold tracking-widest text-primary">
              {data.code}
            </span>
          </div>

          <button
            type="button"
            onClick={handleCopyCode}
            className="px-2.5 py-1 text-[11px] font-inter font-semibold bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-400 rounded-xs transition-colors flex items-center gap-1 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[13px]">
              {copied ? "check" : "content_copy"}
            </span>
            <span>{copied ? "Copied" : "Copy Code"}</span>
          </button>
        </div>
      )}

      <div className="pt-0.5">
        <Link
          href={ctaUrl}
          onClick={() => {
            if (typeof window !== "undefined") {
              window.dispatchEvent(new CustomEvent("vrix-close-chat"));
            }
          }}
          className="w-full py-1.5 px-3 bg-primary hover:bg-primary/90 text-on-primary font-inter text-[11px] font-semibold uppercase tracking-wider rounded-xs flex items-center justify-center gap-1.5 transition-all text-center block"
        >
          <span>Explore Sale Collections</span>
          <span className="material-symbols-outlined text-sm">arrow_forward</span>
        </Link>
      </div>
    </div>
  );
}
