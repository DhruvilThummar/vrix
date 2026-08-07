"use client";

import { useState, useEffect, useCallback } from "react";
import { fetchProducts } from "@/utils/api";
import { Product } from "@/types/product.types";

interface UseProductsOptions {
  category?: string;
  collectionId?: string;
  maxPrice?: number;
  initialFetch?: boolean;
}

export function useProducts(options: UseProductsOptions = { initialFetch: true }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(options.initialFetch !== false);
  const [error, setError] = useState<string | null>(null);

  const loadProducts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchProducts();
      let filtered = Array.isArray(data) ? data : [];

      if (options.category) {
        filtered = filtered.filter(
          (p: Product) => p.type?.toLowerCase() === options.category?.toLowerCase()
        );
      }

      if (options.collectionId) {
        filtered = filtered.filter(
          (p: Product) => p.collection?.toLowerCase() === options.collectionId?.toLowerCase()
        );
      }

      if (options.maxPrice) {
        filtered = filtered.filter((p: Product) => p.price <= (options.maxPrice || Infinity));
      }

      setProducts(filtered);
    } catch (err: any) {
      console.error("useProducts error:", err);
      setError(err.message || "Failed to load products");
    } finally {
      setLoading(false);
    }
  }, [options.category, options.collectionId, options.maxPrice]);

  useEffect(() => {
    if (options.initialFetch !== false) {
      loadProducts();
    }
  }, [loadProducts, options.initialFetch]);

  return {
    products,
    loading,
    error,
    refetch: loadProducts,
  };
}
