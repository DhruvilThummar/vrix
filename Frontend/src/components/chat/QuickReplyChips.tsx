"use client";

import React from "react";
import { QuickOption } from "./vrix-chat-types";

interface QuickReplyChipsProps {
  options: QuickOption[];
  onSelect: (option: QuickOption) => void;
}

export default function QuickReplyChips({ options, onSelect }: QuickReplyChipsProps) {
  if (!options || options.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1.5 pt-2">
      {options.map((opt, idx) => (
        <button
          key={idx}
          type="button"
          onClick={() => onSelect(opt)}
          className="px-3 py-1 border border-outline-variant hover:border-primary bg-surface hover:bg-primary hover:text-on-primary text-on-surface text-xs font-button text-button rounded-xs transition-colors cursor-pointer"
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
