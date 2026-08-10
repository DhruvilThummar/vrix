"use client";

import React, { useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { useCurrency } from "@/context/CurrencyContext";
import { useCheckoutStorage } from "@/hooks/useCheckoutStorage";
import OrderSummary from "@/components/checkout/OrderSummary";
import PaymentGatewaysSection from "@/components/checkout/PaymentGatewaysSection";

export default function PaymentPage() {
  const router = useRouter();
  const { isLoggedIn } = useAuth();
  const { formatPrice, formatPriceRaw, currency, supportedCurrencies, setCurrency } = useCurrency();
  const { items, subtotal, discount, promoCode, promoType, clearCart, isGiftWrapped, giftMessage, giftWrapPrice } = useCart();
  const { shipping, setOrder, isLoaded } = useCheckoutStorage();

  const discountAmount = useMemo(() => {
    if (promoType === "percentage") return (subtotal * discount) / 100;
    if (promoType === "fixed") return Math.min(discount, subtotal);
    return 0;
  }, [subtotal, discount, promoType]);

  const grandTotal = useMemo(() => {
    return shipping?.grandTotal ?? Math.max(0, subtotal - discountAmount);
  }, [shipping, subtotal, discountAmount]);

  const paymentAmount = useMemo(() => formatPriceRaw(grandTotal), [formatPriceRaw, grandTotal]);

  useEffect(() => {
    if (!isLoggedIn) {
      router.push("/account");
      return;
    }

    if (isLoaded && !shipping) {
      router.push("/checkout/shipping");
      return;
    }

    if (isLoaded && items.length === 0) {
      router.push("/cart");
      return;
    }
  }, [isLoggedIn, items.length, isLoaded, shipping, router]);

  const handlePaymentSuccess = (orderId: string, paymentId: string) => {
    clearCart();
    setOrder({
      orderId,
      paymentId,
      amount: paymentAmount,
      email: shipping?.email || "",
      name: shipping?.fullName || "",
    });
    router.push("/checkout/confirmation");
  };

  if (!isLoaded || !shipping) {
    return (
      <div className="min-h-screen flex items-center justify-center text-slate-grey font-label-caps text-xs tracking-widest">
        Loading payment details…
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-pure-white">
      <main className="flex-grow w-full max-w-5xl mx-auto px-margin-mobile md:px-0 py-section-gap grid grid-cols-1 lg:grid-cols-5 gap-12">
        {/* Left Column: Payment Options */}
        <div className="lg:col-span-3 flex flex-col">
          {/* Step Progress Bar */}
          <nav className="mb-8">
            <ol className="flex items-center border-b border-slate-grey/20 pb-4">
              {[
                { step: "1", label: "Shipping", done: true },
                { step: "2", label: "Payment", active: true },
                { step: "3", label: "Confirmation", active: false },
              ].map((s) => (
                <li key={s.step} className="relative text-center flex-1">
                  <span
                    className={`font-label-caps text-[10px] uppercase tracking-widest block pb-4 border-b-2 transition-colors ${
                      s.active
                        ? "border-deep-navy text-deep-navy font-semibold"
                        : s.done
                        ? "border-slate-grey/30 text-slate-grey"
                        : "border-transparent text-slate-grey"
                    }`}
                  >
                    {s.step} · {s.label}
                  </span>
                </li>
              ))}
            </ol>
          </nav>

          <h1 className="font-headline-md text-headline-md mb-8 uppercase tracking-wider">Payment</h1>

          <div className="border border-slate-grey/20 bg-soft-linen/30 p-4 mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <p className="font-label-caps text-[10px] uppercase tracking-widest text-slate-grey">Payment currency</p>
              <p className="font-body-md text-xs text-ink-black mt-1">Your order total updates instantly when you change currency.</p>
            </div>
            <label className="relative shrink-0">
              <span className="sr-only">Select payment currency</span>
              <select
                value={currency}
                onChange={(event) => setCurrency(event.target.value)}
                className="appearance-none w-full sm:w-44 border border-deep-navy/30 bg-pure-white px-3 py-2.5 pr-9 text-xs font-label-caps tracking-wider text-deep-navy outline-none focus:border-deep-navy cursor-pointer"
              >
                {supportedCurrencies.map((option) => (
                  <option key={option.code} value={option.code}>{option.symbol} {option.code}</option>
                ))}
              </select>
              <span className="material-symbols-outlined pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[17px] text-deep-navy">expand_more</span>
            </label>
          </div>

          {/* Shipping Summary Box */}
          <div className="bg-soft-linen/40 border border-slate-grey/20 p-5 mb-6 space-y-3">
            <div className="flex justify-between items-center">
              <span className="font-label-caps text-[10px] uppercase tracking-widest text-slate-grey">Delivering to</span>
              <button
                onClick={() => router.push("/checkout/shipping")}
                className="font-label-caps text-[10px] uppercase tracking-widest text-deep-navy hover:underline cursor-pointer"
              >
                Change
              </button>
            </div>
            <div className="space-y-1">
              <p className="font-body-md text-sm text-ink-black font-semibold">{shipping.fullName}</p>
              <p className="font-body-md text-xs text-slate-grey">
                {shipping.address}
                {shipping.apartment ? `, ${shipping.apartment}` : ""}
              </p>
              <p className="font-body-md text-xs text-slate-grey">
                {shipping.city}, {shipping.postalCode}
              </p>
              <p className="font-body-md text-xs text-slate-grey">
                {shipping.email} · {shipping.phone}
              </p>
            </div>
          </div>

          {/* Unified Payment Gateway Integration */}
          <PaymentGatewaysSection
            grandTotal={grandTotal}
            promoCode={promoCode || undefined}
            currency={currency}
            shipping={shipping}
            items={items}
            isGiftWrapped={isGiftWrapped}
            giftMessage={giftMessage}
            giftWrapPrice={giftWrapPrice}
            formatPrice={formatPrice}
            formatPriceRaw={formatPriceRaw}
            onSuccess={handlePaymentSuccess}
          />

          <Link
            href="/checkout/shipping"
            className="block text-center mt-6 font-label-caps text-[10px] text-slate-grey hover:text-ink-black underline decoration-1 underline-offset-4 transition-colors"
          >
            ← Back to Shipping
          </Link>
        </div>

        {/* Right Column: Order Summary */}
        <div className="lg:col-span-2">
          <OrderSummary
            items={items}
            subtotal={subtotal}
            discountAmount={discountAmount}
            grandTotal={grandTotal}
            shipping={shipping}
            isGiftWrapped={isGiftWrapped}
            giftWrapPrice={giftWrapPrice}
          />
        </div>
      </main>
    </div>
  );
}
