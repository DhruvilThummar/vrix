"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { fetchProducts } from "@/utils/api";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import { useCurrency } from "@/context/CurrencyContext";

interface Product {
  id: string;
  title: string;
  material: string;
  price: number;
  image: string;
  type: string;
}

export default function SearchPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const { formatPrice } = useCurrency();

  useEffect(() => {
    fetchProducts()
      .then((res) => {
        setProducts(res);
      })
      .catch((err) => console.error("Error loading products:", err))
      .finally(() => setLoading(false));
  }, []);

  const filteredProducts = useMemo(() => {
    if (!searchQuery.trim()) {
      return []; // Do not show dummy/default products when search is empty
    }
    const query = searchQuery.toLowerCase();
    return products.filter(
      (p) =>
        p.title.toLowerCase().includes(query) ||
        p.material.toLowerCase().includes(query) ||
        p.type.toLowerCase().includes(query)
    );
  }, [products, searchQuery]);

  const trendingSearches = [
    "Ring",
    "Chain",
    "Bracelet",
    "Hoops",
    "Silver"
  ];

  return (
    <div className="w-full min-h-[70vh] bg-pure-white">
      <main className="flex-grow w-full max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop pt-section-gap pb-section-gap flex flex-col items-center">
        {/* Search Input Box */}
        <div className="w-full max-w-3xl relative mb-stack-lg animate-fade-in-up">
          <span className="material-symbols-outlined absolute left-0 top-1/2 transform -translate-y-1/2 text-slate-grey text-[28px]">search</span>
          <input
            autoFocus
            className="search-input w-full bg-transparent border-0 border-b border-slate-grey/30 py-4 pl-12 pr-12 text-display-lg-mobile md:text-display-lg font-display-lg placeholder:text-slate-grey/30 transition-colors duration-300 outline-none focus:border-deep-navy focus:ring-0"
            placeholder="Search VRIX..."
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              aria-label="Clear Search"
              onClick={() => setSearchQuery("")}
              className="absolute right-0 top-1/2 transform -translate-y-1/2 text-slate-grey hover:text-deep-navy transition-colors duration-300 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[28px]">close</span>
            </button>
          )}
        </div>

        {/* Trending Searches */}
        <div className="w-full max-w-3xl mb-section-gap animate-fade-in-up" style={{ animationDelay: "100ms" }}>
          <h2 className="font-label-caps text-label-caps text-slate-grey mb-stack-md uppercase tracking-widest">Trending Searches</h2>
          <div className="flex flex-wrap gap-x-stack-lg gap-y-stack-sm font-trending text-body-lg text-secondary">
            {trendingSearches.map((term) => (
              <button
                key={term}
                onClick={() => setSearchQuery(term)}
                className="hover:text-deep-navy transition-colors duration-300 relative group font-body-md text-slate-grey cursor-pointer text-base bg-transparent border-0"
              >
                {term}
                <span className="absolute left-0 bottom-0 w-0 h-[1px] bg-deep-navy transition-all duration-300 group-hover:w-full"></span>
              </button>
            ))}
          </div>
        </div>

        {/* Results */}
        <div className="w-full animate-fade-in-up" style={{ animationDelay: "200ms" }}>
          <h2 className="font-label-caps text-label-caps text-slate-grey mb-stack-lg uppercase tracking-widest border-b border-slate-grey/20 pb-4">
            {searchQuery ? `Search Results (${filteredProducts.length})` : "Start Typing to Search"}
          </h2>
          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-gutter">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex flex-col">
                  <div className="relative w-full aspect-[4/5] bg-soft-linen overflow-hidden mb-2">
                    <Skeleton height="100%" containerClassName="absolute inset-0 block h-full w-full" />
                  </div>
                  <div className="mt-stack-sm flex justify-between items-start pt-2">
                    <div className="flex flex-col space-y-1 w-2/3">
                      <Skeleton height={18} width="80%" />
                      <Skeleton height={12} width="50%" />
                    </div>
                    <div className="w-12">
                      <Skeleton height={18} width="100%" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : !searchQuery.trim() ? (
            <div className="text-center py-16 text-slate-grey font-body-md italic">
              Search by typing collections, jewelry categories, or materials above.
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center py-16 text-slate-grey font-body-md">
              No products found matching "{searchQuery}".
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-gutter">
              {filteredProducts.map((p) => (
                <Link
                  key={p.id}
                  className="group block relative cursor-pointer"
                  href={`/product/${p.id}`}
                >
                  <div className="aspect-[4/5] bg-soft-linen mb-stack-sm overflow-hidden relative">
                    <img
                      alt={p.title}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-103 mix-blend-multiply"
                      src={p.image}
                    />
                  </div>
                  <div className="flex justify-between items-start pt-2">
                    <div>
                      <h3 className="font-body-md text-body-md text-ink-black mb-1 group-hover:text-deep-navy transition-colors">
                        {p.title}
                      </h3>
                      <p className="font-label-caps text-[10px] text-slate-grey uppercase tracking-widest">
                        {p.material}
                      </p>
                    </div>
                    <span className="font-body-md text-body-md text-ink-black font-semibold">
                      {formatPrice(p.price)}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
