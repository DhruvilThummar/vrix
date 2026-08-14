"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { fetchDbPublic as fetchDb } from "@/utils/api";

const DEFAULT_DATA = {
  heroTitle: "Jewelry Style Guide",
  content: "Master the art of understated luxury. Learn how to layer delicate gold pendants, stack architectural lab-grown diamond bands, and seamlessly pair 18K Gold Vermeil with 925 Sterling Silver for a personalized signature aesthetic."
};

const STYLING_RULES = [
  {
    number: "01",
    rule: "The Rule of Proportions",
    tip: "Pair statement solitaire rings with minimalist thin bands. Maintain visual equilibrium by leaving breathing space between hand focal points."
  },
  {
    number: "02",
    rule: "Layering Length Cascades",
    tip: "When stacking chains, space lengths at 16, 18, and 20 inches to allow each pendant and pave link to reflect light individually."
  },
  {
    number: "03",
    rule: "Mixed Metal Harmony",
    tip: "Combine 18K Gold Vermeil with Recycled 925 Silver by ensuring at least one piece shares a common architectural geometry."
  }
];

export default function StyleGuidePage() {
  const [data, setData] = useState(DEFAULT_DATA);

  useEffect(() => {
    fetchDb()
      .then((res) => {
        if (res.style_guide) {
          setData((prev) => ({ ...prev, ...res.style_guide }));
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
            EDITORIAL CURATION • STYLING DIRECTORY
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

      {/* ─── Styling Rules Section ─── */}
      <section className="py-20 md:py-28 max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {STYLING_RULES.map((item, idx) => (
            <div key={idx} className="bg-soft-linen p-8 md:p-10 border border-slate-grey/15 flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <span className="font-inter font-primary text-2xl font-bold text-[#B59D7C]">
                  {item.number}
                </span>
                <h2 className="font-inter font-primary text-xl font-semibold text-deep-navy uppercase tracking-wide">
                  {item.rule}
                </h2>
                <p className="font-jost font-secondary text-sm text-slate-grey leading-relaxed">
                  {item.tip}
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
            Curate Your Collection
          </Link>
        </div>
      </section>
    </div>
  );
}
