"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { useCart } from "@/context/CartContext";
import { fetchDbPublic as fetchDb } from "@/utils/api";
import { useCurrency } from "@/utils/useCurrency";

export default function GiftWrappingSection() {
  const { isGiftWrapped, toggleGiftWrap, giftMessage, setGiftMessage } = useCart();
  const { formatPrice } = useCurrency();

  const [config, setConfig] = useState({
    isEnabled: true,
    title: "Signature Gift Packaging & Handwritten Ribbon Card",
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
            title: res.gift_wrapping.title || "Signature Gift Packaging & Handwritten Ribbon Card",
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
    <div className="border border-soft-linen bg-surface/30 p-5 space-y-4 rounded">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="relative w-16 h-16 shrink-0 bg-soft-linen overflow-hidden border border-soft-linen rounded">
            <Image
              src={config.image}
              alt={config.title}
              fill
              className="object-cover"
              sizes="64px"
            />
          </div>

          <div>
            <h4 className="font-label-caps text-xs text-deep-navy font-bold uppercase tracking-wider">
              {config.title}
            </h4>
            <p className="font-body-md text-xs text-slate-grey mt-0.5 leading-relaxed">
              {config.description}
            </p>
          </div>
        </div>

        {/* User requested Gift Wrapping Button */}
        <button
          type="button"
          onClick={() => toggleGiftWrap(!isGiftWrapped, config.price)}
          className={`group relative flex flex-col p-3 border cursor-pointer text-left transition-all duration-200 shrink-0 min-w-[150px] rounded ${
            isGiftWrapped
              ? "bg-deep-navy text-pure-white border-deep-navy shadow-md translate-y-[-1px]"
              : "bg-pure-white text-ink-black border-slate-grey/30 hover:border-deep-navy"
          }`}
        >
          <div className="flex items-center justify-between gap-1 mb-1.5">
            <span className={`material-symbols-outlined text-lg ${isGiftWrapped ? "text-amber-300" : "text-amber-600"}`}>
              card_giftcard
            </span>
            <span className={`w-1.5 h-1.5 rounded-full ${isGiftWrapped ? "bg-amber-400" : "bg-slate-300"}`}></span>
          </div>
          <span className={`font-label-caps text-[10px] tracking-wider line-clamp-1 font-medium ${isGiftWrapped ? "text-pure-white" : "text-deep-navy"}`}>
            Gift Wrapping ({isGiftWrapped ? "Added" : `+${formatPrice(config.price)}`})
          </span>
        </button>
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
            className="w-full border border-slate-grey/25 p-2.5 text-xs font-body-md text-ink-black focus:border-black outline-none bg-pure-white rounded"
          />
        </div>
      )}
    </div>
  );
}
