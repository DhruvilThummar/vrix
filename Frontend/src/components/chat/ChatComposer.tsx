"use client";

import React, { useState, useEffect, useMemo } from "react";

interface ChatComposerProps {
  onSend: (text: string) => void;
  disabled?: boolean;
  mode?: "LAUNCH" | "SALE" | "DISABLED" | string;
}

export default function ChatComposer({ onSend, disabled, mode = "DISABLED" }: ChatComposerProps) {
  const [text, setText] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [hasSpeechSupport, setHasSpeechSupport] = useState(false);

  // Dynamic Suggestion Pills depending on active storefront mode
  const suggestionPills = useMemo(() => {
    if (mode === "LAUNCH") {
      return [
        "When is the launch?",
        "Join VIP waitlist",
        "Instagram & Facebook",
        "About lab diamonds",
      ];
    }
    if (mode === "SALE") {
      return [
        "What is the promo code?",
        "Rings on sale",
        "Pieces under ₹25k",
        "Sale countdown",
      ];
    }
    return [
      "Find ring for partner",
      "Solitaire under ₹30,000",
      "15-day return policy",
      "How to measure ring size",
    ];
  }, [mode]);

  useEffect(() => {
    if (typeof window !== "undefined" && ("SpeechRecognition" in window || "webkitSpeechRecognition" in window)) {
      setHasSpeechSupport(true);
    }
  }, []);

  const handleVoiceInput = () => {
    if (typeof window === "undefined") return;
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = "en-IN";

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results?.[0]?.[0]?.transcript;
        if (transcript) {
          setText((prev) => (prev ? `${prev} ${transcript}` : transcript));
        }
        setIsListening(false);
      };

      recognition.onerror = () => {
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } catch (e) {
      setIsListening(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || disabled) return;
    onSend(text.trim());
    setText("");
  };

  const handlePillClick = (pill: string) => {
    if (disabled) return;
    onSend(pill);
  };

  return (
    <div className="bg-surface-container-low border-t border-outline-variant shrink-0 select-none">
      {/* Contextual Smart Suggestion Pills (Horizontally Scrollable) */}
      <div className="flex items-center gap-1.5 px-3 py-2 overflow-x-auto hide-scrollbar border-b border-outline-variant/30">
        <span className="material-symbols-outlined text-[14px] text-primary/70 shrink-0">
          auto_awesome
        </span>
        {suggestionPills.map((pill) => (
          <button
            key={pill}
            type="button"
            onClick={() => handlePillClick(pill)}
            disabled={disabled}
            className="shrink-0 px-2.5 py-1 rounded-full bg-surface hover:bg-surface-container border border-outline-variant/60 hover:border-primary/50 text-[11px] font-jost text-on-surface-variant hover:text-primary transition-all cursor-pointer whitespace-nowrap active:scale-95 disabled:opacity-50"
          >
            {pill}
          </button>
        ))}
      </div>

      {/* Input Composer Row */}
      <form onSubmit={handleSubmit} className="p-2.5 flex items-center gap-2">
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={
            mode === "LAUNCH"
              ? "Ask about launch, waitlist, or craftsmanship..."
              : mode === "SALE"
              ? "Ask about discounts, promo code, or solitaires..."
              : "Ask VRIX (e.g. solitaire ring under ₹50k)..."
          }
          disabled={disabled}
          className="flex-1 px-3.5 py-2 bg-surface border border-outline focus:border-primary text-on-surface placeholder:text-on-surface-variant/60 font-jost text-body-md text-sm outline-none rounded-xs transition-colors"
        />

        {hasSpeechSupport && (
          <button
            type="button"
            onClick={handleVoiceInput}
            title={isListening ? "Listening..." : "Voice Input"}
            className={`p-2 rounded-xs flex items-center justify-center transition-colors cursor-pointer ${
              isListening
                ? "bg-red-600 text-white animate-pulse"
                : "bg-surface border border-outline hover:border-primary text-on-surface-variant hover:text-primary"
            }`}
          >
            <span className="material-symbols-outlined text-[17px]">
              {isListening ? "mic" : "mic_none"}
            </span>
          </button>
        )}

        <button
          type="submit"
          disabled={!text.trim() || disabled}
          aria-label="Send message"
          className="relative overflow-hidden px-3.5 py-2 bg-primary text-on-primary font-button text-button text-xs rounded-xs flex items-center justify-center gap-1 transition-opacity disabled:opacity-40 cursor-pointer group shadow-2xs"
        >
          <span className="material-symbols-outlined text-[17px]">send</span>
        </button>
      </form>
    </div>
  );
}
