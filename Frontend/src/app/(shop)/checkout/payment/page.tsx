"use client";

import React, { useEffect, useState, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useCart } from "@/context/CartContext";
import { createPaymentOrder, fetchPaymentConfig, verifyPayment } from "@/utils/api";
import { useAuth } from "@/context/AuthContext";
import { useCurrency } from "@/context/CurrencyContext";
import { useCheckoutStorage } from "@/hooks/useCheckoutStorage";
import OrderSummary from "@/components/checkout/OrderSummary";
import RazorpayPaymentSection from "@/components/checkout/RazorpayPaymentSection";
import { RazorpayOptions, RazorpayResponse } from "@/types/checkout";

declare global {
  interface Window {
    Razorpay: new (options: RazorpayOptions) => { open: () => void };
  }
}

export default function PaymentPage() {
  const router = useRouter();
  const { isLoggedIn } = useAuth();
  const { formatPrice } = useCurrency();
  const { items, subtotal, discount, promoCode, promoType, clearCart, isGiftWrapped, giftMessage, giftWrapPrice } = useCart();
  const { shipping, setOrder, isLoaded } = useCheckoutStorage();

  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<"idle" | "processing" | "verifying" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [sdkReady, setSdkReady] = useState(false);
  const [paymentConfig, setPaymentConfig] = useState<{
    keyId: string | null;
    currency: string;
    enabled: boolean;
    devMode: boolean;
  } | null>(null);
  const razorpayLoaded = useRef(false);

  // Discount calculation
  const discountAmount = useMemo(() => {
    if (promoType === "percentage") return (subtotal * discount) / 100;
    if (promoType === "fixed") return Math.min(discount, subtotal);
    return 0;
  }, [subtotal, discount, promoType]);

  const grandTotal = useMemo(() => {
    return shipping?.grandTotal ?? Math.max(0, subtotal - discountAmount);
  }, [shipping, subtotal, discountAmount]);

  useEffect(() => {
    if (!isLoggedIn) {
      router.push("/account");
      return;
    }

    if (isLoaded && !shipping) {
      router.push("/checkout/shipping");
      return;
    }

    if (items.length === 0) {
      router.push("/cart");
      return;
    }

    // Fetch Razorpay Payment Configuration
    fetchPaymentConfig()
      .then(setPaymentConfig)
      .catch((err) => {
        console.error("Failed to load Razorpay config:", err);
        setPaymentConfig({ keyId: null, currency: "INR", enabled: false, devMode: true });
      });

    // Load Razorpay SDK once
    const existingScript = document.getElementById("razorpay-sdk") as HTMLScriptElement | null;
    if (!razorpayLoaded.current && !existingScript) {
      const script = document.createElement("script");
      script.id = "razorpay-sdk";
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.async = true;
      script.onload = () => setSdkReady(true);
      script.onerror = () => {
        setSdkReady(false);
        setErrorMsg("Could not load Razorpay checkout SDK. Please check your network connection.");
      };
      document.head.appendChild(script);
      razorpayLoaded.current = true;
    } else if (typeof window !== "undefined" && window.Razorpay) {
      setSdkReady(true);
    } else if (existingScript) {
      existingScript.addEventListener("load", () => setSdkReady(true), { once: true });
      existingScript.addEventListener(
        "error",
        () => {
          setSdkReady(false);
          setErrorMsg("Could not load Razorpay checkout SDK. Please check your network connection.");
        },
        { once: true }
      );
    }
  }, [isLoggedIn, items.length, isLoaded, shipping, router]);

  const handlePayNow = async () => {
    if (!shipping) return;
    setLoading(true);
    setStatus("processing");
    setErrorMsg("");

    try {
      // 1. Create Razorpay Order via Backend
      const { order, devMode } = await createPaymentOrder({
        amount: Number(grandTotal.toFixed(2)),
        currency: shipping.currency || "INR",
        receipt: `vrix_${Date.now()}`,
        customerName: shipping.fullName,
        customerPhone: shipping.phone,
        email: shipping.email,
        address: shipping.apartment ? `${shipping.address}, ${shipping.apartment}` : shipping.address,
        city: shipping.city,
        postalCode: shipping.postalCode,
        notes: {
          customerEmail: shipping.email,
          customerName: shipping.fullName,
          customerPhone: shipping.phone,
          address: shipping.apartment ? `${shipping.address}, ${shipping.apartment}` : shipping.address,
          city: shipping.city,
          postalCode: shipping.postalCode,
        },
      });

      // 2. Dev Mode Fallback Simulation
      if (devMode) {
        setStatus("verifying");
        const fakePaymentId = `pay_dev_${Date.now()}`;
        try {
          await verifyPayment({
            razorpay_order_id: order.id,
            razorpay_payment_id: fakePaymentId,
            razorpay_signature: "dev_signature",
            items,
            promoCode: promoCode || undefined,
            isGiftWrapped,
            giftMessage,
            giftWrapPrice,
          });

          clearCart();
          setOrder({
            orderId: order.id,
            paymentId: fakePaymentId,
            amount: grandTotal,
            email: shipping.email,
            name: shipping.fullName,
          });

          setStatus("success");
          setTimeout(() => router.push("/checkout/confirmation"), 1200);
        } catch (err: any) {
          setStatus("error");
          setErrorMsg(err.message || "Dev mode payment verification failed.");
        }
        return;
      }

      // 3. Trigger Razorpay SDK Modal
      const rzpKey = paymentConfig?.keyId;
      if (!rzpKey) throw new Error("Razorpay public key is not configured.");
      if (!sdkReady || !window.Razorpay) throw new Error("Razorpay SDK is still loading. Please try again.");

      setStatus("idle");
      setLoading(false);

      const rzp = new window.Razorpay({
        key: rzpKey,
        amount: order.amount,
        currency: order.currency,
        name: "VRIX",
        description: `Order ${order.id}`,
        image: "/logos/black.png",
        order_id: order.id,
        prefill: {
          name: shipping.fullName,
          email: shipping.email,
          contact: shipping.phone,
        },
        notes: { address: `${shipping.address}, ${shipping.city}, ${shipping.postalCode}` },
        theme: { color: "#0f1728" },
        modal: {
          ondismiss: () => {
            setStatus("idle");
            setLoading(false);
          },
        },
        handler: async (response: RazorpayResponse) => {
          setStatus("verifying");
          setLoading(true);
          try {
            await verifyPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              items,
              promoCode: promoCode || undefined,
              isGiftWrapped,
              giftMessage,
              giftWrapPrice,
            });

            clearCart();
            setOrder({
              orderId: response.razorpay_order_id,
              paymentId: response.razorpay_payment_id,
              amount: grandTotal,
              email: shipping.email,
              name: shipping.fullName,
            });

            setStatus("success");
            setTimeout(() => router.push("/checkout/confirmation"), 1200);
          } catch (err: any) {
            setStatus("error");
            const text = err.message || "Payment verification failed.";
            setErrorMsg(`${text} Please contact support if your money was deducted. Order ID: ${response.razorpay_order_id}`);
          } finally {
            setLoading(false);
          }
        },
      });

      rzp.open();
    } catch (err: any) {
      setStatus("error");
      setErrorMsg(err.message || "Failed to initiate payment. Please try again.");
      setLoading(false);
    }
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

          {/* Modular Razorpay Section */}
          <RazorpayPaymentSection
            shipping={shipping}
            grandTotal={grandTotal}
            promoCode={promoCode || undefined}
            status={status}
            loading={loading}
            sdkReady={sdkReady}
            paymentConfig={paymentConfig}
            errorMsg={errorMsg}
            formatPrice={formatPrice}
            onPayNow={handlePayNow}
            onResetStatus={() => setStatus("idle")}
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
