"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { ChatMessage, QuickOption } from "./vrix-chat-types";
import MessageBubble from "./MessageBubble";

interface MessageListProps {
  messages: ChatMessage[];
  onOptionSelect: (option: QuickOption) => void;
}

export default function MessageList({ messages, onOptionSelect }: MessageListProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [showScrollBottom, setShowScrollBottom] = useState(false);
  const isNearBottomRef = useRef(true);

  // Monitor scroll offset to decide when to show the "Scroll to Bottom" button
  const handleScroll = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    const distanceToBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    // Considered "near bottom" if within 120px of total height
    const nearBottom = distanceToBottom <= 120;
    isNearBottomRef.current = nearBottom;
    setShowScrollBottom(!nearBottom && el.scrollHeight > el.clientHeight + 100);
  }, []);

  const scrollToBottom = useCallback((smooth = true) => {
    const el = containerRef.current;
    if (!el) return;
    if (smooth) {
      el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
    } else {
      el.scrollTop = el.scrollHeight;
    }
    isNearBottomRef.current = true;
    setShowScrollBottom(false);
  }, []);

  // When messages array updates:
  // Auto-scroll if user is near bottom OR if the latest message was sent by the user
  useEffect(() => {
    const lastMsg = messages[messages.length - 1];
    const isUserMsg = lastMsg?.sender === "user";

    if (isNearBottomRef.current || isUserMsg) {
      // Micro-timeout allows dynamic message layout/images/chips to mount before scrolling
      const timer = setTimeout(() => {
        scrollToBottom(true);
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [messages, scrollToBottom]);

  // Adjust scroll when dynamic content sizes change (images loading, cards expanding)
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    let resizeTimer: NodeJS.Timeout | null = null;
    const observer = new ResizeObserver(() => {
      if (isNearBottomRef.current) {
        if (resizeTimer) clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
          if (el && isNearBottomRef.current) {
            el.scrollTop = el.scrollHeight;
          }
        }, 30);
      }
    });

    observer.observe(el);
    return () => {
      if (resizeTimer) clearTimeout(resizeTimer);
      observer.disconnect();
    };
  }, []);

  return (
    <div className="relative flex-1 min-h-0 flex flex-col overflow-hidden bg-surface">
      <div
        ref={containerRef}
        onScroll={handleScroll}
        aria-live="polite"
        className="flex-1 overflow-y-auto overscroll-contain px-4 py-3 space-y-2.5 vrix-chat-scrollbar scroll-smooth touch-pan-y"
      >
        {messages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} onOptionSelect={onOptionSelect} />
        ))}
      </div>

      {/* Floating Scroll-to-Bottom Pill Indicator */}
      {showScrollBottom && (
        <button
          type="button"
          onClick={() => scrollToBottom(true)}
          aria-label="Scroll to latest messages"
          className="absolute bottom-3 right-4 z-20 flex items-center gap-1.5 px-3 py-1.5 bg-surface-container-high/95 hover:bg-surface-container-highest active:scale-95 backdrop-blur-md border border-primary/30 text-primary text-[11px] font-inter font-medium rounded-full shadow-lg transition-all hover:scale-105 animate-fade-in-slide cursor-pointer"
        >
          <span className="material-symbols-outlined text-[14px]">arrow_downward</span>
          <span>Latest messages</span>
        </button>
      )}
    </div>
  );
}
