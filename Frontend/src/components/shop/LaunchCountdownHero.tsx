"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { useLaunchCountdown } from "@/context/LaunchCountdownContext";
import { getApiBaseUrl } from "@/utils/api";

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isExpired: boolean;
}

export default function LaunchCountdownHero() {
  const { config, isPreLaunch } = useLaunchCountdown();
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    isExpired: false,
  });

  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const [savedEmail, setSavedEmail] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Multi-image slides array: support config.bgImages, fallback to [config.bgImage]
  const slides = useMemo(() => {
    if (Array.isArray(config.bgImages) && config.bgImages.length > 0) {
      const valid = config.bgImages.filter((img) => typeof img === "string" && img.trim().length > 0);
      if (valid.length > 0) return valid;
    }
    return [config.bgImage || "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?q=80&w=2000&auto=format&fit=crop"];
  }, [config.bgImages, config.bgImage]);

  const [activeSlide, setActiveSlide] = useState(0);

  // Auto Slider: advance slide every interval (default 4000ms / 4s, matching storefront hero)
  useEffect(() => {
    if (slides.length <= 1) return;
    const intervalTime = Math.max(Number(config.slideInterval) || 4000, 2000);
    const interval = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % slides.length);
    }, intervalTime);
    return () => clearInterval(interval);
  }, [slides.length, config.slideInterval]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("vrix_launch_waitlist_email");
      if (stored) {
        setSavedEmail(stored);
        setSubscribed(true);
      }
    } catch (_) {}
  }, []);

  useEffect(() => {
    const calculateTime = () => {
      const target = new Date(config.targetDate).getTime();
      const now = new Date().getTime();
      const difference = target - now;

      if (isNaN(target) || difference <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0, isExpired: true });
        return;
      }

      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((difference / (1000 * 60)) % 60);
      const seconds = Math.floor((difference / 1000) % 60);

      setTimeLeft({ days, hours, minutes, seconds, isExpired: false });
    };

    calculateTime();
    const interval = setInterval(calculateTime, 1000);
    return () => clearInterval(interval);
  }, [config.targetDate]);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes("@")) {
      setErrorMsg("Please enter a valid email address.");
      return;
    }

    setSubmitting(true);
    setErrorMsg(null);

    try {
      const baseUrl = getApiBaseUrl();
      const res = await fetch(`${baseUrl}/newsletter/subscribe`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: cleanEmail }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || "Subscription failed. Please try again.");
      }

      setSavedEmail(cleanEmail);
      setSuccessMsg(data.message || config.waitlistSuccessMsg || "Thank you. You have been added to our private VIP launch list.");
      setSubscribed(true);
      setEmail("");
      try {
        localStorage.setItem("vrix_launch_waitlist_email", cleanEmail);
      } catch (_) {}
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to submit. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const overlayOpacity = typeof config.bgOverlayOpacity === "number" ? config.bgOverlayOpacity / 100 : 0.45;
  const formatNumber = (num: number) => String(num).padStart(2, "0");

  return (
    <section
      suppressHydrationWarning
      className="relative w-full min-h-[100dvh] min-h-screen flex flex-col justify-between overflow-x-hidden overflow-y-auto bg-[#0A0805] text-white"
    >
      {/* Background Image Carousel (Smooth Hero-style Crossfade Transitions) */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none select-none">
        {slides.map((imgSrc, sIdx) => {
          const isActive = sIdx === activeSlide;
          return (
            <div
              key={`${imgSrc}-${sIdx}`}
              className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
                isActive ? "opacity-100 z-10" : "opacity-0 z-0 pointer-events-none"
              }`}
            >
              <Image
                src={imgSrc}
                alt={config.title ? `${config.title} Background ${sIdx + 1}` : `VRIX Jewellery Launch ${sIdx + 1}`}
                fill
                priority={sIdx === 0}
                fetchPriority={sIdx === 0 ? "high" : "low"}
                quality={80}
                sizes="100vw"
                unoptimized={imgSrc?.startsWith("http://localhost") || imgSrc?.startsWith("http://127.0.0.1") || imgSrc?.startsWith("data:")}
                className={`object-cover object-center transform transition-transform duration-10000 ease-out ${
                  isActive ? "scale-105" : "scale-100"
                }`}
              />
            </div>
          );
        })}
        {/* Dark overlay */}
        <div
          className="absolute inset-0 bg-black z-20 pointer-events-none transition-opacity duration-500"
          style={{ opacity: overlayOpacity }}
        />
        {/* Cinematic gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/75 via-black/35 to-black/85 pointer-events-none z-20" />
        {/* Warm golden tint */}
        <div className="absolute inset-0 bg-gradient-to-br from-amber-900/10 via-transparent to-amber-800/10 pointer-events-none z-20" />
      </div>

      {/* Delicate Golden Orbit & Star Overlay from Reference Image */}
      <div className="absolute inset-0 pointer-events-none z-[5] overflow-hidden flex items-center justify-center">
        <svg
          viewBox="0 0 1200 800"
          className="w-full h-full max-w-5xl lg:max-w-6xl object-contain opacity-25 sm:opacity-35 md:opacity-40"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Sweeping elliptical trajectory arc */}
          <ellipse
            cx="600"
            cy="380"
            rx="460"
            ry="230"
            stroke="url(#goldGradient)"
            strokeWidth="0.8"
            strokeDasharray="4 8"
          />
          {/* Accent arc */}
          <path
            d="M 280 410 C 420 270, 780 250, 940 360"
            stroke="url(#goldGradientBright)"
            strokeWidth="1"
          />
          {/* Sparkle diamond stars */}
          <g transform="translate(860, 290)">
            <path d="M 0 -8 Q 0 0 8 0 Q 0 0 0 8 Q 0 0 -8 0 Q 0 0 0 -8 Z" fill="#FFE8B2" />
          </g>
          <g transform="translate(940, 460)">
            <path d="M 0 -6 Q 0 0 6 0 Q 0 0 0 6 Q 0 0 -6 0 Q 0 0 0 -6 Z" fill="#FFE8B2" opacity="0.8" />
          </g>
          <g transform="translate(330, 330)">
            <path d="M 0 -5 Q 0 0 5 0 Q 0 0 0 5 Q 0 0 -5 0 Q 0 0 0 -5 Z" fill="#FFE8B2" opacity="0.6" />
          </g>
          <defs>
            <linearGradient id="goldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#CBB48C" stopOpacity="0.1" />
              <stop offset="50%" stopColor="#E5D3AE" stopOpacity="0.5" />
              <stop offset="100%" stopColor="#9C7E4F" stopOpacity="0.1" />
            </linearGradient>
            <linearGradient id="goldGradientBright" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#CBB48C" stopOpacity="0" />
              <stop offset="50%" stopColor="#FFE8B2" stopOpacity="0.7" />
              <stop offset="100%" stopColor="#CBB48C" stopOpacity="0" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      {/* Main Content — Perfectly Centered with Dynamic Breathing Room */}
      <div className="relative z-10 flex flex-col items-center justify-center flex-1 w-full max-w-5xl mx-auto px-3.5 sm:px-6 md:px-8 pt-24 sm:pt-28 md:pt-32 pb-4 sm:pb-6 text-center">

        {/* Top Unveiling Banner Badge */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 sm:bg-white/5 border border-white/20 sm:border-white/10 backdrop-blur-xs text-[9px] sm:text-[10px] md:text-[11px] font-inter uppercase tracking-[0.2em] sm:tracking-[0.28em] text-white/80 mb-2.5 sm:mb-4 md:mb-5 select-none font-medium max-w-[92vw] truncate">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-300 animate-pulse inline-block shrink-0" />
          <span className="truncate">{config.badgeText || "THE WORLD OF VRIX — UNVEILING SOON"}</span>
        </div>

        {/* Screen Reader Title for SEO/Accessibility */}
        <h1 className="sr-only">{config.title || "VRIX"}</h1>

        {/* Main Heading — Classical Luxury Serif Matching Reference */}
        <h2
          className="text-xl xs:text-2xl sm:text-3xl lg:text-4xl text-white/95 font-light tracking-[0.14em] sm:tracking-[0.22em] md:tracking-[0.28em] uppercase mb-2 sm:mb-3 leading-snug sm:leading-relaxed max-w-3xl px-2"
          style={{ fontFamily: 'var(--font-aquavit), "Cormorant Garamond", Georgia, serif' }}
        >
          {config.subtitle ? (
            <span>{config.subtitle}</span>
          ) : (
            <>A new form of everyday luxury.</>
          )}
        </h2>

        {/* Editorial Description */}
        <p className="font-jost text-xs sm:text-[13px] md:text-sm text-white/75 sm:text-white/70 max-w-md sm:max-w-lg mb-5 sm:mb-8 md:mb-10 font-light leading-relaxed tracking-normal sm:tracking-wide px-3">
          {config.description || "Jewelry shaped by intention. Defined by detail.\nDiscover a quieter expression of luxury, created for the way you live."}
        </p>

        {/* Countdown Timer or Custom Text Replacement (Only this section toggles when timer is off) */}
        {!timeLeft.isExpired && (config.showTimer !== false || (config.timerCustomText && config.timerCustomText.trim().length > 0)) ? (
          <div suppressHydrationWarning className="relative mb-5 sm:mb-8 md:mb-10 w-full max-w-2xl mx-auto px-1 sm:px-2">
            {/* Celestial Orbit Arc around the countdown / text (Visible on mobile & desktop) */}
            <div className="absolute -inset-x-2 -inset-y-3 sm:-inset-x-8 sm:-inset-y-6 pointer-events-none block">
              <svg viewBox="0 0 900 240" fill="none" className="w-full h-full opacity-45 sm:opacity-60">
                <path
                  d="M 120 180 C 260 50, 680 40, 840 130"
                  stroke="url(#orbitGold)"
                  strokeWidth="0.85"
                />
                {/* Sparkle star at top right of arc */}
                <g transform="translate(735, 68)">
                  <path d="M 0 -7 Q 0 0 7 0 Q 0 0 0 7 Q 0 0 -7 0 Q 0 0 0 -7 Z" fill="#FFE8B2" />
                </g>
                {/* Golden bead dot at bottom right */}
                <circle cx="838" cy="130" r="3.5" fill="#E5D3AE" opacity="0.85" />
                <defs>
                  <linearGradient id="orbitGold" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#CBB48C" stopOpacity="0" />
                    <stop offset="60%" stopColor="#FFE8B2" stopOpacity="0.7" />
                    <stop offset="100%" stopColor="#CBB48C" stopOpacity="0.2" />
                  </linearGradient>
                </defs>
              </svg>
            </div>

            {config.showTimer !== false ? (
              /* Countdown Display Units — Clean, Open & Borderless Matching PC View */
              <div className="relative z-10 flex items-center justify-center gap-1.5 xs:gap-2 sm:gap-3 md:gap-5 lg:gap-7 py-1 sm:py-0 select-none">
                {/* DAYS */}
                <div className="flex flex-col items-center min-w-[50px] xs:min-w-[58px] sm:min-w-[76px] md:min-w-[96px] lg:min-w-[110px]">
                  <span
                    suppressHydrationWarning
                    className="text-3xl xs:text-4xl sm:text-6xl md:text-7xl lg:text-8xl xl:text-9xl font-light text-[#FDFCF7] tabular-nums tracking-tight leading-none drop-shadow-[0_2px_12px_rgba(255,232,178,0.25)]"
                    style={{ fontFamily: 'var(--font-aquavit), "Cormorant Garamond", Georgia, serif' }}
                  >
                    {formatNumber(timeLeft.days)}
                  </span>
                  <span className="font-inter font-primary text-[8px] xs:text-[9px] sm:text-[10px] md:text-[11px] tracking-[0.2em] sm:tracking-[0.32em] uppercase text-white/60 mt-1.5 sm:mt-2.5 font-medium">
                    Days
                  </span>
                </div>

                {/* Separator Hairline + ✦ Star */}
                <div className="flex flex-col items-center justify-center self-stretch px-0.5 sm:px-1.5 md:px-2.5 opacity-75">
                  <div className="w-[1px] h-2 xs:h-2.5 sm:h-4 md:h-6 bg-gradient-to-b from-transparent via-white/30 to-white/15" />
                  <span className="text-amber-200 text-[9px] xs:text-[10px] sm:text-xs md:text-sm my-0.5 select-none drop-shadow-[0_0_6px_rgba(255,232,178,0.7)]">✦</span>
                  <div className="w-[1px] h-2 xs:h-2.5 sm:h-4 md:h-6 bg-gradient-to-b from-white/15 via-white/30 to-transparent" />
                </div>

                {/* HOURS */}
                <div className="flex flex-col items-center min-w-[50px] xs:min-w-[58px] sm:min-w-[76px] md:min-w-[96px] lg:min-w-[110px]">
                  <span
                    suppressHydrationWarning
                    className="text-3xl xs:text-4xl sm:text-6xl md:text-7xl lg:text-8xl xl:text-9xl font-light text-[#FDFCF7] tabular-nums tracking-tight leading-none drop-shadow-[0_2px_12px_rgba(255,232,178,0.25)]"
                    style={{ fontFamily: 'var(--font-aquavit), "Cormorant Garamond", Georgia, serif' }}
                  >
                    {formatNumber(timeLeft.hours)}
                  </span>
                  <span className="font-inter font-primary text-[8px] xs:text-[9px] sm:text-[10px] md:text-[11px] tracking-[0.2em] sm:tracking-[0.32em] uppercase text-white/60 mt-1.5 sm:mt-2.5 font-medium">
                    Hours
                  </span>
                </div>

                {/* Separator Hairline + ✦ Star */}
                <div className="flex flex-col items-center justify-center self-stretch px-0.5 sm:px-1.5 md:px-2.5 opacity-75">
                  <div className="w-[1px] h-2 xs:h-2.5 sm:h-4 md:h-6 bg-gradient-to-b from-transparent via-white/30 to-white/15" />
                  <span className="text-amber-200 text-[9px] xs:text-[10px] sm:text-xs md:text-sm my-0.5 select-none drop-shadow-[0_0_6px_rgba(255,232,178,0.7)]">✦</span>
                  <div className="w-[1px] h-2 xs:h-2.5 sm:h-4 md:h-6 bg-gradient-to-b from-white/15 via-white/30 to-transparent" />
                </div>

                {/* MINUTES */}
                <div className="flex flex-col items-center min-w-[50px] xs:min-w-[58px] sm:min-w-[76px] md:min-w-[96px] lg:min-w-[110px]">
                  <span
                    suppressHydrationWarning
                    className="text-3xl xs:text-4xl sm:text-6xl md:text-7xl lg:text-8xl xl:text-9xl font-light text-[#FDFCF7] tabular-nums tracking-tight leading-none drop-shadow-[0_2px_12px_rgba(255,232,178,0.25)]"
                    style={{ fontFamily: 'var(--font-aquavit), "Cormorant Garamond", Georgia, serif' }}
                  >
                    {formatNumber(timeLeft.minutes)}
                  </span>
                  <span className="font-inter font-primary text-[8px] xs:text-[9px] sm:text-[10px] md:text-[11px] tracking-[0.2em] sm:tracking-[0.32em] uppercase text-white/60 mt-1.5 sm:mt-2.5 font-medium">
                    Minutes
                  </span>
                </div>

                {/* Separator Hairline + ✦ Star */}
                <div className="flex flex-col items-center justify-center self-stretch px-0.5 sm:px-1.5 md:px-2.5 opacity-75">
                  <div className="w-[1px] h-2 xs:h-2.5 sm:h-4 md:h-6 bg-gradient-to-b from-transparent via-white/30 to-white/15" />
                  <span className="text-amber-200 text-[9px] xs:text-[10px] sm:text-xs md:text-sm my-0.5 select-none drop-shadow-[0_0_6px_rgba(255,232,178,0.7)]">✦</span>
                  <div className="w-[1px] h-2 xs:h-2.5 sm:h-4 md:h-6 bg-gradient-to-b from-white/15 via-white/30 to-transparent" />
                </div>

                {/* SECONDS */}
                <div className="flex flex-col items-center min-w-[50px] xs:min-w-[58px] sm:min-w-[76px] md:min-w-[96px] lg:min-w-[110px]">
                  <span
                    suppressHydrationWarning
                    className="text-3xl xs:text-4xl sm:text-6xl md:text-7xl lg:text-8xl xl:text-9xl font-light text-[#FDFCF7] tabular-nums tracking-tight leading-none drop-shadow-[0_2px_12px_rgba(255,232,178,0.25)]"
                    style={{ fontFamily: 'var(--font-aquavit), "Cormorant Garamond", Georgia, serif' }}
                  >
                    {formatNumber(timeLeft.seconds)}
                  </span>
                  <span className="font-inter font-primary text-[8px] xs:text-[9px] sm:text-[10px] md:text-[11px] tracking-[0.2em] sm:tracking-[0.32em] uppercase text-white/60 mt-1.5 sm:mt-2.5 font-medium">
                    Seconds
                  </span>
                </div>
              </div>
            ) : (
              /* Custom Text in place of Timer */
              <div className="relative z-10 flex flex-col items-center justify-center py-2 sm:py-3 select-none">
                <span
                  className="text-2xl xs:text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-light text-[#FDFCF7] tracking-[0.16em] sm:tracking-[0.22em] uppercase leading-tight drop-shadow-[0_2px_14px_rgba(255,232,178,0.3)] text-center px-4"
                  style={{ fontFamily: 'var(--font-aquavit), "Cormorant Garamond", Georgia, serif' }}
                >
                  {config.timerCustomText}
                </span>
              </div>
            )}
          </div>
        ) : timeLeft.isExpired ? (
          <div className="mb-6 py-3 px-6 sm:px-8 border border-amber-300/30 bg-amber-400/5 backdrop-blur-sm text-amber-200/90 rounded-xs">
            <p className="font-inter text-xs sm:text-sm tracking-[0.22em] sm:tracking-[0.25em] uppercase font-medium">
              ✦ We are live — Welcome to the atelier ✦
            </p>
          </div>
        ) : null}

        {/* VIP Early Access / Waitlist Box — Fully Styled & Selectable on Mobile */}
        {config.enableWaitlist && (
          <div className="w-full max-w-sm sm:max-w-md mx-auto mb-4 sm:mb-6 px-2 sm:px-0">
            {subscribed ? (
              <div className="py-3 px-4 text-center bg-white/[0.08] border border-white/20 backdrop-blur-md rounded-xs shadow-lg">
                <div className="flex items-center justify-center gap-2 mb-1.5">
                  <svg className="w-3.5 h-3.5 text-amber-200/90 shrink-0" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z" />
                  </svg>
                  <p
                    className="text-xs sm:text-sm tracking-[0.22em] uppercase text-white/95 font-light"
                    style={{ fontFamily: 'var(--font-aquavit), "Cormorant Garamond", Georgia, serif' }}
                  >
                    You&apos;re on the list.
                  </p>
                </div>
                <p className="font-jost text-[11px] sm:text-xs text-white/70 leading-relaxed max-w-xs sm:max-w-sm mx-auto">
                  {successMsg || config.waitlistSuccessMsg || "Early access. First collection previews. A closer look at the world of VRIX."}
                </p>
                {savedEmail && (
                  <p className="font-jost text-[10px] sm:text-[11px] text-white/60 mt-1.5">
                    Registered: <span className="text-amber-200/90 font-medium break-all">{savedEmail}</span>
                  </p>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setSubscribed(false);
                    setSuccessMsg(null);
                    setEmail("");
                  }}
                  className="mt-2 text-[9px] sm:text-[10px] text-white/50 hover:text-white underline underline-offset-4 tracking-[0.2em] uppercase font-inter cursor-pointer transition-colors block mx-auto"
                >
                  Register another email
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-2.5 sm:gap-2.5 w-full">
                <div className="relative flex-1 w-full">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter email for private launch access..."
                    required
                    style={{
                      WebkitAppearance: "none",
                      MozAppearance: "none",
                      appearance: "none",
                      WebkitUserSelect: "text",
                      userSelect: "text",
                    }}
                    className="w-full h-11 bg-white/10 sm:bg-white/5 border border-white/35 sm:border-white/20 text-white placeholder:text-white/45 px-3.5 sm:px-4 text-[14px] sm:text-xs font-inter tracking-wider rounded-none sm:rounded-xs focus:outline-none focus:border-amber-200/90 focus:ring-1 focus:ring-amber-200/40 focus:bg-white/15 transition-all backdrop-blur-md select-text"
                  />
                </div>
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full sm:w-auto h-11 bg-white text-black hover:bg-white/90 active:scale-[0.98] transition-all px-6 text-xs font-inter tracking-[0.18em] uppercase font-semibold cursor-pointer disabled:opacity-50 shrink-0 flex items-center justify-center gap-1.5 shadow-sm rounded-none sm:rounded-xs"
                >
                  {submitting ? (
                    <>
                      <span className="w-2.5 h-2.5 rounded-full border-2 border-black border-t-transparent animate-spin inline-block" />
                      <span>Joining...</span>
                    </>
                  ) : (
                    "Notify Me"
                  )}
                </button>
              </form>
            )}
            {errorMsg && (
              <p className="text-[10px] sm:text-[11px] text-red-300 mt-2 font-jost text-center bg-red-950/60 py-1.5 px-3 border border-red-500/30 max-w-sm mx-auto rounded-none sm:rounded-xs">
                {errorMsg}
              </p>
            )}
          </div>
        )}

        {/* Social Links (Instagram & Facebook Logos Only - Centered & Perfectly Arranged for Phone & PC) */}
        <div className="flex items-center justify-center gap-3 sm:gap-3.5 mb-3 sm:mb-4 select-none z-20">
          <a
            href="https://www.instagram.com/vrix.official"
            target="_blank"
            rel="noopener noreferrer"
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white/10 hover:bg-white/20 border border-white/25 hover:border-amber-200/60 text-white/90 hover:text-amber-200 flex items-center justify-center transition-all duration-300 backdrop-blur-md shadow-xs group cursor-pointer hover:scale-105 active:scale-95"
            aria-label="Follow VRIX on Instagram"
            title="Follow @vrix.official on Instagram"
          >
            <i className="fa-brands fa-instagram text-[16px] sm:text-[18px] transition-transform group-hover:scale-110"></i>
          </a>

          <a
            href="https://www.facebook.com/profile.php?id=61588375466280"
            target="_blank"
            rel="noopener noreferrer"
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white/10 hover:bg-white/20 border border-white/25 hover:border-amber-200/60 text-white/90 hover:text-amber-200 flex items-center justify-center transition-all duration-300 backdrop-blur-md shadow-xs group cursor-pointer hover:scale-105 active:scale-95"
            aria-label="Follow VRIX on Facebook"
            title="Follow VRIX on Facebook"
          >
            <i className="fa-brands fa-facebook-f text-[14px] sm:text-[16px] transition-transform group-hover:scale-110"></i>
          </a>
        </div>

        {/* Slide Indicator Dots (When multiple background images are configured) */}
        {slides.length > 1 && (
          <div className="flex items-center justify-center gap-2 mb-2.5 sm:mb-4 select-none z-30">
            {slides.map((_, sIdx) => (
              <button
                key={sIdx}
                type="button"
                onClick={() => setActiveSlide(sIdx)}
                className={`h-1 sm:h-1.5 transition-all duration-300 rounded-full cursor-pointer ${
                  sIdx === activeSlide
                    ? "w-6 sm:w-7 bg-amber-200 shadow-[0_0_8px_rgba(253,230,138,0.7)]"
                    : "w-1.5 sm:w-2 bg-white/40 hover:bg-white/80"
                }`}
                aria-label={`Go to slide ${sIdx + 1}`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Bottom Pillars Section — Set in ONE Single Row on Phone & Desktop */}
      <div className="relative z-10 w-full border-t border-white/10 bg-black/55 backdrop-blur-md pb-[env(safe-area-inset-bottom,0px)]">
        <div className="max-w-5xl mx-auto px-1.5 xs:px-3 sm:px-6 md:px-8 py-2 xs:py-2.5 sm:py-3.5 md:py-4">
          <div className="grid grid-cols-4 divide-x divide-white/10">
            {/* Pillar 1 */}
            <div className="flex flex-col items-center text-center group px-1 sm:px-2 md:px-4">
              <span className="material-symbols-outlined text-white/90 group-hover:text-amber-200 transition-colors mb-0.5 sm:mb-1 text-base xs:text-lg sm:text-2xl font-light">
                flare
              </span>
              <h4 className="font-inter font-primary text-[8px] xs:text-[9.5px] sm:text-[11px] text-white uppercase mb-0.5 font-semibold tracking-tight sm:tracking-wider leading-tight">
                Intentional Design
              </h4>
              <p className="font-jost font-secondary text-[7px] xs:text-[8px] sm:text-[10px] text-white/70 whitespace-pre-line leading-tight">
                {"Every piece has\na deeper meaning."}
              </p>
            </div>

            {/* Pillar 2 */}
            <div className="flex flex-col items-center text-center group px-1 sm:px-2 md:px-4">
              <span className="material-symbols-outlined text-white/90 group-hover:text-amber-200 transition-colors mb-0.5 sm:mb-1 text-base xs:text-lg sm:text-2xl font-light">
                hourglass_empty
              </span>
              <h4 className="font-inter font-primary text-[8px] xs:text-[9.5px] sm:text-[11px] text-white uppercase mb-0.5 font-semibold tracking-tight sm:tracking-wider leading-tight">
                Timeless Quality
              </h4>
              <p className="font-jost font-secondary text-[7px] xs:text-[8px] sm:text-[10px] text-white/70 whitespace-pre-line leading-tight">
                {"Crafted to last.\nMade to be lived in."}
              </p>
            </div>

            {/* Pillar 3 */}
            <div className="flex flex-col items-center text-center group px-1 sm:px-2 md:px-4">
              <span className="material-symbols-outlined text-white/90 group-hover:text-amber-200 transition-colors mb-0.5 sm:mb-1 text-base xs:text-lg sm:text-2xl font-light">
                eco
              </span>
              <h4 className="font-inter font-primary text-[8px] xs:text-[9.5px] sm:text-[11px] text-white uppercase mb-0.5 font-semibold tracking-tight sm:tracking-wider leading-tight">
                Conscious Luxury
              </h4>
              <p className="font-jost font-secondary text-[7px] xs:text-[8px] sm:text-[10px] text-white/70 whitespace-pre-line leading-tight">
                {"Ethical materials.\nThoughtful process."}
              </p>
            </div>

            {/* Pillar 4 */}
            <div className="flex flex-col items-center text-center group px-1 sm:px-2 md:px-4">
              <span className="material-symbols-outlined text-white/90 group-hover:text-amber-200 transition-colors mb-0.5 sm:mb-1 text-base xs:text-lg sm:text-2xl font-light">
                favorite_border
              </span>
              <h4 className="font-inter font-primary text-[8px] xs:text-[9.5px] sm:text-[11px] text-white uppercase mb-0.5 font-semibold tracking-tight sm:tracking-wider leading-tight">
                Personal Connection
              </h4>
              <p className="font-jost font-secondary text-[7px] xs:text-[8px] sm:text-[10px] text-white/70 whitespace-pre-line leading-tight">
                {"A piece for every\nchapter of you."}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
