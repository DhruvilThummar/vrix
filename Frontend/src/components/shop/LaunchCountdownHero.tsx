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
    <section className="relative w-full h-[819px] md:h-screen min-h-[700px] flex items-center justify-center overflow-hidden bg-[#0A0D14] text-pure-white px-4 sm:px-6 pt-18 sm:pt-20 md:pt-20 pb-6 sm:pb-8">
      {/* Background Image with Cinematic Subtle Zoom */}
      <div className="absolute inset-0 z-0">
        <Image
          src={bgImage}
          alt={config.title || "VRIX Jewellery Launch"}
          fill
          priority
          sizes="100vw"
          className="object-cover object-center scale-105 animate-pulse duration-[12000ms]"
        />
        {/* Dark Luxury Vignette & Contrast Overlay */}
        <div
          className="absolute inset-0 bg-black"
          style={{ opacity: overlayOpacity }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-black/60 pointer-events-none" />
      </div>

      {/* Hero Content Container */}
      <div className="relative z-10 max-w-4xl mx-auto text-center flex flex-col items-center justify-center h-full max-h-full py-2">
        {/* 2. Main Brand Logo (Official VRIX Wordmark) */}
        <h1 className="sr-only">{config.title || "VRIX"}</h1>
        <div className="relative w-44 sm:w-56 md:w-64 h-12 sm:h-15 md:h-16 mb-2 sm:mb-3 select-none drop-shadow-xl shrink-0">
          <Image
            src="/logos/white.png"
            alt={config.title || "VRIX"}
            fill
            priority
            className="object-contain"
            sizes="(max-width: 640px) 200px, 300px"
          />
        </div>

        {/* 3. Subtitle / Tagline */}
        <p className="font-jost font-secondary text-sm sm:text-base md:text-lg text-white/90 font-light tracking-[0.08em] mb-2 drop-shadow shrink-0">
          {config.subtitle ? (
            <span>{config.subtitle}</span>
          ) : (
            <>
              A luxury that feels like <span className="font-chancery italic text-amber-200/90 text-xl sm:text-2xl">you</span>.
            </>
          )}
        </p>

        {/* 4. Editorial Description */}
        {config.description && (
          <p className="font-jost font-secondary text-[11px] sm:text-xs text-white/70 max-w-md mb-3 md:mb-4 font-normal leading-relaxed tracking-wide line-clamp-2 shrink-0">
            {config.description}
          </p>
        )}

        {/* 5. Luxury Countdown Ticker (Denorreys inspired) */}
        {!timeLeft.isExpired ? (
          <div suppressHydrationWarning className="w-full max-w-xl mx-auto mb-3 md:mb-4 shrink-0">
            <div className="grid grid-cols-4 gap-2 sm:gap-3 md:gap-4">
              {/* DAYS */}
              <div className="flex flex-col items-center justify-center p-2 sm:p-3 md:p-3.5 rounded-xs border border-white/20 bg-white/10 backdrop-blur-md shadow-2xl transition-transform duration-300 hover:border-white/40">
                <span
                  suppressHydrationWarning
                  className="font-inter font-primary text-xl sm:text-3xl md:text-4xl font-light text-white tracking-tight tabular-nums"
                >
                  {formatNumber(timeLeft.days)}
                </span>
                <span className="font-inter font-primary text-[8px] sm:text-[10px] tracking-[0.25em] uppercase text-white/70 mt-1 font-medium">
                  Days
                </span>
              </div>

              {/* HOURS */}
              <div className="flex flex-col items-center justify-center p-2 sm:p-3 md:p-3.5 rounded-xs border border-white/20 bg-white/10 backdrop-blur-md shadow-2xl transition-transform duration-300 hover:border-white/40">
                <span
                  suppressHydrationWarning
                  className="font-inter font-primary text-xl sm:text-3xl md:text-4xl font-light text-white tracking-tight tabular-nums"
                >
                  {formatNumber(timeLeft.hours)}
                </span>
                <span className="font-inter font-primary text-[8px] sm:text-[10px] tracking-[0.25em] uppercase text-white/70 mt-1 font-medium">
                  Hours
                </span>
              </div>

              {/* MINUTES */}
              <div className="flex flex-col items-center justify-center p-2 sm:p-3 md:p-3.5 rounded-xs border border-white/20 bg-white/10 backdrop-blur-md shadow-2xl transition-transform duration-300 hover:border-white/40">
                <span
                  suppressHydrationWarning
                  className="font-inter font-primary text-xl sm:text-3xl md:text-4xl font-light text-white tracking-tight tabular-nums"
                >
                  {formatNumber(timeLeft.minutes)}
                </span>
                <span className="font-inter font-primary text-[8px] sm:text-[10px] tracking-[0.25em] uppercase text-white/70 mt-1 font-medium">
                  Minutes
                </span>
              </div>

              {/* SECONDS */}
              <div className="flex flex-col items-center justify-center p-2 sm:p-3 md:p-3.5 rounded-xs border border-white/20 bg-white/10 backdrop-blur-md shadow-2xl transition-transform duration-300 hover:border-white/40">
                <span
                  suppressHydrationWarning
                  className="font-inter font-primary text-xl sm:text-3xl md:text-4xl font-light text-white tracking-tight tabular-nums text-amber-200/95"
                >
                  {formatNumber(timeLeft.seconds)}
                </span>
                <span className="font-inter font-primary text-[8px] sm:text-[10px] tracking-[0.25em] uppercase text-white/70 mt-1 font-medium">
                  Seconds
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className="mb-4 py-2 px-6 rounded border border-amber-300/40 bg-amber-400/10 backdrop-blur-md text-amber-200 shrink-0">
            <p className="font-inter font-primary text-xs sm:text-sm tracking-[0.25em] uppercase font-medium">
              ✦ WE ARE LIVE — WELCOME TO THE ATELIER ✦
            </p>
          </div>
        )}

        {/* 6. VIP Early Access / Waitlist Box */}
        {config.enableWaitlist && (
          <div className="w-full max-w-sm mx-auto mb-3 shrink-0">
            {subscribed ? (
              <div className="p-2.5 sm:p-3 rounded-xs border border-amber-300/40 bg-amber-400/10 backdrop-blur-md text-center animate-fade-in shadow-xl">
                <div className="flex items-center justify-center gap-1.5 mb-1 text-amber-200">
                  <span className="material-symbols-outlined text-sm">verified</span>
                  <p className="font-inter font-primary text-xs tracking-wider uppercase font-semibold">
                    VIP Launch Access Confirmed
                  </p>
                </div>
                <p className="font-jost font-secondary text-[11px] text-white/90">
                  {successMsg || config.waitlistSuccessMsg || "Thank you. You have been added to our private VIP launch list."}
                </p>
                {savedEmail && (
                  <p className="font-inter text-[10px] text-white/60 mt-1 tracking-wider">
                    Registered: <span className="text-amber-200/90 font-medium">{savedEmail}</span>
                  </p>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setSubscribed(false);
                    setSuccessMsg(null);
                    setEmail("");
                  }}
                  className="mt-2 text-[10px] text-white/50 hover:text-white underline underline-offset-2 tracking-wider uppercase font-inter cursor-pointer transition-colors"
                >
                  Register another email
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-2 w-full">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter email for private launch access..."
                  required
                  className="flex-1 bg-black/40 border border-white/25 text-white placeholder-white/50 px-3 py-2 text-xs font-inter tracking-wider rounded-xs focus:outline-none focus:border-white transition-colors backdrop-blur-xs"
                />
                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-pure-white text-ink-black hover:bg-white/90 active:scale-95 transition-all px-5 py-2 text-xs font-inter font-primary tracking-[0.15em] uppercase font-semibold rounded-xs cursor-pointer disabled:opacity-50 shrink-0 flex items-center justify-center gap-1.5 min-w-[100px]"
                >
                  {submitting ? (
                    <>
                      <span className="w-2.5 h-2.5 rounded-full border-2 border-ink-black border-t-transparent animate-spin inline-block" />
                      <span>Joining...</span>
                    </>
                  ) : (
                    "Notify Me"
                  )}
                </button>
              </form>
            )}
            {errorMsg && (
              <p className="text-[10px] text-red-300 mt-1 font-jost text-center bg-red-950/40 py-1 px-2 rounded border border-red-500/30">
                {errorMsg}
              </p>
            )}
          </div>
        )}

        {/* 7. Action Buttons (Contact Us) */}
        <div className="flex flex-wrap items-center justify-center gap-3 mb-1 shrink-0">
          <Link
            href={config.contactButtonUrl || "/contact"}
            className="inline-flex items-center gap-2 px-6 py-2 border border-white/70 hover:border-white hover:bg-white hover:text-ink-black text-white text-[11px] font-inter font-primary tracking-[0.2em] uppercase font-medium transition-all duration-300 rounded-xs cursor-pointer shadow-md"
          >
            <span>{config.contactButtonText || "Contact Us"}</span>
            <span className="material-symbols-outlined text-xs">arrow_forward</span>
          </Link>
        </div>

        {/* 8. Atelier Pillars */}
        <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-white/15 w-full max-w-3xl select-none shrink-0">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
            <div className="flex flex-col items-center text-center group">
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

            <div className="flex flex-col items-center text-center group">
              <span className="material-symbols-outlined text-white/90 group-hover:text-amber-200 transition-colors mb-1 text-2xl font-light">
                hourglass_empty
              </span>
              <h4 className="font-inter font-primary text-[10px] sm:text-[11px] text-white uppercase mb-0.5 font-semibold tracking-wider">
                Timeless Quality
              </h4>
              <p className="font-jost font-secondary text-[10px] sm:text-[11px] text-white/70 whitespace-pre-line leading-tight">
                {"Crafted to last.\nMade to be lived in."}
              </p>
            </div>

            <div className="flex flex-col items-center text-center group">
              <span className="material-symbols-outlined text-white/90 group-hover:text-amber-200 transition-colors mb-1 text-2xl font-light">
                eco
              </span>
              <h4 className="font-inter font-primary text-[10px] sm:text-[11px] text-white uppercase mb-0.5 font-semibold tracking-wider">
                Conscious Luxury
              </h4>
              <p className="font-jost font-secondary text-[10px] sm:text-[11px] text-white/70 whitespace-pre-line leading-tight">
                {"Ethical materials.\nThoughtful process."}
              </p>
            </div>

            <div className="flex flex-col items-center text-center group">
              <span className="material-symbols-outlined text-white/90 group-hover:text-amber-200 transition-colors mb-1 text-2xl font-light">
                favorite_border
              </span>
              <h4 className="font-inter font-primary text-[10px] sm:text-[11px] text-white uppercase mb-0.5 font-semibold tracking-wider">
                Personal Connection
              </h4>
              <p className="font-jost font-secondary text-[10px] sm:text-[11px] text-white/70 whitespace-pre-line leading-tight">
                {"A piece for every\nchapter of you."}
              </p>
            </div>
          </div>

          {/* Understated subtle bottom ribbon */}
          {(() => {
            const rawText = config.pillarsText || "Lab-Grown Diamonds · Architectural Minimalism · Surat Atelier · Lifetime Warranty";
            const items = rawText.split(/[·•|]+/).map(s => s.trim()).filter(Boolean);
            return (
              <div className="mt-2.5 pt-2 border-t border-white/10 w-full flex flex-wrap justify-center items-center gap-x-4 gap-y-1 text-[9px] sm:text-[10px] tracking-widest text-white/45 uppercase font-jost font-secondary select-none">
                {items.map((item, idx) => (
                  <React.Fragment key={idx}>
                    <span className="hover:text-white/80 transition-colors">{item}</span>
                    {idx < items.length - 1 && <span className="text-white/20">·</span>}
                  </React.Fragment>
                ))}
              </div>
            );
          })()}
        </div>
      </div>
    </section>
  );
}
