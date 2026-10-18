"use client";

import React, { useState, useEffect, useMemo } from "react";
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
  const [newImageUrl, setNewImageUrl] = useState("");
  const [adminActiveSlide, setAdminActiveSlide] = useState(0);

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
          const loadedBgImages = Array.isArray(res.bgImages) && res.bgImages.length > 0
            ? res.bgImages
            : (res.bgImage ? [res.bgImage] : DEFAULT_LAUNCH_CONFIG.bgImages);

          setConfig({
            ...DEFAULT_LAUNCH_CONFIG,
            ...res,
            bgImages: loadedBgImages,
            bgImage: loadedBgImages?.[0] || DEFAULT_LAUNCH_CONFIG.bgImage,
          });
        }
      })
      .catch((err) => {
        console.error("Error loading launch countdown config:", err);
      })
      .finally(() => setLoading(false));
  }, []);

  // Compute active list of background images
  const currentBgImages = useMemo(() => {
    if (Array.isArray(config.bgImages) && config.bgImages.length > 0) {
      return config.bgImages.filter(Boolean);
    }
    return [config.bgImage || PRESET_BACKGROUNDS[0].url];
  }, [config.bgImages, config.bgImage]);

  // Live preview ticker for admin
  useEffect(() => {
    if (currentBgImages.length <= 1) return;
    const interval = setInterval(() => {
      setAdminActiveSlide((prev) => (prev + 1) % currentBgImages.length);
    }, config.slideInterval || 4000);
    return () => clearInterval(interval);
  }, [currentBgImages.length, config.slideInterval]);

  const handleAddImage = (urlToAdd?: string) => {
    const url = (urlToAdd || newImageUrl).trim();
    if (!url) {
      showToast("Please enter an image URL.");
      return;
    }
    if (currentBgImages.includes(url)) {
      showToast("This image is already in the slider.");
      return;
    }
    const updated = [...currentBgImages, url];
    setConfig((prev) => ({
      ...prev,
      bgImages: updated,
      bgImage: updated[0] || prev.bgImage,
    }));
    setNewImageUrl("");
    showToast("Added image to countdown background carousel.");
  };

  const handleRemoveImage = (indexToRemove: number) => {
    if (currentBgImages.length <= 1) {
      showToast("At least one background image is required in the carousel.");
      return;
    }
    const updated = currentBgImages.filter((_, idx) => idx !== indexToRemove);
    setConfig((prev) => ({
      ...prev,
      bgImages: updated,
      bgImage: updated[0] || "",
    }));
    showToast("Removed image from countdown carousel.");
  };

  const handleMoveImage = (fromIdx: number, toIdx: number) => {
    if (toIdx < 0 || toIdx >= currentBgImages.length) return;
    const updated = [...currentBgImages];
    const [moved] = updated.splice(fromIdx, 1);
    updated.splice(toIdx, 0, moved);
    setConfig((prev) => ({
      ...prev,
      bgImages: updated,
      bgImage: updated[0] || prev.bgImage,
    }));
  };

  const handleTogglePreset = (presetUrl: string) => {
    if (currentBgImages.includes(presetUrl)) {
      if (currentBgImages.length <= 1) {
        showToast("At least one image is required in the carousel.");
        return;
      }
      const updated = currentBgImages.filter((u) => u !== presetUrl);
      setConfig((prev) => ({
        ...prev,
        bgImages: updated,
        bgImage: updated[0] || "",
      }));
      showToast("Preset removed from carousel.");
    } else {
      const updated = [...currentBgImages, presetUrl];
      setConfig((prev) => ({
        ...prev,
        bgImages: updated,
        bgImage: updated[0] || prev.bgImage,
      }));
      showToast("Preset added to carousel.");
    }
  };

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

    if (!file.type.startsWith("image/")) {
      showToast("Please select a valid image file.");
      return;
    }

    setUploading(true);
    try {
      const res = await uploadMedia(file);
      if (res?.url) {
        const updated = currentBgImages.includes(res.url) ? currentBgImages : [...currentBgImages, res.url];
        setConfig((prev) => ({
          ...prev,
          bgImages: updated,
          bgImage: updated[0] || res.url,
        }));
        showToast("Image uploaded and added to countdown carousel!");
      }
    } catch (err: any) {
      console.warn("Server upload failed, falling back to local base64 preview:", err);
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === "string") {
          const base64 = reader.result as string;
          const updated = [...currentBgImages, base64];
          setConfig((prev) => ({
            ...prev,
            bgImages: updated,
            bgImage: updated[0] || base64,
          }));
          showToast("Image loaded and added to carousel (Client Preview).");
        }
      };
      reader.onerror = () => {
        showToast(err.message || "Failed to upload image.");
      };
      reader.readAsDataURL(file);
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload: LaunchCountdownConfig = {
        ...config,
        bgImages: currentBgImages,
        bgImage: currentBgImages[0] || config.bgImage || DEFAULT_LAUNCH_CONFIG.bgImage,
      };
      await updateLaunchCountdown(payload);
      setConfig(payload);
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
                {config.showTimer === false
                  ? config.timerCustomText
                    ? "Custom Text Display (Timer Off)"
                    : "Timer Hidden (Only Launch Content Shown)"
                  : isExpired
                  ? "Time Expired / Target Reached"
                  : "Time Remaining to Launch"}
              </h4>
              <p className="font-jost font-secondary text-xs text-white/70 mt-1">
                Target: {new Date(config.targetDate).toLocaleString(undefined, { dateStyle: "full", timeStyle: "short" })}
              </p>
            </div>

            {config.showTimer !== false ? (
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
            ) : config.timerCustomText ? (
              <div className="bg-amber-400/10 border border-amber-300/30 px-5 py-3 rounded text-center">
                <span className="text-[10px] uppercase tracking-widest text-amber-200/70 block font-inter mb-1">Custom Text Display</span>
                <span className="text-lg sm:text-xl font-light text-white tracking-widest uppercase font-serif drop-shadow-[0_2px_10px_rgba(255,232,178,0.3)]">
                  {config.timerCustomText}
                </span>
              </div>
            ) : (
              <div className="bg-white/5 border border-white/15 px-5 py-3 rounded text-center">
                <span className="text-xs text-white/50 uppercase tracking-wider font-inter">
                  Timer Hidden (Only Rest of Launch Hero Shown)
                </span>
              </div>
            )}
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

          {/* Timer Visibility Toggle & Custom Text Replacement */}
          <div className="pt-4 border-t border-slate-grey/15 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-inter font-primary text-xs uppercase tracking-wider font-semibold text-deep-navy">
                  Show Countdown Timer (Days / Hours / Mins / Secs)
                </p>
                <p className="font-jost font-secondary text-[11px] text-slate-grey">
                  Turn ON to show ticking countdown numbers. Turn OFF to hide ONLY the timer block from the launch hero while keeping the rest of the launch page completely active.
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.showTimer !== false}
                  onChange={(e) => setConfig((prev) => ({ ...prev, showTimer: e.target.checked }))}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-deep-navy"></div>
              </label>
            </div>

            {/* Custom Text In Place of Timer */}
            {config.showTimer === false && (
              <div className="bg-soft-linen/35 border border-slate-grey/25 rounded-md p-4 space-y-2 animate-fade-in">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-inter font-primary uppercase tracking-wider font-semibold text-deep-navy">
                    Custom Text in Place of Timer (Optional)
                  </label>
                  <span className="text-[10px] font-inter text-slate-grey">
                    Replaces countdown numbers
                  </span>
                </div>
                <input
                  type="text"
                  value={config.timerCustomText || ""}
                  onChange={(e) => setConfig((prev) => ({ ...prev, timerCustomText: e.target.value }))}
                  placeholder="e.g. LAUNCHING VERY SOON / THE DIGITAL ATELIER ARRIVES (Leave blank to show nothing)"
                  className="w-full bg-white border border-slate-grey/30 rounded px-3 py-2 text-xs font-inter focus:outline-none focus:border-deep-navy"
                />
                <p className="font-jost font-secondary text-[11px] text-slate-grey">
                  When the timer is turned off, this text will appear in place of the countdown numbers. If left blank, only the timer is removed, keeping everything else (Waitlist, Background, Title, Details) in place.
                </p>
              </div>
            )}
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

          {/* ══════════════════════════════════════════════════════════════════════════════
              HERO BACKGROUND IMAGE CAROUSEL & SLIDES MANAGER (STORE HERO STYLE)
              ══════════════════════════════════════════════════════════════════════════════ */}
          <div className="space-y-6 pt-5 border-t border-slate-grey/20">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-xs font-inter font-primary uppercase tracking-wider font-bold text-deep-navy">
                    Hero Background Carousel (Changing Images)
                  </h3>
                  <span className="px-2 py-0.5 rounded text-[10px] font-inter font-semibold bg-deep-navy/10 text-deep-navy">
                    {currentBgImages.length} {currentBgImages.length === 1 ? "Image" : "Images"} in Carousel
                  </span>
                </div>
                <p className="font-jost font-secondary text-[11px] text-slate-grey mt-0.5">
                  Just like the store hero section, background images automatically transition with smooth crossfade animations. Manage which images to include, their order, and timing.
                </p>
              </div>

              {/* Slide Interval Speed Controls */}
              <div className="flex items-center gap-1.5 self-start sm:self-auto bg-slate-100 p-1 rounded border border-slate-grey/20">
                <span className="text-[10px] font-inter uppercase tracking-wider font-medium text-slate-grey px-1.5">
                  Interval:
                </span>
                {[3000, 4000, 5000, 6000].map((ms) => (
                  <button
                    key={ms}
                    type="button"
                    onClick={() => setConfig((prev) => ({ ...prev, slideInterval: ms }))}
                    className={`px-2 py-1 rounded text-[10px] font-inter font-semibold transition-all cursor-pointer ${
                      (config.slideInterval || 4000) === ms
                        ? "bg-deep-navy text-white shadow-xs"
                        : "text-slate-600 hover:text-deep-navy hover:bg-white"
                    }`}
                  >
                    {ms / 1000}s
                  </button>
                ))}
              </div>
            </div>

            {/* Interactive Live Mini Preview of the Carousel */}
            <div className="relative w-full h-44 sm:h-52 rounded-lg overflow-hidden border border-slate-grey/30 bg-[#0A0805] shadow-inner flex items-center justify-center">
              {/* Slides with crossfade transition matching storefront */}
              {currentBgImages.map((imgUrl, idx) => (
                <div
                  key={`${imgUrl}-${idx}`}
                  className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
                    idx === adminActiveSlide ? "opacity-100 z-10" : "opacity-0 z-0 pointer-events-none"
                  }`}
                >
                  <img
                    src={imgUrl}
                    alt={`Preview slide ${idx + 1}`}
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}

              {/* Overlay with admin opacity slider value */}
              <div
                className="absolute inset-0 bg-black z-20 pointer-events-none transition-opacity duration-300"
                style={{ opacity: (config.bgOverlayOpacity || 45) / 100 }}
              />
              <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/80 pointer-events-none z-20" />

              {/* Mockup Brand & Countdown Overlay */}
              <div className="relative z-30 flex flex-col items-center justify-center text-center text-white px-4">
                <span className="text-[8px] sm:text-[9px] font-inter uppercase tracking-[0.2em] text-white/60 mb-0.5">
                  {config.badgeText || "UNVEILING SOON"}
                </span>
                <span className="font-aquavit text-lg sm:text-2xl tracking-[0.3em] font-light mb-1">
                  {config.title || "V R I X"}
                </span>
                <span className="font-jost italic text-[10px] sm:text-[11px] text-white/80 max-w-xs mb-2">
                  {config.subtitle || "A luxury that feels like you."}
                </span>

                {/* Mini timer digits */}
                <div className="flex items-center gap-1.5 bg-black/40 backdrop-blur-xs px-3 py-1 rounded border border-white/15">
                  <span className="font-inter text-xs tabular-nums font-semibold">{String(days).padStart(2, "0")}d</span>
                  <span className="text-white/40 text-[10px]">:</span>
                  <span className="font-inter text-xs tabular-nums font-semibold">{String(hours).padStart(2, "0")}h</span>
                  <span className="text-white/40 text-[10px]">:</span>
                  <span className="font-inter text-xs tabular-nums font-semibold">{String(minutes).padStart(2, "0")}m</span>
                  <span className="text-white/40 text-[10px]">:</span>
                  <span className="font-inter text-xs tabular-nums font-semibold text-amber-300">{String(seconds).padStart(2, "0")}s</span>
                </div>
              </div>

              {/* Slide indicators in preview */}
              {currentBgImages.length > 1 && (
                <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 z-30 flex items-center gap-1.5">
                  {currentBgImages.map((_, dotIdx) => (
                    <button
                      key={dotIdx}
                      type="button"
                      onClick={() => setAdminActiveSlide(dotIdx)}
                      className={`h-1 transition-all duration-300 rounded-full cursor-pointer ${
                        dotIdx === adminActiveSlide ? "w-5 bg-amber-300" : "w-1.5 bg-white/40"
                      }`}
                      aria-label={`Jump to slide ${dotIdx + 1}`}
                    />
                  ))}
                </div>
              )}

              <div className="absolute top-2.5 left-2.5 z-30 px-2 py-0.5 rounded bg-black/70 backdrop-blur-xs text-[9px] font-inter uppercase tracking-wider text-white border border-white/20">
                Live Carousel Preview · Slide {adminActiveSlide + 1} of {currentBgImages.length}
              </div>
            </div>

            {/* Active Slides Management Grid ("kya rakhva and kya n rakhva") */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-inter font-primary uppercase tracking-wider font-semibold text-deep-navy">
                  Active Carousel Slides ({currentBgImages.length})
                </label>
                <span className="text-[10px] font-inter text-slate-grey">
                  Reorder slides or remove them below
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5">
                {currentBgImages.map((imgUrl, sIdx) => {
                  const isFirst = sIdx === 0;
                  const isLast = sIdx === currentBgImages.length - 1;
                  return (
                    <div
                      key={sIdx}
                      className="bg-soft-linen/30 border border-slate-grey/25 rounded-md overflow-hidden flex flex-col justify-between group hover:border-deep-navy/40 transition-all shadow-2xs"
                    >
                      {/* Image Thumbnail */}
                      <div className="relative aspect-video w-full bg-black/10 overflow-hidden">
                        <img
                          src={imgUrl}
                          alt={`Slide ${sIdx + 1}`}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        {/* Slide order badge */}
                        <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-black/75 backdrop-blur-xs text-[9px] font-inter font-semibold uppercase tracking-wider text-white">
                          {isFirst ? "Slide #1 (Cover)" : `Slide #${sIdx + 1}`}
                        </div>

                        {/* Quick remove button on thumbnail hover */}
                        <button
                          type="button"
                          onClick={() => handleRemoveImage(sIdx)}
                          className="absolute top-2 right-2 w-6 h-6 rounded-full bg-red-600/90 hover:bg-red-700 text-white flex items-center justify-center transition-all cursor-pointer shadow"
                          title="Remove from Carousel"
                        >
                          <span className="material-symbols-outlined text-xs">close</span>
                        </button>
                      </div>

                      {/* Controls Footer */}
                      <div className="p-2.5 bg-white space-y-2 border-t border-slate-grey/15">
                        <div className="truncate text-[10px] font-mono text-slate-grey" title={imgUrl}>
                          {imgUrl.length > 40 ? "..." + imgUrl.slice(-35) : imgUrl}
                        </div>

                        <div className="flex items-center justify-between gap-1 pt-1 border-t border-slate-grey/10">
                          {/* Reorder Left */}
                          <button
                            type="button"
                            onClick={() => handleMoveImage(sIdx, sIdx - 1)}
                            disabled={isFirst}
                            className="p-1 rounded bg-slate-100 hover:bg-deep-navy hover:text-white text-slate-700 disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer flex items-center gap-0.5 text-[10px] font-inter"
                            title="Move Earlier"
                          >
                            <span className="material-symbols-outlined text-xs">arrow_back</span>
                            <span>Left</span>
                          </button>

                          {/* Reorder Right */}
                          <button
                            type="button"
                            onClick={() => handleMoveImage(sIdx, sIdx + 1)}
                            disabled={isLast}
                            className="p-1 rounded bg-slate-100 hover:bg-deep-navy hover:text-white text-slate-700 disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer flex items-center gap-0.5 text-[10px] font-inter"
                            title="Move Later"
                          >
                            <span>Right</span>
                            <span className="material-symbols-outlined text-xs">arrow_forward</span>
                          </button>

                          {/* Delete */}
                          <button
                            type="button"
                            onClick={() => handleRemoveImage(sIdx)}
                            className="p-1 px-2 rounded text-red-600 hover:bg-red-50 text-[10px] font-inter font-semibold transition-colors cursor-pointer"
                            title="Remove image from carousel"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Add Image Bar (Upload + URL) */}
            <div className="bg-soft-linen/40 border border-slate-grey/25 rounded-md p-4 space-y-3">
              <label className="block text-xs font-inter font-primary uppercase tracking-wider font-semibold text-deep-navy">
                Add Images to Countdown Carousel
              </label>

              <div className="flex flex-col sm:flex-row gap-2.5">
                <input
                  type="text"
                  value={newImageUrl}
                  onChange={(e) => setNewImageUrl(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddImage();
                    }
                  }}
                  placeholder="Paste direct image URL (https://images.unsplash.com/...)"
                  className="flex-1 bg-white border border-slate-grey/30 rounded px-3 py-2 text-xs font-inter focus:outline-none focus:border-deep-navy"
                />
                <button
                  type="button"
                  onClick={() => handleAddImage()}
                  disabled={!newImageUrl.trim()}
                  className="px-4 py-2 bg-deep-navy text-white rounded text-xs font-inter font-semibold uppercase tracking-wider hover:bg-ink-black transition-colors disabled:opacity-40 cursor-pointer flex items-center justify-center gap-1.5 shrink-0"
                >
                  <span className="material-symbols-outlined text-sm">add</span>
                  <span>Add URL</span>
                </button>

                <label className="px-4 py-2 bg-white border border-slate-grey/30 hover:bg-slate-100 text-deep-navy text-xs font-inter font-semibold rounded cursor-pointer transition-colors shrink-0 flex items-center justify-center gap-1.5">
                  <span className="material-symbols-outlined text-sm">upload</span>
                  <span>{uploading ? "Uploading..." : "Upload New Photo"}</span>
                  <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" disabled={uploading} />
                </label>
              </div>
              <p className="font-jost font-secondary text-[11px] text-slate-grey">
                Upload images or paste direct links. Any added images will automatically loop into the countdown hero slider.
              </p>
            </div>

            {/* Preset Library with Toggle (Click to add or remove from carousel) */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-inter text-slate-grey uppercase tracking-wider font-medium">
                  Curated Luxury Presets (Click to add/remove from carousel):
                </p>
                <span className="text-[10px] font-inter text-slate-grey">
                  Toggle on/off with 1-click
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {PRESET_BACKGROUNDS.map((preset, idx) => {
                  const isInCarousel = currentBgImages.includes(preset.url);
                  return (
                    <div
                      key={idx}
                      onClick={() => handleTogglePreset(preset.url)}
                      className={`relative aspect-video rounded-md overflow-hidden border-2 cursor-pointer transition-all group ${
                        isInCarousel
                          ? "border-emerald-600 ring-2 ring-emerald-600/30 shadow-xs"
                          : "border-slate-grey/25 hover:border-deep-navy/60 opacity-75 hover:opacity-100"
                      }`}
                    >
                      <img
                        src={preset.url}
                        alt={preset.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent flex flex-col justify-between p-2">
                        {/* Top badge */}
                        <div className="self-end">
                          {isInCarousel ? (
                            <span className="px-1.5 py-0.5 rounded bg-emerald-600 text-white text-[9px] font-inter font-bold uppercase tracking-wider flex items-center gap-0.5 shadow">
                              <span className="material-symbols-outlined text-[10px]">check</span>
                              <span>In Slider</span>
                            </span>
                          ) : (
                            <span className="px-1.5 py-0.5 rounded bg-black/60 text-white/80 text-[9px] font-inter uppercase tracking-wider group-hover:bg-deep-navy">
                              + Add
                            </span>
                          )}
                        </div>

                        {/* Bottom label */}
                        <div>
                          <p className="text-[10px] text-white font-inter tracking-wider font-medium truncate">
                            {preset.name}
                          </p>
                          <span className="text-[8px] text-white/70 block">
                            {isInCarousel ? "Click to remove" : "Click to add"}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Dark Dimming Overlay Slider */}
            <div className="pt-2 bg-soft-linen/25 p-4 rounded-md border border-slate-grey/20">
              <div className="flex justify-between items-center mb-1.5">
                <div>
                  <label className="text-xs font-inter font-primary uppercase tracking-wider font-semibold text-deep-navy">
                    Background Dimming Overlay
                  </label>
                  <p className="font-jost font-secondary text-[11px] text-slate-grey">
                    Controls dark tint opacity over all images so countdown numbers and typography remain perfectly legible.
                  </p>
                </div>
                <span className="text-sm font-inter font-bold text-deep-navy px-2.5 py-1 bg-white rounded border border-slate-grey/20 shadow-2xs">
                  {config.bgOverlayOpacity || 45}%
                </span>
              </div>
              <input
                type="range"
                min="10"
                max="85"
                step="5"
                value={config.bgOverlayOpacity || 45}
                onChange={(e) => setConfig((prev) => ({ ...prev, bgOverlayOpacity: Number(e.target.value) }))}
                className="w-full accent-deep-navy cursor-pointer mt-2"
              />
              <div className="flex justify-between text-[10px] text-slate-grey font-inter mt-1">
                <span>10% (Subtle)</span>
                <span>45% (Recommended)</span>
                <span>85% (Deep Noir)</span>
              </div>
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
                value={config.saleDiscountCode ?? ""}
                onChange={(e) => setConfig((prev) => ({ ...prev, saleDiscountCode: e.target.value.toUpperCase() }))}
                placeholder="e.g. ARCHIVE20 (Optional)"
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
