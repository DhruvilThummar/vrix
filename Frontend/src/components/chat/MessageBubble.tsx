"use client";

import React from "react";
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

export default function MessageBubble({ message, onOptionSelect }: MessageBubbleProps) {
  const isBot = message.sender === "bot";

  if (message.isTyping) {
    return (
      <div className="flex justify-start my-2 animate-fade-in-slide">
        <div className="bg-surface-container-low text-on-surface-variant px-4 py-3 rounded-sm flex items-center gap-1.5 shadow-xs">
          <span className="w-1.5 h-1.5 bg-on-surface-variant rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
          <span className="w-1.5 h-1.5 bg-on-surface-variant rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
          <span className="w-1.5 h-1.5 bg-on-surface-variant rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
        </div>
      </div>
    );
  }

  return (
    <div className={`flex flex-col my-2 animate-fade-in-slide ${isBot ? "items-start" : "items-end"}`}>
      <div
        className={`max-w-[85%] px-4 py-3 rounded-sm font-jost text-body-md text-sm leading-relaxed shadow-xs ${
          isBot
            ? "bg-surface-container-low text-on-surface border border-outline-variant/30"
            : "bg-secondary-container text-on-secondary-container font-medium"
        }`}
      >
        {message.text && <p className="whitespace-pre-line">{message.text}</p>}

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
      <span className="font-label-caps text-[9px] text-on-surface-variant mt-1 px-1">
        {message.timestamp}
      </span>
    </div>
  );
}
