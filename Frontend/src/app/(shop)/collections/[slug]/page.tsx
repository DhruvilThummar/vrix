"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useMemo, Suspense, useEffect } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { fetchCollections, fetchProducts, getWishlistKey } from "@/utils/api";
import { useAuth } from "@/context/AuthContext";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import { useCurrency } from "@/context/CurrencyContext";

const DEFAULT_PRODUCTS: any[] = [];

function CollectionContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, isLoggedIn } = useAuth();
  const { formatPrice } = useCurrency();

  // Use slug from URL if available, otherwise fall back to 'collection' search param, or default to 'silent-center'
  const collectionSlug = (params.slug as string) || searchParams.get("collection") || "silent-center";
  const collectionQuery = collectionSlug;

  // Sync with searchParams
  const getParam = (key: string, fallback: string) => searchParams.get(key) || fallback;

  const [products, setProducts] = useState(DEFAULT_PRODUCTS);
  const [collections, setCollections] = useState<any[]>([]);
  const [selectedMaterial, setSelectedMaterial] = useState(() => getParam("material", "All"));
  const [selectedType, setSelectedType] = useState(() => getParam("type", "All"));
  const [sortBy, setSortBy] = useState(() => getParam("sort", "Curated"));
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Sync state when URL params change
  useEffect(() => {
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

  // Sync wishlist from localStorage on mount or user change
  useEffect(() => {
    try {
      const key = getWishlistKey(user?.email);
      const saved = localStorage.getItem(key) || localStorage.getItem("vrix-wishlist");
      if (saved) {
        setWishlist(JSON.parse(saved));
      }
    } catch { }
  }, [user?.email]);

  // Filter & Sort menus open states
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);

  // Fetch products from Express backend
  useEffect(() => {
    setLoading(true);
    const pFetch = fetchProducts()
      .then((res) => {
        if (Array.isArray(res)) {
          setProducts(res);
        }
      })
      .catch((err) => console.error("Error fetching products from backend:", err));

    const cFetch = fetchCollections()
      .then((res) => {
        if (Array.isArray(res)) {
          setCollections(res);
        }
      })
      .catch((err) => console.error("Error fetching collections from backend:", err));

    Promise.allSettled([pFetch, cFetch]).finally(() => {
      setLoading(false);
    });
  }, []);

  const collectionInfo = useMemo(() => {
    const selectedCollection = collections.find((collection) => collection.id === (collectionQuery || "silent-center"));
    if (selectedCollection) {
      return {
        title: selectedCollection.title,
        description: selectedCollection.description || selectedCollection.tagline || "",
        tagline: selectedCollection.tagline || "",
        image: selectedCollection.image || "",
        bannerImage: selectedCollection.bannerImage || "",
        customHeadline: selectedCollection.customHeadline || "",
        customParagraph: selectedCollection.customParagraph || "",
        showProductCarousel: !!selectedCollection.showProductCarousel,
        carouselAutoplay: !!selectedCollection.carouselAutoplay,
        carouselSpeed: selectedCollection.carouselSpeed || 3000,
        layoutStyle: selectedCollection.layoutStyle || "classic",
        sections: selectedCollection.sections || [],
      };
    }

    switch (collectionQuery) {
      case "solitude":
        return {
          title: "The Solitude Collection",
          description: "Meticulous, ultra-minimalist designs that focus on purity and quiet comfort. Linear bands and empty spaces crafted for peaceful daily wear.",
          tagline: "Ultra-Minimalist",
          layoutStyle: "classic" as const,
        };
      case "presence":
        return {
          title: "The Presence Collection",
          description: "Bold geometric shapes and architectural volume that make a quiet statement of confidence, stability, and character.",
          tagline: "Bold & Geometric",
          layoutStyle: "classic" as const,
        };
      case "light":
        return {
          title: "The Light Collection",
          description: "Highly polished, reflecting surfaces designed to catch and project light. A celebration of transformation, hope, and inner growth.",
          tagline: "Polished & Reflective",
          layoutStyle: "classic" as const,
        };
      default:
        return {
          title: "The Silent Center Collection",
          description: "A meditation on form and negative space. Pieces designed to ground you in the present moment, crafted with uncompromising architectural precision and conscious materials.",
          tagline: "Negative Space",
          layoutStyle: "classic" as const,
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
    setSelectedMaterial("All");
    setSelectedType("All");
    updateQueryParam("material", "All");
    updateQueryParam("type", "All");
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
      result = result.filter((p) => p.type.toLowerCase() === selectedType.toLowerCase());
    }

    // Sort by selection
    if (sortBy === "PriceLowHigh") {
      result.sort((a, b) => a.price - b.price);
    } else if (sortBy === "PriceHighLow") {
      result.sort((a, b) => b.price - a.price);
    }

    return result;
  }, [products, collectionQuery, selectedMaterial, selectedType, sortBy]);

  const [carouselIndex, setCarouselIndex] = useState(0);

  useEffect(() => {
    if (!collectionInfo.showProductCarousel || !collectionInfo.carouselAutoplay) return;
    if (processedProducts.length <= 1) return;
    const interval = setInterval(() => {
      setCarouselIndex((prev) => (prev + 1) % processedProducts.length);
    }, collectionInfo.carouselSpeed || 3000);
    return () => clearInterval(interval);
  }, [collectionInfo, processedProducts.length]);

  useEffect(() => {
    setCarouselIndex(0);
  }, [processedProducts]);

  const handlePrevSlide = () => {
    setCarouselIndex((prev) => (prev - 1 + processedProducts.length) % processedProducts.length);
  };
  const handleNextSlide = () => {
    setCarouselIndex((prev) => (prev + 1) % processedProducts.length);
  };

  const visibleProducts = useMemo(() => {
    if (!collectionInfo.showProductCarousel) return processedProducts;
    const subset = [];
    const len = processedProducts.length;
    if (len === 0) return [];
    for (let i = 0; i < Math.min(3, len); i++) {
      const idx = (carouselIndex + i) % len;
      subset.push(processedProducts[idx]);
    }
    return subset;
  }, [processedProducts, collectionInfo.showProductCarousel, carouselIndex]);



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
        {collectionInfo.sections && collectionInfo.sections.length > 0 ? (
          <div className="space-y-12 py-8">
            {collectionInfo.sections.map((sec: any) => {
              if (sec.type === "hero") {
                const alignClass = sec.align === "left" ? "text-left items-start justify-start" : sec.align === "right" ? "text-right items-end justify-end" : "text-center items-center justify-center";
                return (
                  <section key={sec.id} className="relative w-full aspect-[21/9] min-h-[350px] bg-ink-black overflow-hidden flex items-center justify-center p-8 rounded border border-slate-grey/15 shadow-sm">
                    {sec.backgroundImage && (
                      <Image
                        src={sec.backgroundImage}
                        alt={sec.title || "Hero"}
                        fill
                        className="object-cover opacity-60 mix-blend-multiply"
                        sizes="100vw"
                      />
                    )}
                    <div className={`relative z-10 max-w-3xl space-y-4 text-pure-white p-6 w-full flex flex-col ${alignClass}`}>
                      {sec.tagline && <span className="font-label-caps text-xs uppercase tracking-widest block text-amber-400 font-bold">{sec.tagline}</span>}
                      {sec.title && <h2 className="font-display-lg text-2xl md:text-5xl uppercase tracking-wider drop-shadow-md leading-tight">{sec.title}</h2>}
                      {sec.description && <p className="font-body-md text-xs md:text-sm max-w-2xl opacity-90 leading-relaxed">{sec.description}</p>}
                    </div>
                  </section>
                );
              }

              if (sec.type === "text") {
                const bgClass = sec.backgroundColor === "linen" ? "bg-soft-linen/40 border border-slate-grey/15" : sec.backgroundColor === "navy" ? "bg-deep-navy text-pure-white" : "bg-transparent";
                return (
                  <section key={sec.id} className={`p-8 md:p-16 rounded ${bgClass} space-y-4 text-center max-w-4xl mx-auto`}>
                    {sec.title && <h2 className={`font-display-lg text-xl md:text-3xl uppercase tracking-tight ${sec.backgroundColor === "navy" ? "text-pure-white" : "text-deep-navy"}`}>{sec.title}</h2>}
                    {sec.description && <p className="font-body-lg text-xs md:text-sm leading-relaxed opacity-95 max-w-2xl mx-auto">{sec.description}</p>}
                  </section>
                );
              }

              if (sec.type === "image_grid") {
                const colsClass = sec.gridColumns === 1 ? "grid-cols-1" : sec.gridColumns === 3 ? "grid-cols-1 sm:grid-cols-3" : sec.gridColumns === 4 ? "grid-cols-2 lg:grid-cols-4" : "grid-cols-1 sm:grid-cols-2";
                return (
                  <section key={sec.id} className={`grid ${colsClass} gap-6`}>
                    {(sec.images || []).map((img: any, imgIdx: number) => (
                      <div key={imgIdx} className="relative aspect-[4/5] bg-soft-linen rounded border border-slate-grey/10 overflow-hidden group shadow-sm flex flex-col justify-end p-6 min-h-[300px]">
                        {img.url && (
                          <Image
                            src={img.url}
                            alt={img.caption || "Gallery Image"}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-700 ease-out z-0"
                            sizes="(max-width: 768px) 100vw, 50vw"
                          />
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent z-10" />
                        <div className="relative z-20 text-white space-y-2">
                          {img.caption && <h3 className="font-display-lg text-xs md:text-sm uppercase tracking-wider">{img.caption}</h3>}
                          {img.link && (
                            <Link href={img.link} className="inline-block text-[10px] font-label-caps uppercase tracking-wider border-b border-white hover:text-amber-400 hover:border-amber-400 transition-colors">
                              Discover More
                            </Link>
                          )}
                        </div>
                      </div>
                    ))}
                  </section>
                );
              }

              if (sec.type === "product_slider") {
                const sliderProducts = processedProducts.filter(p => {
                  if (!sec.skus || sec.skus.length === 0) return true;
                  return sec.skus.includes(p.id) || sec.skus.includes(p.sku);
                });
                if (sliderProducts.length === 0) return null;
                return (
                  <section key={sec.id} className="relative w-full py-8 px-8 border border-slate-grey/10 bg-soft-linen/5 rounded shadow-sm">
                    <div className="flex justify-between items-center mb-6">
                      <h3 className="font-label-caps text-xs text-deep-navy uppercase tracking-widest font-bold">Featured Products</h3>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                      {sliderProducts.slice(0, 3).map((p) => {
                        const isWishlisted = wishlist.includes(p.id);
                        return (
                          <Link key={p.id} href={`/product/${p.id}`} className="flex flex-col group cursor-pointer">
                            <div className="relative w-full aspect-[3/4] md:aspect-[4/5] bg-soft-linen overflow-hidden rounded border border-slate-grey/10">
                              <Image
                                alt={p.title}
                                fill
                                className="object-cover object-center mix-blend-multiply opacity-90 group-hover:scale-105 transition-transform duration-700 ease-out"
                                src={p.image}
                                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                              />
                            </div>
                            <div className="mt-1.5 md:mt-stack-sm flex flex-col md:flex-row md:justify-between md:items-start pt-1 md:pt-2 gap-0.5">
                              <div className="flex flex-col space-y-0.5 md:space-y-1 min-w-0">
                                <h2 className="font-body-md text-[11px] md:text-body-md text-on-surface font-medium truncate">{p.title}</h2>
                                <span className="font-label-caps text-label-caps text-slate-grey uppercase tracking-widest text-[8px] md:text-[10px] truncate">{p.material}</span>
                              </div>
                              <span className="font-body-md text-[11px] md:text-body-md text-on-surface font-semibold shrink-0">{formatPrice(p.price)}</span>
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                  </section>
                );
              }
              return null;
            })}
          </div>
        ) : (
          <>
            {/* Editorial Banner Header */}
            {collectionInfo.layoutStyle === "editorial" && (
              <header className="relative w-full aspect-[21/9] bg-ink-black overflow-hidden flex items-center justify-center text-center p-8 mb-12 rounded border border-slate-grey/15 shadow-sm">
                <Image
                  src={collectionInfo.bannerImage || collectionInfo.image || "/logos/black.png"}
                  alt={collectionInfo.title}
                  fill
                  className="object-cover opacity-60 mix-blend-multiply"
                  priority
                />
                <div className="relative z-10 max-w-3xl space-y-3 text-pure-white p-4">
                  <span className="font-label-caps text-xs uppercase tracking-widest block text-amber-400 font-bold">{collectionInfo.tagline || "Curated Edition"}</span>
                  <h1 className="font-display-lg text-2xl md:text-5xl uppercase tracking-wider drop-shadow-md">
                    {collectionInfo.customHeadline || collectionInfo.title}
                  </h1>
                  <p className="font-body-md text-xs md:text-sm max-w-2xl mx-auto opacity-90 leading-relaxed">
                    {collectionInfo.customParagraph || collectionInfo.description}
                  </p>
                </div>
              </header>
            )}

            {/* Split Hero Banner Header */}
            {collectionInfo.layoutStyle === "split" && (
              <header className="py-8 grid grid-cols-1 md:grid-cols-2 gap-8 items-center border-b border-slate-grey/15 mb-12">
                <div className="relative aspect-[16/9] w-full overflow-hidden bg-soft-linen rounded border border-slate-grey/10">
                  <Image
                    src={collectionInfo.bannerImage || collectionInfo.image || "/logos/black.png"}
                    alt={collectionInfo.title}
                    fill
                    className="object-cover"
                    priority
                  />
                </div>
                <div className="space-y-4 pr-4">
                  <span className="font-label-caps text-xs text-slate-grey uppercase tracking-widest block font-bold">{collectionInfo.tagline || "Exclusive Collection"}</span>
                  <h1 className="font-display-lg text-xl md:text-3xl text-deep-navy uppercase leading-tight">
                    {collectionInfo.customHeadline || collectionInfo.title}
                  </h1>
                  <p className="font-body-md text-xs md:text-sm text-secondary leading-relaxed">
                    {collectionInfo.customParagraph || collectionInfo.description}
                  </p>
                </div>
              </header>
            )}

            {/* Classic Minimal Header */}
            {(collectionInfo.layoutStyle === "classic" || !collectionInfo.layoutStyle) && (
              <header className="py-12 flex flex-col items-center text-center max-w-3xl mx-auto space-y-stack-md">
                <h1 className="font-display-lg-mobile text-display-lg-mobile md:font-display-lg md:text-display-lg text-deep-navy uppercase tracking-tight">
                  {collectionInfo.customHeadline || collectionInfo.title}
                </h1>
                <p className="font-body-lg text-body-lg text-secondary">
                  {collectionInfo.customParagraph || collectionInfo.description}
                </p>
              </header>
            )}

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
                  Faceted Search / {processedProducts.length} Items
                </span>

                {/* Quick Status indicators */}
                {(selectedMaterial !== "All" || selectedType !== "All") && (
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
                        className={`px-4 py-2 text-left font-label-caps text-xs tracking-wider uppercase hover:bg-soft-linen cursor-pointer ${sortBy === sort ? "text-deep-navy font-semibold" : "text-slate-grey"
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
              <div className="md:hidden bg-soft-linen/30 border border-slate-grey/10 p-6 mb-stack-lg grid grid-cols-2 gap-6 z-10 relative">
                <div>
                  <h4 className="font-label-caps text-[10px] text-ink-black tracking-widest uppercase mb-4">Material</h4>
                  <div className="flex flex-wrap gap-2">
                    {["All", "Gold", "Silver"].map((mat) => (
                      <button
                        key={mat}
                        onClick={() => handleMaterialChange(mat)}
                        className={`px-3 py-1.5 text-[10px] font-label-caps tracking-wider uppercase border transition-colors cursor-pointer ${selectedMaterial === mat ? "border-deep-navy bg-deep-navy text-pure-white" : "border-slate-grey/20 bg-pure-white text-slate-grey"
                          }`}
                      >
                        {mat}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="font-label-caps text-[10px] text-ink-black tracking-widest uppercase mb-4">Product Type</h4>
                  <div className="flex flex-wrap gap-2">
                    {["All", "Ring", "Necklace", "Earring", "Bracelet"].map((type) => (
                      <button
                        key={type}
                        onClick={() => handleTypeChange(type)}
                        className={`px-3 py-1.5 text-[10px] font-label-caps tracking-wider uppercase border transition-colors cursor-pointer ${selectedType === type ? "border-deep-navy bg-deep-navy text-pure-white" : "border-slate-grey/20 bg-pure-white text-slate-grey"
                          }`}
                      >
                        {type}
                      </button>
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
                  <ul className="space-y-2">
                    {collections.map((col) => (
                      <li key={col.id}>
                        <Link
                          href={`/collections/${col.id}`}
                          className={`font-body-md text-xs transition-colors block py-1 ${collectionQuery === col.id ? "text-deep-navy font-semibold" : "text-slate-grey hover:text-ink-black"
                            }`}
                        >
                          {col.title}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h4 className="font-label-caps text-xs text-deep-navy font-bold tracking-widest uppercase border-b border-slate-grey/10 pb-2 mb-4">
                    Materials
                  </h4>
                  <div className="flex flex-col gap-2">
                    {["All", "Gold", "Silver"].map((mat) => (
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
                    {["All", "Ring", "Necklace", "Earring", "Bracelet"].map((type) => (
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

                {(selectedMaterial !== "All" || selectedType !== "All") && (
                  <button
                    onClick={handleResetFilters}
                    className="w-full py-2 bg-deep-navy text-pure-white text-[10px] font-label-caps uppercase hover:bg-ink-black transition-colors"
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
                ) : collectionInfo.showProductCarousel ? (
                  /* Product Carousel */
                  <div className="relative w-full py-4 px-8 border border-slate-grey/10 bg-soft-linen/5 rounded shadow-sm">
                    {processedProducts.length > 3 && (
                      <>
                        <button onClick={handlePrevSlide} className="absolute left-1 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full border border-slate-grey/30 bg-pure-white flex items-center justify-center text-deep-navy hover:bg-deep-navy hover:text-white transition-colors cursor-pointer z-10 shadow-sm">
                          <span className="material-symbols-outlined text-[18px]">chevron_left</span>
                        </button>
                        <button onClick={handleNextSlide} className="absolute right-1 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full border border-slate-grey/30 bg-pure-white flex items-center justify-center text-deep-navy hover:bg-deep-navy hover:text-white transition-colors cursor-pointer z-10 shadow-sm">
                          <span className="material-symbols-outlined text-[18px]">chevron_right</span>
                        </button>
                      </>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 transition-all duration-500">
                      {visibleProducts.map((p) => {
                        const isWishlisted = wishlist.includes(p.id);
                        return (
                          <Link
                            key={p.id}
                            href={`/product/${p.id}`}
                            className="flex flex-col group cursor-pointer animate-fade-in"
                          >
                            <div className="relative w-full aspect-[3/4] md:aspect-[4/5] bg-soft-linen overflow-hidden rounded border border-slate-grey/10">
                              <Image
                                alt={p.title}
                                fill
                                className="object-cover object-center mix-blend-multiply opacity-90 group-hover:scale-105 transition-transform duration-700 ease-out"
                                src={p.image}
                                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                              />
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
                            <div className="mt-1.5 md:mt-stack-sm flex flex-col md:flex-row md:justify-between md:items-start pt-1 md:pt-2 gap-0.5">
                              <div className="flex flex-col space-y-0.5 md:space-y-1 min-w-0">
                                <h2 className="font-body-md text-[11px] md:text-body-md text-on-surface font-medium truncate">
                                  {p.title}
                                </h2>
                                <span className="font-label-caps text-label-caps text-slate-grey uppercase tracking-widest text-[8px] md:text-[10px] truncate">
                                  {p.material}
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

                    {/* Dots */}
                    {processedProducts.length > 3 && (
                      <div className="flex justify-center gap-1.5 mt-6">
                        {processedProducts.map((_, i) => (
                          <button
                            key={i}
                            onClick={() => setCarouselIndex(i)}
                            className={`w-1.5 h-1.5 rounded-full transition-colors ${carouselIndex === i ? "bg-deep-navy" : "bg-slate-grey/30"
                              }`}
                          />
                        ))}
                      </div>
                    )}
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
                          className="flex flex-col group cursor-pointer"
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
                                {p.material}
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
          </>
        )}  </main>
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
