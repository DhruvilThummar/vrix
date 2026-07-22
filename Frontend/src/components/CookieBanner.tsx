"use client";

import React, { useState, useEffect } from "react";

export interface CookiePreferences {
  necessary: boolean; // Always true
  analytics: boolean;
  marketing: boolean;
  personalization: boolean;
}

const DEFAULT_PREFERENCES: CookiePreferences = {
  necessary: true,
  analytics: true,
  marketing: false,
  personalization: true,
};

export default function CookieBanner() {
  const [visible, setVisible] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);
  const [preferences, setPreferences] = useState<CookiePreferences>(DEFAULT_PREFERENCES);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("vrix_cookie_consent");
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

  const saveConsent = (prefs: CookiePreferences) => {
    try {
      localStorage.setItem("vrix_cookie_consent", JSON.stringify(prefs));
      localStorage.setItem("vrix_cookie_consent_timestamp", new Date().toISOString());
    } catch (e) {}
    setPreferences(prefs);
    setVisible(false);
    setShowPreferences(false);
  };

  const handleAcceptAll = () => {
    saveConsent({
      necessary: true,
      analytics: true,
      marketing: true,
      personalization: true,
    });
  };

  const handleRejectAll = () => {
    saveConsent({
      necessary: true,
      analytics: false,
      marketing: false,
      personalization: false,
    });
  };

  const handleSaveCustom = () => {
    saveConsent(preferences);
  };

  if (!visible) return null;

  return (
    <>
      {/* Main Cookie Floating Bar */}
      <div
        role="dialog"
        aria-label="Cookie Privacy Preferences"
        className="fixed bottom-4 left-4 right-4 md:left-8 md:right-auto md:max-w-xl z-[9999] bg-deep-navy text-pure-white p-6 md:p-8 shadow-2xl border border-gold-accent/30 animate-fade-in-up"
      >
        <div className="flex flex-col gap-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-gold-accent text-2xl">cookie</span>
              <h3 className="font-display-lg text-sm md:text-base uppercase tracking-widest text-pure-white">
                Privacy &amp; Cookie Consent
              </h3>
            </div>
            <button
              onClick={handleRejectAll}
              className="text-slate-grey hover:text-white text-xs uppercase tracking-wider transition-colors"
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
        <div className="fixed inset-0 z-[10000] bg-ink-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-pure-white text-ink-black max-w-lg w-full border border-slate-grey/25 shadow-2xl p-6 md:p-8 animate-scale-in">
            <div className="flex items-center justify-between border-b border-slate-grey/20 pb-4 mb-6">
              <h3 className="font-display-lg text-lg uppercase tracking-widest text-deep-navy">
                Cookie Preferences
              </h3>
              <button
                onClick={() => setShowPreferences(false)}
                className="text-slate-grey hover:text-ink-black"
              >
                <span className="material-symbols-outlined text-xl">close</span>
              </button>
            </div>

            <p className="text-xs text-slate-grey mb-6 leading-relaxed">
              Customize your privacy preferences below. Essential cookies required for security, cart state, and currency detection cannot be disabled.
            </p>

            <div className="space-y-6 mb-8 max-h-[50vh] overflow-y-auto pr-2 custom-scrollbar">
              {/* Essential */}
              <div className="flex items-start justify-between gap-4 p-3 bg-surface-container-low/40 rounded border border-slate-grey/10">
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
                className="text-xs font-button uppercase tracking-widest text-slate-grey hover:text-ink-black px-4 py-2"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveCustom}
                className="bg-deep-navy text-pure-white font-button text-xs uppercase tracking-widest px-6 py-2.5 hover:bg-ink-black transition-colors"
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
