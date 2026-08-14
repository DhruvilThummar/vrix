"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { fetchDbPublic as fetchDb } from "@/utils/api";

const DEFAULT_STORY = {
  title: "Conscious Luxury, Redefined.",
  content: "VRIX was born from a desire to strip away the excess and focus on what truly matters: the emotional resonance of a beautifully crafted object. We believe jewelry is not merely adornment, but an architectural extension of the self. Each piece is a quiet statement of confidence, designed with permanence in mind.",
  heroTitle: "Made to be Yours",
  ethosTitle: "The VRIX Standard",
  ethos: [
    {
      icon: "diamond",
      title: "Affordable Luxury",
      description: "Exceptional materials and masterful design, made accessible without compromising the integrity of the art."
    },
    {
      icon: "favorite_border",
      title: "Emotional Connection",
      description: "We craft pieces designed to hold memories, intended to be worn daily and passed down through generations."
    },
    {
      icon: "handyman",
      title: "Quality Craftsmanship",
      description: "Meticulous attention to detail and a commitment to architectural precision in every curve and setting."
    }
  ],
  anchorTitle: "Designed for Permanence",
  anchorContent: "Our studios operate on a philosophy of minimalism. By removing the unnecessary, we expose the structural beauty of precious metals and stones. The result is a collection that transcends seasonal trends, offering a quiet luxury that speaks volumes.",
  anchorLinkText: "Explore the Collection"
};

export default function BrandStoryPage() {
  const [story, setStory] = useState(DEFAULT_STORY);

  useEffect(() => {
    fetchDb()
      .then((res) => {
        if (res.story) {
          setStory((prev) => ({ ...prev, ...res.story }));
        }
      })
      .catch(() => {});
  }, []);

  return (
    <div className="w-full min-h-screen bg-pure-white text-ink-black selection:bg-deep-navy selection:text-white">
      {/* ─── Architectural Editorial Hero Banner ─── */}
      <section className="relative w-full bg-deep-navy text-pure-white py-24 md:py-32 px-margin-mobile md:px-margin-desktop overflow-hidden border-b border-slate-grey/20">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none" />
        
        <div className="max-w-4xl mx-auto text-center relative z-10 space-y-6">
          <span className="font-jost font-secondary text-label-caps text-xs tracking-[0.25em] text-[#B59D7C] uppercase block">
            VRIX BRAND ARCHIVE • EST. 2024
          </span>
          <h1 className="font-inter font-primary text-3xl md:text-5xl lg:text-6xl font-light uppercase tracking-wider leading-tight text-pure-white">
            {story.title}
          </h1>
          <div className="w-16 h-[2px] bg-[#B59D7C] mx-auto mt-6 mb-8" />
          <p className="font-jost font-secondary text-base md:text-xl text-white/80 max-w-2xl mx-auto leading-relaxed font-light">
            {story.heroTitle}
          </p>
        </div>
      </section>

      {/* ─── Main Narrative Section ─── */}
      <section className="py-20 md:py-28 max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop">
        <div className="max-w-3xl mx-auto text-center space-y-8">
          <p className="font-jost font-secondary text-label-caps text-xs text-[#B59D7C] tracking-[0.2em] uppercase">
            OUR ESSENCE & PHILOSOPHY
          </p>
          <p className="font-jost font-secondary text-lg md:text-2xl text-slate-grey leading-relaxed font-light italic">
            "{story.content}"
          </p>
        </div>
      </section>

      {/* ─── The Three Pillars / Ethos Grid ─── */}
      <section className="py-16 bg-soft-linen border-y border-slate-grey/15">
        <div className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop">
          <div className="text-center mb-16 space-y-3">
            <span className="font-jost font-secondary text-label-caps text-xs text-slate-grey tracking-widest uppercase">
              THE VRIX CODE
            </span>
            <h2 className="font-inter font-primary text-2xl md:text-4xl text-deep-navy uppercase tracking-wider">
              {story.ethosTitle}
            </h2>
             </div>
             <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {story.ethos?.map((pillar, idx) => (
            <article key={idx} className="text-center space-y-6">
              <div className="flex justify-center mb-4">
                <span className="material-symbols-outlined text-5xl text-deep-navy">
                  {pillar.icon}
                </span>
              </div>
              <h3 className="font-inter font-primary text-xl font-semibold text-deep-navy uppercase tracking-wider">
                {pillar.title}
              </h3>
              <p className="font-jost font-secondary text-sm text-slate-grey leading-relaxed">
                {pillar.description}
              </p>
            </article>
          ))}
        </div>
        </div>
      </section>
      {/* ─── Anchor Editorial Block ─── */}
      <section className="py-24 max-w-4xl mx-auto px-margin-mobile md:px-margin-desktop text-center space-y-8">
        <span className="font-jost font-secondary text-label-caps text-xs text-[#B59D7C] tracking-[0.2em] uppercase">
          PERMANENCE IN DESIGN
        </span>
        <h2 className="font-inter font-primary text-3xl md:text-4xl text-deep-navy uppercase tracking-wider">
          {story.anchorTitle}
        </h2>
        <p className="font-jost font-secondary text-base md:text-lg text-slate-grey leading-relaxed">
          {story.anchorContent}
        </p>

        <div className="pt-6">
          <Link
            href="/products"
            className="inline-block bg-deep-navy text-pure-white px-10 py-4 font-inter font-primary text-xs uppercase tracking-widest hover:bg-black transition-colors duration-300"
          >
            {story.anchorLinkText}
          </Link>
        </div>
      </section>
    </div>
  );
}
