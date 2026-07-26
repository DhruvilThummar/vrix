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
    if (!productId) return DEFAULT_PRODUCT;
    const found = products.find((p) => p.id === productId);
    return found || { ...DEFAULT_PRODUCT, id: productId };
  }, [products, productId]);
 
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
    const urls = [product.image, ...(Array.isArray(product.images) ? product.images : [])]
      .filter((url): url is string => typeof url === "string")
      .filter(Boolean)
      .filter((url, index, arr) => arr.indexOf(url) === index);
 
    return urls.map((src, index) => ({
      src,
      alt: index === 0 ? `Main view of ${product.title}` : `Gallery view ${index + 1} of ${product.title}`,
    }));
  }, [product]);
 
  const toggleAccordion = (name: string) => {
    setActiveAccordion(activeAccordion === name ? null : name);
  };
 
  const handleAddToBag = () => {
    if (!isLoggedIn) {
      showToast("Please sign in to add items to your bag.");
      setTimeout(() => router.push("/account"), 1000);
      return;
    }
    if (!size) {
      showToast("Please select a size first.");
      return;
    }
    setBagLoading(true);
    setTimeout(() => {
      addItem({
        id: product.id,
        title: product.title,
        price: (product.isVrixPlusExclusive && product.vrixPlusPrice) ? product.vrixPlusPrice : product.price,
        image: product.image,
        material: selectedMetal || product.material || "18K Gold Vermeil",
        size,
        engraving,
      });
      setBagLoading(false);
      showToast(`"${product.title}" has been added to your bag.`);
    }, 1000);
  };
 
  const handleAddToWishlist = () => {
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
 
      <main className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop py-8 md:py-section-gap">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-gutter md:gap-[80px]">
          
          {/* Left Column: 2x2 Image Grid (Monica Vinader PC Layout) */}
          <div className="md:col-span-7 relative">
            <ProductImageGrid2x2 images={galleryImages} title={product.title} />
          </div>
 
          {/* Right Column: Sticky Product Information */}
          <div className="md:col-span-5 relative mt-8 md:mt-0">
            <div className="sticky top-[100px] flex flex-col gap-stack-lg">
              
              {/* Header Info */}
              <div className="flex flex-col gap-2 border-b border-slate-grey/20 pb-6">
                <h1 className="font-display-lg-mobile md:font-display-lg text-ink-black tracking-tight leading-tight uppercase">
                  {product.title}
                </h1>
                <p className="font-body-md text-slate-grey text-xs uppercase tracking-widest font-label-caps flex items-center gap-2">
                  From the VRIX Collections
                  {product.isVrixPlusExclusive && (
                    <span className="bg-amber-100 text-amber-900 border border-amber-300 font-label-caps text-[9px] uppercase tracking-widest px-2 py-0.5 font-bold flex items-center gap-1">
                      <span className="material-symbols-outlined text-[12px]">stars</span>
                      VRIX+ Exclusive
                    </span>
                  )}
                </p>

                <div className="flex items-baseline gap-3 mt-2">
                  {product.isVrixPlusExclusive && product.vrixPlusPrice ? (
                    <>
                      <span className="font-headline-md text-deep-navy text-2xl font-semibold">${product.vrixPlusPrice}</span>
                      <span className="font-label-caps text-[10px] text-amber-700 uppercase font-bold tracking-wider">Member Price</span>
                      <span className="font-body-md text-slate-grey/60 line-through text-sm">${product.price}</span>
                    </>
                  ) : (
                    <p className="font-headline-md text-ink-black text-2xl font-semibold">${product.price}</p>
                  )}
                </div>

                <p className="font-body-md text-on-surface-variant mt-2 leading-relaxed text-sm">
                  {product.description || "A symbol of inner balance. Designed to remind you that you are your own center. Minimalist architecture translated into an intimate everyday companion."}
                </p>
              </div>

              {/* Metal / Material Finish Swatches */}
              <MetalSwatches
                selectedMetal={selectedMetal}
                onSelectMetal={(metal) => setSelectedMetal(metal.name)}
              />
 
              {/* Configuration Form */}
              <div className="flex flex-col gap-6">
                
                {/* Size Selection */}
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
                      <option value="" disabled>Select size</option>
                      <option value="48">EU 48</option>
                      <option value="50">EU 50</option>
                      <option value="52">EU 52</option>
                      <option value="54">EU 54</option>
                    </select>
                    <span className="material-symbols-outlined absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none text-slate-grey">
                      expand_more
                    </span>
                  </div>
                </div>
 
                {/* Engraving (Optional) */}
                <div className="flex flex-col gap-2 mt-2">
                  <div className="flex justify-between items-center">
                    <label className="font-label-caps uppercase text-ink-black tracking-widest text-[10px]" htmlFor="engraving">
                      Engraving (Optional)
                    </label>
                    <span className="font-label-caps text-slate-grey text-[10px]">{engraving.length}/25</span>
                  </div>
                  <input
                    className="w-full bg-transparent border-0 border-b border-slate-grey/30 py-3 px-0 font-body-md text-ink-black placeholder:text-slate-grey/50 rounded-none transition-colors hover:border-slate-grey focus:ring-0"
                    id="engraving"
                    placeholder="Add a personal message"
                    type="text"
                    maxLength={25}
                    value={engraving}
                    onChange={(e) => setEngraving(e.target.value)}
                  />
                </div>
 
                {/* Gift Note (Optional) */}
                <div className="flex flex-col gap-2 mt-2">
                  <div className="flex justify-between items-center">
                    <label className="font-label-caps uppercase text-ink-black tracking-widest text-[10px]" htmlFor="gift-note">
                      Gift Note (Optional)
                    </label>
                    <span className="font-label-caps text-slate-grey text-[10px]">{giftNote.length}/120</span>
                  </div>
                  <input
                    className="w-full bg-transparent border-0 border-b border-slate-grey/30 py-3 px-0 font-body-md text-ink-black placeholder:text-slate-grey/50 rounded-none transition-colors hover:border-slate-grey focus:ring-0"
                    id="gift-note"
                    placeholder="Write your message"
                    type="text"
                    maxLength={120}
                    value={giftNote}
                    onChange={(e) => setGiftNote(e.target.value)}
                  />
                </div>
              </div>
 
              {/* Actions */}
              <div className="flex flex-col gap-4 mt-4">
                <button
                  onClick={handleAddToBag}
                  disabled={bagLoading}
                  className="w-full bg-deep-navy text-pure-white py-4 font-button uppercase tracking-widest hover:bg-ink-black transition-colors duration-300 cursor-pointer flex justify-center items-center gap-2"
                >
                  {bagLoading ? (
                    <div className="w-5 h-5 border-2 border-pure-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    "Add to Bag"
                  )}
                </button>
                <button
                  onClick={handleAddToWishlist}
                  className={`w-full bg-transparent border py-4 font-button uppercase tracking-widest flex justify-center items-center gap-2 transition-colors duration-300 cursor-pointer ${
                    wishlistActive
                      ? "border-deep-navy text-deep-navy bg-soft-linen/20"
                      : "border-slate-grey/30 text-ink-black hover:border-ink-black"
                  }`}
                >
                  <span
                    className="material-symbols-outlined text-[18px]"
                    style={{ fontVariationSettings: `'FILL' ${wishlistActive ? 1 : 0}, 'wght' 300` }}
                  >
                    favorite
                  </span>
                  {wishlistActive ? "Wishlisted" : "Add to Wishlist"}
                </button>
              </div>
 
              {/* Trust Badges */}
              <div className="grid grid-cols-2 gap-y-6 gap-x-4 mt-8 py-8 border-y border-slate-grey/20">
                <div className="flex gap-3 items-start">
                  <span className="material-symbols-outlined text-slate-grey">local_shipping</span>
                  <div className="flex flex-col gap-1">
                    <span className="font-label-caps text-ink-black text-[10px]">Free Shipping</span>
                    <span className="text-[12px] text-slate-grey font-body-md leading-tight">For all orders over $150</span>
                  </div>
                </div>
                <div className="flex gap-3 items-start">
                  <span className="material-symbols-outlined text-slate-grey">sync</span>
                  <div className="flex flex-col gap-1">
                    <span className="font-label-caps text-ink-black text-[10px]">Easy Returns</span>
                    <span className="text-[12px] text-slate-grey font-body-md leading-tight">30 days return</span>
                  </div>
                </div>
                <div className="flex gap-3 items-start">
                  <span className="material-symbols-outlined text-slate-grey">verified_user</span>
                  <div className="flex flex-col gap-1">
                    <span className="font-label-caps text-ink-black text-[10px]">2 Year Warranty</span>
                    <span className="text-[12px] text-slate-grey font-body-md leading-tight">Quality you can trust</span>
                  </div>
                </div>
                <div className="flex gap-3 items-start">
                  <span className="material-symbols-outlined text-slate-grey">card_giftcard</span>
                  <div className="flex flex-col gap-1">
                    <span className="font-label-caps text-ink-black text-[10px]">Gift Packaging</span>
                    <span className="text-[12px] text-slate-grey font-body-md leading-tight">Always included</span>
                  </div>
                </div>
              </div>
 
              {/* Accordions */}
              <div className="flex flex-col mt-2">
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
                      activeAccordion === "details" ? "max-h-40 pb-5 opacity-100" : "max-h-0 opacity-0"
                    }`}
                  >
                    <p className="font-body-md text-on-surface-variant text-sm leading-relaxed">
                      Handcrafted with care. VRIX products are made from ethically sourced metals and premium gemstones. Meticulous design lines serving as a structural extension of your personality.
                    </p>
                  </div>
                </div>
 
                {/* Shipping Accordion */}
                <div className="border-b border-slate-grey/20">
                  <button
                    onClick={() => toggleAccordion("shipping")}
                    className="flex justify-between items-center w-full font-label-caps uppercase text-ink-black py-5 cursor-pointer text-left focus:outline-none"
                  >
                    <span>Shipping & Delivery</span>
                    <span
                      className={`material-symbols-outlined transition-transform duration-300 ${
                        activeAccordion === "shipping" ? "rotate-180" : ""
                      }`}
                    >
                      expand_more
                    </span>
                  </button>
                  <div
                    className={`overflow-hidden transition-all duration-300 ${
                      activeAccordion === "shipping" ? "max-h-40 pb-5 opacity-100" : "max-h-0 opacity-0"
                    }`}
                  >
                    <p className="font-body-md text-on-surface-variant text-sm leading-relaxed">
                      Orders are processed within 1-2 business days. Complimentary standard shipping on all orders over $150.
                    </p>
                  </div>
                </div>
 
                {/* Returns Accordion */}
                <div className="border-b border-slate-grey/20">
                  <button
                    onClick={() => toggleAccordion("returns")}
                    className="flex justify-between items-center w-full font-label-caps uppercase text-ink-black py-5 cursor-pointer text-left focus:outline-none"
                  >
                    <span>Returns & Exchanges</span>
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
