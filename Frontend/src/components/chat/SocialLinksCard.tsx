"use client";

import React from "react";
import { SocialLinksData } from "./vrix-chat-types";

interface SocialLinksCardProps {
  data: SocialLinksData;
}

export default function SocialLinksCard({ data }: SocialLinksCardProps) {
  const instagramUrl = data.instagram || "https://www.instagram.com/vrix.official";
  const facebookUrl = data.facebook || "https://www.facebook.com/profile.php?id=61588375466280";

  return (
    <div className="w-full my-2.5 p-3.5 bg-surface-container-low border border-outline-variant/70 rounded-xs space-y-3 font-jost text-xs">
      <div className="flex items-start gap-2.5">
        <div className="w-7 h-7 rounded-full bg-primary/10 border border-primary/25 flex items-center justify-center shrink-0 mt-0.5">
          <span className="material-symbols-outlined text-[16px] text-primary">public</span>
        </div>
        <div>
          <h4 className="font-inter text-xs font-semibold text-on-surface uppercase tracking-wider">
            {data.title || "VRIX Official Channels"}
          </h4>
          <p className="text-[11px] text-on-surface-variant leading-relaxed mt-0.5">
            {data.description || "Follow our official atelier channels for daily releases, behind-the-scenes craftsmanship, and launch updates."}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 pt-1">
        <a
          href={instagramUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 py-2 px-3 bg-white/5 hover:bg-white/10 border border-outline-variant hover:border-amber-400/60 text-on-surface rounded-xs transition-all hover:scale-[1.02] group shadow-2xs"
          title="Follow @vrix.official on Instagram"
        >
          <i className="fa-brands fa-instagram text-[15px] text-pink-500 group-hover:scale-110 transition-transform" />
          <span className="font-inter text-[11px] font-semibold tracking-wide">Instagram</span>
        </a>

        <a
          href={facebookUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 py-2 px-3 bg-white/5 hover:bg-white/10 border border-outline-variant hover:border-amber-400/60 text-on-surface rounded-xs transition-all hover:scale-[1.02] group shadow-2xs"
          title="Follow VRIX on Facebook"
        >
          <i className="fa-brands fa-facebook-f text-[14px] text-blue-500 group-hover:scale-110 transition-transform" />
          <span className="font-inter text-[11px] font-semibold tracking-wide">Facebook</span>
        </a>
      </div>

      {data.whatsapp && (
        <div className="pt-1">
          <a
            href={data.whatsapp}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-1.5 px-3 bg-emerald-800/80 hover:bg-emerald-750 text-white font-inter text-[11px] font-medium rounded-xs flex items-center justify-center gap-1.5 transition-colors"
          >
            <i className="fa-brands fa-whatsapp text-sm" />
            <span>Chat with Concierge on WhatsApp</span>
          </a>
        </div>
      )}
    </div>
  );
}
