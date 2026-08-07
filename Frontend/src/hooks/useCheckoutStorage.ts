"use client";

import { useState, useEffect, useCallback } from "react";
import { ShippingData, OrderDetails } from "@/types/checkout";

const SHIPPING_KEY = "vrix-shipping";
const ORDER_KEY = "vrix-order";

export function useCheckoutStorage() {
  const [shipping, setShippingState] = useState<ShippingData | null>(null);
  const [order, setOrderState] = useState<OrderDetails | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    try {
      if (typeof window !== "undefined") {
        const savedShipping = sessionStorage.getItem(SHIPPING_KEY);
        if (savedShipping) {
          setShippingState(JSON.parse(savedShipping));
        }

        const savedOrder = sessionStorage.getItem(ORDER_KEY);
        if (savedOrder) {
          setOrderState(JSON.parse(savedOrder));
        }
      }
    } catch (err) {
      console.error("Failed to read checkout storage:", err);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  const setShipping = useCallback((data: ShippingData) => {
    try {
      if (typeof window !== "undefined") {
        sessionStorage.setItem(SHIPPING_KEY, JSON.stringify(data));
        setShippingState(data);
      }
    } catch (err) {
      console.error("Failed to save shipping data:", err);
    }
  }, []);

  const setOrder = useCallback((data: OrderDetails) => {
    try {
      if (typeof window !== "undefined") {
        sessionStorage.setItem(ORDER_KEY, JSON.stringify(data));
        setOrderState(data);
      }
    } catch (err) {
      console.error("Failed to save order data:", err);
    }
  }, []);

  const clearShipping = useCallback(() => {
    try {
      if (typeof window !== "undefined") {
        sessionStorage.removeItem(SHIPPING_KEY);
        setShippingState(null);
      }
    } catch (err) {
      console.error("Failed to clear shipping data:", err);
    }
  }, []);

  const consumeOrder = useCallback((): OrderDetails | null => {
    try {
      if (typeof window !== "undefined") {
        const saved = sessionStorage.getItem(ORDER_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          sessionStorage.removeItem(ORDER_KEY);
          setOrderState(null);
          return parsed;
        }
      }
    } catch (err) {
      console.error("Failed to consume order data:", err);
    }
    return null;
  }, []);

  return {
    shipping,
    order,
    isLoaded,
    setShipping,
    setOrder,
    clearShipping,
    consumeOrder,
  };
}
