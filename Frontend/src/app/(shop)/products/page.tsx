"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useMemo, Suspense, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { fetchCollections, fetchProducts, getWishlistKey } from "@/utils/api";
import { useAuth } from "@/context/AuthContext";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import { useCurrency } from "@/utils/useCurrency";

const DEFAULT_PRODUCTS: any[] = [];
const MATERIAL_OPTIONS = ["All", "Gold", "Silver", "Platinum"];
const TYPE_OPTIONS = ["All", "Ring", "Necklace", "Earring", "Bracelet", "Pendant", "Cuff", "Brooch", "Anklet"];

function ProductsCatalogContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, isLoggedIn } = useAuth();
  const { formatPrice } = useCurrency();

  // Sync state with search params
  const getParam = (key: string, fallback: string) => searchParams.get(key) || fallback;

  const [products, setProducts] = useState(DEFAULT_PRODUCTS);
  const [collections, setCollections] = useState<any[]>([]);
  
  const [selectedCollection, setSelectedCollection] = useState(() => getParam("collection", "All"));
  const [selectedMaterial, setSelectedMaterial] = useState(() => getParam("material", "All"));
  const [selectedType, setSelectedType] = useState(() => getParam("type", "All"));
  const [sortBy, setSortBy] = useState(() => getParam("sort", "Curated"));
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Filter panels open/close
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);

  // Sync state when URL params change
  useEffect(() => {
    setSelectedCollection(getParam("collection", "All"));
    setSelectedMaterial(getParam("material", "All"));
    setSelectedType(getParam("type", "All"));
    setSortBy(getParam("sort", "Curated"));
  }, [searchParams]);

  const updateQueryParam = (key: string, value: string) => {
    const nextParams = new URLSearchParams(searchParams.toString());
    if (value === "All" || !value) {
      nextParams.delete(key);
    } else {
      nextParams.set(key, value);
    }
    router.push(`?${nextParams.toString()}`, { scroll: false });
  };

  const handleCollectionChange = (colId: string) => {
    setSelectedCollection(colId);
    updateQueryParam("collection", colId);
  };

  const handleMaterialChange = (mat: string) => {
    setSelectedMaterial(mat);
    updateQueryParam("material", mat);
  };

  const handleTypeChange = (type: string) => {
    setSelectedType(type);
    updateQueryParam("type", type);
  };

  const handleSortChange = (sort: string) => {
    setSortBy(sort);
    updateQueryParam("sort", sort);
  };

  // Sync wishlist from localStorage
  useEffect(() => {
    try {
      const key = getWishlistKey(user?.email);
      const saved = localStorage.getItem(key) || localStorage.getItem("vrix-wishlist");
      if (saved) {
        setWishlist(JSON.parse(saved));
      }
    } catch {}
  }, [user?.email]);

  // Fetch products and collections
  useEffect(() => {
    setLoading(true);
    const pFetch = fetchProducts()
      .then((res) => {
        if (Array.isArray(res)) setProducts(res);
      })
      .catch((err) => console.error("Error fetching products:", err));

    const cFetch = fetchCollections()
      .then((res) => {
        if (Array.isArray(res)) setCollections(res);
      })
      .catch((err) => console.error("Error fetching collections:", err));

    Promise.allSettled([pFetch, cFetch]).finally(() => {
      setLoading(false);
    });
  }, []);

  const toggleWishlist = (id: string, title: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isLoggedIn) {
      showToast("Please sign in to save items to your wishlist.");
      setTimeout(() => router.push("/account"), 1000);
      return;
    }
    try {
      const key = getWishlistKey(user?.email);
      const saved = localStorage.getItem(key) || localStorage.getItem("vrix-wishlist");
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
      localStorage.setItem(key, JSON.stringify(list));
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
    setSelectedCollection("All");
    setSelectedMaterial("All");
    setSelectedType("All");
    const nextParams = new URLSearchParams();
    router.push(`?${nextParams.toString()}`, { scroll: false });
    showToast("Filters reset successfully.");
  };

  // Filtered and Sorted Products
  const processedProducts = useMemo(() => {
    let result = products.filter((p) => p.isVisible !== false && (p.stock ?? 999) > 0);

    // Filter by Collection
    if (selectedCollection !== "All") {
      if (selectedCollection === "none") {
        // "none" means no collection / uncategorized
        result = result.filter((p) => !p.collection || p.collection.trim() === "" || p.collection === "none");
      } else {
        result = result.filter((p) => p.collection === selectedCollection);
      }
    }

    // Filter by Material
    if (selectedMaterial !== "All") {
      result = result.filter((p) => {
        const mat = (p.material || "").toLowerCase();
        if (selectedMaterial === "Gold") return mat.includes("gold");
        if (selectedMaterial === "Silver") return mat.includes("silver");
        if (selectedMaterial === "Platinum") return mat.includes("platinum");
        return true;
      });
    }

    // Filter by Type
    if (selectedType !== "All") {
      result = result.filter((p) => (p.type || "").toLowerCase() === selectedType.toLowerCase());
    }

    // Sort by selection
    if (sortBy === "PriceLowHigh") {
      result.sort((a, b) => a.price - b.price);
    } else if (sortBy === "PriceHighLow") {
      result.sort((a, b) => b.price - a.price);
    }

    return result;
  }, [products, selectedCollection, selectedMaterial, selectedType, sortBy]);

  return (
    <div className="w-full bg-pure-white relative min-h-screen">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-8 right-8 z-50 bg-deep-navy text-pure-white px-6 py-4 border border-slate-grey/30 shadow-2xl flex items-center gap-3 animate-fade-in duration-300">
          <span className="material-symbols-outlined text-sm">info</span>
          <p className="font-body-md text-sm tracking-wide">{toastMessage}</p>
          <button onClick={() => setToastMessage(null)} className="ml-4 hover:text-slate-grey cursor-pointer text-xs">✕</button>
        </div>
      )}

      <main className="flex-grow w-full max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop pb-section-gap">
        
        {/* Header Section */}
        <header className="py-section-gap flex flex-col items-center text-center max-w-3xl mx-auto space-y-stack-md">
          <h1 className="font-display-lg-mobile text-display-lg-mobile md:font-display-lg md:text-display-lg text-deep-navy uppercase tracking-tight">
            All Jewelry
          </h1>
          <p className="font-body-lg text-body-lg text-secondary">
            Explore our complete catalogue of architectural fine jewelry, designed with uncompromising precision and conscious materials.
          </p>
        </header>

        {/* Filter & Sort Bar */}
        <div className="border-t border-b border-slate-grey/30 py-4 mb-stack-lg flex justify-between items-center relative z-20">
          {/* Mobile Filters Toggle */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => {
                setFiltersOpen(!filtersOpen);
                setSortOpen(false);
              }}
              className="md:hidden font-label-caps text-label-caps text-on-surface hover:text-deep-navy uppercase tracking-widest flex items-center space-x-1 group transition-colors cursor-pointer"
            >
              <span>Filters</span>
              <span className={`material-symbols-outlined text-[16px] transition-transform duration-300 ${filtersOpen ? "rotate-180" : ""}`}>
                expand_more
              </span>
            </button>

            <span className="hidden md:inline font-label-caps text-xs text-slate-grey uppercase tracking-widest">
              Catalog / {processedProducts.length} Items
            </span>

            {/* Quick Status indicators */}
            {(selectedCollection !== "All" || selectedMaterial !== "All" || selectedType !== "All") && (
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-body-md text-slate-grey bg-soft-linen px-2 py-0.5 uppercase tracking-wider">
                  Active Filters
                </span>
                <button
                  onClick={handleResetFilters}
                  className="text-[10px] font-label-caps text-deep-navy underline cursor-pointer hover:text-slate-grey"
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
                Sort: {sortBy === "Curated" ? "Curated" : sortBy === "PriceLowHigh" ? "Price: Low to High" : "Price: High to Low"}
              </span>
              <span className={`material-symbols-outlined text-[16px] transition-transform duration-300 ${sortOpen ? "rotate-180" : ""}`}>
                expand_more
              </span>
            </button>

            {/* Sort Dropdown */}
            {sortOpen && (
              <div className="absolute right-0 top-full mt-2 w-56 bg-pure-white border border-slate-grey/20 shadow-xl py-2 flex flex-col z-30">
                {["Curated", "PriceLowHigh", "PriceHighLow"].map((sort) => (
                  <button
                    key={sort}
                    onClick={() => {
                      handleSortChange(sort);
                      setSortOpen(false);
                    }}
                    className={`px-4 py-2 text-left font-label-caps text-xs tracking-wider uppercase hover:bg-soft-linen cursor-pointer ${
                      sortBy === sort ? "text-deep-navy font-semibold" : "text-slate-grey"
                    }`}
                  >
                    {sort === "Curated" ? "Curated" : sort === "PriceLowHigh" ? "Price: Low to High" : "Price: High to Low"}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Mobile Filters Dropdown panel */}
        {filtersOpen && (
          <div className="md:hidden bg-soft-linen/30 border border-slate-grey/10 p-6 mb-stack-lg space-y-6 z-10 relative">
            <div>
              <h4 className="font-label-caps text-[10px] text-ink-black tracking-widest uppercase mb-3">Collections</h4>
              <div className="flex flex-wrap gap-2">
                <button onClick={() => handleCollectionChange("All")} className={`px-3 py-1.5 text-[10px] font-label-caps tracking-wider uppercase border cursor-pointer ${selectedCollection === "All" ? "border-deep-navy bg-deep-navy text-pure-white" : "border-slate-grey/20 bg-pure-white text-slate-grey"}`}>All</button>
                <button onClick={() => handleCollectionChange("none")} className={`px-3 py-1.5 text-[10px] font-label-caps tracking-wider uppercase border cursor-pointer ${selectedCollection === "none" ? "border-deep-navy bg-deep-navy text-pure-white" : "border-slate-grey/20 bg-pure-white text-slate-grey"}`}>Uncategorized</button>
                {collections.map(col => (
                  <button key={col.id} onClick={() => handleCollectionChange(col.id)} className={`px-3 py-1.5 text-[10px] font-label-caps tracking-wider uppercase border cursor-pointer ${selectedCollection === col.id ? "border-deep-navy bg-deep-navy text-pure-white" : "border-slate-grey/20 bg-pure-white text-slate-grey"}`}>{col.title}</button>
                ))}
              </div>
            </div>
            <div>
              <h4 className="font-label-caps text-[10px] text-ink-black tracking-widest uppercase mb-3">Material</h4>
              <div className="flex flex-wrap gap-2">
                {MATERIAL_OPTIONS.map((mat) => (
                  <button key={mat} onClick={() => handleMaterialChange(mat)} className={`px-3 py-1.5 text-[10px] font-label-caps tracking-wider uppercase border cursor-pointer ${selectedMaterial === mat ? "border-deep-navy bg-deep-navy text-pure-white" : "border-slate-grey/20 bg-pure-white text-slate-grey"}`}>{mat}</button>
                ))}
              </div>
            </div>
            <div>
              <h4 className="font-label-caps text-[10px] text-ink-black tracking-widest uppercase mb-3">Product Type</h4>
              <div className="flex flex-wrap gap-2">
                {TYPE_OPTIONS.map((type) => (
                  <button key={type} onClick={() => handleTypeChange(type)} className={`px-3 py-1.5 text-[10px] font-label-caps tracking-wider uppercase border cursor-pointer ${selectedType === type ? "border-deep-navy bg-deep-navy text-pure-white" : "border-slate-grey/20 bg-pure-white text-slate-grey"}`}>{type}</button>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="flex flex-col md:flex-row gap-8 items-start">
          {/* Desktop Sticky Faceted Sidebar */}
          <aside className="hidden md:block w-64 shrink-0 sticky top-24 space-y-8 bg-soft-linen/10 p-6 border border-slate-grey/15">
            <div>
              <h4 className="font-label-caps text-xs text-deep-navy font-bold tracking-widest uppercase border-b border-slate-grey/10 pb-2 mb-4">
                Collections
              </h4>
              <div className="flex flex-col gap-2">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-body-md text-slate-grey hover:text-ink-black">
                  <input type="radio" name="collection" checked={selectedCollection === "All"} onChange={() => handleCollectionChange("All")} className="w-3.5 h-3.5 text-deep-navy border-slate-grey/30 focus:ring-deep-navy" />
                  <span className={selectedCollection === "All" ? "text-deep-navy font-semibold" : ""}>All Collections</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-xs font-body-md text-slate-grey hover:text-ink-black">
                  <input type="radio" name="collection" checked={selectedCollection === "none"} onChange={() => handleCollectionChange("none")} className="w-3.5 h-3.5 text-deep-navy border-slate-grey/30 focus:ring-deep-navy" />
                  <span className={selectedCollection === "none" ? "text-deep-navy font-semibold" : ""}>Uncategorized (No Collection)</span>
                </label>
                {collections.map((col) => (
                  <label key={col.id} className="flex items-center gap-2 cursor-pointer text-xs font-body-md text-slate-grey hover:text-ink-black">
                    <input
                      type="radio"
                      name="collection"
                      checked={selectedCollection === col.id}
                      onChange={() => handleCollectionChange(col.id)}
                      className="w-3.5 h-3.5 text-deep-navy border-slate-grey/30 focus:ring-deep-navy"
                    />
                    <span className={selectedCollection === col.id ? "text-deep-navy font-semibold" : ""}>{col.title}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <h4 className="font-label-caps text-xs text-deep-navy font-bold tracking-widest uppercase border-b border-slate-grey/10 pb-2 mb-4">
                Materials
              </h4>
              <div className="flex flex-col gap-2">
                {MATERIAL_OPTIONS.map((mat) => (
                  <label key={mat} className="flex items-center gap-2 cursor-pointer text-xs font-body-md text-slate-grey hover:text-ink-black">
                    <input
                      type="radio"
                      name="material"
                      checked={selectedMaterial === mat}
                      onChange={() => handleMaterialChange(mat)}
                      className="w-3.5 h-3.5 text-deep-navy border-slate-grey/30 focus:ring-deep-navy"
                    />
                    <span className={selectedMaterial === mat ? "text-deep-navy font-semibold" : ""}>{mat}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <h4 className="font-label-caps text-xs text-deep-navy font-bold tracking-widest uppercase border-b border-slate-grey/10 pb-2 mb-4">
                Product Type
              </h4>
              <div className="flex flex-col gap-2">
                {TYPE_OPTIONS.map((type) => (
                  <label key={type} className="flex items-center gap-2 cursor-pointer text-xs font-body-md text-slate-grey hover:text-ink-black">
                    <input
                      type="radio"
                      name="type"
                      checked={selectedType === type}
                      onChange={() => handleTypeChange(type)}
                      className="w-3.5 h-3.5 text-deep-navy border-slate-grey/30 focus:ring-deep-navy"
                    />
                    <span className={selectedType === type ? "text-deep-navy font-semibold" : ""}>{type}</span>
                  </label>
                ))}
              </div>
            </div>

            {(selectedCollection !== "All" || selectedMaterial !== "All" || selectedType !== "All") && (
              <button
                onClick={handleResetFilters}
                className="w-full py-2 bg-deep-navy text-pure-white text-[10px] font-label-caps uppercase hover:bg-ink-black transition-colors cursor-pointer"
              >
                Reset Filters
              </button>
            )}
          </aside>

          {/* Product Grid container */}
          <div className="flex-grow w-full">
            {loading ? (
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 md:gap-gutter">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="flex flex-col">
                    <div className="relative w-full aspect-[3/4] md:aspect-[4/5] bg-soft-linen overflow-hidden mb-2">
                      <Skeleton height="100%" containerClassName="absolute inset-0 block h-full w-full" />
                    </div>
                    <div className="mt-1 md:mt-stack-sm flex flex-col md:flex-row md:justify-between md:items-start pt-1 md:pt-2 gap-1">
                      <div className="flex flex-col space-y-0.5 md:space-y-1">
                        <Skeleton height={14} width="80%" />
                        <Skeleton height={10} width="50%" />
                      </div>
                      <div className="w-12 md:w-16">
                        <Skeleton height={14} width="100%" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : processedProducts.length === 0 ? (
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
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 md:gap-gutter">
                {processedProducts.map((p) => {
                  const isWishlisted = wishlist.includes(p.id);
                  return (
                    <Link
                      key={p.id}
                      href={`/product/${p.id}`}
                      className="group flex flex-col cursor-pointer"
                    >
                      {/* Image Container */}
                      <div className="relative w-full aspect-[3/4] md:aspect-[4/5] bg-soft-linen overflow-hidden">
                        <Image
                          alt={p.title}
                          fill
                          className="object-cover object-center mix-blend-multiply opacity-90 group-hover:scale-105 transition-transform duration-700 ease-out"
                          src={p.image}
                          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 50vw, 33vw"
                        />
                        {/* Wishlist Button */}
                        <button
                          onClick={(e) => toggleWishlist(p.id, p.title, e)}
                          aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
                          className="absolute top-2 right-2 md:top-4 md:right-4 text-slate-grey hover:text-deep-navy transition-colors z-10 cursor-pointer p-1"
                        >
                          <span
                            className="material-symbols-outlined text-lg md:text-xl"
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
                      <div className="mt-1.5 md:mt-stack-sm flex flex-col md:flex-row md:justify-between md:items-start pt-1 md:pt-2 gap-0.5">
                        <div className="flex flex-col space-y-0.5 md:space-y-1 min-w-0">
                          <h2 className="font-body-md text-[11px] md:text-body-md text-on-surface font-medium truncate">
                            {p.title}
                          </h2>
                          <span className="font-label-caps text-label-caps text-slate-grey uppercase tracking-widest text-[8px] md:text-[10px] truncate">
                            {p.material || p.type}
                          </span>
                        </div>
                        <span className="font-body-md text-[11px] md:text-body-md text-on-surface font-semibold shrink-0">
                          {formatPrice(p.price)}
                        </span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default function ProductsCatalogPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-pure-white flex items-center justify-center text-slate-grey font-label-caps text-xs tracking-widest">Loading Catalog...</div>}>
      <ProductsCatalogContent />
    </Suspense>
  );
}
