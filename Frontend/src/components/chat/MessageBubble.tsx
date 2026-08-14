"use client";

import React, { useState } from "react";
import { ChatMessage, QuickOption } from "./vrix-chat-types";
import ProductCardItem from "./ProductCardItem";
import ProductComparisonView from "./ProductComparisonView";
import HumanHandoffCard from "./HumanHandoffCard";
import BespokeEstimateCard from "./BespokeEstimateCard";
import QuickReplyChips from "./QuickReplyChips";

interface MessageBubbleProps {
  message: ChatMessage;
  onOptionSelect: (option: QuickOption) => void;
}

function formatLocalTime(isoString?: string): string {
  if (!isoString) return "";
  try {
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return isoString;
    return new Intl.DateTimeFormat("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    }).format(date);
  } catch (e) {
    return isoString || "";
  }
}

export default function MessageBubble({ message, onOptionSelect }: MessageBubbleProps) {
  const isBot = message.sender === "bot";
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (!message.text) return;
    navigator.clipboard.writeText(message.text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (message.isTyping) {
    return (
      <div className="flex justify-start my-2 animate-fade-in-slide">
        <div className="bg-surface-container-low text-on-surface-variant px-4 py-3 rounded-xs flex items-center gap-1.5 shadow-xs border border-outline-variant/20">
          <span className="w-1.5 h-1.5 bg-primary/70 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
          <span className="w-1.5 h-1.5 bg-primary/70 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
          <span className="w-1.5 h-1.5 bg-primary/70 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
        </div>
      </div>
    );
  }

  return (
    <div className={`flex flex-col my-2 animate-fade-in-slide ${isBot ? "items-start" : "items-end"}`}>
      <div
        className={`group relative max-w-[88%] px-4 py-3 rounded-xs font-jost text-body-md text-sm leading-relaxed shadow-xs transition-all ${
          isBot
            ? "bg-surface-container-low text-on-surface border border-outline-variant/30 hover:border-outline-variant/60"
            : "bg-secondary-container text-on-secondary-container font-medium"
        }`}
      >
        {message.text && (
          <div className="relative">
            <p className="whitespace-pre-line pr-4">{message.text}</p>
            {isBot && (
              <button
                type="button"
                onClick={handleCopy}
                title="Copy message"
                className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 text-on-surface-variant hover:text-primary transition-opacity p-0.5 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[13px]">
                  {copied ? "check" : "content_copy"}
                </span>
              </button>
            )}
          </div>
        )}

        {message.products && message.products.length > 0 && (
          <div className="flex gap-3 overflow-x-auto py-2.5 hide-scrollbar w-full">
            {message.products.map((prod) => (
              <ProductCardItem key={prod.id} product={prod} />
            ))}
          </div>
        )}

        {message.comparison && <ProductComparisonView data={message.comparison} />}

        {message.handoff && <HumanHandoffCard data={message.handoff} />}

        {message.bespokeEstimate && <BespokeEstimateCard data={message.bespokeEstimate} />}

        {message.options && <QuickReplyChips options={message.options} onSelect={onOptionSelect} />}
      </div>

      <div className="flex items-center gap-1.5 mt-1 px-1">
        <span className="font-label-caps text-[9px] text-on-surface-variant">
          {formatLocalTime(message.timestamp)}
        </span>
        {copied && (
          <span className="font-label-caps text-[9px] text-primary transition-all animate-fade-in-slide">
            Copied
          </span>
        )}
      </div>
    </div>
  );
}
