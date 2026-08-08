"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { fetchProducts, getWishlistKey } from "@/utils/api";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { useCurrency } from "@/context/CurrencyContext";

interface Product {
  id: string;
  title: string;
  price: number;
  image: string;
  material: string;
  category?: string;
  type?: string;
}

export default function WishlistPage() {
  const { addItem } = useCart();
  const { user } = useAuth();
  const { formatPrice } = useCurrency();
  const [wishlist, setWishlist] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    async function loadWishlist() {
      try {
        const key = getWishlistKey(user?.email);
        const saved = localStorage.getItem(key) || localStorage.getItem("vrix-wishlist");
        const ids = saved ? JSON.parse(saved) : [];
        const allProducts = await fetchProducts();
        const filtered = allProducts.filter((p: any) => ids.includes(p.id));
        setWishlist(filtered);
      } catch (err) {
        console.error("Failed to load wishlist:", err);
      } finally {
        setLoading(false);
      }
    }
    loadWishlist();
  }, [user?.email]);

  const handleRemove = (id: string, title: string, e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    try {
      const key = getWishlistKey(user?.email);
      const saved = localStorage.getItem(key) || localStorage.getItem("vrix-wishlist");
      let ids = saved ? JSON.parse(saved) : [];
      ids = ids.filter((item: string) => item !== id);
      localStorage.setItem(key, JSON.stringify(ids));
      localStorage.setItem("vrix-wishlist", JSON.stringify(ids));
      setWishlist(wishlist.filter((item) => item.id !== id));
      showToast(`Removed "${title}" from Wishlist.`);
    } catch (err) {
      console.error(err);
    }
  };

  const handleMoveToBag = (product: Product, e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    try {
      addItem({
        id: product.id,
        title: product.title,
        price: product.price,
        image: product.image,
        material: product.material || "18K Gold Vermeil",
        size: "M",
      });
      // Remove from wishlist
      const key = getWishlistKey(user?.email);
      const saved = localStorage.getItem(key) || localStorage.getItem("vrix-wishlist");
      let ids = saved ? JSON.parse(saved) : [];
      ids = ids.filter((item: string) => item !== product.id);
      localStorage.setItem(key, JSON.stringify(ids));
      localStorage.setItem("vrix-wishlist", JSON.stringify(ids));
      setWishlist(wishlist.filter((item) => item.id !== product.id));
      showToast(`Moved "${product.title}" to Bag.`);
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="w-full min-h-[60vh] flex items-center justify-center text-slate-grey font-label-caps text-xs tracking-widest animate-pulse">
        Loading Wishlist...
      </div>
    );
  }

  return (
    <div className="w-full min-h-[70vh] bg-pure-white relative">
      {toast && (
        <div className="fixed bottom-8 right-8 z-50 bg-deep-navy text-pure-white px-6 py-4 border border-slate-grey/30 shadow-2xl flex items-center gap-3 animate-fade-in">
          <span className="material-symbols-outlined text-sm">info</span>
          <p className="font-body-md text-sm tracking-wide">{toast}</p>
          <button onClick={() => setToast(null)} className="ml-4 hover:text-slate-grey cursor-pointer text-xs">✕</button>
        </div>
      )}

      <main className="flex-grow w-full max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop py-stack-lg md:py-section-gap">
        <header className="flex flex-col items-center text-center max-w-3xl mx-auto space-y-stack-md mb-stack-lg border-b border-slate-grey/20 pb-stack-lg">
          <h1 className="font-display-lg-mobile text-display-lg-mobile md:font-display-lg md:text-display-lg text-deep-navy uppercase tracking-tight">
            Your Saved Wishlist
          </h1>
          <p className="font-body-lg text-body-lg text-secondary">
            Your personal curation of architectural fine jewelry. Pieces reserved for your upcoming moments.
          </p>
          <span className="font-label-caps text-xs text-slate-grey uppercase tracking-widest pt-2">
            {wishlist.length} {wishlist.length === 1 ? "Item" : "Items"} Saved
          </span>
        </header>

        {wishlist.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 gap-6 text-center">
            <span className="material-symbols-outlined text-slate-grey text-6xl" style={{ fontVariationSettings: "'wght' 200" }}>favorite_border</span>
            <div className="space-y-2">
              <h2 className="font-display-lg text-xl text-deep-navy uppercase tracking-widest">Your Wishlist is Empty</h2>
              <p className="font-body-md text-slate-grey text-sm max-w-sm">
                Explore our signature collections and save your favorite architectural pieces here.
              </p>
            </div>
            <Link
              href="/products"
              className="font-button text-button uppercase px-10 py-4 bg-deep-navy text-pure-white hover:bg-ink-black transition-colors tracking-widest"
            >
              Explore Catalogue
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-gutter">
            {wishlist.map((item) => (
              <div
                key={item.id}
                className="group flex flex-col bg-pure-white border border-slate-grey/15 hover:border-slate-grey/40 transition-all duration-300 relative"
              >
                {/* Image Container */}
                <Link href={`/product/${item.id}`} className="relative w-full aspect-[3/4] md:aspect-[4/5] bg-soft-linen overflow-hidden block">
                  <Image
                    alt={item.title}
                    fill
                    src={item.image}
                    className="object-cover object-center mix-blend-multiply opacity-90 group-hover:scale-105 transition-transform duration-700 ease-out"
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                  />
                  {/* Remove Heart Button */}
                  <button
                    type="button"
                    onClick={(e) => handleRemove(item.id, item.title, e)}
                    aria-label="Remove from Wishlist"
                    className="absolute top-2 right-2 md:top-3 md:right-3 p-1.5 rounded-full bg-pure-white/80 backdrop-blur-xs text-red-600 hover:scale-110 transition-transform cursor-pointer shadow-xs z-10"
                  >
                    <span className="material-symbols-outlined text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>
                      favorite
                    </span>
                  </button>
                </Link>

                {/* Content Details */}
                <div className="p-3 md:p-4 flex flex-col flex-grow justify-between space-y-3">
                  <div>
                    <span className="font-label-caps text-[9px] md:text-[10px] text-slate-grey uppercase tracking-widest block truncate">
                      {item.material || item.type || "Fine Jewelry"}
                    </span>
                    <Link href={`/product/${item.id}`} className="block">
                      <h2 className="font-body-md text-xs md:text-body-md text-ink-black font-medium line-clamp-1 hover:text-deep-navy transition-colors mt-0.5">
                        {item.title}
                      </h2>
                    </Link>
                    <p className="font-body-md text-xs md:text-body-md text-deep-navy font-semibold mt-1">
                      {formatPrice(item.price)}
                    </p>
                  </div>

                  <div className="space-y-2 pt-2 border-t border-slate-grey/15">
                    <button
                      type="button"
                      onClick={(e) => handleMoveToBag(item, e)}
                      className="w-full bg-deep-navy text-pure-white font-button text-[10px] md:text-xs py-2.5 uppercase tracking-widest hover:bg-ink-black transition-colors cursor-pointer"
                    >
                      Move to Bag
                    </button>
                    <button
                      type="button"
                      onClick={(e) => handleRemove(item.id, item.title, e)}
                      className="w-full text-center font-label-caps text-[9px] text-slate-grey hover:text-red-600 uppercase tracking-widest transition-colors cursor-pointer"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
