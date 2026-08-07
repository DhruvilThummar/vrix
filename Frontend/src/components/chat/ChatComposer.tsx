"use client";

import React, { useState } from "react";

interface ChatComposerProps {
  onSend: (text: string) => void;
  disabled?: boolean;
}

export default function ChatComposer({ onSend, disabled }: ChatComposerProps) {
  const [text, setText] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || disabled) return;
    onSend(text.trim());
    setText("");
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="p-3 bg-surface-container-low border-t border-outline-variant flex items-center gap-2 shrink-0"
    >
      <input
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Ask VRIX (e.g. minimal ring under ₹15k)..."
        disabled={disabled}
        className="flex-1 px-3.5 py-2.5 bg-surface border border-outline focus:border-primary text-on-surface placeholder:text-on-surface-variant/60 font-jost text-body-md text-sm outline-none rounded-xs transition-colors"
      />

      <button
        type="submit"
        disabled={!text.trim() || disabled}
        aria-label="Send message"
        className="relative overflow-hidden px-4 py-2.5 bg-primary text-on-primary font-button text-button text-xs rounded-xs flex items-center justify-center gap-1.5 transition-opacity disabled:opacity-40 cursor-pointer group"
      >
        {/* Single restrained glint effect: thin diagonal highlight sweeping across on hover */}
        <span className="absolute inset-0 w-1/2 h-full bg-gradient-to-r from-transparent via-white/25 to-transparent -skew-x-12 -translate-x-full group-hover:translate-x-[300%] transition-transform duration-1000 ease-in-out pointer-events-none" />
        <span className="material-symbols-outlined text-[18px]">send</span>
      </button>
    </form>
  );
}
