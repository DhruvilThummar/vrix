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
    badge: "★ Limited Time Privileges",
    bannerImage: "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?q=80&w=1600&auto=format&fit=crop",
    filterMode: "sku",
    allowedSkus: [],
    showcaseProjects: []
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
          badge: dbData.offers_page.badge || "★ Limited Time Privileges",
          bannerImage: dbData.offers_page.bannerImage || "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?q=80&w=1600&auto=format&fit=crop",
          filterMode: dbData.offers_page.filterMode || "sku",
          allowedSkus: Array.isArray(dbData.offers_page.allowedSkus) ? dbData.offers_page.allowedSkus : [],
          showcaseProjects: Array.isArray(dbData.offers_page.showcaseProjects) ? dbData.offers_page.showcaseProjects : []
        });
      }
      setLoading(false);
    });
  }, []);

  // Filter Catalog Products based on CMS rule
  const offerCatalogProducts = useMemo(() => {
    if (cms.filterMode === "sku" && Array.isArray(cms.allowedSkus) && cms.allowedSkus.length > 0) {
      const match = products.filter((p) => cms.allowedSkus.includes(p.id) || cms.allowedSkus.includes(p.sku));
      if (match.length > 0) return match;
    }
    if (cms.filterMode === "all") {
      return products;
    }
    // Default fallback: discounted or VRIX+ exclusive
    return products.filter((p) => {
      const hasOriginalDiscount = p.originalPrice && Number(p.originalPrice) > Number(p.price);
      const isVrixPlusExclusive = p.isVrixPlusExclusive && p.vrixPlusPrice;
      return hasOriginalDiscount || isVrixPlusExclusive;
    });
  }, [products, cms.filterMode, cms.allowedSkus]);

  // Helper to find featured products for a showcase block
  const getShowcaseProducts = (skus: string[]) => {
    if (!Array.isArray(skus) || skus.length === 0) return [];
    return products.filter((p) => skus.includes(p.id) || skus.includes(p.sku));
  };

  return (
    <div className="min-h-screen bg-pure-white text-ink-black pt-20 md:pt-24 pb-16">
      
      {/* Hero Banner */}
      <section className="relative w-full h-[340px] md:h-[450px] bg-deep-navy flex items-center justify-center text-center overflow-hidden">
        {cms.bannerImage && (
          <Image
            src={cms.bannerImage}
            alt={cms.title}
            fill
            className="object-cover object-center opacity-40 mix-blend-overlay"
            priority
          />
        )}
        <div className="relative z-10 max-w-3xl px-6 space-y-4 animate-fade-in">
          {cms.badge && (
            <span className="font-label-caps text-xs text-amber-300 uppercase tracking-widest block font-bold">
              {cms.badge}
            </span>
          )}
          <h1 className="font-display-lg text-3xl md:text-5xl text-pure-white uppercase tracking-wider leading-tight">
            {cms.title}
          </h1>
          <p className="font-body-md text-xs md:text-sm text-pure-white/80 max-w-2xl mx-auto leading-relaxed">
            {cms.subtitle}
          </p>
        </div>
      </section>

      <main className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop py-12 space-y-16">
        
        {loading ? (
          <div className="py-20 text-center text-slate-grey font-label-caps text-xs tracking-widest uppercase flex justify-center items-center gap-3">
            <span className="w-5 h-5 border-2 border-deep-navy border-t-transparent rounded-full animate-spin" />
            Loading Offers Catalog...
          </div>
        ) : (
          <>
            {/* ── PROJECT SHOWCASE SECTIONS ───────────────────────────────── */}
            {Array.isArray(cms.showcaseProjects) && cms.showcaseProjects.length > 0 && (
              <section className="space-y-16">
                {cms.showcaseProjects.map((showcase: any, idx: number) => {
                  const showcaseProds = getShowcaseProducts(showcase.featuredSkus || []);
                  const isRight = showcase.layout === "banner_right";
                  const isFull = showcase.layout === "full_width";

                  if (isFull) {
                    return (
                      <div key={showcase.id || idx} className="relative w-full rounded overflow-hidden bg-deep-navy text-white p-8 md:p-14 flex flex-col md:flex-row items-center justify-between gap-8 shadow-xl">
                        {showcase.bannerImage && (
                          <Image
                            src={showcase.bannerImage}
                            alt={showcase.title}
                            fill
                            className="object-cover opacity-30 mix-blend-overlay"
                          />
                        )}
                        <div className="relative z-10 max-w-xl space-y-3">
                          {showcase.badge && (
                            <span className="font-label-caps text-[10px] text-amber-300 uppercase tracking-widest font-bold">
                              {showcase.badge}
                            </span>
                          )}
                          <h2 className="font-display-lg text-2xl md:text-4xl uppercase tracking-wider">{showcase.title}</h2>
                          <p className="text-xs md:text-sm text-white/80 leading-relaxed">{showcase.subtitle}</p>
                          <Link
                            href={showcase.link || "/collections"}
                            className="inline-block mt-4 px-6 py-3 bg-white text-black font-button text-xs uppercase tracking-widest hover:bg-amber-300 transition-colors"
                          >
                            {showcase.linkText || "Explore Collection"}
                          </Link>
                        </div>
                        {showcaseProds.length > 0 && (
                          <div className="relative z-10 grid grid-cols-2 gap-3 w-full md:w-auto shrink-0">
                            {showcaseProds.slice(0, 2).map((p) => (
                              <Link key={p.id} href={`/product/${p.id}`} className="bg-white/10 backdrop-blur-md p-3 rounded border border-white/20 hover:border-white transition-all text-center space-y-1.5 w-36 sm:w-44">
                                <div className="relative aspect-square w-full bg-white/20 rounded overflow-hidden">
                                  <Image src={p.image} alt={p.title} fill className="object-cover" />
                                </div>
                                <h4 className="font-label-caps text-[10px] text-white uppercase truncate font-semibold">{p.title}</h4>
                                <p className="text-amber-300 text-xs font-bold">{formatPrice(p.price)}</p>
                              </Link>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  }

                  return (
                    <div key={showcase.id || idx} className="border border-soft-linen rounded p-6 md:p-10 bg-soft-linen/20 space-y-8 shadow-xs">
                      <div className={`flex flex-col md:flex-row items-center gap-8 ${isRight ? "md:flex-row-reverse" : ""}`}>
                        {/* Banner Image */}
                        <div className="relative w-full md:w-1/2 aspect-[16/9] md:aspect-[4/3] rounded overflow-hidden shadow-md">
                          <Image
                            src={showcase.bannerImage || "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?q=80&w=1000&auto=format&fit=crop"}
                            alt={showcase.title}
                            fill
                            className="object-cover hover:scale-105 transition-transform duration-700"
                          />
                        </div>

                        {/* Content */}
                        <div className="w-full md:w-1/2 space-y-4">
                          {showcase.badge && (
                            <span className="font-label-caps text-[10px] text-amber-700 uppercase tracking-widest font-bold px-2 py-0.5 bg-amber-50 border border-amber-200 inline-block rounded">
                              {showcase.badge}
                            </span>
                          )}
                          <h2 className="font-display-lg text-2xl md:text-3xl text-deep-navy uppercase tracking-wider">{showcase.title}</h2>
                          <p className="text-slate-grey font-body-md text-xs md:text-sm leading-relaxed">{showcase.subtitle}</p>

                          <Link
                            href={showcase.link || "/collections"}
                            className="inline-flex items-center gap-2 px-6 py-3 bg-deep-navy text-white font-button text-xs uppercase tracking-widest hover:bg-black transition-colors"
                          >
                            <span>{showcase.linkText || "Explore Showcase"}</span>
                            <span className="material-symbols-outlined text-sm">arrow_forward</span>
                          </Link>
                        </div>
                      </div>

                      {/* Showcase Featured Products Grid */}
                      {showcaseProds.length > 0 && (
                        <div className="pt-6 border-t border-soft-linen space-y-4">
                          <h4 className="font-label-caps text-xs text-slate-grey uppercase tracking-widest font-semibold">
                            Showcase Featured Pieces ({showcaseProds.length})
                          </h4>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {showcaseProds.map((p) => {
                              const origPrice = p.originalPrice || p.price * 1.25;
                              const savingsPercent = Math.round(((origPrice - p.price) / origPrice) * 100);
                              return (
                                <Link
                                  key={p.id}
                                  href={`/product/${p.id}`}
                                  className="group flex flex-col space-y-2.5 bg-pure-white border border-soft-linen p-3 hover:border-black/30 transition-all duration-300 relative shadow-xs"
                                >
                                  {savingsPercent > 0 && (
                                    <div className="absolute top-4 left-4 z-20 bg-emerald-700 text-white font-label-caps text-[9px] font-bold px-1.5 py-0.5 uppercase">
                                      {savingsPercent}% OFF
                                    </div>
                                  )}
                                  <div className="relative aspect-square bg-soft-linen overflow-hidden">
                                    <Image src={p.image} alt={p.title} fill className="object-cover group-hover:scale-105 transition-transform duration-500 mix-blend-multiply" />
                                  </div>
                                  <div>
                                    <h5 className="font-label-caps text-xs uppercase font-semibold text-deep-navy line-clamp-1">{p.title}</h5>
                                    <p className="text-[10px] text-slate-grey uppercase">{p.material || p.type}</p>
                                    <div className="flex items-baseline gap-1.5 pt-1">
                                      <span className="font-body-md text-xs font-semibold text-deep-navy">{formatPrice(p.price)}</span>
                                      {origPrice > p.price && (
                                        <span className="font-body-md text-[10px] text-slate-grey/60 line-through">{formatPrice(origPrice)}</span>
                                      )}
                                    </div>
                                  </div>
                                </Link>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </section>
            )}

            {/* ── MAIN OFFERS CATALOG GRID ────────────────────────────────── */}
            <section className="space-y-8">
              <div className="flex justify-between items-center border-b border-soft-linen pb-4 font-label-caps text-xs uppercase tracking-widest">
                <span className="text-deep-navy font-semibold">{offerCatalogProducts.length} Exclusive Offer Pieces</span>
                <span className="text-slate-grey">Complimentary Signature Packaging Included</span>
              </div>

              {offerCatalogProducts.length === 0 ? (
                <div className="py-20 text-center space-y-4">
                  <span className="material-symbols-outlined text-4xl text-slate-grey/40">local_offer</span>
                  <p className="font-body-md text-slate-grey text-sm">No products match the selected offer filter criteria.</p>
                  <Link href="/collections" className="inline-block px-8 py-3.5 bg-black text-white font-button text-xs uppercase tracking-widest hover:bg-black/90">
                    Explore All Collections
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8">
                  {offerCatalogProducts.map((p) => {
                    const origPrice = p.originalPrice || (p.price > 0 ? p.price * 1.25 : 0);
                    const savingsPercent = origPrice > p.price ? Math.round(((origPrice - p.price) / origPrice) * 100) : 0;

                    return (
                      <Link
                        key={p.id}
                        href={`/product/${p.id}`}
                        className="group flex flex-col space-y-3 bg-pure-white border border-soft-linen p-3.5 hover:border-black/30 shadow-xs hover:shadow-md transition-all duration-300 relative"
                      >
                        {/* Discount or SKU Badge */}
                        <div className="absolute top-5 left-5 z-20 flex flex-col gap-1">
                          {savingsPercent > 0 && (
                            <div className="bg-emerald-700 text-white font-label-caps text-[9px] font-bold px-2 py-0.5 uppercase tracking-wider shadow-sm">
                              {savingsPercent}% OFF
                            </div>
                          )}
                          {p.sku && (
                            <div className="bg-deep-navy/80 text-white font-label-caps text-[8px] px-1.5 py-0.5 uppercase tracking-wider">
                              SKU: {p.sku}
                            </div>
                          )}
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
                            {origPrice > p.price && (
                              <span className="font-body-md text-xs text-slate-grey/60 line-through">
                                {formatPrice(origPrice)}
                              </span>
                            )}
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </section>
          </>
        )}
      </main>
    </div>
  );
}
