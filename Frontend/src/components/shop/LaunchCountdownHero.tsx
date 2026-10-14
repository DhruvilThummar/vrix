"use client";

import React, { useState, useEffect } from "react";
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

  const bgImage = config.bgImage || "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?q=80&w=2000&auto=format&fit=crop";
  const overlayOpacity = typeof config.bgOverlayOpacity === "number" ? config.bgOverlayOpacity / 100 : 0.45;

  const formatNumber = (num: number) => String(num).padStart(2, "0");

  return (
    <section className="relative w-full min-h-screen flex flex-col justify-between overflow-hidden bg-[#0A0805] text-white">
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <Image
          src={bgImage}
          alt={config.title || "VRIX Jewellery Launch"}
          fill
          priority
          sizes="100vw"
          unoptimized={bgImage?.startsWith("http://localhost") || bgImage?.startsWith("http://127.0.0.1") || bgImage?.startsWith("data:")}
          className="object-cover object-center"
        />
        {/* Dark overlay */}
        <div
          className="absolute inset-0 bg-black"
          style={{ opacity: overlayOpacity }}
        />
        {/* Cinematic gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/30 to-black/75 pointer-events-none" />
        {/* Warm golden tint */}
        <div className="absolute inset-0 bg-gradient-to-br from-amber-900/10 via-transparent to-amber-800/10 pointer-events-none" />
      </div>

      {/* Delicate Golden Orbit & Star Overlay from Reference Image */}
      <div className="absolute inset-0 pointer-events-none z-[5] overflow-hidden flex items-center justify-center">
        <svg
          viewBox="0 0 1200 800"
          className="w-full h-full max-w-6xl object-contain opacity-30 sm:opacity-40"
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

      {/* Main Content */}
      <div className="relative z-10 flex flex-col items-center justify-center flex-1 w-full max-w-5xl mx-auto px-5 sm:px-8 pt-10 sm:pt-14 pb-6 sm:pb-8 text-center">

        {/* Top Unveiling Banner Badge */}
        <div className="text-[10px] sm:text-[11px] font-inter uppercase tracking-[0.3em] text-white/70 mb-4 sm:mb-6 select-none font-medium">
          {config.badgeText || "THE WORLD OF VRIX — UNVEILING SOON"}
        </div>

        {/* Screen Reader Title for SEO/Accessibility */}
        <h1 className="sr-only">{config.title || "VRIX"}</h1>

        {/* Main Heading */}
        <h2 className="font-inter text-[13px] sm:text-base md:text-lg lg:text-xl text-white/95 font-light tracking-[0.2em] sm:tracking-[0.25em] uppercase mb-3 sm:mb-4 leading-relaxed max-w-2xl">
          {config.subtitle ? (
            <span>{config.subtitle}</span>
          ) : (
            <>A new form of everyday luxury.</>
          )}
        </h2>

        {/* Editorial Description */}
        {config.description ? (
          <p className="font-jost text-[11px] sm:text-xs md:text-sm text-white/65 max-w-lg mb-6 md:mb-8 font-light leading-relaxed tracking-wide">
            {config.description}
          </p>
        ) : (
          <p className="font-jost text-[11px] sm:text-xs md:text-sm text-white/65 max-w-lg mb-6 md:mb-8 font-light leading-relaxed tracking-wide">
            Jewelry shaped by intention. Defined by detail.
            <br />
            Discover a quieter expression of luxury, created for the way you live.
          </p>
        )}

        {/* Countdown Timer — Minimal ✦ Star-Separated Style Matching Reference */}
        {!timeLeft.isExpired ? (
          <div suppressHydrationWarning className="mb-6 md:mb-8">
            <div className="flex items-start justify-center gap-3 sm:gap-5 md:gap-8">
              {/* DAYS */}
              <div className="flex flex-col items-center min-w-[50px] sm:min-w-[65px]">
                <span
                  suppressHydrationWarning
                  className="font-inter text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extralight text-white tabular-nums tracking-tight leading-none"
                >
                  {formatNumber(timeLeft.days)}
                </span>
                <span className="font-inter text-[9px] sm:text-[10px] tracking-[0.3em] uppercase text-white/50 mt-2 font-medium">
                  Days
                </span>
              </div>

              {/* Separator ✦ */}
              <div className="flex flex-col items-center pt-3 sm:pt-4 md:pt-6">
                <span className="text-amber-200/60 text-xs sm:text-sm select-none">✦</span>
              </div>

              {/* HOURS */}
              <div className="flex flex-col items-center min-w-[50px] sm:min-w-[65px]">
                <span
                  suppressHydrationWarning
                  className="font-inter text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extralight text-white tabular-nums tracking-tight leading-none"
                >
                  {formatNumber(timeLeft.hours)}
                </span>
                <span className="font-inter text-[9px] sm:text-[10px] tracking-[0.3em] uppercase text-white/50 mt-2 font-medium">
                  Hours
                </span>
              </div>

              {/* Separator ✦ */}
              <div className="flex flex-col items-center pt-3 sm:pt-4 md:pt-6">
                <span className="text-amber-200/60 text-xs sm:text-sm select-none">✦</span>
              </div>

              {/* MINUTES */}
              <div className="flex flex-col items-center min-w-[50px] sm:min-w-[65px]">
                <span
                  suppressHydrationWarning
                  className="font-inter text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extralight text-white tabular-nums tracking-tight leading-none"
                >
                  {formatNumber(timeLeft.minutes)}
                </span>
                <span className="font-inter text-[9px] sm:text-[10px] tracking-[0.3em] uppercase text-white/50 mt-2 font-medium">
                  Minutes
                </span>
              </div>

              {/* Separator ✦ */}
              <div className="flex flex-col items-center pt-3 sm:pt-4 md:pt-6">
                <span className="text-amber-200/60 text-xs sm:text-sm select-none">✦</span>
              </div>

              {/* SECONDS */}
              <div className="flex flex-col items-center min-w-[50px] sm:min-w-[65px]">
                <span
                  suppressHydrationWarning
                  className="font-inter text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extralight text-white tabular-nums tracking-tight leading-none"
                >
                  {formatNumber(timeLeft.seconds)}
                </span>
                <span className="font-inter text-[9px] sm:text-[10px] tracking-[0.3em] uppercase text-white/50 mt-2 font-medium">
                  Seconds
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className="mb-6 py-3 px-8 border border-amber-300/30 bg-amber-400/5 backdrop-blur-sm text-amber-200/90">
            <p className="font-inter text-xs sm:text-sm tracking-[0.25em] uppercase font-medium">
              ✦ We are live — Welcome to the atelier ✦
            </p>
          </div>
        )}

        {/* VIP Early Access / Waitlist Box */}
        {config.enableWaitlist && (
          <div className="w-full max-w-sm mx-auto mb-5 sm:mb-6">
            {subscribed ? (
              <div className="py-4 px-5 text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <span className="text-amber-300 text-sm">✦</span>
                  <p className="font-inter text-[11px] sm:text-xs tracking-[0.2em] uppercase font-semibold text-white/95">
                    You&apos;re on the list.
                  </p>
                </div>
                <p className="font-jost text-[11px] sm:text-xs text-white/60 leading-relaxed">
                  {successMsg || config.waitlistSuccessMsg || "Early access. First collection previews. A closer look at the world of VRIX."}
                </p>
                {savedEmail && (
                  <p className="font-inter text-[10px] text-white/40 mt-2 tracking-wider">
                    Registered: <span className="text-amber-200/80 font-medium">{savedEmail}</span>
                  </p>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setSubscribed(false);
                    setSuccessMsg(null);
                    setEmail("");
                  }}
                  className="mt-3 text-[10px] text-white/40 hover:text-white/70 underline underline-offset-4 tracking-[0.15em] uppercase font-inter cursor-pointer transition-colors"
                >
                  Register another email
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-2.5 w-full">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter email for private launch access..."
                  required
                  className="flex-1 bg-white/5 border border-white/20 text-white placeholder-white/35 px-4 py-2.5 text-xs font-inter tracking-wider focus:outline-none focus:border-white/50 transition-colors backdrop-blur-sm"
                />
                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-white text-black hover:bg-white/90 active:scale-[0.98] transition-all px-5 py-2.5 text-xs font-inter tracking-[0.15em] uppercase font-semibold cursor-pointer disabled:opacity-50 shrink-0 flex items-center justify-center gap-1.5 min-w-[110px]"
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
              <p className="text-[10px] text-red-300 mt-2 font-jost text-center bg-red-950/30 py-1.5 px-3 border border-red-500/20">
                {errorMsg}
              </p>
            )}
          </div>
        )}

        {/* Contact Us Button */}
        <Link
          href={config.contactButtonUrl || "/contact"}
          className="inline-flex items-center gap-2 px-6 py-2 border-b border-white/50 hover:border-white text-white/85 hover:text-white text-[10px] sm:text-[11px] font-inter tracking-[0.25em] uppercase font-medium transition-all duration-300 cursor-pointer mb-5 sm:mb-6"
        >
          <span>{config.contactButtonText || "Contact Us"}</span>
          <span className="text-xs">→</span>
        </Link>
      </div>

      {/* Bottom Pillars Section — User Request 2 + Reference Image Dividers */}
      <div className="relative z-10 w-full border-t border-white/10 bg-black/40 backdrop-blur-md">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 md:px-8 py-5 sm:py-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 md:gap-6 divide-y sm:divide-y-0 md:divide-x divide-white/10">
            {/* Pillar 1 */}
            <div className="flex flex-col items-center text-center group px-2 py-1">
              <span className="material-symbols-outlined text-white/90 group-hover:text-amber-200 transition-colors mb-1 text-2xl font-light">
                flare
              </span>
              <h4 className="font-inter font-primary text-[10px] sm:text-[11px] text-white uppercase mb-0.5 font-semibold tracking-wider">
                Intentional Design
              </h4>
              <p className="font-jost font-secondary text-[10px] sm:text-[11px] text-white/70 whitespace-pre-line leading-tight">
                {"Every piece has\na deeper meaning."}
              </p>
            </div>

            {/* Pillar 2 */}
            <div className="flex flex-col items-center text-center group px-2 py-1">
              <span className="material-symbols-outlined text-white/90 group-hover:text-amber-200 transition-colors mb-1 text-2xl font-light">
                hourglass_empty
              </span>
              <h4 className="font-inter font-primary text-[10px] sm:text-[11px] text-white uppercase mb-0.5 font-semibold tracking-wider">
                Timeless Quality
              </h4>
              <p className="font-jost font-secondary text-[10px] sm:text-[11px] text-white/70 whitespace-pre-line leading-tight">
                {"Considered forms.\nNothing unnecessary."}
              </p>
            </div>

            {/* Pillar 3 */}
            <div className="flex flex-col items-center text-center group px-2 py-1">
              <span className="material-symbols-outlined text-white/90 group-hover:text-amber-200 transition-colors mb-1 text-2xl font-light">
                eco
              </span>
              <h4 className="font-inter font-primary text-[10px] sm:text-[11px] text-white uppercase mb-0.5 font-semibold tracking-wider">
                Conscious Luxury
              </h4>
              <p className="font-jost font-secondary text-[10px] sm:text-[11px] text-white/70 whitespace-pre-line leading-tight">
                {"Thoughtful choices.\nLasting value."}
              </p>
            </div>

            {/* Pillar 4 */}
            <div className="flex flex-col items-center text-center group px-2 py-1">
              <span className="material-symbols-outlined text-white/90 group-hover:text-amber-200 transition-colors mb-1 text-2xl font-light">
                favorite_border
              </span>
              <h4 className="font-inter font-primary text-[10px] sm:text-[11px] text-white uppercase mb-0.5 font-semibold tracking-wider">
                Personal Connection
              </h4>
              <p className="font-jost font-secondary text-[10px] sm:text-[11px] text-white/70 whitespace-pre-line leading-tight">
                {"Jewelry with meaning.\nCreated for you."}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
