"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useMemo, Suspense, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { fetchCollections, fetchProducts } from "@/utils/api";
import { useAuth } from "@/context/AuthContext";

const DEFAULT_PRODUCTS: any[] = [];

function CollectionContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { isLoggedIn } = useAuth();
  const collectionQuery = searchParams.get("collection");

  const [products, setProducts] = useState(DEFAULT_PRODUCTS);
  const [collections, setCollections] = useState<any[]>([]);
  const [selectedMaterial, setSelectedMaterial] = useState("All");
  const [selectedType, setSelectedType] = useState("All");
  const [sortBy, setSortBy] = useState("Curated");
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Sync wishlist from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem("vrix-wishlist");
      if (saved) {
        setWishlist(JSON.parse(saved));
      }
    } catch {}
  }, []);

  // Filter & Sort menus open states
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);

  // Fetch products from Express backend
  useEffect(() => {
    fetchProducts()
      .then((res) => {
        if (Array.isArray(res)) {
          setProducts(res);
        }
      })
      .catch((err) => console.error("Error fetching products from backend:", err));

    fetchCollections()
      .then((res) => {
        if (Array.isArray(res)) {
          setCollections(res);
        }
      })
      .catch((err) => console.error("Error fetching collections from backend:", err));
  }, []);

  const collectionInfo = useMemo(() => {
    const selectedCollection = collections.find((collection) => collection.id === (collectionQuery || "silent-center"));
    if (selectedCollection) {
      return {
        title: selectedCollection.title,
        description: selectedCollection.description || selectedCollection.tagline || "",
      };
    }

    switch (collectionQuery) {
      case "solitude":
        return {
          title: "The Solitude Collection",
          description: "Meticulous, ultra-minimalist designs that focus on purity and quiet comfort. Linear bands and empty spaces crafted for peaceful daily wear.",
        };
      case "presence":
        return {
          title: "The Presence Collection",
          description: "Bold geometric shapes and architectural volume that make a quiet statement of confidence, stability, and character.",
        };
      case "light":
        return {
          title: "The Light Collection",
          description: "Highly polished, reflecting surfaces designed to catch and project light. A celebration of transformation, hope, and inner growth.",
        };
      default:
        return {
          title: "The Silent Center Collection",
          description: "A meditation on form and negative space. Pieces designed to ground you in the present moment, crafted with uncompromising architectural precision and conscious materials.",
        };
    }
  }, [collectionQuery, collections]);

  const toggleWishlist = (id: string, title: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isLoggedIn) {
      showToast("Please sign in to save items to your wishlist.");
      setTimeout(() => router.push("/account"), 1000);
      return;
    }
    try {
      const saved = localStorage.getItem("vrix-wishlist");
      let list = saved ? JSON.parse(saved) : [];
      if (list.includes(id)) {
        list = list.filter((item: string) => item !== id);
        setWishlist(list);
        showToast(`Removed "${title}" from Wishlist.`);
      } else {
        list.push(id);
        setWishlist(list);
        showToast(`Added "${title}" to Wishlist.`);
      }
      localStorage.setItem("vrix-wishlist", JSON.stringify(list));
    } catch (err) {
      console.error("Wishlist toggle error:", err);
    }
  };

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  const handleResetFilters = () => {
    setSelectedMaterial("All");
    setSelectedType("All");
    showToast("Filters reset successfully.");
  };

  // Filtered and Sorted Products
  const processedProducts = useMemo(() => {
    const activeCollection = collectionQuery || "silent-center";
    let result = products.filter((p) => (
      p.isVisible !== false &&
      (p.stock ?? 999) > 0 &&
      (p.collection || "silent-center") === activeCollection
    ));

    // Filter by Material
    if (selectedMaterial !== "All") {
      result = result.filter((p) => {
        const mat = p.material.toLowerCase();
        if (selectedMaterial === "Gold") return mat.includes("gold");
        if (selectedMaterial === "Silver") return mat.includes("silver");
        return true;
      });
    }

    // Filter by Type
    if (selectedType !== "All") {
      result = result.filter((p) => p.type === selectedType);
    }

    // Sort by selection
    if (sortBy === "PriceLowHigh") {
      result.sort((a, b) => a.price - b.price);
    } else if (sortBy === "PriceHighLow") {
      result.sort((a, b) => b.price - a.price);
    }

    return result;
  }, [products, collectionQuery, selectedMaterial, selectedType, sortBy]);

  return (
    <div className="w-full bg-pure-white relative min-h-screen">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-8 right-8 z-50 bg-deep-navy text-pure-white px-6 py-4 border border-slate-grey/30 shadow-2xl flex items-center gap-3 animate-fade-in duration-300">
          <span className="material-symbols-outlined text-sm">info</span>
          <p className="font-body-md text-sm tracking-wide">{toastMessage}</p>
          <button
            onClick={() => setToastMessage(null)}
            className="ml-4 hover:text-slate-grey cursor-pointer text-xs"
          >
            ✕
          </button>
        </div>
      )}

      <main className="flex-grow w-full max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop pb-section-gap">
        
        {/* Header Section */}
        <header className="py-section-gap flex flex-col items-center text-center max-w-3xl mx-auto space-y-stack-md">
          <h1 className="font-display-lg-mobile text-display-lg-mobile md:font-display-lg md:text-display-lg text-deep-navy uppercase tracking-tight">
            {collectionInfo.title}
          </h1>
          <p className="font-body-lg text-body-lg text-secondary">
            {collectionInfo.description}
          </p>
        </header>

        {/* Filter & Sort Bar */}
        <div className="border-t border-b border-slate-grey/30 py-4 mb-stack-lg flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0 relative z-20">
          
          {/* Filters Controls */}
          <div className="flex flex-wrap items-center gap-6">
            <button
              onClick={() => {
                setFiltersOpen(!filtersOpen);
                setSortOpen(false);
              }}
              className="font-label-caps text-label-caps text-on-surface hover:text-deep-navy uppercase tracking-widest flex items-center space-x-1 group transition-colors cursor-pointer"
            >
              <span>Filters</span>
              <span
                className={`material-symbols-outlined text-[16px] transition-transform duration-300 ${
                  filtersOpen ? "rotate-180" : ""
                }`}
              >
                expand_more
              </span>
            </button>

            {/* Quick Status indicators */}
            {(selectedMaterial !== "All" || selectedType !== "All") && (
              <div className="flex items-center gap-2">
                <span className="text-xs font-body-md text-slate-grey bg-soft-linen px-2 py-1 uppercase tracking-wider">
                  Active Filters
                </span>
                <button
                  onClick={handleResetFilters}
                  className="text-xs font-label-caps text-deep-navy underline cursor-pointer hover:text-slate-grey"
                >
                  Clear All
                </button>
              </div>
            )}
          </div>

          {/* Sort Controls */}
          <div className="flex items-center relative">
            <button
              onClick={() => {
                setSortOpen(!sortOpen);
                setFiltersOpen(false);
              }}
              className="font-label-caps text-label-caps text-on-surface hover:text-deep-navy uppercase tracking-widest flex items-center space-x-1 group transition-colors cursor-pointer"
            >
              <span>
                Sort by: {sortBy === "Curated" ? "Curated" : sortBy === "PriceLowHigh" ? "Price: Low to High" : "Price: High to Low"}
              </span>
              <span
                className={`material-symbols-outlined text-[16px] transition-transform duration-300 ${
                  sortOpen ? "rotate-180" : ""
                }`}
              >
                expand_more
              </span>
            </button>

            {/* Sort Dropdown */}
            {sortOpen && (
              <div className="absolute right-0 top-full mt-2 w-56 bg-pure-white border border-slate-grey/20 shadow-xl py-2 flex flex-col z-30">
                <button
                  onClick={() => {
                    setSortBy("Curated");
                    setSortOpen(false);
                  }}
                  className={`px-4 py-2 text-left font-label-caps text-xs tracking-wider uppercase hover:bg-soft-linen cursor-pointer ${
                    sortBy === "Curated" ? "text-deep-navy font-semibold" : "text-slate-grey"
                  }`}
                >
                  Curated
                </button>
                <button
                  onClick={() => {
                    setSortBy("PriceLowHigh");
                    setSortOpen(false);
                  }}
                  className={`px-4 py-2 text-left font-label-caps text-xs tracking-wider uppercase hover:bg-soft-linen cursor-pointer ${
                    sortBy === "PriceLowHigh" ? "text-deep-navy font-semibold" : "text-slate-grey"
                  }`}
                >
                  Price: Low to High
                </button>
                <button
                  onClick={() => {
                    setSortBy("PriceHighLow");
                    setSortOpen(false);
                  }}
                  className={`px-4 py-2 text-left font-label-caps text-xs tracking-wider uppercase hover:bg-soft-linen cursor-pointer ${
                    sortBy === "PriceHighLow" ? "text-deep-navy font-semibold" : "text-slate-grey"
                  }`}
                >
                  Price: High to Low
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Filters Panel Expandable */}
        {filtersOpen && (
          <div className="bg-soft-linen/30 border border-slate-grey/10 p-6 mb-stack-lg grid grid-cols-1 md:grid-cols-2 gap-8 z-10 relative">
            <div>
              <h4 className="font-label-caps text-[10px] text-ink-black tracking-widest uppercase mb-4">
                Material
              </h4>
              <div className="flex flex-wrap gap-3">
                {["All", "Gold", "Silver"].map((mat) => (
                  <button
                    key={mat}
                    onClick={() => setSelectedMaterial(mat)}
                    className={`px-4 py-2 text-xs font-label-caps tracking-wider uppercase border transition-colors cursor-pointer ${
                      selectedMaterial === mat
                        ? "border-deep-navy bg-deep-navy text-pure-white"
                        : "border-slate-grey/20 bg-pure-white text-slate-grey hover:border-slate-grey"
                    }`}
                  >
                    {mat}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <h4 className="font-label-caps text-[10px] text-ink-black tracking-widest uppercase mb-4">
                Product Type
              </h4>
              <div className="flex flex-wrap gap-3">
                {["All", "Ring", "Necklace", "Earring", "Bracelet"].map((type) => (
                  <button
                    key={type}
                    onClick={() => setSelectedType(type)}
                    className={`px-4 py-2 text-xs font-label-caps tracking-wider uppercase border transition-colors cursor-pointer ${
                      selectedType === type
                        ? "border-deep-navy bg-deep-navy text-pure-white"
                        : "border-slate-grey/20 bg-pure-white text-slate-grey hover:border-slate-grey"
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Empty State if No Products Match */}
        {processedProducts.length === 0 ? (
          <div className="text-center py-section-gap flex flex-col items-center justify-center space-y-4">
            <span className="material-symbols-outlined text-slate-grey text-4xl">inventory_2</span>
            <p className="font-headline-md text-slate-grey">No products found matching your active filters.</p>
            <button
              onClick={handleResetFilters}
              className="px-6 py-2 border border-deep-navy text-deep-navy font-button text-xs uppercase hover:bg-deep-navy hover:text-pure-white transition-colors cursor-pointer"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          /* Product Grid */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-gutter">
            {processedProducts.map((p) => {
              const isWishlisted = wishlist.includes(p.id);
              return (
                <Link
                  key={p.id}
                  href={`/product/${p.id}`}
                  className="flex flex-col group cursor-pointer"
                >
                  {/* Image Container */}
                  <div className="relative w-full aspect-[4/5] bg-soft-linen overflow-hidden">
                    <Image
                      alt={p.title}
                      fill
                      className="object-cover object-center mix-blend-multiply opacity-90 group-hover:scale-105 transition-transform duration-700 ease-out"
                      src={p.image}
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    />
                    {/* Wishlist Button */}
                    <button
                      onClick={(e) => toggleWishlist(p.id, p.title, e)}
                      aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
                      className="absolute top-4 right-4 text-slate-grey hover:text-deep-navy transition-colors z-10 cursor-pointer p-1"
                    >
                      <span
                        className="material-symbols-outlined text-xl"
                        style={{
                          fontVariationSettings: `'FILL' ${isWishlisted ? 1 : 0}, 'wght' 200`,
                          color: isWishlisted ? "#ba1a1a" : "inherit",
                        }}
                      >
                        favorite
                      </span>
                    </button>
                  </div>
                  {/* Details */}
                  <div className="mt-stack-sm flex justify-between items-start pt-2">
                    <div className="flex flex-col space-y-1">
                      <h2 className="font-body-md text-body-md text-on-surface font-medium">
                        {p.title}
                      </h2>
                      <span className="font-label-caps text-label-caps text-slate-grey uppercase tracking-widest text-[10px]">
                        {p.material}
                      </span>
                    </div>
                    <span className="font-body-md text-body-md text-on-surface font-semibold">
                      ${p.price}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}

export default function CollectionPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-pure-white flex items-center justify-center text-slate-grey font-label-caps text-xs tracking-widest">Loading Collection...</div>}>
      <CollectionContent />
    </Suspense>
  );
}
