import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      // Google (user avatars, AI-generated public images)
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com-public",
      },
      // Cloudinary (media uploads — any cloud name)
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
        pathname: "/**",
      },
      // Unsplash (CMS banner images, VRIX+ page, journal defaults)
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      // CFS / Monica Vinader CDN (used in legacy sign-in promo)
      {
        protocol: "https",
        hostname: "cfs3.monicavinader.com",
      },
      // Generic CDN / product image sources
      {
        protocol: "https",
        hostname: "**.githubusercontent.com",
      },
      {
        protocol: "https",
        hostname: "cdn.shopify.com",
      },
    ],
  },
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
