"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useMemo, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { getWishlistKey } from "@/utils/api";
import { useAuth } from "@/context/AuthContext";
import { useCurrency } from "@/context/CurrencyContext";
import ProductCard from "@/components/shop/ProductCard";
import { useCart } from "@/context/CartContext";

const MATERIAL_OPTIONS = ["All", "Gold", "Silver", "Platinum"];
const TYPE_OPTIONS = ["All", "Ring", "Necklace", "Earring", "Bracelet", "Pendant", "Cuff", "Brooch", "Anklet"];

interface ProductsCatalogClientProps {
  initialProducts: any[];
  initialCollections: any[];
}

export default function ProductsCatalogClient({
  initialProducts,
  initialCollections,
}: ProductsCatalogClientProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, isLoggedIn } = useAuth();
  const { formatPrice } = useCurrency();
  const { addItem } = useCart();

  const getParam = (key: string, fallback: string) => searchParams.get(key) || fallback;

  const [products] = useState(initialProducts);
  const [collections] = useState(initialCollections);
  
  const [selectedCollection, setSelectedCollection] = useState(() => getParam("collection", "All"));
  const [selectedMaterial, setSelectedMaterial] = useState(() => getParam("material", "All"));
  const [selectedType, setSelectedType] = useState(() => getParam("type", "All"));
  const [sortBy, setSortBy] = useState(() => getParam("sort", "Curated"));
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [filtersOpen, setFiltersOpen] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);

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

  useEffect(() => {
    try {
      const key = getWishlistKey(user?.email);
      const saved = localStorage.getItem(key) || localStorage.getItem("vrix-wishlist");
      if (saved) {
        setWishlist(JSON.parse(saved));
      }
    } catch {}
  }, [user?.email]);

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
    updateQueryParam("collection", "All");
    updateQueryParam("material", "All");
    updateQueryParam("type", "All");
    showToast("Filters reset successfully.");
  };

  const processedProducts = useMemo(() => {
    let result = products.filter((p) => p.isVisible !== false && (p.stock ?? 999) > 0);

    if (selectedCollection !== "All") {
      result = result.filter((p) => {
        const pColl = (p.collection || "").toLowerCase().replace(/[^a-z0-9]/g, "");
        const targetColl = selectedCollection.toLowerCase().replace(/[^a-z0-9]/g, "");
        return pColl === targetColl || pColl.includes(targetColl) || targetColl.includes(pColl);
      });
    }

    if (selectedMaterial !== "All") {
      result = result.filter((p) => {
        const mat = (p.material || "").toLowerCase();
        const title = (p.title || "").toLowerCase();
        const desc = (p.description || "").toLowerCase();
        const subtitle = (p.subtitle || "").toLowerCase();
        const tags = Array.isArray(p.tags) ? p.tags.join(" ").toLowerCase() : "";
        const variantMats = Array.isArray(p.variants)
          ? p.variants.map((v: any) => (v.material || "").toLowerCase()).join(" ")
          : "";
        const combined = `${mat} ${title} ${desc} ${subtitle} ${tags} ${variantMats}`;
        const target = selectedMaterial.toLowerCase().trim();

        if (target === "gold")     return combined.includes("gold") || combined.includes("vermeil") || combined.includes("18k");
        if (target === "silver")   return combined.includes("silver") || combined.includes("925") || combined.includes("sterling");
        if (target === "platinum") return combined.includes("platinum") || combined.includes("950");
        if (target === "diamond")  return combined.includes("diamond") || combined.includes("solitaire") || combined.includes("pave");
        return combined.includes(target);
      });
    }

    if (selectedType !== "All") {
      result = result.filter((p) => {
        if (!p.type) return false;
        const pType = p.type.toLowerCase().trim();
        const targetType = selectedType.toLowerCase().trim();
        if (pType === targetType) return true;

        const pSingular = pType.endsWith("s") ? pType.slice(0, -1) : pType;
        const tSingular = targetType.endsWith("s") ? targetType.slice(0, -1) : targetType;

        if (tSingular === "ring") {
          return (pSingular === "ring" || pType.includes("ring")) && !pType.includes("earring");
        }
        return pSingular === tSingular || pType.includes(tSingular) || tSingular.includes(pSingular);
      });
    }

    const exploded = result.flatMap((p) => {
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
      exploded.sort((a, b) => a.price - b.price);
    } else if (sortBy === "PriceHighLow") {
      exploded.sort((a, b) => b.price - a.price);
    }

    return exploded;
  }, [products, selectedCollection, selectedMaterial, selectedType, sortBy]);

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
          <span className="text-ink-black font-semibold">All Jewelry</span>
        </nav>
      </div>

      <main className="flex-grow w-full max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop pb-section-gap">
        <header className="py-12 flex flex-col items-center text-center max-w-3xl mx-auto space-y-4">
          <h1 className="font-display-lg-mobile text-display-lg-mobile md:font-display-lg md:text-display-lg text-deep-navy uppercase tracking-tight">
            The Atelier Catalog
          </h1>
          <p className="font-body-lg text-body-lg text-secondary">
            Explore our complete collection of handcrafted luxury bands, necklaces, earrings, and bespoke fine jewelry.
          </p>
        </header>

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
              Faceted Search / {processedProducts.length} Items
            </span>
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
                    className={`px-4 py-2 text-left font-label-caps text-xs tracking-wider uppercase hover:bg-soft-linen cursor-pointer ${sortBy === sort ? "text-deep-navy font-semibold" : "text-slate-grey"}`}
                  >
                    {sort === "Curated" ? "Curated" : sort === "PriceLowHigh" ? "Price: Low to High" : "Price: High to Low"}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-8 items-start">
          <aside className="hidden md:block w-64 shrink-0 sticky top-24 space-y-8 bg-soft-linen/10 p-6 border border-slate-grey/15">
            <div>
              <h4 className="font-label-caps text-xs text-deep-navy font-bold tracking-widest uppercase border-b border-slate-grey/10 pb-2 mb-4">
                Collections
              </h4>
              <div className="flex flex-col gap-2">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-body-md text-slate-grey hover:text-ink-black">
                  <input
                    type="radio"
                    name="collection"
                    checked={selectedCollection === "All"}
                    onChange={() => handleCollectionChange("All")}
                    className="w-3.5 h-3.5 text-deep-navy border-slate-grey/30 focus:ring-deep-navy"
                  />
                  <span className={selectedCollection === "All" ? "text-deep-navy font-semibold" : ""}>All Collections</span>
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

          <div className="flex-grow w-full">
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
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 md:gap-gutter">
                {processedProducts.map((p: any) => {
                  const isWishlisted = wishlist.includes(p.id);
                  return (
                    <ProductCard
                      key={p._variantCardId}
                      product={p}
                      formatPrice={formatPrice}
                      isWishlisted={isWishlisted}
                      onWishlistToggle={(id, title, e) => toggleWishlist(id, title, e)}
                      onQuickAdd={(item, variant) => handleQuickAdd(item, variant)}
                      showQuickAdd={true}
                    />
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
