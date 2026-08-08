"use client";
import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";

export interface CartItem {
  id: string;
  title: string;
  price: number;
  image: string;
  material: string;
  quantity: number;
  size?: string;
  engraving?: string;
  giftNote?: string;
}

export interface GiftOption {
  id: string;
  title: string;
  price: number;
  image: string;
  description?: string;
}

interface CartContextType {
  items: CartItem[];
  totalItems: number;
  subtotal: number;
  discount: number;
  promoCode: string | null;
  promoType: "percentage" | "fixed" | null;
  isGiftWrapped: boolean;
  giftMessage: string;
  giftWrapPrice: number;
  selectedGiftOptions: GiftOption[];
  toggleGiftOption: (option: GiftOption) => void;
  toggleGiftWrap: (wrapped: boolean, price?: number) => void;
  setGiftMessage: (msg: string) => void;
  addItem: (item: Omit<CartItem, "quantity"> & { quantity?: number }) => void;
  removeItem: (id: string, size?: string, material?: string) => void;
  updateQty: (id: string, qty: number, size?: string, material?: string) => void;
  applyPromo: (code: string, discount: number, type: "percentage" | "fixed") => void;
  clearPromo: () => void;
  clearCart: () => void;
}

const CartContext = createContext<CartContextType | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [items, setItems] = useState<CartItem[]>([]);
  const [promoCode, setPromoCode] = useState<string | null>(null);
  const [discount, setDiscount] = useState(0);
  const [promoType, setPromoType] = useState<"percentage" | "fixed" | null>(null);
  const [isGiftWrapped, setIsGiftWrapped] = useState(false);
  const [giftMessage, setGiftMessageState] = useState("");
  const [giftWrapPrice, setGiftWrapPrice] = useState(250);
  const [selectedGiftOptions, setSelectedGiftOptions] = useState<GiftOption[]>([]);

  // Hydrate from localStorage per user email
  useEffect(() => {
    try {
      const userKey = user?.email ? `vrix-cart_${user.email.toLowerCase()}` : "vrix-cart-guest";
      const savedUserCart = localStorage.getItem(userKey);
      const fallbackCart = localStorage.getItem("vrix-cart");

      if (savedUserCart) {
        setItems(JSON.parse(savedUserCart));
      } else if (fallbackCart) {
        const parsedFallback = JSON.parse(fallbackCart);
        setItems(parsedFallback);
        localStorage.setItem(userKey, JSON.stringify(parsedFallback));
      } else {
        setItems([]);
      }

      const savedGift = localStorage.getItem("vrix-gift-wrap");
      if (savedGift) {
        const parsed = JSON.parse(savedGift);
        setIsGiftWrapped(!!parsed.isGiftWrapped);
        setGiftMessageState(parsed.giftMessage || "");
        if (parsed.giftWrapPrice) setGiftWrapPrice(parsed.giftWrapPrice);
        if (Array.isArray(parsed.selectedGiftOptions)) setSelectedGiftOptions(parsed.selectedGiftOptions);
      }
    } catch {}
  }, [user?.email]);

  // Persist to localStorage per user email
  useEffect(() => {
    try {
      const userKey = user?.email ? `vrix-cart_${user.email.toLowerCase()}` : "vrix-cart-guest";
      localStorage.setItem(userKey, JSON.stringify(items));
      localStorage.setItem("vrix-cart", JSON.stringify(items));
    } catch {}
  }, [items, user?.email]);

  useEffect(() => {
    localStorage.setItem(
      "vrix-gift-wrap",
      JSON.stringify({ isGiftWrapped, giftMessage, giftWrapPrice, selectedGiftOptions })
    );
  }, [isGiftWrapped, giftMessage, giftWrapPrice, selectedGiftOptions]);

  const toggleGiftWrap = useCallback((wrapped: boolean, price?: number) => {
    setIsGiftWrapped(wrapped);
    if (price !== undefined) setGiftWrapPrice(price);
  }, []);

  const toggleGiftOption = useCallback((option: GiftOption) => {
    setSelectedGiftOptions((prev) => {
      const exists = prev.some((g) => g.id === option.id);
      if (exists) {
        return prev.filter((g) => g.id !== option.id);
      }
      return [...prev, option];
    });
  }, []);

  const setGiftMessage = useCallback((msg: string) => {
    setGiftMessageState(msg);
  }, []);

  const addItem = useCallback((newItem: Omit<CartItem, "quantity"> & { quantity?: number }) => {
    setItems((prev) => {
      const qtyToAdd = newItem.quantity && newItem.quantity > 0 ? newItem.quantity : 1;

      // 1. Check if an item with exact same id, size, material, and custom options already exists
      const matchIndex = prev.findIndex(
        (i) =>
          i.id === newItem.id &&
          (i.size || "") === (newItem.size || "") &&
          (i.material || "") === (newItem.material || "") &&
          (i.engraving || "") === (newItem.engraving || "") &&
          (i.giftNote || "") === (newItem.giftNote || "")
      );

      // 2. If matching item found, increment its quantity immutably
      if (matchIndex > -1) {
        return prev.map((item, idx) =>
          idx === matchIndex
            ? { ...item, quantity: item.quantity + qtyToAdd }
            : item
        );
      }

      // 3. If no matching item found, push new item with default quantity
      return [...prev, { ...newItem, quantity: qtyToAdd }];
    });
  }, []);

  const removeItem = useCallback((id: string, size?: string, material?: string) => {
    setItems((prev) =>
      prev.filter(
        (i) =>
          !(
            i.id === id &&
            (size === undefined || (i.size || "") === (size || "")) &&
            (material === undefined || (i.material || "") === (material || ""))
          )
      )
    );
  }, []);

  const updateQty = useCallback((id: string, qty: number, size?: string, material?: string) => {
    if (qty <= 0) {
      removeItem(id, size, material);
      return;
    }
    setItems((prev) =>
      prev.map((i) =>
        i.id === id &&
        (size === undefined || (i.size || "") === (size || "")) &&
        (material === undefined || (i.material || "") === (material || ""))
          ? { ...i, quantity: qty }
          : i
      )
    );
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
    setIsGiftWrapped(false);
    setGiftMessageState("");
    setSelectedGiftOptions([]);
  }, [clearPromo]);

  const giftOptionsTotal = selectedGiftOptions.reduce((sum, g) => sum + g.price, 0);
  const subtotal = items.reduce((acc, i) => acc + i.price * i.quantity, 0) + (isGiftWrapped ? giftWrapPrice : 0) + giftOptionsTotal;
  const totalItems = items.reduce((acc, i) => acc + i.quantity, 0);

  return (
    <CartContext.Provider value={{ items, totalItems, subtotal, discount, promoCode, promoType, isGiftWrapped, giftMessage, giftWrapPrice, selectedGiftOptions, toggleGiftOption, toggleGiftWrap, setGiftMessage, addItem, removeItem, updateQty, applyPromo, clearPromo, clearCart }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
