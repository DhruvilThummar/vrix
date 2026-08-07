"use client";

import React from "react";
import { EntryPoint } from "./vrix-chat-types";

interface QuickActionsMenuProps {
  entryPoints: EntryPoint[];
  onSelect: (entryPoint: EntryPoint) => void;
}

export default function QuickActionsMenu({ entryPoints, onSelect }: QuickActionsMenuProps) {
  return (
    <div className="p-4 bg-surface space-y-3 border-b border-outline-variant/50 shrink-0">
      <p className="font-label-caps text-label-caps text-on-surface-variant font-semibold uppercase tracking-wider">
        QUICK ACTIONS
      </p>
      <div className="flex flex-wrap gap-2">
        {entryPoints.map((entry) => (
          <button
            key={entry.id}
            type="button"
            onClick={() => onSelect(entry)}
            className="flex items-center gap-1.5 px-3 py-1.5 border border-outline-variant rounded-sm bg-surface hover:bg-primary hover:text-on-primary text-on-surface transition-colors cursor-pointer font-button text-button text-xs"
          >
            <span className="material-symbols-outlined text-[16px]">{entry.icon}</span>
            <span>{entry.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
