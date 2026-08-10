"use client";

import React, { useMemo } from "react";
import { ShippingData, TaxBreakdown } from "@/types/checkout";
import { CartItem } from "@/context/CartContext";
import { useCurrency } from "@/context/CurrencyContext";

interface OrderSummaryProps {
  items: CartItem[];
  subtotal: number;
  discountAmount: number;
  grandTotal: number;
  shipping: ShippingData | null;
  isGiftWrapped: boolean;
  giftWrapPrice: number;
}

export default function OrderSummary({
  items,
  subtotal,
  discountAmount,
  grandTotal,
  shipping,
  isGiftWrapped,
  giftWrapPrice,
}: OrderSummaryProps) {
  const { currency, formatPrice } = useCurrency();

  // Memoized Tax Calculation (CGST/SGST 9% each for IN, 5% VAT for Global)
  const taxInfo: TaxBreakdown = useMemo(() => {
    const isIndia = currency === "INR";
    const taxRate = isIndia ? 0.18 : 0.05;
    const totalWithWrap = grandTotal;
    const taxAmount = totalWithWrap * (taxRate / (1 + taxRate));
    const baseAmount = totalWithWrap - taxAmount;

    return {
      currency,
      isIndia,
      baseAmount,
      taxAmount,
      cgst: taxAmount / 2,
      sgst: taxAmount / 2,
      vatRate: Math.round(taxRate * 100),
    };
  }, [currency, grandTotal]);

  return (
    <div className="sticky top-28 bg-soft-linen/40 border border-slate-grey/20 p-6 space-y-5">
      <h2 className="font-label-caps text-[10px] uppercase tracking-widest text-slate-grey border-b border-slate-grey/20 pb-3">
        Order Summary
      </h2>

      {/* Items list */}
      <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
        {items.map((item) => (
          <div key={`${item.id}-${item.size}`} className="flex gap-3 items-center">
            <div className="w-12 h-14 bg-pure-white border border-slate-grey/15 relative overflow-hidden shrink-0">
              <img
                src={item.image}
                alt={item.title}
                className="w-full h-full object-cover mix-blend-multiply"
              />
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-deep-navy text-pure-white text-[8px] flex items-center justify-center rounded-full font-bold">
                {item.quantity}
              </span>
            </div>
            <div className="flex-grow min-w-0">
              <p className="text-xs font-body-md text-ink-black truncate font-medium">{item.title}</p>
              <p className="text-[10px] text-slate-grey">{item.subtitle || "Fine Jewelry"}</p>
              <p className="text-[9px] text-slate-grey/70">{item.material}</p>
              {item.size && <p className="text-[10px] text-slate-grey">Size: {item.size}</p>}
            </div>
            <p className="text-xs font-semibold text-deep-navy shrink-0">
              {formatPrice(item.price * item.quantity)}
            </p>
          </div>
        ))}
      </div>

      {/* Price Breakdown */}
      <div className="space-y-2 text-xs font-body-md text-ink-black border-t border-slate-grey/20 pt-4">
        <div className="flex justify-between">
          <span className="text-slate-grey font-medium">Checkout Subtotal</span>
          <span>
            {formatPrice(subtotal - discountAmount)}
          </span>
        </div>

        {isGiftWrapped && (
          <div className="flex justify-between text-emerald-700 bg-emerald-50/50 px-2 py-1.5 rounded items-center">
            <span className="flex items-center gap-1.5 font-semibold text-[11px]">
              <i className="fa-solid fa-gift text-xs"></i>
              Signature Packaging
            </span>
            <span className="font-bold">+{formatPrice(giftWrapPrice || 250)}</span>
          </div>
        )}

        {/* Dynamic Tax Breakdown */}
        <div className="space-y-2 pt-2 border-t border-dashed border-slate-grey/15">
          <div className="flex justify-between text-[11px] text-slate-grey">
            <span>Base Amount (excl. tax)</span>
            <span>
              {formatPrice(taxInfo.baseAmount)}
            </span>
          </div>
          {taxInfo.isIndia ? (
            <>
              <div className="flex justify-between text-[11px] text-slate-grey">
                <span>CGST (9%)</span>
                <span>
                  {formatPrice(taxInfo.cgst)}
                </span>
              </div>
              <div className="flex justify-between text-[11px] text-slate-grey">
                <span>SGST (9%)</span>
                <span>
                  {formatPrice(taxInfo.sgst)}
                </span>
              </div>
            </>
          ) : (
            <div className="flex justify-between text-[11px] text-slate-grey">
              <span>Regional Tax / VAT ({taxInfo.vatRate}%)</span>
              <span>
                {formatPrice(taxInfo.taxAmount)}
              </span>
            </div>
          )}
        </div>

        {/* Total Due */}
        <div className="flex justify-between font-headline-md text-lg border-t border-slate-grey/20 pt-3 mt-2">
          <span className="font-bold text-deep-navy">Total Due</span>
          <span className="font-bold text-deep-navy">{formatPrice(grandTotal)}</span>
        </div>
      </div>

      {/* Trust Badges */}
      <div className="space-y-2 border-t border-slate-grey/15 pt-3">
        {[
          { icon: "verified_user", text: "SSL encrypted checkout" },
          { icon: "currency_rupee", text: "Powered by Razorpay" },
          { icon: "sync", text: "30-day return policy" },
        ].map((t) => (
          <div key={t.text} className="flex items-center gap-2 text-[10px] text-slate-grey font-body-md">
            <span className="material-symbols-outlined text-[13px]">{t.icon}</span>
            {t.text}
          </div>
        ))}
      </div>
    </div>
  );
}
