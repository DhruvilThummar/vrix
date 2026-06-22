"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCart } from "@/context/CartContext";
import { verifyPromo } from "@/utils/api";

export default function ShippingPage() {
  const router = useRouter();
  const { items, subtotal, discount, promoCode, promoType, applyPromo, clearPromo } = useCart();

  const [promoInput, setPromoInput] = useState("");
  const [promoLoading, setPromoLoading] = useState(false);
  const [promoError, setPromoError] = useState<string | null>(null);

  const discountAmount =
    promoType === "percentage"
      ? (subtotal * discount) / 100
      : promoType === "fixed"
      ? Math.min(discount, subtotal)
      : 0;
  const total = Math.max(0, subtotal - discountAmount);
  const shipping = total >= 150 ? 0 : 15;
  const grandTotal = total + shipping;

  // Redirect if cart is empty
  useEffect(() => {
    if (items.length === 0) router.push("/cart");
  }, [items, router]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const shippingData = {
      email: formData.get("email"),
      fullName: formData.get("full-name"),
      country: formData.get("country"),
      address: formData.get("address"),
      apartment: formData.get("apartment"),
      city: formData.get("city"),
      postalCode: formData.get("postal-code"),
      phone: formData.get("phone"),
      grandTotal,
      currency: "INR",
    };
    sessionStorage.setItem("vrix-shipping", JSON.stringify(shippingData));
    router.push("/checkout/payment");
  };

  const handleApplyPromo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!promoInput.trim()) return;
    setPromoLoading(true);
    setPromoError(null);
    try {
      const res = await verifyPromo(promoInput.trim());
      applyPromo(res.code, res.discount, res.type);
      setPromoInput("");
    } catch (err: any) {
      setPromoError(err.message || "Invalid code.");
    } finally {
      setPromoLoading(false);
    }
  };

  return (
    <div className="w-full min-h-screen bg-pure-white">
      <main className="flex-grow w-full max-w-5xl mx-auto px-margin-mobile md:px-0 py-section-gap grid grid-cols-1 lg:grid-cols-5 gap-12">

        {/* ─── Left: Form ─────────────────────────────────── */}
        <div className="lg:col-span-3 flex flex-col">
          {/* Progress */}
          <nav aria-label="Progress" className="mb-8">
            <ol className="flex items-center border-b border-slate-grey/20 pb-4" role="list">
              {[
                { step: "1", label: "Shipping", active: true },
                { step: "2", label: "Payment", active: false },
                { step: "3", label: "Confirmation", active: false },
              ].map((s) => (
                <li key={s.step} className="relative text-center flex-1">
                  <span className={`font-label-caps text-[10px] uppercase tracking-widest block pb-4 border-b-2 transition-colors ${s.active ? "border-deep-navy text-deep-navy font-semibold" : "border-transparent text-slate-grey"}`}>
                    {s.step} · {s.label}
                  </span>
                </li>
              ))}
            </ol>
          </nav>

          <h1 className="font-headline-md text-headline-md mb-8 uppercase tracking-wider">Shipping Information</h1>

          <form id="shipping-form" onSubmit={handleSubmit} className="space-y-6">
            {/* Contact */}
            <div className="space-y-4">
              <h2 className="font-label-caps text-[10px] text-slate-grey uppercase tracking-widest">Contact</h2>
              <div className="relative">
                <label className="sr-only" htmlFor="email">Email address</label>
                <input autoComplete="email" name="email" className="block w-full border-0 border-b border-slate-grey/30 bg-transparent py-3 pl-0 pr-10 text-ink-black placeholder:text-slate-grey focus:border-deep-navy focus:ring-0 font-body-md transition-colors" id="email" placeholder="Email address" required type="email" />
              </div>
            </div>

            {/* Address */}
            <div className="space-y-4">
              <h2 className="font-label-caps text-[10px] text-slate-grey uppercase tracking-widest">Shipping Address</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="col-span-full">
                  <label className="sr-only" htmlFor="country">Country</label>
                  <div className="relative">
                    <select autoComplete="country-name" name="country" className="block w-full border-0 border-b border-slate-grey/30 bg-transparent py-3 pl-0 pr-8 text-ink-black focus:border-deep-navy focus:ring-0 font-body-md appearance-none cursor-pointer" id="country">
                      <option value="IN">India</option>
                      <option value="US">United States</option>
                      <option value="GB">United Kingdom</option>
                      <option value="CA">Canada</option>
                      <option value="AU">Australia</option>
                      <option value="FR">France</option>
                      <option value="SG">Singapore</option>
                      <option value="AE">UAE</option>
                    </select>
                    <span className="material-symbols-outlined pointer-events-none absolute right-0 top-1/2 -translate-y-1/2 text-slate-grey text-[18px]">expand_more</span>
                  </div>
                </div>
                <div className="col-span-full">
                  <label className="sr-only" htmlFor="full-name">Full name</label>
                  <input autoComplete="name" name="full-name" className="block w-full border-0 border-b border-slate-grey/30 bg-transparent py-3 pl-0 text-ink-black placeholder:text-slate-grey focus:border-deep-navy focus:ring-0 font-body-md transition-colors" id="full-name" placeholder="Full name" required type="text" />
                </div>
                <div className="col-span-full">
                  <label className="sr-only" htmlFor="address">Address</label>
                  <input autoComplete="street-address" name="address" className="block w-full border-0 border-b border-slate-grey/30 bg-transparent py-3 pl-0 text-ink-black placeholder:text-slate-grey focus:border-deep-navy focus:ring-0 font-body-md transition-colors" id="address" placeholder="Address" required type="text" />
                </div>
                <div className="col-span-full">
                  <label className="sr-only" htmlFor="apartment">Apartment / Suite (optional)</label>
                  <input name="apartment" className="block w-full border-0 border-b border-slate-grey/30 bg-transparent py-3 pl-0 text-ink-black placeholder:text-slate-grey focus:border-deep-navy focus:ring-0 font-body-md transition-colors" id="apartment" placeholder="Apartment, suite, etc. (optional)" type="text" />
                </div>
                <div>
                  <label className="sr-only" htmlFor="city">City</label>
                  <input autoComplete="address-level2" name="city" className="block w-full border-0 border-b border-slate-grey/30 bg-transparent py-3 pl-0 text-ink-black placeholder:text-slate-grey focus:border-deep-navy focus:ring-0 font-body-md transition-colors" id="city" placeholder="City" required type="text" />
                </div>
                <div>
                  <label className="sr-only" htmlFor="postal-code">Post/Zip code</label>
                  <input autoComplete="postal-code" name="postal-code" className="block w-full border-0 border-b border-slate-grey/30 bg-transparent py-3 pl-0 text-ink-black placeholder:text-slate-grey focus:border-deep-navy focus:ring-0 font-body-md transition-colors" id="postal-code" placeholder="Pin code" required type="text" />
                </div>
                <div className="col-span-full">
                  <label className="sr-only" htmlFor="phone">Phone number</label>
                  <input autoComplete="tel" name="phone" className="block w-full border-0 border-b border-slate-grey/30 bg-transparent py-3 pl-0 text-ink-black placeholder:text-slate-grey focus:border-deep-navy focus:ring-0 font-body-md transition-colors" id="phone" placeholder="Phone number" required type="tel" />
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-slate-grey/20 flex gap-4 items-center">
              <button className="flex-1 bg-deep-navy text-pure-white py-4 px-6 font-button text-button uppercase tracking-widest hover:bg-ink-black transition-colors flex items-center justify-center gap-2 group cursor-pointer" type="submit">
                Continue to Payment
                <span className="material-symbols-outlined text-[18px] group-hover:translate-x-1 transition-transform">arrow_forward</span>
              </button>
              <Link className="font-label-caps text-[10px] text-slate-grey hover:text-ink-black underline decoration-1 underline-offset-4 transition-colors whitespace-nowrap" href="/cart">Return to Cart</Link>
            </div>
          </form>
        </div>

        {/* ─── Right: Order Summary ─────────────────────── */}
        <div className="lg:col-span-2">
          <div className="sticky top-28 bg-soft-linen/40 border border-slate-grey/20 p-6 space-y-5">
            <h2 className="font-label-caps text-[10px] uppercase tracking-widest text-slate-grey border-b border-slate-grey/20 pb-3">Order Summary</h2>

            {/* Items */}
            <div className="space-y-3 max-h-48 overflow-y-auto">
              {items.map((item) => (
                <div key={`${item.id}-${item.size}`} className="flex gap-3 items-center">
                  <div className="w-12 h-14 bg-pure-white border border-slate-grey/15 relative overflow-hidden shrink-0">
                    <img src={item.image} alt={item.title} className="w-full h-full object-cover mix-blend-multiply" />
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-deep-navy text-pure-white text-[8px] flex items-center justify-center rounded-full font-bold">{item.quantity}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-body-md text-ink-black truncate">{item.title}</p>
                    {item.size && <p className="text-[10px] text-slate-grey">Size: {item.size}</p>}
                  </div>
                  <p className="text-xs font-semibold text-deep-navy">${(item.price * item.quantity).toLocaleString()}</p>
                </div>
              ))}
            </div>

            {/* Promo */}
            {promoCode ? (
              <div className="flex items-center justify-between bg-green-50 border border-green-200 px-3 py-2">
                <p className="text-xs text-green-700 font-body-md"><span className="font-semibold">{promoCode}</span> — {discount}{promoType === "percentage" ? "%" : "₹"} off</p>
                <button onClick={clearPromo} className="text-green-600 hover:text-red-600 cursor-pointer"><span className="material-symbols-outlined text-[14px]">close</span></button>
              </div>
            ) : (
              <form onSubmit={handleApplyPromo} className="flex gap-2">
                <input
                  type="text"
                  value={promoInput}
                  onChange={(e) => { setPromoInput(e.target.value.toUpperCase()); setPromoError(null); }}
                  placeholder="Promo / Redeem code"
                  className="flex-1 border-b border-slate-grey/30 py-2 focus:border-deep-navy outline-none text-xs font-body-md uppercase tracking-widest bg-transparent text-ink-black"
                />
                <button type="submit" disabled={promoLoading} className="font-button text-[10px] uppercase px-3 py-1.5 border border-deep-navy text-deep-navy hover:bg-deep-navy hover:text-pure-white transition-colors cursor-pointer">
                  {promoLoading ? <span className="w-3 h-3 border border-deep-navy border-t-transparent rounded-full animate-spin inline-block" /> : "Apply"}
                </button>
              </form>
            )}
            {promoError && <p className="text-[10px] text-red-600 font-body-md">{promoError}</p>}

            {/* Price breakdown */}
            <div className="space-y-2 text-sm font-body-md text-ink-black border-t border-slate-grey/20 pt-4">
              <div className="flex justify-between">
                <span className="text-slate-grey">Subtotal</span>
                <span>₹{subtotal.toLocaleString()}</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-green-700">
                  <span>Discount</span>
                  <span>−₹{discountAmount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-slate-grey">Shipping</span>
                <span>{shipping === 0 ? <span className="text-green-700">Free</span> : `₹${shipping}`}</span>
              </div>
              <div className="flex justify-between font-headline-md text-base border-t border-slate-grey/20 pt-2 mt-2">
                <span>Total</span>
                <span>₹{grandTotal.toFixed(2)}</span>
              </div>
            </div>

            {/* Trust */}
            <div className="flex items-center gap-2 text-[10px] text-slate-grey font-body-md border-t border-slate-grey/15 pt-3">
              <span className="material-symbols-outlined text-[14px]">lock</span>
              Secured by Razorpay · 256-bit SSL
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
