"use client";

import React, { useState, useRef, useEffect } from "react";
import { useCurrency } from "@/context/CurrencyContext";

const COUNTRY_FLAGS: Record<string, string> = {
  IN: "🇮🇳",
  GB: "🇬🇧",
  DE: "🇩🇪",
  FR: "🇫🇷",
  US: "🇺🇸",
  CA: "🇨🇦",
  AU: "🇦🇺",
  SG: "🇸🇬",
  EU: "🇪🇺",
};

export default function CurrencySelector({ className = "" }: { className?: string }) {
  const { currency, symbol, supportedCurrencies, setCurrency, detectedCountry, isAutoDetected } = useCurrency();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const flag = COUNTRY_FLAGS[detectedCountry] || "🌐";

  return (
    <div className={`relative inline-block ${className}`} ref={menuRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-2 py-1 text-[11px] font-label-caps uppercase tracking-wider text-slate-grey hover:text-ink-black border border-transparent hover:border-slate-grey/20 rounded transition-colors cursor-pointer"
        title={isAutoDetected ? `Auto-detected location (${detectedCountry})` : "Currency selector"}
      >
        <span>{flag}</span>
        <span className="font-semibold text-deep-navy">{currency} ({symbol})</span>
        <span className="material-symbols-outlined text-[14px] transition-transform" style={{ transform: isOpen ? "rotate(180deg)" : "rotate(0)" }}>
          expand_more
        </span>
      </button>

      {isOpen && (
        <div className="absolute right-0 bottom-full mb-1 w-44 bg-pure-white border border-slate-grey/20 shadow-xl z-50 py-1 rounded-sm animate-fade-in">
          <div className="px-3 py-1.5 border-b border-slate-grey/10 text-[9px] font-label-caps uppercase text-slate-grey tracking-widest flex items-center justify-between">
            <span>Select Currency</span>
            {isAutoDetected && <span className="text-emerald-600">Auto IP</span>}
          </div>
          {supportedCurrencies.map((c) => {
            const cFlag = COUNTRY_FLAGS[c.countries?.[0]] || "🌐";
            const isSelected = c.code === currency;
            return (
              <button
                key={c.code}
                type="button"
                onClick={() => {
                  setCurrency(c.code);
                  setIsOpen(false);
                }}
                className={`w-full text-left px-3 py-2 text-xs font-body-md flex items-center justify-between hover:bg-soft-linen/50 transition-colors cursor-pointer ${
                  isSelected ? "bg-soft-linen text-deep-navy font-semibold" : "text-slate-grey"
                }`}
              >
                <div className="flex items-center gap-2">
                  <span>{cFlag}</span>
                  <span>{c.code} ({c.symbol})</span>
                </div>
                {isSelected && <span className="material-symbols-outlined text-[14px] text-deep-navy">check</span>}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
