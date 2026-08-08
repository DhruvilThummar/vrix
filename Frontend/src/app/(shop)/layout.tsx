"use client";

import Header from "@/components/shop/Header";
import Footer from "@/components/shop/Footer";
import VrixChatWidget from "@/components/chat/VrixChatWidget";
import { usePathname } from "next/navigation";

export default function ShopLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();
  const isFullScreen = pathname === "/modular-builder";

  if (isFullScreen) {
    return <>{children}</>;
  }

  const isHomePage = pathname === "/";

  return (
    <>
      <Header />
      {/* Spacer for fixed desktop header on non-home pages */}
      {!isHomePage && <div className="hidden md:block h-[105px]" />}
      <main className="shop-shell flex-grow">{children}</main>
      <Footer />
      <VrixChatWidget />
    </>
  );
}
