"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useCurrency } from "@/context/CurrencyContext";
import { getApiBaseUrl } from "@/utils/api";

export interface CookiePreferences {
  essential: boolean; // Always true
  analytics: boolean;
  marketing: boolean;
  preferences: boolean;
  region?: string;
}

const DEFAULT_PREFERENCES: CookiePreferences = {
  essential: true,
  analytics: false, // Default OFF for GDPR & DPDP Act compliance
  marketing: false, // Default OFF for GDPR & DPDP Act compliance
  preferences: false,
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

export default function CookieConsent() {
  const { detectedCountry, detectedCountryName } = useCurrency();
  const [showBanner, setShowBanner] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [prefs, setPrefs] = useState<CookiePreferences>(DEFAULT_PREFERENCES);

  const getJurisdictionCode = useCallback(() => {
    if (["DE", "FR", "IT", "ES", "NL", "BE", "AT", "PT", "IE", "FI", "GR"].includes(detectedCountry)) return "EU";
    if (detectedCountry === "US") return "US";
    if (detectedCountry === "IN") return "IN";
    return "GLOBAL";
  }, [detectedCountry]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("vrix_cookie_consent_v1") || localStorage.getItem("vrix-cookie-consent");
      if (!saved) {
        // First visit — show banner after small delay
        const timer = setTimeout(() => setShowBanner(true), 1000);
        return () => clearTimeout(timer);
      } else {
        setPrefs(JSON.parse(saved));
      }
    } catch {}

    // Listen to open modal events from footer or privacy links
    function handleOpenModal() {
      setShowModal(true);
    }
    window.addEventListener("vrix-open-cookie-modal", handleOpenModal);
    window.addEventListener("openCookiePreferences", handleOpenModal);
    return () => {
      window.removeEventListener("vrix-open-cookie-modal", handleOpenModal);
      window.removeEventListener("openCookiePreferences", handleOpenModal);
    };
  }, []);

  const saveConsent = async (updatedPrefs: CookiePreferences, source: string = "banner") => {
    try {
      localStorage.setItem("vrix_cookie_consent_v1", JSON.stringify(updatedPrefs));
      localStorage.setItem("vrix-cookie-consent", JSON.stringify(updatedPrefs));
      localStorage.setItem("vrix-cookie-consent-date", new Date().toISOString());
      localStorage.setItem("vrix-cookie-consent-country", detectedCountry);

      setCookieHeader("vrix_consent", JSON.stringify(updatedPrefs));
    } catch {}

    setPrefs(updatedPrefs);
    setShowBanner(false);
    setShowModal(false);

    // Dispatch real-time event to load/unload third-party scripts (GA4, Meta Pixel)
    window.dispatchEvent(new CustomEvent("cookieConsentUpdated", { detail: updatedPrefs }));

    // Sync consent to PostgreSQL audit log
    try {
      const sessionId = getSessionId();

      const baseUrl = getApiBaseUrl();
      await fetch(`${baseUrl}/consent/consent`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          region: getJurisdictionCode(),
          necessary: true,
          analytics: updatedPrefs.analytics,
          marketing: updatedPrefs.marketing,
          preferences: updatedPrefs.preferences,
          consentSource: source,
        }),
      });
    } catch (err) {
      console.warn("Failed to sync consent audit log:", err);
    }
  };

  const handleAcceptAll = () => {
    saveConsent({ essential: true, analytics: true, marketing: true, preferences: true }, "banner_accept_all");
  };

  const handleRejectAll = () => {
    saveConsent({ essential: true, analytics: false, marketing: false, preferences: false }, "banner_reject_essential");
  };

  const handleSavePreferences = () => {
    saveConsent(prefs, "preferences_modal");
  };

  const handleClearAllData = () => {
    if (confirm("Are you sure? This will remove all local data, cart items, and cookie preferences.")) {
      localStorage.clear();
      sessionStorage.clear();
      window.location.reload();
    }
  };

  // Policy text per jurisdiction
  const getJurisdictionLabel = () => {
    const code = getJurisdictionCode();
    if (code === "EU") return "EU GDPR Compliant";
    if (detectedCountry === "GB") return "UK PECR / Data Protection";
    if (code === "IN") return "India DPDP Act Compliant";
    if (code === "US") return "US CCPA / CPRA Compliant";
    return "Privacy Compliant";
  };

  if (!showBanner && !showModal) return null;

  return (
    <>
      {/* ─── Bottom Banner (First Visit) ─────────────────────────────────── */}
      {showBanner && !showModal && (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-ink-black/95 text-pure-white backdrop-blur-md border-t border-slate-grey/30 p-5 md:p-6 shadow-2xl animate-fade-in font-body-md">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="space-y-1 flex-1">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-gold-accent text-lg">cookie</span>
                <h3 className="font-headline-md text-sm uppercase tracking-widest text-pure-white">
                  We respect your privacy
                </h3>
                <span className="text-[9px] font-label-caps uppercase px-2 py-0.5 border border-slate-grey/40 text-slate-grey/80 rounded-full">
                  {getJurisdictionLabel()}
                </span>
              </div>
              <p className="font-body-md text-xs text-slate-grey/90 leading-relaxed max-w-3xl">
                We use cookies and similar technologies to enhance your browsing experience, serve personalized content, and analyze our traffic. By clicking &quot;Accept All&quot;, you consent to our use of cookies. Read our{" "}
                <a href="/legal?tab=privacy" className="underline text-pure-white hover:text-gold-accent transition-colors">
                  Privacy &amp; Cookie Policy
                </a>.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setShowModal(true)}
                className="font-button text-[10px] uppercase px-4 py-2.5 border border-slate-grey/40 text-pure-white hover:bg-slate-grey/20 transition-colors cursor-pointer"
              >
                Preferences
              </button>
              <button
                type="button"
                onClick={handleRejectAll}
                className="font-button text-[10px] uppercase px-4 py-2.5 border border-slate-grey/40 text-pure-white hover:bg-slate-grey/20 transition-colors cursor-pointer"
              >
                Decline Optional
              </button>
              <button
                type="button"
                onClick={handleAcceptAll}
                className="font-button text-[10px] uppercase px-5 py-2.5 bg-pure-white text-ink-black hover:bg-soft-linen transition-colors font-bold cursor-pointer shadow-md"
              >
                Accept All
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Preferences Modal ───────────────────────────────────────────── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-black/70 backdrop-blur-sm p-4 animate-fade-in font-body-md">
          <div className="bg-pure-white text-ink-black border border-slate-grey/20 w-full max-w-lg shadow-2xl p-6 md:p-8 relative space-y-6 max-h-[90vh] overflow-y-auto">
            <button
              type="button"
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 text-slate-grey hover:text-ink-black cursor-pointer"
            >
              <span className="material-symbols-outlined">close</span>
            </button>

            <div className="border-b border-slate-grey/15 pb-4 space-y-1">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-deep-navy text-xl">tune</span>
                <h2 className="font-headline-md text-base text-deep-navy uppercase tracking-wider">
                  Cookie Preferences
                </h2>
              </div>
              <p className="text-xs text-slate-grey">
                Customize your cookie settings for {detectedCountryName || "your region"} ({getJurisdictionLabel()}).
              </p>
            </div>

            <div className="space-y-4 text-xs">
              {/* Category: Essential */}
              <div className="p-3.5 border border-slate-grey/15 bg-soft-linen/30 flex items-start justify-between gap-3">
                <div className="space-y-0.5 flex-1">
                  <p className="font-semibold text-deep-navy flex items-center gap-2">
                    Essential Cookies
                    <span className="text-[9px] font-label-caps uppercase bg-deep-navy/10 text-deep-navy px-2 py-0.5">Required</span>
                  </p>
                  <p className="text-slate-grey">Necessary for core site features, security, account login, and shopping bag functionality.</p>
                </div>
                <input type="checkbox" checked={true} disabled className="w-4 h-4 accent-deep-navy cursor-not-allowed mt-1" />
              </div>

              {/* Category: Analytics */}
              <div className="p-3.5 border border-slate-grey/15 flex items-start justify-between gap-3">
                <div className="space-y-0.5 flex-1">
                  <p className="font-semibold text-deep-navy">Analytics &amp; Performance</p>
                  <p className="text-slate-grey">Allows us to analyze site usage and improve store navigation and page speeds.</p>
                </div>
                <input
                  type="checkbox"
                  checked={prefs.analytics}
                  onChange={(e) => setPrefs({ ...prefs, analytics: e.target.checked })}
                  className="w-4 h-4 accent-deep-navy cursor-pointer mt-1"
                />
              </div>

              {/* Category: Marketing */}
              <div className="p-3.5 border border-slate-grey/15 flex items-start justify-between gap-3">
                <div className="space-y-0.5 flex-1">
                  <p className="font-semibold text-deep-navy">Marketing &amp; Personalization</p>
                  <p className="text-slate-grey">Enables tailored product recommendations, promotional offers, and relevant ads.</p>
                </div>
                <input
                  type="checkbox"
                  checked={prefs.marketing}
                  onChange={(e) => setPrefs({ ...prefs, marketing: e.target.checked })}
                  className="w-4 h-4 accent-deep-navy cursor-pointer mt-1"
                />
              </div>

              {/* Category: Preferences */}
              <div className="p-3.5 border border-slate-grey/15 flex items-start justify-between gap-3">
                <div className="space-y-0.5 flex-1">
                  <p className="font-semibold text-deep-navy">Functional Preferences</p>
                  <p className="text-slate-grey">Remembers your preferred currency, language, and regional delivery settings.</p>
                </div>
                <input
                  type="checkbox"
                  checked={prefs.preferences}
                  onChange={(e) => setPrefs({ ...prefs, preferences: e.target.checked })}
                  className="w-4 h-4 accent-deep-navy cursor-pointer mt-1"
                />
              </div>
            </div>

            <div className="border-t border-slate-grey/15 pt-4 space-y-3">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleSavePreferences}
                  className="flex-1 bg-deep-navy text-pure-white py-3 font-button text-xs uppercase tracking-widest hover:bg-ink-black transition-colors cursor-pointer"
                >
                  Save Preferences
                </button>
                <button
                  type="button"
                  onClick={handleAcceptAll}
                  className="flex-1 border border-deep-navy text-deep-navy py-3 font-button text-xs uppercase tracking-widest hover:bg-deep-navy hover:text-pure-white transition-colors cursor-pointer"
                >
                  Accept All
                </button>
              </div>

              <div className="flex items-center justify-between text-[10px] text-slate-grey pt-1">
                <button
                  type="button"
                  onClick={handleClearAllData}
                  className="hover:text-red-600 underline cursor-pointer"
                >
                  Remove all stored website data
                </button>
                <a href="/legal?tab=privacy" className="hover:text-deep-navy underline">
                  Privacy Policy
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
