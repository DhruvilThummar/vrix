"use client";

import React from "react";
import { ShippingData } from "@/types/checkout";

interface RazorpayPaymentSectionProps {
  shipping: ShippingData;
  grandTotal: number;
  promoCode?: string;
  status: "idle" | "processing" | "verifying" | "success" | "error";
  loading: boolean;
  sdkReady: boolean;
  paymentConfig: {
    keyId: string | null;
    currency: string;
    enabled: boolean;
    devMode: boolean;
  } | null;
  errorMsg: string;
  formatPrice: (amount: number) => string;
  onPayNow: () => void;
  onResetStatus: () => void;
}

export default function RazorpayPaymentSection({
  shipping,
  grandTotal,
  promoCode,
  status,
  loading,
  sdkReady,
  paymentConfig,
  errorMsg,
  formatPrice,
  onPayNow,
  onResetStatus,
}: RazorpayPaymentSectionProps) {
  const isDevMode = paymentConfig?.devMode ?? false;
  const isButtonDisabled = loading || !paymentConfig || (!isDevMode && (!sdkReady || !paymentConfig.keyId));

  return (
    <div className="border border-slate-grey/20 p-6 space-y-6 bg-pure-white">
      {/* Title Header */}
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 bg-deep-navy flex items-center justify-center shrink-0">
          <span className="material-symbols-outlined text-pure-white text-[16px]">lock</span>
        </div>
        <div>
          <p className="font-body-md text-sm font-semibold text-ink-black">Secure Payment via Razorpay</p>
          <p className="text-[10px] text-slate-grey font-body-md">Supports UPI, Cards, Net Banking, Wallets</p>
        </div>
        <img
          src="https://razorpay.com/assets/razorpay-glyph.svg"
          alt="Razorpay"
          className="h-6 ml-auto opacity-60"
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = "none";
          }}
        />
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
          <p className="font-headline-md text-2xl text-deep-navy font-bold mt-1">{formatPrice(grandTotal)}</p>
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
        <div className="flex items-center gap-3 text-slate-grey font-body-md text-sm p-3 bg-slate-50 border border-slate-200">
          <span className="w-4 h-4 border-2 border-slate-grey border-t-transparent rounded-full animate-spin" />
          Creating your secure order…
        </div>
      )}
      {status === "verifying" && (
        <div className="flex items-center gap-3 text-deep-navy font-body-md text-sm p-3 bg-deep-navy/5 border border-deep-navy/20">
          <span className="w-4 h-4 border-2 border-deep-navy border-t-transparent rounded-full animate-spin" />
          Verifying payment signature…
        </div>
      )}
      {status === "success" && (
        <div className="flex items-center gap-3 text-green-700 font-body-md text-sm p-3 bg-green-50 border border-green-200">
          <span className="material-symbols-outlined text-[20px]">check_circle</span>
          Payment verified! Redirecting to order confirmation…
        </div>
      )}
      {status === "error" && (
        <div className="bg-red-50 border border-red-200 p-4 rounded-sm">
          <p className="text-red-700 text-sm font-body-md flex items-start gap-2">
            <span className="material-symbols-outlined text-[16px] mt-0.5 shrink-0">error</span>
            {errorMsg}
          </p>
          <button
            onClick={onResetStatus}
            className="mt-2 text-[10px] font-label-caps uppercase tracking-widest text-red-600 hover:underline cursor-pointer"
          >
            Dismiss &amp; Try Again
          </button>
        </div>
      )}

      {/* Pay Button */}
      {(status === "idle" || status === "error") && (
        <button
          onClick={onPayNow}
          disabled={isButtonDisabled}
          className="w-full bg-deep-navy text-pure-white py-5 font-button uppercase tracking-widest hover:bg-ink-black transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-3 text-base shadow-md"
        >
          {loading || (!isDevMode && !sdkReady) ? (
            <>
              <span className="w-4 h-4 border-2 border-pure-white border-t-transparent rounded-full animate-spin" />
              <span>Loading Checkout…</span>
            </>
          ) : (
            <>
              <span className="material-symbols-outlined text-[18px]">lock</span>
              <span>Pay {shipping.currency || "INR"} {grandTotal.toFixed(2)} Securely</span>
            </>
          )}
        </button>
      )}

      <p className="text-[10px] text-slate-grey font-body-md text-center">
        By completing your order you agree to our{" "}
        <a href="/legal" className="underline hover:text-deep-navy">
          Terms &amp; Conditions
        </a>
      </p>
    </div>
  );
}
