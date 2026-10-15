/* eslint-disable @next/next/no-page-custom-font */
import type { Metadata } from "next";
import { Inter, Jost, Cormorant_Garamond } from "next/font/google";
import localFont from "next/font/local";
import dynamic from "next/dynamic";
import "./globals.css";
import { CartProvider } from "@/context/CartContext";
import { AuthProvider } from "@/context/AuthContext";
import { CurrencyProvider } from "@/context/CurrencyContext";
import { LaunchCountdownProvider } from "@/context/LaunchCountdownContext";
import ConditionalScriptLoader from "@/components/privacy/ConditionalScriptLoader";
import { Analytics } from "@vercel/analytics/next";

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
    process.env.NEXT_PUBLIC_SITE_URL || "https://vrixjewels.com"
  ),
  title: {
    default: "VRIX | A Luxury That Feels Like You",
    template: "%s | VRIX",
  },
  description:
    "Experience VRIX — lab-grown diamond & minimalist fine jewellery crafted with precision, emotion, and elegance. Quiet luxury and pieces made for moments that belong only to you.",
  keywords: [
    "VRIX", "luxury jewelry", "minimalist jewelry", "fine jewelry India",
    "lab-grown diamonds", "ethical jewelry", "handcrafted jewelry", "quiet luxury",
    "architectural jewelry", "gold jewelry", "designer jewelry", "VRIX jewels",
  ],
  authors: [{ name: "VRIX", url: "https://vrixjewels.com" }],
  creator: "VRIX Jewels",
  publisher: "VRIX Jewels",
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
    canonical: "https://vrixjewels.com",
  },
  icons: {
    icon: [
      { url: "/logos/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/logos/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon.ico", sizes: "any" },
    ],
    apple: [
      { url: "/logos/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
    shortcut: "/favicon.ico",
  },
  openGraph: {
    title: "VRIX | A Luxury That Feels Like You",
    description:
      "Lab-grown diamond & minimalist fine jewellery crafted with precision, emotion, and elegance. Discover modern luxury that feels personal and meaningful.",
    url: "https://vrixjewels.com",
    siteName: "VRIX Jewels",
    images: [
      {
        url: "https://vrixjewels.com/logos/blue-bg.jpg",
        width: 1200,
        height: 630,
        alt: "VRIX Jewels — A luxury that feels like you",
        type: "image/jpeg",
      },
      {
        url: "https://vrixjewels.com/logos/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "VRIX — Luxury Minimalist Jewellery",
        type: "image/jpeg",
      },
      {
        url: "https://vrixjewels.com/logos/whatsapp.jpg",
        width: 504,
        height: 504,
        alt: "VRIX Jewels WhatsApp Preview",
        type: "image/jpeg",
      },
      {
        url: "https://vrixjewels.com/logos/Facebook.jpg",
        width: 1200,
        height: 630,
        alt: "VRIX Jewels Facebook Preview",
        type: "image/jpeg",
      },
      {
        url: "https://vrixjewels.com/logos/Linkedin.jpg",
        width: 1200,
        height: 627,
        alt: "VRIX Jewels LinkedIn Preview",
        type: "image/jpeg",
      },
      {
        url: "https://vrixjewels.com/logos/instagram.jpg",
        width: 1080,
        height: 1080,
        alt: "VRIX Jewels Instagram Preview",
        type: "image/jpeg",
      },
    ],
    locale: "en_IN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "VRIX | A Luxury That Feels Like You",
    description:
      "Lab-grown diamond & minimalist fine jewellery crafted with precision, emotion, and elegance. Discover modern luxury that feels personal and meaningful.",
    images: [
      {
        url: "https://vrixjewels.com/logos/blue-bg.jpg",
        width: 1200,
        height: 630,
        alt: "VRIX Jewels — A luxury that feels like you",
      },
    ],
    creator: "@vrixjewels",
    site: "@vrixjewels",
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
      suppressHydrationWarning
      className={`${inter.variable} ${jost.variable} ${aquavit.variable} ${chancery.variable} h-full antialiased`}
    >
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" type="image/png" sizes="32x32" href="/logos/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/logos/favicon-16x16.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/logos/apple-touch-icon.png" />
        <meta property="og:image" content="https://vrixjewels.com/logos/blue-bg.jpg" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:image:alt" content="VRIX — A luxury that feels like you" />
        <link rel="preconnect" href="https://cdnjs.cloudflare.com" />
        <link rel="dns-prefetch" href="https://cdnjs.cloudflare.com" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://res.cloudinary.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://res.cloudinary.com" />
        <link rel="preconnect" href="https://images.unsplash.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://images.unsplash.com" />
        
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

      <body suppressHydrationWarning className="min-h-full flex flex-col bg-surface text-on-surface font-body-md antialiased overflow-x-hidden shop-typography">
        <AuthProvider>
          <CurrencyProvider>
            <CartProvider>
              <LaunchCountdownProvider>
                {children}
                <CookieConsentBanner />
                <ConditionalScriptLoader />
                <Analytics />
              </LaunchCountdownProvider>
            </CartProvider>
          </CurrencyProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
