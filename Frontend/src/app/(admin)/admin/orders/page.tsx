"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { fetchPaymentLogs, fetchAdminStats } from "@/utils/api";

interface Order {
  id: string;
  orderId: string;
  paymentId?: string;
  amount: number;
  currency: string;
  status: string;
  userEmail?: string;
  customerName?: string;
  customerPhone?: string;
  address?: string;
  city?: string;
  postalCode?: string;
  cartItems?: any[];
  createdAt: string;
}

// Normalize snake_case (Supabase JS) or camelCase (Prisma) to camelCase
function normalizeOrder(raw: any): Order {
  return {
    id: raw.id || raw.orderId || raw.order_id || "",
    orderId: raw.orderId || raw.order_id || raw.id || "",
    paymentId: raw.paymentId || raw.payment_id || "",
    amount: Number(raw.amount || 0),
    currency: raw.currency || "INR",
    status: (raw.status || "CREATED").toUpperCase(),
    userEmail: raw.userEmail || raw.user_email || "",
    customerName: raw.customerName || raw.customer_name || "",
    customerPhone: raw.customerPhone || raw.customer_phone || "",
    address: raw.address || "",
    city: raw.city || "",
    postalCode: raw.postalCode || raw.postal_code || "",
    cartItems: raw.cartItems || raw.cart_items || [],
    createdAt: raw.createdAt || raw.created_at || new Date().toISOString(),
  };
}

const STATUS_CONFIG: Record<string, { label: string; className: string; icon: string; dot: string }> = {
  CREATED:   { label: "Pending",   className: "bg-amber-50 text-amber-700 border-amber-200",   icon: "pending_actions", dot: "bg-amber-400" },
  SUCCESS:   { label: "Paid",      className: "bg-green-50 text-green-700 border-green-200",   icon: "payments",        dot: "bg-green-500" },
  DELIVERED: { label: "Delivered", className: "bg-blue-50 text-blue-700 border-blue-200",      icon: "local_shipping",  dot: "bg-blue-500" },
  FAILED:    { label: "Failed",    className: "bg-red-50 text-red-700 border-red-200",         icon: "cancel",          dot: "bg-red-500" },
  REFUNDED:  { label: "Refunded",  className: "bg-purple-50 text-purple-700 border-purple-200",icon: "undo",            dot: "bg-purple-500" },
};

const STATUS_TRANSITIONS: Record<string, string[]> = {
  CREATED:   ["SUCCESS", "FAILED"],
  SUCCESS:   ["DELIVERED", "REFUNDED"],
  DELIVERED: ["REFUNDED"],
  FAILED:    [],
  REFUNDED:  [],
};

export default function AdminOrdersPage() {
  const searchParams = useSearchParams();
  const paramId = searchParams.get("id");
  const paramSearch = searchParams.get("search");

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const showToast = (msg: string, type: "success" | "error" = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const loadOrders = useCallback(async () => {
    try {
      const raw = await fetchPaymentLogs().catch(() => []);
      const normalized = (Array.isArray(raw) ? raw : []).map(normalizeOrder);
      setOrders(normalized);
    } catch {
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadOrders(); }, [loadOrders]);

  useEffect(() => {
    if (loading || orders.length === 0) return;
    if (paramId) {
      const match = orders.find(o => o.orderId === paramId || o.id === paramId);
      if (match) setSelectedOrder(match);
    }
    if (paramSearch) setSearch(paramSearch);
  }, [paramId, paramSearch, orders, loading]);

  const filtered = orders.filter((o) => {
    const q = search.trim().toLowerCase();
    const matchSearch = !q ||
      o.orderId.toLowerCase().includes(q) ||
      (o.paymentId || "").toLowerCase().includes(q) ||
      (o.userEmail || "").toLowerCase().includes(q) ||
      (o.customerName || "").toLowerCase().includes(q);
    const matchStatus = statusFilter === "All" || o.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const totalRevenue = orders
    .filter(o => o.status === "SUCCESS" || o.status === "DELIVERED")
    .reduce((acc, o) => acc + o.amount, 0);

  const handleStatusUpdate = async (order: Order, newStatus: string) => {
    setUpdatingStatus(true);
    try {
      const { apiFetch } = await import("@/utils/api");
      await (apiFetch as any)(`/payment/status/${order.orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      await loadOrders();
      // Refresh selected order
      setSelectedOrder(prev => prev ? { ...prev, status: newStatus } : null);
      showToast(`Order marked as ${STATUS_CONFIG[newStatus]?.label || newStatus}`);
    } catch (e: any) {
      showToast(e.message || "Failed to update status", "error");
    } finally {
      setUpdatingStatus(false);
    }
  };

  const formatAmount = (amount: number, currency = "INR") => {
    // Razorpay stores in paise if amount > 10000, otherwise in rupees
    const rupees = amount > 10000 ? amount / 100 : amount;
    return new Intl.NumberFormat("en-IN", { style: "currency", currency, maximumFractionDigits: 0 }).format(rupees);
  };

  const formatDate = (d: string) => {
    try { return new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }); }
    catch { return "—"; }
  };

  const formatDateTime = (d: string) => {
    try { return new Date(d).toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }); }
    catch { return "—"; }
  };

  const stats = [
    { label: "Total Orders",  value: orders.length,                                          icon: "receipt_long",   color: "text-deep-navy",   bg: "bg-deep-navy/5"  },
    { label: "Pending",       value: orders.filter(o => o.status === "CREATED").length,      icon: "pending_actions",color: "text-amber-600",   bg: "bg-amber-50"     },
    { label: "Paid",          value: orders.filter(o => o.status === "SUCCESS").length,      icon: "payments",       color: "text-green-600",   bg: "bg-green-50"     },
    { label: "Delivered",     value: orders.filter(o => o.status === "DELIVERED").length,    icon: "local_shipping", color: "text-blue-600",    bg: "bg-blue-50"      },
    { label: "Revenue",       value: formatAmount(totalRevenue),                             icon: "currency_rupee", color: "text-emerald-600", bg: "bg-emerald-50"   },
  ];

  return (
    <div className="w-full min-h-screen bg-soft-linen/50 p-6 md:p-10 relative">
      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 px-6 py-4 shadow-2xl flex items-center gap-3 text-sm font-body-md border animate-fade-in rounded ${toast.type === "error" ? "bg-red-900 text-white border-red-700" : "bg-deep-navy text-pure-white border-slate-grey/30"}`}>
          <span className="material-symbols-outlined text-[16px]">{toast.type === "error" ? "error" : "check_circle"}</span>
          {toast.msg}
        </div>
      )}

      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-grey/20 pb-5">
          <div>
            <h1 className="font-display-lg text-headline-md text-deep-navy uppercase tracking-wide">Orders</h1>
            <p className="text-slate-grey font-body-md text-sm mt-1">All payment orders — live from database</p>
          </div>
          <button
            onClick={loadOrders}
            className="flex items-center gap-2 px-4 py-2 border border-slate-grey/25 text-[10px] font-label-caps uppercase tracking-widest text-slate-grey hover:border-deep-navy hover:text-deep-navy transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[14px]">refresh</span>
            Refresh
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {stats.map(s => (
            <div key={s.label} className={`${s.bg} border border-slate-grey/15 p-4 rounded`}>
              <div className="flex items-center gap-2 mb-2">
                <span className={`material-symbols-outlined text-[18px] ${s.color}`}>{s.icon}</span>
                <p className="font-label-caps text-[9px] uppercase tracking-widest text-slate-grey">{s.label}</p>
              </div>
              <p className={`font-headline-md text-xl font-bold ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Orders Table */}
          <div className="xl:col-span-2 bg-pure-white border border-slate-grey/20 shadow-sm overflow-hidden rounded">
            {/* Filter bar */}
            <div className="p-4 border-b border-slate-grey/15 flex flex-wrap gap-3 items-center justify-between">
              <div className="flex items-center gap-3 flex-wrap">
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-grey text-[14px]">search</span>
                  <input
                    type="text"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Order ID, email, name…"
                    className="pl-8 pr-3 py-2 text-xs border border-slate-grey/20 focus:border-deep-navy outline-none font-body-md bg-transparent w-48 rounded"
                  />
                </div>
                <div className="flex gap-1 flex-wrap">
                  {["All", "CREATED", "SUCCESS", "DELIVERED", "FAILED"].map(s => (
                    <button
                      key={s}
                      onClick={() => setStatusFilter(s)}
                      className={`px-2.5 py-1 text-[9px] font-label-caps uppercase tracking-widest border transition-colors cursor-pointer rounded ${statusFilter === s ? "bg-deep-navy text-pure-white border-deep-navy" : "border-slate-grey/25 text-slate-grey hover:border-deep-navy"}`}
                    >
                      {s === "All" ? "All" : STATUS_CONFIG[s]?.label || s}
                    </button>
                  ))}
                </div>
              </div>
              <span className="font-label-caps text-[9px] uppercase tracking-widest text-slate-grey">{filtered.length} order{filtered.length !== 1 ? "s" : ""}</span>
            </div>

            {loading ? (
              <div className="h-48 flex items-center justify-center gap-3 text-slate-grey text-xs font-label-caps uppercase tracking-widest">
                <div className="w-5 h-5 border-2 border-deep-navy border-t-transparent rounded-full animate-spin" />
                Loading orders...
              </div>
            ) : filtered.length === 0 ? (
              <div className="h-48 flex flex-col items-center justify-center gap-2 text-slate-grey">
                <span className="material-symbols-outlined text-4xl opacity-40">receipt_long</span>
                <p className="text-xs font-label-caps uppercase tracking-widest">No orders found</p>
                {orders.length > 0 && search && (
                  <button onClick={() => setSearch("")} className="text-[10px] text-deep-navy underline mt-1">Clear search</button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-grey/15 bg-soft-linen/30 text-slate-grey font-label-caps text-[9px] tracking-widest uppercase">
                      <th className="px-4 py-3 font-normal">Order ID</th>
                      <th className="px-4 py-3 font-normal">Customer</th>
                      <th className="px-4 py-3 font-normal">Amount</th>
                      <th className="px-4 py-3 font-normal">Status</th>
                      <th className="px-4 py-3 font-normal">Date</th>
                      <th className="px-4 py-3 font-normal w-8"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-grey/10">
                    {filtered.map(order => {
                      const cfg = STATUS_CONFIG[order.status] || STATUS_CONFIG["CREATED"];
                      const isSelected = selectedOrder?.orderId === order.orderId;
                      return (
                        <tr
                          key={order.id || order.orderId}
                          onClick={() => setSelectedOrder(isSelected ? null : order)}
                          className={`cursor-pointer transition-colors ${isSelected ? "bg-soft-linen/50 border-l-2 border-l-deep-navy" : "hover:bg-soft-linen/20"}`}
                        >
                          <td className="px-4 py-3">
                            <span className="font-mono text-[11px] text-deep-navy font-semibold block max-w-[130px] truncate">{order.orderId || "—"}</span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-xs text-ink-black block font-medium">{order.customerName || "—"}</span>
                            <span className="text-[10px] text-slate-grey block truncate max-w-[120px]">{order.userEmail || ""}</span>
                          </td>
                          <td className="px-4 py-3 font-body-md text-sm font-semibold text-ink-black whitespace-nowrap">
                            {formatAmount(order.amount, order.currency)}
                          </td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex items-center gap-1 text-[9px] font-label-caps uppercase tracking-widest px-2 py-1 border rounded ${cfg.className}`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                              {cfg.label}
                            </span>
                          </td>
                          <td className="px-4 py-3 font-body-md text-xs text-slate-grey whitespace-nowrap">
                            {formatDate(order.createdAt)}
                          </td>
                          <td className="px-4 py-3">
                            <span className={`material-symbols-outlined text-[16px] text-slate-grey transition-transform ${isSelected ? "rotate-180" : ""}`}>expand_more</span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Order Detail Panel */}
          <div className="xl:col-span-1">
            <div className="sticky top-6 bg-pure-white border border-slate-grey/20 shadow-sm rounded overflow-hidden">
              {!selectedOrder ? (
                <div className="p-8 flex flex-col items-center justify-center gap-3 text-slate-grey h-64">
                  <span className="material-symbols-outlined text-4xl opacity-30">touch_app</span>
                  <p className="text-xs font-label-caps uppercase tracking-widest text-center">Click an order to view details</p>
                </div>
              ) : (
                <div>
                  {/* Detail Header */}
                  <div className="p-5 flex justify-between items-center border-b border-slate-grey/10">
                    <div>
                      <h3 className="font-label-caps text-[11px] uppercase tracking-widest text-deep-navy">Order Detail</h3>
                      <p className="text-[9px] text-slate-grey mt-0.5 font-mono truncate max-w-[160px]">{selectedOrder.orderId}</p>
                    </div>
                    <button onClick={() => setSelectedOrder(null)} className="text-slate-grey hover:text-deep-navy cursor-pointer">
                      <span className="material-symbols-outlined text-[18px]">close</span>
                    </button>
                  </div>

                  {/* Status + transitions */}
                  <div className="p-5 border-b border-slate-grey/10 space-y-3">
                    {(() => {
                      const cfg = STATUS_CONFIG[selectedOrder.status] || STATUS_CONFIG["CREATED"];
                      const transitions = STATUS_TRANSITIONS[selectedOrder.status] || [];
                      return (
                        <>
                          <div className="flex items-center gap-2">
                            <span className={`inline-flex items-center gap-1.5 text-[9px] font-label-caps uppercase tracking-widest px-3 py-1.5 border rounded ${cfg.className}`}>
                              <span className="material-symbols-outlined text-[12px]">{cfg.icon}</span>
                              {cfg.label}
                            </span>
                          </div>
                          {transitions.length > 0 && (
                            <div className="flex flex-wrap gap-2 pt-1">
                              {transitions.map(next => (
                                <button
                                  key={next}
                                  onClick={() => handleStatusUpdate(selectedOrder, next)}
                                  disabled={updatingStatus}
                                  className="px-3 py-1.5 text-[9px] font-label-caps uppercase tracking-widest border border-deep-navy text-deep-navy hover:bg-deep-navy hover:text-pure-white transition-colors cursor-pointer disabled:opacity-50 rounded"
                                >
                                  {updatingStatus ? "..." : `Mark ${STATUS_CONFIG[next]?.label || next}`}
                                </button>
                              ))}
                            </div>
                          )}
                        </>
                      );
                    })()}
                  </div>

                  {/* Fields */}
                  <div className="p-5 space-y-3 border-b border-slate-grey/10 max-h-80 overflow-y-auto">
                    {[
                      { label: "Order ID",    value: selectedOrder.orderId },
                      { label: "Payment ID",  value: selectedOrder.paymentId || "—" },
                      { label: "Amount",      value: formatAmount(selectedOrder.amount, selectedOrder.currency) },
                      { label: "Customer",    value: selectedOrder.customerName || "—" },
                      { label: "Email",       value: selectedOrder.userEmail || "—" },
                      { label: "Phone",       value: selectedOrder.customerPhone || "—" },
                      { label: "Address",     value: [selectedOrder.address, selectedOrder.city, selectedOrder.postalCode].filter(Boolean).join(", ") || "—" },
                      { label: "Created",     value: formatDateTime(selectedOrder.createdAt) },
                    ].map(row => (
                      <div key={row.label} className="space-y-0.5">
                        <p className="font-label-caps text-[9px] uppercase tracking-widest text-slate-grey">{row.label}</p>
                        <p className="font-body-md text-xs text-ink-black break-all">{row.value}</p>
                      </div>
                    ))}

                    {/* Cart Items */}
                    {selectedOrder.cartItems && selectedOrder.cartItems.length > 0 && (
                      <div className="space-y-1.5 pt-2 border-t border-slate-grey/10">
                        <p className="font-label-caps text-[9px] uppercase tracking-widest text-slate-grey">Items Ordered</p>
                        {selectedOrder.cartItems.map((item: any, i: number) => (
                          <div key={i} className="flex justify-between items-center bg-soft-linen/30 px-3 py-2 rounded">
                            <span className="text-xs text-ink-black font-medium">{item.title || item.name || `Item ${i+1}`}</span>
                            <span className="text-[10px] text-slate-grey">×{item.quantity || 1}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="p-5 space-y-2">
                    <button
                      onClick={() => { navigator.clipboard.writeText(selectedOrder.orderId); showToast("Order ID copied!"); }}
                      className="w-full flex items-center justify-center gap-2 border border-slate-grey/25 py-2 text-[10px] font-label-caps uppercase tracking-widest text-slate-grey hover:border-deep-navy hover:text-deep-navy transition-colors cursor-pointer rounded"
                    >
                      <span className="material-symbols-outlined text-[14px]">content_copy</span>
                      Copy Order ID
                    </button>
                    <a
                      href={`/api/payment/invoice/${selectedOrder.orderId}`}
                      target="_blank"
                      className="w-full flex items-center justify-center gap-2 border border-slate-grey/25 py-2 text-[10px] font-label-caps uppercase tracking-widest text-slate-grey hover:border-deep-navy hover:text-deep-navy transition-colors cursor-pointer rounded"
                    >
                      <span className="material-symbols-outlined text-[14px]">receipt</span>
                      View Invoice
                    </a>
                    {(selectedOrder.status === "SUCCESS" || selectedOrder.status === "CREATED") && (
                      <a
                        href="/admin/delivery"
                        className="w-full flex items-center justify-center gap-2 bg-deep-navy text-pure-white py-2 text-[10px] font-label-caps uppercase tracking-widest hover:bg-ink-black transition-colors cursor-pointer rounded"
                      >
                        <span className="material-symbols-outlined text-[14px]">local_shipping</span>
                        Delivery Portal
                      </a>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
