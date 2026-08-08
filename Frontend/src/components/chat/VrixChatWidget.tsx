"use client";

import React, { useState, useEffect, useCallback } from "react";
import { ChatMessage, EntryPoint, QuickOption } from "./vrix-chat-types";
import { VRIX_ENTRY_POINTS, handleUserAction, createInitialMessage, EngineState } from "./vrix-chat-engine";
import ChatHeader from "./ChatHeader";
import QuickActionsMenu from "./QuickActionsMenu";
import MessageList from "./MessageList";
import ChatComposer from "./ChatComposer";
import { getApiBaseUrl } from "@/utils/api";
import { useCurrency } from "@/context/CurrencyContext";

export default function VrixChatWidget() {
  const { currency, symbol, rate, locale, detectedCountry } = useCurrency();
  const [isOpen, setIsOpen] = useState(false);
  const [showQuickMenu, setShowQuickMenu] = useState(true);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [engineState, setEngineState] = useState<EngineState>({
    currentFlow: null,
    step: 0,
    data: {},
    surfacedProducts: [],
  });
  const [isTyping, setIsTyping] = useState(false);

  // Persistent Context Memory Window across page reloads and tab navigation
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const savedMsgs = localStorage.getItem("vrix-chat-history-v1");
      const savedEngine = localStorage.getItem("vrix-chat-engine-state-v1");
      if (savedMsgs) {
        const parsed = JSON.parse(savedMsgs);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setMessages(parsed);
          setShowQuickMenu(false);
        } else {
          setMessages([createInitialMessage()]);
        }
      } else {
        setMessages([createInitialMessage()]);
      }
      if (savedEngine) {
        setEngineState(JSON.parse(savedEngine));
      }
    } catch (e) {
      setMessages([createInitialMessage()]);
    }
  }, []);

  // Sync state to localStorage on updates
  useEffect(() => {
    if (typeof window === "undefined" || messages.length === 0) return;
    try {
      const validMsgs = messages.filter((m) => !m.isTyping);
      localStorage.setItem("vrix-chat-history-v1", JSON.stringify(validMsgs));
      localStorage.setItem("vrix-chat-engine-state-v1", JSON.stringify(engineState));
    } catch (e) {}
  }, [messages, engineState]);

  // Lock body scroll on mobile when full-screen chat is open (<640px)
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (isOpen && window.innerWidth < 640) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // Keyboard operability: Esc key closes panel
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  const processResponse = useCallback(
    async (actionValue: string, userLabel?: string) => {
      setIsTyping(true);

      // Add temporary typing indicator message
      const typingId = `typing-${Date.now()}`;
      setMessages((prev) => [
        ...prev,
        { id: typingId, sender: "bot", isTyping: true, timestamp: "" },
      ]);

      try {
        // Attempt RAG Backend API call first with currency context payload
        const baseUrl = getApiBaseUrl();
        const res = await fetch(`${baseUrl}/chat/query`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            actionValue,
            userLabel,
            currentFlow: engineState.currentFlow,
            step: engineState.step,
            data: engineState.data,
            query: userLabel || actionValue,
            currency: currency || "INR",
            symbol: symbol || "₹",
            rate: rate || 1,
            locale: locale || "en-IN",
            country: detectedCountry || "IN",
          }),
        });

        if (res.ok) {
          const apiData = await res.json();
          if (apiData.success && apiData.messages) {
            setMessages((prev) => [
              ...prev.filter((m) => m.id !== typingId),
              ...apiData.messages,
            ]);
            if (apiData.nextState) {
              setEngineState((prev) => ({ ...prev, ...apiData.nextState }));
            }
            setIsTyping(false);
            return;
          }
        }
      } catch (err) {
        // Gracefully fallback to local flow engine
      }

      // Local fallback flow engine execution
      setTimeout(() => {
        const { nextState, messages: newMsgs } = handleUserAction(
          actionValue,
          userLabel,
          engineState
        );
        setEngineState(nextState);
        setMessages((prev) => [
          ...prev.filter((m) => m.id !== typingId),
          ...newMsgs,
        ]);
        setIsTyping(false);
      }, 500);
    },
    [engineState, currency, symbol, rate, locale, detectedCountry]
  );

  const handleSelectEntryPoint = (entry: EntryPoint) => {
    setShowQuickMenu(false);
    // Append user bubble
    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: "user",
      text: entry.label,
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMsg]);
    processResponse(entry.id, entry.label);
  };

  const handleOptionSelect = (option: QuickOption) => {
    setShowQuickMenu(false);
    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: "user",
      text: option.label,
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMsg]);
    processResponse(option.value, option.label);
  };

  const handleSendText = (text: string) => {
    setShowQuickMenu(false);
    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: "user",
      text,
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMsg]);
    processResponse("custom_text", text);
  };

  const handleReset = () => {
    setShowQuickMenu(true);
    setEngineState({ currentFlow: null, step: 0, data: {}, surfacedProducts: [] });
    const init = [createInitialMessage()];
    setMessages(init);
    try {
      localStorage.removeItem("vrix-chat-history-v1");
      localStorage.removeItem("vrix-chat-engine-state-v1");
    } catch (e) {}
  };

  return (
    <>
      {/* Closed State: Floating Circular FAB with restrained glint animation */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-label={isOpen ? "Close VRIX chat assistant" : "Open VRIX chat assistant"}
        className="fixed right-6 bottom-6 bottom-[calc(1.5rem+env(safe-area-inset-bottom))] z-50 w-14 h-14 rounded-full bg-primary text-on-primary shadow-lg flex items-center justify-center cursor-pointer transition-transform hover:scale-105 overflow-hidden group"
      >
        {/* Single restrained glint effect on hover */}
        <span className="absolute inset-0 w-1/2 h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 -translate-x-full group-hover:translate-x-[300%] transition-transform duration-1000 ease-in-out pointer-events-none" />
        <span className="material-symbols-outlined text-[26px]">
          {isOpen ? "close" : "diamond"}
        </span>
      </button>

      {/* Open State: Chat Panel Modal / Card */}
      {isOpen && (
        <div
          role="dialog"
          aria-label="VRIX Chat Assistant"
          className="fixed z-50 flex flex-col bg-surface border border-outline-variant shadow-2xl overflow-hidden animate-fade-in-slide
            /* Mobile <640px: Full-screen takeover */
            inset-0 sm:inset-auto sm:right-6 sm:bottom-24 sm:w-[400px] sm:h-[70vh] sm:max-h-[640px] sm:rounded-sm
            /* Desktop >=1024px */
            lg:w-[420px] lg:h-[80vh] lg:max-h-[680px]
            /* Capped width >=1440px */
            2xl:max-w-[440px]
          "
        >
          <ChatHeader onClose={() => setIsOpen(false)} onReset={handleReset} />

          {showQuickMenu && (
            <QuickActionsMenu
              entryPoints={VRIX_ENTRY_POINTS}
              onSelect={handleSelectEntryPoint}
            />
          )}

          <MessageList messages={messages} onOptionSelect={handleOptionSelect} />

          <ChatComposer onSend={handleSendText} disabled={isTyping} />
        </div>
      )}
    </>
  );
}
