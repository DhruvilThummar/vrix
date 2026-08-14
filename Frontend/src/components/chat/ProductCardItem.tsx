"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChatProduct } from "./vrix-chat-types";
import { useCurrency } from "@/context/CurrencyContext";

interface ProductCardItemProps {
  product: ChatProduct;
  onNavigate?: () => void;
}

export default function ProductCardItem({ product, onNavigate }: ProductCardItemProps) {
  const { formatPrice } = useCurrency();
  const [isWishlisted, setIsWishlisted] = useState(false);

  const productUrl = `/product/${product.slug || product.id}`;

  const handleCardClick = () => {
    if (onNavigate) {
      onNavigate();
    } else if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("vrix-close-chat"));
    }
  };

  return (
    <div className="flex flex-col bg-surface border border-outline-variant rounded-sm overflow-hidden shadow-xs hover:border-primary/50 transition-all max-w-[260px] shrink-0">
      <Link
        href={productUrl}
        onClick={handleCardClick}
        className="relative w-full h-40 bg-surface-container-low overflow-hidden group block cursor-pointer"
      >
        <Image
          src={product.image}
          alt={product.title}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-500"
          sizes="260px"
        />
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setIsWishlisted(!isWishlisted);
          }}
          aria-label="Add to Wishlist"
          className="absolute top-2 right-2 p-1.5 rounded-full bg-surface/80 backdrop-blur-xs text-on-surface hover:text-primary transition-colors cursor-pointer z-10"
        >
          <span className={`material-symbols-outlined text-[18px] ${isWishlisted ? "text-primary fill-current" : ""}`}>
            favorite
          </span>
        </button>
      </Link>

      <div className="p-3 flex flex-col justify-between flex-grow space-y-2">
        <Link
          href={productUrl}
          onClick={handleCardClick}
          className="block cursor-pointer group"
        >
          <span className="font-label-caps text-[9px] text-on-surface-variant uppercase tracking-widest block">
            {product.category} · {product.material}
          </span>
          <h4 className="font-jost text-body-md text-sm text-on-surface font-medium line-clamp-1 leading-snug group-hover:text-primary transition-colors">
            {product.title}
          </h4>
          <p className="font-inter text-sm font-semibold text-primary mt-0.5">
            {formatPrice(product.price)}
          </p>
        </Link>

        {product.whyFits && (
          <p className="font-jost text-xs text-on-surface-variant italic bg-surface-container-low p-2 rounded-xs border-l-2 border-primary">
            "{product.whyFits}"
          </p>
        )}

        <div className="pt-1 flex items-center justify-between border-t border-outline-variant/40">
          <Link
            href={productUrl}
            onClick={handleCardClick}
            className="header-nav-link font-button text-button text-xs text-primary font-semibold inline-flex items-center gap-1 cursor-pointer"
          >
            <span>View piece</span>
            <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
