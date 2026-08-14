"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { fetchDbPublic as fetchDb } from "@/utils/api";

const DEFAULT_DATA = {
  heroTitle: "Master Craftsmanship",
  content: "Every VRIX piece is meticulously crafted by master artisans using time-honored lost-wax casting and architectural precision. From hand-setting each ethical lab-grown diamond to multi-layer 18K Gold Vermeil hand-polishing, our ateliers ensure uncompromising quality and enduring elegance."
};

const CRAFTSMANSHIP_STEPS = [
  {
    step: "01",
    title: "Architectural Drafting",
    description: "Silhouette proportioning designed to balance tactile weight with minimalist symmetry."
  },
  {
    step: "02",
    title: "Precision Lost-Wax Casting",
    description: "Molten 925 Sterling Silver cast in vacuum chambers to eliminate micro-porosity."
  },
  {
    step: "03",
    title: "Micro-Pave Diamond Setting",
    description: "VS+ ethical lab-grown diamonds hand-set under 40x magnification microscopes."
  },
  {
    step: "04",
    title: "Multi-Layer 18K Vermeil Finish",
    description: "Thick 2.5µm solid 18K gold electroplating followed by hand mirror-polishing."
  }
];

export default function CraftsmanshipPage() {
  const [data, setData] = useState(DEFAULT_DATA);

  useEffect(() => {
    fetchDb()
      .then((res) => {
        if (res.craftsmanship) {
          setData((prev) => ({ ...prev, ...res.craftsmanship }));
        }
      })
      .catch(() => {});
  }, []);

  return (
    <div className="w-full min-h-screen bg-pure-white text-ink-black selection:bg-deep-navy selection:text-white">
      {/* ─── Header Banner ─── */}
      <section className="bg-deep-navy text-pure-white py-24 md:py-32 px-margin-mobile md:px-margin-desktop text-center border-b border-slate-grey/20">
        <div className="max-w-4xl mx-auto space-y-6">
          <span className="font-jost font-secondary text-label-caps text-xs tracking-[0.25em] text-[#B59D7C] uppercase block">
            ATELIER PROCESS • SURAT STUDIO
          </span>
          <h1 className="font-inter font-primary text-3xl md:text-5xl font-light uppercase tracking-wider text-pure-white">
            {data.heroTitle}
          </h1>
          <div className="w-16 h-[2px] bg-[#B59D7C] mx-auto mt-6 mb-8" />
          <p className="font-jost font-secondary text-base md:text-xl text-white/80 max-w-2xl mx-auto leading-relaxed font-light">
            {data.content}
          </p>
        </div>
      </section>

      {/* ─── Process Steps Grid ─── */}
      <section className="py-20 md:py-28 max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop">
        <div className="text-center mb-16 space-y-3">
          <span className="font-jost font-secondary text-label-caps text-xs text-[#B59D7C] tracking-widest uppercase">
            THE 4-STAGE ATELIER METHOD
          </span>
          <h2 className="font-inter font-primary text-2xl md:text-4xl text-deep-navy uppercase tracking-wider">
            Precision In Every Detail
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {CRAFTSMANSHIP_STEPS.map((item, idx) => (
            <div key={idx} className="bg-soft-linen p-8 border border-slate-grey/15 flex flex-col justify-between space-y-6">
              <span className="font-inter font-primary text-3xl font-bold text-[#B59D7C]">
                {item.step}
              </span>
              <div className="space-y-2">
                <h3 className="font-inter font-primary text-base font-semibold text-deep-navy uppercase tracking-wide">
                  {item.title}
                </h3>
                <p className="font-jost font-secondary text-xs md:text-sm text-slate-grey leading-relaxed">
                  {item.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-16 text-center">
          <Link
            href="/products"
            className="inline-block bg-deep-navy text-pure-white px-10 py-4 font-inter font-primary text-xs uppercase tracking-widest hover:bg-black transition-colors duration-300"
          >
            Explore Handcrafted Pieces
          </Link>
        </div>
      </section>
    </div>
  );
}
