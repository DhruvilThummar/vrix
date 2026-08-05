"use client";

import React, { useState } from "react";
import SkeletonImage from "@/components/shop/SkeletonImage";

interface ProductImageGrid2x2Props {
  images: { src: string; alt: string }[];
  title: string;
  layoutStyle?: "2x2" | "asymmetric";
}

export default function ProductImageGrid2x2({
  images,
  title,
  layoutStyle = "2x2",
}: ProductImageGrid2x2Props) {
  const [activeMobileIdx, setActiveMobileIdx] = useState(0);
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);

  // Ensure gallery array
  const rawList = images.filter((img) => img.src && img.src.trim());
  const gallery =
    rawList.length > 0
      ? rawList
      : [{ src: "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=800", alt: title }];

  // 2x2 view needs 4 images minimum (repeat first if < 4)
  const grid2x2 =
    gallery.length >= 4
      ? gallery.slice(0, 4)
      : [...gallery, ...Array(4 - gallery.length).fill(gallery[0])];

  const handlePrevMobile = () => {
    setActiveMobileIdx((prev) => (prev === 0 ? gallery.length - 1 : prev - 1));
  };

  const handleNextMobile = () => {
    setActiveMobileIdx((prev) => (prev === gallery.length - 1 ? 0 : prev + 1));
  };

  return (
    <>
      {/* Lightbox Modal */}
      {lightboxSrc && (
        <div
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 cursor-zoom-out animate-fade-in"
          onClick={() => setLightboxSrc(null)}
        >
          <div className="relative w-full max-w-4xl h-[85vh]">
            <SkeletonImage
              src={lightboxSrc}
              alt={title}
              fill
              className="object-contain"
              sizes="100vw"
            />
          </div>
          <button
            className="absolute top-6 right-6 text-white text-3xl font-light hover:opacity-75"
            onClick={() => setLightboxSrc(null)}
          >
            ✕
          </button>
        </div>
      )}

      <div className="w-full flex flex-col gap-4">
        
        {/* DESKTOP VIEW OPTIONS */}
        {layoutStyle === "asymmetric" ? (
          /* ASYMMETRIC GRID: 1 Main Tall Left + 2 Small Right + 3 Small Bottom */
          <div className="hidden md:flex flex-col gap-3.5 w-full">
            {/* Top Row: Main Tall Left (col-span-2) + 2 Stacked Right */}
            <div className="grid grid-cols-3 gap-3.5">
              {/* 1 Main Tall Left */}
              <div
                onClick={() => setLightboxSrc(gallery[0]?.src)}
                className="col-span-2 relative aspect-[4/5] bg-soft-linen/50 overflow-hidden group cursor-zoom-in border border-soft-linen/30 hover:border-black/30 transition-all duration-300"
              >
                <SkeletonImage
                  src={gallery[0]?.src}
                  alt={gallery[0]?.alt || `${title} main view`}
                  fill
                  className="object-cover object-center mix-blend-multiply group-hover:scale-105 transition-transform duration-700 ease-out"
                  sizes="66vw"
                  priority
                />
                <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity bg-black/70 text-white text-[10px] font-label-caps px-2 py-1 tracking-widest uppercase z-20">
                  Enlarge
                </div>
              </div>

              {/* 2 Stacked Small Right */}
              <div className="col-span-1 flex flex-col gap-3.5">
                {(gallery[1] || gallery[0]) && (
                  <div
                    onClick={() => setLightboxSrc((gallery[1] || gallery[0]).src)}
                    className="relative aspect-square bg-soft-linen/50 overflow-hidden group cursor-zoom-in border border-soft-linen/30 hover:border-black/30 transition-all duration-300 flex-1"
                  >
                    <SkeletonImage
                      src={(gallery[1] || gallery[0]).src}
                      alt={(gallery[1] || gallery[0]).alt || `${title} view 2`}
                      fill
                      className="object-cover object-center mix-blend-multiply group-hover:scale-105 transition-transform duration-700 ease-out"
                      sizes="33vw"
                    />
                  </div>
                )}
                {(gallery[2] || gallery[0]) && (
                  <div
                    onClick={() => setLightboxSrc((gallery[2] || gallery[0]).src)}
                    className="relative aspect-square bg-soft-linen/50 overflow-hidden group cursor-zoom-in border border-soft-linen/30 hover:border-black/30 transition-all duration-300 flex-1"
                  >
                    <SkeletonImage
                      src={(gallery[2] || gallery[0]).src}
                      alt={(gallery[2] || gallery[0]).alt || `${title} view 3`}
                      fill
                      className="object-cover object-center mix-blend-multiply group-hover:scale-105 transition-transform duration-700 ease-out"
                      sizes="33vw"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Bottom Row: 3 Small Images */}
            {gallery.length >= 3 && (
              <div className="grid grid-cols-3 gap-3.5">
                {[gallery[3] || gallery[0], gallery[4] || gallery[1] || gallery[0], gallery[5] || gallery[2] || gallery[0]].map((img, idx) => (
                  <div
                    key={idx}
                    onClick={() => setLightboxSrc(img.src)}
                    className="relative aspect-square bg-soft-linen/50 overflow-hidden group cursor-zoom-in border border-soft-linen/30 hover:border-black/30 transition-all duration-300"
                  >
                    <SkeletonImage
                      src={img.src}
                      alt={img.alt || `${title} view ${idx + 4}`}
                      fill
                      className="object-cover object-center mix-blend-multiply group-hover:scale-105 transition-transform duration-700 ease-out"
                      sizes="33vw"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          /* STANDARD 2x2 SQUARE GRID (PC View) */
          <div className="hidden md:grid grid-cols-2 gap-3.5 w-full">
            {grid2x2.map((img, idx) => (
              <div
                key={idx}
                onClick={() => setLightboxSrc(img.src)}
                className="relative aspect-[4/5] bg-soft-linen/50 overflow-hidden group cursor-zoom-in border border-soft-linen/30 hover:border-black/30 transition-all duration-300"
              >
                <SkeletonImage
                  src={img.src}
                  alt={img.alt || `${title} view ${idx + 1}`}
                  fill
                  className="object-cover object-center mix-blend-multiply group-hover:scale-105 transition-transform duration-700 ease-out"
                  sizes="(max-width: 1200px) 50vw, 33vw"
                  priority={idx < 2}
                />
                <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity bg-black/70 text-white text-[10px] font-label-caps px-2 py-1 tracking-widest uppercase z-20">
                  Enlarge
                </div>
              </div>
            ))}
          </div>
        )}

        {/* MOBILE CAROUSEL WITH SWIPE & TOUCH NAVIGATION */}
        <div className="md:hidden flex flex-col gap-3">
          <div className="relative aspect-[4/5] w-full bg-soft-linen overflow-hidden shadow-xs group">
            <SkeletonImage
              src={gallery[activeMobileIdx]?.src || gallery[0]?.src || ""}
              alt={gallery[activeMobileIdx]?.alt || title}
              fill
              className="object-cover object-center mix-blend-multiply transition-opacity duration-300"
              sizes="100vw"
              priority
            />

            {/* Mobile Carousel Navigation Arrows */}
            {gallery.length > 1 && (
              <>
                <button
                  onClick={handlePrevMobile}
                  className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/80 backdrop-blur-xs text-ink-black flex items-center justify-center shadow-md active:scale-95 transition-all"
                  aria-label="Previous Image"
                >
                  <span className="material-symbols-outlined text-lg">chevron_left</span>
                </button>
                <button
                  onClick={handleNextMobile}
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/80 backdrop-blur-xs text-ink-black flex items-center justify-center shadow-md active:scale-95 transition-all"
                  aria-label="Next Image"
                >
                  <span className="material-symbols-outlined text-lg">chevron_right</span>
                </button>
              </>
            )}

            {/* Indicator Dots */}
            {gallery.length > 1 && (
              <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5 z-10">
                {gallery.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveMobileIdx(idx)}
                    className={`w-2 h-2 rounded-full transition-all ${
                      activeMobileIdx === idx ? "w-5 bg-black" : "bg-black/30"
                    }`}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Thumbnail Bar */}
          {gallery.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-1 hide-scrollbar">
              {gallery.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveMobileIdx(idx)}
                  className={`relative aspect-[4/5] w-20 bg-soft-linen shrink-0 border transition-all ${
                    activeMobileIdx === idx ? "border-black opacity-100 ring-1 ring-black" : "border-transparent opacity-50"
                  }`}
                >
                  <SkeletonImage src={img.src} alt={img.alt} fill className="object-cover mix-blend-multiply" sizes="80px" />
                </button>
              ))}
            </div>
          )}
        </div>

      </div>
    </>
  );
}
