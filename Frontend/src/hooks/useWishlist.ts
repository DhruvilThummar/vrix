"use client";

import { useState, useEffect, useCallback } from "react";
import { getWishlistKey, getApiBaseUrl } from "@/utils/api";
import { useAuth } from "@/context/AuthContext";
import { Product } from "@/types/product.types";

export function useWishlist(allProducts: Product[] = []) {
  const { user } = useAuth();
  const [wishlistIds, setWishlistIds] = useState<string[]>([]);

  const loadWishlist = useCallback(() => {
    try {
      if (typeof window === "undefined") return;
      const key = getWishlistKey(user?.email);
      const saved = localStorage.getItem(key) || localStorage.getItem("vrix-wishlist");
      if (saved) {
        setWishlistIds(JSON.parse(saved));
      } else {
        setWishlistIds([]);
      }
    } catch (err) {
      console.error("Failed to load wishlist:", err);
    }
  }, [user]);

  useEffect(() => {
    loadWishlist();
  }, [loadWishlist]);

  const toggleWishlist = useCallback(
    (productId: string) => {
      try {
        if (typeof window === "undefined") return;
        const key = getWishlistKey(user?.email);
        const updated = wishlistIds.includes(productId)
          ? wishlistIds.filter((id) => id !== productId)
          : [...wishlistIds, productId];

        localStorage.setItem(key, JSON.stringify(updated));
        localStorage.setItem("vrix-wishlist", JSON.stringify(updated));
        setWishlistIds(updated);

        // Sync with Backend if user is logged in
        if (user?.email) {
          const baseUrl = getApiBaseUrl();
          const itemsPayload = updated.map((id) => {
            const prod = allProducts.find((p) => p.id === id);
            return prod || { id };
          });
          fetch(`${baseUrl}/auth/sync-wishlist`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: user.email, items: itemsPayload }),
          }).catch(() => {});
        }
      } catch (err) {
        console.error("Failed to toggle wishlist item:", err);
      }
    },
    [user, wishlistIds, allProducts]
  );

  const isInWishlist = useCallback(
    (productId: string) => wishlistIds.includes(productId),
    [wishlistIds]
  );

  const wishlistProducts = allProducts.filter((p) => wishlistIds.includes(p.id));

  return {
    wishlistIds,
    wishlistProducts,
    toggleWishlist,
    isInWishlist,
    refreshWishlist: loadWishlist,
  };
}
