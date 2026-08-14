"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChatProduct } from "./vrix-chat-types";
import { useCurrency } from "@/context/CurrencyContext";

interface ProductCardItemProps {
  product: ChatProduct;
  onNavigate?: () => void;
}

export default function ProductCardItem({ product, onNavigate }: ProductCardItemProps) {
  const router = useRouter();
  const { formatPrice } = useCurrency();
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const touchStartX = useRef<number>(0);
  const touchEndX = useRef<number>(0);

  // Normalize images list for carousel
  const imageList = Array.isArray(product.images) && product.images.filter(Boolean).length > 0
    ? product.images.filter(Boolean)
    : [product.image || "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&q=80&w=800"];

  const productUrl = `/product/${product.slug || product.id}`;

  // 2-second auto-changing image carousel
  useEffect(() => {
    if (imageList.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % imageList.length);
    }, 2000);
    return () => clearInterval(interval);
  }, [imageList.length]);

  const handleCardClick = (e: React.MouseEvent) => {
    // Execute mobile close event
    if (onNavigate) {
      onNavigate();
    } else if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("vrix-close-chat"));
    }
    router.push(productUrl);
  };

  // Touch Swipe Gesture Handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.targetTouches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (imageList.length <= 1) return;
    const distance = touchStartX.current - touchEndX.current;
    if (Math.abs(distance) > 35) {
      e.stopPropagation();
      if (distance > 35) {
        // Swipe Left -> Next Image
        setCurrentImageIndex((prev) => (prev + 1) % imageList.length);
      } else {
        // Swipe Right -> Previous Image
        setCurrentImageIndex((prev) => (prev - 1 + imageList.length) % imageList.length);
      }
    }
  };

  return (
    <div
      onClick={handleCardClick}
      className="flex flex-col bg-surface border border-outline-variant rounded-sm overflow-hidden shadow-xs hover:border-primary/50 transition-all max-w-[260px] shrink-0 cursor-pointer group"
    >
      {/* Product Image Carousel Surface */}
      <div
        className="relative w-full h-40 bg-surface-container-low overflow-hidden group"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <Image
          src={imageList[currentImageIndex] || imageList[0]}
          alt={product.title}
          fill
          className="object-cover group-hover:scale-105 transition-all duration-700 ease-in-out"
          sizes="260px"
        />

        {/* Carousel Slide Indicators */}
        {imageList.length > 1 && (
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-1 z-10 px-2 py-0.5 rounded-full bg-black/30 backdrop-blur-xs">
            {imageList.map((_: string, idx: number) => (
              <span
                key={idx}
                className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
                  idx === currentImageIndex ? "bg-white w-3" : "bg-white/50"
                }`}
              />
            ))}
          </div>
        )}

        {/* Wishlist Button */}
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setIsWishlisted(!isWishlisted);
          }}
          aria-label="Add to Wishlist"
          className="absolute top-2 right-2 p-1.5 rounded-full bg-surface/80 backdrop-blur-xs text-on-surface hover:text-primary transition-colors cursor-pointer z-20"
        >
          <span className={`material-symbols-outlined text-[18px] ${isWishlisted ? "text-primary fill-current" : ""}`}>
            favorite
          </span>
        </button>
      </div>

      {/* Product Details Content */}
      <div className="p-3 flex flex-col justify-between flex-grow space-y-2">
        <div>
          <span className="font-label-caps text-[9px] text-on-surface-variant uppercase tracking-widest block">
            {product.category} · {product.material}
          </span>
          <h4 className="font-jost text-body-md text-sm text-on-surface font-medium line-clamp-1 leading-snug group-hover:text-primary transition-colors">
            {product.title}
          </h4>
          <p className="font-inter text-sm font-semibold text-primary mt-0.5">
            {formatPrice(product.price)}
          </p>
        </div>

        {product.whyFits && (
          <p className="font-jost text-xs text-on-surface-variant italic bg-surface-container-low p-2 rounded-xs border-l-2 border-primary line-clamp-2">
            "{product.whyFits}"
          </p>
        )}

        <div className="pt-1 flex items-center justify-between border-t border-outline-variant/40">
          <span className="header-nav-link font-button text-button text-xs text-primary font-semibold inline-flex items-center gap-1 group-hover:translate-x-1 transition-transform">
            <span>View piece</span>
            <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
          </span>
        </div>
      </div>
    </div>
  );
}
