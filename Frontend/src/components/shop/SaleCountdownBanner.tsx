"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useLaunchCountdown } from "@/context/LaunchCountdownContext";

function formatNumber(num: number): string {
  return String(num).padStart(2, "0");
}

export default function SaleCountdownBanner() {
  const { config, timeLeft, isSaleCountdown } = useLaunchCountdown();
  const [copied, setCopied] = useState(false);

  if (!isSaleCountdown) return null;

  const discountCode = config.saleDiscountCode || "VRIX15";
  const displayType = config.saleDisplayType || "HERO";
  const bgImage =
    config.saleBgImage ||
    config.bgImage ||
    "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?q=80&w=2000&auto=format&fit=crop";
  const overlayOpacity =
    typeof config.saleBgOverlayOpacity === "number"
      ? config.saleBgOverlayOpacity / 100
      : 0.55;

  const handleCopyCode = (e: React.MouseEvent) => {
    e.preventDefault();
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(discountCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2800);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // 1. FULL LUXURY HERO SHOWCASE (When displayType is HERO or BOTH)
  // ─────────────────────────────────────────────────────────────────────────────
  if (displayType === "HERO" || displayType === "BOTH") {
    return (
      <section className="relative w-full min-h-[92vh] md:min-h-screen flex items-center justify-center overflow-hidden bg-[#07090E] text-pure-white px-5 sm:px-8 pt-20 sm:pt-24 md:pt-28 pb-12 md:pb-16">
        {/* Background Photo with Cinematic Luxury Vignette */}
        <div className="absolute inset-0 z-0">
          <Image
            src={bgImage}
            alt={config.saleTitle || "VRIX Sale Event"}
            fill
            priority
            sizes="100vw"
            className="object-cover object-center scale-105"
          />
          <div
            className="absolute inset-0 bg-black"
            style={{ opacity: overlayOpacity }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/70 pointer-events-none" />
        </div>

        {/* Hero Content Container */}
        <div className="relative z-10 max-w-3xl mx-auto text-center flex flex-col items-center">


          {/* Official VRIX Logo */}
          <div className="relative w-36 sm:w-44 md:w-52 h-12 sm:h-14 md:h-16 mb-5 select-none drop-shadow-lg">
            <Image
              src="/logos/white.png"
              alt="VRIX"
              fill
              priority
              className="object-contain"
              sizes="(max-width: 640px) 180px, 300px"
            />
          </div>

          {/* Main Sale Headline */}
          <h1 className="font-inter font-primary text-2xl sm:text-4xl md:text-5xl tracking-[0.12em] sm:tracking-[0.18em] uppercase text-white font-light mb-4 select-none drop-shadow-md">
            {config.saleTitle || "THE SOLITAIRE SALE"}
          </h1>

          {/* Subtitle / Description */}
          <p className="font-jost font-secondary text-xs sm:text-sm md:text-base text-white/85 font-light tracking-[0.04em] mb-2 max-w-xl drop-shadow">
            {config.saleSubtitle || (
              <>
                Limited allocation of fine lab-grown diamonds with{" "}
                <span className="font-chancery italic text-amber-200 text-xl sm:text-2xl">
                  architectural form
                </span>
                .
              </>
            )}
          </p>

          {config.saleDescription && (
            <p className="font-jost font-secondary text-[11px] sm:text-xs text-white/60 max-w-md mb-5 leading-relaxed">
              {config.saleDescription}
            </p>
          )}

          {/* One-Click Copy Coupon Code Pill */}
          {discountCode && (
            <div className="mb-6 flex items-center justify-center">
              <button
                type="button"
                onClick={handleCopyCode}
                className="group relative inline-flex items-center gap-2.5 px-4 py-2 rounded-full border border-dashed border-amber-300/60 bg-black/40 hover:bg-black/60 backdrop-blur-md transition-all duration-300 hover:border-amber-300 cursor-pointer shadow-lg active:scale-95"
                title="Click to copy promo code"
              >
                <span className="material-symbols-outlined text-amber-300 text-sm">
                  confirmation_number
                </span>
                <span className="text-xs font-inter font-primary uppercase tracking-[0.2em] text-white/80">
                  CODE:{" "}
                  <strong className="text-amber-200 font-bold tracking-widest">
                    {discountCode}
                  </strong>
                </span>
                <span className="text-[10px] font-inter uppercase tracking-wider px-2 py-0.5 rounded bg-white/15 text-white/90 group-hover:bg-amber-300 group-hover:text-ink-black transition-colors">
                  {copied ? "COPIED! ✓" : "TAP TO COPY"}
                </span>
              </button>
            </div>
          )}

          {/* Architectural Luxury Countdown Blocks */}
          <div suppressHydrationWarning className="w-full max-w-xl mx-auto mb-6 sm:mb-8">
            <div className="grid grid-cols-4 gap-2 sm:gap-3 md:gap-4">
              {/* DAYS */}
              <div className="flex flex-col items-center justify-center p-2.5 sm:p-4 rounded-xs border border-white/20 bg-white/10 backdrop-blur-md shadow-2xl transition-transform duration-300 hover:border-amber-300/40">
                <span
                  suppressHydrationWarning
                  className="font-inter font-primary text-2xl sm:text-3xl md:text-4xl font-light text-white tracking-tight tabular-nums"
                >
                  {formatNumber(timeLeft.days)}
                </span>
                <span className="font-inter font-primary text-[8px] sm:text-[10px] tracking-[0.25em] uppercase text-white/60 mt-1.5 font-medium">
                  Days
                </span>
              </div>

              {/* HOURS */}
              <div className="flex flex-col items-center justify-center p-2.5 sm:p-4 rounded-xs border border-white/20 bg-white/10 backdrop-blur-md shadow-2xl transition-transform duration-300 hover:border-amber-300/40">
                <span
                  suppressHydrationWarning
                  className="font-inter font-primary text-2xl sm:text-3xl md:text-4xl font-light text-white tracking-tight tabular-nums"
                >
                  {formatNumber(timeLeft.hours)}
                </span>
                <span className="font-inter font-primary text-[8px] sm:text-[10px] tracking-[0.25em] uppercase text-white/60 mt-1.5 font-medium">
                  Hours
                </span>
              </div>

              {/* MINUTES */}
              <div className="flex flex-col items-center justify-center p-2.5 sm:p-4 rounded-xs border border-white/20 bg-white/10 backdrop-blur-md shadow-2xl transition-transform duration-300 hover:border-amber-300/40">
                <span
                  suppressHydrationWarning
                  className="font-inter font-primary text-2xl sm:text-3xl md:text-4xl font-light text-white tracking-tight tabular-nums"
                >
                  {formatNumber(timeLeft.minutes)}
                </span>
                <span className="font-inter font-primary text-[8px] sm:text-[10px] tracking-[0.25em] uppercase text-white/60 mt-1.5 font-medium">
                  Minutes
                </span>
              </div>

              {/* SECONDS */}
              <div className="flex flex-col items-center justify-center p-2.5 sm:p-4 rounded-xs border border-white/20 bg-white/10 backdrop-blur-md shadow-2xl transition-transform duration-300 hover:border-amber-300/40">
                <span
                  suppressHydrationWarning
                  className="font-inter font-primary text-2xl sm:text-3xl md:text-4xl font-light text-amber-200 tracking-tight tabular-nums"
                >
                  {formatNumber(timeLeft.seconds)}
                </span>
                <span className="font-inter font-primary text-[8px] sm:text-[10px] tracking-[0.25em] uppercase text-white/60 mt-1.5 font-medium">
                  Seconds
                </span>
              </div>
            </div>
          </div>

          {/* Dual Action CTAs */}
          <div className="flex flex-wrap items-center justify-center gap-3 mb-8">
            <Link
              href={config.saleCtaUrl || "/collections"}
              className="inline-flex items-center gap-2 px-6 py-3 bg-pure-white hover:bg-white/90 text-ink-black text-[11px] font-inter font-primary tracking-[0.18em] uppercase font-semibold transition-all duration-300 rounded-xs cursor-pointer shadow-lg hover:shadow-2xl active:scale-95"
            >
              <span>{config.saleCtaText || "Shop The Sale"}</span>
              <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </Link>

            <Link
              href={config.saleSecondaryCtaUrl || "/products"}
              className="inline-flex items-center gap-2 px-6 py-3 border border-white/60 hover:border-white hover:bg-white/10 text-white text-[11px] font-inter font-primary tracking-[0.18em] uppercase font-medium transition-all duration-300 rounded-xs cursor-pointer shadow-md"
            >
              <span>{config.saleSecondaryCtaText || "Explore All Pieces"}</span>
            </Link>
          </div>

          {/* Understated Luxury Trust Indicators */}
          <div className="pt-5 border-t border-white/10 w-full max-w-xl flex flex-wrap justify-center items-center gap-x-5 gap-y-1.5 text-[9px] sm:text-[10px] tracking-widest text-white/45 uppercase font-jost font-secondary select-none">
            <span>Lab-Grown Solitaires</span>
            <span className="text-white/30">·</span>
            <span>Architectural Minimalism</span>
            <span className="text-white/30">·</span>
            <span>Surat Atelier</span>
            <span className="text-white/30">·</span>
            <span>Complimentary Insured Shipping</span>
          </div>
        </div>
      </section>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // 2. SLIM LUXURY SALE TICKER BAR (When displayType is BAR)
  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <div className="w-full bg-[#0A0D14] text-pure-white border-y border-white/10 py-3 sm:py-3.5 px-4 shadow-xl relative z-20">
      <div className="max-w-container-max mx-auto flex flex-col md:flex-row items-center justify-between gap-3 text-center md:text-left">
        {/* Left: Badge, Title & Promo Code */}
        <div className="flex flex-wrap items-center justify-center md:justify-start gap-2.5 sm:gap-3">
          <span className="px-2.5 py-0.5 rounded-full bg-amber-400 text-ink-black text-[10px] font-inter font-primary font-bold tracking-widest uppercase">
            {config.saleBadgeText || "SALE EVENT"}
          </span>
          <p className="font-inter font-primary text-xs sm:text-sm tracking-wider uppercase font-medium">
            {config.saleTitle || "Limited Time Exclusive Offer"}
            {config.saleDiscountHighlight && (
              <span className="text-amber-200 ml-1.5 font-bold">
                [{config.saleDiscountHighlight}]
              </span>
            )}
          </p>
          {discountCode && (
            <button
              onClick={handleCopyCode}
              type="button"
              className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded border border-amber-300/40 bg-white/5 hover:bg-white/15 text-[10px] font-inter text-amber-200 transition-colors cursor-pointer"
              title="Click to copy code"
            >
              <span>CODE: {discountCode}</span>
              <span className="text-[9px] text-white/70">
                {copied ? "✓ COPIED" : "TAP TO COPY"}
              </span>
            </button>
          )}
        </div>

        {/* Center: Live Countdown Clocks */}
        <div suppressHydrationWarning className="flex items-center gap-2 font-inter font-primary">
          <div className="flex items-center bg-white/10 backdrop-blur-xs px-2.5 py-1 rounded border border-white/15">
            <span suppressHydrationWarning className="text-sm sm:text-base font-semibold tabular-nums text-white">
              {formatNumber(timeLeft.days)}
            </span>
            <span className="text-[9px] uppercase tracking-wider text-white/60 ml-1">d</span>
          </div>
          <span className="text-white/40">:</span>
          <div className="flex items-center bg-white/10 backdrop-blur-xs px-2.5 py-1 rounded border border-white/15">
            <span suppressHydrationWarning className="text-sm sm:text-base font-semibold tabular-nums text-white">
              {formatNumber(timeLeft.hours)}
            </span>
            <span className="text-[9px] uppercase tracking-wider text-white/60 ml-1">h</span>
          </div>
          <span className="text-white/40">:</span>
          <div className="flex items-center bg-white/10 backdrop-blur-xs px-2.5 py-1 rounded border border-white/15">
            <span suppressHydrationWarning className="text-sm sm:text-base font-semibold tabular-nums text-white">
              {formatNumber(timeLeft.minutes)}
            </span>
            <span className="text-[9px] uppercase tracking-wider text-white/60 ml-1">m</span>
          </div>
          <span className="text-white/40">:</span>
          <div className="flex items-center bg-white/10 backdrop-blur-xs px-2.5 py-1 rounded border border-white/15">
            <span suppressHydrationWarning className="text-sm sm:text-base font-semibold tabular-nums text-amber-300">
              {formatNumber(timeLeft.seconds)}
            </span>
            <span className="text-[9px] uppercase tracking-wider text-white/60 ml-1">s</span>
          </div>
        </div>

        {/* Right: CTA Button */}
        <div className="shrink-0">
          <Link
            href={config.saleCtaUrl || "/collections"}
            className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xs bg-pure-white text-ink-black hover:bg-white/90 text-xs font-inter font-primary tracking-widest uppercase font-semibold transition-all shadow-md active:scale-95"
          >
            <span>{config.saleCtaText || "Shop Sale"}</span>
            <span className="material-symbols-outlined text-xs">arrow_forward</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
