"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { fetchDbPublic as fetchDb } from "@/utils/api";

const DEFAULT_DATA = {
  heroTitle: "Sustainable Luxury",
  content: "Sustainability is at the core of VRIX identity. By utilizing solar-powered lab-grown diamonds, 100% recycled precious metals, plastic-free FSC-certified signature gift boxes, and carbon-neutral studio logistics, we prove that luxury can be modern, personal, and profoundly responsible."
};

const SUSTAINABILITY_PILLARS = [
  {
    icon: "solar_power",
    title: "Solar-Powered Diamonds",
    description: "Our lab-grown solitaires are synthesized in CVD chambers powered by solar energy micro-grids."
  },
  {
    icon: "eco",
    title: "FSC Packaging",
    description: "Signature midnight navy boxes crafted from 100% FSC-certified unbleached virgin paper."
  },
  {
    icon: "local_shipping",
    title: "Carbon-Neutral Delivery",
    description: "Every shipment is offset through verified high-integrity carbon capture partnerships."
  }
];

export default function SustainabilityPage() {
  const [data, setData] = useState(DEFAULT_DATA);

  useEffect(() => {
    fetchDb()
      .then((res) => {
        if (res.sustainability) {
          setData((prev) => ({ ...prev, ...res.sustainability }));
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
            ENVIRONMENTAL AUDIT & RESPONSIBILITY
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

      {/* ─── Environmental Pillars Grid ─── */}
      <section className="py-20 md:py-28 max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {SUSTAINABILITY_PILLARS.map((pillar, idx) => (
            <div key={idx} className="bg-soft-linen p-8 md:p-10 border border-slate-grey/15 flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <span className="material-symbols-outlined text-4xl text-deep-navy">{pillar.icon}</span>
                <h2 className="font-inter font-primary text-xl font-semibold text-deep-navy uppercase tracking-wide">
                  {pillar.title}
                </h2>
                <p className="font-jost font-secondary text-sm text-slate-grey leading-relaxed">
                  {pillar.description}
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
            Explore Sustainable Jewelry
          </Link>
        </div>
      </section>
    </div>
  );
}
