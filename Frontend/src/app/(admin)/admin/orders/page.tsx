"use client";

import React, { useState, useEffect } from "react";
import { fetchPaymentLogs, fetchAdminStats } from "@/utils/api";

interface Order {
  id: string;
  orderId: string;
  paymentId?: string;
  amount: number;
  currency: string;
  status: string;
  userEmail?: string;
  createdAt: string;
}

const STATUS_CONFIG: Record<string, { label: string; className: string; icon: string }> = {
  CREATED: { label: "Pending", className: "bg-amber-50 text-amber-700 border-amber-200", icon: "pending_actions" },
  SUCCESS: { label: "Paid", className: "bg-green-50 text-green-700 border-green-200", icon: "payments" },
  DELIVERED: { label: "Delivered", className: "bg-blue-50 text-blue-700 border-blue-200", icon: "local_shipping" },
  FAILED: { label: "Failed", className: "bg-red-50 text-red-700 border-red-200", icon: "cancel" },
};

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      fetchPaymentLogs().catch(() => []),
      fetchAdminStats().catch(() => null),
    ]).then(([logs, s]) => {
      setOrders(logs);
      setStats(s);
      setLoading(false);
    });
  }, []);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3000); };

  const filtered = orders.filter((o) => {
    const matchSearch = o.orderId?.toLowerCase().includes(search.toLowerCase()) ||
      o.paymentId?.toLowerCase().includes(search.toLowerCase()) ||
      o.userEmail?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "All" || o.status?.toUpperCase() === statusFilter;
    return matchSearch && matchStatus;
  });

  const totalRevenue = orders
    .filter((o) => o.status === "SUCCESS" || o.status === "DELIVERED")
    .reduce((acc, o) => acc + (o.amount || 0), 0);

  return (
    <div className="w-full min-h-screen bg-soft-linen/50 p-6 md:p-10 relative">
      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 bg-deep-navy text-pure-white px-6 py-4 border border-slate-grey/30 shadow-2xl flex items-center gap-3 animate-fade-in text-sm font-body-md">
          <span className="material-symbols-outlined text-[16px]">info</span>{toast}
        </div>
      )}

      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="border-b border-slate-grey/20 pb-6">
          <h1 className="font-display-lg text-headline-md text-deep-navy uppercase">Orders</h1>
          <p className="text-slate-grey font-body-md text-sm mt-1">All Razorpay payment orders — live from database</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {[
            { label: "Total Orders", value: orders.length, icon: "receipt_long", color: "text-deep-navy" },
            { label: "Pending", value: orders.filter((o) => o.status === "CREATED").length, icon: "pending_actions", color: "text-amber-600" },
            { label: "Paid", value: orders.filter((o) => o.status === "SUCCESS").length, icon: "payments", color: "text-green-600" },
            { label: "Delivered", value: orders.filter((o) => o.status === "DELIVERED").length, icon: "local_shipping", color: "text-blue-600" },
            { label: "Revenue", value: `₹${(totalRevenue / 100).toLocaleString()}`, icon: "currency_rupee", color: "text-emerald-600" },
          ].map((s) => (
            <div key={s.label} className="bg-pure-white border border-slate-grey/20 p-4">
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
          <div className="xl:col-span-2 bg-pure-white border border-slate-grey/20 shadow-sm overflow-hidden">
            {/* Filter bar */}
            <div className="p-4 border-b border-slate-grey/15 flex flex-wrap gap-3 items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-2 top-1/2 -translate-y-1/2 text-slate-grey text-[14px]">search</span>
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Order ID, email…"
                    className="pl-7 pr-3 py-2 text-xs border border-slate-grey/20 focus:border-deep-navy outline-none font-body-md bg-transparent w-44"
                  />
                </div>
                <div className="flex gap-1">
                  {["All", "CREATED", "SUCCESS", "DELIVERED", "FAILED"].map((s) => (
                    <button
                      key={s}
                      onClick={() => setStatusFilter(s)}
                      className={`px-2.5 py-1 text-[9px] font-label-caps uppercase tracking-widest border transition-colors cursor-pointer ${statusFilter === s ? "bg-deep-navy text-pure-white border-deep-navy" : "border-slate-grey/25 text-slate-grey hover:border-deep-navy"}`}
                    >
                      {s === "All" ? "All" : STATUS_CONFIG[s]?.label || s}
                    </button>
                  ))}
                </div>
              </div>
              <span className="font-label-caps text-[9px] uppercase tracking-widest text-slate-grey">{filtered.length} orders</span>
            </div>

            {loading ? (
              <div className="h-48 flex items-center justify-center text-slate-grey text-xs font-label-caps uppercase tracking-widest">Loading orders...</div>
            ) : filtered.length === 0 ? (
              <div className="h-48 flex flex-col items-center justify-center gap-2 text-slate-grey">
                <span className="material-symbols-outlined text-4xl">receipt_long</span>
                <p className="text-xs font-label-caps uppercase tracking-widest">No orders found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-grey/15 bg-soft-linen/30 text-slate-grey font-label-caps text-[9px] tracking-widest uppercase">
                      <th className="px-4 py-3 font-normal">Order ID</th>
                      <th className="px-4 py-3 font-normal">Amount</th>
                      <th className="px-4 py-3 font-normal">Status</th>
                      <th className="px-4 py-3 font-normal">Date</th>
                      <th className="px-4 py-3 font-normal"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-grey/10">
                    {filtered.map((order) => {
                      const cfg = STATUS_CONFIG[order.status?.toUpperCase()] || STATUS_CONFIG["CREATED"];
                      const isSelected = selectedOrder?.id === order.id;
                      return (
                        <tr
                          key={order.id}
                          onClick={() => setSelectedOrder(isSelected ? null : order)}
                          className={`cursor-pointer transition-colors ${isSelected ? "bg-soft-linen/40 border-l-2 border-deep-navy" : "hover:bg-soft-linen/20"}`}
                        >
                          <td className="px-4 py-3 font-body-md text-xs text-deep-navy font-semibold max-w-[140px] truncate">{order.orderId}</td>
                          <td className="px-4 py-3 font-body-md text-sm font-semibold text-ink-black">{order.currency} {(order.amount).toLocaleString()}</td>
                          <td className="px-4 py-3">
                            <span className={`text-[9px] font-label-caps uppercase tracking-widest px-2 py-1 border ${cfg.className}`}>
                              {cfg.label}
                            </span>
                          </td>
                          <td className="px-4 py-3 font-body-md text-xs text-slate-grey whitespace-nowrap">
                            {new Date(order.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
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
            <div className="sticky top-8 bg-pure-white border border-slate-grey/20 shadow-sm">
              {!selectedOrder ? (
                <div className="p-8 flex flex-col items-center justify-center gap-3 text-slate-grey h-64">
                  <span className="material-symbols-outlined text-4xl">touch_app</span>
                  <p className="text-xs font-label-caps uppercase tracking-widest text-center">Click an order to view details</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-grey/10">
                  <div className="p-5 flex justify-between items-center">
                    <h3 className="font-label-caps text-[11px] uppercase tracking-widest text-deep-navy">Order Detail</h3>
                    <button onClick={() => setSelectedOrder(null)} className="text-slate-grey hover:text-deep-navy cursor-pointer">
                      <span className="material-symbols-outlined text-[18px]">close</span>
                    </button>
                  </div>

                  <div className="p-5 space-y-4">
                    {/* Status */}
                    <div className="flex items-center gap-3">
                      <span className={`text-[9px] font-label-caps uppercase tracking-widest px-3 py-1.5 border ${STATUS_CONFIG[selectedOrder.status?.toUpperCase()]?.className || ""}`}>
                        {STATUS_CONFIG[selectedOrder.status?.toUpperCase()]?.label || selectedOrder.status}
                      </span>
                    </div>

                    {/* Fields */}
                    {[
                      { label: "Order ID", value: selectedOrder.orderId },
                      { label: "Payment ID", value: selectedOrder.paymentId || "—" },
                      { label: "Currency", value: selectedOrder.currency },
                      { label: "Amount", value: `${selectedOrder.currency} ${selectedOrder.amount?.toLocaleString()}` },
                      { label: "Email", value: selectedOrder.userEmail || "—" },
                      { label: "Created", value: new Date(selectedOrder.createdAt).toLocaleString("en-IN") },
                    ].map((row) => (
                      <div key={row.label} className="space-y-0.5">
                        <p className="font-label-caps text-[9px] uppercase tracking-widest text-slate-grey">{row.label}</p>
                        <p className="font-body-md text-sm text-ink-black break-all">{row.value}</p>
                      </div>
                    ))}
                  </div>

                  {/* Actions */}
                  <div className="p-5 space-y-2">
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(selectedOrder.orderId);
                        showToast("Order ID copied!");
                      }}
                      className="w-full flex items-center justify-center gap-2 border border-slate-grey/25 py-2 text-[10px] font-label-caps uppercase tracking-widest text-slate-grey hover:border-deep-navy hover:text-deep-navy transition-colors cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[14px]">content_copy</span>
                      Copy Order ID
                    </button>
                    {selectedOrder.status === "SUCCESS" && (
                      <a
                        href="/delivery"
                        target="_blank"
                        className="w-full flex items-center justify-center gap-2 bg-deep-navy text-pure-white py-2 text-[10px] font-label-caps uppercase tracking-widest hover:bg-ink-black transition-colors cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[14px]">local_shipping</span>
                        Open Delivery Portal
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
