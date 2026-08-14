"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { fetchDbPublic as fetchDb } from "@/utils/api";

const DEFAULT_DATA = {
  heroTitle: "Sustainable Luxury",
  bannerImage: "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?q=80&w=1600&auto=format&fit=crop",
  content: "Sustainability is at the core of VRIX identity. By utilizing solar-powered lab-grown diamonds, 100% recycled precious metals, plastic-free FSC-certified signature gift boxes, and carbon-neutral studio logistics, we prove that luxury can be modern, personal, and profoundly responsible."
};

export default function SustainabilityPage() {
  const [pageData, setPageData] = useState(DEFAULT_DATA);

  useEffect(() => {
    fetchDb()
      .then((res) => {
        if (res.custom_pages && res.custom_pages.sustainability) {
          setPageData({ ...DEFAULT_DATA, ...res.custom_pages.sustainability });
        }
      })
      .catch((err) => console.error("Error loading CMS data:", err));
  }, []);

  return (
    <div className="w-full flex flex-col items-center min-h-[70vh] bg-surface pb-section-gap">
      {pageData.bannerImage ? (
        <section className="relative w-full h-[50vh] min-h-[400px] flex items-center justify-center overflow-hidden bg-deep-navy mb-section-gap">
          <Image
            alt={pageData.heroTitle}
            fill
            className="object-cover object-center opacity-70"
            src={pageData.bannerImage}
            priority
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-ink-black/30"></div>
          <div className="relative z-10 text-center px-margin-mobile">
            <h1 className="script-hero text-6xl md:text-8xl text-pure-white font-light tracking-wide drop-shadow-sm">
              {pageData.heroTitle}
            </h1>
          </div>
        </section>
      ) : (
        <div className="w-full pt-section-gap pb-8 px-margin-mobile text-center">
          <h1 className="font-display-lg text-4xl md:text-5xl text-deep-navy uppercase mb-stack-md tracking-wider">
            {pageData.heroTitle}
          </h1>
          <div className="w-12 h-px bg-slate-grey/30 mx-auto"></div>
        </div>
      )}

      <div className="px-margin-mobile max-w-3xl mx-auto text-center mt-8">
        <p className="font-body-lg text-slate-grey leading-relaxed whitespace-pre-line">
          {pageData.content}
        </p>
      </div>
    </div>
  );
}
