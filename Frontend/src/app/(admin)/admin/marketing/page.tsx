"use client";

import React, { useState, useEffect } from "react";
import {
  fetchPromoCodes, createPromoCode, updatePromoCode, deletePromoCode,
  fetchPaymentLogs, fetchAdminStats, fetchUsers,
} from "@/utils/api";

interface PromoCode {
  code: string;
  discount: number;
  type: "percentage" | "fixed";
  isActive: boolean;
  createdAt: string;
  description?: string;
  minSubtotal?: number;
  usageLimit?: number;
  usedCount?: number;
  expiryDate?: string;
}

interface PaymentLog {
  id: string;
  orderId: string;
  paymentId?: string;
  amount: number;
  currency: string;
  status: string;
  userEmail?: string;
  createdAt: string;
}

const STATUS_STYLE: Record<string, string> = {
  SUCCESS: "bg-green-50 text-green-700 border-green-200",
  DELIVERED: "bg-blue-50 text-blue-700 border-blue-200",
  CREATED: "bg-amber-50 text-amber-700 border-amber-200",
  FAILED: "bg-red-50 text-red-700 border-red-200",
};

export default function AdminMarketingPage() {
  const [activeTab, setActiveTab] = useState<"promo" | "payments" | "vrixplus">("promo");

  // Promo state
  const [promoCodes, setPromoCodes] = useState<PromoCode[]>([]);
  const [promoLoading, setPromoLoading] = useState(false);
  const [newCode, setNewCode] = useState("");
  const [newDiscount, setNewDiscount] = useState<number>(10);
  const [newType, setNewType] = useState<"percentage" | "fixed">("percentage");
  const [newDescription, setNewDescription] = useState("");
  const [newMinSubtotal, setNewMinSubtotal] = useState<number | "">("");
  const [newUsageLimit, setNewUsageLimit] = useState<number | "">("");
  const [newExpiryDate, setNewExpiryDate] = useState("");
  const [creating, setCreating] = useState(false);

  // VRIX+ Club Members state
  const [vrixMembers, setVrixMembers] = useState<any[]>([]);
  const [vrixLoading, setVrixLoading] = useState(false);
  const [newMemberEmail, setNewMemberEmail] = useState("");
  const [addingMember, setAddingMember] = useState(false);
  const [vrixSearch, setVrixSearch] = useState("");

  // Payment state
  const [paymentLogs, setPaymentLogs] = useState<PaymentLog[]>([]);
  const [payLoading, setPayLoading] = useState(false);
  const [paySearch, setPaySearch] = useState("");
  const [payFilter, setPayFilter] = useState("All");

  // Stats
  const [stats, setStats] = useState<any>(null);

  const [toast, setToast] = useState<{ msg: string; type: "ok" | "err" } | null>(null);

  const showToast = (msg: string, type: "ok" | "err" = "ok") => {
    setToast({ msg, type }); setTimeout(() => setToast(null), 3500);
  };

  useEffect(() => {
    if (activeTab === "promo") loadPromoCodes();
    if (activeTab === "payments") loadPaymentLogs();
    if (activeTab === "vrixplus") loadVrixMembers();
    loadStats();
  }, [activeTab]);

  const loadPromoCodes = async () => {
    setPromoLoading(true);
    try { setPromoCodes(await fetchPromoCodes()); }
    catch (err: any) { showToast("Failed: " + err.message, "err"); }
    finally { setPromoLoading(false); }
  };

  const loadPaymentLogs = async () => {
    setPayLoading(true);
    try { setPaymentLogs(await fetchPaymentLogs()); }
    catch (err: any) { showToast("Failed: " + err.message, "err"); }
    finally { setPayLoading(false); }
  };

  const loadStats = async () => {
    try { setStats(await fetchAdminStats()); }
    catch {}
  };

  const loadVrixMembers = async () => {
    setVrixLoading(true);
    try {
      const allUsers = await fetchUsers();
      const members = allUsers.filter((u: any) => u.isVrixPlusMember);
      setVrixMembers(members);
    } catch (err: any) {
      showToast("Failed to load VRIX+ members: " + err.message, "err");
    } finally {
      setVrixLoading(false);
    }
  };

  const handleCreateCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCode || !newDiscount) { showToast("All fields required.", "err"); return; }
    setCreating(true);
    try {
      await createPromoCode({
        code: newCode.toUpperCase(),
        discount: newDiscount,
        type: newType,
        description: newDescription || null,
        minSubtotal: newMinSubtotal !== "" ? Number(newMinSubtotal) : null,
        usageLimit: newUsageLimit !== "" ? Number(newUsageLimit) : null,
        expiryDate: newExpiryDate || null
      });
      showToast(`Code "${newCode.toUpperCase()}" created.`);
      setNewCode("");
      setNewDiscount(10);
      setNewType("percentage");
      setNewDescription("");
      setNewMinSubtotal("");
      setNewUsageLimit("");
      setNewExpiryDate("");
      loadPromoCodes();
    } catch (err: any) { showToast("Failed: " + err.message, "err"); }
    finally { setCreating(false); }
  };

  const handleToggle = async (code: PromoCode) => {
    try {
      await updatePromoCode(code.code, { isActive: !code.isActive });
      setPromoCodes((prev) => prev.map((c) => c.code === code.code ? { ...c, isActive: !c.isActive } : c));
      showToast(`"${code.code}" ${!code.isActive ? "activated" : "deactivated"}.`);
    } catch (err: any) { showToast("Failed: " + err.message, "err"); }
  };

  const handleDelete = async (code: string) => {
    if (!confirm(`Delete code "${code}"?`)) return;
    try {
      await deletePromoCode(code);
      setPromoCodes((prev) => prev.filter((c) => c.code !== code));
      showToast(`"${code}" deleted.`);
    } catch (err: any) { showToast("Failed: " + err.message, "err"); }
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemberEmail.trim()) return;
    setAddingMember(true);
    try {
      const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
      const res = await fetch(`${apiBaseUrl}/auth/join-vrix-plus`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: newMemberEmail.trim() })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to add member.");
      showToast(`Member "${newMemberEmail.trim()}" added to VRIX+ Club.`);
      setNewMemberEmail("");
      loadVrixMembers();
    } catch (err: any) {
      showToast("Failed: " + err.message, "err");
    } finally {
      setAddingMember(false);
    }
  };

  const handleRemoveMember = async (email: string) => {
    if (!confirm(`Remove VRIX+ membership for "${email}"?`)) return;
    try {
      const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
      const res = await fetch(`${apiBaseUrl}/admin/users/${encodeURIComponent(email)}/vrix-plus`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isVrixPlusMember: false })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update membership.");
      showToast(`Removed VRIX+ membership for "${email}".`);
      loadVrixMembers();
    } catch (err: any) {
      showToast("Failed: " + err.message, "err");
    }
  };

  const filteredPayments = paymentLogs.filter((p) => {
    const matchSearch = p.orderId?.toLowerCase().includes(paySearch.toLowerCase()) ||
      p.paymentId?.toLowerCase().includes(paySearch.toLowerCase()) ||
      p.userEmail?.toLowerCase().includes(paySearch.toLowerCase());
    const matchFilter = payFilter === "All" || p.status?.toUpperCase() === payFilter;
    return matchSearch && matchFilter;
  });

  const totalRevenue = paymentLogs
    .filter((p) => p.status === "SUCCESS" || p.status === "DELIVERED")
    .reduce((acc, p) => acc + (p.amount || 0), 0);

  return (
    <div className="w-full min-h-screen bg-soft-linen/50 p-6 md:p-10 relative">
      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 px-6 py-4 border shadow-2xl flex items-center gap-3 animate-fade-in text-sm font-body-md ${toast.type === "ok" ? "bg-deep-navy text-pure-white border-slate-grey/30" : "bg-red-900 text-white border-red-700"}`}>
          <span className="material-symbols-outlined text-[16px]">{toast.type === "ok" ? "check_circle" : "error"}</span>
          {toast.msg}
        </div>
      )}

      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="border-b border-slate-grey/20 pb-6">
          <h1 className="font-display-lg text-headline-md text-deep-navy uppercase">Marketing & Payments</h1>
          <p className="text-slate-grey font-body-md text-sm mt-1">Manage redeem codes, view Razorpay transactions, and track revenue.</p>
        </div>

        {/* Quick Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Total Revenue", value: `₹${(totalRevenue / 100).toLocaleString()}`, icon: "payments" },
            { label: "Total Orders", value: paymentLogs.length, icon: "receipt_long" },
            { label: "Active Promo Codes", value: promoCodes.filter((c) => c.isActive).length, icon: "confirmation_number" },
            { label: "Delivered", value: paymentLogs.filter((p) => p.status === "DELIVERED").length, icon: "local_shipping" },
          ].map((s) => (
            <div key={s.label} className="bg-pure-white border border-slate-grey/20 p-4">
              <p className="font-label-caps text-[9px] uppercase tracking-widest text-slate-grey">{s.label}</p>
              <p className="font-headline-md text-xl text-deep-navy font-bold mt-1">{s.value}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-0 border-b border-slate-grey/20">
          {[
            { key: "promo", label: "Promo / Redeem Codes", icon: "confirmation_number" },
            { key: "payments", label: "Payment Logs", icon: "receipt_long" },
            { key: "vrixplus", label: "VRIX+ Club Members", icon: "stars" },
          ].map((tab) => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key as any)}
              className={`flex items-center gap-2 px-6 py-3 font-label-caps text-[10px] uppercase tracking-widest border-b-2 transition-colors cursor-pointer ${activeTab === tab.key ? "border-deep-navy text-deep-navy" : "border-transparent text-slate-grey hover:text-deep-navy"}`}
            >
              <span className="material-symbols-outlined text-[15px]">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* ─── PROMO CODES TAB ─────────────────────────────────────────── */}
        {activeTab === "promo" && (
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            {/* Create Form */}
            <div className="lg:col-span-2 bg-pure-white border border-slate-grey/20 p-6 shadow-sm space-y-5 self-start">
              <h2 className="font-label-caps text-[11px] uppercase tracking-widest text-deep-navy border-b border-slate-grey/15 pb-3">Create New Code</h2>
              <form onSubmit={handleCreateCode} className="space-y-4">
                <div className="flex flex-col gap-1.5">
                  <label className="font-label-caps text-[9px] text-slate-grey uppercase tracking-widest">Code *</label>
                  <input type="text" value={newCode} onChange={(e) => setNewCode(e.target.value.toUpperCase())} placeholder="e.g. VRIX20" required className="border-b border-slate-grey/30 py-2 focus:border-deep-navy outline-none font-body-md text-ink-black uppercase tracking-widest text-sm bg-transparent" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="font-label-caps text-[9px] text-slate-grey uppercase tracking-widest">Discount Value *</label>
                  <input type="number" value={newDiscount} onChange={(e) => setNewDiscount(Number(e.target.value))} required min={1} className="border-b border-slate-grey/30 py-2 focus:border-deep-navy outline-none font-body-md text-sm bg-transparent" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="font-label-caps text-[9px] text-slate-grey uppercase tracking-widest">Type *</label>
                  <select value={newType} onChange={(e) => setNewType(e.target.value as any)} className="border-b border-slate-grey/30 py-2 bg-transparent focus:border-deep-navy outline-none font-body-md text-sm cursor-pointer">
                    <option value="percentage">Percentage (%) off</option>
                    <option value="fixed">Fixed Amount (₹) off</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="font-label-caps text-[9px] text-slate-grey uppercase tracking-widest">Description</label>
                  <input type="text" value={newDescription} onChange={(e) => setNewDescription(e.target.value)} placeholder="e.g. Welcome first order discount" className="border-b border-slate-grey/30 py-2 focus:border-deep-navy outline-none font-body-md text-sm bg-transparent" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="font-label-caps text-[9px] text-slate-grey uppercase tracking-widest">Min Order Subtotal (₹)</label>
                    <input type="number" value={newMinSubtotal} onChange={(e) => setNewMinSubtotal(e.target.value !== "" ? Number(e.target.value) : "")} placeholder="None" min={0} className="border-b border-slate-grey/30 py-2 focus:border-deep-navy outline-none font-body-md text-sm bg-transparent" />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="font-label-caps text-[9px] text-slate-grey uppercase tracking-widest">Usage Limit</label>
                    <input type="number" value={newUsageLimit} onChange={(e) => setNewUsageLimit(e.target.value !== "" ? Number(e.target.value) : "")} placeholder="Unlimited" min={1} className="border-b border-slate-grey/30 py-2 focus:border-deep-navy outline-none font-body-md text-sm bg-transparent" />
                  </div>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="font-label-caps text-[9px] text-slate-grey uppercase tracking-widest">Expiry Date</label>
                  <input type="date" value={newExpiryDate} onChange={(e) => setNewExpiryDate(e.target.value)} className="border-b border-slate-grey/30 py-2 focus:border-deep-navy outline-none font-body-md text-sm bg-transparent cursor-pointer" />
                </div>

                {/* Preview */}
                {newCode && (
                  <div className="bg-soft-linen/50 border border-slate-grey/15 p-4 text-center space-y-1">
                    <span className="font-label-caps text-[9px] text-slate-grey uppercase tracking-widest">Preview</span>
                    <p className="font-display-lg text-deep-navy tracking-widest text-xl font-bold">{newCode}</p>
                    <p className="font-body-md text-sm text-slate-grey">{newDiscount}{newType === "percentage" ? "% off" : "₹ off"}</p>
                    {newDescription && <p className="text-xs italic text-slate-grey font-body-md">"{newDescription}"</p>}
                    {(newMinSubtotal || newUsageLimit || newExpiryDate) && (
                      <div className="text-[10px] text-slate-grey uppercase font-label-caps pt-2 border-t border-slate-grey/10 space-y-0.5 text-left">
                        {newMinSubtotal ? <p>• Min Order: ₹{newMinSubtotal}</p> : null}
                        {newUsageLimit ? <p>• Limit: {newUsageLimit} uses</p> : null}
                        {newExpiryDate ? <p>• Expires: {newExpiryDate}</p> : null}
                      </div>
                    )}
                  </div>
                )}

                <button type="submit" disabled={creating} className="w-full font-button text-[11px] uppercase py-3 bg-deep-navy text-pure-white hover:bg-ink-black transition-colors cursor-pointer flex items-center justify-center gap-2">
                  {creating ? <span className="w-4 h-4 border-2 border-pure-white border-t-transparent rounded-full animate-spin" /> : <><span className="material-symbols-outlined text-[15px]">add</span>Create Code</>}
                </button>
              </form>
            </div>

            {/* Codes List */}
            <div className="lg:col-span-3 bg-pure-white border border-slate-grey/20 shadow-sm overflow-hidden">
              <div className="p-4 border-b border-slate-grey/15 flex justify-between items-center">
                <h2 className="font-label-caps text-[11px] uppercase tracking-widest text-deep-navy">All Codes ({promoCodes.length})</h2>
                <button onClick={loadPromoCodes} className="flex items-center gap-1 text-[9px] font-label-caps uppercase tracking-widest text-slate-grey hover:text-deep-navy cursor-pointer">
                  <span className="material-symbols-outlined text-[13px]">refresh</span>Refresh
                </button>
              </div>
              {promoLoading ? (
                <div className="h-32 flex items-center justify-center text-slate-grey text-xs font-label-caps uppercase tracking-widest">Loading...</div>
              ) : promoCodes.length === 0 ? (
                <div className="h-32 flex flex-col items-center justify-center gap-2 text-slate-grey">
                  <span className="material-symbols-outlined text-3xl">confirmation_number</span>
                  <p className="text-xs font-label-caps uppercase tracking-widest">No codes yet. Create one.</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-grey/10">
                  {promoCodes.map((code) => (
                    <div key={code.code} className="flex items-center justify-between px-5 py-4 hover:bg-soft-linen/20 transition-colors">
                      <div className="space-y-1">
                        <div className="flex items-center gap-3">
                          <span className="font-display-lg text-deep-navy tracking-widest font-bold text-base">{code.code}</span>
                          <span className={`text-[9px] font-label-caps uppercase tracking-widest px-2 py-0.5 border ${code.isActive ? "bg-green-50 text-green-700 border-green-200" : "bg-slate-50 text-slate-400 border-slate-200"}`}>
                            {code.isActive ? "Active" : "Inactive"}
                          </span>
                        </div>
                        {code.description && (
                          <p className="text-xs font-semibold text-deep-navy font-body-md mt-0.5">"{code.description}"</p>
                        )}
                        <p className="text-xs text-slate-grey font-body-md">
                          {code.discount}{code.type === "percentage" ? "% off" : "₹ off"} · {code.type === "percentage" ? "Percentage" : "Fixed"}
                        </p>
                        <div className="text-[10px] text-slate-grey font-label-caps uppercase flex flex-wrap gap-x-3 gap-y-1 pt-1">
                          <span>Created: {new Date(code.createdAt).toLocaleDateString("en-IN")}</span>
                          {code.minSubtotal ? <span>• Min Order: ₹{code.minSubtotal}</span> : null}
                          {code.expiryDate ? (
                            <span className={new Date(code.expiryDate) < new Date() ? "text-error font-semibold" : ""}>
                              • Expires: {new Date(code.expiryDate).toLocaleDateString("en-IN")}
                            </span>
                          ) : null}
                          {(code.usageLimit !== undefined && code.usageLimit !== null && code.usageLimit > 0) ? (
                            <span>• Usage: {code.usedCount || 0} / {code.usageLimit}</span>
                          ) : (
                            <span>• Usage: {code.usedCount || 0} uses</span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => handleToggle(code)}
                          className={`text-[9px] font-label-caps uppercase tracking-widest px-3 py-1.5 border transition-colors cursor-pointer ${code.isActive ? "border-slate-grey/30 text-slate-grey hover:border-deep-navy hover:text-deep-navy" : "border-green-300 text-green-700 hover:bg-green-50"}`}
                        >
                          {code.isActive ? "Disable" : "Enable"}
                        </button>
                        <button onClick={() => handleDelete(code.code)} className="text-slate-grey hover:text-red-600 transition-colors cursor-pointer">
                          <span className="material-symbols-outlined text-[18px]">delete</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ─── PAYMENT LOGS TAB ─────────────────────────────────────────── */}
        {activeTab === "payments" && (
          <div className="bg-pure-white border border-slate-grey/20 shadow-sm overflow-hidden">
            {/* Filters */}
            <div className="p-5 border-b border-slate-grey/15 flex flex-wrap items-center gap-4 justify-between">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-2 top-1/2 -translate-y-1/2 text-slate-grey text-[14px]">search</span>
                  <input type="text" value={paySearch} onChange={(e) => setPaySearch(e.target.value)} placeholder="Search order, payment ID, email…" className="pl-7 pr-3 py-2 text-xs border border-slate-grey/20 focus:border-deep-navy outline-none font-body-md bg-transparent w-52" />
                </div>
                <select value={payFilter} onChange={(e) => setPayFilter(e.target.value)} className="px-3 py-2 text-xs border border-slate-grey/20 bg-pure-white font-body-md focus:border-deep-navy outline-none cursor-pointer">
                  <option value="All">All Status</option>
                  <option value="SUCCESS">Success</option>
                  <option value="DELIVERED">Delivered</option>
                  <option value="CREATED">Pending</option>
                  <option value="FAILED">Failed</option>
                </select>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-label-caps text-[9px] uppercase tracking-widest text-slate-grey">{filteredPayments.length} records</span>
                <button onClick={loadPaymentLogs} className="flex items-center gap-1 text-[9px] font-label-caps uppercase tracking-widest text-slate-grey hover:text-deep-navy cursor-pointer">
                  <span className="material-symbols-outlined text-[13px]">refresh</span>Refresh
                </button>
              </div>
            </div>

            {payLoading ? (
              <div className="h-48 flex items-center justify-center text-slate-grey text-xs font-label-caps uppercase tracking-widest">Loading...</div>
            ) : filteredPayments.length === 0 ? (
              <div className="h-48 flex flex-col items-center justify-center gap-3 text-slate-grey">
                <span className="material-symbols-outlined text-4xl">receipt_long</span>
                <p className="text-xs font-label-caps uppercase tracking-widest">No payment records</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-grey/15 bg-soft-linen/30 text-slate-grey font-label-caps text-[9px] tracking-widest uppercase">
                      <th className="px-5 py-3 font-normal">Order ID</th>
                      <th className="px-5 py-3 font-normal">Payment ID</th>
                      <th className="px-5 py-3 font-normal">Email</th>
                      <th className="px-5 py-3 font-normal">Amount</th>
                      <th className="px-5 py-3 font-normal">Status</th>
                      <th className="px-5 py-3 font-normal">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-grey/10">
                    {filteredPayments.map((log) => (
                      <tr key={log.id} className="hover:bg-soft-linen/20 transition-colors">
                        <td className="px-5 py-4 font-body-md text-xs text-deep-navy font-semibold break-all max-w-[160px]">{log.orderId}</td>
                        <td className="px-5 py-4 font-body-md text-xs text-slate-grey">{log.paymentId || "—"}</td>
                        <td className="px-5 py-4 font-body-md text-xs text-slate-grey">{log.userEmail || "—"}</td>
                        <td className="px-5 py-4 font-body-md text-sm font-semibold text-ink-black">{log.currency} {log.amount?.toLocaleString()}</td>
                        <td className="px-5 py-4">
                          <span className={`text-[9px] font-label-caps uppercase tracking-widest px-2 py-1 border ${STATUS_STYLE[log.status?.toUpperCase()] || "bg-slate-50 text-slate-400 border-slate-200"}`}>
                            {log.status}
                          </span>
                        </td>
                        <td className="px-5 py-4 font-body-md text-xs text-slate-grey whitespace-nowrap">
                          {new Date(log.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {/* Revenue Summary */}
                <div className="p-5 border-t border-slate-grey/15 bg-soft-linen/20 flex justify-between items-center">
                  <span className="font-label-caps text-[10px] uppercase tracking-widest text-slate-grey">
                    Total Revenue (Success + Delivered)
                  </span>
                  <span className="font-headline-md text-lg text-deep-navy font-bold">
                    ₹{(totalRevenue / 100).toLocaleString()}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ─── VRIX+ CLUB MEMBERS TAB ──────────────────────────────────── */}
        {activeTab === "vrixplus" && (
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 animate-fade-in">
            {/* Add Member Form */}
            <div className="lg:col-span-2 bg-pure-white border border-slate-grey/20 p-6 shadow-sm space-y-5 self-start">
              <h2 className="font-label-caps text-[11px] uppercase tracking-widest text-deep-navy border-b border-slate-grey/15 pb-3">
                Register VRIX+ Member
              </h2>
              <form onSubmit={handleAddMember} className="space-y-4">
                <div className="flex flex-col gap-1.5">
                  <label className="font-label-caps text-[9px] text-slate-grey uppercase tracking-widest">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    value={newMemberEmail}
                    onChange={(e) => setNewMemberEmail(e.target.value)}
                    placeholder="Enter email to enroll"
                    required
                    className="border-b border-slate-grey/30 py-2 focus:border-deep-navy outline-none font-body-md text-sm bg-transparent"
                  />
                </div>
                <button
                  type="submit"
                  disabled={addingMember}
                  className="w-full font-button text-[11px] uppercase py-3 bg-deep-navy text-pure-white hover:bg-ink-black transition-colors cursor-pointer flex items-center justify-center gap-2"
                >
                  {addingMember ? (
                    <span className="w-4 h-4 border-2 border-pure-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-[15px]">stars</span>
                      Enroll Member
                    </>
                  )}
                </button>
              </form>
              <p className="text-[10px] text-slate-grey font-body-md leading-relaxed">
                If the email is already registered, they will be upgraded to VRIX+ status. If the email doesn't exist, a placeholder account will be created automatically.
              </p>
            </div>

            {/* Members List */}
            <div className="lg:col-span-3 bg-pure-white border border-slate-grey/20 shadow-sm overflow-hidden">
              <div className="p-4 border-b border-slate-grey/15 flex flex-wrap justify-between items-center gap-3">
                <div className="relative flex-1 max-w-xs">
                  <span className="material-symbols-outlined absolute left-2 top-1/2 -translate-y-1/2 text-slate-grey text-[14px]">search</span>
                  <input
                    type="text"
                    value={vrixSearch}
                    onChange={(e) => setVrixSearch(e.target.value)}
                    placeholder="Search by email or name..."
                    className="pl-7 pr-3 py-1.5 text-xs border border-slate-grey/20 focus:border-deep-navy outline-none font-body-md bg-transparent w-full"
                  />
                </div>
                <button
                  onClick={loadVrixMembers}
                  className="flex items-center gap-1 text-[9px] font-label-caps uppercase tracking-widest text-slate-grey hover:text-deep-navy cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[13px]">refresh</span>Refresh
                </button>
              </div>

              {vrixLoading ? (
                <div className="h-48 flex items-center justify-center text-slate-grey text-xs font-label-caps uppercase tracking-widest">
                  Loading...
                </div>
              ) : vrixMembers.filter((m) =>
                  m.email?.toLowerCase().includes(vrixSearch.toLowerCase()) ||
                  m.name?.toLowerCase().includes(vrixSearch.toLowerCase())
                ).length === 0 ? (
                <div className="h-48 flex flex-col items-center justify-center gap-2 text-slate-grey">
                  <span className="material-symbols-outlined text-3xl text-slate-grey/60">stars</span>
                  <p className="text-xs font-label-caps uppercase tracking-widest">No members found</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-grey/15 bg-soft-linen/30 text-slate-grey font-label-caps text-[9px] tracking-widest uppercase">
                        <th className="px-5 py-3 font-normal">Member Details</th>
                        <th className="px-5 py-3 font-normal">Joined Date</th>
                        <th className="px-5 py-3 font-normal text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-grey/10 font-body-md text-xs">
                      {vrixMembers
                        .filter((m) =>
                          m.email?.toLowerCase().includes(vrixSearch.toLowerCase()) ||
                          m.name?.toLowerCase().includes(vrixSearch.toLowerCase())
                        )
                        .map((member) => (
                          <tr key={member.email} className="hover:bg-soft-linen/20 transition-colors">
                            <td className="px-5 py-3.5 space-y-0.5">
                              <p className="font-semibold text-deep-navy">{member.name || "VRIX+ Member"}</p>
                              <p className="text-slate-grey">{member.email}</p>
                              {member.phone && <p className="text-[10px] text-slate-grey/80">T: {member.phone}</p>}
                            </td>
                            <td className="px-5 py-3.5 text-slate-grey">
                              {member.vrixPlusJoinedDate || "—"}
                            </td>
                            <td className="px-5 py-3.5 text-right">
                              <button
                                onClick={() => handleRemoveMember(member.email)}
                                className="text-[9px] font-label-caps uppercase tracking-widest px-2.5 py-1.5 border border-red-200 text-red-700 hover:bg-red-50 transition-colors cursor-pointer"
                              >
                                Revoke
                              </button>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
