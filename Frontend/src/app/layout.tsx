/* eslint-disable @next/next/no-page-custom-font */
import type { Metadata } from "next";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { CartProvider } from "@/context/CartContext";
import { AuthProvider } from "@/context/AuthContext";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "600", "700"],
});

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL || 
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000")
  ),
  title: "VRIX | Luxury Minimalist Jewelry",
  description: "Experience VRIX Luxury Jewelry. Architectural minimalism, ethical materials, and quiet luxury handcrafted for your inner world and moments that belong only to you.",
  keywords: ["VRIX", "luxury jewelry", "minimalist jewelry", "ethical materials", "handcrafted jewelry", "quiet luxury"],
  icons: {
    icon: [
      { url: "/logos/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/logos/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon.ico" }
    ],
    apple: [
      { url: "/logos/apple-touch-icon.png", sizes: "180x180", type: "image/png" }
    ]
  },
  openGraph: {
    title: "VRIX | Luxury Minimalist Jewelry",
    description: "Experience VRIX Luxury Jewelry. Architectural minimalism, ethical materials, and quiet luxury handcrafted for your inner world.",
    url: "/",
    siteName: "VRIX",
    images: [
      {
        url: "/logos/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "VRIX Luxury Minimalist Jewelry",
      }
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "VRIX | Luxury Minimalist Jewelry",
    description: "Experience VRIX Luxury Jewelry. Architectural minimalism, ethical materials, and quiet luxury handcrafted for your inner world.",
    images: ["/logos/og-image.jpg"],
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
      className={`${inter.variable} ${plusJakartaSans.variable} h-full antialiased`}
    >
      <head>
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css"
          integrity="sha512-DTOQO9RWCH3ppGqcWaEA1BIZOC6xxalwEsw9c2QQeAIftl+Vegovlnee1c9QX4TctnWMn13TZye+giMm8e2LwA=="
          crossOrigin="anonymous"
          referrerPolicy="no-referrer"
        />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
        />
      </head>
      <body className="min-h-full flex flex-col bg-surface text-on-surface font-body-md antialiased overflow-x-hidden">
        <AuthProvider>
          <CartProvider>
            {children}
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
