"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { BespokeEstimateData } from "./vrix-chat-types";
import { fetchBespokeData } from "@/utils/api";

interface BespokeEstimateCardProps {
  data: BespokeEstimateData;
}

export default function BespokeEstimateCard({ data }: BespokeEstimateCardProps) {
  const [cmsSettings, setCmsSettings] = useState<any>(null);

  useEffect(() => {
    fetchBespokeData()
      .then((res) => {
        if (res?.settings) {
          setCmsSettings(res.settings);
        }
      })
      .catch(() => {});
  }, []);

  const headline = cmsSettings?.headline || "Bespoke Atelier Estimate";
  const disclaimer = cmsSettings?.disclaimerText || "Final quote verified during 1-on-1 consultation with our lead master craftsman.";
  const ctaText = cmsSettings?.consultationCtaText || "Book Atelier Consultation";
  const defaultLeadTime = cmsSettings?.craftingTimeline || "3 – 4 Weeks";
  const defaultRange = cmsSettings
    ? `₹${cmsSettings.baseMinPrice?.toLocaleString("en-IN")} – ₹${cmsSettings.baseMaxPrice?.toLocaleString("en-IN")}`
    : "₹65,000 – ₹1,80,000";

  return (
    <div className="w-full my-2.5 p-4 bg-surface border border-outline-variant rounded-sm space-y-3 font-jost text-xs">
      <div className="flex items-center justify-between border-b border-outline-variant/40 pb-2">
        <span className="font-label-caps text-[10px] uppercase text-primary tracking-widest font-semibold flex items-center gap-1">
          <span className="material-symbols-outlined text-[15px]">design_services</span>
          {headline}
        </span>
        <span className="bg-primary/10 text-primary px-2 py-0.5 rounded text-[9px] font-label-caps uppercase font-bold">
          Custom Piece
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2 text-on-surface">
        <div className="bg-surface-container-low p-2 rounded-xs">
          <span className="block text-[9px] font-label-caps text-on-surface-variant uppercase">Silhouette</span>
          <span className="font-medium text-xs">{data.pieceType || "Solitaire Ring"}</span>
        </div>
        <div className="bg-surface-container-low p-2 rounded-xs">
          <span className="block text-[9px] font-label-caps text-on-surface-variant uppercase">Metal &amp; Setting</span>
          <span className="font-medium text-xs">{data.metalChoice || "18K Solid Gold / 950 Platinum"}</span>
        </div>
        <div className="bg-surface-container-low p-2 rounded-xs">
          <span className="block text-[9px] font-label-caps text-on-surface-variant uppercase">Estimated Range</span>
          <span className="font-bold text-xs text-primary">{data.estimatedPriceRange || defaultRange}</span>
        </div>
        <div className="bg-surface-container-low p-2 rounded-xs">
          <span className="block text-[9px] font-label-caps text-on-surface-variant uppercase">Crafting Time</span>
          <span className="font-medium text-xs">{data.leadTime || defaultLeadTime}</span>
        </div>
      </div>

      <p className="text-[11px] text-on-surface-variant italic">
        {disclaimer}
      </p>

      <div className="pt-1 flex gap-2">
        <Link
          href="/bespoke"
          className="flex-1 py-2 px-3 bg-primary text-on-primary text-center font-button text-button text-[10px] rounded-xs uppercase tracking-wider hover:opacity-90 transition-opacity"
        >
          {ctaText}
        </Link>
      </div>
    </div>
  );
}
