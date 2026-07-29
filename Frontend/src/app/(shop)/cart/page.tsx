"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { verifyPromo } from "@/utils/api";
import GiftWrappingSection from "@/components/checkout/GiftWrappingSection";

export default function CartPage() {
  const router = useRouter();
  const { isLoggedIn } = useAuth();
  const { items, subtotal, discount, promoCode, promoType, updateQty, removeItem, applyPromo, clearPromo } = useCart();
  const [promoInput, setPromoInput] = useState("");
  const [promoLoading, setPromoLoading] = useState(false);
  const [promoError, setPromoError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  };

  const discountAmount =
    promoType === "percentage"
      ? (subtotal * discount) / 100
      : promoType === "fixed"
      ? Math.min(discount, subtotal)
      : 0;

  const total = Math.max(0, subtotal - discountAmount);
  const shipping = total >= 150 ? 0 : 15;
  const grandTotal = total + shipping;

  const handleApplyPromo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!promoInput.trim()) return;
    setPromoLoading(true);
    setPromoError(null);
    try {
      const res = await verifyPromo(promoInput.trim());
      applyPromo(res.code, res.discount, res.type);
      showToast(`Code "${res.code}" applied — ${res.discount}${res.type === "percentage" ? "% off" : "₹ off"}!`);
      setPromoInput("");
    } catch (err: any) {
      setPromoError(err.message || "Invalid code.");
    } finally {
      setPromoLoading(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="w-full min-h-[70vh] flex flex-col items-center justify-center gap-8 px-4">
        <span className="material-symbols-outlined text-slate-grey text-6xl" style={{ fontVariationSettings: "'FILL' 0, 'wght' 200" }}>shopping_bag</span>
        <div className="text-center space-y-2">
          <h1 className="font-display-lg text-2xl text-deep-navy uppercase tracking-widest">Your Bag is Empty</h1>
          <p className="font-body-md text-slate-grey text-sm">Add pieces from our collections to begin.</p>
        </div>
        <Link href="/collections/silent-center" className="font-button text-button uppercase px-10 py-4 bg-deep-navy text-pure-white hover:bg-ink-black transition-colors tracking-widest">
          Explore Collections
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full">
      {toast && (
        <div className="fixed bottom-8 right-8 z-50 bg-deep-navy text-pure-white px-6 py-4 border border-slate-grey/30 shadow-2xl flex items-center gap-3 animate-fade-in">
          <span className="material-symbols-outlined text-sm">check_circle</span>
          <p className="font-body-md text-sm tracking-wide">{toast}</p>
        </div>
      )}

      <main className="flex-grow w-full max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop py-stack-lg md:py-section-gap">
        <h1 className="font-display-lg-mobile md:font-display-lg text-display-lg-mobile md:text-display-lg text-primary mb-stack-lg border-b border-slate-grey/20 pb-4 uppercase tracking-widest">
          Your Bag ({items.reduce((a, i) => a + i.quantity, 0)})
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter">
          {/* Cart Items */}
          <div className="lg:col-span-8 flex flex-col gap-stack-lg">
            {items.map((item) => (
              <div key={`${item.id}-${item.size}`} className="flex flex-col sm:flex-row gap-gutter pb-stack-lg border-b border-slate-grey/20">
                <div className="w-full sm:w-48 aspect-[4/5] bg-soft-linen shrink-0 relative overflow-hidden">
                  <Image
                    src={item.image}
                    alt={item.title}
                    fill
                    className="object-cover mix-blend-multiply"
                    sizes="192px"
                  />
                </div>
                <div className="flex-grow flex flex-col justify-between py-2">
                  <div>
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="font-headline-md text-headline-md text-primary">{item.title}</h3>
                        <p className="text-xs text-slate-grey font-body-md mt-0.5">{item.material}</p>
                        {item.size && <p className="text-xs text-slate-grey font-body-md">Size: <span className="text-ink-black">{item.size}</span></p>}
                        {item.engraving && <p className="text-xs text-slate-grey font-body-md italic">Engraving: "{item.engraving}"</p>}
                        {item.giftNote && <p className="text-xs text-slate-grey font-body-md italic">Gift Note: "{item.giftNote}"</p>}
                      </div>
                      <span className="font-body-md text-body-md text-primary font-semibold">₹{(item.price * item.quantity).toLocaleString()}</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-end mt-4">
                    {/* Qty Control */}
                    <div className="flex items-center border border-slate-grey/25 h-9">
                      <button
                        onClick={() => updateQty(item.id, item.quantity - 1)}
                        className="w-9 h-full flex items-center justify-center text-slate-grey hover:text-deep-navy transition-colors cursor-pointer border-r border-slate-grey/25"
                      >
                        <span className="material-symbols-outlined text-[16px]">remove</span>
                      </button>
                      <span className="font-body-md text-sm text-primary px-4">{item.quantity}</span>
                      <button
                        onClick={() => updateQty(item.id, item.quantity + 1)}
                        className="w-9 h-full flex items-center justify-center text-slate-grey hover:text-deep-navy transition-colors cursor-pointer border-l border-slate-grey/25"
                      >
                        <span className="material-symbols-outlined text-[16px]">add</span>
                      </button>
                    </div>
                    <button
                      onClick={() => { removeItem(item.id); showToast(`"${item.title}" removed.`); }}
                      className="font-label-caps text-label-caps text-slate-grey hover:text-red-600 uppercase tracking-widest transition-colors flex items-center gap-1 cursor-pointer text-[10px]"
                    >
                      <span className="material-symbols-outlined text-[14px]">delete</span>
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {/* Signature Gift Packaging Option */}
            <GiftWrappingSection />
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-4 relative">
            <div className="sticky top-32 bg-pure-white p-stack-lg border border-slate-grey/20 space-y-6">
              <h2 className="font-headline-md text-headline-md text-primary uppercase tracking-wider border-b border-slate-grey/15 pb-4">Order Summary</h2>

              {/* Promo Code */}
              {promoCode ? (
                <div className="flex items-center justify-between bg-green-50 border border-green-200 px-4 py-3">
                  <div className="space-y-0.5">
                    <p className="font-label-caps text-[10px] uppercase tracking-widest text-green-800">Code Applied</p>
                    <p className="font-body-md text-sm text-green-700 font-semibold">{promoCode} — {discount}{promoType === "percentage" ? "% off" : "₹ off"}</p>
                  </div>
                  <button onClick={() => { clearPromo(); showToast("Promo code removed."); }} className="text-green-600 hover:text-red-600 transition-colors cursor-pointer">
                    <span className="material-symbols-outlined text-[18px]">close</span>
                  </button>
                </div>
              ) : (
                <form onSubmit={handleApplyPromo} className="space-y-2">
                  <label className="font-label-caps text-[10px] text-slate-grey uppercase tracking-widest">Promo / Redeem Code</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={promoInput}
                      onChange={(e) => { setPromoInput(e.target.value.toUpperCase()); setPromoError(null); }}
                      placeholder="Enter code"
                      className="flex-1 border-b border-slate-grey/30 py-2 focus:border-deep-navy outline-none font-body-md text-sm text-ink-black uppercase tracking-widest bg-transparent"
                    />
                    <button
                      type="submit"
                      disabled={promoLoading}
                      className="font-button text-[10px] uppercase px-4 py-2 border border-deep-navy text-deep-navy hover:bg-deep-navy hover:text-pure-white transition-colors cursor-pointer"
                    >
                      {promoLoading ? <span className="w-3 h-3 border border-deep-navy border-t-transparent rounded-full animate-spin inline-block" /> : "Apply"}
                    </button>
                  </div>
                  {promoError && <p className="text-xs text-red-600 font-body-md">{promoError}</p>}
                </form>
              )}

              {/* Price Breakdown */}
              <div className="space-y-3 font-body-md text-body-md text-primary">
                <div className="flex justify-between">
                  <span className="text-slate-grey">Subtotal</span>
                  <span>₹{subtotal.toLocaleString()}</span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-green-700">
                    <span>Discount ({promoCode})</span>
                    <span>−₹{discountAmount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-slate-grey">Shipping</span>
                  <span>{shipping === 0 ? <span className="text-green-700">Free</span> : `₹${shipping}`}</span>
                </div>
                {shipping > 0 && (
                  <p className="text-[10px] text-slate-grey font-body-md">Add ₹{(150 - subtotal).toFixed(0)} more for free shipping.</p>
                )}
                <div className="pt-4 border-t border-slate-grey/20 flex justify-between font-headline-md text-headline-md">
                  <span>Total</span>
                  <span>₹{grandTotal.toFixed(2)}</span>
                </div>
              </div>

              <button
                onClick={async (e) => {
                  e.preventDefault();
                  if (!isLoggedIn) {
                    showToast("Please sign in to proceed to checkout.");
                    setTimeout(() => router.push("/account"), 1200);
                    return;
                  }
                  try {
                    const { validateStock } = await import("@/utils/api");
                    await validateStock(items.map(i => ({ id: i.id, title: i.title, quantity: i.quantity })));
                    router.push("/checkout/shipping");
                  } catch (err: any) {
                    showToast(err.message || "Some items are out of stock.");
                  }
                }}
                className="w-full bg-deep-navy text-pure-white font-button text-button uppercase tracking-widest py-4 hover:bg-ink-black transition-colors text-center block cursor-pointer"
              >
                Proceed to Checkout
              </button>

              <Link href="/collections/silent-center" className="flex items-center justify-center gap-1 font-label-caps text-[10px] text-slate-grey hover:text-deep-navy uppercase tracking-widest transition-colors">
                <span className="material-symbols-outlined text-[14px]">arrow_back</span>
                Continue Shopping
              </Link>
            </div>
          </div>
        </div>

        {/* Trust Badges */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-gutter mt-section-gap pt-stack-lg border-t border-slate-grey/20">
          {[
            { icon: "local_shipping", label: "Free Shipping", sub: "On orders over ₹5,000" },
            { icon: "keyboard_return", label: "Easy Returns", sub: "30-day returns" },
            { icon: "verified", label: "2-Year Warranty", sub: "Guaranteed quality" },
            { icon: "redeem", label: "Gift Packaging", sub: "Always included" },
          ].map((b) => (
            <div key={b.label} className="flex flex-col items-center text-center gap-2">
              <span className="material-symbols-outlined text-deep-navy text-[24px]">{b.icon}</span>
              <span className="font-label-caps text-[10px] text-ink-black uppercase tracking-wider">{b.label}</span>
              <span className="text-[10px] text-slate-grey font-body-md">{b.sub}</span>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
