"use client";

import React from "react";

interface ChatHeaderProps {
  onClose: () => void;
  onReset: () => void;
  mode?: "LAUNCH" | "SALE" | "DISABLED" | string;
}

export default function ChatHeader({ onClose, onReset, mode = "DISABLED" }: ChatHeaderProps) {
  const modeBadge =
    mode === "LAUNCH"
      ? "✦ Launch Mode"
      : mode === "SALE"
      ? "✦ Archive Sale Live"
      : "✦ Online Concierge";

  return (
    <div className="flex items-center justify-between px-5 py-3.5 bg-surface-container-low border-b border-outline-variant shrink-0 select-none">
      <div className="flex items-center gap-2.5">
        <div className="relative">
          <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
            <span className="material-symbols-outlined text-primary text-[19px]">diamond</span>
          </div>
          {/* Live pulsing online indicator */}
          <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-surface animate-pulse" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-inter text-headline-md text-on-surface text-base leading-tight tracking-tight font-semibold">
              Ask VRIX
            </h2>
            <span className="font-label-caps text-[9px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 tracking-wider">
              {modeBadge}
            </span>
          </div>
          <p className="font-label-caps text-[10px] text-on-surface-variant uppercase tracking-widest mt-0.5">
            Architectural Fine Jewellery
          </p>
        </div>
      </div>

      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={onReset}
          aria-label="Restart conversation"
          title="Quick Actions Menu"
          className="p-2 text-on-surface-variant hover:text-on-surface hover:bg-surface-container rounded transition-colors cursor-pointer"
        >
          <span className="material-symbols-outlined text-[20px]">restart_alt</span>
        </button>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close chat panel"
          title="Close"
          className="p-2 text-on-surface-variant hover:text-on-surface hover:bg-surface-container rounded transition-colors cursor-pointer"
        >
          <span className="material-symbols-outlined text-[20px]">close</span>
        </button>
      </div>
    </div>
  );
}
