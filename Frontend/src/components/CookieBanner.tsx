"use client";

import React, { useState, useEffect } from "react";
import { getApiBaseUrl } from "@/utils/api";

export interface CookiePreferences {
  necessary: boolean; // Always true
  analytics: boolean;
  marketing: boolean;
  personalization: boolean;
}

const DEFAULT_PREFERENCES: CookiePreferences = {
  necessary: true,
  analytics: false,
  marketing: false,
  personalization: false,
};

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

export default function CookieBanner() {
  const [visible, setVisible] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);
  const [preferences, setPreferences] = useState<CookiePreferences>(DEFAULT_PREFERENCES);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("vrix_cookie_consent_v1") || localStorage.getItem("vrix_cookie_consent");
      if (!saved) {
        // Show banner after short delay for fluid entrance
        const timer = setTimeout(() => setVisible(true), 1200);
        return () => clearTimeout(timer);
      } else {
        const parsed = JSON.parse(saved);
        setPreferences(parsed);
      }
    } catch (e) {
      setVisible(true);
    }
  }, []);

  const saveConsent = async (prefs: CookiePreferences, source: string = "banner") => {
    try {
      localStorage.setItem("vrix_cookie_consent_v1", JSON.stringify(prefs));
      localStorage.setItem("vrix_cookie_consent", JSON.stringify(prefs));
      localStorage.setItem("vrix_cookie_consent_timestamp", new Date().toISOString());

      setCookieHeader("vrix_consent", JSON.stringify(prefs));
    } catch (e) {}
    setPreferences(prefs);
    setVisible(false);
    setShowPreferences(false);

    // Dispatch custom event to dynamically reload tracking scripts
    window.dispatchEvent(new CustomEvent("cookieConsentUpdated", { detail: prefs }));

    // Sync to PostgreSQL backend audit endpoint
    try {
      const sessionId = getSessionId();

      const baseUrl = getApiBaseUrl();
      await fetch(`${baseUrl}/consent/consent`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          region: "GLOBAL",
          necessary: true,
          analytics: prefs.analytics,
          marketing: prefs.marketing,
          preferences: prefs.personalization,
          consentSource: source,
        }),
      });
    } catch (err) {
      console.warn("Consent audit log sync error:", err);
    }
  };

  const handleAcceptAll = () => {
    saveConsent({
      necessary: true,
      analytics: true,
      marketing: true,
      personalization: true,
    }, "banner_accept_all");
  };

  const handleRejectAll = () => {
    saveConsent({
      necessary: true,
      analytics: false,
      marketing: false,
      personalization: false,
    }, "banner_reject_essential");
  };

  const handleSaveCustom = () => {
    saveConsent(preferences, "preferences_modal");
  };

  if (!visible) return null;

  return (
    <>
      {/* Main Cookie Floating Bar */}
      <div
        role="dialog"
        aria-label="Cookie Privacy Preferences"
        className="fixed bottom-4 left-4 right-4 md:left-8 md:right-auto md:max-w-xl z-[9999] bg-deep-navy text-pure-white p-6 md:p-8 shadow-2xl border border-gold-accent/30 animate-fade-in-up font-body-md"
      >
        <div className="flex flex-col gap-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-gold-accent text-2xl">cookie</span>
              <h3 className="font-headline-md text-sm md:text-base uppercase tracking-widest text-pure-white">
                Privacy &amp; Cookie Consent
              </h3>
            </div>
            <button
              onClick={handleRejectAll}
              className="text-slate-grey hover:text-white text-xs uppercase tracking-wider transition-colors cursor-pointer"
              title="Reject non-essential cookies"
            >
              <span className="material-symbols-outlined text-base">close</span>
            </button>
          </div>

          <p className="font-body-md text-xs leading-relaxed text-slate-grey/90">
            We use cookies to enhance your browsing experience, serve personalized content, calculate regional pricing/taxes (EU, UK, US, IN), and analyze site traffic in compliance with GDPR &amp; international privacy laws.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              onClick={handleAcceptAll}
              className="bg-gold-accent text-deep-navy font-button text-[10px] uppercase tracking-widest px-5 py-2.5 hover:bg-white transition-colors cursor-pointer font-bold"
            >
              Accept All Cookies
            </button>
            <button
              onClick={handleRejectAll}
              className="border border-pure-white/20 text-pure-white font-button text-[10px] uppercase tracking-widest px-4 py-2.5 hover:bg-pure-white/10 transition-colors cursor-pointer"
            >
              Reject Non-Essential
            </button>
            <button
              onClick={() => setShowPreferences(true)}
              className="text-gold-accent hover:underline text-[10px] uppercase font-button tracking-widest py-2 px-1 cursor-pointer"
            >
              Manage Preferences
            </button>
          </div>
        </div>
      </div>

      {/* Preferences Modal */}
      {showPreferences && (
        <div className="fixed inset-0 z-[10000] bg-ink-black/80 backdrop-blur-sm flex items-center justify-center p-4 font-body-md">
          <div className="bg-pure-white text-ink-black max-w-lg w-full border border-slate-grey/25 shadow-2xl p-6 md:p-8 animate-scale-in">
            <div className="flex items-center justify-between border-b border-slate-grey/20 pb-4 mb-6">
              <h3 className="font-headline-md text-base uppercase tracking-widest text-deep-navy">
                Cookie Preferences
              </h3>
              <button
                onClick={() => setShowPreferences(false)}
                className="text-slate-grey hover:text-ink-black cursor-pointer"
              >
                <span className="material-symbols-outlined text-xl">close</span>
              </button>
            </div>

            <p className="text-xs text-slate-grey mb-6 leading-relaxed">
              Customize your privacy preferences below. Essential cookies required for security, cart state, and currency detection cannot be disabled.
            </p>

            <div className="space-y-6 mb-8 max-h-[50vh] overflow-y-auto pr-2 custom-scrollbar">
              {/* Essential */}
              <div className="flex items-start justify-between gap-4 p-3 bg-soft-linen/40 rounded border border-slate-grey/10">
                <div>
                  <h4 className="font-semibold text-xs text-deep-navy uppercase tracking-wider">Essential &amp; Security (Strictly Necessary)</h4>
                  <p className="text-[11px] text-slate-grey mt-1">Required for login sessions, cart functionality, CSRF protection, and region detection.</p>
                </div>
                <span className="text-[10px] font-label-caps uppercase bg-deep-navy text-pure-white px-2 py-1 shrink-0">Always Active</span>
              </div>

              {/* Analytics */}
              <div className="flex items-start justify-between gap-4 p-3 border border-slate-grey/10 rounded">
                <div>
                  <h4 className="font-semibold text-xs text-deep-navy uppercase tracking-wider">Analytics &amp; Performance</h4>
                  <p className="text-[11px] text-slate-grey mt-1">Helps us measure site performance and visitor journeys anonymously.</p>
                </div>
                <input
                  type="checkbox"
                  checked={preferences.analytics}
                  onChange={(e) => setPreferences({ ...preferences, analytics: e.target.checked })}
                  className="w-4 h-4 text-deep-navy rounded focus:ring-0 cursor-pointer shrink-0 mt-1"
                />
              </div>

              {/* Personalization */}
              <div className="flex items-start justify-between gap-4 p-3 border border-slate-grey/10 rounded">
                <div>
                  <h4 className="font-semibold text-xs text-deep-navy uppercase tracking-wider">Personalization &amp; Region Settings</h4>
                  <p className="text-[11px] text-slate-grey mt-1">Remembers your preferred currency, language, and custom jewelry configurations.</p>
                </div>
                <input
                  type="checkbox"
                  checked={preferences.personalization}
                  onChange={(e) => setPreferences({ ...preferences, personalization: e.target.checked })}
                  className="w-4 h-4 text-deep-navy rounded focus:ring-0 cursor-pointer shrink-0 mt-1"
                />
              </div>

              {/* Marketing */}
              <div className="flex items-start justify-between gap-4 p-3 border border-slate-grey/10 rounded">
                <div>
                  <h4 className="font-semibold text-xs text-deep-navy uppercase tracking-wider">Marketing &amp; Targeting</h4>
                  <p className="text-[11px] text-slate-grey mt-1">Used to deliver tailored promotions and luxury jewelry recommendation campaigns.</p>
                </div>
                <input
                  type="checkbox"
                  checked={preferences.marketing}
                  onChange={(e) => setPreferences({ ...preferences, marketing: e.target.checked })}
                  className="w-4 h-4 text-deep-navy rounded focus:ring-0 cursor-pointer shrink-0 mt-1"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-4 border-t border-slate-grey/20 pt-4">
              <button
                onClick={() => setShowPreferences(false)}
                className="text-xs font-button uppercase tracking-widest text-slate-grey hover:text-ink-black px-4 py-2 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveCustom}
                className="bg-deep-navy text-pure-white font-button text-xs uppercase tracking-widest px-6 py-2.5 hover:bg-ink-black transition-colors cursor-pointer"
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
