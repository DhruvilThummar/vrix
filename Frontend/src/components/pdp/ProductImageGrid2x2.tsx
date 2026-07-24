"use client";

import React, { useState } from "react";
import Image from "next/image";
import SkeletonImage from "@/components/shop/SkeletonImage";

interface ProductImageGrid2x2Props {
  images: { src: string; alt: string }[];
  title: string;
}

export default function ProductImageGrid2x2({ images, title }: ProductImageGrid2x2Props) {
  const [activeMobileIdx, setActiveMobileIdx] = useState(0);
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);

  // Ensure at least 4 items for full 2x2 grid preview
  const gallery = images.length >= 4 
    ? images.slice(0, 4) 
    : [...images, ...Array(4 - images.length).fill(images[0] || { src: "", alt: title })];

  return (
    <>
      {/* Lightbox Modal */}
      {lightboxSrc && (
        <div 
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 cursor-zoom-out"
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
        {/* DESKTOP 2x2 GRID (PC View) */}
        <div className="hidden md:grid grid-cols-2 gap-3.5 w-full">
          {gallery.map((img, idx) => (
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

        {/* MOBILE CAROUSEL + THUMBNAILS */}
        <div className="md:hidden flex flex-col gap-3">
          <div className="relative aspect-[4/5] w-full bg-soft-linen overflow-hidden">
            <SkeletonImage
              src={gallery[activeMobileIdx]?.src || ""}
              alt={gallery[activeMobileIdx]?.alt || title}
              fill
              className="object-cover object-center mix-blend-multiply"
              sizes="100vw"
              priority
            />
          </div>

          <div className="flex gap-2 overflow-x-auto pb-1 hide-scrollbar">
            {gallery.map((img, idx) => (
              <button
                key={idx}
                onClick={() => setActiveMobileIdx(idx)}
                className={`relative aspect-[4/5] w-20 bg-soft-linen shrink-0 border transition-all ${
                  activeMobileIdx === idx ? "border-black opacity-100" : "border-transparent opacity-50"
                }`}
              >
                <SkeletonImage src={img.src} alt={img.alt} fill className="object-cover mix-blend-multiply" sizes="80px" />
              </button>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
