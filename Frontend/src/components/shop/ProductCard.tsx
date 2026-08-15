"use client";

import React, { useState, useMemo, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import SkeletonImage from "@/components/shop/SkeletonImage";
import { getDisplayPrice } from "@/lib/pricing";

interface ProductCardProps {
  product: any;
  formatPrice: (price: number) => string;
  onWishlistToggle?: (id: string, title: string, e: React.MouseEvent) => void;
  isWishlisted?: boolean;
  onQuickAdd?: (product: any, variant?: any) => void;
  showQuickAdd?: boolean;
  priority?: boolean;
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
  priority = false,
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

  // Normalized image list for 2s auto-carousel
  const carouselImages = useMemo(() => {
    const list = [primaryImage];
    if (secondaryImage && secondaryImage !== primaryImage) list.push(secondaryImage);
    if (Array.isArray(product.images)) {
      product.images.forEach((img: string) => {
        if (img && !list.includes(img)) list.push(img);
      });
    }
    return list.filter(Boolean);
  }, [primaryImage, secondaryImage, product.images]);

  const [currentSlideIdx, setCurrentSlideIdx] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  const touchStartX = useRef<number>(0);
  const touchEndX = useRef<number>(0);

  // Immediately switch image when material swatch is clicked
  useEffect(() => {
    setCurrentSlideIdx(0);
  }, [selectedMaterial]);

  // 2-second auto-changing image carousel
  useEffect(() => {
    if (carouselImages.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentSlideIdx((prev) => (prev + 1) % carouselImages.length);
    }, 2000);
    return () => clearInterval(interval);
  }, [carouselImages.length]);

  const displayPrice = activeVariant?.price ?? product.price;
  const displayMaterial = activeVariant?.material || product.material || "";
  const productId = product?.id || product?._id || product?.slug;
  const productUrl = `/product/${productId}${selectedMaterial ? `?material=${encodeURIComponent(selectedMaterial)}` : ""}`;

  // Touch Swipe Gesture Handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.targetTouches[0].clientX;
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (carouselImages.length <= 1) return;
    const distance = touchStartX.current - touchEndX.current;
    if (Math.abs(distance) > 35 && touchEndX.current > 0) {
      e.stopPropagation();
      if (distance > 35) {
        // Swipe Left -> Next Image
        setCurrentSlideIdx((prev) => (prev + 1) % carouselImages.length);
      } else {
        // Swipe Right -> Previous Image
        setCurrentSlideIdx((prev) => (prev - 1 + carouselImages.length) % carouselImages.length);
      }
    }
    touchStartX.current = 0;
    touchEndX.current = 0;
  };

  const getSwatchColor = (mat: string) => {
    const key = mat.toLowerCase().trim();
    return MATERIAL_COLORS[key] || "#9CA3AF";
  };

  return (
    <Link
      href={productUrl}
      className="product-card group relative flex flex-col h-full bg-white text-black @container/card select-none cursor-pointer block border border-outline-variant/30 hover:border-primary/50 transition-all rounded-xs overflow-hidden shadow-xs hover:shadow-md"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        setCurrentSlideIdx(0);
      }}
    >
      {/* Images Area Surface */}
      <div
        className="relative group/product-card overflow-hidden w-full pb-[118.9%] z-10 bg-soft-linen rounded-xs"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div className="absolute inset-0 w-full h-full flex overflow-hidden">
          <SkeletonImage
            alt={product.title}
            fill
            sizes="(max-width: 768px) 50vw, 25vw"
            src={carouselImages[currentSlideIdx] || primaryImage}
            className="object-cover w-full h-full mix-blend-multiply opacity-95 group-hover:scale-105 transition-all duration-700 ease-out"
            priority={priority}
            loading={priority ? "eager" : "lazy"}
          />
        </div>

        {/* Carousel Indicators */}
        {carouselImages.length > 1 && (
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-20 flex gap-1 px-2 py-0.5 rounded-full bg-black/30 backdrop-blur-xs">
            {carouselImages.map((_: string, idx: number) => (
              <span
                key={idx}
                className={`block w-1.5 h-1.5 rounded-full transition-all duration-300 ${
                  idx === currentSlideIdx ? "bg-white w-3" : "bg-white/50"
                }`}
              />
            ))}
          </div>
        )}

        {/* Wishlist Button */}
        {onWishlistToggle && (
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onWishlistToggle(product.id, product.title, e);
            }}
            className="absolute top-2 right-2 z-30 p-1.5 rounded-full bg-white/80 backdrop-blur-xs text-slate-grey hover:text-red-600 transition-colors cursor-pointer"
          >
            <span
              className={`material-symbols-outlined text-[16px] md:text-[18px] ${
                isWishlisted ? "text-red-600 fill-current" : ""
              }`}
            >
              favorite
            </span>
          </button>
        )}

        {/* Quick Add Button */}
        {showQuickAdd && (Number(activeVariant?.stock ?? product.stock ?? 999) > 0) && (
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (onQuickAdd) onQuickAdd(product, activeVariant);
            }}
            className="absolute bottom-3 left-1/2 -translate-x-1/2 z-30 opacity-0 group-hover/product-card:opacity-100 transition-opacity duration-300 bg-white/95 hover:bg-black hover:text-white border border-slate-grey/30 px-4 py-1.5 rounded-xs shadow-sm flex items-center gap-1 cursor-pointer transition-colors font-inter font-primary"
          >
            <span className="text-[10px] uppercase font-semibold tracking-wider">Add</span>
            <span className="material-symbols-outlined text-[10px]">add</span>
          </button>
        )}
      </div>

      {/* Details Box Surface */}
      <div className="flex flex-col gap-1 bg-[#F8F8F8] px-3 py-3 h-full rounded-b-xs">
        <span className="font-jost font-secondary font-label-caps text-[9px] md:text-[10px] text-slate-grey uppercase tracking-wider truncate">
          {product.subtitle || product.type || product.collection}
        </span>

        <h3 className="font-inter font-primary text-[12px] md:text-xs text-ink-black uppercase font-medium line-clamp-1 group-hover:text-primary transition-colors">
          {product.title}
        </h3>

        <span className="font-inter font-primary text-[12px] md:text-xs text-ink-black font-semibold mt-0.5">
          {getDisplayPrice(displayPrice, formatPrice, product.price)}
        </span>

        {/* Material Swatches */}
        {materials.length > 1 && (
          <div className="flex flex-row items-center gap-2 mt-1.5 pt-1.5 border-t border-outline-variant/30">
            <div className="flex items-center gap-1.5">
              {materials.map((mat) => {
                const isSelected = selectedMaterial === mat;
                return (
                  <button
                    key={mat}
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setSelectedMaterial(mat);
                    }}
                    className={`group/swatch relative w-4 h-4 rounded-full flex items-center justify-center p-0 cursor-pointer transition-transform ${
                      isSelected ? "ring-1 ring-deep-navy ring-offset-1 scale-110" : "hover:scale-105"
                    }`}
                    aria-label={`Select ${mat}`}
                  >
                    <span
                      className="w-4 h-4 rounded-full border border-black/20 shrink-0 block"
                      style={{ backgroundColor: getSwatchColor(mat) }}
                    />
                  </button>
                );
              })}
            </div>
            <span className="font-jost font-secondary text-[10px] text-slate-grey truncate flex-1 leading-none pt-[1px]">
              {displayMaterial}
            </span>
          </div>
        )}
      </div>
    </Link>
  );
}
