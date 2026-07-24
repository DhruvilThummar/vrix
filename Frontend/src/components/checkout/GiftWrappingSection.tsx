"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { useCart } from "@/context/CartContext";
import { fetchDb } from "@/utils/api";

export default function GiftWrappingSection() {
  const { isGiftWrapped, toggleGiftWrap, giftMessage, setGiftMessage, giftWrapPrice } = useCart();

  const [config, setConfig] = useState({
    isEnabled: true,
    title: "Monica Vinader Style Signature Gift Packaging",
    price: 250,
    image: "https://images.unsplash.com/photo-1549465220-1a8b9238cd48?q=80&w=600&auto=format&fit=crop",
    description: "Delivered in signature luxury pouch, ribbon-wrapped box, and custom hand-written gift card."
  });

  useEffect(() => {
    fetchDb()
      .then((res) => {
        if (res.gift_wrapping) {
          setConfig({
            isEnabled: res.gift_wrapping.isEnabled !== false,
            title: res.gift_wrapping.title || "Monica Vinader Style Signature Gift Packaging",
            price: res.gift_wrapping.price || 250,
            image: res.gift_wrapping.image || "https://images.unsplash.com/photo-1549465220-1a8b9238cd48?q=80&w=600&auto=format&fit=crop",
            description: res.gift_wrapping.description || "Delivered in signature luxury pouch, ribbon-wrapped box, and custom hand-written gift card."
          });
        }
      })
      .catch((err) => console.error("Failed to load gift_wrapping from db:", err));
  }, []);

  if (!config.isEnabled) return null;

  return (
    <div className="border border-soft-linen bg-surface/30 p-5 space-y-4">
      <div className="flex items-start gap-4">
        {/* Gift Box Thumbnail Preview */}
        <div className="relative w-16 h-20 shrink-0 bg-soft-linen overflow-hidden border border-soft-linen">
          <Image
            src={config.image}
            alt={config.title}
            fill
            className="object-cover"
            sizes="64px"
          />
        </div>

        <div className="flex-grow space-y-1">
          <div className="flex justify-between items-start">
            <h4 className="font-label-caps text-xs text-deep-navy font-bold uppercase tracking-wider">
              {config.title}
            </h4>
            <span className="font-body-md text-xs font-semibold text-ink-black ml-2 shrink-0">
              +₹{config.price}
            </span>
          </div>

          <p className="font-body-md text-xs text-slate-grey leading-relaxed">
            {config.description}
          </p>

          <div className="pt-2">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={isGiftWrapped}
                onChange={(e) => toggleGiftWrap(e.target.checked, config.price)}
                className="w-4 h-4 text-deep-navy border-slate-grey/30 focus:ring-black cursor-pointer"
              />
              <span className="font-label-caps text-[11px] uppercase tracking-wider text-ink-black font-semibold">
                Add Signature Gift Packaging (+₹{config.price})
              </span>
            </label>
          </div>
        </div>
      </div>

      {/* Gift Note Box when checked */}
      {isGiftWrapped && (
        <div className="pt-3 border-t border-soft-linen space-y-2 animate-fade-in">
          <div className="flex justify-between items-center text-[10px] font-label-caps text-slate-grey uppercase tracking-widest">
            <span>Handwritten Gift Message</span>
            <span>{giftMessage.length}/150</span>
          </div>
          <textarea
            value={giftMessage}
            onChange={(e) => setGiftMessage(e.target.value)}
            maxLength={150}
            rows={2}
            placeholder="Write a personalized gift note to be printed on card..."
            className="w-full border border-slate-grey/25 p-2 text-xs font-body-md text-ink-black focus:border-black outline-none bg-pure-white"
          />
        </div>
      )}
    </div>
  );
}
