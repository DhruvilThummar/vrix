"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  fetchDeliveryOrders,
  sendDeliveryOtp,
  verifyDeliveryOtp,
  sendDeliveryAuthOtp,
  verifyDeliveryAuthOtp,
  fetchDeliveryStaff,
  addDeliveryStaff,
  deleteDeliveryStaff,
  assignDeliveryOrder,
  updateDeliveryEta,
} from "@/utils/api";

type DeliveryStatus = "CREATED" | "SUCCESS" | "DELIVERED" | "FAILED" | "OTP_SENT";

interface DeliveryOrder {
  id: string;
  orderId: string;
  amount: number;
  currency: string;
  status: DeliveryStatus;
  paymentId?: string;
  createdAt: string;
  customerName?: string;
  customerPhone?: string;
  address?: string;
  city?: string;
  postalCode?: string;
  assignedAgent?: string;
  userEmail?: string;
  estimatedDeliveryDate?: string | Date;
}

interface StaffMember {
  email: string;
  name: string;
  role: "agent" | "manager";
}

const STATUS_CONFIG: Record<DeliveryStatus, { label: string; className: string; dotClass: string }> = {
  CREATED: { label: "Pending", className: "bg-amber-500/10 text-amber-600 border-amber-500/20", dotClass: "bg-amber-500" },
  SUCCESS: { label: "Paid", className: "bg-blue-500/10 text-blue-600 border-blue-500/20", dotClass: "bg-blue-500" },
  OTP_SENT: { label: "Out for Delivery", className: "bg-purple-500/10 text-purple-600 border-purple-500/20", dotClass: "bg-purple-500 animate-pulse" },
  DELIVERED: { label: "Delivered", className: "bg-emerald-500/10 text-emerald-700 border-emerald-500/20", dotClass: "bg-emerald-600" },
  FAILED: { label: "Failed", className: "bg-rose-500/10 text-rose-600 border-rose-500/20", dotClass: "bg-rose-600" },
};

export default function DeliveryPanelPage() {
  // Auth state
  const [currentUser, setCurrentUser] = useState<{ email: string; name: string; role: "agent" | "manager" } | null>(null);
  const [authEmail, setAuthEmail] = useState("");
  const [authOtp, setAuthOtp] = useState(["", "", "", "", "", ""]);
  const [authStep, setAuthStep] = useState<"email" | "otp">("email");
  const [authLoading, setAuthLoading] = useState(false);

  // App data state
  const [orders, setOrders] = useState<DeliveryOrder[]>([]);
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<DeliveryOrder | null>(null);

  // Delivery confirmation flow state
  const [confirmOtp, setConfirmOtp] = useState(["", "", "", "", "", ""]);
  const [confirmStep, setConfirmStep] = useState<"idle" | "sending" | "otp" | "success">("idle");
  const [customerEmailOverride, setCustomerEmailOverride] = useState("");

  // Manager state
  const [activeTab, setActiveTab] = useState<"deliveries" | "staff">("deliveries");
  const [newStaffName, setNewStaffName] = useState("");
  const [newStaffEmail, setNewStaffEmail] = useState("");
  const [newStaffRole, setNewStaffRole] = useState<"agent" | "manager">("agent");
  const [showAddStaffModal, setShowAddStaffModal] = useState(false);

  // General state
  const [searchQuery, setSearchQuery] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);
  const [showScannerMock, setShowScannerMock] = useState(false);

  // Refs for focusing inputs
  const authOtpRefs = useRef<(HTMLInputElement | null)[]>([]);
  const confirmOtpRefs = useRef<(HTMLInputElement | null)[]>([]);

  const showToast = (msg: string, type: "success" | "error" = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  const loadDashboardData = async (role: string, email: string) => {
    setLoading(true);
    try {
      const ordersData = await fetchDeliveryOrders(role, email);
      setOrders(ordersData);

      // ONLY Manager can access delivery staff API
      if (role === "manager") {
        const staffData = await fetchDeliveryStaff().catch(() => []);
        setStaff(staffData);
      } else {
        setStaff([]);
      }
    } catch (err: any) {
      showToast(err.message || "Failed to retrieve delivery details.", "error");
    } finally {
      setLoading(false);
    }
  };

  // Check login on mount
  useEffect(() => {
    const savedUser = localStorage.getItem("vrix_delivery_user");
    if (savedUser) {
      const parsed = JSON.parse(savedUser);
      setCurrentUser(parsed);
      loadDashboardData(parsed.role, parsed.email);
    } else {
      setLoading(false);
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("vrix_delivery_user");
    setCurrentUser(null);
    setAuthStep("email");
    setAuthEmail("");
    setAuthOtp(["", "", "", "", "", ""]);
    setOrders([]);
    setStaff([]);
    setSelectedOrder(null);
    setConfirmStep("idle");
  };

  // Staff Login Flows
  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authEmail) return;
    setAuthLoading(true);
    try {
      const res = await sendDeliveryAuthOtp(authEmail);
      showToast(res.message || "Authentication code dispatched.");
      if (res.otp) showToast(`[DEV MODE] OTP: ${res.otp}`, "success");
      setAuthStep("otp");
      setTimeout(() => authOtpRefs.current[0]?.focus(), 100);
    } catch (err: any) {
      showToast(err.message || "Login failed. Check your credentials.", "error");
    } finally {
      setAuthLoading(false);
    }
  };

  const handleAuthOtpChange = (idx: number, val: string) => {
    if (!/^\d?$/.test(val)) return;
    const next = [...authOtp];
    next[idx] = val;
    setAuthOtp(next);
    if (val && idx < 5) authOtpRefs.current[idx + 1]?.focus();
  };

  const handleAuthOtpKeyDown = (idx: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !authOtp[idx] && idx > 0) {
      authOtpRefs.current[idx - 1]?.focus();
    }
  };

  const handleAuthVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = authOtp.join("");
    if (code.length < 6) {
      showToast("Please enter the full 6-digit code.", "error");
      return;
    }
    setAuthLoading(true);
    try {
      const res = await verifyDeliveryAuthOtp(authEmail, code);
      localStorage.setItem("vrix_delivery_user", JSON.stringify(res.user));
      setCurrentUser(res.user);
      showToast(`Welcome to VRIX Logistics, ${res.user.name}!`);
      loadDashboardData(res.user.role, res.user.email);
    } catch (err: any) {
      showToast(err.message || "Invalid authentication code.", "error");
    } finally {
      setAuthLoading(false);
    }
  };

  // Agent Delivery Confirmation Flow
  const handleSelectOrder = (order: DeliveryOrder) => {
    setSelectedOrder(order);
    setCustomerEmailOverride(order.userEmail || "");
    setConfirmOtp(["", "", "", "", "", ""]);
    if (order.status === "OTP_SENT") {
      setConfirmStep("otp");
    } else {
      setConfirmStep("idle");
    }
  };

  const handleTriggerDeliveryOtp = async () => {
    if (!selectedOrder) return;
    const emailToUse = customerEmailOverride || selectedOrder.userEmail;
    if (!emailToUse) {
      showToast("Customer email is missing. Please type one in.", "error");
      return;
    }
    setConfirmStep("sending");
    try {
      const res = await sendDeliveryOtp(selectedOrder.orderId, emailToUse);
      setOrders(prev =>
        prev.map(o => o.orderId === selectedOrder.orderId ? { ...o, status: "OTP_SENT" } : o)
      );
      if (selectedOrder) {
        setSelectedOrder(prev => prev ? { ...prev, status: "OTP_SENT" } : null);
      }
      showToast(res.message || "OTP code sent to customer.");
      if (res.otp) showToast(`[DEV MODE] OTP: ${res.otp}`, "success");
      setConfirmStep("otp");
      setTimeout(() => confirmOtpRefs.current[0]?.focus(), 100);
    } catch (err: any) {
      showToast(err.message || "Failed to trigger delivery OTP.", "error");
      setConfirmStep("idle");
    }
  };

  const handleConfirmOtpChange = (idx: number, val: string) => {
    if (!/^\d?$/.test(val)) return;
    const next = [...confirmOtp];
    next[idx] = val;
    setConfirmOtp(next);
    if (val && idx < 5) confirmOtpRefs.current[idx + 1]?.focus();
  };

  const handleConfirmOtpKeyDown = (idx: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !confirmOtp[idx] && idx > 0) {
      confirmOtpRefs.current[idx - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").trim();
    if (/^\d{6}$/.test(pastedData)) {
      setConfirmOtp(pastedData.split(""));
      confirmOtpRefs.current[5]?.focus();
    }
  };

  const handleVerifyDelivery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder) return;
    const code = confirmOtp.join("");
    if (code.length < 6) {
      showToast("Please enter the complete 6-digit code.", "error");
      return;
    }
    setActionLoading(true);
    try {
      await verifyDeliveryOtp(selectedOrder.orderId, code);
      setConfirmStep("success");
      setOrders((prev) =>
        prev.map((o) => (o.orderId === selectedOrder.orderId ? { ...o, status: "DELIVERED" } : o))
      );
      showToast("Package marked as delivered successfully!", "success");
    } catch (err: any) {
      showToast(err.message || "Incorrect delivery code.", "error");
    } finally {
      setActionLoading(false);
    }
  };

  // Manager: Agent Assignment Flow
  const handleAssignAgent = async (orderId: string, agentEmail: string) => {
    if (currentUser?.role !== "manager") return;
    setActionLoading(true);
    try {
      const val = agentEmail === "unassigned" ? null : agentEmail;
      await assignDeliveryOrder(orderId, val);
      setOrders((prev) =>
        prev.map((o) => (o.orderId === orderId ? { ...o, assignedAgent: val || undefined } : o))
      );
      showToast("Shipment assignment updated.");
    } catch (err: any) {
      showToast(err.message || "Failed to assign delivery agent.", "error");
    } finally {
      setActionLoading(false);
    }
  };

  // Update Delivery ETA
  const handleUpdateEta = async (orderId: string, etaDateStr: string) => {
    setActionLoading(true);
    try {
      const res = await updateDeliveryEta(orderId, etaDateStr);
      setOrders((prev) =>
        prev.map((o) => (o.orderId === orderId ? { ...o, estimatedDeliveryDate: res.estimatedDeliveryDate } : o))
      );
      if (selectedOrder && selectedOrder.orderId === orderId) {
        setSelectedOrder((prev) => (prev ? { ...prev, estimatedDeliveryDate: res.estimatedDeliveryDate } : null));
      }
      showToast(`Updated delivery ETA for ${orderId}!`);
    } catch (err: any) {
      showToast(err.message || "Failed to update ETA.", "error");
    } finally {
      setActionLoading(false);
    }
  };

  const getPresetEta = (preset: "today_5pm" | "today_8pm" | "tomorrow_12pm") => {
    const d = new Date();
    if (preset === "today_5pm") {
      d.setHours(17, 0, 0, 0);
    } else if (preset === "today_8pm") {
      d.setHours(20, 0, 0, 0);
    } else if (preset === "tomorrow_12pm") {
      d.setDate(d.getDate() + 1);
      d.setHours(12, 0, 0, 0);
    }
    return d.toISOString();
  };

  // Manager Only: Staff Management CRUD
  const handleAddStaffMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (currentUser?.role !== "manager") return;
    if (!newStaffEmail || !newStaffName) return;
    setActionLoading(true);
    try {
      const added = await addDeliveryStaff({ name: newStaffName, email: newStaffEmail, role: newStaffRole });
      setStaff((prev) => [added, ...prev]);
      showToast(`Successfully registered ${newStaffName}.`);
      setNewStaffName("");
      setNewStaffEmail("");
      setNewStaffRole("agent");
      setShowAddStaffModal(false);
    } catch (err: any) {
      showToast(err.message || "Failed to register staff account.", "error");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteStaffMember = async (email: string) => {
    if (currentUser?.role !== "manager") {
      showToast("Access Denied: Only Portal Managers can revoke staff access.", "error");
      return;
    }
    if (email === currentUser?.email) {
      showToast("You cannot remove your own account.", "error");
      return;
    }
    if (!confirm(`Are you sure you want to remove staff access for ${email}?`)) return;
    setActionLoading(true);
    try {
      await deleteDeliveryStaff(email);
      setStaff((prev) => prev.filter((s) => s.email !== email));
      showToast("Staff access revoked.");
    } catch (err: any) {
      showToast(err.message || "Failed to remove staff member.", "error");
    } finally {
      setActionLoading(false);
    }
  };

  // Filters
  const filteredOrders = orders.filter((o) => {
    const query = searchQuery.toLowerCase();
    return (
      o.orderId?.toLowerCase().includes(query) ||
      o.customerName?.toLowerCase().includes(query) ||
      o.address?.toLowerCase().includes(query) ||
      o.city?.toLowerCase().includes(query)
    );
  });

  const handleMockScan = () => {
    setShowScannerMock(true);
    setTimeout(() => {
      const pending = orders.find((o) => o.status !== "DELIVERED");
      if (pending) {
        setSearchQuery(pending.orderId);
        showToast(`Scan Successful: Found ${pending.orderId}`);
      } else {
        showToast("No active shipments found to scan.", "error");
      }
      setShowScannerMock(false);
    }, 1200);
  };

  // ════════════════ LOGIN PORTAL ════════════════
  if (!currentUser) {
    return (
      <div className="w-full min-h-screen bg-soft-linen flex flex-col justify-center items-center px-4 py-12 relative">
        <div className="w-full max-w-md bg-pure-white border border-slate-grey/20 p-8 md:p-10 shadow-lg relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-deep-navy" />
          
          <div className="text-center mb-8 space-y-2">
            <span className="font-label-caps text-[10px] text-slate-grey tracking-widest uppercase block">
              ATELIER VRIX EXPRESS
            </span>
            <h1 className="font-display-lg text-2xl text-deep-navy uppercase font-semibold">
              Logistics Portal
            </h1>
            <p className="font-body-md text-xs text-slate-grey">
              Delivery Operations &amp; Verification Workstation
            </p>
          </div>

          {authStep === "email" ? (
            <form onSubmit={handleAuthSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="font-label-caps text-[10px] text-slate-grey uppercase tracking-widest block font-semibold">
                  Staff Email Address
                </label>
                <input
                  type="email"
                  value={authEmail}
                  onChange={(e) => setAuthEmail(e.target.value)}
                  placeholder="agent@vrix.com"
                  required
                  className="w-full bg-soft-linen/50 border border-slate-grey/30 px-4 py-3 text-ink-black text-sm outline-none focus:border-deep-navy font-body-md transition-colors"
                />
              </div>

              <button
                type="submit"
                disabled={authLoading}
                className="w-full bg-deep-navy text-pure-white font-button text-xs uppercase tracking-widest py-4 hover:bg-ink-black transition-colors cursor-pointer disabled:opacity-50"
              >
                {authLoading ? "Verifying..." : "Request Access Code"}
              </button>

              <div className="pt-4 border-t border-slate-grey/15 text-center text-[10px] text-slate-grey space-y-1 font-body-md">
                <p>Manager Access: <strong className="text-deep-navy">manager@vrix.com</strong></p>
                <p>Agent Access: <strong className="text-deep-navy">agent@vrix.com</strong></p>
              </div>
            </form>
          ) : (
            <form onSubmit={handleAuthVerify} className="space-y-6">
              <div className="space-y-2 text-center">
                <button
                  type="button"
                  onClick={() => setAuthStep("email")}
                  className="text-deep-navy text-xs underline font-label-caps cursor-pointer"
                >
                  ← Change Email
                </button>
                <h3 className="font-headline-md text-sm text-deep-navy uppercase font-semibold mt-2">
                  Enter 6-Digit Code
                </h3>
                <p className="font-body-md text-xs text-slate-grey">
                  Sent to <strong className="text-deep-navy">{authEmail}</strong>
                </p>
              </div>

              <div className="flex justify-between gap-2">
                {authOtp.map((digit, idx) => (
                  <input
                    key={idx}
                    ref={(el) => { authOtpRefs.current[idx] = el; }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleAuthOtpChange(idx, e.target.value)}
                    onKeyDown={(e) => handleAuthOtpKeyDown(idx, e)}
                    className="w-12 h-14 text-center text-xl font-bold border border-slate-grey/30 focus:border-deep-navy outline-none bg-pure-white text-deep-navy font-mono"
                  />
                ))}
              </div>

              <button
                type="submit"
                disabled={authLoading}
                className="w-full bg-deep-navy text-pure-white font-button text-xs uppercase tracking-widest py-4 hover:bg-ink-black transition-colors cursor-pointer disabled:opacity-50"
              >
                {authLoading ? "Validating..." : "Verify & Log In"}
              </button>
            </form>
          )}
        </div>

        {/* Toast Alert */}
        {toast && (
          <div className="fixed bottom-6 right-6 z-50 bg-deep-navy text-pure-white px-6 py-4 border border-slate-grey/20 shadow-2xl flex items-center gap-3 text-xs font-body-md animate-fade-in">
            <span className="material-symbols-outlined text-sm">{toast.type === "success" ? "check_circle" : "error"}</span>
            {toast.msg}
          </div>
        )}
      </div>
    );
  }

  // ════════════════ DASHBOARD PORTAL ════════════════
  return (
    <div className="w-full min-h-screen bg-soft-linen text-ink-black flex flex-col font-sans select-none">
      {/* Toast Alert */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 bg-deep-navy text-pure-white px-6 py-4 border border-slate-grey/20 shadow-2xl flex items-center gap-3 text-xs font-body-md animate-fade-in">
          <span className="material-symbols-outlined text-sm text-emerald-400">{toast.type === "success" ? "check_circle" : "error"}</span>
          {toast.msg}
        </div>
      )}

      {/* Barcode scanner overlay mockup */}
      {showScannerMock && (
        <div className="fixed inset-0 z-50 bg-deep-navy/90 flex flex-col items-center justify-center p-6 text-center animate-fade-in text-pure-white">
          <div className="relative w-64 h-64 border-2 border-pure-white/40 flex items-center justify-center overflow-hidden bg-black/40">
            <div className="absolute left-0 w-full h-0.5 bg-amber-400 shadow-md animate-bounce" />
            <span className="material-symbols-outlined text-pure-white/20 text-6xl">qr_code_scanner</span>
          </div>
          <h3 className="font-label-caps text-xs uppercase tracking-widest mt-6 animate-pulse font-semibold">Scanning Shipment Barcode...</h3>
        </div>
      )}

      {/* Header Navigation Bar */}
      <header className="bg-deep-navy text-pure-white px-6 md:px-12 py-4 flex items-center justify-between sticky top-0 z-30 shadow-md">
        <div className="flex items-center gap-3">
          <span className="material-symbols-outlined text-2xl text-amber-400">local_shipping</span>
          <div>
            <h1 className="font-display-md text-base uppercase tracking-widest font-medium">VRIX LOGISTICS</h1>
            <p className="font-label-caps text-[9px] text-slate-grey uppercase tracking-widest">
              {currentUser.role === "manager" ? "Logistics Control Console" : "Agent Delivery Workstation"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden sm:flex flex-col text-right">
            <span className="font-body-md text-xs font-semibold">{currentUser.name}</span>
            <span className="font-label-caps text-[9px] text-amber-400 uppercase tracking-widest font-bold">{currentUser.role}</span>
          </div>
          <button
            onClick={handleLogout}
            className="border border-pure-white/30 hover:bg-pure-white/10 px-4 py-2 font-label-caps text-[10px] uppercase tracking-widest transition-colors cursor-pointer"
          >
            Sign Out
          </button>
        </div>
      </header>

      {/* Main Panel Content */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-6 space-y-6">

        {/* Metrics Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {currentUser.role === "manager" ? (
            <>
              <div className="bg-pure-white border border-slate-grey/20 p-5 shadow-xs flex flex-col justify-between">
                <span className="font-label-caps text-[9px] text-slate-grey uppercase tracking-widest">Total Shipments</span>
                <span className="font-headline-md text-2xl text-deep-navy font-bold mt-2">{orders.length}</span>
              </div>
              <div className="bg-pure-white border border-slate-grey/20 p-5 shadow-xs flex flex-col justify-between">
                <span className="font-label-caps text-[9px] text-slate-grey uppercase tracking-widest">Pending</span>
                <span className="font-headline-md text-2xl text-amber-600 font-bold mt-2">
                  {orders.filter((o) => o.status !== "DELIVERED").length}
                </span>
              </div>
              <div className="bg-pure-white border border-slate-grey/20 p-5 shadow-xs flex flex-col justify-between">
                <span className="font-label-caps text-[9px] text-slate-grey uppercase tracking-widest">Completed</span>
                <span className="font-headline-md text-2xl text-emerald-700 font-bold mt-2">
                  {orders.filter((o) => o.status === "DELIVERED").length}
                </span>
              </div>
              <div className="bg-pure-white border border-slate-grey/20 p-5 shadow-xs flex flex-col justify-between">
                <span className="font-label-caps text-[9px] text-slate-grey uppercase tracking-widest">Active Staff</span>
                <span className="font-headline-md text-2xl text-deep-navy font-bold mt-2">{staff.length}</span>
              </div>
            </>
          ) : (
            <>
              <div className="bg-pure-white border border-slate-grey/20 p-5 shadow-xs flex flex-col justify-between">
                <span className="font-label-caps text-[9px] text-slate-grey uppercase tracking-widest">My Assigned Tasks</span>
                <span className="font-headline-md text-2xl text-deep-navy font-bold mt-2">
                  {orders.filter((o) => o.assignedAgent === currentUser.email && o.status !== "DELIVERED").length}
                </span>
              </div>
              <div className="bg-pure-white border border-slate-grey/20 p-5 shadow-xs flex flex-col justify-between">
                <span className="font-label-caps text-[9px] text-slate-grey uppercase tracking-widest">Delivered Today</span>
                <span className="font-headline-md text-2xl text-emerald-700 font-bold mt-2">
                  {orders.filter((o) => o.assignedAgent === currentUser.email && o.status === "DELIVERED").length}
                </span>
              </div>
              <div className="bg-pure-white border border-slate-grey/20 p-5 shadow-xs flex flex-col justify-between">
                <span className="font-label-caps text-[9px] text-slate-grey uppercase tracking-widest">Open Pool</span>
                <span className="font-headline-md text-2xl text-amber-600 font-bold mt-2">
                  {orders.filter((o) => !o.assignedAgent && o.status !== "DELIVERED").length}
                </span>
              </div>
              <div className="bg-pure-white border border-slate-grey/20 p-5 shadow-xs flex flex-col justify-between">
                <span className="font-label-caps text-[9px] text-slate-grey uppercase tracking-widest">Courier Status</span>
                <span className="font-headline-md text-base text-emerald-700 font-bold mt-2 uppercase">Active Duty</span>
              </div>
            </>
          )}
        </div>

        {/* Manager Navigation Tabs */}
        {currentUser.role === "manager" && (
          <div className="flex border-b border-slate-grey/20">
            <button
              onClick={() => setActiveTab("deliveries")}
              className={`px-6 py-3 font-label-caps text-xs uppercase tracking-widest border-b-2 transition-colors cursor-pointer ${
                activeTab === "deliveries" ? "border-deep-navy text-deep-navy font-bold" : "border-transparent text-slate-grey hover:text-deep-navy"
              }`}
            >
              Shipments Log
            </button>
            <button
              onClick={() => setActiveTab("staff")}
              className={`px-6 py-3 font-label-caps text-xs uppercase tracking-widest border-b-2 transition-colors cursor-pointer ${
                activeTab === "staff" ? "border-deep-navy text-deep-navy font-bold" : "border-transparent text-slate-grey hover:text-deep-navy"
              }`}
            >
              Staff Directory ({staff.length})
            </button>
          </div>
        )}

        {/* Search Header */}
        {!(currentUser.role === "manager" && activeTab === "staff") && (
          <div className="flex gap-3">
            <div className="relative flex-1">
              <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-grey text-lg">search</span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search order ID, city or customer..."
                className="w-full bg-pure-white border border-slate-grey/30 text-ink-black pl-11 pr-10 py-3 text-xs outline-none focus:border-deep-navy font-body-md"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-grey">✕</button>
              )}
            </div>
            <button
              onClick={handleMockScan}
              className="bg-deep-navy text-pure-white px-5 py-3 font-label-caps text-xs uppercase tracking-widest flex items-center gap-2 hover:bg-ink-black cursor-pointer"
            >
              <span className="material-symbols-outlined text-base">qr_code_scanner</span>
              <span>Scan Barcode</span>
            </button>
          </div>
        )}

        {/* ═════════ AGENT VIEW ═════════ */}
        {currentUser.role === "agent" && (
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            {/* Left Order Queue List */}
            <div className="lg:col-span-3 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-label-caps text-[10px] text-slate-grey uppercase tracking-widest font-semibold">Active Delivery Tasks</h3>
                <button
                  onClick={() => loadDashboardData(currentUser.role, currentUser.email)}
                  className="text-deep-navy text-xs font-label-caps uppercase underline cursor-pointer"
                >
                  Refresh Queue
                </button>
              </div>

              {loading ? (
                <div className="p-12 text-center text-slate-grey font-label-caps text-xs tracking-widest animate-pulse">Loading Tasks...</div>
              ) : filteredOrders.length === 0 ? (
                <div className="bg-pure-white border border-slate-grey/20 p-12 text-center text-slate-grey font-label-caps text-xs tracking-widest">
                  No active shipments in your queue.
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredOrders.map((order) => {
                    const isSelected = selectedOrder?.orderId === order.orderId;
                    const isAssignedToMe = order.assignedAgent === currentUser.email;
                    const isDelivered = order.status === "DELIVERED";
                    const statusConfig = STATUS_CONFIG[order.status] || STATUS_CONFIG["CREATED"];

                    return (
                      <button
                        key={order.id}
                        onClick={() => handleSelectOrder(order)}
                        className={`w-full text-left p-5 border transition-all cursor-pointer relative flex flex-col gap-3 ${
                          isDelivered
                            ? "border-slate-grey/15 bg-pure-white/50 opacity-60"
                            : isSelected
                            ? "border-deep-navy bg-pure-white shadow-sm font-bold"
                            : "border-slate-grey/20 bg-pure-white hover:border-slate-grey/40"
                        }`}
                      >
                        <div className="flex justify-between items-start w-full">
                          <div>
                            <span className="font-mono text-sm font-bold text-deep-navy block">{order.orderId}</span>
                            <span className="font-body-md text-xs text-slate-grey">{order.customerName || "VRIX Customer"}</span>
                          </div>
                          <span className={`inline-flex items-center gap-1 text-[9px] font-label-caps uppercase tracking-widest px-2.5 py-1 border ${statusConfig.className}`}>
                            {statusConfig.label}
                          </span>
                        </div>

                        <div className="font-body-md text-xs text-slate-grey space-y-1">
                          <p className="truncate">📍 {order.address || "No Address Provided"}</p>
                          <div className="flex justify-between text-[10px] text-slate-grey/80 pt-2 border-t border-slate-grey/15 font-label-caps">
                            <span>₹{Number(order.amount).toLocaleString("en-IN")}</span>
                            <span>{new Date(order.createdAt).toLocaleDateString("en-IN")}</span>
                          </div>
                        </div>

                        <div className="flex justify-between items-center text-[9px] font-label-caps pt-1 uppercase">
                          {isAssignedToMe ? (
                            <span className="text-deep-navy font-bold">Assigned to Me</span>
                          ) : (
                            <span className="text-amber-700 font-bold">Open Pool</span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Right Action Panel */}
            <div className="lg:col-span-2">
              <div className="bg-pure-white border border-slate-grey/20 p-6 space-y-6 sticky top-24 shadow-sm">
                {!selectedOrder ? (
                  <div className="text-center py-16 text-slate-grey font-label-caps text-xs tracking-widest">
                    Select a shipment from the queue to manage delivery.
                  </div>
                ) : (
                  <>
                    <div className="flex justify-between items-start border-b border-slate-grey/15 pb-3">
                      <div>
                        <h3 className="font-mono text-base font-bold text-deep-navy">{selectedOrder.orderId}</h3>
                        <p className="font-label-caps text-[9px] text-slate-grey uppercase tracking-widest">Delivery Card</p>
                      </div>
                      <button onClick={() => setSelectedOrder(null)} className="text-slate-grey text-xs">✕</button>
                    </div>

                    <div className="space-y-3 font-body-md text-xs bg-soft-linen/40 p-4 border border-slate-grey/15">
                      <div className="flex justify-between">
                        <span className="font-label-caps text-[9px] text-slate-grey uppercase">Customer</span>
                        <span className="font-bold text-deep-navy">{selectedOrder.customerName || "VRIX Customer"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-label-caps text-[9px] text-slate-grey uppercase">Phone</span>
                        <span className="font-mono">{selectedOrder.customerPhone || "Not provided"}</span>
                      </div>
                      <div className="flex flex-col gap-1 border-t border-slate-grey/15 pt-2">
                        <span className="font-label-caps text-[9px] text-slate-grey uppercase">Address</span>
                        <span className="text-xs text-ink-black">{selectedOrder.address}, {selectedOrder.city} - {selectedOrder.postalCode}</span>
                      </div>
                      <div className="flex justify-between border-t border-slate-grey/15 pt-2 font-bold">
                        <span className="font-label-caps text-[9px] text-slate-grey uppercase">Total</span>
                        <span className="text-deep-navy">₹{Number(selectedOrder.amount).toLocaleString("en-IN")}</span>
                      </div>

                      {/* ETA Control */}
                      <div className="border-t border-slate-grey/15 pt-3 space-y-2">
                        <span className="font-label-caps text-[9px] text-slate-grey uppercase block font-semibold">Update ETA</span>
                        <div className="grid grid-cols-3 gap-1">
                          <button
                            type="button"
                            onClick={() => handleUpdateEta(selectedOrder.orderId, getPresetEta("today_5pm"))}
                            className="border border-slate-grey/30 bg-pure-white text-[9px] py-1.5 font-label-caps uppercase hover:border-deep-navy cursor-pointer"
                          >
                            Today 5PM
                          </button>
                          <button
                            type="button"
                            onClick={() => handleUpdateEta(selectedOrder.orderId, getPresetEta("today_8pm"))}
                            className="border border-slate-grey/30 bg-pure-white text-[9px] py-1.5 font-label-caps uppercase hover:border-deep-navy cursor-pointer"
                          >
                            Today 8PM
                          </button>
                          <button
                            type="button"
                            onClick={() => handleUpdateEta(selectedOrder.orderId, getPresetEta("tomorrow_12pm"))}
                            className="border border-slate-grey/30 bg-pure-white text-[9px] py-1.5 font-label-caps uppercase hover:border-deep-navy cursor-pointer"
                          >
                            Tomorrow
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Verification Actions */}
                    {selectedOrder.status === "DELIVERED" ? (
                      <div className="text-center py-6 border border-emerald-500/20 bg-emerald-500/5 p-4">
                        <h4 className="font-label-caps text-xs text-emerald-800 uppercase font-bold">Package Delivered</h4>
                        <p className="font-body-md text-xs text-slate-grey mt-1">Verified with OTP confirmation.</p>
                      </div>
                    ) : (
                      <>
                        {confirmStep === "idle" && (
                          <div className="space-y-3">
                            <input
                              type="email"
                              value={customerEmailOverride}
                              onChange={(e) => setCustomerEmailOverride(e.target.value)}
                              placeholder="customer@email.com"
                              className="w-full border border-slate-grey/30 px-3 py-2 text-xs outline-none focus:border-deep-navy font-body-md"
                            />
                            <button
                              onClick={handleTriggerDeliveryOtp}
                              className="w-full bg-deep-navy text-pure-white font-button text-xs uppercase py-3.5 hover:bg-ink-black cursor-pointer"
                            >
                              Send Verification OTP
                            </button>
                          </div>
                        )}

                        {confirmStep === "sending" && (
                          <div className="py-6 text-center text-slate-grey font-label-caps text-xs tracking-widest animate-pulse">
                            DISPATCHING OTP...
                          </div>
                        )}

                        {confirmStep === "otp" && (
                          <form onSubmit={handleVerifyDelivery} className="space-y-4">
                            <div className="flex justify-between gap-1">
                              {confirmOtp.map((digit, idx) => (
                                <input
                                  key={idx}
                                  ref={(el) => { confirmOtpRefs.current[idx] = el; }}
                                  type="text"
                                  inputMode="numeric"
                                  maxLength={1}
                                  value={digit}
                                  onChange={(e) => handleConfirmOtpChange(idx, e.target.value)}
                                  onKeyDown={(e) => handleConfirmOtpKeyDown(idx, e)}
                                  onPaste={idx === 0 ? handleOtpPaste : undefined}
                                  className="w-10 h-12 text-center text-lg font-bold border border-slate-grey/30 focus:border-deep-navy outline-none bg-pure-white font-mono"
                                />
                              ))}
                            </div>
                            <button
                              type="submit"
                              disabled={actionLoading}
                              className="w-full bg-emerald-700 text-pure-white font-button text-xs uppercase py-3.5 hover:bg-emerald-800 cursor-pointer disabled:opacity-50"
                            >
                              Confirm OTP &amp; Mark Delivered
                            </button>
                          </form>
                        )}
                      </>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ═════════ MANAGER VIEW ═════════ */}
        {currentUser.role === "manager" && activeTab === "deliveries" && (
          <div className="space-y-4">
            <h3 className="font-label-caps text-[10px] text-slate-grey uppercase tracking-widest font-semibold">Active Shipment Log ({filteredOrders.length})</h3>

            {loading ? (
              <div className="p-12 text-center text-slate-grey font-label-caps text-xs tracking-widest animate-pulse">Loading Shipments...</div>
            ) : filteredOrders.length === 0 ? (
              <div className="bg-pure-white border border-slate-grey/20 p-12 text-center text-slate-grey font-label-caps text-xs tracking-widest">
                No shipments recorded.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredOrders.map((order) => {
                  const isDelivered = order.status === "DELIVERED";
                  const statusConfig = STATUS_CONFIG[order.status] || STATUS_CONFIG["CREATED"];
                  return (
                    <div key={order.id} className="bg-pure-white border border-slate-grey/20 p-5 space-y-4 shadow-xs">
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="font-mono text-sm font-bold text-deep-navy block">{order.orderId}</span>
                          <span className="font-body-md text-[10px] text-slate-grey">
                            {new Date(order.createdAt).toLocaleDateString("en-IN")}
                          </span>
                        </div>
                        <span className={`inline-flex items-center gap-1 text-[9px] font-label-caps uppercase tracking-widest px-2.5 py-1 border ${statusConfig.className}`}>
                          {statusConfig.label}
                        </span>
                      </div>

                      <div className="font-body-md text-xs space-y-1 pt-2 border-t border-slate-grey/15">
                        <p className="font-semibold text-deep-navy">👤 {order.customerName || "VRIX Customer"}</p>
                        <p className="text-slate-grey truncate">📍 {order.address}, {order.city}</p>
                        <p className="font-mono text-[10px] text-slate-grey">📞 {order.customerPhone || "No contact info"}</p>
                      </div>

                      <div className="space-y-3 pt-3 border-t border-slate-grey/15">
                        <div className="flex flex-col gap-1">
                          <label className="font-label-caps text-[9px] text-slate-grey uppercase">Assigned Agent</label>
                          <select
                            value={order.assignedAgent || "unassigned"}
                            disabled={isDelivered || actionLoading}
                            onChange={(e) => handleAssignAgent(order.orderId, e.target.value)}
                            className="border border-slate-grey/30 text-xs px-3 py-2 outline-none focus:border-deep-navy bg-pure-white"
                          >
                            <option value="unassigned">Unassigned (Pool)</option>
                            {staff
                              .filter((s) => s.role === "agent")
                              .map((agent) => (
                                <option key={agent.email} value={agent.email}>
                                  {agent.name} ({agent.email})
                                </option>
                              ))}
                          </select>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ═════════ MANAGER ONLY STAFF TAB ═════════ */}
        {currentUser.role === "manager" && activeTab === "staff" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-label-caps text-[10px] text-slate-grey uppercase tracking-widest font-semibold">Logistics Staff ({staff.length})</h3>
              <button
                onClick={() => setShowAddStaffModal(true)}
                className="bg-deep-navy text-pure-white font-label-caps text-xs uppercase tracking-widest px-5 py-2.5 hover:bg-ink-black cursor-pointer"
              >
                + Register Agent
              </button>
            </div>

            {showAddStaffModal && (
              <div className="fixed inset-0 bg-deep-navy/80 backdrop-blur-xs z-50 flex items-center justify-center p-4">
                <div className="bg-pure-white border border-slate-grey/20 p-8 max-w-md w-full space-y-5 shadow-2xl">
                  <div className="flex justify-between items-start border-b border-slate-grey/15 pb-3">
                    <h4 className="font-display-md text-base text-deep-navy uppercase">Add Logistics Staff</h4>
                    <button onClick={() => setShowAddStaffModal(false)} className="text-slate-grey">✕</button>
                  </div>

                  <form onSubmit={handleAddStaffMember} className="space-y-4">
                    <div className="flex flex-col gap-1">
                      <label className="font-label-caps text-[9px] text-slate-grey uppercase font-semibold">Full Name</label>
                      <input
                        type="text"
                        value={newStaffName}
                        onChange={(e) => setNewStaffName(e.target.value)}
                        placeholder="John Doe"
                        required
                        className="border-b border-slate-grey/30 py-2 text-xs outline-none focus:border-deep-navy font-body-md"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="font-label-caps text-[9px] text-slate-grey uppercase font-semibold">Email Address</label>
                      <input
                        type="email"
                        value={newStaffEmail}
                        onChange={(e) => setNewStaffEmail(e.target.value)}
                        placeholder="agent@vrix.com"
                        required
                        className="border-b border-slate-grey/30 py-2 text-xs outline-none focus:border-deep-navy font-body-md"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="font-label-caps text-[9px] text-slate-grey uppercase font-semibold">Role</label>
                      <select
                        value={newStaffRole}
                        onChange={(e) => setNewStaffRole(e.target.value as any)}
                        className="border-b border-slate-grey/30 py-2 text-xs outline-none focus:border-deep-navy bg-pure-white"
                      >
                        <option value="agent">Delivery Agent</option>
                        <option value="manager">Portal Manager</option>
                      </select>
                    </div>

                    <div className="flex gap-2 pt-2">
                      <button
                        type="submit"
                        disabled={actionLoading}
                        className="flex-1 bg-deep-navy text-pure-white font-label-caps text-xs uppercase py-3 hover:bg-ink-black cursor-pointer"
                      >
                        {actionLoading ? "Saving..." : "Register Staff"}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {staff.map((s) => (
                <div key={s.email} className="bg-pure-white border border-slate-grey/20 p-5 flex justify-between items-center shadow-xs">
                  <div>
                    <h4 className="font-body-md text-sm font-bold text-deep-navy">{s.name}</h4>
                    <p className="font-body-md text-xs text-slate-grey">{s.email}</p>
                    <span className="font-label-caps text-[9px] uppercase tracking-widest text-deep-navy bg-soft-linen px-2 py-0.5 border border-slate-grey/20 mt-2 inline-block">
                      {s.role}
                    </span>
                  </div>

                  {s.email !== "manager@vrix.com" && (
                    <button
                      disabled={actionLoading}
                      onClick={() => handleDeleteStaffMember(s.email)}
                      className="text-error font-label-caps text-[10px] uppercase hover:underline cursor-pointer"
                    >
                      Revoke
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
