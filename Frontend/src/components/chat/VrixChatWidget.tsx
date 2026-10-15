"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { ChatMessage, EntryPoint, QuickOption, ChatProduct } from "./vrix-chat-types";
import {
  getEntryPointsForMode,
  handleUserAction,
  createInitialMessage,
  setChatCatalog,
  EngineState,
} from "./vrix-chat-engine";
import ChatHeader from "./ChatHeader";
import QuickActionsMenu from "./QuickActionsMenu";
import MessageList from "./MessageList";
import ChatComposer from "./ChatComposer";
import { getApiBaseUrl, fetchProducts } from "@/utils/api";
import { useCurrency } from "@/context/CurrencyContext";
import { useLaunchCountdown } from "@/context/LaunchCountdownContext";

export default function VrixChatWidget() {
  const { currency, symbol, rate, locale, detectedCountry } = useCurrency();
  const { config: launchConfig, timeLeft, isPreLaunch, isSaleCountdown } = useLaunchCountdown();

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
  const [mounted, setMounted] = useState(false);

  // Active landing mode: "LAUNCH" | "SALE" | "DISABLED"
  const activeMode = useMemo(() => {
    return launchConfig?.mode || "DISABLED";
  }, [launchConfig?.mode]);

  // Dynamic entry points based on active mode
  const currentEntryPoints = useMemo(() => {
    return getEntryPointsForMode(activeMode);
  }, [activeMode]);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Hydrate live product catalog from API for instant offline/fallback chat recommendations
  useEffect(() => {
    fetchProducts()
      .then((prods: any[]) => {
        if (Array.isArray(prods) && prods.length > 0) {
          const mapped: ChatProduct[] = prods
            .filter((p) => p.isVisible !== false)
            .map((p) => ({
              id: p.id,
              title: p.title,
              category: p.type || p.collection || "Jewelry",
              material: p.material || "18K Gold / 950 Platinum",
              price: Number(p.price) || 0,
              originalPrice: Number(p.originalPrice) || undefined,
              image: p.image || (Array.isArray(p.images) ? p.images[0] : ""),
              images: Array.isArray(p.images) ? p.images : [p.image],
              whyFits: p.subtitle || p.shortDescription || undefined,
              stone: p.gemstone || p.stone || "Lab Diamond (VS+)",
              warranty: "Lifetime Craftsmanship Guarantee",
              slug: p.id,
            }));
          setChatCatalog(mapped);
        }
      })
      .catch(() => {});
  }, []);

  // Persistent Context Memory Window across page reloads and tab navigation
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const savedMsgs = localStorage.getItem("vrix-chat-history-v2");
      const savedEngine = localStorage.getItem("vrix-chat-engine-state-v2");
      const savedMode = localStorage.getItem("vrix-chat-saved-mode");

      // If mode changed since last session, initialize fresh welcome tailored to current mode
      if (savedMode && savedMode !== activeMode) {
        setMessages([createInitialMessage(activeMode, launchConfig, timeLeft)]);
        setShowQuickMenu(true);
        localStorage.setItem("vrix-chat-saved-mode", activeMode);
        return;
      }

      if (savedMsgs) {
        const parsed = JSON.parse(savedMsgs);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setMessages(parsed);
          setShowQuickMenu(false);
        } else {
          setMessages([createInitialMessage(activeMode, launchConfig, timeLeft)]);
        }
      } else {
        setMessages([createInitialMessage(activeMode, launchConfig, timeLeft)]);
      }

      if (savedEngine) {
        setEngineState(JSON.parse(savedEngine));
      }
      localStorage.setItem("vrix-chat-saved-mode", activeMode);
    } catch (e) {
      setMessages([createInitialMessage(activeMode, launchConfig, timeLeft)]);
    }
  }, [activeMode, launchConfig, timeLeft]);

  // Sync state to localStorage on updates
  useEffect(() => {
    if (typeof window === "undefined" || messages.length === 0) return;
    try {
      const validMsgs = messages.filter((m) => !m.isTyping);
      localStorage.setItem("vrix-chat-history-v2", JSON.stringify(validMsgs));
      localStorage.setItem("vrix-chat-engine-state-v2", JSON.stringify(engineState));
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

  // Keyboard operability: Esc key closes panel & Custom Product Navigation Event closes modal on mobile
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
      }
    };
    const handleCloseChat = () => setIsOpen(false);

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("vrix-close-chat", handleCloseChat);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("vrix-close-chat", handleCloseChat);
    };
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

      const isDirectAction = Boolean(actionValue && actionValue !== "custom_text");

      // ── 1. FAST-PATH: Direct UI Actions & Option Pills (<200ms) ───────────
      // When user clicks pills, entry points, or menus, resolve locally with a smooth luxury typing delay
      if (isDirectAction) {
        setTimeout(() => {
          const { nextState, messages: newMsgs } = handleUserAction(
            actionValue,
            userLabel,
            engineState,
            launchConfig,
            timeLeft
          );
          setEngineState(nextState);
          setMessages((prev) => [
            ...prev.filter((m) => m.id !== typingId),
            ...newMsgs,
          ]);
          setIsTyping(false);
        }, 200);
        return;
      }

      // ── 2. FREE-TEXT: Query Backend with strict 3000ms AbortController ───
      const controller = new AbortController();
      const abortTimer = setTimeout(() => controller.abort(), 3000);

      try {
        const baseUrl = getApiBaseUrl();
        const savedSessionId =
          typeof window !== "undefined"
            ? localStorage.getItem("vrix-chat-session-id")
            : null;

        const res = await fetch(`${baseUrl}/chat/message`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          signal: controller.signal,
          body: JSON.stringify({
            sessionId: savedSessionId || undefined,
            actionValue,
            userLabel,
            userMessage: userLabel || actionValue,
            currentFlow: engineState.currentFlow,
            step: engineState.step,
            data: engineState.data,
            currency: currency || "INR",
            symbol: symbol || "₹",
            rate: rate || 1,
            locale: locale || "en-IN",
            country: detectedCountry || "IN",
            launchMode: activeMode,
            targetDate: launchConfig?.targetDate,
            saleDiscountHighlight: launchConfig?.saleDiscountHighlight,
            saleDiscountCode: launchConfig?.saleDiscountCode,
            saleTitle: launchConfig?.saleTitle,
          }),
        });

        clearTimeout(abortTimer);

        if (res.ok) {
          const apiData = await res.json();
          if (apiData.sessionId && typeof window !== "undefined") {
            localStorage.setItem("vrix-chat-session-id", apiData.sessionId);
          }
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
        clearTimeout(abortTimer);
        // Fallback gracefully to instant local engine
      }

      // Instant Local Fallback if network takes >3000ms or fails
      const { nextState, messages: newMsgs } = handleUserAction(
        actionValue,
        userLabel,
        engineState,
        launchConfig,
        timeLeft
      );
      setEngineState(nextState);
      setMessages((prev) => [
        ...prev.filter((m) => m.id !== typingId),
        ...newMsgs,
      ]);
      setIsTyping(false);
    },
    [engineState, currency, symbol, rate, locale, detectedCountry, activeMode, launchConfig, timeLeft]
  );

  const handleSelectEntryPoint = (entry: EntryPoint) => {
    setShowQuickMenu(false);
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
    const init = [createInitialMessage(activeMode, launchConfig, timeLeft)];
    setMessages(init);
    try {
      localStorage.removeItem("vrix-chat-history-v2");
      localStorage.removeItem("vrix-chat-engine-state-v2");
      localStorage.removeItem("vrix-chat-session-id");
    } catch (e) {}
  };

  if (!mounted) return null;

  return (
    <>
      {/* Closed State: Floating Circular FAB with restrained luxury glint animation */}
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
          <ChatHeader onClose={() => setIsOpen(false)} onReset={handleReset} mode={activeMode} />

          {showQuickMenu && (
            <QuickActionsMenu
              entryPoints={currentEntryPoints}
              onSelect={handleSelectEntryPoint}
            />
          )}

          <MessageList messages={messages} onOptionSelect={handleOptionSelect} />

          <ChatComposer onSend={handleSendText} disabled={isTyping} mode={activeMode} />
        </div>
      )}
    </>
  );
}
