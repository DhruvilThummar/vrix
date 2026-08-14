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
  const [activeModalTab, setActiveModalTab] = useState<"cookies" | "dpdp">("cookies");
  const [dpdpEmail, setDpdpEmail] = useState("");
  const [dpdpStatus, setDpdpStatus] = useState<string | null>(null);
  const [dpdpLoading, setDpdpLoading] = useState(false);
  const [preferences, setPreferences] = useState<CookiePreferences>({
    necessary: true,
    analytics: false,
    marketing: false,
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

    // Update Google Consent Mode v2 parameters dynamically
    if (typeof window !== "undefined" && (window as any).gtag) {
      (window as any).gtag("consent", "update", {
        ad_storage: updated.marketing ? "granted" : "denied",
        ad_user_data: updated.marketing ? "granted" : "denied",
        ad_personalization: updated.marketing ? "granted" : "denied",
        analytics_storage: updated.analytics ? "granted" : "denied",
      });
    }

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

  const handleDpdpDataRequest = async () => {
    if (!dpdpEmail || !dpdpEmail.includes("@")) {
      setDpdpStatus("Please enter a valid email address.");
      return;
    }
    setDpdpLoading(true);
    setDpdpStatus(null);
    try {
      const baseUrl = getApiBaseUrl();
      const res = await fetch(`${baseUrl}/consent/data-request`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: dpdpEmail }),
      });
      const data = await res.json();
      setDpdpStatus(data.message || "Data request submitted.");
    } catch (e: any) {
      setDpdpStatus("Failed to submit request: " + e.message);
    } finally {
      setDpdpLoading(false);
    }
  };

  const handleDpdpWithdrawConsent = async () => {
    setDpdpLoading(true);
    setDpdpStatus(null);
    try {
      const baseUrl = getApiBaseUrl();
      const sessionId = getSessionId();
      await fetch(`${baseUrl}/consent/withdraw-consent`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, email: dpdpEmail }),
      });
      handleRejectNonEssential();
      setDpdpStatus("All optional consent withdrawn under DPDP Act 2023 Section 6(4).");
    } catch (e: any) {
      setDpdpStatus("Failed to withdraw consent: " + e.message);
    } finally {
      setDpdpLoading(false);
    }
  };

  const handleDpdpErasureRequest = async () => {
    if (!dpdpEmail || !dpdpEmail.includes("@")) {
      setDpdpStatus("Please enter your registered email address to request data erasure.");
      return;
    }
    setDpdpLoading(true);
    setDpdpStatus(null);
    try {
      const baseUrl = getApiBaseUrl();
      const sessionId = getSessionId();
      const res = await fetch(`${baseUrl}/consent/delete-account-data`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: dpdpEmail, sessionId }),
      });
      const data = await res.json();
      setDpdpStatus(data.message || "Erasure request logged successfully.");
    } catch (e: any) {
      setDpdpStatus("Failed to submit erasure request: " + e.message);
    } finally {
      setDpdpLoading(false);
    }
  };

  if (!isOpen && !showPreferencesModal) return null;

  return (
    <>
      {/* ── Floating Banner Component ── */}
      {isOpen && !showPreferencesModal && (
        <div className="fixed bottom-4 right-4 left-4 md:left-auto md:max-w-md z-50 p-6 bg-pure-white/90 backdrop-blur-md border border-slate-grey/15 shadow-[0_20px_50px_rgba(0,0,0,0.12)] transition-all duration-300 font-body-md animate-fade-in-up">
          <div className="space-y-4">
            <div className="space-y-2">
              <h3 className="font-headline-md text-xs font-bold uppercase tracking-[0.2em] text-deep-navy flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-gold-accent"></span>
                Privacy Preferences &amp; DPDP Act
              </h3>
              <p className="text-xs text-slate-grey leading-relaxed">
                We respect your personal data under India&apos;s DPDP Act 2023 &amp; global privacy standards. Choose your data preferences below.
              </p>
            </div>

            <div className="flex flex-col gap-2 pt-2">
              <button
                type="button"
                onClick={handleAcceptAll}
                className="w-full px-5 py-2.5 bg-deep-navy text-pure-white text-[10px] font-button uppercase tracking-widest hover:bg-ink-black hover:scale-[1.01] active:scale-[0.99] transition-all duration-200 cursor-pointer"
              >
                Accept All
              </button>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setActiveModalTab("cookies");
                    setShowPreferencesModal(true);
                  }}
                  className="px-3 py-2 border border-slate-grey/20 hover:border-ink-black text-ink-black text-[10px] font-button uppercase tracking-widest transition-colors cursor-pointer text-center"
                >
                  Manage
                </button>
                <button
                  type="button"
                  onClick={handleRejectNonEssential}
                  className="px-3 py-2 border border-slate-grey/20 hover:border-ink-black text-ink-black text-[10px] font-button uppercase tracking-widest transition-colors cursor-pointer text-center"
                >
                  Reject Extra
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Preferences Modal ── */}
      {showPreferencesModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 font-body-md animate-fade-in">
          <div className="bg-pure-white border border-slate-grey/15 max-w-lg w-full p-6 md:p-8 space-y-6 shadow-[0_30px_70px_rgba(0,0,0,0.2)] animate-scale-up transition-all duration-300">
            <div className="flex justify-between items-center border-b border-slate-grey/10 pb-4">
              <div className="space-y-1">
                <h3 className="font-headline-md text-sm text-ink-black font-bold uppercase tracking-wider">
                  Privacy &amp; Data Control Center
                </h3>
                <p className="text-[10px] text-slate-grey leading-none">Compliant with India DPDP Act 2023 &amp; GDPR</p>
              </div>
              <button
                onClick={() => setShowPreferencesModal(false)}
                className="text-slate-grey hover:text-ink-black text-sm p-1.5 hover:bg-soft-linen transition-colors rounded-full cursor-pointer"
                aria-label="Close modal"
              >
                ✕
              </button>
            </div>

            <div className="flex border-b border-slate-grey/15 gap-4">
              <button
                type="button"
                onClick={() => setActiveModalTab("cookies")}
                className={`pb-2 text-[10px] font-label-caps uppercase font-bold tracking-wider border-b-2 transition-all cursor-pointer ${
                  activeModalTab === "cookies"
                    ? "border-deep-navy text-deep-navy"
                    : "border-transparent text-slate-grey hover:text-deep-navy"
                }`}
              >
                Cookie Preferences
              </button>
              <button
                type="button"
                onClick={() => setActiveModalTab("dpdp")}
                className={`pb-2 text-[10px] font-label-caps uppercase font-bold tracking-wider border-b-2 transition-all cursor-pointer ${
                  activeModalTab === "dpdp"
                    ? "border-deep-navy text-deep-navy"
                    : "border-transparent text-slate-grey hover:text-deep-navy"
                }`}
              >
                DPDP Act 2023 Data Rights
              </button>
            </div>

            {activeModalTab === "cookies" ? (
              <div className="space-y-4 max-h-96 overflow-y-auto pr-1 custom-scrollbar">
                {/* Strictly Necessary (Always ON) */}
                <div className="p-4 border border-slate-grey/10 rounded-sm flex items-start justify-between gap-4 bg-soft-linen/10">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-deep-navy/5 text-deep-navy rounded mt-0.5">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="font-semibold text-xs text-ink-black uppercase tracking-wider">Strictly Essential</h4>
                      <p className="text-[11px] text-slate-grey mt-1 leading-relaxed">Required for core functions like security, checkout sessions, and preferences memory.</p>
                    </div>
                  </div>
                  <span className="font-label-caps text-[9px] text-deep-navy uppercase font-semibold px-2 py-0.5 bg-deep-navy/5 border border-deep-navy/10 shrink-0">
                    Always On
                  </span>
                </div>

                {/* Analytics Cookies */}
                <div className="p-4 border border-slate-grey/10 rounded-sm flex items-start justify-between gap-4 hover:border-slate-grey/25 transition-all">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-gold-accent/5 text-gold-accent rounded mt-0.5">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="font-semibold text-xs text-ink-black uppercase tracking-wider">Analytics &amp; Performance</h4>
                      <p className="text-[11px] text-slate-grey mt-1 leading-relaxed">Aggregated visitor metrics and diagnostic details to refine store performance.</p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-1">
                    <input
                      type="checkbox"
                      checked={preferences.analytics}
                      onChange={(e) => setPreferences({ ...preferences, analytics: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-grey/20 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-deep-navy"></div>
                  </label>
                </div>

                {/* Marketing Cookies */}
                <div className="p-4 border border-slate-grey/10 rounded-sm flex items-start justify-between gap-4 hover:border-slate-grey/25 transition-all">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-emerald-600/5 text-emerald-700 rounded mt-0.5">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="font-semibold text-xs text-ink-black uppercase tracking-wider">Marketing &amp; Campaigns</h4>
                      <p className="text-[11px] text-slate-grey mt-1 leading-relaxed">Delivers tailored announcements and tracks return on promotional campaigns.</p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-1">
                    <input
                      type="checkbox"
                      checked={preferences.marketing}
                      onChange={(e) => setPreferences({ ...preferences, marketing: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-grey/20 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-deep-navy"></div>
                  </label>
                </div>
              </div>
            ) : (
              <div className="space-y-4 max-h-96 overflow-y-auto pr-1 custom-scrollbar font-body-md text-xs">
                <div className="p-4 bg-soft-linen/20 border border-slate-grey/15 rounded space-y-3">
                  <h4 className="font-bold text-xs uppercase text-deep-navy flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    DPDP Act 2023 Data Principal Rights
                  </h4>
                  <p className="text-[11px] text-slate-grey leading-relaxed">
                    Under India&apos;s Digital Personal Data Protection Act, 2023 (DPDP Act), you have statutory rights over your personal data processed by VRIX.
                  </p>

                  <div className="space-y-2">
                    <label className="block text-[10px] font-label-caps uppercase text-slate-grey font-semibold">Registered Email Address</label>
                    <input
                      type="email"
                      value={dpdpEmail}
                      onChange={(e) => setDpdpEmail(e.target.value)}
                      placeholder="your.email@domain.com"
                      className="w-full border border-slate-grey/30 px-3 py-1.5 text-xs outline-none focus:border-deep-navy bg-pure-white rounded"
                    />
                  </div>

                  {dpdpStatus && (
                    <p className="text-[11px] p-2 bg-deep-navy/5 text-deep-navy border border-deep-navy/15 rounded font-medium">
                      {dpdpStatus}
                    </p>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
                    <button
                      type="button"
                      disabled={dpdpLoading}
                      onClick={handleDpdpDataRequest}
                      className="px-3 py-2 bg-deep-navy text-pure-white text-[9px] font-label-caps uppercase tracking-wider hover:bg-ink-black transition-colors rounded disabled:opacity-50 cursor-pointer"
                    >
                      Request My Data
                    </button>
                    <button
                      type="button"
                      disabled={dpdpLoading}
                      onClick={handleDpdpWithdrawConsent}
                      className="px-3 py-2 border border-slate-grey/30 text-ink-black text-[9px] font-label-caps uppercase tracking-wider hover:border-deep-navy transition-colors rounded disabled:opacity-50 cursor-pointer"
                    >
                      Withdraw Consent
                    </button>
                    <button
                      type="button"
                      disabled={dpdpLoading}
                      onClick={handleDpdpErasureRequest}
                      className="px-3 py-2 bg-red-600 text-pure-white text-[9px] font-label-caps uppercase tracking-wider hover:bg-red-700 transition-colors rounded disabled:opacity-50 cursor-pointer"
                    >
                      Delete My Account
                    </button>
                  </div>
                </div>

                <div className="p-3 bg-surface border border-slate-grey/15 rounded space-y-1">
                  <h5 className="font-bold text-[11px] uppercase text-deep-navy">Data Protection Officer (DPO) Contact</h5>
                  <p className="text-[11px] text-slate-grey">Email: <a href="mailto:dpo@vrix.co.in" className="underline font-semibold text-deep-navy">dpo@vrix.co.in</a></p>
                  <p className="text-[10px] text-slate-grey">VRIX Atelier, Diamond Financial District, Surat, Gujarat 395007</p>
                </div>
              </div>
            )}

            <div className="flex justify-between items-center border-t border-slate-grey/10 pt-5">
              <span className="text-[9px] text-slate-grey font-label-caps uppercase tracking-wider flex items-center gap-1.5">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                Compliance: {preferences.region} (DPDP / GDPR)
              </span>
              <button
                type="button"
                onClick={() => saveConsent(preferences, "preferences_modal")}
                className="px-6 py-2.5 bg-deep-navy text-pure-white text-[10px] font-button uppercase tracking-widest hover:bg-ink-black hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
              >
                Save Settings
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
