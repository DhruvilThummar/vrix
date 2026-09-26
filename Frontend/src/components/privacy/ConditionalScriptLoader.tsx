"use client";

import React, { useState, useEffect } from "react";
import Script from "next/script";
import { CookiePreferences } from "./CookieConsentBanner";

const STORAGE_KEY = "vrix_cookie_consent_v1";

export default function ConditionalScriptLoader() {
  const [consent, setConsent] = useState<CookiePreferences | null>(null);

  useEffect(() => {
    // Ensure window.dataLayer & gtag function exist + Google Consent Mode v2 Default
    if (typeof window !== "undefined") {
      (window as any).dataLayer = (window as any).dataLayer || [];
      if (!(window as any).gtag) {
        (window as any).gtag = function (...args: any[]) {
          (window as any).dataLayer.push(args);
        };
      }
      (window as any).gtag("consent", "default", {
        ad_storage: "denied",
        ad_user_data: "denied",
        ad_personalization: "denied",
        analytics_storage: "denied",
        wait_for_update: 500,
      });
    }

    // Read initial consent from storage
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setConsent(parsed);
        if (parsed.analytics) {
          (window as any).gtag("consent", "update", {
            analytics_storage: "granted",
          });
        }
        if (parsed.marketing) {
          (window as any).gtag("consent", "update", {
            ad_storage: "granted",
            ad_user_data: "granted",
            ad_personalization: "granted",
          });
        }
      } catch (e) {}
    }

    // Listen for real-time consent updates from banner
    const handleUpdate = (e: CustomEvent<CookiePreferences>) => {
      setConsent(e.detail);
    };

    window.addEventListener("cookieConsentUpdated", handleUpdate as EventListener);
    return () => window.removeEventListener("cookieConsentUpdated", handleUpdate as EventListener);
  }, []);

  if (!consent) return null;

  return (
    <>
      {/* ── Analytics Category (Google Analytics 4) ── */}
      {consent.analytics && (
        <>
          <Script
            src="https://www.googletagmanager.com/gtag/js?id=G-4MHMGSMVEE"
            strategy="afterInteractive"
          />
          <Script id="google-analytics" strategy="afterInteractive">
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', 'G-4MHMGSMVEE', { page_path: window.location.pathname });
            `}
          </Script>
        </>
      )}

      {/* ── Marketing Category (Meta Pixel) ── */}
      {consent.marketing && (
        <Script id="meta-pixel" strategy="afterInteractive">
          {`
            !function(f,b,e,v,n,t,s)
            {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
            n.callMethod.apply(n,arguments):n.queue.push(arguments)};
            if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
            n.queue=[];t=b.createElement(e);t.async=!0;
            t.src=v;s=b.getElementsByTagName(e)[0];
            s.parentNode.insertBefore(t,s)}(window, document,'script',
            'https://connect.facebook.net/en_US/fbevents.js');
            fbq('init', 'YOUR_PIXEL_ID');
            fbq('track', 'PageView');
          `}
        </Script>
      )}
    </>
  );
}
