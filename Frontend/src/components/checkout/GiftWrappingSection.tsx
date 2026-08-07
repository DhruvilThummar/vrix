"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { useCart, GiftOption } from "@/context/CartContext";
import { fetchGiftWrappingAPI } from "@/utils/api";
import { useCurrency } from "@/context/CurrencyContext";

interface GiftWrappingConfig {
  isEnabled: boolean;
  title: string;
  price: number;
  image: string;
  description: string;
}

export default function GiftWrappingSection() {
  const { isGiftWrapped, toggleGiftWrap, giftMessage, setGiftMessage, selectedGiftOptions, toggleGiftOption } = useCart();
  const { formatPrice } = useCurrency();

  const [config, setConfig] = useState<GiftWrappingConfig>({
    isEnabled: true,
    title: "Signature Gift Packaging & Ribbon Card",
    price: 250,
    image: "https://images.unsplash.com/photo-1549465220-1a8b9238cd48?q=80&w=600&auto=format&fit=crop",
    description: "Delivered in signature luxury pouch, ribbon-wrapped box, and custom hand-written gift card.",
  });
  const [dbGiftOptions, setDbGiftOptions] = useState<GiftOption[]>([]);

  useEffect(() => {
    fetchGiftWrappingAPI()
      .then((res) => {
        if (res) {
          setConfig({
            isEnabled: res.isEnabled !== false,
            title: res.title || "Signature Gift Packaging & Ribbon Card",
            price: res.price || 250,
            image: res.image || "https://images.unsplash.com/photo-1549465220-1a8b9238cd48?q=80&w=600&auto=format&fit=crop",
            description: res.description || "Delivered in signature luxury pouch, ribbon-wrapped box, and custom hand-written gift card.",
          });
          if (Array.isArray(res.giftOptions)) {
            setDbGiftOptions(res.giftOptions);
          }
        }
      })
      .catch((err) => console.error("Failed to load gift_wrapping from API:", err));
  }, []);

  if (!config.isEnabled) return null;

  return (
    <div className="border border-soft-linen bg-surface/30 p-5 space-y-5 rounded shadow-xs">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-label-caps text-xs text-deep-navy font-bold uppercase tracking-wider flex items-center gap-2">
            <span className="material-symbols-outlined text-amber-600 text-lg">card_giftcard</span>
            Luxury Gift Packaging Options
          </h3>
          <p className="font-body-md text-xs text-slate-grey mt-0.5">
            Enhance your luxury jewelry order with bespoke gift packaging and custom calligraphy notes.
          </p>
        </div>
      </div>

      {/* Primary Signature Gift Wrapping */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-3.5 bg-pure-white border border-slate-grey/20 rounded">
        <div className="flex items-center gap-4">
          <div className="relative w-14 h-14 shrink-0 bg-soft-linen overflow-hidden border border-soft-linen rounded">
            <Image
              src={config.image}
              alt={config.title}
              fill
              className="object-cover"
              sizes="56px"
            />
          </div>

          <div>
            <h4 className="font-label-caps text-xs text-deep-navy font-bold uppercase tracking-wider">
              {config.title}
            </h4>
            <p className="font-body-md text-[11px] text-slate-grey mt-0.5 leading-relaxed">
              {config.description}
            </p>
          </div>
        </div>

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

      {/* Custom Cases & Cards Catalog */}
      {dbGiftOptions.length > 0 && (
        <div className="space-y-2.5">
          <h4 className="font-label-caps text-[10px] text-slate-grey uppercase tracking-widest font-semibold">
            Select Custom Presentation Cases &amp; Cards
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {dbGiftOptions.map((option: GiftOption) => {
              const isSelected = selectedGiftOptions.some((g) => g.id === option.id);
              return (
                <div
                  key={option.id}
                  onClick={() => toggleGiftOption(option)}
                  className={`p-3 border rounded cursor-pointer transition-all duration-200 flex items-center justify-between gap-3 ${
                    isSelected
                      ? "bg-deep-navy text-pure-white border-deep-navy shadow-sm"
                      : "bg-pure-white text-ink-black border-slate-grey/20 hover:border-deep-navy/50"
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="relative w-12 h-12 shrink-0 overflow-hidden rounded border border-slate-grey/10">
                      <Image src={option.image} alt={option.title} fill className="object-cover" sizes="48px" />
                    </div>
                    <div className="min-w-0">
                      <h5 className={`font-label-caps text-[11px] font-bold uppercase tracking-wider truncate ${isSelected ? "text-pure-white" : "text-deep-navy"}`}>
                        {option.title}
                      </h5>
                      <p className={`font-body-md text-[10px] line-clamp-1 mt-0.5 ${isSelected ? "text-slate-200" : "text-slate-grey"}`}>
                        {option.description}
                      </p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className={`font-label-caps text-xs font-bold ${isSelected ? "text-amber-300" : "text-deep-navy"}`}>
                      +{formatPrice(option.price)}
                    </span>
                    <div className="mt-0.5">
                      <span className={`material-symbols-outlined text-base ${isSelected ? "text-amber-400" : "text-slate-300"}`}>
                        {isSelected ? "check_circle" : "add_circle"}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Custom Calligraphy Note Box */}
      {(isGiftWrapped || selectedGiftOptions.length > 0) && (
        <div className="pt-3 border-t border-soft-linen space-y-2 animate-fade-in">
          <div className="flex justify-between items-center text-[10px] font-label-caps text-slate-grey uppercase tracking-widest">
            <span>Handwritten Calligraphy Gift Message</span>
            <span>{giftMessage.length}/150</span>
          </div>
          <textarea
            rows={2}
            value={giftMessage}
            onChange={(e) => setGiftMessage(e.target.value)}
            placeholder="Write your custom gift message here (printed on luxury cardstock)..."
            className="w-full bg-pure-white border border-slate-grey/30 p-2.5 text-xs text-ink-black outline-none focus:border-deep-navy rounded resize-none"
          />
        </div>
      )}
    </div>
  );
}
