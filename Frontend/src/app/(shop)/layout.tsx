"use client";

import dynamic from "next/dynamic";
import Header from "@/components/shop/Header";
import Footer from "@/components/shop/Footer";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { useLaunchCountdown } from "@/context/LaunchCountdownContext";

const VrixChatWidget = dynamic(() => import("@/components/chat/VrixChatWidget"), {
  ssr: false,
});

export default function ShopLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();
  const router = useRouter();
  const { isPreLaunch, isLoaded } = useLaunchCountdown();

  useEffect(() => {
    if (!isLoaded || !isPreLaunch) return;
    const allowed = pathname === "/" || pathname === "/contact" || pathname?.startsWith("/legal") || pathname?.startsWith("/delivery");
    if (!allowed) {
      router.replace("/");
    }
  }, [isPreLaunch, isLoaded, pathname, router]);

  const isDeliveryPanel = pathname === "/delivery" || pathname?.startsWith("/delivery/");
  const isFullScreen = pathname === "/modular-builder" || isDeliveryPanel;

  if (isFullScreen) {
    // Delivery deliberately keeps its independent panel styling. The modular
    // builder is still a storefront page, so it inherits global typography.
    return isDeliveryPanel ? <>{children}</> : <div className="shop-typography min-h-full">{children}</div>;
  }

  const isAllowedPreLaunch =
    pathname === "/" ||
    pathname === "/contact" ||
    pathname?.startsWith("/legal") ||
    pathname?.startsWith("/delivery");

  // If in pre-launch mode and trying to view product catalog/cart, render lock shield
  if (isLoaded && isPreLaunch && !isAllowedPreLaunch) {
    return (
      <div className="shop-typography min-h-screen bg-[#0A0D14] flex flex-col items-center justify-center p-6 text-center text-pure-white select-none">
        <div className="w-14 h-14 rounded-full border border-white/20 bg-white/5 flex items-center justify-center mb-6 backdrop-blur-md">
          <span className="material-symbols-outlined text-2xl text-white/80">hourglass_top</span>
        </div>
        <p className="font-inter font-primary text-xs uppercase tracking-[0.3em] text-white/60 mb-2">
          Exclusive Atelier Access
        </p>
        <h2 className="font-aquavit font-logo text-3xl sm:text-5xl uppercase tracking-[0.25em] mb-4 text-white">
          Unveiling Soon
        </h2>
        <p className="font-jost font-secondary text-xs sm:text-sm text-white/70 max-w-md mb-8 leading-relaxed">
          Our fine jewellery collections are currently reserved for the upcoming official launch. Please check the countdown on our homepage or contact our private client concierge.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/"
            className="px-6 py-3 bg-pure-white text-ink-black font-inter font-primary text-xs uppercase tracking-[0.2em] font-semibold rounded-xs shadow hover:bg-white/90 transition-all"
          >
            View Countdown
          </Link>
          <Link
            href="/contact"
            className="px-6 py-3 border border-white/40 hover:border-white text-white font-inter font-primary text-xs uppercase tracking-[0.2em] font-semibold rounded-xs hover:bg-white/10 transition-all"
          >
            Contact Atelier
          </Link>
        </div>
      </div>
    );
  }

  const isHomePage = pathname === "/";

  return (
    <div className="shop-typography flex min-h-full flex-1 flex-col">
      <Header />
      {/* Spacer for fixed desktop header on non-home pages */}
      {!isHomePage && (
        <div className={`hidden md:block ${isPreLaunch ? "h-[65px]" : "h-[105px]"}`} />
      )}
      <main className="shop-shell flex-grow">{children}</main>
      <Footer />
      <VrixChatWidget />
    </div>
  );
}
