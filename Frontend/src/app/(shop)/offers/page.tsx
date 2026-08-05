"use client";

import React, { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { fetchProducts, fetchDb } from "@/utils/api";
import { useCurrency } from "@/utils/useCurrency";

export default function OffersPage() {
  const { formatPrice } = useCurrency();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [cms, setCms] = useState<any>({
    title: "Exclusive Sale & Offers",
    subtitle: "Discover architectural jewelry pieces at special member prices for a limited time.",
    bannerImage: "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?q=80&w=1600&auto=format&fit=crop",
  });

  useEffect(() => {
    Promise.all([
      fetchProducts().catch(() => []),
      fetchDb().catch(() => null),
    ]).then(([prods, dbData]) => {
      setProducts(Array.isArray(prods) ? prods : []);
      if (dbData?.offers_page) {
        setCms({
          title: dbData.offers_page.title || "Exclusive Sale & Offers",
          subtitle: dbData.offers_page.subtitle || "Discover architectural jewelry pieces at special member prices for a limited time.",
          bannerImage: dbData.offers_page.bannerImage || "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?q=80&w=1600&auto=format&fit=crop",
        });
      }
      setLoading(false);
    });
  }, []);

  const discountedProducts = useMemo(() => {
    return products.filter((p) => {
      const hasOriginalDiscount = p.originalPrice && Number(p.originalPrice) > Number(p.price);
      const isVrixPlusExclusive = p.isVrixPlusExclusive && p.vrixPlusPrice;
      return hasOriginalDiscount || isVrixPlusExclusive;
    });
  }, [products]);

  return (
    <div className="min-h-screen bg-pure-white text-ink-black pt-20 md:pt-24 pb-16">
      
      {/* Hero Banner */}
      <section className="relative w-full h-[320px] md:h-[420px] bg-deep-navy flex items-center justify-center text-center overflow-hidden">
        <Image
          src={cms.bannerImage}
          alt={cms.title}
          fill
          className="object-cover object-center opacity-40 mix-blend-overlay"
          priority
        />
        <div className="relative z-10 max-w-2xl px-6 space-y-3 animate-fade-in">
          <span className="font-label-caps text-xs text-amber-300 uppercase tracking-widest block font-bold">
            ★ Limited Time Privileges
          </span>
          <h1 className="font-display-lg text-3xl md:text-5xl text-pure-white uppercase tracking-wider">
            {cms.title}
          </h1>
          <p className="font-body-md text-xs md:text-sm text-pure-white/80 leading-relaxed">
            {cms.subtitle}
          </p>
        </div>
      </section>

      {/* Main Catalog */}
      <main className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop py-12">
        {loading ? (
          <div className="py-20 text-center text-slate-grey font-label-caps text-xs tracking-widest uppercase flex justify-center items-center gap-3">
            <span className="w-5 h-5 border-2 border-deep-navy border-t-transparent rounded-full animate-spin" />
            Loading Offers Catalog...
          </div>
        ) : discountedProducts.length === 0 ? (
          <div className="py-20 text-center space-y-4">
            <span className="material-symbols-outlined text-4xl text-slate-grey/40">local_offer</span>
            <p className="font-body-md text-slate-grey text-sm">No special promotional offers are active right now.</p>
            <Link href="/collections" className="inline-block px-8 py-3.5 bg-black text-white font-button text-xs uppercase tracking-widest hover:bg-black/90">
              Explore All Collections
            </Link>
          </div>
        ) : (
          <div className="space-y-8">
            <div className="flex justify-between items-center border-b border-soft-linen pb-4 font-label-caps text-xs uppercase tracking-widest">
              <span className="text-deep-navy font-semibold">{discountedProducts.length} Exclusive Offer Pieces</span>
              <span className="text-slate-grey">Complimentary Gift Packaging Included</span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8">
              {discountedProducts.map((p) => {
                const origPrice = p.originalPrice || p.price * 1.25;
                const savingsPercent = Math.round(((origPrice - p.price) / origPrice) * 100);

                return (
                  <Link
                    key={p.id}
                    href={`/product/${p.id}`}
                    className="group flex flex-col space-y-3 bg-pure-white border border-soft-linen p-3.5 hover:border-black/30 shadow-xs hover:shadow-md transition-all duration-300 relative"
                  >
                    {/* Discount Badge */}
                    <div className="absolute top-5 left-5 z-20 bg-emerald-700 text-white font-label-caps text-[9px] font-bold px-2 py-0.5 uppercase tracking-wider shadow-sm">
                      {savingsPercent}% OFF
                    </div>

                    <div className="relative aspect-[4/5] bg-soft-linen overflow-hidden">
                      <Image
                        src={p.image}
                        alt={p.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-500 mix-blend-multiply"
                        sizes="(max-width: 768px) 50vw, 25vw"
                      />
                    </div>

                    <div className="space-y-1">
                      <h3 className="font-label-caps text-xs uppercase font-semibold text-deep-navy group-hover:text-black line-clamp-1">
                        {p.title}
                      </h3>
                      <p className="text-[10px] text-slate-grey uppercase tracking-wider">
                        {p.material || p.type}
                      </p>
                      <div className="flex items-baseline gap-2 pt-1">
                        <span className="font-body-md text-sm font-semibold text-deep-navy">
                          {formatPrice(p.price)}
                        </span>
                        <span className="font-body-md text-xs text-slate-grey/60 line-through">
                          {formatPrice(origPrice)}
                        </span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
