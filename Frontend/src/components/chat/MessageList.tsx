"use client";

import React, { useEffect, useRef } from "react";
import { ChatMessage, QuickOption } from "./vrix-chat-types";
import MessageBubble from "./MessageBubble";

interface MessageListProps {
  messages: ChatMessage[];
  onOptionSelect: (option: QuickOption) => void;
}

export default function MessageList({ messages, onOptionSelect }: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div
      aria-live="polite"
      className="flex-1 overflow-y-auto p-4 space-y-2 hide-scrollbar bg-surface"
    >
      {messages.map((msg) => (
        <MessageBubble key={msg.id} message={msg} onOptionSelect={onOptionSelect} />
      ))}
      <div ref={bottomRef} />
    </div>
  );
}
