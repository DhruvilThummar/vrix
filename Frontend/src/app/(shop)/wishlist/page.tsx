"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { fetchProducts, getWishlistKey } from "@/utils/api";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { useCurrency } from "@/context/CurrencyContext";
import ProductCard from "@/components/shop/ProductCard";

interface Product {
  id: string;
  title: string;
  subtitle?: string;
  price: number;
  image: string;
  material: string;
  category?: string;
  type?: string;
  stock?: number;
}

export default function WishlistPage() {
  const { addItem } = useCart();
  const { user } = useAuth();
  const { formatPrice } = useCurrency();
  const [wishlist, setWishlist] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<any[]>([]);

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

  // Load suggestion products (in-stock, not already wishlisted)
  useEffect(() => {
    fetchProducts().then((all: any[]) => {
      const wlIds = new Set(wishlist.map((w) => String(w.id)));
      const inStock = all.filter((p: any) => {
        if (wlIds.has(String(p.id))) return false;
        if (Array.isArray(p.variants) && p.variants.length > 0) {
          return p.variants.some((v: any) => Number(v.stock ?? 999) > 0);
        }
        return Number(p.stock ?? 999) > 0;
      });
      const shuffled = [...inStock].sort((a, b) => String(a.id).charCodeAt(1) - String(b.id).charCodeAt(1));
      setSuggestions(shuffled.slice(0, 4));
    }).catch(() => {});
  }, [wishlist]);

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
    if (Number(product.stock ?? 999) <= 0) {
      showToast("This product is currently out of stock.");
      return;
    }
    try {
      addItem({
        id: product.id,
        title: product.title,
        subtitle: product.subtitle || product.type,
        price: product.price,
        image: product.image,
        material: product.material || "18K Gold Vermeil",
        size: "M",
        stock: Number(product.stock ?? 999),
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
            <span className="material-symbols-outlined icon-weight-light text-slate-grey text-6xl">favorite_border</span>
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
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-gutter">
              {wishlist.map((item) => (
                <ProductCard
                  key={item.id}
                  product={item}
                  formatPrice={formatPrice}
                  isWishlisted={true}
                  onWishlistToggle={(id, title, e) => handleRemove(id, title, e)}
                  onQuickAdd={(p, v) => handleMoveToBag(p as Product)}
                  showQuickAdd={true}
                />
              ))}
            </div>

            {/* You May Also Like */}
            {suggestions.length > 0 && (
              <section className="mt-section-gap pt-stack-lg border-t border-slate-grey/20">
                <div className="flex flex-col md:flex-row md:items-end justify-between mb-5 gap-3">
                  <div>
                    <span className="font-label-caps text-xs text-slate-grey uppercase tracking-widest block mb-1">Curated Pairings</span>
                    <h2 className="font-display-lg text-xl text-deep-navy uppercase tracking-wider">You May Also Like</h2>
                  </div>
                  <Link href="/collections" className="font-label-caps text-xs text-ink-black uppercase tracking-widest underline underline-offset-4 hover:text-slate-grey">
                    View All Jewelry →
                  </Link>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
                  {suggestions.map((p) => (
                    <ProductCard
                      key={p.id}
                      product={p}
                      formatPrice={formatPrice}
                      showQuickAdd={false}
                    />
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </main>
    </div>
  );
}
