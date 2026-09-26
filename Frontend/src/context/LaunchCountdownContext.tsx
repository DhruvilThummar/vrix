"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { fetchLaunchCountdown } from "@/utils/api";

export interface LaunchCountdownConfig {
  mode: "LAUNCH" | "SALE" | "DISABLED";
  targetDate: string;
  badgeText: string;
  title: string;
  subtitle: string;
  description: string;
  bgImage: string;
  bgOverlayOpacity: number;
  showAnnouncementBar: boolean;
  announcementText: string;
  announcementLinkText: string;
  announcementLinkUrl: string;
  enableWaitlist: boolean;
  waitlistSuccessMsg: string;
  contactButtonText: string;
  contactButtonUrl: string;
  autoUnlockOnZero: boolean;
  pillarsText: string;

  // Sale Mode Specific Configuration
  saleBadgeText?: string;
  saleTitle?: string;
  saleSubtitle?: string;
  saleDescription?: string;
  saleDiscountHighlight?: string;
  saleDiscountCode?: string;
  saleCtaText?: string;
  saleCtaUrl?: string;
  saleSecondaryCtaText?: string;
  saleSecondaryCtaUrl?: string;
  saleBgImage?: string;
  saleBgOverlayOpacity?: number;
  saleDisplayType?: "HERO" | "BAR" | "BOTH";
  saleShowStickyBar?: boolean;
}

export interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isExpired: boolean;
  totalSeconds: number;
}

export interface LaunchCountdownContextType {
  config: LaunchCountdownConfig;
  timeLeft: TimeLeft;
  isPreLaunch: boolean;
  isSaleCountdown: boolean;
  isLoaded: boolean;
  refreshConfig: () => Promise<void>;
  updateLocalConfig: (partial: Partial<LaunchCountdownConfig>) => void;
}

export const DEFAULT_LAUNCH_CONFIG: LaunchCountdownConfig = {
  mode: "LAUNCH",
  targetDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
  badgeText: "UNVEILING SOON",
  title: "V R I X",
  subtitle: "A luxury that feels like you.",
  description: "Lab-grown diamonds and fine jewellery crafted with architectural minimalism and quiet luxury. Our inaugural digital atelier arrives soon.",
  bgImage: "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?q=80&w=2000&auto=format&fit=crop",
  bgOverlayOpacity: 45,
  showAnnouncementBar: true,
  announcementText: "✦ OFFICIAL ATELIER LAUNCH COUNTDOWN — ENTERING A NEW ERA OF LAB-GROWN DIAMONDS ✦",
  announcementLinkText: "Contact Atelier →",
  announcementLinkUrl: "/contact",
  enableWaitlist: true,
  waitlistSuccessMsg: "Thank you. You have been added to our private VIP launch list.",
  contactButtonText: "Contact Atelier",
  contactButtonUrl: "/contact",
  autoUnlockOnZero: true,
  pillarsText: "Lab-Grown Diamonds · Architectural Minimalism · Surat Atelier · Lifetime Warranty",

  // Default Sale Mode Settings
  saleBadgeText: "✦ PRIVATE ARCHIVE EVENT ✦",
  saleTitle: "THE SOLITAIRE SALE",
  saleSubtitle: "Limited allocation of architectural lab-grown diamonds.",
  saleDescription: "Enjoy exclusive limited-time atelier pricing across selected solitaires, minimal rings, and pavé bands. Ends when the countdown reaches zero.",
  saleDiscountHighlight: "UP TO 25% OFF",
  saleDiscountCode: "VRIX15",
  saleCtaText: "Shop The Sale",
  saleCtaUrl: "/collections",
  saleSecondaryCtaText: "Explore All Pieces",
  saleSecondaryCtaUrl: "/products",
  saleBgImage: "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?q=80&w=2000&auto=format&fit=crop",
  saleBgOverlayOpacity: 55,
  saleDisplayType: "HERO",
  saleShowStickyBar: true,
};

function calculateTimeLeft(targetDateStr: string): TimeLeft {
  if (!targetDateStr) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, isExpired: true, totalSeconds: 0 };
  }
  const target = new Date(targetDateStr).getTime();
  const diff = target - Date.now();

  if (isNaN(target) || diff <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, isExpired: true, totalSeconds: 0 };
  }

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((diff / (1000 * 60)) % 60);
  const seconds = Math.floor((diff / 1000) % 60);
  const totalSeconds = Math.floor(diff / 1000);

  return { days, hours, minutes, seconds, isExpired: false, totalSeconds };
}

const LaunchCountdownContext = createContext<LaunchCountdownContextType | null>(null);

export function LaunchCountdownProvider({ children }: { children: ReactNode }) {
  const [config, setConfig] = useState<LaunchCountdownConfig>(DEFAULT_LAUNCH_CONFIG);
  const [timeLeft, setTimeLeft] = useState<TimeLeft>(() => calculateTimeLeft(DEFAULT_LAUNCH_CONFIG.targetDate));
  const [isLoaded, setIsLoaded] = useState(false);

  const refreshConfig = useCallback(async () => {
    try {
      const data = await fetchLaunchCountdown();
      if (data && typeof data === "object") {
        setConfig((prev) => ({
          ...DEFAULT_LAUNCH_CONFIG,
          ...data,
        }));
      }
    } catch (err) {
      console.warn("Could not fetch launch countdown config:", err);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  useEffect(() => {
    refreshConfig();
  }, [refreshConfig]);

  // Real-time second-by-second ticker
  useEffect(() => {
    const updateTicker = () => {
      setTimeLeft(calculateTimeLeft(config.targetDate));
    };

    updateTicker();
    const interval = setInterval(updateTicker, 1000);
    return () => clearInterval(interval);
  }, [config.targetDate]);

  const updateLocalConfig = useCallback((partial: Partial<LaunchCountdownConfig>) => {
    setConfig((prev) => ({ ...prev, ...partial }));
  }, []);

  // Pre-launch is active if mode is LAUNCH and not expired with autoUnlock
  const isPreLaunch =
    config.mode === "LAUNCH" &&
    !(config.autoUnlockOnZero && timeLeft.isExpired);

  // Sale countdown is active if mode is SALE and not expired
  const isSaleCountdown =
    config.mode === "SALE" &&
    !timeLeft.isExpired;

  return (
    <LaunchCountdownContext.Provider
      value={{
        config,
        timeLeft,
        isPreLaunch,
        isSaleCountdown,
        isLoaded,
        refreshConfig,
        updateLocalConfig,
      }}
    >
      {children}
    </LaunchCountdownContext.Provider>
  );
}

export function useLaunchCountdown() {
  const context = useContext(LaunchCountdownContext);
  if (!context) {
    throw new Error("useLaunchCountdown must be used within a LaunchCountdownProvider");
  }
  return context;
}
