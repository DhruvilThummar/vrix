"use client";
 
import Image from "next/image";
import { useState, useEffect, useMemo, Suspense } from "react";
import { useSearchParams, useRouter, useParams } from "next/navigation";
import { fetchProducts, getWishlistKey } from "@/utils/api";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import ProductImageGrid2x2 from "@/components/pdp/ProductImageGrid2x2";
import MetalSwatches from "@/components/pdp/MetalSwatches";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import { useCurrency } from "@/context/CurrencyContext";
import Link from "next/link";
 
const DEFAULT_PRODUCT = {
  id: "silent-center-ring",
  title: "The Silent Center Ring",
  material: "18K Gold Vermeil & White Sapphire",
  price: 180,
  image: "https://lh3.googleusercontent.com/aida-public/AB6AXuCi1FcGb9JCgKp0bQNn6hHoMfVtx8bGaQVxU6SUx3CUvynURNZEWjXkcbb0t2j94rIQTCuLBeRnt3ycnvp3ZsUeOHN04_45Z5Y4DPQXgxch1mUrrI8unNaeY3nOH7Y3-am6TVke8zbsKFdPh_2KddVZqo_qDouO5a_mDsktkhIQvCz7KyHfvK5ZW-BbVVY2Ka1FCSvVO8l4EgH2Wm1GRQqokMl3yVF9P5TgsXyW6r1dQ-ECCE9QyoZZTwl_INzOjPZpds4fOZxGCgk",
  images: [] as string[],
  description: "A symbol of inner balance. Designed to remind you that you are your own center. Minimalist architecture translated into an intimate everyday companion.",
};
 
function ProductContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, isLoggedIn } = useAuth();
  const { formatPrice } = useCurrency();
  const productId = (params?.id as string) || searchParams.get("id");
  const { addItem } = useCart();
 
  const [products, setProducts] = useState<any[]>([]);
  const [selectedMetal, setSelectedMetal] = useState("18K Gold Vermeil & White Sapphire");
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [size, setSize] = useState("");
  const [engraving, setEngraving] = useState("");
  const [giftNote, setGiftNote] = useState("");
  const [bagLoading, setBagLoading] = useState(false);
  const [wishlistActive, setWishlistActive] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [activeAccordion, setActiveAccordion] = useState<string | null>("details");
  const [loading, setLoading] = useState(true);
 
  useEffect(() => {
    fetchProducts()
      .then(setProducts)
      .catch((err) => console.error("Error loading products:", err))
      .finally(() => setLoading(false));
  }, []);
 
  const product = useMemo(() => {
    if (!productId) return null;
    const found = products.find((p) => String(p.id).trim().toLowerCase() === String(productId).trim().toLowerCase());
    if (!found && loading) return null;
    return found || null;
  }, [products, productId, loading]);
 
  useEffect(() => {
    try {
      const key = getWishlistKey(user?.email);
      const saved = localStorage.getItem(key) || localStorage.getItem("vrix-wishlist");
      if (saved && product?.id) {
        const list = JSON.parse(saved);
        setWishlistActive(list.includes(product.id));
      }
    } catch {}
  }, [product, user?.email]);
 
  const galleryImages = useMemo(() => {
    if (!product) return [];
    const urls = [product.image, ...(Array.isArray(product.images) ? product.images : [])]
      .filter((url): url is string => typeof url === "string")
      .filter(Boolean)
      .filter((url, index, arr) => arr.indexOf(url) === index);
 
    return urls.map((src, index) => ({
      src,
      alt: index === 0 ? `Main view of ${product.title}` : `Gallery view ${index + 1} of ${product.title}`,
    }));
  }, [product]);
 
  const relatedProducts = useMemo(() => {
    if (!product || products.length <= 1) return [];
    const filtered = products.filter((p) => {
      if (String(p.id) === String(product.id)) return false;
      const sameType = p.type && product.type && p.type.toLowerCase() === product.type.toLowerCase();
      const sameCol = p.collection && product.collection && p.collection.toLowerCase() === product.collection.toLowerCase();
      return sameType || sameCol;
    });
    return (filtered.length > 0 ? filtered : products.filter((p) => String(p.id) !== String(product.id))).slice(0, 4);
  }, [products, product]);
 
  const toggleAccordion = (name: string) => {
    setActiveAccordion(activeAccordion === name ? null : name);
  };
 
  // Sync default size when product loads
  useEffect(() => {
    if (product?.availableSizes && product.availableSizes.length > 0) {
      setSize(product.availableSizes[0]);
    } else {
      setSize("");
    }
  }, [product]);

  const handleAddToBag = () => {
    if (!product) return;
    if (!isLoggedIn) {
      showToast("Please sign in to add items to your bag.");
      setTimeout(() => router.push("/account"), 1000);
      return;
    }
    
    // Check if product requires size selection
    const hasSizes = Array.isArray(product.availableSizes) && product.availableSizes.length > 0;
    const finalSize = hasSizes ? (size || product.availableSizes[0]) : "Standard";

    setBagLoading(true);
    setTimeout(() => {
      const basePrice = (product.isVrixPlusExclusive && product.vrixPlusPrice) ? product.vrixPlusPrice : product.price;
      
      let customizationPrice = 0;
      if (engraving && product.engravingOptions?.enabled) customizationPrice += (product.engravingOptions.price || 0);
      if (giftNote && product.giftNoteOptions?.enabled) customizationPrice += (product.giftNoteOptions.price || 0);

      addItem({
        id: product.id,
        title: product.title,
        price: basePrice + customizationPrice,
        image: product.image,
        material: selectedMetal || product.material || "18K Gold Vermeil",
        size: finalSize,
        engraving,
        giftNote,
      });
      setBagLoading(false);
      showToast(`✓ "${product.title}" has been successfully added to your bag.`);
    }, 600);
  };
 
  const handleAddToWishlist = () => {
    if (!product) return;
    if (!isLoggedIn) {
      showToast("Please sign in to add items to your wishlist.");
      setTimeout(() => router.push("/account"), 1000);
      return;
    }
    try {
      const key = getWishlistKey(user?.email);
      const saved = localStorage.getItem(key) || localStorage.getItem("vrix-wishlist");
      let list = saved ? JSON.parse(saved) : [];
      const active = list.includes(product.id);
      const nextActive = !active;
      if (active) {
        list = list.filter((id: string) => id !== product.id);
        showToast("Removed from your Wishlist.");
      } else {
        list.push(product.id);
        showToast("Added to your Wishlist.");
      }
      setWishlistActive(nextActive);
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
    }, 4000);
  };
 
  if (loading) {
    return (
      <div className="relative w-full">
        <main className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop py-8 md:py-section-gap">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-gutter md:gap-[80px]">
            {/* Left Column: Image Gallery Skeletons */}
            <div className="md:col-span-7 flex flex-col gap-4 md:gap-8 relative">
              <div className="bg-soft-linen aspect-[4/5] w-full relative overflow-hidden">
                <Skeleton height="100%" containerClassName="absolute inset-0 block h-full w-full" />
              </div>
              <div className="flex gap-4 overflow-x-auto pb-2 hide-scrollbar">
                {Array.from({ length: 3 }).map((_, index) => (
                  <div key={index} className="relative aspect-[4/5] w-24 bg-soft-linen overflow-hidden">
                    <Skeleton height="100%" containerClassName="absolute inset-0 block h-full w-full" />
                  </div>
                ))}
              </div>
            </div>
 
            {/* Right Column: Sticky Product Information Skeletons */}
            <div className="md:col-span-5 relative mt-8 md:mt-0">
              <div className="flex flex-col gap-stack-lg">
                <div className="flex flex-col gap-2 border-b border-slate-grey/20 pb-8">
                  <Skeleton height={40} width="80%" className="mb-2" />
                  <Skeleton height={16} width="40%" className="mb-4" />
                  <Skeleton height={28} width="30%" className="mb-4" />
                  <Skeleton count={3} height={14} className="mb-2" />
                  <Skeleton height={16} width="60%" className="mt-4" />
                </div>
                <div className="flex flex-col gap-6">
                  <Skeleton height={50} width="100%" />
                  <Skeleton height={50} width="100%" />
                  <Skeleton height={50} width="100%" />
                </div>
                <div className="flex flex-col gap-4 mt-4">
                  <Skeleton height={56} width="100%" />
                  <Skeleton height={56} width="100%" />
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }
 
  if (!product && !loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center gap-6 px-4">
        <span className="material-symbols-outlined text-slate-grey text-5xl" style={{ fontVariationSettings: "'FILL' 0, 'wght' 200" }}>inventory_2</span>
        <div className="text-center space-y-2">
          <h1 className="font-display-lg text-xl text-deep-navy uppercase tracking-widest">Piece Not Found</h1>
          <p className="font-body-md text-slate-grey text-sm">The jewelry item you requested is unavailable or has been archived.</p>
        </div>
        <Link href="/collections" className="bg-deep-navy text-pure-white font-button text-xs px-8 py-3.5 uppercase tracking-widest hover:bg-ink-black transition-colors">
          Browse Collections
        </Link>
      </div>
    );
  }
 
  return (
    <div className="relative w-full">
      {/* Dynamic Alert Toast */}
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
 
      <main className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop py-4 md:py-section-gap">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-[80px]">
          {/* Left Column: Image Grid (PC Layout: 2x2 or Asymmetric) */}
          <div className="md:col-span-7 relative">
            <ProductImageGrid2x2
              images={galleryImages}
              title={product.title}
              layoutStyle={product.layoutStyle || "2x2"}
            />
          </div>

          {/* Right Column: Sticky Product Information */}
          <div className="md:col-span-5 relative mt-4 md:mt-0">
            <div className="sticky top-[100px] flex flex-col gap-4 md:gap-stack-lg">
              
              {/* Header Info */}
              <div className="flex flex-col gap-2 border-b border-slate-grey/20 pb-4 md:pb-6">
                <h1 className="font-display-lg-mobile md:font-display-lg text-ink-black tracking-tight leading-tight uppercase">
                  {product.title}
                </h1>
                <p className="font-body-md text-slate-grey text-xs uppercase tracking-widest font-label-caps flex items-center gap-2 flex-wrap">
                  <span>From VRIX {product.type || "Jewelry"} Collection</span>
                  {product.isVrixPlusExclusive && (
                    <span className="bg-amber-100 text-amber-900 border border-amber-300 font-label-caps text-[9px] uppercase tracking-widest px-2 py-0.5 font-bold flex items-center gap-1">
                      <span className="material-symbols-outlined text-[12px]">stars</span>
                      VRIX+ Exclusive
                    </span>
                  )}
                </p>

                {/* Price Display */}
                <div className="flex items-baseline gap-3 mt-2 flex-wrap">
                  {product.isVrixPlusExclusive && product.vrixPlusPrice ? (
                    <>
                      <span className="font-headline-md text-deep-navy text-2xl font-semibold">{formatPrice(product.vrixPlusPrice)}</span>
                      <span className="font-label-caps text-[10px] text-amber-700 uppercase font-bold tracking-wider">Member Price</span>
                      <span className="font-body-md text-slate-grey/60 line-through text-sm">{formatPrice(product.price)}</span>
                    </>
                  ) : product.originalPrice && product.originalPrice > product.price ? (
                    <>
                      <span className="font-headline-md text-ink-black text-2xl font-semibold">{formatPrice(product.price)}</span>
                      <span className="font-body-md text-slate-grey/60 line-through text-base">{formatPrice(product.originalPrice)}</span>
                      <span className="bg-emerald-700 text-white font-label-caps text-[10px] px-2 py-0.5 font-bold uppercase tracking-wider">
                        {Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)}% OFF
                      </span>
                    </>
                  ) : (
                    <p className="font-headline-md text-ink-black text-2xl font-semibold">{formatPrice(product.price)}</p>
                  )}
                </div>

                {/* Description (hide container spacing if empty) */}
                {product.description && product.description.trim() ? (
                  <p className="font-body-md text-on-surface-variant mt-2 leading-relaxed text-sm">
                    {product.description}
                  </p>
                ) : null}
              </div>

              {/* Metal / Material Finish Swatches (Only render if defined in Admin) */}
              {((product.availableMetals && product.availableMetals.length > 0) || (product.metals && product.metals.length > 0)) && (
                <MetalSwatches
                  selectedMetal={selectedMetal}
                  onSelectMetal={(metal) => setSelectedMetal(metal.name)}
                />
              )}

              {/* Configuration Form */}
              <div className="flex flex-col gap-6">
                
                {/* Size Selection (Only render if availableSizes added in Admin) */}
                {product.availableSizes && product.availableSizes.length > 0 && (
                  <div className="flex flex-col gap-2">
                    <div className="flex justify-between items-center">
                      <label className="font-label-caps uppercase text-ink-black tracking-widest text-[10px]" htmlFor="size">
                        Size
                      </label>
                      <button className="font-label-caps uppercase text-slate-grey hover:text-ink-black underline decoration-1 underline-offset-4 text-[10px] transition-colors cursor-pointer">
                        Size Guide
                      </button>
                    </div>
                    <div className="relative">
                      <select
                        className="w-full appearance-none bg-transparent border-0 border-b border-slate-grey/30 py-3 pl-0 pr-8 font-body-md text-ink-black cursor-pointer rounded-none transition-colors hover:border-slate-grey focus:ring-0"
                        id="size"
                        value={size}
                        onChange={(e) => setSize(e.target.value)}
                      >
                        {product.availableSizes.map((sz: string) => (
                          <option key={sz} value={sz}>{sz}</option>
                        ))}
                      </select>
                      <span className="material-symbols-outlined absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none text-slate-grey">
                        expand_more
                      </span>
                    </div>
                  </div>
                )}

                {/* Engraving (Optional) */}
                {product.engravingOptions?.enabled && (
                  <div className="flex flex-col gap-2 mt-2">
                    <div className="flex justify-between items-center">
                      <label className="font-label-caps uppercase text-ink-black tracking-widest text-[10px]" htmlFor="engraving">
                        Engraving (Optional) {product.engravingOptions.price > 0 && `(+${formatPrice(product.engravingOptions.price)})`}
                      </label>
                      <span className="font-label-caps text-slate-grey text-[10px]">{engraving.length}/{product.engravingOptions.limit || 25}</span>
                    </div>
                    <input
                      className="w-full bg-transparent border-0 border-b border-slate-grey/30 py-3 px-0 font-body-md text-ink-black placeholder:text-slate-grey/50 rounded-none transition-colors hover:border-slate-grey focus:ring-0"
                      id="engraving"
                      placeholder="Add a personal message"
                      type="text"
                      maxLength={product.engravingOptions.limit || 25}
                      value={engraving}
                      onChange={(e) => setEngraving(e.target.value)}
                    />
                  </div>
                )}

                {/* Gift Note (Optional) */}
                {product.giftNoteOptions?.enabled && (
                  <div className="flex flex-col gap-2 mt-2">
                    <label className="font-label-caps uppercase text-ink-black tracking-widest text-[10px]" htmlFor="giftNote">
                      Gift Message (Optional) {product.giftNoteOptions.price > 0 && `(+${formatPrice(product.giftNoteOptions.price)})`}
                    </label>
                    <input
                      className="w-full bg-transparent border-0 border-b border-slate-grey/30 py-3 px-0 font-body-md text-ink-black placeholder:text-slate-grey/50 rounded-none transition-colors hover:border-slate-grey focus:ring-0"
                      id="giftNote"
                      placeholder="Add a gift message"
                      type="text"
                      value={giftNote}
                      onChange={(e) => setGiftNote(e.target.value)}
                    />
                  </div>
                )}
              </div>

              {/* Add to Bag and Wishlist Actions */}
              <div className="flex flex-row gap-3 mt-4 w-full">
                <button
                  onClick={handleAddToBag}
                  disabled={bagLoading}
                  className="flex-1 bg-deep-navy text-pure-white py-4 font-button uppercase tracking-widest hover:bg-ink-black transition-colors cursor-pointer disabled:opacity-60 flex items-center justify-center gap-2 text-xs sm:text-sm"
                >
                  {bagLoading ? (
                    <>
                      <span className="w-4 h-4 border-2 border-pure-white border-t-transparent rounded-full animate-spin shrink-0" />
                      <span className="truncate">Adding...</span>
                    </>
                  ) : (
                    <span className="truncate">Add to Bag</span>
                  )}
                </button>
                <button
                  onClick={handleAddToWishlist}
                  className="flex-grow flex-1 border border-slate-grey/30 py-4 font-button uppercase tracking-widest hover:border-ink-black transition-all cursor-pointer flex items-center justify-center gap-1.5 text-xs sm:text-sm text-ink-black bg-transparent"
                >
                  <span className={`material-symbols-outlined text-[18px] shrink-0 ${wishlistActive ? "text-red-600 fill-red-600" : ""}`}>
                    {wishlistActive ? "favorite" : "favorite_border"}
                  </span>
                  <span className="truncate">
                    {wishlistActive ? "In Wishlist" : "Wishlist"}
                  </span>
                </button>
              </div>

              {/* Product Info Accordions */}
              <div className="flex flex-col border-t border-slate-grey/20 mt-8">
                {/* Details Accordion */}
                <div className="border-b border-slate-grey/20">
                  <button
                    onClick={() => toggleAccordion("details")}
                    className="flex justify-between items-center w-full font-label-caps uppercase text-ink-black py-5 cursor-pointer text-left focus:outline-none"
                  >
                    <span>Product Details</span>
                    <span
                      className={`material-symbols-outlined transition-transform duration-300 ${
                        activeAccordion === "details" ? "rotate-180" : ""
                      }`}
                    >
                      expand_more
                    </span>
                  </button>
                  <div
                    className={`overflow-hidden transition-all duration-300 ${
                      activeAccordion === "details" ? "max-h-96 pb-5 opacity-100" : "max-h-0 opacity-0"
                    }`}
                  >
                    <div className="font-body-md text-on-surface-variant text-sm leading-relaxed space-y-2">
                      {product.description && <p>{product.description}</p>}
                      {product.sku && <p className="text-[11px] text-slate-grey"><span className="font-semibold uppercase tracking-wider">SKU:</span> {product.sku}</p>}
                      {product.weight && <p className="text-[11px] text-slate-grey"><span className="font-semibold uppercase tracking-wider">Weight:</span> {product.weight}</p>}
                      {product.dimensions && <p className="text-[11px] text-slate-grey"><span className="font-semibold uppercase tracking-wider">Dimensions:</span> {product.dimensions}</p>}
                    </div>
                  </div>
                </div>

                {/* Comparison Specifications Accordion (Only show if comparisonOptions defined in Admin) */}
                {product.comparisonOptions && Object.keys(product.comparisonOptions).length > 0 && (
                  <div className="border-b border-slate-grey/20">
                    <button
                      onClick={() => toggleAccordion("comparison")}
                      className="flex justify-between items-center w-full font-label-caps uppercase text-ink-black py-5 cursor-pointer text-left focus:outline-none"
                    >
                      <span>Worth &amp; Comparison Metrics</span>
                      <span
                        className={`material-symbols-outlined transition-transform duration-300 ${
                          activeAccordion === "comparison" ? "rotate-180" : ""
                        }`}
                      >
                        expand_more
                      </span>
                    </button>
                    <div
                      className={`overflow-hidden transition-all duration-300 ${
                        activeAccordion === "comparison" ? "max-h-96 pb-5 opacity-100" : "max-h-0 opacity-0"
                      }`}
                    >
                      <div className="space-y-3.5 text-xs font-body-md text-ink-black">
                        <div className="grid grid-cols-2 gap-4">
                          {product.comparisonOptions.worthIndex != null && (
                            <div className="p-3 bg-soft-linen/25 border border-slate-grey/10 rounded flex flex-col justify-between">
                              <span className="text-[9px] font-label-caps uppercase tracking-widest text-slate-grey">Worth / Value Index</span>
                              <div className="flex items-baseline gap-1.5 mt-1">
                                <span className="text-xl font-bold text-deep-navy">{product.comparisonOptions.worthIndex}</span>
                                <span className="text-[10px] text-slate-grey">/ 10 Rating</span>
                              </div>
                            </div>
                          )}
                          {product.comparisonOptions.hardness != null && (
                            <div className="p-3 bg-soft-linen/25 border border-slate-grey/10 rounded flex flex-col justify-between">
                              <span className="text-[9px] font-label-caps uppercase tracking-widest text-slate-grey">Hardness Rating</span>
                              <div className="flex items-baseline gap-1.5 mt-1">
                                <span className="text-xl font-bold text-deep-navy">{product.comparisonOptions.hardness}</span>
                                <span className="text-[10px] text-slate-grey">Mohs scale</span>
                              </div>
                            </div>
                          )}
                          {product.comparisonOptions.shine != null && (
                            <div className="p-3 bg-soft-linen/25 border border-slate-grey/10 rounded flex flex-col justify-between">
                              <span className="text-[9px] font-label-caps uppercase tracking-widest text-slate-grey">Shine &amp; Lustre</span>
                              <div className="flex items-baseline gap-1.5 mt-1">
                                <span className="text-xl font-bold text-deep-navy">{product.comparisonOptions.shine}</span>
                                <span className="text-[10px] text-slate-grey">/ 10 Score</span>
                              </div>
                            </div>
                          )}
                          {product.comparisonOptions.styleRating != null && (
                            <div className="p-3 bg-soft-linen/25 border border-slate-grey/10 rounded flex flex-col justify-between">
                              <span className="text-[9px] font-label-caps uppercase tracking-widest text-slate-grey">Style Matching</span>
                              <div className="flex items-baseline gap-1.5 mt-1">
                                <span className="text-xl font-bold text-deep-navy">{product.comparisonOptions.styleRating}</span>
                                <span className="text-[10px] text-slate-grey">/ 10 Versatility</span>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Packaging Box & Ribbon Guide Accordion (Only show if giftOptions defined in Admin) */}
                {product.giftOptions && (product.giftOptions.packagingNote || product.giftOptions.showCustomBox) && (
                  <div className="border-b border-slate-grey/20">
                    <button
                      onClick={() => toggleAccordion("packaging")}
                      className="flex justify-between items-center w-full font-label-caps uppercase text-ink-black py-5 cursor-pointer text-left focus:outline-none"
                    >
                      <span>Signature Gift Packaging</span>
                      <span
                        className={`material-symbols-outlined transition-transform duration-300 ${
                          activeAccordion === "packaging" ? "rotate-180" : ""
                        }`}
                      >
                        expand_more
                      </span>
                    </button>
                    <div
                      className={`overflow-hidden transition-all duration-300 ${
                        activeAccordion === "packaging" ? "max-h-96 pb-5 opacity-100" : "max-h-0 opacity-0"
                      }`}
                    >
                      <div className="space-y-3.5 text-xs font-body-md text-ink-black leading-relaxed">
                        {product.giftOptions?.packagingNote && (
                          <p>{product.giftOptions.packagingNote}</p>
                        )}
                        {product.giftOptions?.showCustomBox && (
                          <div className="p-3 bg-indigo-50/50 border border-indigo-200/50 text-indigo-950 rounded flex items-start gap-2.5">
                            <span className="material-symbols-outlined text-indigo-700 text-lg">redeem</span>
                            <div>
                              <p className="font-semibold text-[11px] font-label-caps uppercase tracking-wider">Premium Custom Case Upgrade Available</p>
                              <p className="text-[10px] text-indigo-900/90 mt-0.5">
                                This piece qualifies for exclusive custom monogram presentation cases (selectable at checkout bag page for {formatPrice(product.giftOptions?.wrappingPrice || 250)} extra).
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Returns Accordion */}
                <div className="border-b border-slate-grey/20">
                  <button
                    onClick={() => toggleAccordion("returns")}
                    className="flex justify-between items-center w-full font-label-caps uppercase text-ink-black py-5 cursor-pointer text-left focus:outline-none"
                  >
                    <span>Delivery &amp; Returns</span>
                    <span
                      className={`material-symbols-outlined transition-transform duration-300 ${
                        activeAccordion === "returns" ? "rotate-180" : ""
                      }`}
                    >
                      expand_more
                    </span>
                  </button>
                  <div
                    className={`overflow-hidden transition-all duration-300 ${
                      activeAccordion === "returns" ? "max-h-40 pb-5 opacity-100" : "max-h-0 opacity-0"
                    }`}
                  >
                    <p className="font-body-md text-on-surface-variant text-sm leading-relaxed">
                      We accept returns within 30 days of receipt in original, unworn condition. Engraved items are final sale.
                    </p>
                  </div>
                </div>

                {/* Care Accordion */}
                <div className="border-b border-slate-grey/20">
                  <button
                    onClick={() => toggleAccordion("care")}
                    className="flex justify-between items-center w-full font-label-caps uppercase text-ink-black py-5 cursor-pointer text-left focus:outline-none"
                  >
                    <span>Care Guide</span>
                    <span
                      className={`material-symbols-outlined transition-transform duration-300 ${
                        activeAccordion === "care" ? "rotate-180" : ""
                      }`}
                    >
                      expand_more
                    </span>
                  </button>
                  <div
                    className={`overflow-hidden transition-all duration-300 ${
                      activeAccordion === "care" ? "max-h-40 pb-5 opacity-100" : "max-h-0 opacity-0"
                    }`}
                  >
                    <p className="font-body-md text-on-surface-variant text-sm leading-relaxed">
                      Avoid contact with harsh chemicals, perfumes, and lotions. Store in the provided VRIX pouch when not in use. Clean gently with a soft polishing cloth.
                    </p>
                  </div>
                </div>
              </div>

            </div>
          </div>

        </div>

        {/* RELATED / SUGGESTED PRODUCTS CAROUSEL SECTION */}
        {relatedProducts.length > 0 && (
          <div className="mt-16 pt-12 border-t border-slate-grey/20">
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
              <div>
                <span className="font-label-caps text-xs text-slate-grey uppercase tracking-widest block mb-1">
                  Curated Pairings
                </span>
                <h3 className="font-display-lg text-2xl text-deep-navy uppercase tracking-wider">
                  You May Also Like
                </h3>
              </div>
              <Link href="/collections" className="font-label-caps text-xs text-ink-black uppercase tracking-widest underline underline-offset-4 hover:text-slate-grey">
                View All Jewelry →
              </Link>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
              {relatedProducts.map((rel) => (
                <Link
                  key={rel.id}
                  href={`/product/${rel.id}`}
                  className="group flex flex-col space-y-3 bg-soft-linen/20 border border-soft-linen p-3 hover:border-black/30 transition-all duration-300"
                >
                  <div className="relative aspect-[4/5] bg-soft-linen overflow-hidden">
                    <Image
                      src={rel.image}
                      alt={rel.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500 mix-blend-multiply"
                      sizes="(max-width: 768px) 50vw, 25vw"
                    />
                  </div>
                  <div>
                    <h4 className="font-label-caps text-xs uppercase font-semibold text-deep-navy group-hover:text-black line-clamp-1">
                      {rel.title}
                    </h4>
                    <p className="text-[10px] text-slate-grey uppercase tracking-wider mt-0.5">
                      {rel.material || rel.type}
                    </p>
                    <p className="font-body-md text-xs font-semibold mt-1">
                      {formatPrice(rel.price)}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
 
export default function ProductPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-pure-white flex items-center justify-center text-slate-grey font-label-caps text-xs tracking-widest">Loading Product Details...</div>}>
      <ProductContent />
    </Suspense>
  );
}
