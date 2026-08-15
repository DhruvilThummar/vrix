"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useMemo, Suspense, useEffect } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { fetchCategories, fetchCollections, fetchProducts, getWishlistKey } from "@/utils/api";
import { matchesMaterialFilter } from "@/utils/materialFilter";
import { useAuth } from "@/context/AuthContext";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import { useCurrency } from "@/context/CurrencyContext";

// Canonical map: URL slug → matching product type values (case-insensitive contains)
const TYPE_MAP: Record<string, { label: string; typeKeyword: string }> = {
  rings:      { label: "Rings",      typeKeyword: "ring"     },
  necklaces:  { label: "Necklaces",  typeKeyword: "necklace" },
  earrings:   { label: "Earrings",   typeKeyword: "earring"  },
  bracelets:  { label: "Bracelets",  typeKeyword: "bracelet" },
  pendants:   { label: "Pendants",   typeKeyword: "pendant"  },
  anklets:    { label: "Anklets",    typeKeyword: "anklet"   },
  brooches:   { label: "Brooches",  typeKeyword: "brooch"   },
  cuffs:      { label: "Cuffs",     typeKeyword: "cuff"     },
};

function TypePageContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, isLoggedIn } = useAuth();
  const { formatPrice } = useCurrency();

  const slug = (params.type as string)?.toLowerCase() || "";
  const typeInfo = TYPE_MAP[slug];

  const getParam = (key: string, fallback: string) => searchParams.get(key) || fallback;

  const [products, setProducts]     = useState<any[]>([]);
  const [collections, setCollections] = useState<any[]>([]);
  const [categories, setCategories]  = useState<any[]>([]);
  const [selectedMaterial, setSelectedMaterial] = useState(() => getParam("material", "All"));
  const [sortBy, setSortBy]          = useState(() => getParam("sort", "Curated"));
  const [wishlist, setWishlist]      = useState<string[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [loading, setLoading]        = useState(true);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [sortOpen, setSortOpen]      = useState(false);

  useEffect(() => {
    setSelectedMaterial(getParam("material", "All"));
    setSortBy(getParam("sort", "Curated"));
  }, [searchParams]);

  const updateQueryParam = (key: string, value: string) => {
    const nextParams = new URLSearchParams(searchParams.toString());
    if (value === "All" || !value) nextParams.delete(key);
    else nextParams.set(key, value);
    router.push(`?${nextParams.toString()}`, { scroll: false });
  };

  const handleMaterialChange = (mat: string) => {
    setSelectedMaterial(mat);
    updateQueryParam("material", mat);
  };

  const handleSortChange = (sort: string) => {
    setSortBy(sort);
    updateQueryParam("sort", sort);
  };

  useEffect(() => {
    try {
      const key = getWishlistKey(user?.email);
      const saved = localStorage.getItem(key) || localStorage.getItem("vrix-wishlist");
      if (saved) setWishlist(JSON.parse(saved));
    } catch {}
  }, [user?.email]);

  useEffect(() => {
    setLoading(true);
    Promise.allSettled([
      fetchProducts().then((res) => { if (Array.isArray(res)) setProducts(res); }),
      fetchCollections().then((res) => { if (Array.isArray(res)) setCollections(res); }),
      fetchCategories().then((res) => { if (Array.isArray(res)) setCategories(res); }),
    ]).finally(() => setLoading(false));
  }, []);

  const processedProducts = useMemo(() => {
    const keyword = typeInfo?.typeKeyword || slug;
    let result = products.filter((p) => {
      if (p.isVisible === false) return false;
      if ((p.stock ?? 999) <= 0) return false;
      const byCollection = (p.collection || "").toLowerCase() === slug;
      
      const pType = (p.type || "").toLowerCase().trim();
      let byType = false;

      if (keyword === "ring") {
        // Special case for 'ring' to exclude 'earring'
        byType = pType === "ring" || pType === "rings" || (/\bring(s)?\b/i.test(pType) && !pType.includes("earring"));
      } else {
        byType = pType.includes(keyword);
      }

      return byCollection || byType;
    });

    if (selectedMaterial !== "All") {
      result = result.filter((p) => matchesMaterialFilter(p, selectedMaterial));
    }

    const exploded = result.flatMap((p) => {
      if (Array.isArray(p.variants) && p.variants.length > 0) {
        let availableVariants = p.variants.filter((v: any) => v.isAvailable !== false);

        if (selectedMaterial !== "All") {
          availableVariants = availableVariants.filter((v: any) =>
            matchesMaterialFilter({ ...p, material: v.material || p.material, title: v.label || p.title, variants: [] }, selectedMaterial)
          );
        }

        if (availableVariants.length > 0) {
          return availableVariants.map((v: any) => ({
            ...p,
            _variantCardId: `${p.id}-${v.id}`,
            image: v.image || p.image,
            images: v.images || p.images,
            price: v.price ?? p.price,
            originalPrice: v.originalPrice ?? p.originalPrice,
            material: v.material || p.material,
            stock: v.stock ?? p.stock,
            variants: [],
          }));
        }
      }

      if (selectedMaterial === "All" || matchesMaterialFilter(p, selectedMaterial)) {
        return [{ ...p, _variantCardId: p.id }];
      }
      return [];
    });

    if (sortBy === "PriceLowHigh")  exploded.sort((a, b) => a.price - b.price);
    if (sortBy === "PriceHighLow") exploded.sort((a, b) => b.price - a.price);

    return exploded;
  }, [products, slug, typeInfo, selectedMaterial, sortBy]);


  const toggleWishlist = (id: string, title: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isLoggedIn) {
      showToast("Please sign in to save items.");
      setTimeout(() => router.push("/account"), 1000);
      return;
    }
    try {
      const key = getWishlistKey(user?.email);
      const saved = localStorage.getItem(key) || localStorage.getItem("vrix-wishlist");
      let list = saved ? JSON.parse(saved) : [];
      if (list.includes(id)) {
        list = list.filter((i: string) => i !== id);
        showToast(`Removed "${title}" from Wishlist.`);
      } else {
        list.push(id);
        showToast(`Added "${title}" to Wishlist.`);
      }
      setWishlist(list);
      localStorage.setItem(key, JSON.stringify(list));
      localStorage.setItem("vrix-wishlist", JSON.stringify(list));
    } catch {}
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleResetFilters = () => {
    setSelectedMaterial("All");
    updateQueryParam("material", "All");
    showToast("Filters reset.");
  };

  // Resolve display info from categories/collections CMS, fall back to TYPE_MAP
  const pageInfo = useMemo(() => {
    const fromCategory   = categories.find((c) => c.id === slug);
    const fromCollection = collections.find((c) => c.id === slug);
    const base = fromCategory || fromCollection;
    return {
      title:       base?.title       || typeInfo?.label || slug.charAt(0).toUpperCase() + slug.slice(1),
      tagline:     base?.tagline     || `Our complete ${typeInfo?.label?.toLowerCase() || slug} edit`,
      image:       base?.image       || "",
      description: base?.description || base?.tagline || `Browse our full collection of ${typeInfo?.label?.toLowerCase() || slug}, including curated and collection pieces.`,
    };
  }, [categories, collections, slug, typeInfo]);

  if (!typeInfo && !loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-slate-grey font-label-caps text-xs tracking-widest">
        Page not found.
      </div>
    );
  }

  return (
    <div className="w-full bg-pure-white relative min-h-screen">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed bottom-8 right-8 z-50 bg-deep-navy text-pure-white px-6 py-4 border border-slate-grey/30 shadow-2xl flex items-center gap-3 animate-fade-in duration-300">
          <span className="material-symbols-outlined text-sm">info</span>
          <p className="font-body-md text-sm tracking-wide">{toastMessage}</p>
          <button onClick={() => setToastMessage(null)} className="ml-4 hover:text-slate-grey cursor-pointer text-xs">✕</button>
        </div>
      )}

      <main className="flex-grow w-full max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop pb-section-gap">
        {/* Page Header */}
        <header className="py-12 flex flex-col items-center text-center max-w-3xl mx-auto space-y-3">
          {pageInfo.image && (
            <div className="relative w-full aspect-[21/7] overflow-hidden rounded bg-soft-linen mb-4">
              <Image src={pageInfo.image} alt={pageInfo.title} fill className="object-cover opacity-80" sizes="100vw" priority />
              <div className="absolute inset-0 bg-gradient-to-t from-pure-white/60 to-transparent" />
            </div>
          )}
          <span className="font-label-caps text-[10px] text-slate-grey uppercase tracking-widest">
            {pageInfo.tagline}
          </span>
          <h1 className="font-display-lg-mobile text-display-lg-mobile md:font-display-lg md:text-display-lg text-deep-navy uppercase tracking-tight">
            {pageInfo.title}
          </h1>
          <p className="font-body-lg text-body-lg text-secondary max-w-xl">
            {pageInfo.description}
          </p>
        </header>

        {/* Filter & Sort Bar */}
        <div className="border-t border-b border-slate-grey/30 py-3 sm:py-4 mb-8 flex flex-wrap justify-between items-center gap-3 relative z-20">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <button
              onClick={() => { setFiltersOpen(!filtersOpen); setSortOpen(false); }}
              className="md:hidden shrink-0 font-label-caps text-[10px] text-on-surface hover:text-deep-navy uppercase tracking-wider flex items-center gap-1 transition-colors cursor-pointer"
            >
              <span>Filters</span>
              <span className={`material-symbols-outlined text-[16px] transition-transform duration-300 ${filtersOpen ? "rotate-180" : ""}`}>expand_more</span>
            </button>
            <span className="hidden md:inline font-label-caps text-xs text-slate-grey uppercase tracking-widest">
              {processedProducts.length} Items
            </span>
            {selectedMaterial !== "All" && (
              <div className="hidden sm:flex items-center gap-2">
                <span className="text-[10px] font-body-md text-slate-grey bg-soft-linen px-2 py-0.5 uppercase tracking-wider">Active Filters</span>
                <button onClick={handleResetFilters} className="text-[10px] font-label-caps text-deep-navy underline cursor-pointer">Clear All</button>
              </div>
            )}
          </div>

          <div className="relative shrink-0">
            <button
              onClick={() => { setSortOpen(!sortOpen); setFiltersOpen(false); }}
              className="font-label-caps text-[10px] sm:text-label-caps text-on-surface hover:text-deep-navy uppercase tracking-wider flex items-center gap-1 cursor-pointer"
            >
              <span className="hidden sm:inline">Sort: {sortBy === "Curated" ? "Curated" : sortBy === "PriceLowHigh" ? "Price: Low to High" : "Price: High to Low"}</span>
              <span className="sm:hidden">Sort</span>
              <span className={`material-symbols-outlined text-[16px] transition-transform duration-300 ${sortOpen ? "rotate-180" : ""}`}>expand_more</span>
            </button>
            {sortOpen && (
              <div className="absolute right-0 top-full mt-2 w-56 bg-pure-white border border-slate-grey/20 shadow-xl py-2 flex flex-col z-30">
                {["Curated", "PriceLowHigh", "PriceHighLow"].map((sort) => (
                  <button
                    key={sort}
                    onClick={() => { handleSortChange(sort); setSortOpen(false); }}
                    className={`px-4 py-2 text-left font-label-caps text-xs tracking-wider uppercase hover:bg-soft-linen cursor-pointer ${sortBy === sort ? "text-deep-navy font-semibold" : "text-slate-grey"}`}
                  >
                    {sort === "Curated" ? "Curated" : sort === "PriceLowHigh" ? "Price: Low to High" : "Price: High to Low"}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Mobile Filters */}
        {filtersOpen && (
          <div className="md:hidden bg-soft-linen/30 border border-slate-grey/10 p-4 mb-8">
            <h4 className="font-label-caps text-[10px] text-ink-black tracking-widest uppercase mb-4">Material</h4>
            <div className="flex flex-wrap gap-2">
              {["All", "Gold", "Silver", "Platinum", "Diamond"].map((mat) => (
                <button
                  key={mat}
                  onClick={() => handleMaterialChange(mat)}
                  className={`px-3 py-1.5 text-[10px] font-label-caps tracking-wider uppercase border transition-colors cursor-pointer ${selectedMaterial === mat ? "border-deep-navy bg-deep-navy text-pure-white" : "border-slate-grey/20 bg-pure-white text-slate-grey"}`}
                >
                  {mat}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="flex flex-col md:flex-row gap-8 items-start">
          {/* Desktop Sidebar */}
          <aside className="hidden md:block w-56 shrink-0 sticky top-24 space-y-8 bg-soft-linen/10 p-6 border border-slate-grey/15">
            <div>
              <h4 className="font-label-caps text-xs text-deep-navy font-bold tracking-widest uppercase border-b border-slate-grey/10 pb-2 mb-4">Browse Types</h4>
              <ul className="space-y-2">
                {Object.entries(TYPE_MAP).map(([key, val]) => (
                  <li key={key}>
                    <Link
                      href={`/${key}`}
                      className={`font-body-md text-xs transition-colors block py-1 ${slug === key ? "text-deep-navy font-semibold" : "text-slate-grey hover:text-ink-black"}`}
                    >
                      {val.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="font-label-caps text-xs text-deep-navy font-bold tracking-widest uppercase border-b border-slate-grey/10 pb-2 mb-4">Material</h4>
              <div className="flex flex-col gap-2">
                {["All", "Gold", "Silver", "Platinum", "Diamond"].map((mat) => (
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


            {selectedMaterial !== "All" && (
              <button onClick={handleResetFilters} className="w-full py-2 bg-deep-navy text-pure-white text-[10px] font-label-caps uppercase hover:bg-ink-black transition-colors">
                Reset Filters
              </button>
            )}
          </aside>

          {/* Product Grid */}
          <div className="flex-grow w-full">
            {loading ? (
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 md:gap-gutter">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="flex flex-col">
                    <div className="relative w-full aspect-[3/4] md:aspect-[4/5] bg-soft-linen overflow-hidden mb-2">
                      <Skeleton height="100%" containerClassName="absolute inset-0 block h-full w-full" />
                    </div>
                    <Skeleton height={14} width="80%" />
                    <Skeleton height={10} width="50%" />
                  </div>
                ))}
              </div>
            ) : processedProducts.length === 0 ? (
              <div className="text-center py-24 flex flex-col items-center justify-center space-y-4">
                <span className="material-symbols-outlined text-slate-grey text-4xl">inventory_2</span>
                <p className="font-headline-md text-slate-grey">No products found.</p>
                {selectedMaterial !== "All" && (
                  <button onClick={handleResetFilters} className="px-6 py-2 border border-deep-navy text-deep-navy font-button text-xs uppercase hover:bg-deep-navy hover:text-pure-white transition-colors cursor-pointer">
                    Reset Filters
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 md:gap-gutter">
                {processedProducts.map((p) => {
                  const isWishlisted = wishlist.includes(p.id);
                  return (
                    <Link key={p._variantCardId || p.id} href={`/product/${p.id}`} className="flex flex-col group cursor-pointer">
                      <div className="relative w-full aspect-[3/4] md:aspect-[4/5] bg-soft-linen overflow-hidden">
                        <Image
                          alt={p.title}
                          fill
                          className="object-cover object-center mix-blend-multiply opacity-90 group-hover:scale-105 transition-transform duration-700 ease-out"
                          src={p.image}
                          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 50vw, 33vw"
                        />
                        <button
                          onClick={(e) => toggleWishlist(p.id, p.title, e)}
                          aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
                          className="absolute top-2 right-2 md:top-4 md:right-4 text-slate-grey hover:text-deep-navy transition-colors z-10 cursor-pointer p-1"
                        >
                          <span className={`material-symbols-outlined text-lg md:text-xl ${isWishlisted ? "icon-favorite-filled text-error" : "icon-favorite-outline"}`}>
                            favorite
                          </span>
                        </button>
                        {/* Collection badge */}
                        {p.collection && p.collection !== slug && (
                          <span className="absolute bottom-2 left-2 bg-pure-white/90 text-ink-black font-label-caps text-[8px] uppercase tracking-widest px-2 py-0.5 border border-slate-grey/20">
                            {p.collection}
                          </span>
                        )}
                      </div>
                      <div className="mt-1.5 md:mt-stack-sm flex flex-col md:flex-row md:justify-between md:items-start pt-1 md:pt-2 gap-0.5">
                        <div className="flex flex-col space-y-0.5 md:space-y-1 min-w-0">
                          <h2 className="font-body-md text-[11px] md:text-body-md text-on-surface font-medium truncate">{p.title}</h2>
                          <span className="font-label-caps text-label-caps text-slate-grey uppercase tracking-widest text-[8px] md:text-[10px] truncate">
                            {p.subtitle || p.type}
                          </span>
                        </div>
                        <span className="font-body-md text-[11px] md:text-body-md text-on-surface font-semibold shrink-0">{formatPrice(p.price)}</span>
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

export default function TypePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-pure-white flex items-center justify-center text-slate-grey font-label-caps text-xs tracking-widest">Loading...</div>}>
      <TypePageContent />
    </Suspense>
  );
}
