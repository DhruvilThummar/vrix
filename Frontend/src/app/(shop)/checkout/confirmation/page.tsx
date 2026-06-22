"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";

interface OrderDetails {
  orderId: string;
  paymentId?: string;
  amount: number;
  email: string;
  name: string;
}

export default function ConfirmationPage() {
  const [order, setOrder] = useState<OrderDetails | null>(null);

  useEffect(() => {
    const saved = sessionStorage.getItem("vrix-order");
    if (saved) {
      setOrder(JSON.parse(saved));
      sessionStorage.removeItem("vrix-order");
    }
  }, []);

  return (
    <div className="w-full min-h-screen bg-pure-white flex items-center justify-center px-4">
      <main className="w-full max-w-xl text-center space-y-10 py-20">
        {/* Animated checkmark */}
        <div className="flex justify-center">
          <div className="w-24 h-24 border border-slate-grey/20 flex items-center justify-center bg-soft-linen/50 animate-fade-in">
            <span className="material-symbols-outlined text-[52px] text-deep-navy" style={{ fontVariationSettings: "'wght' 100, 'FILL' 0" }}>check_circle</span>
          </div>
        </div>

        {/* Thank you message */}
        <div className="space-y-4 animate-fade-in" style={{ animationDelay: "100ms" }}>
          <p className="font-label-caps text-[11px] uppercase tracking-widest text-slate-grey">Order Confirmed</p>
          <h1 className="font-display-lg text-3xl md:text-4xl text-ink-black tracking-tight uppercase">
            Thank you{order?.name ? `, ${order.name.split(" ")[0]}` : ""}
          </h1>
          <p className="font-body-md text-base text-slate-grey leading-relaxed">
            Your VRIX order has been received and is being prepared with care.
          </p>
        </div>

        {/* Order Details Card */}
        {order && (
          <div className="bg-soft-linen/40 border border-slate-grey/20 p-6 text-left space-y-4 animate-fade-in" style={{ animationDelay: "200ms" }}>
            <h2 className="font-label-caps text-[10px] uppercase tracking-widest text-slate-grey border-b border-slate-grey/15 pb-3">Order Details</h2>
            <div className="space-y-3">
              {[
                { label: "Order ID", value: order.orderId },
                ...(order.paymentId ? [{ label: "Payment ID", value: order.paymentId }] : []),
                { label: "Amount Paid", value: `₹${order.amount.toFixed(2)}` },
                { label: "Email", value: order.email },
              ].map((row) => (
                <div key={row.label} className="flex justify-between items-center">
                  <span className="font-label-caps text-[10px] uppercase tracking-widest text-slate-grey">{row.label}</span>
                  <span className="font-body-md text-sm text-ink-black font-medium">{row.value}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* What's next */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center animate-fade-in" style={{ animationDelay: "300ms" }}>
          {[
            { icon: "mail", title: "Confirmation Email", desc: "Sent to your inbox shortly" },
            { icon: "inventory_2", title: "Processing", desc: "Your order enters production" },
            { icon: "local_shipping", title: "Delivery", desc: "Delivered within 5–7 days" },
          ].map((s) => (
            <div key={s.title} className="border border-slate-grey/15 p-4 space-y-2">
              <span className="material-symbols-outlined text-deep-navy text-2xl">{s.icon}</span>
              <p className="font-label-caps text-[9px] uppercase tracking-widest text-ink-black">{s.title}</p>
              <p className="font-body-md text-[11px] text-slate-grey">{s.desc}</p>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in" style={{ animationDelay: "400ms" }}>
          <Link
            href="/collections/silent-center"
            className="inline-flex items-center justify-center bg-deep-navy text-pure-white font-button text-button px-10 py-4 hover:bg-ink-black transition-colors uppercase tracking-widest cursor-pointer gap-2"
          >
            <span className="material-symbols-outlined text-[16px]">storefront</span>
            Continue Shopping
          </Link>
          <Link
            href="/account"
            className="inline-flex items-center justify-center border border-slate-grey/30 text-ink-black font-button text-button px-10 py-4 hover:border-ink-black transition-colors uppercase tracking-widest cursor-pointer gap-2"
          >
            <span className="material-symbols-outlined text-[16px]">person</span>
            My Account
          </Link>
        </div>

        {/* Footer note */}
        <p className="font-body-md text-xs text-slate-grey animate-fade-in" style={{ animationDelay: "500ms" }}>
          Questions? Contact us at{" "}
          <a href="mailto:contact@vrix.com" className="text-deep-navy underline">contact@vrix.com</a>
        </p>
      </main>
    </div>
  );
}
