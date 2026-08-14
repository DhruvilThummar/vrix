"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

interface CategoriesClientProps {
  initialCategories: any[];
}

export default function CategoriesClient({ initialCategories }: CategoriesClientProps) {
  const [categories] = useState<any[]>(initialCategories);

  return (
    <div className="w-full bg-surface min-h-screen">
      <main className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop py-section-gap">
        {/* Visible Breadcrumbs for SEO */}
        <nav className="flex items-center gap-2 text-[10px] font-label-caps text-slate-grey uppercase tracking-wider mb-6">
          <Link href="/" className="hover:text-ink-black transition-colors">Home</Link>
          <span className="material-symbols-outlined text-[10px]">chevron_right</span>
          <span className="text-ink-black font-semibold">Categories</span>
        </nav>

        {/* Editorial Title */}
        <header className="max-w-3xl mx-auto text-center mb-16 space-y-4">
          <p className="font-jost font-secondary font-label-caps text-label-caps text-slate-grey uppercase tracking-widest">
            Atelier Selections
          </p>
          <h1 className="font-inter font-primary font-display-lg-mobile md:font-display-lg text-display-lg-mobile md:text-display-lg text-deep-navy uppercase">
            Shop by Category
          </h1>
          <p className="font-body-lg text-body-lg text-slate-grey leading-relaxed">
            Discover our curated jewelry categories — each crafted with precision and quiet intention, from signature necklaces to architectural rings.
          </p>
        </header>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-product-gap">
          {categories.map((cat, idx) => (
            <Link
              key={cat.id || idx}
              href={`/collections/${encodeURIComponent(cat.id)}`}
              className="group relative flex flex-col items-center text-center cursor-pointer"
            >
              <div className="relative w-full aspect-[4/5] bg-soft-linen overflow-hidden">
                <Image
                  src={cat.image}
                  alt={`${cat.title} category luxury jewelry collection — VRIX`}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 33vw"
                />
                <div className="absolute inset-0 bg-ink-black/10 group-hover:bg-ink-black/20 transition-colors duration-300" />
              </div>
              <h2 className="mt-4 font-label-caps text-xs text-deep-navy uppercase tracking-widest font-semibold group-hover:text-ink-black transition-colors">
                {cat.title}
              </h2>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
