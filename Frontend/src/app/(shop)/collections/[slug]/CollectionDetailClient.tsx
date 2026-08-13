"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useMemo, useEffect, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { getWishlistKey } from "@/utils/api";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import { useCurrency } from "@/context/CurrencyContext";
import { useCart } from "@/context/CartContext";
import { useGSAP } from "@gsap/react";
import { gsap, ScrollTrigger } from "@/lib/gsap";
import { useAuth } from "@/context/AuthContext";
import ProductCard from "@/components/shop/ProductCard";

interface CollectionDetailClientProps {
  slug: string;
  initialProducts: any[];
  initialCollections: any[];
  initialCategories: any[];
  collectionInfo: any;
}

export default function CollectionDetailClient({
  slug,
  initialProducts,
  initialCollections,
  initialCategories,
  collectionInfo,
}: CollectionDetailClientProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, isLoggedIn } = useAuth();
  const { formatPrice } = useCurrency();
  const { addItem } = useCart();
  const gridContainerRef = useRef<HTMLDivElement>(null);

  const collectionSlug = slug || "silent-center";
  const collectionQuery = collectionSlug;

  const getParam = (key: string, fallback: string) => searchParams.get(key) || fallback;

  const [products] = useState(initialProducts);
  const [collections] = useState(initialCollections);
  const [selectedMaterial, setSelectedMaterial] = useState(() => getParam("material", "All"));
  const [selectedType, setSelectedType] = useState(() => getParam("type", "All"));
  const [sortBy, setSortBy] = useState(() => getParam("sort", "Curated"));
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

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

  useEffect(() => {
    try {
      const key = getWishlistKey(user?.email);
      const saved = localStorage.getItem(key) || localStorage.getItem("vrix-wishlist");
      if (saved) {
        setWishlist(JSON.parse(saved));
      }
    } catch { }
  }, [user?.email]);

  const [filtersOpen, setFiltersOpen] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);

  const processedBaseProducts = useMemo(() => {
    const activeCollection = collectionQuery || "silent-center";
    let result = products.filter((p) => (
      p.isVisible !== false &&
      (p.stock ?? 999) > 0 &&
      (p.collection || "") === activeCollection
    ));

    if (selectedMaterial !== "All") {
      result = result.filter((p) => {
        const mat = (p.material || "").toLowerCase();
        const variantMats = Array.isArray(p.variants)
          ? p.variants.map((v: any) => (v.material || "").toLowerCase()).join(" ")
          : "";
        const combined = `${mat} ${variantMats}`;

        if (selectedMaterial === "Gold")     return combined.includes("gold");
        if (selectedMaterial === "Silver")   return combined.includes("silver");
        if (selectedMaterial === "Platinum") return combined.includes("platinum");
        if (selectedMaterial === "Diamond")  return combined.includes("diamond");
        return true;
      });
    }

    if (selectedType !== "All") {
      result = result.filter((p) => p.type.toLowerCase() === selectedType.toLowerCase());
    }

    return result;
  }, [products, collectionQuery, selectedMaterial, selectedType]);

  const explodedProducts = useMemo(() => {
    const list = processedBaseProducts.flatMap((p) => {
      if (Array.isArray(p.variants) && p.variants.length > 0) {
        return p.variants
          .filter((v: any) => v.isAvailable !== false)
          .map((v: any) => ({
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
      return [{ ...p, _variantCardId: p.id }];
    });

    if (sortBy === "PriceLowHigh") {
      list.sort((a, b) => a.price - b.price);
    } else if (sortBy === "PriceHighLow") {
      list.sort((a, b) => b.price - a.price);
    }

    return list;
  }, [processedBaseProducts, sortBy]);

  const [carouselIndex, setCarouselIndex] = useState(0);

  useEffect(() => {
    if (!collectionInfo.showProductCarousel || !collectionInfo.carouselAutoplay) return;
    if (explodedProducts.length <= 1) return;
    const interval = setInterval(() => {
      setCarouselIndex((prev) => (prev + 1) % explodedProducts.length);
    }, collectionInfo.carouselSpeed || 3000);
    return () => clearInterval(interval);
  }, [collectionInfo, explodedProducts.length]);

  useEffect(() => {
    setCarouselIndex(0);
  }, [explodedProducts]);

  const handlePrevSlide = () => {
    if (explodedProducts.length === 0) return;
    setCarouselIndex((prev) => (prev - 1 + explodedProducts.length) % explodedProducts.length);
  };
  
  const handleNextSlide = () => {
    if (explodedProducts.length === 0) return;
    setCarouselIndex((prev) => (prev + 1) % explodedProducts.length);
  };

  const visibleProducts = useMemo(() => {
    if (explodedProducts.length === 0) return [];
    const size = Math.min(3, explodedProducts.length);
    const result = [];
    for (let i = 0; i < size; i++) {
      result.push(explodedProducts[(carouselIndex + i) % explodedProducts.length]);
    }
    return result;
  }, [explodedProducts, carouselIndex]);

  useGSAP(() => {
    if (explodedProducts.length === 0) return;

    const mm = gsap.matchMedia();
    mm.add("(prefers-reduced-motion: no-preference)", () => {
      ScrollTrigger.batch(".product-card-reveal", {
        start: "top 88%",
        onEnter: (batch) => {
          gsap.fromTo(
            batch,
            { opacity: 0, y: 24 },
            { opacity: 1, y: 0, duration: 0.5, stagger: 0.06, ease: "power2.out", overwrite: true }
          );
        },
      });
    });

    return () => {
      mm.revert();
    };
  }, { dependencies: [explodedProducts], scope: gridContainerRef });

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

  const handleQuickAdd = (p: any, variant: any) => {
    addItem({
      id: p.id,
      title: p.title,
      subtitle: p.subtitle || p.type,
      price: variant?.price ?? p.price,
      image: variant?.image ?? p.image,
      material: variant?.material ?? p.material ?? "18K Gold Vermeil",
      stock: Number(variant?.stock ?? p.stock ?? 999),
    });
    showToast(`Added "${p.title}" to Bag!`);
  };

  return (
    <div className="w-full bg-pure-white relative min-h-screen">
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

      {/* Visible Breadcrumbs for SEO */}
      <div className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop pt-4">
        <nav className="flex items-center gap-2 text-[10px] font-label-caps text-slate-grey uppercase tracking-wider">
          <Link href="/" className="hover:text-ink-black transition-colors">Home</Link>
          <span className="material-symbols-outlined text-[10px]">chevron_right</span>
          <Link href="/collections" className="hover:text-ink-black transition-colors">Collections</Link>
          <span className="material-symbols-outlined text-[10px]">chevron_right</span>
          <span className="text-ink-black font-semibold">{collectionInfo.title}</span>
        </nav>
      </div>

      <main ref={gridContainerRef} className="flex-grow w-full max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop pb-section-gap">
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
                const sliderProducts = explodedProducts.filter((p: any) => {
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
                      {sliderProducts.slice(0, 3).map((p: any) => {
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
                                <span className="font-label-caps text-label-caps text-slate-grey uppercase tracking-widest text-[8px] md:text-[10px] truncate">{p.subtitle || p.type}</span>
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

            <div className="border-t border-b border-slate-grey/30 py-3 sm:py-4 mb-stack-lg flex flex-wrap justify-between items-center gap-3 relative z-20">
              <div className="flex min-w-0 flex-1 items-center gap-3 sm:gap-4">
                <button
                  onClick={() => {
                    setFiltersOpen(!filtersOpen);
                    setSortOpen(false);
                  }}
                  className="md:hidden shrink-0 font-label-caps text-[10px] text-on-surface hover:text-deep-navy uppercase tracking-wider flex items-center gap-1 group transition-colors cursor-pointer"
                >
                  <span>Filters</span>
                  <span className={`material-symbols-outlined text-[16px] transition-transform duration-300 ${filtersOpen ? "rotate-180" : ""}`}>
                    expand_more
                  </span>
                </button>

                <span className="hidden md:inline font-label-caps text-xs text-slate-grey uppercase tracking-widest">
                  Faceted Search / {explodedProducts.length} Items
                </span>

                {(selectedMaterial !== "All" || selectedType !== "All") && (
                  <div className="hidden sm:flex items-center gap-2">
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

              <div className="relative shrink-0">
                <button
                  onClick={() => {
                    setSortOpen(!sortOpen);
                    setFiltersOpen(false);
                  }}
                  className="max-w-[11rem] sm:max-w-none font-label-caps text-[10px] sm:text-label-caps text-on-surface hover:text-deep-navy uppercase tracking-wider sm:tracking-widest flex items-center gap-1 group transition-colors cursor-pointer text-right"
                >
                  <span className="hidden sm:inline">
                    Sort: {sortBy === "Curated" ? "Curated" : sortBy === "PriceLowHigh" ? "Price: Low to High" : "Price: High to Low"}
                  </span>
                  <span className="sm:hidden">Sort</span>
                  <span className={`material-symbols-outlined text-[16px] transition-transform duration-300 ${sortOpen ? "rotate-180" : ""}`}>
                    expand_more
                  </span>
                </button>

                {sortOpen && (
                  <div className="absolute right-0 top-full mt-2 w-56 max-w-[calc(100vw-2rem)] bg-pure-white border border-slate-grey/20 shadow-xl py-2 flex flex-col z-30">
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

            {filtersOpen && (
              <div className="md:hidden bg-soft-linen/30 border border-slate-grey/10 p-4 sm:p-6 mb-stack-lg grid grid-cols-1 sm:grid-cols-2 gap-5 sm:gap-6 z-10 relative">
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

              <div className="flex-grow w-full">
                {explodedProducts.length === 0 ? (
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
                  <div className="relative w-full py-4 px-8 border border-slate-grey/10 bg-soft-linen/5 rounded shadow-sm">
                    {explodedProducts.length > 3 && (
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
                      {visibleProducts.map((p: any, idx: number) => {
                        const isWishlisted = wishlist.includes(p.id);
                        return (
                          <ProductCard
                            key={p._variantCardId}
                            product={p}
                            formatPrice={formatPrice}
                            onWishlistToggle={(id, title, e) => toggleWishlist(id, title, e)}
                            isWishlisted={isWishlisted}
                            onQuickAdd={(item, variant) => handleQuickAdd(item, variant)}
                            showQuickAdd={true}
                            priority={idx < 4}
                          />
                        );
                      })}
                    </div>

                    {explodedProducts.length > 3 && (
                      <div className="flex justify-center gap-1.5 mt-6">
                        {explodedProducts.map((_: any, i: number) => (
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
                  <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 md:gap-gutter">
                    {explodedProducts.map((p: any, idx: number) => {
                      const isWishlisted = wishlist.includes(p.id);
                      return (
                        <ProductCard
                          key={p._variantCardId}
                          product={p}
                          formatPrice={formatPrice}
                          onWishlistToggle={(id, title, e) => toggleWishlist(id, title, e)}
                          isWishlisted={isWishlisted}
                          onQuickAdd={(item, variant) => handleQuickAdd(item, variant)}
                          showQuickAdd={true}
                          priority={idx < 4}
                        />
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
