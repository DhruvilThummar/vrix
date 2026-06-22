"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { fetchAdminStats, fetchPaymentLogs, fetchProducts } from "@/utils/api";

interface Stats {
  totalProducts: number;
  totalOrders: number;
  totalRevenue: number;
  pendingOrders: number;
  deliveredOrders: number;
  outOfStock: number;
  hiddenProducts: number;
  totalPromoCodes: number;
}

const STATUS_BADGE: Record<string, string> = {
  SUCCESS: "bg-green-50 text-green-700 border-green-200",
  DELIVERED: "bg-blue-50 text-blue-700 border-blue-200",
  CREATED: "bg-amber-50 text-amber-700 border-amber-200",
  FAILED: "bg-red-50 text-red-700 border-red-200",
};

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [topProducts, setTopProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetchAdminStats().catch(() => null),
      fetchPaymentLogs().catch(() => []),
      fetchProducts().catch(() => []),
    ]).then(([s, o, p]) => {
      setStats(s);
      setOrders((o || []).slice(0, 6));
      setTopProducts((p || []).slice(0, 5));
      setLoading(false);
    });
  }, []);

  const statCards = stats ? [
    { label: "Total Revenue", value: `$${(stats.totalRevenue / 100).toLocaleString()}`, icon: "payments", color: "text-emerald-600", bg: "bg-emerald-50" },
    { label: "Total Orders", value: stats.totalOrders, icon: "receipt_long", color: "text-blue-600", bg: "bg-blue-50" },
    { label: "Pending", value: stats.pendingOrders, icon: "pending_actions", color: "text-amber-600", bg: "bg-amber-50" },
    { label: "Products", value: stats.totalProducts, icon: "inventory_2", color: "text-deep-navy", bg: "bg-soft-linen" },
    { label: "Out of Stock", value: stats.outOfStock, icon: "inventory", color: "text-red-600", bg: "bg-red-50" },
    { label: "Hidden Items", value: stats.hiddenProducts, icon: "visibility_off", color: "text-slate-grey", bg: "bg-slate-100" },
    { label: "Promo Codes", value: stats.totalPromoCodes, icon: "confirmation_number", color: "text-purple-600", bg: "bg-purple-50" },
    { label: "Delivered", value: stats.deliveredOrders, icon: "local_shipping", color: "text-green-600", bg: "bg-green-50" },
  ] : [];

  const quickLinks = [
    { label: "Add Product", href: "/admin/products", icon: "add_circle", desc: "New item to catalogue" },
    { label: "Manage Collections", href: "/admin/collections", icon: "category", desc: "Show/hide collections" },
    { label: "Promo Codes", href: "/admin/marketing", icon: "confirmation_number", desc: "Create & disable codes" },
    { label: "CMS Settings", href: "/admin/cms", icon: "tune", desc: "Features & brand config" },
    { label: "View Orders", href: "/admin/orders", icon: "receipt_long", desc: "All payment orders" },
    { label: "Delivery Panel", href: "/delivery", icon: "local_shipping", desc: "OTP delivery portal" },
  ];

  return (
    <div className="w-full min-h-full p-8 space-y-8">
      {/* Page Title */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="font-display-lg text-2xl text-deep-navy uppercase tracking-widest">Dashboard Overview</h1>
          <p className="text-slate-grey font-body-md text-sm mt-1">Live data from VRIX backend · {new Date().toLocaleDateString("en-IN", { weekday: "long", day: "2-digit", month: "long", year: "numeric" })}</p>
        </div>
        <Link href="/" target="_blank" className="flex items-center gap-2 text-[11px] font-label-caps uppercase tracking-widest text-slate-grey border border-slate-grey/30 px-4 py-2 hover:border-deep-navy hover:text-deep-navy transition-colors">
          <span className="material-symbols-outlined text-[16px]">storefront</span>
          View Store
        </Link>
      </div>

      {/* Stats Grid */}
      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-24 bg-pure-white border border-slate-grey/20 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {statCards.map((s) => (
            <div key={s.label} className="bg-pure-white border border-slate-grey/20 p-5 hover:border-slate-grey/40 transition-colors">
              <div className="flex items-center justify-between mb-3">
                <p className="font-label-caps text-[10px] text-slate-grey uppercase tracking-widest">{s.label}</p>
                <div className={`w-8 h-8 ${s.bg} flex items-center justify-center`}>
                  <span className={`material-symbols-outlined text-[16px] ${s.color}`}>{s.icon}</span>
                </div>
              </div>
              <p className="font-headline-md text-2xl text-deep-navy font-bold">{s.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Quick Links */}
      <div>
        <h2 className="font-label-caps text-[11px] uppercase tracking-widest text-slate-grey mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {quickLinks.map((q) => (
            <Link key={q.label} href={q.href} className="bg-pure-white border border-slate-grey/20 p-4 hover:border-deep-navy hover:shadow-sm transition-all group text-center space-y-2">
              <span className="material-symbols-outlined text-deep-navy text-2xl group-hover:scale-110 transition-transform inline-block">{q.icon}</span>
              <p className="font-label-caps text-[10px] uppercase tracking-widest text-ink-black">{q.label}</p>
              <p className="text-[9px] text-slate-grey font-body-md">{q.desc}</p>
            </Link>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Orders */}
        <div className="lg:col-span-2 bg-pure-white border border-slate-grey/20 overflow-hidden">
          <div className="p-5 border-b border-slate-grey/15 flex justify-between items-center">
            <h2 className="font-headline-md text-base text-deep-navy uppercase">Recent Orders</h2>
            <Link href="/admin/orders" className="font-label-caps text-[10px] uppercase tracking-widest text-slate-grey hover:text-deep-navy transition-colors">
              View All →
            </Link>
          </div>
          {orders.length === 0 ? (
            <div className="p-8 text-center text-slate-grey text-xs font-label-caps uppercase tracking-widest">No orders yet</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-soft-linen/30 border-b border-slate-grey/15 text-slate-grey font-label-caps text-[9px] tracking-widest uppercase">
                    <th className="px-5 py-3 font-normal">Order ID</th>
                    <th className="px-5 py-3 font-normal">Amount</th>
                    <th className="px-5 py-3 font-normal">Status</th>
                    <th className="px-5 py-3 font-normal">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-grey/10">
                  {orders.map((o: any) => (
                    <tr key={o.id} className="hover:bg-soft-linen/20 transition-colors">
                      <td className="px-5 py-3 font-body-md text-sm font-semibold text-deep-navy">{o.orderId}</td>
                      <td className="px-5 py-3 font-body-md text-sm">{o.currency} {(o.amount / 100).toLocaleString()}</td>
                      <td className="px-5 py-3">
                        <span className={`text-[9px] font-label-caps uppercase tracking-widest px-2 py-1 border ${STATUS_BADGE[o.status?.toUpperCase()] || "bg-slate-50 text-slate-500 border-slate-200"}`}>{o.status}</span>
                      </td>
                      <td className="px-5 py-3 text-slate-grey text-xs font-body-md">{new Date(o.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Top Products */}
        <div className="bg-pure-white border border-slate-grey/20 overflow-hidden">
          <div className="p-5 border-b border-slate-grey/15 flex justify-between items-center">
            <h2 className="font-headline-md text-base text-deep-navy uppercase">Catalogue</h2>
            <Link href="/admin/products" className="font-label-caps text-[10px] uppercase tracking-widest text-slate-grey hover:text-deep-navy transition-colors">
              Manage →
            </Link>
          </div>
          {topProducts.length === 0 ? (
            <div className="p-8 text-center text-slate-grey text-xs font-label-caps uppercase tracking-widest">No products</div>
          ) : (
            <div className="divide-y divide-slate-grey/10">
              {topProducts.map((p: any) => (
                <div key={p.id} className="flex items-center gap-3 px-5 py-3 hover:bg-soft-linen/20 transition-colors">
                  <div className="w-10 h-12 relative bg-soft-linen overflow-hidden shrink-0 border border-slate-grey/10">
                    <Image src={p.image} alt={p.title} fill className="object-cover mix-blend-multiply" sizes="40px" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-body-md text-ink-black truncate font-medium">{p.title}</p>
                    <p className="text-[10px] text-slate-grey font-label-caps uppercase tracking-wider">{p.collection || p.material}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs font-semibold text-deep-navy">${p.price}</p>
                    <p className="text-[9px] text-slate-grey font-label-caps uppercase">{p.isVisible !== false ? "Visible" : "Hidden"}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
