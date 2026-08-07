"use client";

import React, { useState, useEffect } from "react";
import { getApiBaseUrl } from "@/utils/api";

export interface CookiePreferences {
  necessary: boolean;
  analytics: boolean;
  marketing: boolean;
  preferences: boolean;
  region: "EU" | "US" | "IN" | "GLOBAL";
}

const STORAGE_KEY = "vrix_cookie_consent_v1";

function setCookieHeader(name: string, val: string) {
  if (typeof document !== "undefined") {
    document.cookie = `${name}=${encodeURIComponent(val)}; path=/; max-age=31536000; SameSite=Lax`;
  }
}

function getSessionId(): string {
  if (typeof window === "undefined") return "";
  let id = localStorage.getItem("vrix_session_id");
  if (!id) {
    id = typeof crypto !== "undefined" && crypto.randomUUID
      ? `sess_${crypto.randomUUID()}`
      : `sess_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    localStorage.setItem("vrix_session_id", id);
  }
  return id;
}

export default function CookieConsentBanner() {
  const [isOpen, setIsOpen] = useState(false);
  const [showPreferencesModal, setShowPreferencesModal] = useState(false);
  const [preferences, setPreferences] = useState<CookiePreferences>({
    necessary: true,
    analytics: false, // Default OFF for EU & IN (GDPR & DPDP Act compliance)
    marketing: false, // Default OFF for EU & IN
    preferences: false,
    region: "GLOBAL",
  });

  useEffect(() => {
    // 1. Check existing client consent state
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setPreferences(parsed);
        return; // Banner remains closed if consent already recorded
      } catch (e) {}
    }

    // 2. Auto-detect region defaults via Browser Timezone
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || "";
    let detectedRegion: "EU" | "US" | "IN" | "GLOBAL" = "GLOBAL";

    if (tz.includes("Europe")) detectedRegion = "EU";
    else if (tz.includes("America") || tz.includes("US")) detectedRegion = "US";
    else if (tz.includes("Kolkata") || tz.includes("Asia/Calcutta")) detectedRegion = "IN";

    // Set region defaults (US defaults ON for analytics under CCPA opt-out model)
    setPreferences((prev) => ({
      ...prev,
      region: detectedRegion,
      analytics: detectedRegion === "US",
      marketing: detectedRegion === "US",
    }));

    setIsOpen(true);
  }, []);

  // Listen for custom trigger to re-open modal (e.g. from footer privacy settings link)
  useEffect(() => {
    const handleReopen = () => {
      setShowPreferencesModal(true);
    };
    window.addEventListener("openCookiePreferences", handleReopen);
    return () => window.removeEventListener("openCookiePreferences", handleReopen);
  }, []);

  const saveConsent = async (updated: CookiePreferences, source: string) => {
    // Save to localStorage & cookie
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    setCookieHeader("vrix_consent", JSON.stringify(updated));

    // Ensure session ID exists for audit trail
    const sessionId = getSessionId();

    // Dispatch custom event to dynamically reload third-party scripts
    window.dispatchEvent(new CustomEvent("cookieConsentUpdated", { detail: updated }));

    setIsOpen(false);
    setShowPreferencesModal(false);

    // Sync to PostgreSQL backend audit endpoint
    try {
      const baseUrl = getApiBaseUrl();
      await fetch(`${baseUrl}/consent/consent`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          region: updated.region,
          necessary: true,
          analytics: updated.analytics,
          marketing: updated.marketing,
          preferences: updated.preferences,
          consentSource: source,
        }),
      });
    } catch (err) {
      console.error("Failed to sync consent to audit log:", err);
    }
  };

  const handleAcceptAll = () => {
    const allOn: CookiePreferences = {
      ...preferences,
      necessary: true,
      analytics: true,
      marketing: true,
      preferences: true,
    };
    setPreferences(allOn);
    saveConsent(allOn, "banner_accept_all");
  };

  const handleRejectNonEssential = () => {
    const essentialOnly: CookiePreferences = {
      ...preferences,
      necessary: true,
      analytics: false,
      marketing: false,
      preferences: false,
    };
    setPreferences(essentialOnly);
    saveConsent(essentialOnly, "banner_reject_essential");
  };

  if (!isOpen && !showPreferencesModal) return null;

  return (
    <>
      {/* ── Floating Banner Component ── */}
      {isOpen && !showPreferencesModal && (
        <div className="fixed bottom-0 inset-x-0 z-50 p-4 md:p-6 bg-pure-white/95 backdrop-blur-md border-t border-slate-grey/20 shadow-2xl transition-all font-body-md">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-4 text-sm text-ink-black">
            <div className="space-y-1 max-w-3xl">
              <h3 className="font-headline-md text-sm font-semibold uppercase tracking-widest text-deep-navy">
                Privacy &amp; Data Preferences
              </h3>
              <p className="text-xs text-slate-grey leading-relaxed">
                We use cookies to enhance browsing, analyze traffic, and deliver personalized recommendations. Under GDPR, CCPA, and India DPDP Act, you control your choices.
              </p>
            </div>

            <div className="flex flex-wrap gap-2 shrink-0">
              <button
                type="button"
                onClick={handleRejectNonEssential}
                className="px-4 py-2.5 border border-slate-grey/30 hover:border-ink-black text-ink-black text-[11px] font-button uppercase tracking-widest transition-colors cursor-pointer"
              >
                Reject Non-Essential
              </button>
              <button
                type="button"
                onClick={() => setShowPreferencesModal(true)}
                className="px-4 py-2.5 border border-slate-grey/30 hover:border-ink-black text-ink-black text-[11px] font-button uppercase tracking-widest transition-colors cursor-pointer"
              >
                Manage Preferences
              </button>
              <button
                type="button"
                onClick={handleAcceptAll}
                className="px-5 py-2.5 bg-deep-navy text-pure-white text-[11px] font-button uppercase tracking-widest hover:bg-ink-black transition-colors cursor-pointer"
              >
                Accept All
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Preferences Modal ── */}
      {showPreferencesModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 font-body-md">
          <div className="bg-pure-white border border-slate-grey/20 max-w-xl w-full p-6 space-y-6 shadow-2xl animate-fade-in">
            <div className="flex justify-between items-center border-b border-slate-grey/20 pb-3">
              <h3 className="font-headline-md text-base text-ink-black font-semibold uppercase tracking-wider">
                Manage Cookie Preferences
              </h3>
              <button
                onClick={() => setShowPreferencesModal(false)}
                className="text-slate-grey hover:text-ink-black text-lg font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 max-h-96 overflow-y-auto pr-1">
              {/* Strictly Necessary (Always ON) */}
              <div className="p-4 bg-soft-linen/30 border border-slate-grey/15 rounded-xs flex items-center justify-between gap-4">
                <div>
                  <h4 className="font-medium text-xs text-ink-black uppercase tracking-wider">Strictly Necessary Cookies</h4>
                  <p className="text-[11px] text-slate-grey mt-0.5">Essential for website navigation, security, and shopping cart functionality.</p>
                </div>
                <span className="font-label-caps text-[9px] text-deep-navy uppercase font-semibold px-2.5 py-1 bg-deep-navy/10 shrink-0">
                  Always Active
                </span>
              </div>

              {/* Analytics Cookies */}
              <div className="p-4 bg-soft-linen/30 border border-slate-grey/15 rounded-xs flex items-center justify-between gap-4">
                <div>
                  <h4 className="font-medium text-xs text-ink-black uppercase tracking-wider">Analytics &amp; Performance</h4>
                  <p className="text-[11px] text-slate-grey mt-0.5">Helps us understand visitor traffic and usage patterns (e.g. Google Analytics).</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer shrink-0">
                  <input
                    type="checkbox"
                    checked={preferences.analytics}
                    onChange={(e) => setPreferences({ ...preferences, analytics: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-slate-grey/30 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-deep-navy"></div>
                </label>
              </div>

              {/* Marketing Cookies */}
              <div className="p-4 bg-soft-linen/30 border border-slate-grey/15 rounded-xs flex items-center justify-between gap-4">
                <div>
                  <h4 className="font-medium text-xs text-ink-black uppercase tracking-wider">Marketing &amp; Targeting</h4>
                  <p className="text-[11px] text-slate-grey mt-0.5">Used to deliver tailored announcements and measure campaign performance (e.g. Meta Pixel).</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer shrink-0">
                  <input
                    type="checkbox"
                    checked={preferences.marketing}
                    onChange={(e) => setPreferences({ ...preferences, marketing: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-slate-grey/30 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-deep-navy"></div>
                </label>
              </div>
            </div>

            <div className="flex justify-between items-center border-t border-slate-grey/20 pt-4">
              <span className="text-[10px] text-slate-grey font-label-caps uppercase tracking-widest">
                Region: {preferences.region}
              </span>
              <button
                type="button"
                onClick={() => saveConsent(preferences, "preferences_modal")}
                className="px-6 py-2.5 bg-deep-navy text-pure-white text-[11px] font-button uppercase tracking-widest hover:bg-ink-black transition-colors cursor-pointer"
              >
                Save Preferences
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
