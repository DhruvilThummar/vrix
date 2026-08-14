"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { fetchDbPublic as fetchDb } from "@/utils/api";

const DEFAULT_STORY = {
  title: "Conscious Luxury, Redefined.",
  content: "VRIX was born from a desire to strip away the excess and focus on what truly matters: the emotional resonance of a beautifully crafted object. We believe jewelry is not merely adornment, but an architectural extension of the self. Each piece is a quiet statement of confidence, designed with permanence in mind.",
  bannerImage: "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?q=80&w=1600&auto=format&fit=crop",
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
  anchorImage: "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?q=80&w=1200&auto=format&fit=crop",
  anchorLinkText: "Explore the Collection"
};

export default function BrandStoryPage() {
  const [story, setStory] = useState(DEFAULT_STORY);

  useEffect(() => {
    fetchDb()
      .then((res) => {
        if (res.story) {
          setStory({
            ...DEFAULT_STORY,
            ...res.story
          });
        }
      })
      .catch((err) => console.error("Error loading brand story:", err));
  }, []);

  return (
    <div className="w-full">
      <main>
        {/* Immersive Banner Section */}
        <section className="relative w-full h-[819px] min-h-[600px] flex items-center justify-center overflow-hidden bg-deep-navy">
          <div className="absolute inset-0 w-full h-full">
            <Image
              alt="Artisan hands crafting jewelry"
              fill
              className="object-cover object-center opacity-70"
              src={story.bannerImage}
              priority
              sizes="100vw"
            />
            <div className="absolute inset-0 bg-ink-black/30"></div>
          </div>
          <div className="relative z-10 text-center px-margin-mobile md:px-margin-desktop">
            <h1 className="script-hero text-6xl md:text-8xl lg:text-9xl text-pure-white font-light tracking-wide drop-shadow-sm">
              {story.heroTitle}
            </h1>
          </div>
        </section>

        {/* Narrative Section */}
        <section className="py-section-gap px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto bg-surface">
          <div className="max-w-3xl mx-auto text-center space-y-stack-lg">
            <h2 className="font-headline-md text-headline-md text-deep-navy uppercase tracking-wide">
              {story.title}
            </h2>
            <div className="w-16 h-px bg-slate-grey/30 mx-auto"></div>
            <p className="font-body-lg text-body-lg text-slate-grey leading-relaxed">
              {story.content}
            </p>
          </div>
        </section>

        {/* Mission & Ethos Section */}
        <section className="py-section-gap px-margin-mobile md:px-margin-desktop bg-soft-linen w-full border-t border-slate-grey/20">
          <div className="max-w-container-max mx-auto">
            <div className="text-center mb-section-gap">
              <span className="font-label-caps text-label-caps text-slate-grey uppercase tracking-widest block mb-stack-md">
                Our Ethos
              </span>
              <h2 className="font-display-lg text-display-lg md:text-display-lg text-deep-navy uppercase">
                {story.ethosTitle}
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-gutter">
              {story.ethos.map((item, index) => (
                <div key={index} className="bg-pure-white p-stack-lg flex flex-col items-center text-center border border-slate-grey/10 hover:border-slate-grey/30 transition-colors duration-300">
                  <div className="w-12 h-12 mb-stack-md flex items-center justify-center text-deep-navy">
                    <span className="material-symbols-outlined text-[32px]">{item.icon}</span>
                  </div>
                  <h3 className="font-headline-md text-headline-md text-deep-navy mb-stack-sm uppercase">
                    {item.title}
                  </h3>
                  <p className="font-body-md text-body-md text-slate-grey">
                    {item.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Visual Anchor Section */}
        <section className="py-section-gap px-margin-mobile md:px-margin-desktop bg-surface max-w-container-max mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-gutter items-center">
            <div className="order-2 md:order-1 space-y-stack-lg md:pr-12">
              <h2 className="font-display-lg text-display-lg text-deep-navy uppercase">
                {story.anchorTitle}
              </h2>
              <p className="font-body-lg text-body-lg text-slate-grey leading-relaxed">
                {story.anchorContent}
              </p>
              <Link
                className="inline-flex items-center gap-2 font-button text-button text-deep-navy border-b border-deep-navy pb-1 hover:opacity-70 transition-opacity uppercase tracking-widest mt-stack-md cursor-pointer"
                href="/collections/silent-center"
              >
                {story.anchorLinkText}
                <i className="fa-solid fa-arrow-right text-xs"></i>
              </Link>
            </div>
            <div className="order-1 md:order-2">
              <div className="aspect-[4/5] bg-soft-linen overflow-hidden border border-slate-grey/20 relative">
                <Image
                  alt={story.anchorTitle}
                  fill
                  className="object-cover grayscale hover:grayscale-0 transition-all duration-700"
                  src={story.anchorImage}
                  sizes="(max-width: 768px) 100vw, 45vw"
                />
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
