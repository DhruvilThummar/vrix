"use client";

import dynamic from "next/dynamic";
import Header from "@/components/shop/Header";
import Footer from "@/components/shop/Footer";
import { usePathname } from "next/navigation";

const VrixChatWidget = dynamic(() => import("@/components/chat/VrixChatWidget"), {
  ssr: false,
});

export default function ShopLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();
  const isDeliveryPanel = pathname === "/delivery" || pathname?.startsWith("/delivery/");
  const isFullScreen = pathname === "/modular-builder" || isDeliveryPanel;

  if (isFullScreen) {
    // Delivery deliberately keeps its independent panel styling. The modular
    // builder is still a storefront page, so it inherits global typography.
    return isDeliveryPanel ? <>{children}</> : <div className="shop-typography min-h-full">{children}</div>;
  }

  const isHomePage = pathname === "/";

  return (
    <div className="shop-typography flex min-h-full flex-1 flex-col">
      <Header />
      {/* Spacer for fixed desktop header on non-home pages */}
      {!isHomePage && <div className="hidden md:block h-[105px]" />}
      <main className="shop-shell flex-grow">{children}</main>
      <Footer />
      <VrixChatWidget />
    </div>
  );
}
