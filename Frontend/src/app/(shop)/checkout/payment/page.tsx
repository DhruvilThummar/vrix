"use client";

import React, { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useCart } from "@/context/CartContext";
import { createPaymentOrder, fetchPaymentConfig, verifyPayment } from "@/utils/api";
import { useAuth } from "@/context/AuthContext";

declare global {
  interface Window {
    Razorpay: any;
  }
}

interface ShippingData {
  email: string;
  fullName: string;
  country: string;
  address: string;
  apartment?: string;
  city: string;
  postalCode: string;
  phone: string;
  grandTotal: number;
  currency: string;
}

export default function PaymentPage() {
  const router = useRouter();
  const { isLoggedIn } = useAuth();
  const { items, subtotal, discount, promoCode, promoType, clearCart } = useCart();
  const [shipping, setShipping] = useState<ShippingData | null>(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<"idle" | "processing" | "verifying" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [paidOrderId, setPaidOrderId] = useState("");
  const [sdkReady, setSdkReady] = useState(false);
  const [paymentConfig, setPaymentConfig] = useState<{
    keyId: string | null;
    currency: string;
    enabled: boolean;
    devMode: boolean;
  } | null>(null);
  const razorpayLoaded = useRef(false);

  const discountAmount =
    promoType === "percentage"
      ? (subtotal * discount) / 100
      : promoType === "fixed"
      ? Math.min(discount, subtotal)
      : 0;

  useEffect(() => {
    if (!isLoggedIn) {
      router.push("/account");
      return;
    }
    // Load shipping from sessionStorage
    const savedShipping = sessionStorage.getItem("vrix-shipping");
    if (savedShipping) {
      setShipping(JSON.parse(savedShipping));
    } else {
      router.push("/checkout/shipping");
    }

    // Redirect if cart empty
    if (items.length === 0) router.push("/cart");

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
        setErrorMsg("Could not load Razorpay checkout. Please check your connection and try again.");
      };
      document.head.appendChild(script);
      razorpayLoaded.current = true;
    } else if (window.Razorpay) {
      setSdkReady(true);
    } else if (existingScript) {
      existingScript.addEventListener("load", () => setSdkReady(true), { once: true });
      existingScript.addEventListener("error", () => {
        setSdkReady(false);
        setErrorMsg("Could not load Razorpay checkout. Please check your connection and try again.");
      }, { once: true });
    }
  }, [isLoggedIn, items.length, router]);

  const grandTotal = shipping?.grandTotal ?? subtotal - discountAmount;

  const handlePayNow = async () => {
    if (!shipping) return;
    setLoading(true);
    setStatus("processing");
    setErrorMsg("");

    try {
      // 1. Create Razorpay order via backend
      const { order, devMode } = await createPaymentOrder({
        amount: Number(grandTotal.toFixed(2)), // in INR; backend converts to paise.
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

      // 2. Dev mode — skip Razorpay modal, go straight to verify
      if (devMode) {
        setStatus("verifying");
        const fakePaymentId = "pay_dev_" + Date.now();
        await verifyPayment({
          razorpay_order_id: order.id,
          razorpay_payment_id: fakePaymentId,
          razorpay_signature: "dev_signature",
          items: items,
        });
        setPaidOrderId(order.id);
        clearCart();
        sessionStorage.removeItem("vrix-shipping");
        sessionStorage.setItem("vrix-order", JSON.stringify({ orderId: order.id, amount: grandTotal, email: shipping.email, name: shipping.fullName }));
        setStatus("success");
        setTimeout(() => router.push("/checkout/confirmation"), 1500);
        return;
      }

      // 3. Open Razorpay checkout modal
      const rzpKey = paymentConfig?.keyId;
      if (!rzpKey) {
        throw new Error("Razorpay public key is not configured.");
      }
      if (!sdkReady || !window.Razorpay) {
        throw new Error("Razorpay checkout is still loading. Please try again in a moment.");
      }

      setStatus("idle");
      setLoading(false);

      const rzp = new window.Razorpay({
        key: rzpKey,
        amount: order.amount,
        currency: order.currency,
        name: "VRIX",
        description: `Order ${order.id}`,
        image: "/logos/white.png",
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
        handler: async (response: {
          razorpay_payment_id: string;
          razorpay_order_id: string;
          razorpay_signature: string;
        }) => {
          setStatus("verifying");
          setLoading(true);
          try {
            await verifyPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              items: items,
            });
            setPaidOrderId(response.razorpay_order_id);
            clearCart();
            sessionStorage.removeItem("vrix-shipping");
            sessionStorage.setItem("vrix-order", JSON.stringify({
              orderId: response.razorpay_order_id,
              paymentId: response.razorpay_payment_id,
              amount: grandTotal,
              email: shipping.email,
              name: shipping.fullName,
            }));
            setStatus("success");
            setTimeout(() => router.push("/checkout/confirmation"), 1500);
          } catch (err: any) {
            setStatus("error");
            setErrorMsg(err.message || "Payment verification failed. Contact support.");
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

  if (!shipping) {
    return (
      <div className="min-h-screen flex items-center justify-center text-slate-grey font-label-caps text-xs tracking-widest">
        Loading…
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-pure-white">
      <main className="flex-grow w-full max-w-5xl mx-auto px-margin-mobile md:px-0 py-section-gap grid grid-cols-1 lg:grid-cols-5 gap-12">

        {/* ─── Left: Payment Options ─────────────────────── */}
        <div className="lg:col-span-3 flex flex-col">
          {/* Progress */}
          <nav className="mb-8">
            <ol className="flex items-center border-b border-slate-grey/20 pb-4">
              {[
                { step: "1", label: "Shipping", done: true },
                { step: "2", label: "Payment", active: true },
                { step: "3", label: "Confirmation", active: false },
              ].map((s) => (
                <li key={s.step} className="relative text-center flex-1">
                  <span className={`font-label-caps text-[10px] uppercase tracking-widest block pb-4 border-b-2 transition-colors ${s.active ? "border-deep-navy text-deep-navy font-semibold" : s.done ? "border-slate-grey/30 text-slate-grey" : "border-transparent text-slate-grey"}`}>
                    {s.step} · {s.label}
                  </span>
                </li>
              ))}
            </ol>
          </nav>

          <h1 className="font-headline-md text-headline-md mb-8 uppercase tracking-wider">Payment</h1>

          {/* Shipping Summary */}
          <div className="bg-soft-linen/40 border border-slate-grey/20 p-5 mb-6 space-y-3">
            <div className="flex justify-between items-center">
              <span className="font-label-caps text-[10px] uppercase tracking-widest text-slate-grey">Delivering to</span>
              <button onClick={() => router.push("/checkout/shipping")} className="font-label-caps text-[10px] uppercase tracking-widest text-deep-navy hover:underline cursor-pointer">Change</button>
            </div>
            <div className="space-y-1">
              <p className="font-body-md text-sm text-ink-black font-semibold">{shipping.fullName}</p>
              <p className="font-body-md text-xs text-slate-grey">{shipping.address}{shipping.apartment ? `, ${shipping.apartment}` : ""}</p>
              <p className="font-body-md text-xs text-slate-grey">{shipping.city}, {shipping.postalCode}</p>
              <p className="font-body-md text-xs text-slate-grey">{shipping.email} · {shipping.phone}</p>
            </div>
          </div>

          {/* Razorpay Payment Section */}
          <div className="border border-slate-grey/20 p-6 space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-deep-navy flex items-center justify-center">
                <span className="material-symbols-outlined text-pure-white text-[16px]">lock</span>
              </div>
              <div>
                <p className="font-body-md text-sm font-semibold text-ink-black">Secure Payment via Razorpay</p>
                <p className="text-[10px] text-slate-grey font-body-md">Supports UPI, Cards, Net Banking, Wallets</p>
              </div>
              <img src="https://razorpay.com/assets/razorpay-glyph.svg" alt="Razorpay" className="h-6 ml-auto opacity-60" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
            </div>

            {/* Payment method icons */}
            <div className="grid grid-cols-4 gap-3">
              {[
                { icon: "credit_card", label: "Cards" },
                { icon: "account_balance", label: "Net Banking" },
                { icon: "qr_code_2", label: "UPI" },
                { icon: "account_balance_wallet", label: "Wallets" },
              ].map((m) => (
                <div key={m.label} className="border border-slate-grey/20 p-3 flex flex-col items-center gap-1.5 bg-soft-linen/30">
                  <span className="material-symbols-outlined text-slate-grey text-[20px]">{m.icon}</span>
                  <span className="font-label-caps text-[9px] text-slate-grey uppercase tracking-widest">{m.label}</span>
                </div>
              ))}
            </div>

            {/* Amount to pay */}
            <div className="bg-deep-navy/5 border border-deep-navy/15 p-4 flex justify-between items-center">
              <div>
                <p className="font-label-caps text-[10px] uppercase tracking-widest text-slate-grey">Amount to Pay</p>
                <p className="font-headline-md text-2xl text-deep-navy font-bold mt-1">₹{grandTotal.toFixed(2)}</p>
              </div>
              {promoCode && (
                <div className="text-right">
                  <p className="text-[9px] text-slate-grey font-label-caps uppercase tracking-widest">Code Applied</p>
                  <p className="text-sm text-green-700 font-body-md font-semibold">{promoCode}</p>
                </div>
              )}
            </div>

            {/* Status Messages */}
            {status === "processing" && (
              <div className="flex items-center gap-3 text-slate-grey font-body-md text-sm">
                <span className="w-4 h-4 border-2 border-slate-grey border-t-transparent rounded-full animate-spin" />
                Creating your order…
              </div>
            )}
            {status === "verifying" && (
              <div className="flex items-center gap-3 text-deep-navy font-body-md text-sm">
                <span className="w-4 h-4 border-2 border-deep-navy border-t-transparent rounded-full animate-spin" />
                Verifying payment signature…
              </div>
            )}
            {status === "success" && (
              <div className="flex items-center gap-3 text-green-700 font-body-md text-sm">
                <span className="material-symbols-outlined text-[20px]">check_circle</span>
                Payment verified! Redirecting…
              </div>
            )}
            {status === "error" && (
              <div className="bg-red-50 border border-red-200 p-4 rounded-sm">
                <p className="text-red-700 text-sm font-body-md flex items-start gap-2">
                  <span className="material-symbols-outlined text-[16px] mt-0.5 shrink-0">error</span>
                  {errorMsg}
                </p>
                <button onClick={() => setStatus("idle")} className="mt-2 text-[10px] font-label-caps uppercase tracking-widest text-red-600 hover:underline cursor-pointer">Try Again</button>
              </div>
            )}

            {/* Pay Button */}
            {(status === "idle" || status === "error") && (
              <button
                onClick={handlePayNow}
                disabled={loading || !paymentConfig || (!paymentConfig.devMode && (!sdkReady || !paymentConfig.keyId))}
                className="w-full bg-deep-navy text-pure-white py-5 font-button uppercase tracking-widest hover:bg-ink-black transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-3 text-base"
              >
                <span className="material-symbols-outlined text-[18px]">lock</span>
                {!paymentConfig || (!paymentConfig.devMode && !sdkReady)
                  ? "Loading secure checkout..."
                  : `Pay ₹${grandTotal.toFixed(2)} Securely`}
              </button>
            )}

            <p className="text-[10px] text-slate-grey font-body-md text-center">
              By completing your order you agree to our <a href="/legal" className="underline hover:text-deep-navy">Terms & Conditions</a>
            </p>
          </div>

          <Link className="block text-center mt-6 font-label-caps text-[10px] text-slate-grey hover:text-ink-black underline decoration-1 underline-offset-4 transition-colors" href="/checkout/shipping">
            ← Back to Shipping
          </Link>
        </div>

        {/* ─── Right: Order Summary ─────────────────────── */}
        <div className="lg:col-span-2">
          <div className="sticky top-28 bg-soft-linen/40 border border-slate-grey/20 p-6 space-y-5">
            <h2 className="font-label-caps text-[10px] uppercase tracking-widest text-slate-grey border-b border-slate-grey/20 pb-3">Order Summary</h2>

            {/* Items */}
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {items.map((item) => (
                <div key={`${item.id}-${item.size}`} className="flex gap-3 items-center">
                  <div className="w-12 h-14 bg-pure-white border border-slate-grey/15 relative overflow-hidden shrink-0">
                    <img src={item.image} alt={item.title} className="w-full h-full object-cover mix-blend-multiply" />
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-deep-navy text-pure-white text-[8px] flex items-center justify-center rounded-full font-bold">{item.quantity}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-body-md text-ink-black truncate">{item.title}</p>
                    <p className="text-[10px] text-slate-grey">{item.material}</p>
                    {item.size && <p className="text-[10px] text-slate-grey">Size: {item.size}</p>}
                  </div>
                  <p className="text-xs font-semibold text-deep-navy">₹{(item.price * item.quantity).toLocaleString()}</p>
                </div>
              ))}
            </div>

            {/* Price breakdown */}
            <div className="space-y-2 text-sm font-body-md text-ink-black border-t border-slate-grey/20 pt-4">
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
                <span>{grandTotal >= 150 ? <span className="text-green-700">Free</span> : "₹15"}</span>
              </div>
              <div className="flex justify-between font-headline-md text-lg border-t border-slate-grey/20 pt-3 mt-2">
                <span>Total</span>
                <span>₹{grandTotal.toFixed(2)}</span>
              </div>
            </div>

            {/* Trust badges */}
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
        </div>
      </main>
    </div>
  );
}
