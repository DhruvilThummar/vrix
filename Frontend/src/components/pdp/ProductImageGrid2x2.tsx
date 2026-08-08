"use client";

import React, { useState, useEffect } from "react";
import SkeletonImage from "@/components/shop/SkeletonImage";

interface ProductImageGrid2x2Props {
  images: { src: string; alt: string }[];
  title: string;
  layoutStyle?: "2x2" | "asymmetric" | "interactive";
}

export default function ProductImageGrid2x2({
  images,
  title,
  layoutStyle = "2x2",
}: ProductImageGrid2x2Props) {
  const [activeIdx, setActiveIdx] = useState(0);
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);

  // Reset active image index when images change
  useEffect(() => {
    setActiveIdx(0);
  }, [images]);

  // Ensure gallery list
  const rawList = (images || []).filter((img) => img.src && img.src.trim());
  const gallery =
    rawList.length > 0
      ? rawList
      : [{ src: "", alt: title }];

  // 2x2 grid requires at least 4 items
  const grid2x2 =
    gallery.length >= 4
      ? gallery.slice(0, 4)
      : [...gallery, ...Array(4 - gallery.length).fill(gallery[0])];

  const handlePrev = () => {
    setActiveIdx((prev) => (prev === 0 ? gallery.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setActiveIdx((prev) => (prev === gallery.length - 1 ? 0 : prev + 1));
  };

  const activeImage = gallery[activeIdx] || gallery[0];

  return (
    <>
      {/* Lightbox Full-screen Modal */}
      {lightboxSrc && (
        <div
          className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex items-center justify-center p-4 cursor-zoom-out animate-fade-in"
          onClick={() => setLightboxSrc(null)}
        >
          <div className="relative w-full max-w-5xl h-[88vh]">
            <SkeletonImage
              src={lightboxSrc}
              alt={title}
              fill
              className="object-contain"
              sizes="100vw"
            />
          </div>
          <button
            className="absolute top-6 right-6 text-white text-3xl font-light hover:opacity-75 cursor-pointer z-50"
            onClick={() => setLightboxSrc(null)}
            aria-label="Close image view"
          >
            ✕
          </button>
        </div>
      )}

      <div className="w-full flex flex-col gap-3">
        
        {/* PC / DESKTOP VIEW - RESPECTS ADMIN SELECTED LAYOUT STYLE */}
        {layoutStyle === "asymmetric" ? (
          /* ASYMMETRIC GRID: 1 Main Large Left + Stacked Small Right */
          <div className="hidden md:flex flex-col gap-3 w-full">
            <div className="grid grid-cols-3 gap-3.5">
              {/* Main Tall Left */}
              <div
                onClick={() => {
                  setActiveIdx(0);
                  setLightboxSrc(gallery[0]?.src);
                }}
                className="col-span-2 relative aspect-[4/5] bg-soft-linen/40 overflow-hidden group cursor-zoom-in border border-slate-grey/15 hover:border-slate-grey/40 transition-all duration-300 rounded-sm"
              >
                <SkeletonImage
                  src={gallery[0]?.src}
                  alt={gallery[0]?.alt || `${title} main view`}
                  fill
                  className="object-cover object-center mix-blend-multiply group-hover:scale-105 transition-transform duration-700 ease-out"
                  sizes="66vw"
                  priority
                />
                <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity bg-black/75 text-white text-[9px] font-label-caps px-2.5 py-1 tracking-widest uppercase z-20 rounded-xs">
                  Enlarge
                </div>
              </div>

              {/* 2 Stacked Right */}
              <div className="col-span-1 flex flex-col gap-3.5">
                {(gallery[1] || gallery[0]) && (
                  <div
                    onClick={() => {
                      setActiveIdx(1 % gallery.length);
                      setLightboxSrc((gallery[1] || gallery[0]).src);
                    }}
                    className="relative aspect-square bg-soft-linen/40 overflow-hidden group cursor-zoom-in border border-slate-grey/15 hover:border-slate-grey/40 transition-all duration-300 flex-1 rounded-sm"
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
                    onClick={() => {
                      setActiveIdx(2 % gallery.length);
                      setLightboxSrc((gallery[2] || gallery[0]).src);
                    }}
                    className="relative aspect-square bg-soft-linen/40 overflow-hidden group cursor-zoom-in border border-slate-grey/15 hover:border-slate-grey/40 transition-all duration-300 flex-1 rounded-sm"
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

            {/* Bottom Row thumbnails */}
            {gallery.length > 3 && (
              <div className="grid grid-cols-4 gap-3">
                {gallery.slice(3).map((img, idx) => (
                  <div
                    key={idx}
                    onClick={() => {
                      setActiveIdx(idx + 3);
                      setLightboxSrc(img.src);
                    }}
                    className="relative aspect-square bg-soft-linen/40 overflow-hidden group cursor-zoom-in border border-slate-grey/15 hover:border-slate-grey/40 transition-all duration-300 rounded-sm"
                  >
                    <SkeletonImage
                      src={img.src}
                      alt={img.alt || `${title} view ${idx + 4}`}
                      fill
                      className="object-cover object-center mix-blend-multiply group-hover:scale-105 transition-transform duration-700 ease-out"
                      sizes="25vw"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : layoutStyle === "2x2" ? (
          /* STANDARD 2x2 SQUARE GRID (PC View) */
          <div className="hidden md:grid grid-cols-2 gap-3.5 w-full">
            {grid2x2.map((img, idx) => (
              <div
                key={idx}
                onClick={() => {
                  setActiveIdx(idx % gallery.length);
                  setLightboxSrc(img.src);
                }}
                className="relative aspect-[4/5] bg-soft-linen/40 overflow-hidden group cursor-zoom-in border border-slate-grey/15 hover:border-slate-grey/40 transition-all duration-300 rounded-sm"
              >
                <SkeletonImage
                  src={img.src}
                  alt={img.alt || `${title} view ${idx + 1}`}
                  fill
                  className="object-cover object-center mix-blend-multiply group-hover:scale-105 transition-transform duration-700 ease-out"
                  sizes="50vw"
                  priority={idx < 2}
                />
                <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity bg-black/75 text-white text-[9px] font-label-caps px-2.5 py-1 tracking-widest uppercase z-20 rounded-xs">
                  Enlarge
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* INTERACTIVE HERO MAIN + THUMBNAILS (PC View) */
          <div className="hidden md:flex flex-col gap-3 w-full">
            <div
              onClick={() => setLightboxSrc(activeImage.src)}
              className="relative aspect-[4/5] w-full bg-soft-linen/40 overflow-hidden group cursor-zoom-in border border-slate-grey/15 hover:border-slate-grey/40 transition-all duration-500 rounded-sm"
            >
              <SkeletonImage
                src={activeImage.src}
                alt={activeImage.alt || title}
                fill
                className="object-cover object-center mix-blend-multiply group-hover:scale-105 transition-transform duration-700 ease-out"
                sizes="60vw"
                priority
              />
              <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity bg-black/75 text-white text-[9px] font-label-caps px-3 py-1.5 tracking-widest uppercase z-20 rounded-xs flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[13px]">zoom_in</span>
                <span>Click to Enlarge</span>
              </div>
            </div>

            {gallery.length > 1 && (
              <div className="flex gap-2.5 overflow-x-auto pb-1 hide-scrollbar pt-1">
                {gallery.map((img, idx) => {
                  const isActive = activeIdx === idx;
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setActiveIdx(idx)}
                      className={`relative aspect-[4/5] w-16 md:w-20 bg-soft-linen/50 shrink-0 border transition-all duration-200 cursor-pointer overflow-hidden rounded-xs ${
                        isActive
                          ? "border-deep-navy ring-1 ring-deep-navy opacity-100 scale-102 shadow-xs"
                          : "border-slate-grey/20 opacity-55 hover:opacity-90 hover:border-slate-grey/40"
                      }`}
                    >
                      <SkeletonImage
                        src={img.src}
                        alt={img.alt || `${title} thumbnail ${idx + 1}`}
                        fill
                        className="object-cover object-center mix-blend-multiply"
                        sizes="80px"
                      />
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* PHONE / MOBILE VIEW — SIMPLE CLEAN CAROUSEL */}
        <div className="md:hidden flex flex-col gap-3">
          <div className="relative aspect-[4/5] w-full bg-soft-linen/40 overflow-hidden shadow-xs group rounded-sm">
            <SkeletonImage
              src={activeImage.src}
              alt={activeImage.alt || title}
              fill
              className="object-cover object-center mix-blend-multiply transition-opacity duration-300"
              sizes="100vw"
              priority
            />

            {/* Mobile Navigation Arrows */}
            {gallery.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={handlePrev}
                  className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/80 backdrop-blur-xs text-ink-black flex items-center justify-center shadow-md active:scale-95 transition-all z-10 cursor-pointer"
                  aria-label="Previous Image"
                >
                  <span className="material-symbols-outlined text-lg">chevron_left</span>
                </button>
                <button
                  type="button"
                  onClick={handleNext}
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/80 backdrop-blur-xs text-ink-black flex items-center justify-center shadow-md active:scale-95 transition-all z-10 cursor-pointer"
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
                    type="button"
                    onClick={() => setActiveIdx(idx)}
                    className={`h-1.5 rounded-full transition-all cursor-pointer ${
                      activeIdx === idx ? "w-5 bg-black" : "w-1.5 bg-black/30"
                    }`}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Simple Mobile Thumbnail Strip */}
          {gallery.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-1 hide-scrollbar">
              {gallery.map((img, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setActiveIdx(idx)}
                  className={`relative aspect-[4/5] w-14 bg-soft-linen shrink-0 border transition-all cursor-pointer rounded-xs ${
                    activeIdx === idx
                      ? "border-black opacity-100 ring-1 ring-black"
                      : "border-transparent opacity-50"
                  }`}
                >
                  <SkeletonImage src={img.src} alt={img.alt} fill className="object-cover mix-blend-multiply" sizes="64px" />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
