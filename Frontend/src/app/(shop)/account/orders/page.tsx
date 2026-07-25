"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useCurrency } from "@/context/CurrencyContext";
import { fetchPaymentLogs } from "@/utils/api";

interface OrderLog {
  id: string;
  orderId: string;
  paymentId?: string;
  amount: number;
  currency: string;
  status: string;
  userEmail?: string;
  createdAt: string;
  customerName?: string;
  customerPhone?: string;
  address?: string;
  city?: string;
  postalCode?: string;
}

const STATUS_STEPS: Record<string, number> = {
  CREATED: 1,
  PENDING: 1,
  SUCCESS: 2,
  PAID: 2,
  PROCESSING: 2,
  SHIPPED: 3,
  DELIVERED: 4,
};

const STEP_LABELS = ["Order Placed", "Payment Verified", "Out for Delivery", "Delivered"];

export default function OrderTrackingPage() {
  const { user, isLoggedIn } = useAuth();
  const { formatPrice } = useCurrency();
  const [orders, setOrders] = useState<OrderLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchId, setSearchId] = useState("");
  const [searchEmail, setSearchEmail] = useState(user?.email || "");
  const [searchedOrder, setSearchedOrder] = useState<OrderLog | null>(null);
  const [searchMsg, setSearchMsg] = useState("");

  const loadUserOrders = async (email: string) => {
    setLoading(true);
    try {
      const logs = await fetchPaymentLogs();
      const userLogs = logs.filter(
        (l: any) => l.userEmail?.toLowerCase() === email.toLowerCase()
      );
      setOrders(userLogs);
    } catch (err: any) {
      console.error("Failed to load orders:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isLoggedIn && user?.email) {
      loadUserOrders(user.email);
    } else {
      setLoading(false);
    }
  }, [isLoggedIn, user?.email]);

  const handleSearchOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchId.trim()) return;
    setSearchMsg("");
    setLoading(true);
    try {
      const logs = await fetchPaymentLogs();
      const found = logs.find(
        (l: any) =>
          l.orderId?.toLowerCase() === searchId.trim().toLowerCase() ||
          l.paymentId?.toLowerCase() === searchId.trim().toLowerCase()
      );
      if (found) {
        setSearchedOrder(found);
      } else {
        setSearchedOrder(null);
        setSearchMsg(`No order found matching "${searchId.trim()}". Check your Order ID and try again.`);
      }
    } catch (err: any) {
      setSearchMsg("Failed to search order: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const getStepProgress = (status: string = "") => {
    const norm = status.toUpperCase();
    return STATUS_STEPS[norm] || 1;
  };

  return (
    <div className="w-full min-h-screen bg-soft-linen/30">
      <main className="max-w-4xl mx-auto px-margin-mobile md:px-0 py-section-gap space-y-8">
        
        {/* Header */}
        <div className="border-b border-slate-grey/20 pb-6 text-center md:text-left space-y-2">
          <div className="flex items-center justify-center md:justify-start gap-2">
            <span className="material-symbols-outlined text-deep-navy text-2xl">local_shipping</span>
            <h1 className="font-display-lg text-headline-md text-deep-navy uppercase tracking-wider">
              Order Tracking & History
            </h1>
          </div>
          <p className="font-body-md text-slate-grey text-sm">
            Track real-time delivery status, view payment logs, and review past commission receipts.
          </p>
        </div>

        {/* ─── Search Bar ────────────────────────────────────────────── */}
        <div className="bg-pure-white border border-slate-grey/20 p-6 shadow-sm space-y-4">
          <h2 className="font-label-caps text-xs text-deep-navy uppercase tracking-widest">
            Track Specific Order
          </h2>
          <form onSubmit={handleSearchOrder} className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              value={searchId}
              onChange={(e) => setSearchId(e.target.value)}
              placeholder="Enter Order ID (e.g. order_dev_... or vrix_...)"
              required
              className="flex-1 border-b border-slate-grey/30 py-2.5 px-1 focus:border-deep-navy outline-none font-body-md text-sm text-ink-black bg-transparent"
            />
            <button
              type="submit"
              className="bg-deep-navy text-pure-white px-6 py-2.5 font-button text-xs uppercase tracking-widest hover:bg-ink-black transition-colors flex items-center justify-center gap-2 cursor-pointer shrink-0"
            >
              <span className="material-symbols-outlined text-[16px]">search</span>
              Track Order
            </button>
          </form>
          {searchMsg && <p className="text-xs text-red-600 font-body-md">{searchMsg}</p>}
        </div>

        {/* ─── Searched Order Result ─────────────────────────────────── */}
        {searchedOrder && (
          <div className="bg-pure-white border border-deep-navy/30 p-6 md:p-8 shadow-md space-y-6 animate-fade-in">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-grey/15 pb-4">
              <div>
                <span className="font-label-caps text-[9px] text-slate-grey uppercase tracking-widest">ORDER RESULT</span>
                <h3 className="font-headline-md text-lg text-deep-navy font-bold">{searchedOrder.orderId}</h3>
                {searchedOrder.paymentId && <p className="text-xs text-slate-grey mt-0.5">Payment ID: {searchedOrder.paymentId}</p>}
              </div>
              <div className="text-right">
                <span className="font-label-caps text-[9px] text-slate-grey uppercase tracking-widest">TOTAL AMOUNT</span>
                <p className="font-headline-md text-xl text-deep-navy font-bold">{formatPrice(searchedOrder.amount)}</p>
              </div>
            </div>

            {/* Stepper Progress */}
            <div className="space-y-3 pt-2">
              <span className="font-label-caps text-[10px] text-slate-grey uppercase tracking-widest">Delivery Timeline</span>
              <div className="grid grid-cols-4 gap-2 relative">
                {STEP_LABELS.map((label, idx) => {
                  const stepNum = idx + 1;
                  const currentStep = getStepProgress(searchedOrder.status);
                  const isDone = stepNum <= currentStep;
                  const isCurrent = stepNum === currentStep;

                  return (
                    <div key={label} className="flex flex-col items-center text-center gap-2">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center font-label-caps text-xs transition-colors ${
                          isCurrent
                            ? "bg-deep-navy text-pure-white ring-4 ring-deep-navy/20 font-bold"
                            : isDone
                            ? "bg-emerald-600 text-pure-white"
                            : "bg-slate-grey/20 text-slate-grey"
                        }`}
                      >
                        {isDone ? <span className="material-symbols-outlined text-[16px]">check</span> : stepNum}
                      </div>
                      <span className={`font-label-caps text-[9px] uppercase tracking-wider ${isDone ? "text-deep-navy font-semibold" : "text-slate-grey"}`}>
                        {label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Shipping Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-soft-linen/30 p-4 border border-slate-grey/15 text-xs font-body-md">
              <div>
                <p className="font-label-caps text-[9px] text-slate-grey uppercase tracking-widest mb-1">Customer Details</p>
                <p className="font-semibold text-ink-black">{searchedOrder.customerName || searchedOrder.userEmail || "N/A"}</p>
                <p className="text-slate-grey">{searchedOrder.userEmail}</p>
                <p className="text-slate-grey">{searchedOrder.customerPhone}</p>
              </div>
              <div>
                <p className="font-label-caps text-[9px] text-slate-grey uppercase tracking-widest mb-1">Destination Address</p>
                <p className="text-ink-black">{[searchedOrder.address, searchedOrder.city, searchedOrder.postalCode].filter(Boolean).join(", ") || "Standard Delivery"}</p>
              </div>
            </div>
          </div>
        )}

        {/* ─── Logged-In User Orders List ───────────────────────────── */}
        {isLoggedIn && (
          <div className="bg-pure-white border border-slate-grey/20 p-6 md:p-8 shadow-sm space-y-6">
            <h2 className="font-headline-md text-base text-deep-navy uppercase tracking-wider border-b border-slate-grey/15 pb-3">
              Your Orders ({orders.length})
            </h2>

            {loading ? (
              <div className="h-32 flex items-center justify-center text-slate-grey text-xs font-label-caps uppercase tracking-widest">
                Loading orders…
              </div>
            ) : orders.length === 0 ? (
              <div className="h-32 flex flex-col items-center justify-center gap-2 text-slate-grey">
                <span className="material-symbols-outlined text-3xl opacity-40">shopping_bag</span>
                <p className="text-xs font-label-caps uppercase tracking-widest">No order history found</p>
                <Link href="/collections/silent-center" className="text-xs text-deep-navy underline">Explore Collections</Link>
              </div>
            ) : (
              <div className="space-y-4 divide-y divide-slate-grey/10">
                {orders.map((ord) => {
                  const step = getStepProgress(ord.status);
                  return (
                    <div key={ord.id} className="pt-4 first:pt-0 space-y-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <p className="font-body-md text-sm font-bold text-deep-navy">{ord.orderId}</p>
                          <p className="text-[10px] text-slate-grey font-label-caps uppercase">
                            Placed on {new Date(ord.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={`text-[9px] font-label-caps uppercase tracking-widest px-2.5 py-1 border ${
                            ord.status === "DELIVERED"
                              ? "bg-blue-50 text-blue-700 border-blue-200"
                              : ord.status === "SUCCESS" || ord.status === "PAID"
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : "bg-amber-50 text-amber-700 border-amber-200"
                          }`}>
                            {ord.status}
                          </span>
                          <span className="font-headline-md text-sm font-bold text-ink-black">{formatPrice(ord.amount)}</span>
                        </div>
                      </div>

                      {/* Timeline Mini Bar */}
                      <div className="w-full bg-slate-grey/10 h-1.5 rounded-full overflow-hidden">
                        <div
                          className="bg-deep-navy h-full rounded-full transition-all"
                          style={{ width: `${(step / 4) * 100}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-[9px] font-label-caps text-slate-grey uppercase tracking-wider">
                        <span>Order Placed</span>
                        <span>Paid & Verified</span>
                        <span>Out for Delivery</span>
                        <span>Delivered</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Return to account link */}
        <div className="text-center">
          <Link href="/account" className="font-label-caps text-xs text-slate-grey hover:text-deep-navy underline uppercase tracking-widest">
            ← Return to Account Dashboard
          </Link>
        </div>
      </main>
    </div>
  );
}
