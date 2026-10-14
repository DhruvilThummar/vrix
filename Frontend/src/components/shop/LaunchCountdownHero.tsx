"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useLaunchCountdown } from "@/context/LaunchCountdownContext";
import { getApiBaseUrl } from "@/utils/api";

function formatNumber(num: number): string {
  return String(num).padStart(2, "0");
}

export default function LaunchCountdownHero() {
  const { config, timeLeft } = useLaunchCountdown();
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const [savedEmail, setSavedEmail] = useState("");
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Check if visitor has already registered on this browser
  useEffect(() => {
    try {
      const stored = localStorage.getItem("vrix_launch_waitlist_email");
      if (stored) {
        setSavedEmail(stored);
        setSubscribed(true);
      }
    } catch (_) {}
  }, []);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes("@") || !cleanEmail.includes(".")) {
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

  return (
    <section className="relative w-full min-h-screen flex flex-col overflow-hidden bg-[#0A0805] text-white">
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <Image
          src={bgImage}
          alt={config.title || "VRIX Jewellery Launch"}
          fill
          priority
          sizes="100vw"
          className="object-cover object-center"
        />
        {/* Dark overlay */}
        <div
          className="absolute inset-0 bg-black"
          style={{ opacity: overlayOpacity }}
        />
        {/* Cinematic gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/30 to-black/70 pointer-events-none" />
        {/* Warm golden tint */}
        <div className="absolute inset-0 bg-gradient-to-br from-amber-900/10 via-transparent to-amber-800/5 pointer-events-none" />
      </div>

      {/* Main Content */}
      <div className="relative z-10 flex flex-col items-center justify-center flex-1 w-full max-w-5xl mx-auto px-5 sm:px-8 py-8 sm:py-12 md:py-16 text-center">

        {/* Brand Logo */}
        <h1 className="sr-only">{config.title || "VRIX"}</h1>
        <div className="relative w-52 sm:w-64 md:w-72 lg:w-80 h-14 sm:h-16 md:h-20 mb-4 sm:mb-5 select-none drop-shadow-2xl">
          <Image
            src="/logos/white.png"
            alt={config.title || "VRIX"}
            fill
            priority
            className="object-contain"
            sizes="(max-width: 640px) 220px, 320px"
          />
        </div>

        {/* Main Heading */}
        <h2 className="font-inter text-[13px] sm:text-base md:text-lg lg:text-xl text-white/95 font-light tracking-[0.2em] sm:tracking-[0.25em] uppercase mb-3 sm:mb-4 leading-relaxed max-w-2xl">
          {config.subtitle ? (
            <span>{config.subtitle}</span>
          ) : (
            <>A new form of everyday luxury.</>
          )}
        </h2>

        {/* Editorial Description */}
        {config.description && (
          <p className="font-jost text-[11px] sm:text-xs md:text-sm text-white/65 max-w-lg mb-5 md:mb-7 font-light leading-relaxed tracking-wide">
            {config.description}
          </p>
        )}
        {!config.description && (
          <p className="font-jost text-[11px] sm:text-xs md:text-sm text-white/65 max-w-lg mb-5 md:mb-7 font-light leading-relaxed tracking-wide">
            Jewelry shaped by intention. Defined by detail.
            <br />
            Discover a quieter expression of luxury, created for the way you live.
          </p>
        )}

        {/* Countdown Timer — Elegant Dot-Separated Style */}
        {!timeLeft.isExpired ? (
          <div suppressHydrationWarning className="mb-6 md:mb-8">
            <div className="flex items-start justify-center gap-3 sm:gap-4 md:gap-6">
              {/* DAYS */}
              <div className="flex flex-col items-center">
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

              {/* Separator dot */}
              <div className="flex flex-col items-center pt-3 sm:pt-4 md:pt-5">
                <span className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-amber-300/70" />
              </div>

              {/* HOURS */}
              <div className="flex flex-col items-center">
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

              {/* Separator dot */}
              <div className="flex flex-col items-center pt-3 sm:pt-4 md:pt-5">
                <span className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-amber-300/70" />
              </div>

              {/* MINUTES */}
              <div className="flex flex-col items-center">
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

              {/* Separator dot */}
              <div className="flex flex-col items-center pt-3 sm:pt-4 md:pt-5">
                <span className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-amber-300/70" />
              </div>

              {/* SECONDS */}
              <div className="flex flex-col items-center">
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
                <div className="flex items-center justify-center gap-1.5 mb-2">
                  <span className="material-symbols-outlined text-amber-300/90 text-sm">verified</span>
                  <p className="font-inter text-[11px] sm:text-xs tracking-[0.15em] uppercase font-semibold text-white/90">
                    You&apos;re on the list.
                  </p>
                </div>
                <p className="font-jost text-[11px] sm:text-xs text-white/60 leading-relaxed">
                  {successMsg || config.waitlistSuccessMsg || "Early access. First collection previews. A closer look at the world of VRIX."}
                </p>
                {savedEmail && (
                  <p className="font-inter text-[10px] text-white/40 mt-2 tracking-wider">
                    Registered: <span className="text-amber-200/70 font-medium">{savedEmail}</span>
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
          className="inline-flex items-center gap-2.5 px-7 py-2.5 border border-white/60 hover:border-white hover:bg-white hover:text-black text-white text-[11px] font-inter tracking-[0.25em] uppercase font-medium transition-all duration-300 cursor-pointer mb-6 sm:mb-8"
        >
          <span>{config.contactButtonText || "Contact Us"}</span>
          <span className="text-xs">→</span>
        </Link>
      </div>

      {/* Bottom Pillars Section */}
      <div className="relative z-10 w-full border-t border-white/10 bg-black/20 backdrop-blur-sm">
        <div className="max-w-5xl mx-auto px-5 sm:px-8 py-5 sm:py-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 md:gap-8">
            <div className="flex flex-col items-center text-center group">
              <span className="material-symbols-outlined text-white/70 group-hover:text-amber-200/80 transition-colors mb-1.5 text-xl font-light">
                flare
              </span>
              <h4 className="font-inter text-[10px] sm:text-[11px] text-white/85 uppercase mb-0.5 font-semibold tracking-[0.15em]">
                Intentional Design
              </h4>
              <p className="font-jost text-[10px] sm:text-[11px] text-white/45 leading-tight">
                Nothing without purpose.
              </p>
            </div>

            <div className="flex flex-col items-center text-center group">
              <span className="material-symbols-outlined text-white/70 group-hover:text-amber-200/80 transition-colors mb-1.5 text-xl font-light">
                hourglass_empty
              </span>
              <h4 className="font-inter text-[10px] sm:text-[11px] text-white/85 uppercase mb-0.5 font-semibold tracking-[0.15em]">
                Timeless Quality
              </h4>
              <p className="font-jost text-[10px] sm:text-[11px] text-white/45 leading-tight">
                Made to be lived in.
              </p>
            </div>

            <div className="flex flex-col items-center text-center group">
              <span className="material-symbols-outlined text-white/70 group-hover:text-amber-200/80 transition-colors mb-1.5 text-xl font-light">
                eco
              </span>
              <h4 className="font-inter text-[10px] sm:text-[11px] text-white/85 uppercase mb-0.5 font-semibold tracking-[0.15em]">
                Conscious Luxury
              </h4>
              <p className="font-jost text-[10px] sm:text-[11px] text-white/45 leading-tight whitespace-pre-line">
                {"Thoughtful choices.\nLasting value."}
              </p>
            </div>

            <div className="flex flex-col items-center text-center group">
              <span className="material-symbols-outlined text-white/70 group-hover:text-amber-200/80 transition-colors mb-1.5 text-xl font-light">
                favorite_border
              </span>
              <h4 className="font-inter text-[10px] sm:text-[11px] text-white/85 uppercase mb-0.5 font-semibold tracking-[0.15em]">
                Personal Connection
              </h4>
              <p className="font-jost text-[10px] sm:text-[11px] text-white/45 leading-tight">
                Jewelry with meaning.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
