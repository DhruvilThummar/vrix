"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { fetchLaunchCountdown, updateLaunchCountdown, uploadMedia, fetchNewsletterSubscribers } from "@/utils/api";
import { DEFAULT_LAUNCH_CONFIG, LaunchCountdownConfig } from "@/context/LaunchCountdownContext";

const PRESET_BACKGROUNDS = [
  {
    name: "Luxury Diamond Atelier",
    url: "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?q=80&w=2000&auto=format&fit=crop",
  },
  {
    name: "Minimalist Jewellery Ring",
    url: "https://images.unsplash.com/photo-1605100804763-247f67b3557e?q=80&w=2000&auto=format&fit=crop",
  },
  {
    name: "Gold & Diamond Elegance",
    url: "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?q=80&w=2000&auto=format&fit=crop",
  },
  {
    name: "Dark Velveteen Showcase",
    url: "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?q=80&w=2000&auto=format&fit=crop",
  },
];

function toLocalDatetimeString(isoString: string): string {
  if (!isoString) return "";
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return "";
    const offset = d.getTimezoneOffset() * 60000;
    const local = new Date(d.getTime() - offset);
    return local.toISOString().slice(0, 16);
  } catch {
    return "";
  }
}

export default function AdminLaunchCountdownPage() {
  const [config, setConfig] = useState<LaunchCountdownConfig>(DEFAULT_LAUNCH_CONFIG);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // VIP Waitlist Subscribers
  const [subscribers, setSubscribers] = useState<string[]>([]);
  const [loadingSubscribers, setLoadingSubscribers] = useState(false);
  const [copiedSubscribers, setCopiedSubscribers] = useState(false);

  const loadSubscribers = async () => {
    setLoadingSubscribers(true);
    try {
      const res = await fetchNewsletterSubscribers();
      if (res && Array.isArray(res.subscribers)) {
        setSubscribers(res.subscribers);
      }
    } catch (e) {
      console.error("Failed to load subscribers", e);
    } finally {
      setLoadingSubscribers(false);
    }
  };

  const handleCopySubscribers = () => {
    if (!subscribers.length) return;
    navigator.clipboard.writeText(subscribers.join("\n"));
    setCopiedSubscribers(true);
    showToast(`Copied ${subscribers.length} subscriber emails to clipboard!`);
    setTimeout(() => setCopiedSubscribers(false), 2000);
  };

  const handleExportSubscribersCSV = () => {
    if (!subscribers.length) return;
    const csvContent = "data:text/csv;charset=utf-8,Email\n" + subscribers.map((e) => `"${e}"`).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `vrix_vip_subscribers_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Remaining time calculation ticker for Admin preview
  const [now, setNow] = useState(0);
  useEffect(() => {
    setNow(Date.now());
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  useEffect(() => {
    loadSubscribers();
  }, []);

  useEffect(() => {
    fetchLaunchCountdown()
      .then((res) => {
        if (res && typeof res === "object") {
          setConfig({
            ...DEFAULT_LAUNCH_CONFIG,
            ...res,
          });
        }
      })
      .catch((err) => {
        console.error("Error loading launch countdown config:", err);
      })
      .finally(() => setLoading(false));
  }, []);

  // Compute live admin preview timer
  const targetTime = new Date(config.targetDate).getTime();
  const diff = isNaN(targetTime) || now === 0 ? 0 : targetTime - now;
  const isExpired = diff <= 0;
  const days = Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
  const hours = Math.max(0, Math.floor((diff / (1000 * 60 * 60)) % 24));
  const minutes = Math.max(0, Math.floor((diff / (1000 * 60)) % 60));
  const seconds = Math.max(0, Math.floor((diff / 1000) % 60));

  const setDaysPreset = (daysCount: number) => {
    const future = new Date(Date.now() + daysCount * 24 * 60 * 60 * 1000);
    setConfig((prev) => ({ ...prev, targetDate: future.toISOString() }));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const res = await uploadMedia(file);
      if (res?.url) {
        setConfig((prev) => ({ ...prev, bgImage: res.url }));
        showToast("Hero background image uploaded successfully!");
      }
    } catch (err: any) {
      showToast(err.message || "Failed to upload image.");
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateLaunchCountdown(config);
      showToast("🎉 Launch & Countdown settings saved successfully!");
    } catch (err: any) {
      showToast(err.message || "Failed to save settings.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 max-w-5xl mx-auto flex items-center justify-center min-h-[50vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-deep-navy border-t-transparent rounded-full animate-spin" />
          <p className="font-body-md text-xs text-slate-grey uppercase tracking-wider">Loading Configuration...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto space-y-8 animate-fade-in text-ink-black pb-24">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed top-8 right-8 z-50 bg-deep-navy text-pure-white px-6 py-3.5 rounded shadow-xl text-xs font-inter font-primary uppercase tracking-wider flex items-center gap-3 border border-white/20">
          <span>{toastMessage}</span>
          <button onClick={() => setToastMessage(null)} className="text-white/60 hover:text-white">✕</button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-grey/20 pb-5">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="font-inter font-primary text-2xl font-bold uppercase tracking-wider text-deep-navy">
              Launch &amp; Countdown Manager
            </h1>
            <span
              className={`px-3 py-1 rounded-full text-[10px] font-inter font-primary font-bold uppercase tracking-widest ${
                config.mode === "LAUNCH"
                  ? "bg-amber-100 text-amber-900 border border-amber-300"
                  : config.mode === "SALE"
                  ? "bg-emerald-100 text-emerald-900 border border-emerald-300"
                  : "bg-slate-100 text-slate-700 border border-slate-300"
              }`}
            >
              {config.mode === "LAUNCH" ? "🚀 Pre-Launch Mode" : config.mode === "SALE" ? "🏷️ Sale Mode" : "⚪ Disabled (Store Live)"}
            </span>
          </div>
          <p className="font-jost font-secondary text-xs text-slate-grey">
            Manage your storefront launch countdown (inspired by denorreys.com) or promotional sale timer. Everything updates in real time.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <Link
            href="/"
            target="_blank"
            className="px-4 py-2 border border-slate-grey/30 hover:bg-slate-50 text-deep-navy text-xs font-inter font-primary uppercase tracking-wider font-semibold rounded flex items-center gap-1.5 transition-colors"
          >
            <span>View Storefront</span>
            <span className="material-symbols-outlined text-sm">open_in_new</span>
          </Link>
          <button
            onClick={handleSave}
            disabled={saving}
            className="bg-deep-navy hover:bg-ink-black text-pure-white px-6 py-2 rounded text-xs font-inter font-primary uppercase tracking-wider font-semibold shadow flex items-center gap-2 transition-colors cursor-pointer disabled:opacity-50"
          >
            {saving ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-sm">save</span>
                <span>Save Changes</span>
              </>
            )}
          </button>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-8">
        {/* ══════════════════════════════════════════════════════════════════════════════
            SECTION 1: MODE SELECTOR
            ══════════════════════════════════════════════════════════════════════════════ */}
        <div className="bg-pure-white p-6 rounded border border-slate-grey/20 shadow-xs space-y-4">
          <div>
            <h2 className="font-inter font-primary text-sm uppercase tracking-wider font-bold text-deep-navy">
              1. Choose Storefront Mode
            </h2>
            <p className="font-jost font-secondary text-xs text-slate-grey mt-0.5">
              Select whether the site is in pre-launch countdown mode, live with a sale countdown, or standard live store.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            {/* Mode 1: Pre-Launch */}
            <div
              onClick={() => setConfig((prev) => ({ ...prev, mode: "LAUNCH" }))}
              className={`p-5 rounded border-2 cursor-pointer transition-all flex flex-col justify-between ${
                config.mode === "LAUNCH"
                  ? "border-deep-navy bg-soft-linen/40 shadow-sm"
                  : "border-slate-grey/20 hover:border-slate-grey/50 bg-pure-white"
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="w-9 h-9 rounded-full bg-deep-navy/10 flex items-center justify-center text-deep-navy">
                    <span className="material-symbols-outlined text-lg">rocket_launch</span>
                  </div>
                  <span className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${config.mode === "LAUNCH" ? "border-deep-navy" : "border-slate-grey/40"}`}>
                    {config.mode === "LAUNCH" && <span className="w-2 h-2 rounded-full bg-deep-navy" />}
                  </span>
                </div>
                <h3 className="font-inter font-primary text-xs uppercase tracking-wider font-bold text-deep-navy">
                  Pre-Launch Countdown
                </h3>
                <p className="font-jost font-secondary text-[11px] text-slate-grey mt-1.5 leading-relaxed">
                  <strong>Denorreys Style:</strong> Displays luxury Hero Countdown timer, Announcement Bar, Contact Page, and minimal Nav. <strong>Products and shop routes are locked</strong> until launch!
                </p>
              </div>
              <span className="text-[10px] font-inter uppercase font-semibold text-amber-800 bg-amber-50 px-2 py-0.5 rounded mt-3 inline-block self-start">
                Store Locked · Countdown Active
              </span>
            </div>

            {/* Mode 2: Sale Countdown */}
            <div
              onClick={() => setConfig((prev) => ({ ...prev, mode: "SALE" }))}
              className={`p-5 rounded border-2 cursor-pointer transition-all flex flex-col justify-between ${
                config.mode === "SALE"
                  ? "border-deep-navy bg-soft-linen/40 shadow-sm"
                  : "border-slate-grey/20 hover:border-slate-grey/50 bg-pure-white"
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="w-9 h-9 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-800">
                    <span className="material-symbols-outlined text-lg">local_offer</span>
                  </div>
                  <span className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${config.mode === "SALE" ? "border-deep-navy" : "border-slate-grey/40"}`}>
                    {config.mode === "SALE" && <span className="w-2 h-2 rounded-full bg-deep-navy" />}
                  </span>
                </div>
                <h3 className="font-inter font-primary text-xs uppercase tracking-wider font-bold text-deep-navy">
                  Sale Countdown Mode
                </h3>
                <p className="font-jost font-secondary text-[11px] text-slate-grey mt-1.5 leading-relaxed">
                  <strong>Store is 100% LIVE:</strong> All products, categories, cart, and menus show as normal. Displays a luxury countdown banner for a flash sale or special event.
                </p>
              </div>
              <span className="text-[10px] font-inter uppercase font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded mt-3 inline-block self-start">
                Store Open · Sale Banner Active
              </span>
            </div>

            {/* Mode 3: Disabled */}
            <div
              onClick={() => setConfig((prev) => ({ ...prev, mode: "DISABLED" }))}
              className={`p-5 rounded border-2 cursor-pointer transition-all flex flex-col justify-between ${
                config.mode === "DISABLED"
                  ? "border-deep-navy bg-soft-linen/40 shadow-sm"
                  : "border-slate-grey/20 hover:border-slate-grey/50 bg-pure-white"
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-700">
                    <span className="material-symbols-outlined text-lg">storefront</span>
                  </div>
                  <span className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${config.mode === "DISABLED" ? "border-deep-navy" : "border-slate-grey/40"}`}>
                    {config.mode === "DISABLED" && <span className="w-2 h-2 rounded-full bg-deep-navy" />}
                  </span>
                </div>
                <h3 className="font-inter font-primary text-xs uppercase tracking-wider font-bold text-deep-navy">
                  Standard Live Store
                </h3>
                <p className="font-jost font-secondary text-[11px] text-slate-grey mt-1.5 leading-relaxed">
                  Countdown is completely disabled. Regular homepage slider banners and standard storefront are active.
                </p>
              </div>
              <span className="text-[10px] font-inter uppercase font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded mt-3 inline-block self-start">
                Normal Storefront
              </span>
            </div>
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════════════════════════════
            SECTION 2: TARGET DATE & TIME SCHEDULE (WITH LIVE ADMIN TICKER)
            ══════════════════════════════════════════════════════════════════════════════ */}
        <div className="bg-pure-white p-6 rounded border border-slate-grey/20 shadow-xs space-y-6">
          <div>
            <h2 className="font-inter font-primary text-sm uppercase tracking-wider font-bold text-deep-navy">
              2. Target Date &amp; Countdown Timer Schedule
            </h2>
            <p className="font-jost font-secondary text-xs text-slate-grey mt-0.5">
              Set the exact date and time the countdown reaches zero.
            </p>
          </div>

          {/* Live Preview Box */}
          <div className="bg-[#050525] text-white p-6 rounded border border-white/10 flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <p className="font-inter font-primary text-[10px] tracking-[0.2em] uppercase text-white/60 mb-1">
                Live Countdown Preview
              </p>
              <h4 className="font-inter font-primary text-base font-semibold uppercase text-white">
                {isExpired ? "Time Expired / Target Reached" : "Time Remaining to Launch"}
              </h4>
              <p className="font-jost font-secondary text-xs text-white/70 mt-1">
                Target: {new Date(config.targetDate).toLocaleString(undefined, { dateStyle: "full", timeStyle: "short" })}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex flex-col items-center bg-white/10 backdrop-blur-xs px-4 py-2 rounded border border-white/15 min-w-[64px]">
                <span className="font-inter text-2xl font-light tabular-nums">{String(days).padStart(2, "0")}</span>
                <span className="text-[9px] uppercase tracking-widest text-white/60 mt-1 font-inter">Days</span>
              </div>
              <span className="text-white/40 text-xl">:</span>
              <div className="flex flex-col items-center bg-white/10 backdrop-blur-xs px-4 py-2 rounded border border-white/15 min-w-[64px]">
                <span className="font-inter text-2xl font-light tabular-nums">{String(hours).padStart(2, "0")}</span>
                <span className="text-[9px] uppercase tracking-widest text-white/60 mt-1 font-inter">Hours</span>
              </div>
              <span className="text-white/40 text-xl">:</span>
              <div className="flex flex-col items-center bg-white/10 backdrop-blur-xs px-4 py-2 rounded border border-white/15 min-w-[64px]">
                <span className="font-inter text-2xl font-light tabular-nums">{String(minutes).padStart(2, "0")}</span>
                <span className="text-[9px] uppercase tracking-widest text-white/60 mt-1 font-inter">Mins</span>
              </div>
              <span className="text-white/40 text-xl">:</span>
              <div className="flex flex-col items-center bg-white/10 backdrop-blur-xs px-4 py-2 rounded border border-white/15 min-w-[64px]">
                <span className="font-inter text-2xl font-light tabular-nums text-amber-300">{String(seconds).padStart(2, "0")}</span>
                <span className="text-[9px] uppercase tracking-widest text-white/60 mt-1 font-inter">Secs</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
            <div>
              <label className="block text-xs font-inter font-primary uppercase tracking-wider font-semibold text-deep-navy mb-2">
                Launch / Sale Target Date &amp; Time
              </label>
              <input
                type="datetime-local"
                value={toLocalDatetimeString(config.targetDate)}
                onChange={(e) => {
                  if (e.target.value) {
                    const localDate = new Date(e.target.value);
                    setConfig((prev) => ({ ...prev, targetDate: localDate.toISOString() }));
                  }
                }}
                className="w-full bg-soft-linen/30 border border-slate-grey/30 rounded px-4 py-2.5 text-xs font-inter focus:outline-none focus:border-deep-navy"
                required
              />
            </div>

            <div>
              <label className="block text-[11px] font-inter font-primary uppercase tracking-wider text-slate-grey mb-2">
                Quick Schedule Presets
              </label>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setDaysPreset(1)}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-deep-navy hover:text-white rounded text-xs font-inter transition-colors cursor-pointer"
                >
                  +1 Day
                </button>
                <button
                  type="button"
                  onClick={() => setDaysPreset(3)}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-deep-navy hover:text-white rounded text-xs font-inter transition-colors cursor-pointer"
                >
                  +3 Days
                </button>
                <button
                  type="button"
                  onClick={() => setDaysPreset(7)}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-deep-navy hover:text-white rounded text-xs font-inter transition-colors cursor-pointer"
                >
                  +7 Days
                </button>
                <button
                  type="button"
                  onClick={() => setDaysPreset(14)}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-deep-navy hover:text-white rounded text-xs font-inter transition-colors cursor-pointer"
                >
                  +14 Days
                </button>
                <button
                  type="button"
                  onClick={() => setDaysPreset(30)}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-deep-navy hover:text-white rounded text-xs font-inter transition-colors cursor-pointer"
                >
                  +30 Days
                </button>
              </div>
            </div>
          </div>

          {/* Auto Unlock Toggle */}
          <div className="pt-2 border-t border-slate-grey/15 flex items-center justify-between">
            <div>
              <p className="font-inter font-primary text-xs uppercase tracking-wider font-semibold text-deep-navy">
                Auto-Unlock Store on Expiry
              </p>
              <p className="font-jost font-secondary text-[11px] text-slate-grey">
                Automatically transition to live store when countdown hits zero, immediately showing all products to visitors.
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={config.autoUnlockOnZero}
                onChange={(e) => setConfig((prev) => ({ ...prev, autoUnlockOnZero: e.target.checked }))}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-deep-navy"></div>
            </label>
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════════════════════════════
            SECTION 3: HERO SECTION CONTENT & STYLING (DENORREYS AESTHETIC)
            ══════════════════════════════════════════════════════════════════════════════ */}
        <div className="bg-pure-white p-6 rounded border border-slate-grey/20 shadow-xs space-y-6">
          <div>
            <h2 className="font-inter font-primary text-sm uppercase tracking-wider font-bold text-deep-navy">
              3. Hero Countdown Content &amp; Imagery (Denorreys Style)
            </h2>
            <p className="font-jost font-secondary text-xs text-slate-grey mt-0.5">
              Customize the titles, luxury eyebrow badge, background photo, and waitlist settings.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-inter font-primary uppercase tracking-wider font-semibold text-deep-navy mb-1.5">
                Eyebrow Badge Text
              </label>
              <input
                type="text"
                value={config.badgeText}
                onChange={(e) => setConfig((prev) => ({ ...prev, badgeText: e.target.value }))}
                placeholder="UNVEILING SOON"
                className="w-full bg-soft-linen/30 border border-slate-grey/30 rounded px-3 py-2 text-xs font-inter focus:outline-none focus:border-deep-navy"
              />
            </div>

            <div>
              <label className="block text-xs font-inter font-primary uppercase tracking-wider font-semibold text-deep-navy mb-1.5">
                Brand Logo / Main Title
              </label>
              <input
                type="text"
                value={config.title}
                onChange={(e) => setConfig((prev) => ({ ...prev, title: e.target.value }))}
                placeholder="V R I X"
                className="w-full bg-soft-linen/30 border border-slate-grey/30 rounded px-3 py-2 text-xs font-inter focus:outline-none focus:border-deep-navy"
              />
            </div>

            <div>
              <label className="block text-xs font-inter font-primary uppercase tracking-wider font-semibold text-deep-navy mb-1.5">
                Tagline / Subtitle
              </label>
              <input
                type="text"
                value={config.subtitle}
                onChange={(e) => setConfig((prev) => ({ ...prev, subtitle: e.target.value }))}
                placeholder="A luxury that feels like you."
                className="w-full bg-soft-linen/30 border border-slate-grey/30 rounded px-3 py-2 text-xs font-inter focus:outline-none focus:border-deep-navy"
              />
            </div>

            <div>
              <label className="block text-xs font-inter font-primary uppercase tracking-wider font-semibold text-deep-navy mb-1.5">
                Contact Button Text
              </label>
              <input
                type="text"
                value={config.contactButtonText}
                onChange={(e) => setConfig((prev) => ({ ...prev, contactButtonText: e.target.value }))}
                placeholder="Contact Us"
                className="w-full bg-soft-linen/30 border border-slate-grey/30 rounded px-3 py-2 text-xs font-inter focus:outline-none focus:border-deep-navy"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-inter font-primary uppercase tracking-wider font-semibold text-deep-navy mb-1.5">
                Editorial Description
              </label>
              <textarea
                rows={2}
                value={config.description}
                onChange={(e) => setConfig((prev) => ({ ...prev, description: e.target.value }))}
                placeholder="Lab-grown diamonds and fine jewellery crafted with architectural minimalism and quiet luxury."
                className="w-full bg-soft-linen/30 border border-slate-grey/30 rounded px-3 py-2 text-xs font-inter focus:outline-none focus:border-deep-navy"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-inter font-primary uppercase tracking-wider font-semibold text-deep-navy mb-1.5">
                VRIX Atelier Brand Pillars (Separated by · or comma)
              </label>
              <input
                type="text"
                value={config.pillarsText ?? "Lab-Grown Diamonds · Architectural Minimalism · Surat Atelier · Lifetime Warranty"}
                onChange={(e) => setConfig((prev) => ({ ...prev, pillarsText: e.target.value }))}
                placeholder="Lab-Grown Diamonds · Architectural Minimalism · Surat Atelier · Lifetime Warranty"
                className="w-full bg-soft-linen/30 border border-slate-grey/30 rounded px-3 py-2 text-xs font-inter focus:outline-none focus:border-deep-navy"
              />
              <p className="font-jost font-secondary text-[11px] text-slate-grey mt-1">
                Displayed at the base of the countdown hero as minimal uppercase luxury indicators.
              </p>
            </div>
          </div>

          {/* Background Image Selection & Upload */}
          <div className="space-y-3 pt-2 border-t border-slate-grey/15">
            <label className="block text-xs font-inter font-primary uppercase tracking-wider font-semibold text-deep-navy">
              Hero Background Image
            </label>
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                value={config.bgImage}
                onChange={(e) => setConfig((prev) => ({ ...prev, bgImage: e.target.value }))}
                placeholder="https://..."
                className="flex-1 bg-soft-linen/30 border border-slate-grey/30 rounded px-3 py-2 text-xs font-inter focus:outline-none focus:border-deep-navy"
              />
              <label className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-deep-navy text-xs font-inter font-semibold rounded cursor-pointer transition-colors shrink-0 flex items-center gap-1.5">
                <span className="material-symbols-outlined text-sm">upload</span>
                <span>{uploading ? "Uploading..." : "Upload Photo"}</span>
                <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" disabled={uploading} />
              </label>
            </div>

            {/* Presets Grid */}
            <div>
              <p className="text-[11px] font-inter text-slate-grey uppercase tracking-wider mb-2">
                Or pick a luxury preset background:
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {PRESET_BACKGROUNDS.map((preset, idx) => (
                  <div
                    key={idx}
                    onClick={() => setConfig((prev) => ({ ...prev, bgImage: preset.url }))}
                    className={`relative aspect-video rounded overflow-hidden border-2 cursor-pointer transition-all group ${
                      config.bgImage === preset.url ? "border-deep-navy ring-2 ring-deep-navy/30" : "border-slate-grey/20 hover:border-slate-grey/60"
                    }`}
                  >
                    <img src={preset.url} alt={preset.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                    <div className="absolute inset-0 bg-black/40 flex items-end p-1.5">
                      <span className="text-[10px] text-white font-inter tracking-wider truncate">{preset.name}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Dark Overlay Slider */}
            <div className="pt-2">
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs font-inter font-primary uppercase tracking-wider text-slate-grey">
                  Background Dimming Overlay
                </label>
                <span className="text-xs font-inter font-bold text-deep-navy">{config.bgOverlayOpacity || 45}%</span>
              </div>
              <input
                type="range"
                min="10"
                max="85"
                step="5"
                value={config.bgOverlayOpacity || 45}
                onChange={(e) => setConfig((prev) => ({ ...prev, bgOverlayOpacity: Number(e.target.value) }))}
                className="w-full accent-deep-navy cursor-pointer"
              />
            </div>
          </div>

          {/* Waitlist Box Toggle */}
          <div className="pt-3 border-t border-slate-grey/15 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-inter font-primary text-xs uppercase tracking-wider font-semibold text-deep-navy">
                  VIP Early Access / Waitlist Form
                </p>
                <p className="font-jost font-secondary text-[11px] text-slate-grey">
                  Display an email signup box in the countdown hero allowing visitors to register for private launch access.
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.enableWaitlist}
                  onChange={(e) => setConfig((prev) => ({ ...prev, enableWaitlist: e.target.checked }))}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-deep-navy"></div>
              </label>
            </div>

            {config.enableWaitlist && (
              <div>
                <label className="block text-xs font-inter font-primary uppercase tracking-wider font-semibold text-deep-navy mb-1.5">
                  Success Message Shown Upon Email Registration
                </label>
                <input
                  type="text"
                  value={config.waitlistSuccessMsg}
                  onChange={(e) => setConfig((prev) => ({ ...prev, waitlistSuccessMsg: e.target.value }))}
                  placeholder="Thank you. You have been added to our private launch list."
                  className="w-full bg-soft-linen/30 border border-slate-grey/30 rounded px-3 py-2 text-xs font-inter focus:outline-none focus:border-deep-navy"
                />
              </div>
            )}

            {/* Registered VIP Subscribers Viewer */}
            <div className="mt-4 p-4 rounded-lg bg-soft-linen/40 border border-slate-grey/20">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-3">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-deep-navy text-lg">mark_email_read</span>
                  <div>
                    <h4 className="font-inter font-primary text-xs uppercase tracking-wider font-bold text-deep-navy">
                      Registered VIP Guests &amp; Waitlist
                    </h4>
                    <p className="font-jost font-secondary text-[11px] text-slate-grey">
                      Emails collected via the "Notify Me" hero launch form.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={loadSubscribers}
                    disabled={loadingSubscribers}
                    className="px-2.5 py-1 text-[11px] font-inter border border-slate-grey/30 hover:bg-white rounded text-deep-navy flex items-center gap-1 transition-colors cursor-pointer disabled:opacity-50"
                    title="Refresh subscriber list"
                  >
                    <span className={`material-symbols-outlined text-xs ${loadingSubscribers ? "animate-spin" : ""}`}>
                      refresh
                    </span>
                    <span>Refresh</span>
                  </button>

                  {subscribers.length > 0 && (
                    <>
                      <button
                        type="button"
                        onClick={handleCopySubscribers}
                        className="px-2.5 py-1 text-[11px] font-inter bg-deep-navy text-pure-white hover:bg-ink-black rounded flex items-center gap-1 transition-colors cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-xs">
                          {copiedSubscribers ? "check" : "content_copy"}
                        </span>
                        <span>{copiedSubscribers ? "Copied!" : "Copy All"}</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleExportSubscribersCSV}
                        className="px-2.5 py-1 text-[11px] font-inter border border-slate-grey/30 hover:bg-white rounded text-deep-navy flex items-center gap-1 transition-colors cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-xs">download</span>
                        <span>CSV</span>
                      </button>
                    </>
                  )}
                </div>
              </div>

              {loadingSubscribers ? (
                <div className="py-4 text-center text-xs font-inter text-slate-grey flex items-center justify-center gap-2">
                  <div className="w-3.5 h-3.5 border-2 border-deep-navy border-t-transparent rounded-full animate-spin" />
                  <span>Loading subscribers...</span>
                </div>
              ) : subscribers.length === 0 ? (
                <div className="py-4 text-center text-xs font-jost text-slate-grey/80 bg-white/60 rounded border border-dashed border-slate-grey/25">
                  No VIP subscribers registered yet. Test the storefront countdown hero to see entries appear here!
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-[11px] font-inter text-slate-grey">
                    <span>Total Subscribers: <strong className="text-deep-navy font-semibold">{subscribers.length}</strong></span>
                    <span>Latest registrations shown first</span>
                  </div>
                  <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
                    {subscribers.slice().reverse().map((email, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between bg-white px-3 py-2 rounded border border-slate-grey/15 text-xs font-inter text-deep-navy"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="w-5 h-5 rounded-full bg-deep-navy/10 text-deep-navy flex items-center justify-center text-[10px] font-semibold shrink-0">
                            {idx + 1}
                          </span>
                          <span className="truncate font-medium">{email}</span>
                        </div>
                        <span className="text-[10px] font-inter uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-semibold shrink-0">
                          VIP Confirmed
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════════════════════════════
            SECTION 4: TOP ANNOUNCEMENT BAR FOR LAUNCH / SALE
            ══════════════════════════════════════════════════════════════════════════════ */}
        <div className="bg-pure-white p-6 rounded border border-slate-grey/20 shadow-xs space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-inter font-primary text-sm uppercase tracking-wider font-bold text-deep-navy">
                4. Top Announcement Bar (Above Header)
              </h2>
              <p className="font-jost font-secondary text-xs text-slate-grey mt-0.5">
                Displays a prominent notice at the very top of the page above the navigation.
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={config.showAnnouncementBar}
                onChange={(e) => setConfig((prev) => ({ ...prev, showAnnouncementBar: e.target.checked }))}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-deep-navy"></div>
            </label>
          </div>

          {config.showAnnouncementBar && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
              <div className="md:col-span-2">
                <label className="block text-xs font-inter font-primary uppercase tracking-wider font-semibold text-deep-navy mb-1.5">
                  Announcement Text
                </label>
                <input
                  type="text"
                  value={config.announcementText}
                  onChange={(e) => setConfig((prev) => ({ ...prev, announcementText: e.target.value }))}
                  placeholder="✦ OFFICIAL ATELIER LAUNCH COUNTDOWN — ENTERING A NEW ERA OF LAB-GROWN DIAMONDS ✦"
                  className="w-full bg-soft-linen/30 border border-slate-grey/30 rounded px-3 py-2 text-xs font-inter focus:outline-none focus:border-deep-navy"
                />
              </div>

              <div>
                <label className="block text-xs font-inter font-primary uppercase tracking-wider font-semibold text-deep-navy mb-1.5">
                  Action Link Text
                </label>
                <input
                  type="text"
                  value={config.announcementLinkText}
                  onChange={(e) => setConfig((prev) => ({ ...prev, announcementLinkText: e.target.value }))}
                  placeholder="Contact Atelier →"
                  className="w-full bg-soft-linen/30 border border-slate-grey/30 rounded px-3 py-2 text-xs font-inter focus:outline-none focus:border-deep-navy"
                />
              </div>
            </div>
          )}
        </div>

        {/* ══════════════════════════════════════════════════════════════════════════════
            SECTION 5: SALE COUNTDOWN & PROMOTIONAL CAMPAIGN SETTINGS
            ══════════════════════════════════════════════════════════════════════════════ */}
        <div className={`p-6 rounded border transition-all shadow-xs space-y-6 ${
          config.mode === "SALE" 
            ? "bg-pure-white border-amber-400 ring-2 ring-amber-300/30" 
            : "bg-pure-white border-slate-grey/20"
        }`}>
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                <h2 className="font-inter font-primary text-sm uppercase tracking-wider font-bold text-deep-navy">
                  5. Sale Countdown &amp; Promotional Campaign Settings
                </h2>
              </div>
              <p className="font-jost font-secondary text-xs text-slate-grey">
                Active when Mode is set to <strong>Sale Countdown</strong>. Customize discount codes, hero banners, and promotional CTAs while keeping the entire storefront and catalog live.
              </p>
            </div>
            {config.mode === "SALE" && (
              <span className="px-2.5 py-1 rounded bg-amber-100 text-amber-900 font-inter text-[10px] uppercase font-bold tracking-widest shrink-0">
                ACTIVE MODE
              </span>
            )}
          </div>

          {/* Sale Display Type Selection */}
          <div className="space-y-3 pt-1">
            <label className="block text-xs font-inter font-primary uppercase tracking-wider font-semibold text-deep-navy">
              Sale Display Layout on Homepage
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div
                onClick={() => setConfig((prev) => ({ ...prev, saleDisplayType: "HERO" }))}
                className={`p-4 rounded border-2 cursor-pointer transition-all ${
                  (config.saleDisplayType || "HERO") === "HERO"
                    ? "border-deep-navy bg-soft-linen/40"
                    : "border-slate-grey/20 hover:border-slate-grey/40"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-inter text-xs uppercase font-bold text-deep-navy">
                    Full Luxury Sale Hero (Recommended)
                  </span>
                  <span className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center ${
                    (config.saleDisplayType || "HERO") === "HERO" ? "border-deep-navy" : "border-slate-grey/40"
                  }`}>
                    {(config.saleDisplayType || "HERO") === "HERO" && <span className="w-1.5 h-1.5 rounded-full bg-deep-navy" />}
                  </span>
                </div>
                <p className="font-jost text-[11px] text-slate-grey leading-relaxed">
                  Renders an architectural Sale Hero section at the top with large countdown blocks, discount coupon badge, and shop buttons. All products and collections appear right below.
                </p>
              </div>

              <div
                onClick={() => setConfig((prev) => ({ ...prev, saleDisplayType: "BAR" }))}
                className={`p-4 rounded border-2 cursor-pointer transition-all ${
                  config.saleDisplayType === "BAR"
                    ? "border-deep-navy bg-soft-linen/40"
                    : "border-slate-grey/20 hover:border-slate-grey/40"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-inter text-xs uppercase font-bold text-deep-navy">
                    Compact Ticker Bar
                  </span>
                  <span className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center ${
                    config.saleDisplayType === "BAR" ? "border-deep-navy" : "border-slate-grey/40"
                  }`}>
                    {config.saleDisplayType === "BAR" && <span className="w-1.5 h-1.5 rounded-full bg-deep-navy" />}
                  </span>
                </div>
                <p className="font-jost text-[11px] text-slate-grey leading-relaxed">
                  Displays a sleek, slender horizontal sale timer bar above the regular homepage slider banners.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2 border-t border-slate-grey/15">
            <div>
              <label className="block text-xs font-inter font-primary uppercase tracking-wider font-semibold text-deep-navy mb-1.5">
                Sale Eyebrow / Event Badge
              </label>
              <input
                type="text"
                value={config.saleBadgeText ?? "✦ PRIVATE ARCHIVE EVENT ✦"}
                onChange={(e) => setConfig((prev) => ({ ...prev, saleBadgeText: e.target.value }))}
                placeholder="✦ PRIVATE ARCHIVE EVENT ✦"
                className="w-full bg-soft-linen/30 border border-slate-grey/30 rounded px-3 py-2 text-xs font-inter focus:outline-none focus:border-deep-navy"
              />
            </div>

            <div>
              <label className="block text-xs font-inter font-primary uppercase tracking-wider font-semibold text-deep-navy mb-1.5">
                Discount Highlight (e.g. UP TO 25% OFF)
              </label>
              <input
                type="text"
                value={config.saleDiscountHighlight ?? "UP TO 25% OFF"}
                onChange={(e) => setConfig((prev) => ({ ...prev, saleDiscountHighlight: e.target.value }))}
                placeholder="UP TO 25% OFF"
                className="w-full bg-soft-linen/30 border border-slate-grey/30 rounded px-3 py-2 text-xs font-inter focus:outline-none focus:border-deep-navy"
              />
            </div>

            <div>
              <label className="block text-xs font-inter font-primary uppercase tracking-wider font-semibold text-deep-navy mb-1.5">
                Main Sale Headline
              </label>
              <input
                type="text"
                value={config.saleTitle ?? "THE SOLITAIRE SALE"}
                onChange={(e) => setConfig((prev) => ({ ...prev, saleTitle: e.target.value }))}
                placeholder="THE SOLITAIRE SALE"
                className="w-full bg-soft-linen/30 border border-slate-grey/30 rounded px-3 py-2 text-xs font-inter focus:outline-none focus:border-deep-navy"
              />
            </div>

            <div>
              <label className="block text-xs font-inter font-primary uppercase tracking-wider font-semibold text-deep-navy mb-1.5">
                Promo / Coupon Code (One-Click Copyable)
              </label>
              <input
                type="text"
                value={config.saleDiscountCode ?? "VRIX15"}
                onChange={(e) => setConfig((prev) => ({ ...prev, saleDiscountCode: e.target.value.toUpperCase() }))}
                placeholder="VRIX15"
                className="w-full bg-soft-linen/30 border border-slate-grey/30 rounded px-3 py-2 text-xs font-inter font-bold tracking-widest text-deep-navy focus:outline-none focus:border-deep-navy"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-inter font-primary uppercase tracking-wider font-semibold text-deep-navy mb-1.5">
                Sale Subtitle / Description
              </label>
              <textarea
                rows={2}
                value={config.saleSubtitle ?? "Limited allocation of fine lab-grown diamonds with architectural form."}
                onChange={(e) => setConfig((prev) => ({ ...prev, saleSubtitle: e.target.value }))}
                placeholder="Limited allocation of fine lab-grown diamonds with architectural form."
                className="w-full bg-soft-linen/30 border border-slate-grey/30 rounded px-3 py-2 text-xs font-inter focus:outline-none focus:border-deep-navy"
              />
            </div>

            <div>
              <label className="block text-xs font-inter font-primary uppercase tracking-wider font-semibold text-deep-navy mb-1.5">
                Primary Button Text &amp; URL
              </label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  value={config.saleCtaText ?? "Shop The Sale"}
                  onChange={(e) => setConfig((prev) => ({ ...prev, saleCtaText: e.target.value }))}
                  placeholder="Shop The Sale"
                  className="w-full bg-soft-linen/30 border border-slate-grey/30 rounded px-3 py-2 text-xs font-inter focus:outline-none focus:border-deep-navy"
                />
                <input
                  type="text"
                  value={config.saleCtaUrl ?? "/collections"}
                  onChange={(e) => setConfig((prev) => ({ ...prev, saleCtaUrl: e.target.value }))}
                  placeholder="/collections"
                  className="w-full bg-soft-linen/30 border border-slate-grey/30 rounded px-3 py-2 text-xs font-inter focus:outline-none focus:border-deep-navy"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-inter font-primary uppercase tracking-wider font-semibold text-deep-navy mb-1.5">
                Secondary Button Text &amp; URL
              </label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  value={config.saleSecondaryCtaText ?? "Explore All Pieces"}
                  onChange={(e) => setConfig((prev) => ({ ...prev, saleSecondaryCtaText: e.target.value }))}
                  placeholder="Explore All Pieces"
                  className="w-full bg-soft-linen/30 border border-slate-grey/30 rounded px-3 py-2 text-xs font-inter focus:outline-none focus:border-deep-navy"
                />
                <input
                  type="text"
                  value={config.saleSecondaryCtaUrl ?? "/products"}
                  onChange={(e) => setConfig((prev) => ({ ...prev, saleSecondaryCtaUrl: e.target.value }))}
                  placeholder="/products"
                  className="w-full bg-soft-linen/30 border border-slate-grey/30 rounded px-3 py-2 text-xs font-inter focus:outline-none focus:border-deep-navy"
                />
              </div>
            </div>
          </div>

          {/* Sale Background Image */}
          <div className="space-y-3 pt-2 border-t border-slate-grey/15">
            <label className="block text-xs font-inter font-primary uppercase tracking-wider font-semibold text-deep-navy">
              Sale Hero Background Image
            </label>
            <input
              type="text"
              value={config.saleBgImage ?? "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?q=80&w=2000&auto=format&fit=crop"}
              onChange={(e) => setConfig((prev) => ({ ...prev, saleBgImage: e.target.value }))}
              placeholder="https://..."
              className="w-full bg-soft-linen/30 border border-slate-grey/30 rounded px-3 py-2 text-xs font-inter focus:outline-none focus:border-deep-navy"
            />
          </div>
        </div>

        {/* Bottom Save Bar */}
        <div className="flex items-center justify-end gap-4 pt-4 border-t border-slate-grey/20">
          <Link
            href="/"
            target="_blank"
            className="px-6 py-2.5 border border-slate-grey/30 hover:bg-slate-50 text-deep-navy text-xs font-inter font-primary uppercase tracking-wider font-semibold rounded transition-colors"
          >
            Preview Storefront
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="bg-deep-navy hover:bg-ink-black text-pure-white px-8 py-2.5 rounded text-xs font-inter font-primary uppercase tracking-wider font-semibold shadow-md flex items-center gap-2 transition-colors cursor-pointer disabled:opacity-50"
          >
            {saving ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-sm">save</span>
                <span>Save Configuration</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
