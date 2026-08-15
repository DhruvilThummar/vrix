"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useMemo, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { getWishlistKey, fetchProducts, fetchCollections } from "@/utils/api";
import { useAuth } from "@/context/AuthContext";
import { useCurrency } from "@/context/CurrencyContext";
import ProductCard from "@/components/shop/ProductCard";
import { useCart } from "@/context/CartContext";
import { matchesMaterialFilter } from "@/utils/materialFilter";

const MATERIAL_OPTIONS = ["All", "Gold", "Silver", "Platinum", "Diamond"];
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

  const [products, setProducts] = useState<any[]>(initialProducts || []);
  const [collections, setCollections] = useState<any[]>(initialCollections || []);

  useEffect(() => {
    if (Array.isArray(initialProducts) && initialProducts.length > 0) {
      setProducts(initialProducts);
    } else {
      fetchProducts().then((res) => {
        if (Array.isArray(res) && res.length > 0) setProducts(res);
      }).catch((e) => console.error("ProductsCatalogClient fetchProducts error:", e));
    }
  }, [initialProducts]);

  useEffect(() => {
    if (Array.isArray(initialCollections) && initialCollections.length > 0) {
      setCollections(initialCollections);
    } else {
      fetchCollections().then((res) => {
        if (Array.isArray(res) && res.length > 0) setCollections(res);
      }).catch((e) => console.error("ProductsCatalogClient fetchCollections error:", e));
    }
  }, [initialCollections]);

  const [selectedCollection, setSelectedCollection] = useState(() => getParam("collection", "All"));
  const [selectedMaterial, setSelectedMaterial] = useState(() => getParam("material", "All"));
  const [selectedType, setSelectedType] = useState(() => getParam("type", "All"));
  const [sortBy, setSortBy] = useState(() => getParam("sort", "Curated"));
  const [minPrice, setMinPrice] = useState(() => getParam("minPrice", ""));
  const [maxPrice, setMaxPrice] = useState(() => getParam("maxPrice", ""));
  const [pricePreset, setPricePreset] = useState(() => getParam("pricePreset", "All"));
  const [inStockOnly, setInStockOnly] = useState(() => getParam("inStock", "false") === "true");

  const [wishlist, setWishlist] = useState<string[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [filtersOpen, setFiltersOpen] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);

  useEffect(() => {
    setSelectedCollection(getParam("collection", "All"));
    setSelectedMaterial(getParam("material", "All"));
    setSelectedType(getParam("type", "All"));
    setSortBy(getParam("sort", "Curated"));
    setMinPrice(getParam("minPrice", ""));
    setMaxPrice(getParam("maxPrice", ""));
    setPricePreset(getParam("pricePreset", "All"));
    setInStockOnly(getParam("inStock", "false") === "true");
  }, [searchParams]);

  const updateQueryParam = (key: string, value: string) => {
    const nextParams = new URLSearchParams(searchParams.toString());
    if (value === "All" || !value || value === "false") {
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

  const handlePricePresetChange = (preset: string) => {
    setPricePreset(preset);
    updateQueryParam("pricePreset", preset);
    let min = "";
    let max = "";
    if (preset === "Under5k") { min = "0"; max = "5000"; }
    else if (preset === "5kTo15k") { min = "5000"; max = "15000"; }
    else if (preset === "15kTo35k") { min = "15000"; max = "35000"; }
    else if (preset === "Above35k") { min = "35000"; max = ""; }

    setMinPrice(min);
    setMaxPrice(max);
    updateQueryParam("minPrice", min);
    updateQueryParam("maxPrice", max);
  };

  const handleCustomPriceApply = (minVal: string, maxVal: string) => {
    setPricePreset("Custom");
    updateQueryParam("pricePreset", "Custom");
    setMinPrice(minVal);
    setMaxPrice(maxVal);
    updateQueryParam("minPrice", minVal);
    updateQueryParam("maxPrice", maxVal);
  };

  const handleInStockToggle = (checked: boolean) => {
    setInStockOnly(checked);
    updateQueryParam("inStock", checked ? "true" : "false");
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
    setMinPrice("");
    setMaxPrice("");
    setPricePreset("All");
    setInStockOnly(false);

    updateQueryParam("collection", "All");
    updateQueryParam("material", "All");
    updateQueryParam("type", "All");
    updateQueryParam("minPrice", "");
    updateQueryParam("maxPrice", "");
    updateQueryParam("pricePreset", "All");
    updateQueryParam("inStock", "false");
    showToast("Filters reset successfully.");
  };

  const processedProducts = useMemo(() => {
    let result = products.filter((p) => p.isVisible !== false);

    if (inStockOnly) {
      result = result.filter((p) => (p.stock ?? 999) > 0);
    }

    if (selectedCollection !== "All") {
      result = result.filter((p) => {
        const pColl = (p.collection || "").toLowerCase().replace(/[^a-z0-9]/g, "");
        const targetColl = selectedCollection.toLowerCase().replace(/[^a-z0-9]/g, "");
        return pColl === targetColl || pColl.includes(targetColl) || targetColl.includes(pColl);
      });
    }

    if (selectedMaterial !== "All") {
      result = result.filter((p) => matchesMaterialFilter(p, selectedMaterial));
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

    let exploded = result.flatMap((p) => {
      if (Array.isArray(p.variants) && p.variants.length > 0) {
        let availableVariants = p.variants.filter((v: any) => v.isAvailable !== false);

        if (inStockOnly) {
          availableVariants = availableVariants.filter((v: any) => (v.stock ?? 999) > 0);
        }

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

    if (minPrice) {
      const minVal = Number(minPrice);
      if (!isNaN(minVal) && minVal > 0) {
        exploded = exploded.filter((item) => Number(item.price) >= minVal);
      }
    }

    if (maxPrice) {
      const maxVal = Number(maxPrice);
      if (!isNaN(maxVal) && maxVal > 0) {
        exploded = exploded.filter((item) => Number(item.price) <= maxVal);
      }
    }

    if (sortBy === "PriceLowHigh") {
      exploded.sort((a, b) => a.price - b.price);
    } else if (sortBy === "PriceHighLow") {
      exploded.sort((a, b) => b.price - a.price);
    }

    return exploded;
  }, [products, selectedCollection, selectedMaterial, selectedType, minPrice, maxPrice, inStockOnly, sortBy]);

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

  const hasActiveFilters =
    selectedCollection !== "All" ||
    selectedMaterial !== "All" ||
    selectedType !== "All" ||
    !!minPrice ||
    !!maxPrice ||
    inStockOnly;

  return (
    <div className="w-full bg-pure-white relative min-h-screen">
      {toastMessage && (
        <div className="fixed bottom-8 right-8 z-50 bg-deep-navy text-pure-white px-6 py-4 border border-slate-grey/30 shadow-2xl flex items-center gap-3 animate-fade-in duration-300">
          <span className="material-symbols-outlined text-sm">info</span>
          <p className="font-inter font-primary text-sm tracking-wide">{toastMessage}</p>
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
        <nav className="flex items-center gap-2 text-[10px] font-inter font-primary uppercase tracking-wider text-slate-grey">
          <Link href="/" className="hover:text-ink-black transition-colors">Home</Link>
          <span className="material-symbols-outlined text-[10px]">chevron_right</span>
          <span className="text-ink-black font-semibold">All Jewelry</span>
        </nav>
      </div>

      <main className="flex-grow w-full max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop pb-section-gap">
        <header className="py-12 flex flex-col items-center text-center max-w-3xl mx-auto space-y-4">
          <span className="font-chancery font-accent text-xl md:text-2xl text-deep-navy">
            A luxury that feels like you.
          </span>
          <h1 className="font-inter font-primary text-3xl md:text-4xl text-deep-navy uppercase font-bold tracking-tight">
            The Atelier Catalog
          </h1>
          <p className="font-jost font-secondary text-sm md:text-base text-secondary max-w-xl">
            Explore our complete collection of handcrafted luxury bands, necklaces, earrings, and bespoke fine jewelry.
          </p>
        </header>

        {/* Toolbar Header */}
        <div className="border-t border-b border-slate-grey/30 py-3 sm:py-4 mb-6 flex flex-wrap justify-between items-center gap-3 relative z-20">
          <div className="flex min-w-0 flex-1 items-center gap-3 sm:gap-4">
            <button
              onClick={() => {
                setFiltersOpen(!filtersOpen);
                setSortOpen(false);
              }}
              className="md:hidden shrink-0 font-inter font-primary text-[10px] text-on-surface hover:text-deep-navy uppercase tracking-wider flex items-center gap-1 group transition-colors cursor-pointer"
            >
              <span>Filters</span>
              <span className={`material-symbols-outlined text-[16px] transition-transform duration-300 ${filtersOpen ? "rotate-180" : ""}`}>
                expand_more
              </span>
            </button>
            <span className="hidden md:inline font-inter font-primary text-xs text-slate-grey uppercase tracking-widest">
              Faceted Search &nbsp;/&nbsp; <strong className="text-deep-navy">{processedProducts.length} Items</strong>
            </span>
          </div>

          <div className="relative shrink-0">
            <button
              onClick={() => {
                setSortOpen(!sortOpen);
                setFiltersOpen(false);
              }}
              className="max-w-[11rem] sm:max-w-none font-inter font-primary text-[10px] sm:text-xs text-on-surface hover:text-deep-navy uppercase tracking-wider sm:tracking-widest flex items-center gap-1 group transition-colors cursor-pointer text-right"
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
                    className={`px-4 py-2 text-left font-inter font-primary text-xs tracking-wider uppercase hover:bg-soft-linen cursor-pointer ${sortBy === sort ? "text-deep-navy font-semibold" : "text-slate-grey"}`}
                  >
                    {sort === "Curated" ? "Curated" : sort === "PriceLowHigh" ? "Price: Low to High" : "Price: High to Low"}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Active Filter Chips Bar */}
        {hasActiveFilters && (
          <div className="flex flex-wrap items-center gap-2 mb-6 pb-4 border-b border-slate-grey/15">
            <span className="font-inter font-primary text-[11px] text-slate-grey uppercase tracking-wider mr-1">
              Active Filters:
            </span>

            {selectedCollection !== "All" && (
              <button
                onClick={() => handleCollectionChange("All")}
                className="inline-flex items-center gap-1.5 px-3 py-1 bg-soft-linen border border-slate-grey/30 text-deep-navy font-inter font-primary text-[10px] uppercase tracking-wider rounded-xs hover:bg-slate-grey/20 cursor-pointer transition-colors"
              >
                <span>Collection: {collections.find((c) => c.id === selectedCollection)?.title || selectedCollection}</span>
                <span className="text-xs">✕</span>
              </button>
            )}

            {selectedMaterial !== "All" && (
              <button
                onClick={() => handleMaterialChange("All")}
                className="inline-flex items-center gap-1.5 px-3 py-1 bg-soft-linen border border-slate-grey/30 text-deep-navy font-inter font-primary text-[10px] uppercase tracking-wider rounded-xs hover:bg-slate-grey/20 cursor-pointer transition-colors"
              >
                <span>Material: {selectedMaterial}</span>
                <span className="text-xs">✕</span>
              </button>
            )}

            {selectedType !== "All" && (
              <button
                onClick={() => handleTypeChange("All")}
                className="inline-flex items-center gap-1.5 px-3 py-1 bg-soft-linen border border-slate-grey/30 text-deep-navy font-inter font-primary text-[10px] uppercase tracking-wider rounded-xs hover:bg-slate-grey/20 cursor-pointer transition-colors"
              >
                <span>Type: {selectedType}</span>
                <span className="text-xs">✕</span>
              </button>
            )}

            {(minPrice || maxPrice) && (
              <button
                onClick={() => handleCustomPriceApply("", "")}
                className="inline-flex items-center gap-1.5 px-3 py-1 bg-soft-linen border border-slate-grey/30 text-deep-navy font-inter font-primary text-[10px] uppercase tracking-wider rounded-xs hover:bg-slate-grey/20 cursor-pointer transition-colors"
              >
                <span>
                  Price: {minPrice ? `₹${Number(minPrice).toLocaleString()}` : "₹0"} - {maxPrice ? `₹${Number(maxPrice).toLocaleString()}` : "Any"}
                </span>
                <span className="text-xs">✕</span>
              </button>
            )}

            {inStockOnly && (
              <button
                onClick={() => handleInStockToggle(false)}
                className="inline-flex items-center gap-1.5 px-3 py-1 bg-soft-linen border border-slate-grey/30 text-deep-navy font-inter font-primary text-[10px] uppercase tracking-wider rounded-xs hover:bg-slate-grey/20 cursor-pointer transition-colors"
              >
                <span>In Stock Only</span>
                <span className="text-xs">✕</span>
              </button>
            )}

            <button
              onClick={handleResetFilters}
              className="text-[10px] font-inter font-primary text-deep-navy font-semibold underline hover:text-ink-black uppercase tracking-wider ml-2 cursor-pointer"
            >
              Clear All
            </button>
          </div>
        )}

        <div className="flex flex-col md:flex-row gap-8 items-start">
          {/* Sidebar Filters */}
          <aside className="hidden md:block w-64 shrink-0 sticky top-24 space-y-8 bg-soft-linen/10 p-6 border border-slate-grey/15">
            {/* Collections */}
            <div>
              <h4 className="font-inter font-primary text-xs text-deep-navy font-bold tracking-widest uppercase border-b border-slate-grey/10 pb-2 mb-4">
                Collections
              </h4>
              <div className="flex flex-col gap-2">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-jost font-secondary text-slate-grey hover:text-ink-black">
                  <input
                    type="radio"
                    name="collection"
                    checked={selectedCollection === "All"}
                    onChange={() => handleCollectionChange("All")}
                    className="w-3.5 h-3.5 text-deep-navy border-slate-grey/30 focus:ring-deep-navy"
                  />
                  <span className={selectedCollection === "All" ? "text-deep-navy font-semibold font-inter font-primary" : ""}>All Collections</span>
                </label>
                {collections.map((col) => (
                  <label key={col.id} className="flex items-center gap-2 cursor-pointer text-xs font-jost font-secondary text-slate-grey hover:text-ink-black">
                    <input
                      type="radio"
                      name="collection"
                      checked={selectedCollection === col.id}
                      onChange={() => handleCollectionChange(col.id)}
                      className="w-3.5 h-3.5 text-deep-navy border-slate-grey/30 focus:ring-deep-navy"
                    />
                    <span className={selectedCollection === col.id ? "text-deep-navy font-semibold font-inter font-primary" : ""}>{col.title}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Materials */}
            <div>
              <h4 className="font-inter font-primary text-xs text-deep-navy font-bold tracking-widest uppercase border-b border-slate-grey/10 pb-2 mb-4">
                Materials
              </h4>
              <div className="flex flex-col gap-2">
                {MATERIAL_OPTIONS.map((mat) => (
                  <label key={mat} className="flex items-center gap-2 cursor-pointer text-xs font-jost font-secondary text-slate-grey hover:text-ink-black">
                    <input
                      type="radio"
                      name="material"
                      checked={selectedMaterial === mat}
                      onChange={() => handleMaterialChange(mat)}
                      className="w-3.5 h-3.5 text-deep-navy border-slate-grey/30 focus:ring-deep-navy"
                    />
                    <span className={selectedMaterial === mat ? "text-deep-navy font-semibold font-inter font-primary" : ""}>{mat}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Product Type */}
            <div>
              <h4 className="font-inter font-primary text-xs text-deep-navy font-bold tracking-widest uppercase border-b border-slate-grey/10 pb-2 mb-4">
                Product Type
              </h4>
              <div className="flex flex-col gap-2">
                {TYPE_OPTIONS.map((type) => (
                  <label key={type} className="flex items-center gap-2 cursor-pointer text-xs font-jost font-secondary text-slate-grey hover:text-ink-black">
                    <input
                      type="radio"
                      name="type"
                      checked={selectedType === type}
                      onChange={() => handleTypeChange(type)}
                      className="w-3.5 h-3.5 text-deep-navy border-slate-grey/30 focus:ring-deep-navy"
                    />
                    <span className={selectedType === type ? "text-deep-navy font-semibold font-inter font-primary" : ""}>{type}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Price Range */}
            <div>
              <h4 className="font-inter font-primary text-xs text-deep-navy font-bold tracking-widest uppercase border-b border-slate-grey/10 pb-2 mb-4">
                Price Range
              </h4>
              <div className="flex flex-col gap-2 mb-3">
                {[
                  { id: "All", label: "All Prices" },
                  { id: "Under5k", label: "Under ₹5,000" },
                  { id: "5kTo15k", label: "₹5,000 - ₹15,000" },
                  { id: "15kTo35k", label: "₹15,000 - ₹35,000" },
                  { id: "Above35k", label: "Above ₹35,000" },
                ].map((p) => (
                  <label key={p.id} className="flex items-center gap-2 cursor-pointer text-xs font-jost font-secondary text-slate-grey hover:text-ink-black">
                    <input
                      type="radio"
                      name="pricePreset"
                      checked={pricePreset === p.id}
                      onChange={() => handlePricePresetChange(p.id)}
                      className="w-3.5 h-3.5 text-deep-navy border-slate-grey/30 focus:ring-deep-navy"
                    />
                    <span className={pricePreset === p.id ? "text-deep-navy font-semibold font-inter font-primary" : ""}>{p.label}</span>
                  </label>
                ))}
              </div>

              {/* Custom Min / Max inputs */}
              <div className="pt-2 border-t border-slate-grey/10">
                <span className="font-inter font-primary text-[10px] text-slate-grey uppercase tracking-wider block mb-2">Custom Range (₹)</span>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    placeholder="Min"
                    value={minPrice}
                    onChange={(e) => setMinPrice(e.target.value)}
                    className="w-full px-2 py-1 border border-slate-grey/30 text-xs font-inter font-primary rounded-xs focus:outline-none focus:border-deep-navy"
                  />
                  <span className="text-slate-grey text-xs">-</span>
                  <input
                    type="number"
                    placeholder="Max"
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(e.target.value)}
                    className="w-full px-2 py-1 border border-slate-grey/30 text-xs font-inter font-primary rounded-xs focus:outline-none focus:border-deep-navy"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => handleCustomPriceApply(minPrice, maxPrice)}
                  className="w-full mt-2 py-1 bg-soft-linen text-deep-navy border border-slate-grey/30 text-[10px] font-inter font-primary uppercase tracking-wider hover:bg-deep-navy hover:text-pure-white transition-colors cursor-pointer"
                >
                  Apply Price
                </button>
              </div>
            </div>

            {/* Availability */}
            <div>
              <h4 className="font-inter font-primary text-xs text-deep-navy font-bold tracking-widest uppercase border-b border-slate-grey/10 pb-2 mb-4">
                Availability
              </h4>
              <label className="flex items-center gap-2 cursor-pointer text-xs font-jost font-secondary text-slate-grey hover:text-ink-black">
                <input
                  type="checkbox"
                  checked={inStockOnly}
                  onChange={(e) => handleInStockToggle(e.target.checked)}
                  className="w-3.5 h-3.5 text-deep-navy rounded-xs border-slate-grey/30 focus:ring-deep-navy"
                />
                <span className={inStockOnly ? "text-deep-navy font-semibold font-inter font-primary" : ""}>In Stock Only</span>
              </label>
            </div>

            {hasActiveFilters && (
              <button
                onClick={handleResetFilters}
                className="w-full py-2 bg-deep-navy text-pure-white text-[10px] font-inter font-primary uppercase tracking-wider hover:bg-ink-black transition-colors cursor-pointer"
              >
                Reset Filters
              </button>
            )}
          </aside>

          {/* Product Grid */}
          <div className="flex-grow w-full">
            {processedProducts.length === 0 ? (
              <div className="text-center py-section-gap flex flex-col items-center justify-center space-y-4">
                <span className="material-symbols-outlined text-slate-grey text-4xl">inventory_2</span>
                <p className="font-jost font-secondary text-base text-slate-grey">No products found matching your active filters.</p>
                <button
                  onClick={handleResetFilters}
                  className="px-6 py-2 border border-deep-navy text-deep-navy font-inter font-primary text-xs uppercase tracking-wider hover:bg-deep-navy hover:text-pure-white transition-colors cursor-pointer"
                >
                  Reset Filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 md:gap-gutter">
                {processedProducts.map((p: any, idx: number) => {
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
                      priority={idx < 4}
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
