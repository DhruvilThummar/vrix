/* eslint-disable @next/next/no-page-custom-font */
import type { Metadata } from "next";
import { Inter, Jost, Cormorant_Garamond } from "next/font/google";
import localFont from "next/font/local";
import dynamic from "next/dynamic";
import "./globals.css";
import { CartProvider } from "@/context/CartContext";
import { AuthProvider } from "@/context/AuthContext";
import { CurrencyProvider } from "@/context/CurrencyContext";
import ConditionalScriptLoader from "@/components/privacy/ConditionalScriptLoader";
import { Analytics } from "@vercel/analytics/react";

const CookieConsentBanner = dynamic(() => import("@/components/privacy/CookieConsentBanner"));

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["100", "300", "400", "500", "600", "700", "800", "900"],
});

const jost = Jost({
  variable: "--font-jost",
  subsets: ["latin"],
  weight: ["100", "300", "400", "500", "600", "700", "800", "900"],
});

const aquavit = Cormorant_Garamond({
  variable: "--font-aquavit",
  weight: ["300", "400", "500", "600", "700"],
  preload: false,
});

const chancery = localFont({
  src: "../../public/fonts/black-chancery/black-chancery.ttf",
  variable: "--font-chancery",
  display: "swap",
  preload: false,
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000")
  ),
  title: {
    default: "VRIX | Luxury Minimalist Jewelry",
    template: "%s | VRIX",
  },
  description:
    "Experience VRIX — luxury minimalist jewelry crafted from ethical materials. Architectural forms, quiet luxury, and pieces made for moments that belong only to you.",
  keywords: [
    "VRIX", "luxury jewelry", "minimalist jewelry", "fine jewelry India",
    "ethical jewelry", "handcrafted jewelry", "quiet luxury", "architectural jewelry",
    "silver jewelry", "gold jewelry", "designer jewelry",
  ],
  authors: [{ name: "VRIX", url: "https://vrix.vercel.app" }],
  creator: "VRIX",
  publisher: "VRIX",
  category: "Jewelry & Accessories",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  alternates: {
    canonical: "/",
  },
  icons: {
    icon: [
      { url: "/logos/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/logos/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon.ico" },
    ],
    apple: [
      { url: "/logos/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
    shortcut: "/favicon.ico",
  },
  openGraph: {
    title: "VRIX | Luxury Minimalist Jewelry",
    description:
      "Discover VRIX — where architectural minimalism meets fine jewelry. Ethical materials, quiet luxury, handcrafted for you.",
    url: "/",
    siteName: "VRIX",
    images: [
      {
        url: "/logos/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "VRIX — Luxury Minimalist Jewelry",
        type: "image/jpeg",
      },
      {
        url: "/logos/og-whatsapp.jpg",
        width: 504,
        height: 504,
        alt: "VRIX Jewelry",
        type: "image/jpeg",
      },
      {
        url: "/logos/og-instagram.jpg",
        width: 326,
        height: 326,
        alt: "VRIX",
        type: "image/jpeg",
      },
    ],
    locale: "en_IN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "VRIX | Luxury Minimalist Jewelry",
    description:
      "Discover VRIX — where architectural minimalism meets fine jewelry. Ethical materials, quiet luxury, handcrafted for you.",
    images: [
      {
        url: "/logos/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "VRIX — Luxury Minimalist Jewelry",
      },
    ],
    creator: "@vrix",
    site: "@vrix",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${jost.variable} ${aquavit.variable} ${chancery.variable} h-full antialiased`}
    >
      <head>
        {/* Google Consent Mode v2 Default Settings */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              
              // Define default consent state (denied on startup for compliance)
              gtag('consent', 'default', {
                'ad_storage': 'denied',
                'ad_user_data': 'denied',
                'ad_personalization': 'denied',
                'analytics_storage': 'denied',
                'wait_for_update': 500
              });
            `,
          }}
        />
        <link rel="preconnect" href="https://cdnjs.cloudflare.com" />
        <link rel="dns-prefetch" href="https://cdnjs.cloudflare.com" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css"
          integrity="sha512-DTOQO9RWCH3ppGqcWaEA1BIZOC6xxalwEsw9c2QQeAIftl+Vegovlnee1c9QX4TctnWMn13TZye+giMm8e2LwA=="
          crossOrigin="anonymous"
          referrerPolicy="no-referrer"
        />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap"
        />
      </head>

      <body className="min-h-full flex flex-col bg-surface text-on-surface font-body-md antialiased overflow-x-hidden shop-typography">
        <AuthProvider>
          <CurrencyProvider>
            <CartProvider>
              {children}
              <CookieConsentBanner />
              <ConditionalScriptLoader />
              <Analytics />
            </CartProvider>
          </CurrencyProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
