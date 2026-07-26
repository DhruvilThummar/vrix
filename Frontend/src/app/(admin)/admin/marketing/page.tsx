"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  fetchPromoCodes, createPromoCode, updatePromoCode, deletePromoCode,
  fetchPaymentLogs, fetchAdminStats, fetchUsers, fetchDb, updateCMS, getApiBaseUrl,
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
  maxDiscount?: number;
  applicableCollections?: string[];
  firstOrderOnly?: boolean;
  perUserLimit?: number;
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
  customerName?: string;
  customerPhone?: string;
  address?: string;
  city?: string;
  postalCode?: string;
}

interface AnnouncementBar {
  isEnabled: boolean;
  interval: number;
  backgroundColor: string;
  textColor: string;
  fontSize: string;
  lines: string[];
}

const STATUS_STYLE: Record<string, string> = {
  SUCCESS: "bg-emerald-50 text-emerald-700 border-emerald-200",
  DELIVERED: "bg-blue-50 text-blue-700 border-blue-200",
  CREATED: "bg-amber-50 text-amber-700 border-amber-200",
  FAILED: "bg-red-50 text-red-700 border-red-200",
  REFUNDED: "bg-purple-50 text-purple-700 border-purple-200",
  PENDING: "bg-orange-50 text-orange-700 border-orange-200",
};

const STATUS_ICON: Record<string, string> = {
  SUCCESS: "check_circle",
  DELIVERED: "local_shipping",
  CREATED: "schedule",
  FAILED: "cancel",
  REFUNDED: "undo",
  PENDING: "hourglass_top",
};

export default function AdminMarketingPage() {
  const [activeTab, setActiveTab] = useState<"promo" | "payments" | "vrixplus" | "announcement">("promo");

  // Promo state
  const [promoCodes, setPromoCodes] = useState<PromoCode[]>([]);
  const [promoLoading, setPromoLoading] = useState(false);
  const [promoSearch, setPromoSearch] = useState("");
  const [promoFilter, setPromoFilter] = useState<"all" | "active" | "inactive" | "expired">("all");
  const [newCode, setNewCode] = useState("");
  const [newDiscount, setNewDiscount] = useState<number>(10);
  const [newType, setNewType] = useState<"percentage" | "fixed">("percentage");
  const [newDescription, setNewDescription] = useState("");
  const [newMinSubtotal, setNewMinSubtotal] = useState<number | "">("");
  const [newUsageLimit, setNewUsageLimit] = useState<number | "">("");
  const [newExpiryDate, setNewExpiryDate] = useState("");
  const [newMaxDiscount, setNewMaxDiscount] = useState<number | "">("");
  const [newFirstOrderOnly, setNewFirstOrderOnly] = useState(false);
  const [newPerUserLimit, setNewPerUserLimit] = useState<number | "">("");
  const [creating, setCreating] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(true);
  const [selectedPromos, setSelectedPromos] = useState<Set<string>>(new Set());
  const [editingPromo, setEditingPromo] = useState<string | null>(null);
  const [editDiscount, setEditDiscount] = useState<number>(0);
  const [editDescription, setEditDescription] = useState("");

  // VRIX+ Club Members state
  const [vrixMembers, setVrixMembers] = useState<any[]>([]);
  const [vrixLoading, setVrixLoading] = useState(false);
  const [newMemberEmail, setNewMemberEmail] = useState("");
  const [addingMember, setAddingMember] = useState(false);
  const [vrixSearch, setVrixSearch] = useState("");
  const [vrixSort, setVrixSort] = useState<"newest" | "oldest" | "name">("newest");

  // Payment state
  const [paymentLogs, setPaymentLogs] = useState<PaymentLog[]>([]);
  const [payLoading, setPayLoading] = useState(false);
  const [paySearch, setPaySearch] = useState("");
  const [payFilter, setPayFilter] = useState("All");
  const [payDateFrom, setPayDateFrom] = useState("");
  const [payDateTo, setPayDateTo] = useState("");
  const [paySort, setPaySort] = useState<"newest" | "oldest" | "amount-high" | "amount-low">("newest");
  const [expandedPayment, setExpandedPayment] = useState<string | null>(null);

  // Announcement Bar state
  const [announcementBar, setAnnouncementBar] = useState<AnnouncementBar>({
    isEnabled: true, interval: 3000, backgroundColor: "#000000",
    textColor: "#ffffff", fontSize: "11px", lines: [],
  });
  const [announcementLoading, setAnnouncementLoading] = useState(false);
  const [announcementSaving, setAnnouncementSaving] = useState(false);
  const [newAnnouncementLine, setNewAnnouncementLine] = useState("");
  const [editingLineIdx, setEditingLineIdx] = useState<number | null>(null);
  const [editLineText, setEditLineText] = useState("");

  // Stats
  const [stats, setStats] = useState<any>(null);

  const [toast, setToast] = useState<{ msg: string; type: "ok" | "err" } | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const showToast = useCallback((msg: string, type: "ok" | "err" = "ok") => {
    setToast({ msg, type }); setTimeout(() => setToast(null), 3500);
  }, []);



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

  const loadAnnouncementBar = async () => {
    setAnnouncementLoading(true);
    try {
      const data = await fetchDb();
      if (data.announcement_bar) setAnnouncementBar(data.announcement_bar);
    } catch (err: any) {
      showToast("Failed to load announcement bar: " + err.message, "err");
    } finally {
      setAnnouncementLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === "promo") loadPromoCodes();
    if (activeTab === "payments") loadPaymentLogs();
    if (activeTab === "vrixplus") loadVrixMembers();
    if (activeTab === "announcement") loadAnnouncementBar();
    loadStats();
  }, [activeTab]);

  // ─── Promo Handlers ──────────────────────────────────────────────────────────

  const handleCreateCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCode || !newDiscount) { showToast("Code and discount are required.", "err"); return; }
    setCreating(true);
    try {
      await createPromoCode({
        code: newCode.toUpperCase(),
        discount: newDiscount,
        type: newType,
        description: newDescription || null,
        minSubtotal: newMinSubtotal !== "" ? Number(newMinSubtotal) : null,
        usageLimit: newUsageLimit !== "" ? Number(newUsageLimit) : null,
        expiryDate: newExpiryDate || null,
      } as any);
      showToast(`Code "${newCode.toUpperCase()}" created successfully.`);
      setNewCode(""); setNewDiscount(10); setNewType("percentage");
      setNewDescription(""); setNewMinSubtotal(""); setNewUsageLimit("");
      setNewExpiryDate(""); setNewMaxDiscount(""); setNewFirstOrderOnly(false);
      setNewPerUserLimit("");
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
    if (!confirm(`Delete code "${code}"? This action cannot be undone.`)) return;
    try {
      await deletePromoCode(code);
      setPromoCodes((prev) => prev.filter((c) => c.code !== code));
      showToast(`"${code}" deleted.`);
    } catch (err: any) { showToast("Failed: " + err.message, "err"); }
  };

  const handleBulkDelete = async () => {
    if (selectedPromos.size === 0) return;
    if (!confirm(`Delete ${selectedPromos.size} selected code(s)?`)) return;
    for (const code of selectedPromos) {
      try { await deletePromoCode(code); } catch {}
    }
    showToast(`${selectedPromos.size} code(s) deleted.`);
    setSelectedPromos(new Set());
    loadPromoCodes();
  };

  const handleBulkToggle = async (activate: boolean) => {
    if (selectedPromos.size === 0) return;
    for (const code of selectedPromos) {
      try { await updatePromoCode(code, { isActive: activate }); } catch {}
    }
    showToast(`${selectedPromos.size} code(s) ${activate ? "activated" : "deactivated"}.`);
    setSelectedPromos(new Set());
    loadPromoCodes();
  };

  const handleEditSave = async (code: string) => {
    try {
      await updatePromoCode(code, { discount: editDiscount, description: editDescription });
      showToast(`"${code}" updated.`);
      setEditingPromo(null);
      loadPromoCodes();
    } catch (err: any) { showToast("Failed: " + err.message, "err"); }
  };

  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const exportPromoCSV = () => {
    const headers = "Code,Discount,Type,Status,Description,Min Subtotal,Usage Limit,Used,Expiry,Created\n";
    const rows = promoCodes.map(c =>
      `${c.code},${c.discount},${c.type},${c.isActive ? "Active" : "Inactive"},"${c.description || ""}",${c.minSubtotal || ""},${c.usageLimit || ""},${c.usedCount || 0},${c.expiryDate || ""},${c.createdAt}`
    ).join("\n");
    const blob = new Blob([headers + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "promo-codes.csv"; a.click();
    URL.revokeObjectURL(url);
    showToast("Promo codes exported.");
  };

  // ─── VRIX+ Handlers ──────────────────────────────────────────────────────────

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemberEmail.trim()) return;
    setAddingMember(true);
    try {
      const apiBaseUrl = getApiBaseUrl();
      const res = await fetch(`${apiBaseUrl}/auth/join-vrix-plus`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: newMemberEmail.trim() })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to add member.");
      showToast(`"${newMemberEmail.trim()}" added to VRIX+ Club.`);
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
      const apiBaseUrl = getApiBaseUrl();
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

  const exportMembersCSV = () => {
    const headers = "Email,Name,Phone,Joined Date\n";
    const rows = vrixMembers.map(m =>
      `${m.email},"${m.name || ""}","${m.phone || ""}","${m.vrixPlusJoinedDate || ""}"`
    ).join("\n");
    const blob = new Blob([headers + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "vrix-plus-members.csv"; a.click();
    URL.revokeObjectURL(url);
    showToast("Members exported.");
  };

  // ─── Announcement Handlers ────────────────────────────────────────────────────

  const handleSaveAnnouncement = async () => {
    setAnnouncementSaving(true);
    try {
      await updateCMS({ announcement_bar: announcementBar } as any);
      showToast("Announcement bar settings saved.");
    } catch (err: any) {
      showToast("Failed: " + err.message, "err");
    } finally {
      setAnnouncementSaving(false);
    }
  };

  const addAnnouncementLine = () => {
    if (!newAnnouncementLine.trim()) return;
    setAnnouncementBar(prev => ({
      ...prev,
      lines: [...prev.lines, newAnnouncementLine.trim()]
    }));
    setNewAnnouncementLine("");
  };

  const removeAnnouncementLine = (idx: number) => {
    setAnnouncementBar(prev => ({
      ...prev,
      lines: prev.lines.filter((_, i) => i !== idx)
    }));
  };

  const saveEditLine = (idx: number) => {
    setAnnouncementBar(prev => ({
      ...prev,
      lines: prev.lines.map((l, i) => i === idx ? editLineText : l)
    }));
    setEditingLineIdx(null);
    setEditLineText("");
  };

  const moveLineUp = (idx: number) => {
    if (idx === 0) return;
    setAnnouncementBar(prev => {
      const lines = [...prev.lines];
      [lines[idx - 1], lines[idx]] = [lines[idx], lines[idx - 1]];
      return { ...prev, lines };
    });
  };

  const moveLineDown = (idx: number) => {
    setAnnouncementBar(prev => {
      if (idx >= prev.lines.length - 1) return prev;
      const lines = [...prev.lines];
      [lines[idx], lines[idx + 1]] = [lines[idx + 1], lines[idx]];
      return { ...prev, lines };
    });
  };

  // ─── Payment Handlers ─────────────────────────────────────────────────────────

  const exportPaymentsCSV = () => {
    const headers = "Order ID,Payment ID,Email,Customer,Amount,Currency,Status,Date\n";
    const rows = filteredPayments.map(p =>
      `${p.orderId},${p.paymentId || ""},${p.userEmail || ""},"${p.customerName || ""}",${p.amount},${p.currency},${p.status},${p.createdAt}`
    ).join("\n");
    const blob = new Blob([headers + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "payment-logs.csv"; a.click();
    URL.revokeObjectURL(url);
    showToast("Payment logs exported.");
  };

  // ─── Computed Values ──────────────────────────────────────────────────────────

  const isCodeExpired = (code: PromoCode) => {
    if (!code.expiryDate) return false;
    return new Date(code.expiryDate) < new Date();
  };

  const filteredPromos = promoCodes.filter((c) => {
    const matchSearch = c.code.toLowerCase().includes(promoSearch.toLowerCase()) ||
      c.description?.toLowerCase().includes(promoSearch.toLowerCase());
    let matchFilter = true;
    if (promoFilter === "active") matchFilter = c.isActive && !isCodeExpired(c);
    if (promoFilter === "inactive") matchFilter = !c.isActive;
    if (promoFilter === "expired") matchFilter = isCodeExpired(c);
    return matchSearch && matchFilter;
  });

  const filteredPayments = paymentLogs.filter((p) => {
    const matchSearch = p.orderId?.toLowerCase().includes(paySearch.toLowerCase()) ||
      p.paymentId?.toLowerCase().includes(paySearch.toLowerCase()) ||
      p.userEmail?.toLowerCase().includes(paySearch.toLowerCase()) ||
      p.customerName?.toLowerCase().includes(paySearch.toLowerCase());
    const matchFilter = payFilter === "All" || p.status?.toUpperCase() === payFilter;
    let matchDate = true;
    if (payDateFrom) matchDate = new Date(p.createdAt) >= new Date(payDateFrom);
    if (payDateTo) matchDate = matchDate && new Date(p.createdAt) <= new Date(payDateTo + "T23:59:59");
    return matchSearch && matchFilter && matchDate;
  }).sort((a, b) => {
    if (paySort === "newest") return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    if (paySort === "oldest") return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    if (paySort === "amount-high") return b.amount - a.amount;
    if (paySort === "amount-low") return a.amount - b.amount;
    return 0;
  });

  const sortedVrixMembers = (() => {
    const filtered = vrixMembers.filter((m) =>
      m.email?.toLowerCase().includes(vrixSearch.toLowerCase()) ||
      m.name?.toLowerCase().includes(vrixSearch.toLowerCase())
    );
    if (vrixSort === "name") return filtered.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
    if (vrixSort === "oldest") return filtered.sort((a, b) => (a.vrixPlusJoinedDate || "").localeCompare(b.vrixPlusJoinedDate || ""));
    return filtered; // newest = default order
  })();

  const totalRevenue = paymentLogs
    .filter((p) => p.status === "SUCCESS" || p.status === "DELIVERED")
    .reduce((acc, p) => acc + (p.amount || 0), 0);

  const successRate = paymentLogs.length > 0
    ? Math.round((paymentLogs.filter(p => p.status === "SUCCESS" || p.status === "DELIVERED").length / paymentLogs.length) * 100)
    : 0;

  const avgOrderValue = paymentLogs.filter(p => p.status === "SUCCESS" || p.status === "DELIVERED").length > 0
    ? totalRevenue / paymentLogs.filter(p => p.status === "SUCCESS" || p.status === "DELIVERED").length
    : 0;

  const TABS = [
    { key: "promo", label: "Promo Codes", icon: "confirmation_number", count: promoCodes.length },
    { key: "payments", label: "Payment Logs", icon: "receipt_long", count: paymentLogs.length },
    { key: "vrixplus", label: "VRIX+ Club", icon: "stars", count: vrixMembers.length },
    { key: "announcement", label: "Announcement Bar", icon: "campaign", count: announcementBar.lines.length },
  ];

  return (
    <div className="w-full min-h-screen bg-soft-linen/50 p-4 md:p-8 relative">
      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 px-5 py-3.5 border shadow-2xl flex items-center gap-3 animate-fade-in text-sm font-body-md max-w-md ${toast.type === "ok" ? "bg-deep-navy text-pure-white border-slate-grey/30" : "bg-red-900 text-white border-red-700"}`}>
          <span className="material-symbols-outlined text-[16px]">{toast.type === "ok" ? "check_circle" : "error"}</span>
          <span className="flex-1">{toast.msg}</span>
          <button onClick={() => setToast(null)} className="ml-2 opacity-70 hover:opacity-100 cursor-pointer">
            <span className="material-symbols-outlined text-[14px]">close</span>
          </button>
        </div>
      )}

      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 border-b border-slate-grey/20 pb-6">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className="w-10 h-10 bg-deep-navy flex items-center justify-center">
                <span className="material-symbols-outlined text-pure-white text-xl">storefront</span>
              </div>
              <div>
                <h1 className="font-display-lg text-headline-md text-deep-navy uppercase tracking-wider">Marketing Hub</h1>
                <p className="text-slate-grey font-body-md text-xs mt-0.5">Manage promotions, transactions, members & storefront announcements.</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 text-[9px] font-label-caps uppercase tracking-widest text-slate-grey">
            <span className="material-symbols-outlined text-[14px]">schedule</span>
            Last refreshed: {new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
          </div>
        </div>

        {/* Quick Stats Row — Enhanced */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {[
            { label: "Total Revenue", value: `₹${(totalRevenue / 100).toLocaleString("en-IN")}`, icon: "payments", color: "bg-emerald-500", trend: stats?.totalRevenue ? "+12%" : "" },
            { label: "Total Orders", value: paymentLogs.length, icon: "receipt_long", color: "bg-blue-500", trend: "" },
            { label: "Active Promos", value: promoCodes.filter((c) => c.isActive).length, icon: "confirmation_number", color: "bg-amber-500", trend: "" },
            { label: "Success Rate", value: `${successRate}%`, icon: "trending_up", color: "bg-indigo-500", trend: "" },
            { label: "VRIX+ Members", value: vrixMembers.length, icon: "stars", color: "bg-purple-500", trend: "" },
          ].map((s) => (
            <div key={s.label} className="bg-pure-white border border-slate-grey/15 p-4 group hover:border-slate-grey/30 transition-all hover:shadow-sm relative overflow-hidden">
              <div className={`absolute top-0 left-0 w-1 h-full ${s.color}`} />
              <div className="flex items-start justify-between">
                <div className="pl-2">
                  <p className="font-label-caps text-[8px] uppercase tracking-widest text-slate-grey">{s.label}</p>
                  <p className="font-headline-md text-xl text-deep-navy font-bold mt-1">{s.value}</p>
                </div>
                <div className={`w-8 h-8 ${s.color} bg-opacity-10 flex items-center justify-center rounded-full`}>
                  <span className="material-symbols-outlined text-[16px] text-slate-grey">{s.icon}</span>
                </div>
              </div>
              {s.trend && (
                <p className="text-[9px] text-emerald-600 font-label-caps mt-1 pl-2 flex items-center gap-0.5">
                  <span className="material-symbols-outlined text-[10px]">arrow_upward</span>{s.trend} this month
                </p>
              )}
            </div>
          ))}
        </div>

        {/* Tabs — Enhanced with counts */}
        <div className="flex gap-0 border-b border-slate-grey/20 overflow-x-auto">
          {TABS.map((tab) => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key as any)}
              className={`flex items-center gap-2 px-5 py-3 font-label-caps text-[10px] uppercase tracking-widest border-b-2 transition-all cursor-pointer whitespace-nowrap ${activeTab === tab.key ? "border-deep-navy text-deep-navy" : "border-transparent text-slate-grey hover:text-deep-navy hover:border-slate-grey/30"}`}
            >
              <span className="material-symbols-outlined text-[15px]">{tab.icon}</span>
              {tab.label}
              <span className={`text-[8px] px-1.5 py-0.5 rounded-full ${activeTab === tab.key ? "bg-deep-navy text-pure-white" : "bg-slate-grey/10 text-slate-grey"}`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* ═══════════════════════════════════════════════════════════════════════
            PROMO CODES TAB
        ═══════════════════════════════════════════════════════════════════════ */}
        {activeTab === "promo" && (
          <div className="space-y-4 animate-fade-in">
            {/* Toolbar */}
            <div className="flex flex-wrap items-center gap-3 bg-pure-white border border-slate-grey/15 p-3">
              <div className="relative flex-1 min-w-[180px] max-w-xs">
                <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-grey text-[14px]">search</span>
                <input type="text" value={promoSearch} onChange={(e) => setPromoSearch(e.target.value)} placeholder="Search codes..." className="pl-8 pr-3 py-2 text-xs border border-slate-grey/20 focus:border-deep-navy outline-none font-body-md bg-transparent w-full" />
              </div>
              <div className="flex items-center gap-1">
                {(["all", "active", "inactive", "expired"] as const).map(f => (
                  <button key={f} onClick={() => setPromoFilter(f)}
                    className={`px-3 py-1.5 text-[9px] font-label-caps uppercase tracking-widest border transition-colors cursor-pointer ${promoFilter === f ? "border-deep-navy bg-deep-navy text-pure-white" : "border-slate-grey/20 text-slate-grey hover:border-slate-grey/40"}`}
                  >{f}</button>
                ))}
              </div>
              <div className="flex items-center gap-2 ml-auto">
                {selectedPromos.size > 0 && (
                  <>
                    <span className="text-[9px] font-label-caps text-deep-navy">{selectedPromos.size} selected</span>
                    <button onClick={() => handleBulkToggle(true)} className="px-2 py-1 text-[9px] font-label-caps border border-emerald-300 text-emerald-700 hover:bg-emerald-50 cursor-pointer">Activate</button>
                    <button onClick={() => handleBulkToggle(false)} className="px-2 py-1 text-[9px] font-label-caps border border-slate-grey/30 text-slate-grey hover:bg-slate-50 cursor-pointer">Deactivate</button>
                    <button onClick={handleBulkDelete} className="px-2 py-1 text-[9px] font-label-caps border border-red-300 text-red-700 hover:bg-red-50 cursor-pointer">Delete</button>
                  </>
                )}
                <button onClick={exportPromoCSV} className="flex items-center gap-1 px-2.5 py-1.5 text-[9px] font-label-caps uppercase tracking-widest border border-slate-grey/20 text-slate-grey hover:text-deep-navy hover:border-deep-navy cursor-pointer">
                  <span className="material-symbols-outlined text-[12px]">download</span>CSV
                </button>
                <button onClick={() => setShowCreateForm(!showCreateForm)} className="flex items-center gap-1 px-3 py-1.5 text-[9px] font-label-caps uppercase tracking-widest bg-deep-navy text-pure-white hover:bg-ink-black cursor-pointer">
                  <span className="material-symbols-outlined text-[13px]">{showCreateForm ? "close" : "add"}</span>{showCreateForm ? "Close" : "New Code"}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
              {/* Create Form — Collapsible */}
              {showCreateForm && (
                <div className="lg:col-span-2 bg-pure-white border border-slate-grey/20 p-5 shadow-sm space-y-4 self-start">
                  <h2 className="font-label-caps text-[11px] uppercase tracking-widest text-deep-navy border-b border-slate-grey/15 pb-3 flex items-center gap-2">
                    <span className="material-symbols-outlined text-[15px]">add_circle</span>Create New Code
                  </h2>
                  <form onSubmit={handleCreateCode} className="space-y-3.5">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="flex flex-col gap-1 col-span-2">
                        <label className="font-label-caps text-[9px] text-slate-grey uppercase tracking-widest">Code *</label>
                        <input type="text" value={newCode} onChange={(e) => setNewCode(e.target.value.toUpperCase())} placeholder="e.g. VRIX20" required className="border border-slate-grey/25 px-3 py-2.5 focus:border-deep-navy outline-none font-body-md text-ink-black uppercase tracking-widest text-sm bg-transparent" />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="font-label-caps text-[9px] text-slate-grey uppercase tracking-widest">Discount *</label>
                        <input type="number" value={newDiscount} onChange={(e) => setNewDiscount(Number(e.target.value))} required min={1} className="border border-slate-grey/25 px-3 py-2.5 focus:border-deep-navy outline-none font-body-md text-sm bg-transparent" />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="font-label-caps text-[9px] text-slate-grey uppercase tracking-widest">Type *</label>
                        <select value={newType} onChange={(e) => setNewType(e.target.value as any)} className="border border-slate-grey/25 px-3 py-2.5 bg-transparent focus:border-deep-navy outline-none font-body-md text-sm cursor-pointer">
                          <option value="percentage">Percentage (%)</option>
                          <option value="fixed">Fixed (₹)</option>
                        </select>
                      </div>
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="font-label-caps text-[9px] text-slate-grey uppercase tracking-widest">Description</label>
                      <input type="text" value={newDescription} onChange={(e) => setNewDescription(e.target.value)} placeholder="e.g. Welcome discount for new customers" className="border border-slate-grey/25 px-3 py-2.5 focus:border-deep-navy outline-none font-body-md text-sm bg-transparent" />
                    </div>

                    {/* Advanced Options */}
                    <details className="group">
                      <summary className="font-label-caps text-[9px] text-deep-navy uppercase tracking-widest cursor-pointer flex items-center gap-1 hover:text-ink-black select-none py-1">
                        <span className="material-symbols-outlined text-[13px] group-open:rotate-90 transition-transform">chevron_right</span>
                        Advanced Options
                      </summary>
                      <div className="space-y-3 pt-3 mt-2 border-t border-slate-grey/10">
                        <div className="grid grid-cols-2 gap-3">
                          <div className="flex flex-col gap-1">
                            <label className="font-label-caps text-[9px] text-slate-grey uppercase tracking-widest">Min Order (₹)</label>
                            <input type="number" value={newMinSubtotal} onChange={(e) => setNewMinSubtotal(e.target.value !== "" ? Number(e.target.value) : "")} placeholder="No minimum" min={0} className="border border-slate-grey/25 px-3 py-2.5 focus:border-deep-navy outline-none font-body-md text-sm bg-transparent" />
                          </div>
                          <div className="flex flex-col gap-1">
                            <label className="font-label-caps text-[9px] text-slate-grey uppercase tracking-widest">Usage Limit</label>
                            <input type="number" value={newUsageLimit} onChange={(e) => setNewUsageLimit(e.target.value !== "" ? Number(e.target.value) : "")} placeholder="Unlimited" min={1} className="border border-slate-grey/25 px-3 py-2.5 focus:border-deep-navy outline-none font-body-md text-sm bg-transparent" />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="flex flex-col gap-1">
                            <label className="font-label-caps text-[9px] text-slate-grey uppercase tracking-widest">Max Discount (₹)</label>
                            <input type="number" value={newMaxDiscount} onChange={(e) => setNewMaxDiscount(e.target.value !== "" ? Number(e.target.value) : "")} placeholder="No cap" min={1} className="border border-slate-grey/25 px-3 py-2.5 focus:border-deep-navy outline-none font-body-md text-sm bg-transparent" />
                          </div>
                          <div className="flex flex-col gap-1">
                            <label className="font-label-caps text-[9px] text-slate-grey uppercase tracking-widest">Per User Limit</label>
                            <input type="number" value={newPerUserLimit} onChange={(e) => setNewPerUserLimit(e.target.value !== "" ? Number(e.target.value) : "")} placeholder="Unlimited" min={1} className="border border-slate-grey/25 px-3 py-2.5 focus:border-deep-navy outline-none font-body-md text-sm bg-transparent" />
                          </div>
                        </div>
                        <div className="flex flex-col gap-1">
                          <label className="font-label-caps text-[9px] text-slate-grey uppercase tracking-widest">Expiry Date</label>
                          <input type="date" value={newExpiryDate} onChange={(e) => setNewExpiryDate(e.target.value)} className="border border-slate-grey/25 px-3 py-2.5 focus:border-deep-navy outline-none font-body-md text-sm bg-transparent cursor-pointer" />
                        </div>
                        <label className="flex items-center gap-2 cursor-pointer select-none py-1">
                          <input type="checkbox" checked={newFirstOrderOnly} onChange={(e) => setNewFirstOrderOnly(e.target.checked)} className="w-4 h-4 accent-deep-navy cursor-pointer" />
                          <span className="font-label-caps text-[9px] text-slate-grey uppercase tracking-widest">First Order Only</span>
                        </label>
                      </div>
                    </details>

                    {/* Live Preview */}
                    {newCode && (
                      <div className="bg-gradient-to-br from-deep-navy/5 to-soft-linen/50 border border-slate-grey/15 p-4 space-y-2">
                        <span className="font-label-caps text-[8px] text-slate-grey uppercase tracking-widest">Live Preview</span>
                        <div className="flex items-center justify-between">
                          <p className="font-display-lg text-deep-navy tracking-widest text-lg font-bold">{newCode}</p>
                          <div className="bg-deep-navy text-pure-white px-3 py-1 text-sm font-headline-md">
                            {newDiscount}{newType === "percentage" ? "% OFF" : "₹ OFF"}
                          </div>
                        </div>
                        {newDescription && <p className="text-xs italic text-slate-grey font-body-md">{newDescription}</p>}
                        <div className="flex flex-wrap gap-2 text-[9px]">
                          {newMinSubtotal ? <span className="bg-pure-white border border-slate-grey/15 px-2 py-0.5">Min ₹{newMinSubtotal}</span> : null}
                          {newUsageLimit ? <span className="bg-pure-white border border-slate-grey/15 px-2 py-0.5">{newUsageLimit} uses</span> : null}
                          {newExpiryDate ? <span className="bg-pure-white border border-slate-grey/15 px-2 py-0.5">Until {newExpiryDate}</span> : null}
                          {newMaxDiscount ? <span className="bg-pure-white border border-slate-grey/15 px-2 py-0.5">Cap ₹{newMaxDiscount}</span> : null}
                          {newFirstOrderOnly ? <span className="bg-amber-50 border border-amber-200 text-amber-700 px-2 py-0.5">1st Order</span> : null}
                        </div>
                      </div>
                    )}

                    <button type="submit" disabled={creating} className="w-full font-button text-[11px] uppercase py-3.5 bg-deep-navy text-pure-white hover:bg-ink-black transition-colors cursor-pointer flex items-center justify-center gap-2">
                      {creating ? <span className="w-4 h-4 border-2 border-pure-white border-t-transparent rounded-full animate-spin" /> : <><span className="material-symbols-outlined text-[15px]">add</span>Create Code</>}
                    </button>
                  </form>
                </div>
              )}

              {/* Codes List — Enhanced */}
              <div className={`${showCreateForm ? "lg:col-span-3" : "lg:col-span-5"} bg-pure-white border border-slate-grey/20 shadow-sm overflow-hidden`}>
                <div className="p-4 border-b border-slate-grey/15 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-1.5 cursor-pointer select-none">
                      <input type="checkbox"
                        checked={selectedPromos.size === filteredPromos.length && filteredPromos.length > 0}
                        onChange={(e) => {
                          if (e.target.checked) setSelectedPromos(new Set(filteredPromos.map(c => c.code)));
                          else setSelectedPromos(new Set());
                        }}
                        className="w-3.5 h-3.5 accent-deep-navy cursor-pointer"
                      />
                      <span className="font-label-caps text-[9px] text-slate-grey uppercase tracking-widest">Select All</span>
                    </label>
                    <h2 className="font-label-caps text-[11px] uppercase tracking-widest text-deep-navy">
                      {filteredPromos.length} Code{filteredPromos.length !== 1 ? "s" : ""}
                    </h2>
                  </div>
                  <button onClick={loadPromoCodes} className="flex items-center gap-1 text-[9px] font-label-caps uppercase tracking-widest text-slate-grey hover:text-deep-navy cursor-pointer">
                    <span className="material-symbols-outlined text-[13px]">refresh</span>Refresh
                  </button>
                </div>
                {promoLoading ? (
                  <div className="h-40 flex items-center justify-center gap-2 text-slate-grey text-xs font-label-caps uppercase tracking-widest">
                    <span className="w-4 h-4 border-2 border-slate-grey border-t-transparent rounded-full animate-spin" />Loading...
                  </div>
                ) : filteredPromos.length === 0 ? (
                  <div className="h-40 flex flex-col items-center justify-center gap-3 text-slate-grey">
                    <span className="material-symbols-outlined text-4xl opacity-30">confirmation_number</span>
                    <p className="text-xs font-label-caps uppercase tracking-widest">No codes found</p>
                    <p className="text-[10px] font-body-md text-slate-grey/70">Create a new code to get started.</p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-grey/10">
                    {filteredPromos.map((code) => (
                      <div key={code.code} className={`flex items-start gap-3 px-4 py-4 hover:bg-soft-linen/20 transition-colors ${isCodeExpired(code) ? "opacity-60" : ""}`}>
                        <input type="checkbox"
                          checked={selectedPromos.has(code.code)}
                          onChange={(e) => {
                            const next = new Set(selectedPromos);
                            if (e.target.checked) {
                              next.add(code.code);
                            } else {
                              next.delete(code.code);
                            }
                            setSelectedPromos(next);
                          }}
                          className="w-3.5 h-3.5 accent-deep-navy cursor-pointer mt-1 shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          {editingPromo === code.code ? (
                            /* Inline Edit Mode */
                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <span className="font-display-lg text-deep-navy tracking-widest font-bold text-base">{code.code}</span>
                                <input type="number" value={editDiscount} onChange={(e) => setEditDiscount(Number(e.target.value))} className="w-20 border border-slate-grey/30 px-2 py-1 text-xs font-body-md" />
                                <span className="text-xs text-slate-grey">{code.type === "percentage" ? "%" : "₹"}</span>
                              </div>
                              <input type="text" value={editDescription} onChange={(e) => setEditDescription(e.target.value)} placeholder="Description" className="w-full border border-slate-grey/30 px-2 py-1 text-xs font-body-md" />
                              <div className="flex gap-2">
                                <button onClick={() => handleEditSave(code.code)} className="px-3 py-1 text-[9px] font-label-caps bg-deep-navy text-pure-white cursor-pointer">Save</button>
                                <button onClick={() => setEditingPromo(null)} className="px-3 py-1 text-[9px] font-label-caps border border-slate-grey/30 text-slate-grey cursor-pointer">Cancel</button>
                              </div>
                            </div>
                          ) : (
                            /* Display Mode */
                            <>
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-display-lg text-deep-navy tracking-widest font-bold text-base">{code.code}</span>
                                <button onClick={() => copyToClipboard(code.code)} className="text-slate-grey hover:text-deep-navy cursor-pointer" title="Copy code">
                                  <span className="material-symbols-outlined text-[14px]">{copiedCode === code.code ? "check" : "content_copy"}</span>
                                </button>
                                <span className={`text-[9px] font-label-caps uppercase tracking-widest px-2 py-0.5 border ${code.isActive && !isCodeExpired(code) ? "bg-emerald-50 text-emerald-700 border-emerald-200" : isCodeExpired(code) ? "bg-red-50 text-red-600 border-red-200" : "bg-slate-50 text-slate-400 border-slate-200"}`}>
                                  {isCodeExpired(code) ? "Expired" : code.isActive ? "Active" : "Inactive"}
                                </span>
                                <span className="bg-deep-navy/5 text-deep-navy px-2 py-0.5 text-[10px] font-headline-md">
                                  {code.discount}{code.type === "percentage" ? "% OFF" : "₹ OFF"}
                                </span>
                              </div>
                              {code.description && (
                                <p className="text-xs text-deep-navy/80 font-body-md mt-1">{code.description}</p>
                              )}
                              <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1.5 text-[9px] text-slate-grey font-label-caps uppercase">
                                <span className="flex items-center gap-0.5">
                                  <span className="material-symbols-outlined text-[10px]">calendar_today</span>
                                  {new Date(code.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                                </span>
                                {code.minSubtotal ? <span>• Min ₹{code.minSubtotal}</span> : null}
                                {code.expiryDate ? (
                                  <span className={isCodeExpired(code) ? "text-red-600 font-semibold" : ""}>
                                    • Exp: {new Date(code.expiryDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}
                                  </span>
                                ) : null}
                                {code.usageLimit != null && code.usageLimit > 0 ? (
                                  <span>• {code.usedCount || 0}/{code.usageLimit} used</span>
                                ) : (
                                  <span>• {code.usedCount || 0} used</span>
                                )}
                              </div>
                              {/* Usage Progress Bar */}
                              {code.usageLimit != null && code.usageLimit > 0 && (
                                <div className="mt-2 w-32 h-1.5 bg-slate-grey/10 rounded-full overflow-hidden">
                                  <div className="h-full bg-deep-navy rounded-full transition-all"
                                    style={{ width: `${Math.min(((code.usedCount || 0) / code.usageLimit) * 100, 100)}%` }}
                                  />
                                </div>
                              )}
                            </>
                          )}
                        </div>
                        {editingPromo !== code.code && (
                          <div className="flex items-center gap-1.5 shrink-0">
                            <button onClick={() => { setEditingPromo(code.code); setEditDiscount(code.discount); setEditDescription(code.description || ""); }}
                              className="w-7 h-7 flex items-center justify-center text-slate-grey hover:text-deep-navy hover:bg-deep-navy/5 transition-colors cursor-pointer" title="Edit">
                              <span className="material-symbols-outlined text-[15px]">edit</span>
                            </button>
                            <button onClick={() => handleToggle(code)}
                              className={`w-7 h-7 flex items-center justify-center transition-colors cursor-pointer ${code.isActive ? "text-slate-grey hover:text-amber-600 hover:bg-amber-50" : "text-emerald-600 hover:bg-emerald-50"}`}
                              title={code.isActive ? "Deactivate" : "Activate"}>
                              <span className="material-symbols-outlined text-[15px]">{code.isActive ? "toggle_on" : "toggle_off"}</span>
                            </button>
                            <button onClick={() => handleDelete(code.code)}
                              className="w-7 h-7 flex items-center justify-center text-slate-grey hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer" title="Delete">
                              <span className="material-symbols-outlined text-[15px]">delete</span>
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════════
            PAYMENT LOGS TAB
        ═══════════════════════════════════════════════════════════════════════ */}
        {activeTab === "payments" && (
          <div className="space-y-4 animate-fade-in">
            {/* Revenue Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label: "Total Revenue", value: `₹${(totalRevenue / 100).toLocaleString("en-IN")}`, icon: "payments", bg: "bg-emerald-50 border-emerald-200" },
                { label: "Avg Order Value", value: `₹${(avgOrderValue / 100).toFixed(0)}`, icon: "analytics", bg: "bg-blue-50 border-blue-200" },
                { label: "Success Rate", value: `${successRate}%`, icon: "verified", bg: "bg-indigo-50 border-indigo-200" },
                { label: "Failed/Pending", value: paymentLogs.filter(p => p.status === "FAILED" || p.status === "CREATED").length, icon: "warning", bg: "bg-amber-50 border-amber-200" },
              ].map(s => (
                <div key={s.label} className={`border p-4 ${s.bg}`}>
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[16px] opacity-60">{s.icon}</span>
                    <p className="font-label-caps text-[8px] uppercase tracking-widest opacity-70">{s.label}</p>
                  </div>
                  <p className="font-headline-md text-lg font-bold mt-1">{s.value}</p>
                </div>
              ))}
            </div>

            <div className="bg-pure-white border border-slate-grey/20 shadow-sm overflow-hidden">
              {/* Enhanced Filters */}
              <div className="p-4 border-b border-slate-grey/15 flex flex-wrap items-center gap-3">
                <div className="relative flex-1 min-w-[180px] max-w-xs">
                  <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-grey text-[14px]">search</span>
                  <input type="text" value={paySearch} onChange={(e) => setPaySearch(e.target.value)} placeholder="Search order, email, name…" className="pl-8 pr-3 py-2 text-xs border border-slate-grey/20 focus:border-deep-navy outline-none font-body-md bg-transparent w-full" />
                </div>
                <select value={payFilter} onChange={(e) => setPayFilter(e.target.value)} className="px-3 py-2 text-xs border border-slate-grey/20 bg-pure-white font-body-md focus:border-deep-navy outline-none cursor-pointer">
                  <option value="All">All Status</option>
                  <option value="SUCCESS">Success</option>
                  <option value="DELIVERED">Delivered</option>
                  <option value="CREATED">Pending</option>
                  <option value="FAILED">Failed</option>
                </select>
                <div className="flex items-center gap-2">
                  <label className="font-label-caps text-[8px] text-slate-grey uppercase tracking-widest">From</label>
                  <input type="date" value={payDateFrom} onChange={(e) => setPayDateFrom(e.target.value)} className="px-2 py-1.5 text-xs border border-slate-grey/20 bg-transparent focus:border-deep-navy outline-none cursor-pointer" />
                  <label className="font-label-caps text-[8px] text-slate-grey uppercase tracking-widest">To</label>
                  <input type="date" value={payDateTo} onChange={(e) => setPayDateTo(e.target.value)} className="px-2 py-1.5 text-xs border border-slate-grey/20 bg-transparent focus:border-deep-navy outline-none cursor-pointer" />
                </div>
                <select value={paySort} onChange={(e) => setPaySort(e.target.value as any)} className="px-3 py-2 text-xs border border-slate-grey/20 bg-pure-white font-body-md focus:border-deep-navy outline-none cursor-pointer">
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                  <option value="amount-high">Amount: High→Low</option>
                  <option value="amount-low">Amount: Low→High</option>
                </select>
                <div className="ml-auto flex items-center gap-2">
                  <span className="font-label-caps text-[9px] text-slate-grey uppercase tracking-widest">{filteredPayments.length} records</span>
                  <button onClick={exportPaymentsCSV} className="flex items-center gap-1 px-2.5 py-1.5 text-[9px] font-label-caps uppercase border border-slate-grey/20 text-slate-grey hover:text-deep-navy hover:border-deep-navy cursor-pointer">
                    <span className="material-symbols-outlined text-[12px]">download</span>CSV
                  </button>
                  <button onClick={loadPaymentLogs} className="flex items-center gap-1 text-[9px] font-label-caps uppercase text-slate-grey hover:text-deep-navy cursor-pointer">
                    <span className="material-symbols-outlined text-[13px]">refresh</span>
                  </button>
                </div>
              </div>

              {payLoading ? (
                <div className="h-48 flex items-center justify-center gap-2 text-slate-grey text-xs font-label-caps uppercase tracking-widest">
                  <span className="w-4 h-4 border-2 border-slate-grey border-t-transparent rounded-full animate-spin" />Loading...
                </div>
              ) : filteredPayments.length === 0 ? (
                <div className="h-48 flex flex-col items-center justify-center gap-3 text-slate-grey">
                  <span className="material-symbols-outlined text-4xl opacity-30">receipt_long</span>
                  <p className="text-xs font-label-caps uppercase tracking-widest">No payment records found</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-grey/15 bg-soft-linen/30 text-slate-grey font-label-caps text-[9px] tracking-widest uppercase">
                        <th className="px-4 py-3 font-normal w-8"></th>
                        <th className="px-4 py-3 font-normal">Order ID</th>
                        <th className="px-4 py-3 font-normal">Customer</th>
                        <th className="px-4 py-3 font-normal">Amount</th>
                        <th className="px-4 py-3 font-normal">Status</th>
                        <th className="px-4 py-3 font-normal">Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-grey/10">
                      {filteredPayments.map((log) => (
                        <React.Fragment key={log.id}>
                          <tr className="hover:bg-soft-linen/20 transition-colors cursor-pointer" onClick={() => setExpandedPayment(expandedPayment === log.id ? null : log.id)}>
                            <td className="px-4 py-3.5">
                              <span className="material-symbols-outlined text-[14px] text-slate-grey transition-transform" style={{ transform: expandedPayment === log.id ? "rotate(90deg)" : "rotate(0)" }}>
                                chevron_right
                              </span>
                            </td>
                            <td className="px-4 py-3.5">
                              <p className="font-body-md text-xs text-deep-navy font-semibold truncate max-w-[140px]">{log.orderId}</p>
                              {log.paymentId && <p className="text-[9px] text-slate-grey mt-0.5 truncate max-w-[140px]">{log.paymentId}</p>}
                            </td>
                            <td className="px-4 py-3.5">
                              <p className="font-body-md text-xs text-ink-black">{log.customerName || log.userEmail || "—"}</p>
                              {log.customerName && log.userEmail && <p className="text-[9px] text-slate-grey">{log.userEmail}</p>}
                            </td>
                            <td className="px-4 py-3.5 font-body-md text-sm font-bold text-ink-black whitespace-nowrap">
                              ₹{(log.amount / 100).toLocaleString("en-IN")}
                            </td>
                            <td className="px-4 py-3.5">
                              <span className={`inline-flex items-center gap-1 text-[9px] font-label-caps uppercase tracking-widest px-2 py-1 border ${STATUS_STYLE[log.status?.toUpperCase()] || "bg-slate-50 text-slate-400 border-slate-200"}`}>
                                <span className="material-symbols-outlined text-[10px]">{STATUS_ICON[log.status?.toUpperCase()] || "help"}</span>
                                {log.status}
                              </span>
                            </td>
                            <td className="px-4 py-3.5 font-body-md text-xs text-slate-grey whitespace-nowrap">
                              {new Date(log.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                            </td>
                          </tr>
                          {/* Expanded Details */}
                          {expandedPayment === log.id && (
                            <tr>
                              <td colSpan={6} className="bg-soft-linen/30 px-6 py-4">
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs font-body-md">
                                  <div>
                                    <p className="font-label-caps text-[8px] text-slate-grey uppercase tracking-widest mb-1">Full Order ID</p>
                                    <p className="text-ink-black break-all">{log.orderId}</p>
                                  </div>
                                  <div>
                                    <p className="font-label-caps text-[8px] text-slate-grey uppercase tracking-widest mb-1">Payment ID</p>
                                    <p className="text-ink-black break-all">{log.paymentId || "—"}</p>
                                  </div>
                                  <div>
                                    <p className="font-label-caps text-[8px] text-slate-grey uppercase tracking-widest mb-1">Phone</p>
                                    <p className="text-ink-black">{log.customerPhone || "—"}</p>
                                  </div>
                                  <div>
                                    <p className="font-label-caps text-[8px] text-slate-grey uppercase tracking-widest mb-1">Shipping Address</p>
                                    <p className="text-ink-black">{[log.address, log.city, log.postalCode].filter(Boolean).join(", ") || "—"}</p>
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      ))}
                    </tbody>
                  </table>
                  {/* Revenue Footer */}
                  <div className="p-4 border-t border-slate-grey/15 bg-soft-linen/20 flex justify-between items-center">
                    <span className="font-label-caps text-[10px] uppercase tracking-widest text-slate-grey">
                      Total Revenue (Success + Delivered)
                    </span>
                    <span className="font-headline-md text-lg text-deep-navy font-bold">
                      ₹{(totalRevenue / 100).toLocaleString("en-IN")}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════════
            VRIX+ CLUB MEMBERS TAB
        ═══════════════════════════════════════════════════════════════════════ */}
        {activeTab === "vrixplus" && (
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 animate-fade-in">
            {/* Add Member Form */}
            <div className="lg:col-span-2 space-y-4">
              <div className="bg-pure-white border border-slate-grey/20 p-5 shadow-sm space-y-4">
                <h2 className="font-label-caps text-[11px] uppercase tracking-widest text-deep-navy border-b border-slate-grey/15 pb-3 flex items-center gap-2">
                  <span className="material-symbols-outlined text-[15px]">person_add</span>Register Member
                </h2>
                <form onSubmit={handleAddMember} className="space-y-3">
                  <div className="flex flex-col gap-1">
                    <label className="font-label-caps text-[9px] text-slate-grey uppercase tracking-widest">Email Address *</label>
                    <input type="email" value={newMemberEmail} onChange={(e) => setNewMemberEmail(e.target.value)} placeholder="customer@example.com" required className="border border-slate-grey/25 px-3 py-2.5 focus:border-deep-navy outline-none font-body-md text-sm bg-transparent" />
                  </div>
                  <button type="submit" disabled={addingMember} className="w-full font-button text-[11px] uppercase py-3 bg-deep-navy text-pure-white hover:bg-ink-black transition-colors cursor-pointer flex items-center justify-center gap-2">
                    {addingMember ? (
                      <span className="w-4 h-4 border-2 border-pure-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <><span className="material-symbols-outlined text-[15px]">stars</span>Enroll Member</>
                    )}
                  </button>
                </form>
                <p className="text-[10px] text-slate-grey font-body-md leading-relaxed">
                  If the email is already registered, they'll be upgraded to VRIX+. If not, a placeholder account is created automatically.
                </p>
              </div>

              {/* Member Stats */}
              <div className="bg-pure-white border border-slate-grey/20 p-5 shadow-sm space-y-3">
                <h3 className="font-label-caps text-[10px] uppercase tracking-widest text-deep-navy">Club Overview</h3>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-slate-grey font-body-md">Total Members</span>
                    <span className="font-headline-md text-lg text-deep-navy font-bold">{vrixMembers.length}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-slate-grey font-body-md">Joined This Month</span>
                    <span className="font-headline-md text-base text-deep-navy font-bold">
                      {vrixMembers.filter(m => {
                        if (!m.vrixPlusJoinedDate) return false;
                        const joined = new Date(m.vrixPlusJoinedDate);
                        const now = new Date();
                        return joined.getMonth() === now.getMonth() && joined.getFullYear() === now.getFullYear();
                      }).length}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Members List */}
            <div className="lg:col-span-3 bg-pure-white border border-slate-grey/20 shadow-sm overflow-hidden">
              <div className="p-4 border-b border-slate-grey/15 flex flex-wrap justify-between items-center gap-3">
                <div className="flex items-center gap-3 flex-1">
                  <div className="relative flex-1 max-w-xs">
                    <span className="material-symbols-outlined absolute left-2 top-1/2 -translate-y-1/2 text-slate-grey text-[14px]">search</span>
                    <input type="text" value={vrixSearch} onChange={(e) => setVrixSearch(e.target.value)} placeholder="Search members..." className="pl-7 pr-3 py-1.5 text-xs border border-slate-grey/20 focus:border-deep-navy outline-none font-body-md bg-transparent w-full" />
                  </div>
                  <select value={vrixSort} onChange={(e) => setVrixSort(e.target.value as any)} className="px-2 py-1.5 text-xs border border-slate-grey/20 bg-pure-white font-body-md focus:border-deep-navy outline-none cursor-pointer">
                    <option value="newest">Newest</option>
                    <option value="oldest">Oldest</option>
                    <option value="name">Name A→Z</option>
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={exportMembersCSV} className="flex items-center gap-1 px-2 py-1.5 text-[9px] font-label-caps uppercase border border-slate-grey/20 text-slate-grey hover:text-deep-navy cursor-pointer">
                    <span className="material-symbols-outlined text-[12px]">download</span>CSV
                  </button>
                  <button onClick={loadVrixMembers} className="flex items-center gap-1 text-[9px] font-label-caps uppercase text-slate-grey hover:text-deep-navy cursor-pointer">
                    <span className="material-symbols-outlined text-[13px]">refresh</span>
                  </button>
                </div>
              </div>

              {vrixLoading ? (
                <div className="h-48 flex items-center justify-center gap-2 text-slate-grey text-xs font-label-caps uppercase tracking-widest">
                  <span className="w-4 h-4 border-2 border-slate-grey border-t-transparent rounded-full animate-spin" />Loading...
                </div>
              ) : sortedVrixMembers.length === 0 ? (
                <div className="h-48 flex flex-col items-center justify-center gap-3 text-slate-grey">
                  <span className="material-symbols-outlined text-4xl opacity-30">group</span>
                  <p className="text-xs font-label-caps uppercase tracking-widest">No members found</p>
                  <p className="text-[10px] font-body-md text-slate-grey/70">Enroll your first VRIX+ member above.</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-grey/10">
                  {sortedVrixMembers.map((member, i) => (
                    <div key={member.email} className="flex items-center gap-4 px-4 py-3.5 hover:bg-soft-linen/20 transition-colors">
                      {/* Avatar */}
                      <div className="w-9 h-9 bg-deep-navy/10 flex items-center justify-center shrink-0 text-deep-navy font-headline-md text-sm font-bold uppercase">
                        {(member.name || member.email || "?")[0]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-body-md text-sm font-semibold text-deep-navy truncate">{member.name || "VRIX+ Member"}</p>
                          <span className="bg-purple-50 text-purple-700 border border-purple-200 text-[8px] font-label-caps uppercase tracking-widest px-1.5 py-0.5">V+</span>
                        </div>
                        <p className="text-xs text-slate-grey font-body-md truncate">{member.email}</p>
                        {member.phone && <p className="text-[10px] text-slate-grey/70">{member.phone}</p>}
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-[9px] text-slate-grey font-label-caps uppercase tracking-widest">
                          {member.vrixPlusJoinedDate || "—"}
                        </p>
                      </div>
                      <button onClick={() => handleRemoveMember(member.email)}
                        className="w-7 h-7 flex items-center justify-center text-slate-grey hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer shrink-0" title="Revoke membership">
                        <span className="material-symbols-outlined text-[16px]">person_remove</span>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════════
            ANNOUNCEMENT BAR TAB
        ═══════════════════════════════════════════════════════════════════════ */}
        {activeTab === "announcement" && (
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 animate-fade-in">
            {/* Settings */}
            <div className="lg:col-span-2 space-y-4">
              <div className="bg-pure-white border border-slate-grey/20 p-5 shadow-sm space-y-4">
                <h2 className="font-label-caps text-[11px] uppercase tracking-widest text-deep-navy border-b border-slate-grey/15 pb-3 flex items-center gap-2">
                  <span className="material-symbols-outlined text-[15px]">tune</span>Bar Settings
                </h2>

                {announcementLoading ? (
                  <div className="h-20 flex items-center justify-center text-slate-grey text-xs">Loading...</div>
                ) : (
                  <div className="space-y-4">
                    {/* Enable Toggle */}
                    <label className="flex items-center justify-between cursor-pointer select-none">
                      <span className="font-label-caps text-[9px] text-slate-grey uppercase tracking-widest">Enable Announcement Bar</span>
                      <button type="button" onClick={() => setAnnouncementBar(p => ({ ...p, isEnabled: !p.isEnabled }))}
                        className={`w-10 h-5 rounded-full relative transition-colors cursor-pointer ${announcementBar.isEnabled ? "bg-deep-navy" : "bg-slate-grey/30"}`}>
                        <div className={`w-4 h-4 bg-pure-white rounded-full absolute top-0.5 transition-all shadow-sm ${announcementBar.isEnabled ? "left-5.5" : "left-0.5"}`} />
                      </button>
                    </label>

                    {/* Colors */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="flex flex-col gap-1">
                        <label className="font-label-caps text-[9px] text-slate-grey uppercase tracking-widest">Background</label>
                        <div className="flex items-center gap-2">
                          <input type="color" value={announcementBar.backgroundColor} onChange={(e) => setAnnouncementBar(p => ({ ...p, backgroundColor: e.target.value }))}
                            className="w-8 h-8 border border-slate-grey/20 cursor-pointer p-0" />
                          <input type="text" value={announcementBar.backgroundColor} onChange={(e) => setAnnouncementBar(p => ({ ...p, backgroundColor: e.target.value }))}
                            className="flex-1 border border-slate-grey/25 px-2 py-1.5 text-xs font-body-md bg-transparent uppercase" />
                        </div>
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="font-label-caps text-[9px] text-slate-grey uppercase tracking-widest">Text Color</label>
                        <div className="flex items-center gap-2">
                          <input type="color" value={announcementBar.textColor} onChange={(e) => setAnnouncementBar(p => ({ ...p, textColor: e.target.value }))}
                            className="w-8 h-8 border border-slate-grey/20 cursor-pointer p-0" />
                          <input type="text" value={announcementBar.textColor} onChange={(e) => setAnnouncementBar(p => ({ ...p, textColor: e.target.value }))}
                            className="flex-1 border border-slate-grey/25 px-2 py-1.5 text-xs font-body-md bg-transparent uppercase" />
                        </div>
                      </div>
                    </div>

                    {/* Interval & Font Size */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="flex flex-col gap-1">
                        <label className="font-label-caps text-[9px] text-slate-grey uppercase tracking-widest">Rotation Speed (ms)</label>
                        <input type="number" value={announcementBar.interval} onChange={(e) => setAnnouncementBar(p => ({ ...p, interval: Number(e.target.value) }))}
                          min={1000} step={500} className="border border-slate-grey/25 px-3 py-2.5 focus:border-deep-navy outline-none font-body-md text-sm bg-transparent" />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="font-label-caps text-[9px] text-slate-grey uppercase tracking-widest">Font Size</label>
                        <select value={announcementBar.fontSize} onChange={(e) => setAnnouncementBar(p => ({ ...p, fontSize: e.target.value }))}
                          className="border border-slate-grey/25 px-3 py-2.5 bg-transparent focus:border-deep-navy outline-none font-body-md text-sm cursor-pointer">
                          <option value="9px">9px — Tiny</option>
                          <option value="10px">10px — Small</option>
                          <option value="11px">11px — Default</option>
                          <option value="12px">12px — Medium</option>
                          <option value="13px">13px — Large</option>
                        </select>
                      </div>
                    </div>

                    <button onClick={handleSaveAnnouncement} disabled={announcementSaving}
                      className="w-full font-button text-[11px] uppercase py-3 bg-deep-navy text-pure-white hover:bg-ink-black transition-colors cursor-pointer flex items-center justify-center gap-2">
                      {announcementSaving ? <span className="w-4 h-4 border-2 border-pure-white border-t-transparent rounded-full animate-spin" /> : <><span className="material-symbols-outlined text-[15px]">save</span>Save Settings</>}
                    </button>
                  </div>
                )}
              </div>

              {/* Live Preview */}
              <div className="bg-pure-white border border-slate-grey/20 p-5 shadow-sm space-y-3">
                <h3 className="font-label-caps text-[10px] uppercase tracking-widest text-deep-navy flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[13px]">visibility</span>Live Preview
                </h3>
                <div className="border border-slate-grey/15 overflow-hidden">
                  <div style={{ backgroundColor: announcementBar.backgroundColor, color: announcementBar.textColor, fontSize: announcementBar.fontSize }}
                    className="py-2.5 px-4 text-center font-label-caps uppercase tracking-[0.2em]">
                    {announcementBar.lines.length > 0 ? announcementBar.lines[0] : "No announcements configured"}
                  </div>
                </div>
                {announcementBar.lines.length > 1 && (
                  <p className="text-[9px] text-slate-grey font-body-md text-center">
                    Rotates through {announcementBar.lines.length} messages every {(announcementBar.interval / 1000).toFixed(1)}s
                  </p>
                )}
              </div>
            </div>

            {/* Announcement Lines Manager */}
            <div className="lg:col-span-3 bg-pure-white border border-slate-grey/20 shadow-sm overflow-hidden">
              <div className="p-4 border-b border-slate-grey/15">
                <h2 className="font-label-caps text-[11px] uppercase tracking-widest text-deep-navy">
                  Announcement Messages ({announcementBar.lines.length})
                </h2>
              </div>

              {/* Add New Line */}
              <div className="p-4 border-b border-slate-grey/10 bg-soft-linen/20">
                <div className="flex gap-2">
                  <input type="text" value={newAnnouncementLine} onChange={(e) => setNewAnnouncementLine(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addAnnouncementLine(); } }}
                    placeholder="Enter new announcement text..." className="flex-1 border border-slate-grey/25 px-3 py-2.5 focus:border-deep-navy outline-none font-body-md text-sm bg-pure-white" />
                  <button onClick={addAnnouncementLine} className="px-4 py-2.5 bg-deep-navy text-pure-white font-button text-[10px] uppercase hover:bg-ink-black cursor-pointer flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px]">add</span>Add
                  </button>
                </div>
              </div>

              {/* Lines List */}
              {announcementBar.lines.length === 0 ? (
                <div className="h-40 flex flex-col items-center justify-center gap-3 text-slate-grey">
                  <span className="material-symbols-outlined text-4xl opacity-30">campaign</span>
                  <p className="text-xs font-label-caps uppercase tracking-widest">No announcements yet</p>
                  <p className="text-[10px] font-body-md text-slate-grey/70">Add a message above to display on your storefront.</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-grey/10">
                  {announcementBar.lines.map((line, idx) => (
                    <div key={idx} className="flex items-center gap-3 px-4 py-3 hover:bg-soft-linen/20 transition-colors group">
                      <span className="w-5 h-5 flex items-center justify-center text-[10px] font-label-caps text-slate-grey bg-slate-grey/10 shrink-0">
                        {idx + 1}
                      </span>
                      {editingLineIdx === idx ? (
                        <div className="flex-1 flex gap-2">
                          <input type="text" value={editLineText} onChange={(e) => setEditLineText(e.target.value)}
                            onKeyDown={(e) => { if (e.key === "Enter") saveEditLine(idx); if (e.key === "Escape") setEditingLineIdx(null); }}
                            autoFocus className="flex-1 border border-slate-grey/30 px-2 py-1.5 text-xs font-body-md" />
                          <button onClick={() => saveEditLine(idx)} className="px-2 py-1 text-[9px] font-label-caps bg-deep-navy text-pure-white cursor-pointer">Save</button>
                          <button onClick={() => setEditingLineIdx(null)} className="px-2 py-1 text-[9px] font-label-caps border border-slate-grey/30 cursor-pointer">Cancel</button>
                        </div>
                      ) : (
                        <>
                          <p className="flex-1 font-body-md text-sm text-ink-black">{line}</p>
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => moveLineUp(idx)} disabled={idx === 0}
                              className="w-6 h-6 flex items-center justify-center text-slate-grey hover:text-deep-navy cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed">
                              <span className="material-symbols-outlined text-[14px]">arrow_upward</span>
                            </button>
                            <button onClick={() => moveLineDown(idx)} disabled={idx === announcementBar.lines.length - 1}
                              className="w-6 h-6 flex items-center justify-center text-slate-grey hover:text-deep-navy cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed">
                              <span className="material-symbols-outlined text-[14px]">arrow_downward</span>
                            </button>
                            <button onClick={() => { setEditingLineIdx(idx); setEditLineText(line); }}
                              className="w-6 h-6 flex items-center justify-center text-slate-grey hover:text-deep-navy cursor-pointer">
                              <span className="material-symbols-outlined text-[14px]">edit</span>
                            </button>
                            <button onClick={() => removeAnnouncementLine(idx)}
                              className="w-6 h-6 flex items-center justify-center text-slate-grey hover:text-red-600 cursor-pointer">
                              <span className="material-symbols-outlined text-[14px]">delete</span>
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Save Reminder */}
              <div className="p-3 border-t border-slate-grey/10 bg-amber-50/50 flex items-center gap-2">
                <span className="material-symbols-outlined text-[14px] text-amber-600">info</span>
                <p className="text-[10px] text-amber-700 font-body-md">Remember to click &quot;Save Settings&quot; to publish changes to the storefront.</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
