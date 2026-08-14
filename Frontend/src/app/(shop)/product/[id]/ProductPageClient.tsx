"use client";

import Image from "next/image";
import { useState, useEffect, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import { getWishlistKey, setWishlistStockAlert, fetchProduct } from "@/utils/api";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import ProductImageGrid2x2 from "@/components/pdp/ProductImageGrid2x2";
import MetalSwatches from "@/components/pdp/MetalSwatches";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import { useCurrency } from "@/context/CurrencyContext";
import Link from "next/link";
import { Radio } from "@base-ui/react/radio";
import { RadioGroup } from "@base-ui/react/radio-group";
import { useGSAP } from "@gsap/react";
import { gsap } from "@/lib/gsap";
import { getDisplayPrice } from "@/lib/pricing";
import { useVariantAnimations } from "@/hooks/useVariantAnimations";
import ProductCard from "@/components/shop/ProductCard";

interface ProductPageClientProps {
  initialProduct: any;
  allProducts: any[];
}

export default function ProductPageClient({ initialProduct, allProducts }: ProductPageClientProps) {
  const router = useRouter();
  const { user, isLoggedIn } = useAuth();
  const { formatPrice } = useCurrency();
  const { addItem } = useCart();

  const [product, setProduct] = useState<any>(initialProduct);
  const [loadingProduct, setLoadingProduct] = useState(!initialProduct);

  const [selectedMetal, setSelectedMetal] = useState(
    initialProduct?.variants?.[0]?.material || initialProduct?.material || ""
  );
  const [selectedVariantId, setSelectedVariantId] = useState(
    initialProduct?.variants?.[0]?.id || ""
  );
  const [size, setSize] = useState("");
  const [engraving, setEngraving] = useState("");
  const [giftNote, setGiftNote] = useState("");
  const [bagLoading, setBagLoading] = useState(false);
  const [wishlistActive, setWishlistActive] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [activeAccordion, setActiveAccordion] = useState<string | null>("details");

  useEffect(() => {
    if (initialProduct) {
      setProduct(initialProduct);
      setLoadingProduct(false);
      return;
    }

    const pathParts = window.location.pathname.split("/");
    const idFromPath = pathParts[pathParts.length - 1];
    if (idFromPath) {
      setLoadingProduct(true);
      fetchProduct(idFromPath)
        .then((data) => {
          if (data) setProduct(data);
        })
        .catch((err) => console.error("Client fetchProduct failed:", err))
        .finally(() => setLoadingProduct(false));
    }
  }, [initialProduct]);

  const variants = useMemo(() => Array.isArray(product?.variants)
    ? product.variants.filter((variant: any) => variant?.material && variant.isAvailable !== false)
    : [], [product]);
  const selectedVariant = variants.find((variant: any) => variant.id === selectedVariantId) || variants[0];
  
  const variantPriceNum = Number(selectedVariant?.price);
  const productPriceNum = Number(product?.price);
  const activePrice = variantPriceNum > 0 ? variantPriceNum : (productPriceNum > 0 ? productPriceNum : 0);

  const variantOrigPriceNum = Number(selectedVariant?.originalPrice);
  const productOrigPriceNum = Number(product?.originalPrice);
  const activeOriginalPrice = variantOrigPriceNum > 0 ? variantOrigPriceNum : (productOrigPriceNum > 0 ? productOrigPriceNum : undefined);

  const activeStock = selectedVariant?.stock !== undefined && selectedVariant?.stock !== null ? Number(selectedVariant.stock) : (product?.stock ?? 999);

  useEffect(() => {
    try {
      const key = getWishlistKey(user?.email);
      const saved = localStorage.getItem(key) || localStorage.getItem("vrix-wishlist");
      if (saved && product?.id) {
        const list = JSON.parse(saved);
        setWishlistActive(list.includes(product.id));
      }
    } catch { }
  }, [product, user?.email]);

  const galleryImages = useMemo(() => {
    if (!product) return [];
    const urls = [selectedVariant?.image || product.image, ...(Array.isArray(selectedVariant?.images) ? selectedVariant.images : []), ...(Array.isArray(product.images) ? product.images : [])]
      .filter((url): url is string => typeof url === "string")
      .filter(Boolean)
      .filter((url, index, arr) => arr.indexOf(url) === index);

    return urls.map((src, index) => ({
      src,
      alt: index === 0 ? `Main view of ${product.title}` : `Gallery view ${index + 1} of ${product.title}`,
    }));
  }, [product, selectedVariant]);

  const priceRef = useRef<HTMLParagraphElement>(null);
  const imageGridRef = useRef<HTMLDivElement>(null);

  // Apply variant switch animations (GSAP)
  useVariantAnimations(imageGridRef, priceRef, selectedVariant);

  // Helper: check if a product has any in-stock variant or base stock > 0
  const isInStock = (p: any) => {
    if (Array.isArray(p.variants) && p.variants.length > 0) {
      return p.variants.some((v: any) => Number(v.stock ?? 999) > 0);
    }
    return Number(p.stock ?? 999) > 0;
  };

  // Row 1 — Same category
  const sameCategoryProducts = useMemo(() => {
    if (!product || allProducts.length <= 1) return [];
    return allProducts
      .filter((p) => {
        if (String(p.id) === String(product.id)) return false;
        if (!isInStock(p)) return false;
        return p.type && product.type && p.type.toLowerCase() === product.type.toLowerCase();
      })
      .slice(0, 4);
  }, [allProducts, product]);

  // Row 2 — Same collection
  const sameCollectionProducts = useMemo(() => {
    if (!product || allProducts.length <= 1) return [];
    return allProducts
      .filter((p) => {
        if (String(p.id) === String(product.id)) return false;
        if (!isInStock(p)) return false;
        return p.collection && product.collection && p.collection.toLowerCase() === product.collection.toLowerCase();
      })
      .slice(0, 4);
  }, [allProducts, product]);

  // Row 3 — Random picks (exclude current + already shown above)
  const randomProducts = useMemo(() => {
    if (!product || allProducts.length <= 1) return [];
    const shownIds = new Set([
      String(product.id),
      ...sameCategoryProducts.map((p) => String(p.id)),
      ...sameCollectionProducts.map((p) => String(p.id)),
    ]);
    const pool = allProducts.filter((p) => !shownIds.has(String(p.id)) && isInStock(p));
    // Deterministic shuffle via id hash so SSR and client match
    const shuffled = [...pool].sort((a, b) =>
      String(a.id).charCodeAt(0) - String(b.id).charCodeAt(0)
    );
    return shuffled.slice(0, 4);
  }, [allProducts, product, sameCategoryProducts, sameCollectionProducts]);

  const [wishlistedIds, setWishlistedIds] = useState<Set<string>>(new Set());
  useEffect(() => {
    try {
      const key = getWishlistKey(user?.email);
      const saved = localStorage.getItem(key) || localStorage.getItem("vrix-wishlist");
      setWishlistedIds(new Set(saved ? JSON.parse(saved) : []));
    } catch {}
  }, [user?.email]);

  const handleSuggestionWishlist = (id: string, title: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isLoggedIn) { showToast("Please sign in to save items."); return; }
    try {
      const key = getWishlistKey(user?.email);
      const saved = localStorage.getItem(key) || localStorage.getItem("vrix-wishlist");
      let list: string[] = saved ? JSON.parse(saved) : [];
      const isWl = list.includes(id);
      list = isWl ? list.filter((x) => x !== id) : [...list, id];
      localStorage.setItem(key, JSON.stringify(list));
      localStorage.setItem("vrix-wishlist", JSON.stringify(list));
      setWishlistedIds(new Set(list));
      showToast(isWl ? `Removed "${title}" from Wishlist.` : `Added "${title}" to Wishlist.`);
    } catch {}
  };

  const handleSuggestionQuickAdd = (p: any, v?: any) => {
    const stock = Number(v?.stock ?? p?.stock ?? 999);
    if (stock <= 0) { showToast("This piece is currently out of stock."); return; }
    if (!isLoggedIn) { showToast("Please sign in to add items to your bag."); return; }
    addItem({
      id: p.id,
      title: p.title,
      subtitle: p.subtitle || p.type,
      price: Number(v?.price ?? p?.price ?? 0),
      image: v?.image || p?.image || "",
      material: v?.material || p?.material || "18K Gold Vermeil",
      size: "Standard",
      stock,
    });
    showToast(`"${p.title}" added to your bag.`);
  };

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
    if (Number(activeStock) <= 0) {
      showToast("This piece is currently out of stock. Add it to your wishlist to be notified when it returns.");
      return;
    }
    if (!isLoggedIn) {
      showToast("Please sign in to add items to your bag.");
      setTimeout(() => router.push("/account"), 1000);
      return;
    }

    const hasSizes = Array.isArray(product.availableSizes) && product.availableSizes.length > 0;
    const finalSize = hasSizes ? (size || product.availableSizes[0]) : "Standard";

    setBagLoading(true);
    setTimeout(() => {
      const basePrice = (product.isVrixPlusExclusive && product.vrixPlusPrice) ? product.vrixPlusPrice : activePrice;

      let customizationPrice = 0;
      if (engraving && product.engravingOptions?.enabled) customizationPrice += (product.engravingOptions.price || 0);
      if (giftNote && product.giftNoteOptions?.enabled) customizationPrice += (product.giftNoteOptions.price || 0);

      addItem({
        id: product.id,
        title: product.title,
        subtitle: product.subtitle || product.type,
        price: basePrice + customizationPrice,
        image: selectedVariant?.image || product.image,
        material: selectedVariant?.material || selectedMetal || product.material || "18K Gold Vermeil",
        size: finalSize,
        engraving,
        giftNote,
        stock: Number(activeStock),
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
      if (user?.email) setWishlistStockAlert(user.email, product.id, nextActive).catch((error) => console.error("Wishlist stock alert update failed:", error));
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

  if (loadingProduct && !product) {
    return (
      <div className="max-w-container-max mx-auto px-4 md:px-8 py-12 grid grid-cols-1 md:grid-cols-12 gap-8">
        <div className="md:col-span-7 aspect-square bg-slate-grey/10 animate-pulse rounded" />
        <div className="md:col-span-5 space-y-4">
          <div className="h-8 bg-slate-grey/10 animate-pulse w-3/4 rounded" />
          <div className="h-6 bg-slate-grey/10 animate-pulse w-1/4 rounded" />
          <div className="h-24 bg-slate-grey/10 animate-pulse w-full rounded" />
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center gap-6 px-4">
        <span className="material-symbols-outlined icon-weight-light text-slate-grey text-5xl">inventory_2</span>
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

      {/* Visible Breadcrumb Trail for on-page SEO */}
      <div className="max-w-container-max mx-auto px-4 md:px-8 pt-4">
        <nav className="flex items-center gap-2 text-[10px] font-label-caps text-slate-grey uppercase tracking-wider">
          <Link href="/" className="hover:text-ink-black transition-colors">Home</Link>
          <span className="material-symbols-outlined text-[10px]">chevron_right</span>
          <Link href="/collections" className="hover:text-ink-black transition-colors">Jewelry</Link>
          {product.collection && (
            <>
              <span className="material-symbols-outlined text-[10px]">chevron_right</span>
              <Link href={`/collections/${product.collection.toLowerCase()}`} className="hover:text-ink-black transition-colors">{product.collection}</Link>
            </>
          )}
          <span className="material-symbols-outlined text-[10px]">chevron_right</span>
          <span className="text-ink-black font-semibold">{product.title}</span>
        </nav>
      </div>

      <main className="max-w-container-max mx-auto px-4 md:px-8 pt-6 md:pt-10 pb-6 md:pb-10">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 md:gap-12">
          <div ref={imageGridRef} className="md:col-span-7 relative">
            <ProductImageGrid2x2
              images={galleryImages}
              title={product.title}
              layoutStyle={product.layoutStyle || "2x2"}
            />
          </div>

          <div className="md:col-span-5 relative mt-2 md:mt-0">
            <div className="sticky top-[90px] flex flex-col gap-3">
              <div className="flex flex-col gap-1.5 border-b border-slate-grey/20 pb-0.5">
                <h1 className="font-display-lg-mobile md:font-display-lg text-ink-black tracking-tight leading-tight uppercase">
                  {product.title}
                </h1>
                <p className="font-body-md text-slate-grey text-xs uppercase tracking-widest font-label-caps flex items-center gap-2 flex-wrap">
                  <span>{product.subtitle || product.type || "Fine Jewelry"}</span>
                  {product.isVrixPlusExclusive && (
                    <span className="bg-amber-100 text-amber-900 border border-amber-300 font-label-caps text-[9px] uppercase tracking-widest px-2 py-0.5 font-bold flex items-center gap-1">
                      <span className="material-symbols-outlined text-[12px]">stars</span>
                      VRIX+ Exclusive
                    </span>
                  )}
                </p>

                <div ref={priceRef} className="flex items-baseline gap-2.5 mt-1.5 flex-wrap">
                  {product.isVrixPlusExclusive && product.vrixPlusPrice ? (
                    <>
                      <span className="font-headline-md text-deep-navy text-2xl font-semibold">{formatPrice(product.vrixPlusPrice)}</span>
                      <span className="font-label-caps text-[10px] text-amber-700 uppercase font-bold tracking-wider">Member Price</span>
                      <span className="font-body-md text-slate-grey/60 line-through text-sm">{formatPrice(activePrice)}</span>
                    </>
                  ) : activeOriginalPrice && activeOriginalPrice > activePrice ? (
                    <>
                      <span className="font-headline-md text-ink-black text-2xl font-semibold">{getDisplayPrice(activePrice, formatPrice, product.price)}</span>
                      <span className="font-body-md text-slate-grey/60 line-through text-base">{formatPrice(activeOriginalPrice)}</span>
                      <span className="bg-emerald-700 text-white font-label-caps text-[10px] px-2 py-0.5 font-bold uppercase tracking-wider">
                        {Math.round(((activeOriginalPrice - activePrice) / activeOriginalPrice) * 100)}% OFF
                      </span>
                    </>
                  ) : (
                    <p className="font-headline-md text-ink-black text-2xl font-semibold">{getDisplayPrice(activePrice, formatPrice, product.price)}</p>
                  )}
                </div>
                <p className={`font-label-caps text-[10px] uppercase tracking-widest mt-1 ${Number(activeStock) <= 0 ? "text-red-700" : Number(activeStock) <= 3 ? "text-amber-700" : "text-emerald-700"}`}>
                  {Number(activeStock) <= 0 ? "Out of stock" : Number(activeStock) <= 3 ? `Only ${activeStock} left in stock` : "In stock — ready to ship"}
                </p>

                {product.description && product.description.trim() ? (
                  <p className="font-body-md text-on-surface-variant mt-1.5 leading-relaxed text-sm">
                    {product.description}
                  </p>
                ) : null}
              </div>

              {variants.length > 0 && (
                <div className="flex flex-col gap-2">
                  <span className="font-label-caps uppercase text-ink-black tracking-widest text-[10px]">
                    MATERIAL: <span className="text-deep-navy font-semibold">{selectedVariant?.label || selectedVariant?.material}</span>
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {variants.map((variant: any) => {
                      const isSelected = selectedVariant?.id === variant.id;
                      const matName = (variant.material || "").toLowerCase();
                      let circleColor = "#B59D7C";
                      if (matName.includes("rose")) circleColor = "#E5A995";
                      else if (matName.includes("yellow") || matName.includes("gold")) circleColor = "#E5C158";
                      else if (matName.includes("white")) circleColor = "#E2E8F0";
                      else if (matName.includes("platinum")) circleColor = "#CBD5E1";
                      else if (matName.includes("silver")) circleColor = "#D8D8D8";
                      else if (matName.includes("diamond")) circleColor = "#38BDF8";

                      return (
                        <button
                          key={variant.id}
                          type="button"
                          onClick={() => {
                            setSelectedVariantId(variant.id);
                            setSelectedMetal(variant.material);
                          }}
                          className={`border px-3.5 py-2 text-xs font-label-caps uppercase tracking-wider transition-colors cursor-pointer flex items-center gap-2 ${
                            isSelected
                              ? "border-deep-navy bg-deep-navy text-pure-white"
                              : "border-slate-grey/30 text-ink-black hover:border-deep-navy"
                          }`}
                        >
                          <span
                            className="w-4 h-4 rounded-full border border-black/20 shrink-0 block"
                            style={{ backgroundColor: circleColor }}
                          />
                          <span>{variant.label || variant.material}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {((product.availableMetals && product.availableMetals.length > 0) || (product.metals && product.metals.length > 0)) && (
                <MetalSwatches
                  selectedMetal={selectedMetal}
                  onSelectMetal={(metal) => setSelectedMetal(metal.name)}
                />
              )}

              {Boolean((product.availableSizes && product.availableSizes.length > 0) || product.engravingOptions?.enabled || product.giftNoteOptions?.enabled) && (
                <div className="flex flex-col gap-4">
                  {product.availableSizes && product.availableSizes.length > 0 && (
                    <div className="flex flex-col gap-2">
                      <div className="flex justify-between items-center">
                        <label className="font-label-caps uppercase text-ink-black tracking-widest text-[10px]">
                          Size: {size || "Select size"}
                        </label>
                        <button className="font-label-caps uppercase text-slate-grey hover:text-ink-black underline decoration-1 underline-offset-4 text-[10px] transition-colors cursor-pointer">
                          Size Guide
                        </button>
                      </div>
                      <RadioGroup
                        value={size}
                        onValueChange={setSize}
                        className="flex flex-wrap gap-2"
                      >
                        {product.availableSizes.map((sz: string) => (
                          <Radio.Root
                            key={sz}
                            value={sz}
                            className={`w-10 h-10 border text-xs font-semibold flex items-center justify-center cursor-pointer transition-colors focus:outline-none ${
                              size === sz
                                ? "border-deep-navy bg-deep-navy text-pure-white"
                                : "border-slate-grey/30 text-ink-black hover:border-deep-navy"
                            }`}
                          >
                            {sz}
                          </Radio.Root>
                        ))}
                      </RadioGroup>
                    </div>
                  )}

                  {product.engravingOptions?.enabled && (
                    <div className="flex flex-col gap-1.5 mt-1.5">
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

                  {product.giftNoteOptions?.enabled && (
                    <div className="flex flex-col gap-1.5 mt-1.5">
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
              )}

              <div className="flex flex-row gap-2 mt-0.5 w-full">
                {Number(activeStock) <= 0 ? (
                  <div className="flex flex-col gap-2 w-full">
                    <p className="w-full text-center font-label-caps text-[10px] text-slate-grey uppercase tracking-widest py-2 border border-slate-grey/20 bg-[#F9F9F9]">
                      Out of stock
                    </p>
                    <button
                      onClick={handleAddToWishlist}
                      className="w-full bg-deep-navy text-pure-white py-3 font-button uppercase tracking-widest hover:bg-ink-black transition-colors cursor-pointer flex items-center justify-center gap-1.5 text-xs sm:text-sm"
                    >
                      <span className="material-symbols-outlined text-[18px]">notifications</span>
                      <span>Notify Me When Available</span>
                    </button>
                  </div>
                ) : (
                  <>
                    <button
                      onClick={handleAddToBag}
                      disabled={bagLoading}
                      className="flex-1 bg-deep-navy text-pure-white py-3 font-button uppercase tracking-widest hover:bg-ink-black transition-colors cursor-pointer disabled:opacity-60 flex items-center justify-center gap-2 text-xs sm:text-sm"
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
                      className="flex-grow flex-1 border border-slate-grey/30 py-3 font-button uppercase tracking-widest hover:border-ink-black transition-all cursor-pointer flex items-center justify-center gap-1.5 text-xs sm:text-sm text-ink-black bg-transparent"
                    >
                      <span className={`material-symbols-outlined text-[18px] shrink-0 ${wishlistActive ? "text-red-600 fill-red-600" : ""}`}>
                        {wishlistActive ? "favorite" : "favorite_border"}
                      </span>
                      <span className="truncate">
                        {wishlistActive ? "In Wishlist" : "Wishlist"}
                      </span>
                    </button>
                  </>
                )}
              </div>

              <div className="flex flex-col border-t border-slate-grey/20 mt-0.5">
                <div className="border-b border-slate-grey/20">
                  <button
                    onClick={() => toggleAccordion("details")}
                    className="flex justify-between items-center w-full font-label-caps uppercase text-ink-black py-4 cursor-pointer text-left focus:outline-none"
                  >
                    <span>Product Details</span>
                    <span className={`material-symbols-outlined transition-transform duration-300 ${activeAccordion === "details" ? "rotate-180" : ""}`}>
                      expand_more
                    </span>
                  </button>
                  <div className={`overflow-hidden transition-all duration-300 ${activeAccordion === "details" ? "max-h-96 pb-4 opacity-100" : "max-h-0 opacity-0"}`}>
                    <div className="font-body-md text-on-surface-variant text-sm leading-relaxed space-y-1.5">
                      {(selectedVariant?.description || product.description) && (
                        <p>{selectedVariant?.description || product.description}</p>
                      )}
                      {(selectedVariant?.sku || product.sku) && (
                        <p className="text-[11px] text-slate-grey">
                          <span className="font-semibold uppercase tracking-wider">SKU:</span> {selectedVariant?.sku || product.sku}
                        </p>
                      )}
                      {(selectedVariant?.weight || product.weight) && (
                        <p className="text-[11px] text-slate-grey">
                          <span className="font-semibold uppercase tracking-wider font-label-caps">Material Weight:</span> {selectedVariant?.weight || product.weight}
                        </p>
                      )}
                      {(selectedVariant?.dimensions || product.dimensions) && (
                        <p className="text-[11px] text-slate-grey">
                          <span className="font-semibold uppercase tracking-wider font-label-caps">Dimensions:</span> {selectedVariant?.dimensions || product.dimensions}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {product.comparisonOptions && Object.keys(product.comparisonOptions).length > 0 && (
                  <div className="border-b border-slate-grey/20">
                    <button
                      onClick={() => toggleAccordion("comparison")}
                      className="flex justify-between items-center w-full font-label-caps uppercase text-ink-black py-4 cursor-pointer text-left focus:outline-none"
                    >
                      <span>Worth &amp; Comparison Metrics</span>
                      <span className={`material-symbols-outlined transition-transform duration-300 ${activeAccordion === "comparison" ? "rotate-180" : ""}`}>
                        expand_more
                      </span>
                    </button>
                    <div className={`overflow-hidden transition-all duration-300 ${activeAccordion === "comparison" ? "max-h-96 pb-4 opacity-100" : "max-h-0 opacity-0"}`}>
                      <div className="space-y-3 text-xs font-body-md text-ink-black">
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
                          {(product.comparisonOptions.styleRating != null || product.comparisonOptions.styleMatching != null) && (
                            <div className="p-3 bg-soft-linen/25 border border-slate-grey/10 rounded flex flex-col justify-between">
                              <span className="text-[9px] font-label-caps uppercase tracking-widest text-slate-grey">Style Matching</span>
                              <div className="flex items-baseline gap-1.5 mt-1">
                                <span className="text-xl font-bold text-deep-navy">{product.comparisonOptions.styleMatching ?? product.comparisonOptions.styleRating}</span>
                                <span className="text-[10px] text-slate-grey">/ 10 Versatility</span>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {product.giftOptions && (product.giftOptions.packagingNote || product.giftOptions.showCustomBox) && (
                  <div className="border-b border-slate-grey/20">
                    <button
                      onClick={() => toggleAccordion("packaging")}
                      className="flex justify-between items-center w-full font-label-caps uppercase text-ink-black py-4 cursor-pointer text-left focus:outline-none"
                    >
                      <span>Signature Gift Packaging</span>
                      <span className={`material-symbols-outlined transition-transform duration-300 ${activeAccordion === "packaging" ? "rotate-180" : ""}`}>
                        expand_more
                      </span>
                    </button>
                    <div className={`overflow-hidden transition-all duration-300 ${activeAccordion === "packaging" ? "max-h-96 pb-4 opacity-100" : "max-h-0 opacity-0"}`}>
                      <div className="space-y-3 text-xs font-body-md text-ink-black leading-relaxed">
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

                <div className="border-b border-slate-grey/20">
                  <button
                    onClick={() => toggleAccordion("returns")}
                    className="flex justify-between items-center w-full font-label-caps uppercase text-ink-black py-4 cursor-pointer text-left focus:outline-none"
                  >
                    <span>Delivery &amp; Returns</span>
                    <span className={`material-symbols-outlined transition-transform duration-300 ${activeAccordion === "returns" ? "rotate-180" : ""}`}>
                      expand_more
                    </span>
                  </button>
                  <div className={`overflow-hidden transition-all duration-300 ${activeAccordion === "returns" ? "max-h-56 pb-4 opacity-100" : "max-h-0 opacity-0"}`}>
                    <p className="font-body-md text-on-surface-variant text-sm leading-relaxed">
                      {product.deliveryPolicy || "We accept returns within 30 days of receipt in original, unworn condition. Engraved items are final sale."}
                    </p>
                  </div>
                </div>

                <div className="border-b border-slate-grey/20">
                  <button
                    onClick={() => toggleAccordion("care")}
                    className="flex justify-between items-center w-full font-label-caps uppercase text-ink-black py-4 cursor-pointer text-left focus:outline-none"
                  >
                    <span>Care Guide</span>
                    <span className={`material-symbols-outlined transition-transform duration-300 ${activeAccordion === "care" ? "rotate-180" : ""}`}>
                      expand_more
                    </span>
                  </button>
                  <div className={`overflow-hidden transition-all duration-300 ${activeAccordion === "care" ? "max-h-56 pb-4 opacity-100" : "max-h-0 opacity-0"}`}>
                    <p className="font-body-md text-on-surface-variant text-sm leading-relaxed">
                      {product.careGuide || "Avoid contact with harsh chemicals, perfumes, and lotions. Store in the provided VRIX pouch when not in use. Clean gently with a soft polishing cloth."}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Suggestion Rows ────────────────────────────────────── */}
        <div className="mt-8 space-y-12 border-t border-slate-grey/20 pt-8">

          {/* Row 1: Same Category */}
          {sameCategoryProducts.length > 0 && (
            <section>
              <div className="flex flex-col md:flex-row md:items-end justify-between mb-5 gap-3">
                <div>
                  <span className="font-label-caps text-xs text-slate-grey uppercase tracking-widest block mb-1">More in {product.type}</span>
                  <h3 className="font-display-lg text-xl text-deep-navy uppercase tracking-wider">Same Style</h3>
                </div>
                <Link href={`/products?type=${encodeURIComponent(product.type || "")}`} className="font-label-caps text-xs text-ink-black uppercase tracking-widest underline underline-offset-4 hover:text-slate-grey">
                  View All →
                </Link>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
                {sameCategoryProducts.map((p) => (
                  <ProductCard
                    key={p.id}
                    product={p}
                    formatPrice={formatPrice}
                    onWishlistToggle={handleSuggestionWishlist}
                    isWishlisted={wishlistedIds.has(p.id)}
                    onQuickAdd={handleSuggestionQuickAdd}
                    showQuickAdd
                  />
                ))}
              </div>
            </section>
          )}

          {/* Row 2: Same Collection */}
          {sameCollectionProducts.length > 0 && (
            <section>
              <div className="flex flex-col md:flex-row md:items-end justify-between mb-5 gap-3">
                <div>
                  <span className="font-label-caps text-xs text-slate-grey uppercase tracking-widest block mb-1">From the {product.collection} collection</span>
                  <h3 className="font-display-lg text-xl text-deep-navy uppercase tracking-wider">Same Collection</h3>
                </div>
                <Link href={`/collections/${(product.collection || "").toLowerCase().replace(/\s+/g, "-")}`} className="font-label-caps text-xs text-ink-black uppercase tracking-widest underline underline-offset-4 hover:text-slate-grey">
                  View Collection →
                </Link>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
                {sameCollectionProducts.map((p) => (
                  <ProductCard
                    key={p.id}
                    product={p}
                    formatPrice={formatPrice}
                    onWishlistToggle={handleSuggestionWishlist}
                    isWishlisted={wishlistedIds.has(p.id)}
                    onQuickAdd={handleSuggestionQuickAdd}
                    showQuickAdd
                  />
                ))}
              </div>
            </section>
          )}

          {/* Row 3: Random Picks */}
          {randomProducts.length > 0 && (
            <section>
              <div className="flex flex-col md:flex-row md:items-end justify-between mb-5 gap-3">
                <div>
                  <span className="font-label-caps text-xs text-slate-grey uppercase tracking-widest block mb-1">Curated Pairings</span>
                  <h3 className="font-display-lg text-xl text-deep-navy uppercase tracking-wider">You May Also Like</h3>
                </div>
                <Link href="/collections" className="font-label-caps text-xs text-ink-black uppercase tracking-widest underline underline-offset-4 hover:text-slate-grey">
                  View All Jewelry →
                </Link>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
                {randomProducts.map((p) => (
                  <ProductCard
                    key={p.id}
                    product={p}
                    formatPrice={formatPrice}
                    onWishlistToggle={handleSuggestionWishlist}
                    isWishlisted={wishlistedIds.has(p.id)}
                    onQuickAdd={handleSuggestionQuickAdd}
                    showQuickAdd
                  />
                ))}
              </div>
            </section>
          )}
        </div>
      </main>
    </div>
  );
}
