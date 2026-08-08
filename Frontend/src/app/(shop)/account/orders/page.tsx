"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/context/AuthContext";
import { useCurrency } from "@/context/CurrencyContext";
import { fetchUserOrders, trackOrder, getApiBaseUrl } from "@/utils/api";
import { OrderItem, PaymentRecord, DeliveryStatus } from "@/types/order.types";

interface ExtendedOrderRecord extends PaymentRecord {
  parsedItems: OrderItem[];
  currentStep: number;
  progressPercentage: number;
  formattedEta: string;
  isExpanded?: boolean;
}

const STEP_LABELS = [
  { id: 1, label: "Order Placed", desc: "Payment received & logged" },
  { id: 2, label: "In Preparation", desc: "Quality check & packaging" },
  { id: 3, label: "Out for Delivery", desc: "OTP dispatched to email" },
  { id: 4, label: "Delivered", desc: "Verified at doorstep" },
];

export default function CustomerOrdersPage() {
  const { user, isLoggedIn } = useAuth();
  const { formatPrice } = useCurrency();

  const [orders, setOrders] = useState<ExtendedOrderRecord[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchedOrder, setSearchedOrder] = useState<ExtendedOrderRecord | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);

  // ─── HELPER: Parse Items ───────────────────────────────────────────────────
  const parseCartItems = (raw: string | OrderItem[] | null | undefined): OrderItem[] => {
    if (!raw) return [];
    if (Array.isArray(raw)) return raw;
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  };

  // ─── HELPER: ETA Calculation ───────────────────────────────────────────────
  const calculateETA = (createdAt: string, status: string): string => {
    const norm = (status || "").toUpperCase();
    const createdDate = new Date(createdAt);

    if (norm === "DELIVERED") {
      return `Delivered on ${createdDate.toLocaleDateString("en-IN", {
        weekday: "short",
        day: "numeric",
        month: "short",
        year: "numeric",
      })}`;
    }

    if (norm === "OTP_SENT") {
      return "Arriving Today — Courier in Transit";
    }

    if (norm === "FAILED" || norm === "CANCELLED") {
      return "Order Cancelled";
    }

    // Default: 5 to 7 days delivery window
    const etaDate = new Date(createdDate.getTime() + 7 * 24 * 60 * 60 * 1000);
    return `Arriving by ${etaDate.toLocaleDateString("en-IN", {
      weekday: "long",
      month: "short",
      day: "numeric",
    })}`;
  };

  // ─── HELPER: Step Progress Mapping ─────────────────────────────────────────
  const getStepDetails = (status: string) => {
    const norm = (status || "").toUpperCase();
    switch (norm) {
      case "DELIVERED":
        return { step: 4, percentage: 100 };
      case "OTP_SENT":
        return { step: 3, percentage: 75 };
      case "SUCCESS":
      case "PAID":
      case "PROCESSING":
        return { step: 2, percentage: 50 };
      case "FAILED":
      case "CANCELLED":
        return { step: 0, percentage: 0 };
      default:
        return { step: 1, percentage: 25 };
    }
  };

  // ─── HELPER: Status Badge Config ──────────────────────────────────────────
  const getStatusBadge = (status: string) => {
    const norm = (status || "").toUpperCase();
    switch (norm) {
      case "DELIVERED":
        return {
          label: "Delivered",
          className: "bg-emerald-50 text-emerald-800 border-emerald-200",
          dotClass: "bg-emerald-500",
        };
      case "OTP_SENT":
        return {
          label: "Out for Delivery",
          className: "bg-purple-50 text-purple-800 border-purple-200 animate-pulse",
          dotClass: "bg-purple-600 animate-ping",
        };
      case "SUCCESS":
      case "PAID":
      case "PROCESSING":
        return {
          label: "Paid & Processing",
          className: "bg-blue-50 text-blue-800 border-blue-200",
          dotClass: "bg-blue-600",
        };
      case "FAILED":
      case "CANCELLED":
        return {
          label: "Cancelled / Failed",
          className: "bg-rose-50 text-rose-800 border-rose-200",
          dotClass: "bg-rose-600",
        };
      default:
        return {
          label: "Order Placed",
          className: "bg-amber-50 text-amber-800 border-amber-200",
          dotClass: "bg-amber-500",
        };
    }
  };

  // ─── Process Order Record ──────────────────────────────────────────────────
  const processRecord = (raw: PaymentRecord): ExtendedOrderRecord => {
    const { step, percentage } = getStepDetails(raw.status);
    return {
      ...raw,
      parsedItems: parseCartItems(raw.cartItems),
      currentStep: step,
      progressPercentage: percentage,
      formattedEta: calculateETA(raw.createdAt, raw.status),
      isExpanded: false,
    };
  };

  // ─── Load User Orders ──────────────────────────────────────────────────────
  const loadUserOrdersList = async (email: string) => {
    setLoading(true);
    try {
      const data = await fetchUserOrders(email);
      const formatted = (data || []).map((o: PaymentRecord) => processRecord(o));
      setOrders(formatted);
    } catch (err: any) {
      console.error("Failed to load user orders:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isLoggedIn && user?.email) {
      loadUserOrdersList(user.email);
    } else {
      setLoading(false);
    }
  }, [isLoggedIn, user?.email]);

  // ─── Search Order Handler ──────────────────────────────────────────────────
  const handleSearchOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setSearchError(null);
    setSearchLoading(true);
    setSearchedOrder(null);

    try {
      const res = await trackOrder(searchQuery.trim());
      if (res && res.order) {
        setSearchedOrder(processRecord(res.order));
      } else {
        setSearchError(`No shipment record found matching "${searchQuery.trim()}".`);
      }
    } catch (err: any) {
      setSearchError(err.message || `Unable to find order "${searchQuery.trim()}". Please check your Order ID.`);
    } finally {
      setSearchLoading(false);
    }
  };

  const toggleExpandOrder = (id: string) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === id ? { ...o, isExpanded: !o.isExpanded } : o))
    );
  };

  const getInvoiceUrl = (orderId: string) => {
    const baseUrl = getApiBaseUrl();
    return `${baseUrl}/payment/invoice/${encodeURIComponent(orderId)}`;
  };

  return (
    <div className="w-full min-h-screen bg-soft-linen/30 text-ink-black pb-24">
      {/* ─── Top Header & Breadcrumb ────────────────────────────────────────── */}
      <div className="bg-pure-white border-b border-slate-grey/15 py-10 px-4 sm:px-8">
        <div className="max-w-5xl mx-auto space-y-4">
          <div className="flex items-center gap-2">
            <Link
              href="/account"
              className="font-label-caps text-[10px] text-slate-grey hover:text-deep-navy uppercase tracking-widest transition-colors flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-[14px]">arrow_back</span>
              Account Dashboard
            </Link>
            <span className="text-slate-grey/40 text-xs">/</span>
            <span className="font-label-caps text-[10px] text-deep-navy uppercase tracking-widest font-bold">
              Orders & Tracking
            </span>
          </div>

          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <h1 className="font-display-lg text-2xl md:text-3xl text-deep-navy uppercase tracking-widest">
                Orders & Real-Time Tracking
              </h1>
              <p className="font-body-md text-slate-grey text-sm mt-1 max-w-xl">
                Track live fulfillment timelines, review doorstep OTP status, and download tax invoices for your VRIX pieces.
              </p>
            </div>
            {isLoggedIn && (
              <div className="bg-soft-linen/50 border border-slate-grey/20 px-4 py-2.5 rounded text-right">
                <span className="font-label-caps text-[9px] text-slate-grey uppercase tracking-widest block">Account Holder</span>
                <span className="font-body-md text-xs font-semibold text-deep-navy">{user?.name || user?.email}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <main className="max-w-5xl mx-auto px-4 sm:px-8 mt-8 space-y-8">

        {/* ─── 1. TRACK SPECIFIC ORDER BAR ─────────────────────────────────── */}
        <div className="bg-pure-white border border-slate-grey/20 p-6 md:p-8 shadow-sm space-y-4 rounded-sm">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-deep-navy text-xl">travel_explore</span>
            <h2 className="font-label-caps text-xs text-deep-navy uppercase tracking-widest font-bold">
              Track Any Order or Receipt
            </h2>
          </div>

          <form onSubmit={handleSearchOrder} className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Enter Order ID (e.g. order_dev_... or ORD-...) or Payment ID"
                required
                className="w-full border-b border-slate-grey/30 py-3 pl-1 pr-8 font-body-md text-sm text-ink-black focus:border-deep-navy outline-none bg-transparent placeholder:text-slate-grey/50"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => { setSearchQuery(""); setSearchedOrder(null); setSearchError(null); }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-grey hover:text-ink-black text-xs font-bold"
                >
                  ✕
                </button>
              )}
            </div>

            <button
              type="submit"
              disabled={searchLoading}
              className="bg-deep-navy text-pure-white px-8 py-3.5 font-button text-xs uppercase tracking-widest hover:bg-ink-black transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 shrink-0"
            >
              {searchLoading ? (
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span className="material-symbols-outlined text-[16px]">search</span>
                  Track Shipment
                </>
              )}
            </button>
          </form>

          {searchError && (
            <p className="text-xs text-red-600 font-body-md bg-red-50 border border-red-200 p-3 rounded">
              {searchError}
            </p>
          )}
        </div>

        {/* ─── 2. SEARCHED ORDER DETAIL CARD ───────────────────────────────── */}
        {searchedOrder && (
          <div className="bg-pure-white border border-deep-navy/40 p-6 md:p-8 shadow-md space-y-6 animate-fade-in rounded-sm">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-grey/15 pb-4">
              <div>
                <span className="font-label-caps text-[9px] text-slate-grey uppercase tracking-widest">TRACKING RESULT</span>
                <h3 className="font-headline-md text-xl text-deep-navy font-bold">{searchedOrder.orderId}</h3>
                <p className="text-xs text-slate-grey font-body-md mt-0.5">
                  Placed on {new Date(searchedOrder.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                </p>
              </div>

              <div className="flex items-center gap-4">
                <span className={`inline-flex items-center gap-1.5 text-[9px] font-label-caps uppercase tracking-widest px-3 py-1 border rounded-full ${getStatusBadge(searchedOrder.status).className}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${getStatusBadge(searchedOrder.status).dotClass}`} />
                  {getStatusBadge(searchedOrder.status).label}
                </span>

                <a
                  href={getInvoiceUrl(searchedOrder.orderId)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-label-caps text-[10px] text-deep-navy hover:text-ink-black border border-deep-navy/30 px-3 py-1 uppercase tracking-widest transition-colors flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-[14px]">receipt_long</span> Invoice
                </a>
              </div>
            </div>

            {/* ETA Highlight Banner */}
            <div className="bg-soft-linen/60 border border-slate-grey/20 p-4 rounded-sm flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-deep-navy text-pure-white flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-lg">local_shipping</span>
                </div>
                <div>
                  <span className="font-label-caps text-[9px] text-slate-grey uppercase tracking-widest block">Estimated Arrival</span>
                  <span className="font-headline-md text-base text-deep-navy font-bold">{searchedOrder.formattedEta}</span>
                </div>
              </div>

              <span className="font-headline-md text-lg text-deep-navy font-bold">{formatPrice(searchedOrder.amount)}</span>
            </div>

            {/* Stepper Timeline */}
            <div className="space-y-4 pt-2">
              <span className="font-label-caps text-[10px] text-slate-grey uppercase tracking-widest block">Fulfillment Stepper</span>

              <div className="relative">
                {/* Progress Bar Line */}
                <div className="absolute top-4 left-6 right-6 h-0.5 bg-slate-grey/20 -z-0">
                  <div
                    className="h-full bg-deep-navy transition-all duration-700"
                    style={{ width: `${searchedOrder.progressPercentage}%` }}
                  />
                </div>

                <div className="grid grid-cols-4 gap-2 relative z-10">
                  {STEP_LABELS.map((stepItem) => {
                    const isDone = stepItem.id <= searchedOrder.currentStep;
                    const isCurrent = stepItem.id === searchedOrder.currentStep;

                    return (
                      <div key={stepItem.id} className="flex flex-col items-center text-center gap-2">
                        <div
                          className={`w-9 h-9 rounded-full flex items-center justify-center font-label-caps text-xs transition-all ${
                            isCurrent
                              ? "bg-deep-navy text-pure-white ring-4 ring-deep-navy/20 font-bold scale-110 shadow-md"
                              : isDone
                              ? "bg-emerald-600 text-pure-white"
                              : "bg-pure-white border-2 border-slate-grey/30 text-slate-grey"
                          }`}
                        >
                          {isDone ? <span className="material-symbols-outlined text-[16px]">check</span> : stepItem.id}
                        </div>
                        <div>
                          <p className={`font-label-caps text-[10px] uppercase tracking-wider ${isDone ? "text-deep-navy font-bold" : "text-slate-grey"}`}>
                            {stepItem.label}
                          </p>
                          <p className="text-[9px] text-slate-grey/70 hidden sm:block font-body-md mt-0.5">
                            {stepItem.desc}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Itemized Purchased Items */}
            {searchedOrder.parsedItems.length > 0 && (
              <div className="border-t border-slate-grey/15 pt-4 space-y-3">
                <span className="font-label-caps text-[10px] text-slate-grey uppercase tracking-widest block">Purchased Jewelry Pieces</span>
                <div className="space-y-3">
                  {searchedOrder.parsedItems.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-4 bg-soft-linen/20 p-3 border border-slate-grey/10">
                      {item.image && (
                        <div className="w-12 h-14 relative bg-soft-linen shrink-0 overflow-hidden">
                          <Image src={item.image} alt={item.title} fill className="object-cover mix-blend-multiply" />
                        </div>
                      )}
                      <div className="flex-1">
                        <h4 className="font-body-md text-sm font-bold text-deep-navy">{item.title}</h4>
                        <div className="text-xs text-slate-grey space-x-3">
                          {item.material && <span>Material: {item.material}</span>}
                          {item.size && <span>Size: {item.size}</span>}
                          {item.quantity && <span>Qty: {item.quantity}</span>}
                        </div>
                        {item.engraving && <p className="text-xs text-slate-grey italic">Engraving: "{item.engraving}"</p>}
                        {item.giftNote && <p className="text-xs text-slate-grey italic">Gift Note: "{item.giftNote}"</p>}
                      </div>
                      <span className="font-body-md text-sm font-bold text-deep-navy">{formatPrice(item.price * (item.quantity || 1))}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Shipping & Recipient Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-soft-linen/30 p-4 border border-slate-grey/15 text-xs font-body-md rounded-sm">
              <div>
                <span className="font-label-caps text-[9px] text-slate-grey uppercase tracking-widest block mb-1">Customer Recipient</span>
                <p className="font-bold text-ink-black">{searchedOrder.customerName || searchedOrder.userEmail || "VRIX Client"}</p>
                <p className="text-slate-grey">{searchedOrder.userEmail}</p>
                <p className="text-slate-grey">{searchedOrder.customerPhone || "No contact phone provided"}</p>
              </div>

              <div>
                <span className="font-label-caps text-[9px] text-slate-grey uppercase tracking-widest block mb-1">Destination Address</span>
                <p className="text-ink-black font-medium">{[searchedOrder.address, searchedOrder.city, searchedOrder.postalCode].filter(Boolean).join(", ") || "Standard Shipping"}</p>
                <p className="text-slate-grey text-[10px] mt-1">Insured Courier Handoff with OTP Security Code</p>
              </div>
            </div>
          </div>
        )}

        {/* ─── 3. LOGGED-IN CUSTOMER ORDERS DIRECTORY ─────────────────────────── */}
        {isLoggedIn && (
          <div className="bg-pure-white border border-slate-grey/20 p-6 md:p-8 shadow-sm space-y-6 rounded-sm">
            <div className="flex items-center justify-between border-b border-slate-grey/15 pb-4">
              <div>
                <h2 className="font-headline-md text-lg text-deep-navy uppercase tracking-wider font-bold">
                  Your Vault Orders ({orders.length})
                </h2>
                <p className="font-body-md text-slate-grey text-xs mt-0.5">Historical order archive associated with {user?.email}</p>
              </div>

              <button
                onClick={() => user?.email && loadUserOrdersList(user.email)}
                className="text-deep-navy hover:underline font-label-caps text-xs flex items-center gap-1 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[14px]">refresh</span> Reload
              </button>
            </div>

            {loading ? (
              <div className="py-16 text-center text-slate-grey font-label-caps text-xs tracking-widest animate-pulse">
                Retrieving your order records…
              </div>
            ) : orders.length === 0 ? (
              /* EMPTY STATE */
              <div className="py-16 text-center space-y-4 max-w-md mx-auto">
                <div className="w-16 h-16 rounded-full bg-soft-linen border border-slate-grey/20 flex items-center justify-center mx-auto text-deep-navy">
                  <span className="material-symbols-outlined text-3xl">inventory_2</span>
                </div>
                <div>
                  <h3 className="font-display-lg text-lg text-deep-navy uppercase tracking-widest">No Orders Found</h3>
                  <p className="font-body-md text-slate-grey text-xs mt-1">
                    Your personal luxury vault is empty. Explore our architectural jewelry collections to place your first piece.
                  </p>
                </div>
                <Link
                  href="/collections"
                  className="inline-block bg-deep-navy text-pure-white font-button text-xs uppercase tracking-widest px-8 py-3.5 hover:bg-ink-black transition-colors"
                >
                  Explore Collections
                </Link>
              </div>
            ) : (
              /* ORDERS LIST GRID */
              <div className="space-y-6 divide-y divide-slate-grey/15">
                {orders.map((ord) => {
                  const badge = getStatusBadge(ord.status);
                  return (
                    <div key={ord.id} className="pt-6 first:pt-0 space-y-4">
                      {/* Top Bar Summary */}
                      <div className="flex flex-wrap items-center justify-between gap-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-3">
                            <span className="font-headline-md text-base font-bold text-deep-navy">{ord.orderId}</span>
                            <span className={`inline-flex items-center gap-1 text-[8px] font-label-caps uppercase tracking-widest px-2.5 py-0.5 border rounded-full ${badge.className}`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${badge.dotClass}`} />
                              {badge.label}
                            </span>
                          </div>
                          <div className="text-xs text-slate-grey font-body-md flex items-center gap-3">
                            <span>Placed {new Date(ord.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</span>
                            <span>•</span>
                            <span className="font-semibold text-deep-navy">{ord.formattedEta}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-4">
                          <span className="font-headline-md text-lg font-bold text-ink-black">{formatPrice(ord.amount)}</span>
                          
                          <button
                            onClick={() => toggleExpandOrder(ord.id)}
                            className="border border-slate-grey/30 hover:border-deep-navy px-3 py-1.5 text-[10px] font-label-caps uppercase tracking-widest text-deep-navy transition-colors flex items-center gap-1 cursor-pointer"
                          >
                            {ord.isExpanded ? "Hide Details" : "View Details"}
                            <span className="material-symbols-outlined text-[14px]">
                              {ord.isExpanded ? "expand_less" : "expand_more"}
                            </span>
                          </button>

                          <a
                            href={getInvoiceUrl(ord.orderId)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="border border-slate-grey/20 hover:border-slate-grey px-3 py-1.5 text-[10px] font-label-caps uppercase tracking-widest text-slate-grey hover:text-ink-black transition-colors flex items-center gap-1"
                            title="Download Official Tax Invoice"
                          >
                            <span className="material-symbols-outlined text-[14px]">receipt</span> Invoice
                          </a>
                        </div>
                      </div>

                      {/* Mini Stepper Line */}
                      <div className="space-y-1.5">
                        <div className="w-full bg-slate-grey/15 h-1.5 rounded-full overflow-hidden">
                          <div
                            className="bg-deep-navy h-full rounded-full transition-all duration-500"
                            style={{ width: `${ord.progressPercentage}%` }}
                          />
                        </div>
                        <div className="flex justify-between text-[9px] font-label-caps text-slate-grey uppercase tracking-wider">
                          <span className={ord.currentStep >= 1 ? "text-deep-navy font-bold" : ""}>Order Placed</span>
                          <span className={ord.currentStep >= 2 ? "text-deep-navy font-bold" : ""}>In Preparation</span>
                          <span className={ord.currentStep >= 3 ? "text-deep-navy font-bold" : ""}>Out for Delivery</span>
                          <span className={ord.currentStep >= 4 ? "text-emerald-700 font-bold" : ""}>Delivered</span>
                        </div>
                      </div>

                      {/* Expandable Order Details Drawer */}
                      {ord.isExpanded && (
                        <div className="bg-soft-linen/30 border border-slate-grey/15 p-5 space-y-4 animate-slide-down rounded-sm mt-3">
                          {ord.parsedItems.length > 0 ? (
                            <div className="space-y-3">
                              <span className="font-label-caps text-[9px] text-slate-grey uppercase tracking-widest block">Itemized Bag Contents</span>
                              {ord.parsedItems.map((item, idx) => (
                                <div key={idx} className="flex items-center justify-between gap-4 bg-pure-white p-3 border border-slate-grey/10">
                                  <div className="flex items-center gap-3">
                                    {item.image && (
                                      <div className="w-10 h-12 relative bg-soft-linen shrink-0">
                                        <Image src={item.image} alt={item.title} fill className="object-cover mix-blend-multiply" />
                                      </div>
                                    )}
                                    <div>
                                      <p className="font-body-md text-xs font-bold text-deep-navy">{item.title}</p>
                                      <p className="text-[11px] text-slate-grey">
                                        {item.material || "Fine Metal"} {item.size ? `• Size ${item.size}` : ""} • Qty: {item.quantity || 1}
                                      </p>
                                      {item.engraving && <p className="text-[11px] text-slate-grey italic">Engraving: "{item.engraving}"</p>}
                                      {item.giftNote && <p className="text-[11px] text-slate-grey italic">Gift Note: "{item.giftNote}"</p>}
                                    </div>
                                  </div>
                                  <span className="font-body-md text-xs font-bold text-deep-navy">{formatPrice(item.price * (item.quantity || 1))}</span>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-xs text-slate-grey italic">No detailed item breakdown recorded for this order.</p>
                          )}

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-body-md pt-2 border-t border-slate-grey/15">
                            <div>
                              <span className="font-label-caps text-[9px] text-slate-grey uppercase tracking-widest block mb-0.5">Shipping Address</span>
                              <p className="text-ink-black font-medium">{[ord.address, ord.city, ord.postalCode].filter(Boolean).join(", ") || "Standard Shipping"}</p>
                            </div>
                            <div>
                              <span className="font-label-caps text-[9px] text-slate-grey uppercase tracking-widest block mb-0.5">Recipient Details</span>
                              <p className="text-ink-black font-medium">{ord.customerName || ord.userEmail || "Customer"}</p>
                              <p className="text-slate-grey text-[11px]">{ord.customerPhone || "No phone number"}</p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
