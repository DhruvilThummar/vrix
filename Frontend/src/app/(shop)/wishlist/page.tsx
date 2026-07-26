"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { fetchProducts, getWishlistKey } from "@/utils/api";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";

interface Product {
  id: string;
  title: string;
  price: number;
  image: string;
  material: string;
}

export default function WishlistPage() {
  const { addItem } = useCart();
  const { user } = useAuth();
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

  const handleRemove = (id: string, title: string) => {
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

  const handleMoveToBag = (product: Product) => {
    try {
      // Add to bag with default size 52
      addItem({
        id: product.id,
        title: product.title,
        price: product.price,
        image: product.image,
        material: product.material || "18K Gold Vermeil",
        size: "52"
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
        </div>
      )}

      <main className="flex-grow w-full max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop py-stack-lg md:py-section-gap">
        <header className="flex flex-col md:flex-row md:items-end justify-between border-b border-slate-grey/30 pb-stack-lg mb-stack-lg">
          <div>
            <h1 className="font-display-lg text-display-lg-mobile md:text-display-lg text-ink-black tracking-tight uppercase">Your Wishlist</h1>
          </div>
          <div className="mt-4 md:mt-0">
            <span className="font-label-caps text-label-caps text-slate-grey uppercase tracking-widest">
              {wishlist.length} {wishlist.length === 1 ? "Item" : "Items"} Saved
            </span>
          </div>
        </header>

        {wishlist.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-6">
            <span className="material-symbols-outlined text-slate-grey text-5xl" style={{ fontVariationSettings: "'wght' 200" }}>favorite_border</span>
            <div className="text-center space-y-1">
              <h2 className="font-headline-md text-slate-grey text-lg animate-fade-in">Your Wishlist is Empty</h2>
              <p className="font-body-md text-slate-grey/60 text-sm">Save items here to view them later.</p>
            </div>
            <Link href="/collections/silent-center" className="font-button text-button uppercase px-8 py-3 bg-deep-navy text-pure-white hover:bg-ink-black transition-colors tracking-widest">
              Explore Collections
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-x-gutter gap-y-section-gap">
            {wishlist.map((item) => (
              <article key={item.id} className="bg-pure-white flex flex-col h-full border border-slate-grey/10 hover:border-slate-grey/30 transition-colors duration-300">
                <div className="aspect-[4/5] bg-surface-container-low overflow-hidden relative">
                  <Image
                    alt={item.title}
                    fill
                    src={item.image}
                    className="object-cover mix-blend-multiply transition-transform duration-75 hover:scale-103"
                    sizes="(max-width: 768px) 50vw, 25vw"
                  />
                </div>
                <div className="p-stack-md flex flex-col flex-grow justify-between">
                  <div className="mb-stack-lg">
                    <h2 className="font-body-lg text-body-lg text-ink-black mb-2">{item.title}</h2>
                    <p className="font-body-md text-body-md text-slate-grey">${item.price}</p>
                  </div>
                  <div className="space-y-4">
                    <button
                      onClick={() => handleMoveToBag(item)}
                      className="w-full bg-deep-navy text-pure-white font-button text-button py-4 uppercase tracking-widest hover:bg-ink-black transition-colors duration-300 cursor-pointer"
                    >
                      Move to Bag
                    </button>
                    <button
                      onClick={() => handleRemove(item.id, item.title)}
                      className="w-full text-center font-label-caps text-label-caps text-slate-grey hover:text-deep-navy hover:underline underline-offset-4 transition-all duration-300 cursor-pointer"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
