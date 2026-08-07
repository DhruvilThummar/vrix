"use client";

import React from "react";

interface ChatHeaderProps {
  onClose: () => void;
  onReset: () => void;
}

export default function ChatHeader({ onClose, onReset }: ChatHeaderProps) {
  return (
    <div className="flex items-center justify-between px-5 py-4 bg-surface-container-low border-b border-outline-variant shrink-0 select-none">
      <div className="flex items-center gap-2">
        <span className="material-symbols-outlined text-primary text-[22px]">diamond</span>
        <div>
          <h2 className="font-inter text-headline-md text-on-surface text-lg leading-tight tracking-tight font-semibold">
            Ask VRIX
          </h2>
          <p className="font-label-caps text-[10px] text-on-surface-variant uppercase tracking-widest">
            Architectural Minimalism
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
