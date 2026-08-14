"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { fetchDbPublic as fetchDb } from "@/utils/api";

const DEFAULT_DATA = {
  heroTitle: "Conscious Materials",
  content: "We source only ethical lab-grown diamonds, 100% recycled 925 Sterling Silver, and thick 18K Gold Vermeil (over 2.5 microns). By bridging affordable luxury and heavy fine jewelry, VRIX creates meaningful pieces designed to withstand everyday life while leaving a lighter footprint on the earth."
};

const MATERIALS_SPECS = [
  {
    icon: "diamond",
    title: "Lab-Grown Diamonds",
    badge: "VS+ CLARITY • F-G COLOR",
    detail: "Physically and chemically identical to mined diamonds. Grown using renewable-energy CVD processes with zero environmental land degradation."
  },
  {
    icon: "auto_awesome",
    title: "18K Gold Vermeil",
    badge: "2.5 MICRONS • SOLID 18K",
    detail: "A thick coat of solid 18K gold electroplated over pure 925 Sterling Silver, offering 5x the thickness of standard gold plating."
  },
  {
    icon: "recycling",
    title: "Recycled 925 Silver",
    badge: "HYPOALLERGENIC • RECYCLED",
    detail: "Sourced from 100% recycled industrial silver refineries, nickel-free and cadmium-free for daily skin contact."
  }
];

export default function MaterialsPage() {
  const [data, setData] = useState(DEFAULT_DATA);

  useEffect(() => {
    fetchDb()
      .then((res) => {
        if (res.materials) {
          setData((prev) => ({ ...prev, ...res.materials }));
        }
      })
      .catch(() => {});
  }, []);

  return (
    <div className="w-full min-h-screen bg-pure-white text-ink-black selection:bg-deep-navy selection:text-white">
      {/* ─── Hero Banner ─── */}
      <section className="bg-deep-navy text-pure-white py-24 md:py-32 px-margin-mobile md:px-margin-desktop text-center border-b border-slate-grey/20">
        <div className="max-w-4xl mx-auto space-y-6">
          <span className="font-jost font-secondary text-label-caps text-xs tracking-[0.25em] text-[#B59D7C] uppercase block">
            MATERIAL AUDIT & SPECIFICATIONS
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

      {/* ─── Material Specs Cards ─── */}
      <section className="py-20 md:py-28 max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {MATERIALS_SPECS.map((spec, idx) => (
            <div key={idx} className="bg-soft-linen p-8 md:p-10 border border-slate-grey/15 flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <span className="material-symbols-outlined text-4xl text-deep-navy">{spec.icon}</span>
                <span className="font-inter font-primary text-[10px] tracking-widest text-[#B59D7C] bg-white/80 px-3 py-1 uppercase inline-block border border-[#B59D7C]/30">
                  {spec.badge}
                </span>
                <h2 className="font-inter font-primary text-xl font-semibold text-deep-navy uppercase tracking-wide">
                  {spec.title}
                </h2>
                <p className="font-jost font-secondary text-sm text-slate-grey leading-relaxed">
                  {spec.detail}
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
            Browse Verified Materials
          </Link>
        </div>
      </section>
    </div>
  );
}
