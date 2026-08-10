"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { fetchCategories } from "@/utils/api";

const DEFAULT_CATEGORIES = [
  {
    id: "necklace",
    title: "Necklace",
    image:
      "https://res.cloudinary.com/cacfvpzf/image/upload/v1785734524/vrix/z7ekw55bkfo527ivhzme.png",
    link: "/collections/necklace",
    isVisible: true,
  },
  {
    id: "earrings",
    title: "Earrings",
    image:
      "https://res.cloudinary.com/cacfvpzf/image/upload/v1785734524/vrix/apetikskyjypxmrcvdwe.png",
    link: "/collections/earrings",
    isVisible: true,
  },
  {
    id: "bracelets",
    title: "Bracelets",
    image:
      "https://res.cloudinary.com/cacfvpzf/image/upload/v1785734524/vrix/cksu4mgtvw5iowjpe2h8.png",
    link: "/collections/bracelets",
    isVisible: true,
  },
  {
    id: "rings",
    title: "Rings",
    image:
      "https://res.cloudinary.com/cacfvpzf/image/upload/v1785734523/vrix/i3fkvzr4zlvqbnhzjixd.png",
    link: "/collections/rings",
    isVisible: true,
  },
  {
    id: "charms",
    title: "Charms",
    image:
      "https://res.cloudinary.com/cacfvpzf/image/upload/v1785734523/vrix/i0mfwsxjrxpdkdti4sp7.png",
    link: "/collections/charms",
    isVisible: true,
  },
];

export default function CategoriesPage() {
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCategories()
      .then((res) => {
        if (Array.isArray(res) && res.length > 0) {
          setCategories(res);
        } else {
          setCategories(DEFAULT_CATEGORIES);
        }
      })
      .catch(() => setCategories(DEFAULT_CATEGORIES))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="w-full bg-surface min-h-screen">
      <main className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop py-section-gap">

        {/* Editorial Title */}
        <header className="max-w-3xl mx-auto text-center mb-16 space-y-4">
          <p className="font-label-caps text-label-caps text-slate-grey uppercase tracking-widest">
            Atelier Selections
          </p>
          <h1 className="font-display-lg-mobile md:font-display-lg text-display-lg-mobile md:text-display-lg text-deep-navy uppercase">
            Shop by Category
          </h1>
          <p className="font-body-lg text-body-lg text-slate-grey leading-relaxed">
            Discover our curated jewelry categories — each crafted with precision and quiet intention, from signature necklaces to architectural rings.
          </p>
        </header>

        {/* Loading Skeleton */}
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-product-gap">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="aspect-square bg-soft-linen animate-pulse border border-slate-grey/10"
              />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-product-gap">
            {categories.map((cat, idx) => (
              <Link
                key={cat.id || idx}
                href={`/collections/${encodeURIComponent(cat.id)}`}
                className="group relative aspect-square overflow-hidden border border-slate-grey/10 cursor-pointer block shadow-sm hover:shadow-md transition-shadow duration-500"
              >
                {/* Image */}
                <Image
                  alt={cat.title}
                  fill
                  className="object-cover object-center transition-transform duration-700 ease-out group-hover:scale-105"
                  src={
                    cat.image ||
                    "https://images.unsplash.com/photo-1605100804763-247f67b3557e?q=80&w=600&auto=format&fit=crop"
                  }
                  sizes="(max-width: 640px) 50vw, 33vw"
                />

                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent transition-opacity duration-500 group-hover:opacity-90" />

                {/* Title + Arrow */}
                <div className="absolute inset-0 flex items-end p-6">
                  <div className="w-full flex justify-between items-center text-pure-white">
                    <div className="space-y-1">
                      <p className="font-label-caps text-[10px] tracking-widest uppercase opacity-75">
                        {cat.tagline || "Collection"}
                      </p>
                      <h2 className="font-headline-md text-headline-md uppercase font-semibold leading-tight">
                        {cat.title}
                      </h2>
                    </div>
                    <div className="w-10 h-10 rounded-full border border-pure-white/50 flex items-center justify-center group-hover:bg-pure-white group-hover:text-deep-navy transition-all duration-300 shrink-0 ml-4">
                      <span className="material-symbols-outlined text-lg transform group-hover:translate-x-0.5 transition-transform">
                        arrow_forward
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Bottom CTA */}
        {!loading && (
          <div className="mt-16 text-center">
            <p className="font-body-md text-slate-grey text-sm mb-6 leading-relaxed">
              Looking for a specific design? Explore our full collection or request a bespoke piece.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/collections"
                className="inline-flex items-center gap-2 font-button text-button text-deep-navy hover:text-slate-grey transition-colors uppercase tracking-widest border-b border-deep-navy pb-1 cursor-pointer"
              >
                Explore All Collections
                <i className="fa-solid fa-arrow-right text-xs" />
              </Link>
              <span className="hidden sm:block text-slate-grey/30">·</span>
              <Link
                href="/bespoke"
                className="inline-flex items-center gap-2 font-button text-button text-slate-grey hover:text-deep-navy transition-colors uppercase tracking-widest cursor-pointer"
              >
                Bespoke Atelier
                <span className="material-symbols-outlined text-xs">diamond</span>
              </Link>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
