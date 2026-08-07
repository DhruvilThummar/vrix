"use client";

import React from "react";
import Link from "next/link";
import { BespokeEstimateData } from "./vrix-chat-types";

interface BespokeEstimateCardProps {
  data: BespokeEstimateData;
}

export default function BespokeEstimateCard({ data }: BespokeEstimateCardProps) {
  return (
    <div className="w-full my-2.5 p-4 bg-surface border border-outline-variant rounded-sm space-y-3 font-jost text-xs">
      <div className="flex items-center justify-between border-b border-outline-variant/40 pb-2">
        <span className="font-label-caps text-[10px] uppercase text-primary tracking-widest font-semibold flex items-center gap-1">
          <span className="material-symbols-outlined text-[15px]">design_services</span>
          Bespoke Atelier Estimate
        </span>
        <span className="bg-primary/10 text-primary px-2 py-0.5 rounded text-[9px] font-label-caps uppercase font-bold">
          Custom Piece
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2 text-on-surface">
        <div className="bg-surface-container-low p-2 rounded-xs">
          <span className="block text-[9px] font-label-caps text-on-surface-variant uppercase">Silhouette</span>
          <span className="font-medium text-xs">{data.pieceType}</span>
        </div>
        <div className="bg-surface-container-low p-2 rounded-xs">
          <span className="block text-[9px] font-label-caps text-on-surface-variant uppercase">Metal & Setting</span>
          <span className="font-medium text-xs">{data.metalChoice}</span>
        </div>
        <div className="bg-surface-container-low p-2 rounded-xs">
          <span className="block text-[9px] font-label-caps text-on-surface-variant uppercase">Estimated Range</span>
          <span className="font-bold text-xs text-primary">{data.estimatedPriceRange}</span>
        </div>
        <div className="bg-surface-container-low p-2 rounded-xs">
          <span className="block text-[9px] font-label-caps text-on-surface-variant uppercase">Crafting Time</span>
          <span className="font-medium text-xs">{data.leadTime}</span>
        </div>
      </div>

      <p className="text-[11px] text-on-surface-variant italic">
        Final quote verified during 1-on-1 consultation with our lead master craftsman.
      </p>

      <div className="pt-1 flex gap-2">
        <Link
          href="/bespoke"
          className="flex-1 py-2 px-3 bg-primary text-on-primary text-center font-button text-button text-[10px] rounded-xs uppercase tracking-wider hover:opacity-90 transition-opacity"
        >
          Book Atelier Consultation
        </Link>
      </div>
    </div>
  );
}
