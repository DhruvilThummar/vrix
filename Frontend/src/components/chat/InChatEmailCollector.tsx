"use client";

import React, { useState } from "react";
import { EmailCollectorData } from "./vrix-chat-types";
import { getApiBaseUrl } from "@/utils/api";

interface InChatEmailCollectorProps {
  data?: EmailCollectorData;
}

export default function InChatEmailCollector({ data }: InChatEmailCollectorProps) {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes("@") || !cleanEmail.includes(".")) {
      setError("Please enter a valid email address.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const baseUrl = getApiBaseUrl();
      const res = await fetch(`${baseUrl}/newsletter/subscribe`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: cleanEmail }),
      });

      const resData = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(resData.error || "Failed to join VIP waitlist. Please try again.");
      }

      setSubmitted(true);
      try {
        localStorage.setItem("vrix_launch_waitlist_email", cleanEmail);
      } catch (_) {}
    } catch (err: any) {
      setError(err.message || "Failed to submit. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="w-full my-2.5 p-3 bg-emerald-950/40 border border-emerald-500/40 rounded-xs text-xs font-jost text-emerald-200 flex items-start gap-2.5 animate-fade-in-slide">
        <span className="material-symbols-outlined text-emerald-400 text-base shrink-0 mt-0.5">
          check_circle
        </span>
        <div>
          <p className="font-inter text-xs font-semibold text-emerald-300">
            VIP Early Access Confirmed
          </p>
          <p className="text-[11px] text-emerald-200/90 mt-0.5 leading-relaxed">
            {data?.successMessage || "Thank you. Your email is now on our private VIP launch roster. You will receive exclusive early access before the public launch."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full my-2.5 p-3 bg-surface-container-low border border-outline-variant/70 rounded-xs space-y-2 font-jost text-xs">
      <div className="flex items-center gap-1.5 text-on-surface">
        <span className="material-symbols-outlined text-primary text-base">mail</span>
        <span className="font-inter text-xs font-semibold uppercase tracking-wider">
          VIP Launch Waitlist
        </span>
      </div>
      <p className="text-[11px] text-on-surface-variant leading-relaxed">
        Enter your email to receive first access to our inaugural solitaire drop and early atelier unlocks.
      </p>

      <form onSubmit={handleSubmit} className="space-y-1.5 pt-1">
        <div className="flex gap-1.5">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={data?.placeholder || "your.email@example.com"}
            disabled={submitting}
            aria-label="Email address for launch waitlist"
            className="flex-1 px-3 py-1.5 text-xs bg-surface border border-outline-variant rounded-xs focus:border-primary focus:outline-none text-on-surface placeholder:text-on-surface-variant/50 transition-colors"
          />
          <button
            type="submit"
            disabled={submitting}
            className="px-3.5 py-1.5 text-xs bg-primary text-on-primary font-inter font-semibold uppercase tracking-wider rounded-xs hover:bg-primary/90 transition-all cursor-pointer disabled:opacity-60 shrink-0 shadow-xs"
          >
            {submitting ? "Joining..." : data?.buttonText || "Notify Me"}
          </button>
        </div>
        {error && <p className="text-[10px] text-red-400 font-medium pl-0.5">{error}</p>}
      </form>
    </div>
  );
}
