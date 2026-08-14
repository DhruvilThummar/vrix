"use client";

import React, { useState, useEffect } from "react";

interface ChatComposerProps {
  onSend: (text: string) => void;
  disabled?: boolean;
}

export default function ChatComposer({ onSend, disabled }: ChatComposerProps) {
  const [text, setText] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [hasSpeechSupport, setHasSpeechSupport] = useState(false);

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

  return (
    <form
      onSubmit={handleSubmit}
      className="p-3 bg-surface-container-low border-t border-outline-variant flex items-center gap-2 shrink-0"
    >
      <input
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Ask VRIX (e.g. solitaire ring under ₹50k)..."
        disabled={disabled}
        className="flex-1 px-3.5 py-2.5 bg-surface border border-outline focus:border-primary text-on-surface placeholder:text-on-surface-variant/60 font-jost text-body-md text-sm outline-none rounded-xs transition-colors"
      />

      {hasSpeechSupport && (
        <button
          type="button"
          onClick={handleVoiceInput}
          title={isListening ? "Listening..." : "Speak query (Voice Input)"}
          className={`p-2.5 rounded-xs flex items-center justify-center transition-colors cursor-pointer ${
            isListening
              ? "bg-red-600 text-white animate-pulse"
              : "bg-surface border border-outline hover:border-primary text-on-surface-variant hover:text-primary"
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">
            {isListening ? "mic" : "mic_none"}
          </span>
        </button>
      )}

      <button
        type="submit"
        disabled={!text.trim() || disabled}
        aria-label="Send message"
        className="relative overflow-hidden px-4 py-2.5 bg-primary text-on-primary font-button text-button text-xs rounded-xs flex items-center justify-center gap-1.5 transition-opacity disabled:opacity-40 cursor-pointer group"
      >
        <span className="absolute inset-0 w-1/2 h-full bg-gradient-to-r from-transparent via-white/25 to-transparent -skew-x-12 -translate-x-full group-hover:translate-x-[300%] transition-transform duration-1000 ease-in-out pointer-events-none" />
        <span className="material-symbols-outlined text-[18px]">send</span>
      </button>
    </form>
  );
}
