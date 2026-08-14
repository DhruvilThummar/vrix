"use client";

import React from "react";
import { HumanHandoffData } from "./vrix-chat-types";

interface HumanHandoffCardProps {
  data: HumanHandoffData;
}

export default function HumanHandoffCard({ data }: HumanHandoffCardProps) {
  return (
    <div className="w-full my-2 p-4 bg-surface-container-low border border-outline-variant rounded-sm space-y-3 font-jost text-xs">
      <div className="flex items-center gap-2">
        <span className="material-symbols-outlined text-primary text-xl">support_agent</span>
        <div>
          <h4 className="font-inter text-sm font-semibold text-on-surface leading-tight">{data.title}</h4>
          <p className="text-[11px] text-on-surface-variant">{data.description}</p>
        </div>
      </div>

      <div className="space-y-1.5 pt-2 border-t border-outline-variant/50">
        <a
          href={`tel:${data.phone.replace(/\s+/g, "")}`}
          className="flex items-center gap-2 text-on-surface hover:text-primary transition-colors font-medium"
        >
          <span className="material-symbols-outlined text-base">call</span>
          <span>{data.phone}</span>
        </a>
        <a
          href={data.instagram}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 text-on-surface hover:text-primary transition-colors"
        >
          <span className="material-symbols-outlined text-base">share</span>
          <span>Instagram (@vrix.official)</span>
        </a>
        <a
          href={data.linkedin}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 text-on-surface hover:text-primary transition-colors"
        >
          <span className="material-symbols-outlined text-base">work</span>
          <span>LinkedIn (vrixjewels)</span>
        </a>
      </div>

      <div className="pt-2">
        <a
          href="https://wa.me/919054285693?text=Hi%20VRIX%20Concierge,%20I%20would%20like%20personal%20styling%20assistance."
          target="_blank"
          rel="noopener noreferrer"
          className="w-full py-2 px-3 bg-emerald-700 text-white font-button text-button text-[10px] rounded-xs uppercase tracking-wider flex items-center justify-center gap-1.5 hover:bg-emerald-800 transition-colors shadow-2xs cursor-pointer"
        >
          <span className="material-symbols-outlined text-[15px]">chat</span>
          <span>Chat Live on WhatsApp Concierge</span>
        </a>
      </div>

      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-outline-variant/50 font-button text-button text-[10px]">
        <a
          href={data.mapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="py-1.5 px-2 bg-surface border border-outline-variant text-center text-on-surface hover:border-primary transition-colors rounded-xs"
        >
          Google Maps Listing
        </a>
        <a
          href={data.businessProfileUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="py-1.5 px-2 bg-surface border border-outline-variant text-center text-on-surface hover:border-primary transition-colors rounded-xs"
        >
          Business Profile
        </a>
      </div>
    </div>
  );
}
