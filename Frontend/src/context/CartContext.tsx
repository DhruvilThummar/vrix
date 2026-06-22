"use client";
import React, { createContext, useContext, useState, useEffect, useCallback } from "react";

export interface CartItem {
  id: string;
  title: string;
  price: number;
  image: string;
  material: string;
  quantity: number;
  size?: string;
  engraving?: string;
}

interface CartContextType {
  items: CartItem[];
  totalItems: number;
  subtotal: number;
  discount: number;
  promoCode: string | null;
  promoType: "percentage" | "fixed" | null;
  addItem: (item: Omit<CartItem, "quantity">) => void;
  removeItem: (id: string) => void;
  updateQty: (id: string, qty: number) => void;
  applyPromo: (code: string, discount: number, type: "percentage" | "fixed") => void;
  clearPromo: () => void;
  clearCart: () => void;
}

const CartContext = createContext<CartContextType | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [promoCode, setPromoCode] = useState<string | null>(null);
  const [discount, setDiscount] = useState(0);
  const [promoType, setPromoType] = useState<"percentage" | "fixed" | null>(null);

  // Hydrate from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem("vrix-cart");
      if (saved) setItems(JSON.parse(saved));
    } catch {}
  }, []);

  // Persist to localStorage
  useEffect(() => {
    localStorage.setItem("vrix-cart", JSON.stringify(items));
  }, [items]);

  const addItem = useCallback((item: Omit<CartItem, "quantity">) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.id === item.id && i.size === item.size);
      if (existing) {
        return prev.map((i) =>
          i.id === item.id && i.size === item.size ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [...prev, { ...item, quantity: 1 }];
    });
  }, []);

  const removeItem = useCallback((id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  }, []);

  const updateQty = useCallback((id: string, qty: number) => {
    if (qty <= 0) { removeItem(id); return; }
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, quantity: qty } : i)));
  }, [removeItem]);

  const applyPromo = useCallback((code: string, disc: number, type: "percentage" | "fixed") => {
    setPromoCode(code);
    setDiscount(disc);
    setPromoType(type);
  }, []);

  const clearPromo = useCallback(() => {
    setPromoCode(null);
    setDiscount(0);
    setPromoType(null);
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
    clearPromo();
  }, [clearPromo]);

  const subtotal = items.reduce((acc, i) => acc + i.price * i.quantity, 0);
  const totalItems = items.reduce((acc, i) => acc + i.quantity, 0);

  return (
    <CartContext.Provider value={{ items, totalItems, subtotal, discount, promoCode, promoType, addItem, removeItem, updateQty, applyPromo, clearPromo, clearCart }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
