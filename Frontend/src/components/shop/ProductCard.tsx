"use client";

import React, { useState, useMemo, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { getDisplayPrice } from "@/lib/pricing";
import { useVariantAnimations } from "@/hooks/useVariantAnimations";

interface ProductCardProps {
  product: any;
  formatPrice: (price: number) => string;
  onWishlistToggle?: (id: string, title: string, e: React.MouseEvent) => void;
  isWishlisted?: boolean;
  onQuickAdd?: (product: any, variant?: any) => void;
  showQuickAdd?: boolean;
}

const MATERIAL_COLORS: { [key: string]: string } = {
  "sterling silver": "#C8C8C8",
  "silver": "#C8C8C8",
  "14k yellow gold": "#EAC37C",
  "18k gold vermeil": "#EAC37C",
  "gold vermeil": "#EAC37C",
  "gold": "#EAC37C",
  "rose gold": "#B76E79",
  "14k rose gold": "#B76E79",
  "platinum": "#E5E4E2",
  "white gold": "#F0EDE8",
  "14k white gold": "#F0EDE8",
};

export default function ProductCard({
  product,
  formatPrice,
  onWishlistToggle,
  isWishlisted = false,
  onQuickAdd,
  showQuickAdd = true,
}: ProductCardProps) {
  const variants = product.variants || [];
  
  // Available material list
  const materials = useMemo(() => {
    const list: string[] = [];
    if (product.material) list.push(product.material);
    variants.forEach((v: any) => {
      if (v.material && !list.includes(v.material)) {
        list.push(v.material);
      }
    });
    return list;
  }, [product.material, variants]);

  const [selectedMaterial, setSelectedMaterial] = useState<string>(
    materials[0] || ""
  );

  const activeVariant = useMemo(() => {
    if (!selectedMaterial) return null;
    return variants.find((v: any) => v.material === selectedMaterial) || null;
  }, [variants, selectedMaterial]);

  const primaryImage = activeVariant?.image || product.image;
  const secondaryImage =
    activeVariant?.images?.[0] ||
    (Array.isArray(product.images) ? product.images[1] || product.images[0] : null) ||
    primaryImage;

  const displayPrice = activeVariant?.price ?? product.price;
  const displayMaterial = activeVariant?.material || product.material || "";

  const imageRef = useRef<HTMLDivElement>(null);
  const priceRef = useRef<HTMLSpanElement>(null);

  // Apply variant switch animations (GSAP)
  useVariantAnimations(imageRef, priceRef, activeVariant);

  const [isHovered, setIsHovered] = useState(false);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [activeMobileImageIdx, setActiveMobileImageIdx] = useState(0);

  // Swipe logic for mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.touches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStart === null) return;
    const currentX = e.touches[0].clientX;
    const diff = touchStart - currentX;
    if (Math.abs(diff) > 50) {
      if (diff > 0) {
        // swipe left
        setActiveMobileImageIdx(1);
      } else {
        // swipe right
        setActiveMobileImageIdx(0);
      }
      setTouchStart(null);
    }
  };

  const getSwatchColor = (mat: string) => {
    const key = mat.toLowerCase().trim();
    return MATERIAL_COLORS[key] || "#9CA3AF";
  };

  return (
    <div
      className="product-card group relative flex flex-col h-full bg-white text-black @container/card select-none"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        setActiveMobileImageIdx(0);
      }}
    >
      {/* Images Area */}
      <div className="relative group/product-card overflow-hidden w-full pb-[118.9%] z-10 bg-soft-linen rounded-xs">
        <Link
          href={`/product/${product.id}${selectedMaterial ? `?material=${encodeURIComponent(selectedMaterial)}` : ""}`}
          className="absolute inset-0 block"
        >
          {/* Desktop Dual Image Hover Grid */}
          <div ref={imageRef} className="relative w-full h-full flex overflow-hidden">
            <div className="relative w-full h-full flex-shrink-0">
              <Image
                alt={product.title}
                fill
                sizes="(max-width: 768px) 50vw, 25vw"
                src={isHovered ? secondaryImage : (activeMobileImageIdx === 1 ? secondaryImage : primaryImage)}
                className="object-cover w-full h-full mix-blend-multiply opacity-90 transition-transform duration-700 ease-out"
                priority
              />
            </div>
          </div>
        </Link>

        {/* Mobile Swipe Indicators */}
        {secondaryImage && secondaryImage !== primaryImage && (
          <div
            className="absolute inset-0 md:hidden z-20"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
          />
        )}
        {secondaryImage && secondaryImage !== primaryImage && (
          <div className="absolute left-2 bottom-2 md:hidden z-30 flex gap-1">
            <span
              className={`block w-1.5 h-1.5 rounded-full transition-colors ${
                activeMobileImageIdx === 0 ? "bg-black" : "bg-black/30"
              }`}
            />
            <span
              className={`block w-1.5 h-1.5 rounded-full transition-colors ${
                activeMobileImageIdx === 1 ? "bg-black" : "bg-black/30"
              }`}
            />
          </div>
        )}

        {/* Quick Add Button */}
        {showQuickAdd && (Number(activeVariant?.stock ?? product.stock ?? 999) > 0) && (
          <button
            onClick={() => onQuickAdd && onQuickAdd(product, activeVariant)}
            className="absolute bottom-3 left-1/2 -translate-x-1/2 z-30 opacity-0 group-hover/product-card:opacity-100 transition-opacity duration-300 bg-white/95 hover:bg-black hover:text-white border border-slate-grey/30 px-4 py-1.5 rounded-xs shadow-sm flex items-center gap-1 cursor-pointer transition-colors"
          >
            <span className="text-[10px] uppercase font-semibold tracking-wider">Add</span>
            <span className="material-symbols-outlined text-[10px]">add</span>
          </button>
        )}
      </div>

      {/* Details Box */}
      <div className="flex flex-col gap-1 bg-[#F8F8F8] px-2.5 py-3 h-full rounded-b-xs">
        {/* Title + Wishlist row */}
        <div className="flex items-center justify-between gap-1.5 min-w-0">
          <Link
            href={`/product/${product.id}${selectedMaterial ? `?material=${encodeURIComponent(selectedMaterial)}` : ""}`}
            className="font-body-md text-[11px] md:text-xs text-ink-black uppercase font-medium truncate flex-1 hover:text-deep-navy transition-colors"
          >
            {product.title}
          </Link>
          {onWishlistToggle && (
            <button
              onClick={(e) => onWishlistToggle(product.id, product.title, e)}
              className="text-slate-grey hover:text-deep-navy transition-colors flex-shrink-0 cursor-pointer p-0.5"
            >
              <span
                className={`material-symbols-outlined text-[16px] md:text-[18px] ${
                  isWishlisted ? "icon-favorite-filled text-red-600" : "icon-favorite-outline"
                }`}
              >
                favorite
              </span>
            </button>
          )}
        </div>

        {/* Subtitle / Type */}
        <span className="font-label-caps text-[9px] md:text-[10px] text-slate-grey uppercase tracking-wider truncate">
          {product.subtitle || product.type}
        </span>

        {/* Price row */}
        <span ref={priceRef} className="font-body-md text-[11px] md:text-xs text-ink-black font-semibold">
          {getDisplayPrice(displayPrice, formatPrice, product.price)}
        </span>

        {/* Swatches row */}
        {materials.length > 1 && (
          <div className="flex flex-row items-center gap-2 mt-1">
            <div className="flex items-center gap-1.5">
              {materials.map((mat) => {
                const isSelected = selectedMaterial === mat;
                return (
                  <button
                    key={mat}
                    type="button"
                    onClick={() => setSelectedMaterial(mat)}
                    className={`group/swatch relative w-4 h-4 rounded-full flex items-center justify-center p-0 cursor-pointer transition-transform ${
                      isSelected ? "ring-1 ring-deep-navy ring-offset-1 scale-110" : "hover:scale-105"
                    }`}
                    aria-label={`Select ${mat}`}
                  >
                    <span
                      className="w-4 h-4 rounded-full border border-black/20 shrink-0 block"
                      style={{ backgroundColor: getSwatchColor(mat) }}
                    />
                    {/* Tooltip */}
                    <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 hidden group-hover/swatch:block bg-black text-white text-[9px] px-1.5 py-0.5 whitespace-nowrap z-50 rounded-xs">
                      {mat}
                    </div>
                  </button>
                );
              })}
            </div>
            <span className="text-[10px] text-slate-grey truncate flex-1 leading-none pt-[1px]">
              {displayMaterial}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
