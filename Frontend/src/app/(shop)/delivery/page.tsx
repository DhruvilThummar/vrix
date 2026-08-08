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
  CREATED: { label: "Pending", className: "bg-amber-500/10 text-amber-400 border-amber-500/20", dotClass: "bg-amber-500" },
  SUCCESS: { label: "Paid", className: "bg-blue-500/10 text-blue-400 border-blue-500/20", dotClass: "bg-blue-500" },
  OTP_SENT: { label: "OTP Sent / Out for Delivery", className: "bg-purple-500/10 text-purple-400 border-purple-500/20", dotClass: "bg-purple-500 animate-pulse" },
  DELIVERED: { label: "Delivered", className: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20", dotClass: "bg-emerald-500" },
  FAILED: { label: "Failed", className: "bg-rose-500/10 text-rose-400 border-rose-500/20", dotClass: "bg-rose-500" },
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
      
      if (role === "manager") {
        const staffData = await fetchDeliveryStaff();
        setStaff(staffData);
      }
    } catch (err: any) {
      showToast(err.message || "Failed to retrieve dashboard details.", "error");
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
      showToast(`Welcome back, ${res.user.name}!`);
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
    
    // If the order status is already OTP_SENT, guide user to entering OTP
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
      
      // Update our local state to reflect that OTP is sent
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

  // Auto-paste handler for OTP boxes
  const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").trim();
    if (/^\d{6}$/.test(pastedData)) {
      const digits = pastedData.split("");
      setConfirmOtp(digits);
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
    setActionLoading(true);
    try {
      const val = agentEmail === "unassigned" ? null : agentEmail;
      await assignDeliveryOrder(orderId, val);
      setOrders((prev) =>
        prev.map((o) => (o.orderId === orderId ? { ...o, assignedAgent: val || undefined } : o))
      );
      showToast("Successfully updated shipment assignment.");
    } catch (err: any) {
      showToast(err.message || "Failed to assign delivery agent.", "error");
    } finally {
      setActionLoading(false);
    }
  };

  // Manager & Agent: Update Estimated Delivery Date (ETA)
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

  const getPresetEta = (preset: "today" | "tomorrow" | "in2days") => {
    const d = new Date();
    if (preset === "today") {
      d.setHours(17, 0, 0, 0);
    } else if (preset === "tomorrow") {
      d.setDate(d.getDate() + 1);
      d.setHours(12, 0, 0, 0);
    } else if (preset === "in2days") {
      d.setDate(d.getDate() + 2);
      d.setHours(16, 0, 0, 0);
    }
    return d.toISOString();
  };

  // Manager: Staff Management CRUD
  const handleAddStaffMember = async (e: React.FormEvent) => {
    e.preventDefault();
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
    if (email === currentUser?.email) {
      showToast("You cannot remove your own account.", "error");
      return;
    }
    if (!confirm(`Are you sure you want to remove access for ${email}?`)) return;
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

  // Mock scan handler
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
    }, 1500);
  };

  // Render Login Component
  if (!currentUser) {
    return (
      <div className="w-full min-h-screen bg-[#070913] flex flex-col justify-center items-center px-4 py-8 relative overflow-hidden">
        {/* Ambient background glows */}
        <div className="absolute top-[-10%] left-[-10%] w-[350px] h-[350px] bg-blue-500/10 rounded-full blur-[80px] pointer-events-none" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[250px] h-[250px] bg-indigo-500/10 rounded-full blur-[70px] pointer-events-none" />

        <div className="w-full max-w-md text-center mb-8 z-10">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-[0_0_30px_rgba(59,130,246,0.3)] mb-4 text-white">
            <span className="material-symbols-outlined text-3xl">local_shipping</span>
          </div>
          <h1 className="text-white font-sans text-2xl font-bold tracking-[0.2em] uppercase">VRIX Logis</h1>
          <p className="text-white/40 text-xs tracking-widest mt-1 uppercase">Delivery Operations Portal</p>
        </div>

        <div className="w-full max-w-md bg-white/[0.03] border border-white/[0.08] backdrop-blur-xl p-8 rounded-2xl z-10 shadow-2xl">
          {authStep === "email" ? (
            <form onSubmit={handleAuthSubmit} className="space-y-6">
              <div className="space-y-2">
                <h2 className="text-white font-semibold text-lg">Staff Authentication</h2>
                <p className="text-white/50 text-xs leading-relaxed">Enter your registered staff email address to receive a secure portal access code.</p>
              </div>

              <div className="space-y-4">
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] tracking-[0.1em] text-white/40 uppercase font-semibold">Email Address</label>
                  <input
                    type="email"
                    value={authEmail}
                    onChange={(e) => setAuthEmail(e.target.value)}
                    placeholder="name@vrix.com"
                    required
                    className="w-full bg-white/[0.05] border border-white/[0.1] rounded-xl px-4 py-3 text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-blue-500/60 focus:bg-white/[0.08] transition-all"
                  />
                </div>

                <button
                  type="submit"
                  disabled={authLoading}
                  className="w-full mt-2 py-3.5 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 text-white text-sm font-semibold tracking-[0.1em] uppercase shadow-[0_0_20px_rgba(59,130,246,0.2)] hover:shadow-[0_0_30px_rgba(59,130,246,0.4)] disabled:opacity-50 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  {authLoading ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : "Request Login Code"}
                </button>
              </div>

              <div className="pt-4 border-t border-white/[0.05] text-center">
                <p className="text-[10px] text-white/30 leading-relaxed uppercase tracking-wider">
                  Testing: <span className="text-white/60 font-semibold">manager@vrix.com</span> · <span className="text-white/60 font-semibold">agent@vrix.com</span>
                </p>
              </div>
            </form>
          ) : (
            <form onSubmit={handleAuthVerify} className="space-y-6">
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => setAuthStep("email")}
                  className="text-blue-400 text-xs font-semibold hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[14px]">arrow_back</span> Back
                </button>
                <h2 className="text-white font-semibold text-lg mt-2">Enter Verification Code</h2>
                <p className="text-white/50 text-xs">
                  We've sent a 6-digit access code to <strong className="text-white/70">{authEmail}</strong>.
                </p>
              </div>

              <div className="space-y-5">
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
                      className="w-12 h-14 text-center text-xl font-bold bg-white/[0.05] border border-white/[0.1] rounded-xl focus:border-blue-400 focus:bg-white/[0.08] outline-none text-white transition-all"
                    />
                  ))}
                </div>

                <button
                  type="submit"
                  disabled={authLoading}
                  className="w-full py-3.5 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 text-white text-sm font-semibold tracking-[0.1em] uppercase shadow-[0_0_20px_rgba(59,130,246,0.2)] disabled:opacity-50 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  {authLoading ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : "Verify & Sign In"}
                </button>
              </div>

              <button
                type="button"
                onClick={handleAuthSubmit}
                className="w-full text-center text-[10px] text-white/40 hover:text-white font-semibold underline cursor-pointer uppercase tracking-wider"
              >
                Resend verification code
              </button>
            </form>
          )}
        </div>

        {/* Toast Alert */}
        {toast && (
          <div className={`fixed bottom-6 right-6 z-50 px-6 py-4 shadow-2xl flex items-center gap-3 text-sm border animate-fade-in rounded-xl ${
            toast.type === "success" ? "bg-slate-900/90 text-white border-white/10" : "bg-red-900/90 text-white border-red-700/50"
          }`}>
            <span className="material-symbols-outlined text-[16px]">{toast.type === "success" ? "check_circle" : "error"}</span>
            {toast.msg}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-[#070913] text-white flex flex-col font-sans select-none pb-12">
      {/* Toast Alert */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 px-6 py-4 border border-white/10 bg-slate-900/95 backdrop-blur-md shadow-2xl rounded-xl flex items-center gap-3 animate-fade-in text-sm ${
          toast.type === "success" ? "text-emerald-400" : "text-rose-400"
        }`}>
          <span className="material-symbols-outlined text-[18px]">{toast.type === "success" ? "check_circle" : "error"}</span>
          {toast.msg}
        </div>
      )}

      {/* Barcode scanner overlay mockup */}
      {showScannerMock && (
        <div className="fixed inset-0 z-50 bg-[#05070a]/90 flex flex-col items-center justify-center p-6 text-center animate-fade-in">
          <div className="relative w-64 h-64 border-2 border-blue-500/50 rounded-2xl flex items-center justify-center overflow-hidden bg-black/40">
            <div className="absolute left-0 w-full h-0.5 bg-blue-400 shadow-md shadow-blue-500/50 animate-bounce" style={{ animationDuration: "2.s" }} />
            <span className="material-symbols-outlined text-white/10 text-6xl">qr_code_scanner</span>
          </div>
          <h3 className="text-xs uppercase tracking-widest text-blue-400 mt-6 animate-pulse font-semibold">Scanning Shipment Barcode...</h3>
          <p className="text-white/40 text-[10px] mt-2 uppercase">Simulating camera integration</p>
        </div>
      )}

      {/* Header Bar */}
      <header className="border-b border-white/[0.05] bg-[#0c0f1e]/90 px-4 md:px-8 py-4 flex items-center justify-between sticky top-0 z-30 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white shadow-lg">
            <span className="material-symbols-outlined text-[22px]">local_shipping</span>
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-[0.15em] uppercase">VRIX Logis</h1>
            <p className="text-white/40 text-[9px] tracking-widest uppercase font-semibold">
              {currentUser.role === "manager" ? "Control Console" : "Agent Workstation"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden sm:flex flex-col text-right">
            <span className="text-xs text-white/70 font-semibold">{currentUser.name}</span>
            <span className="text-[9px] text-white/30 uppercase tracking-widest font-semibold">{currentUser.role}</span>
          </div>
          <button
            onClick={handleLogout}
            className="border border-white/10 hover:border-white/25 rounded-lg px-3 py-1.5 text-[9px] tracking-widest uppercase text-white/50 hover:text-white transition-colors cursor-pointer"
          >
            Log Out
          </button>
        </div>
      </header>

      {/* Main Panel Body */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-4 md:p-6 space-y-6">
        
        {/* --- Dashboard Top Stats Metrics --- */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {currentUser.role === "manager" ? (
            <>
              <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-4 flex flex-col justify-between">
                <span className="text-white/40 font-semibold text-[9px] uppercase tracking-widest">Total Shipments</span>
                <span className="text-2xl font-bold mt-2">{orders.length}</span>
              </div>
              <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-4 flex flex-col justify-between">
                <span className="text-white/40 font-semibold text-[9px] uppercase tracking-widest">Pending</span>
                <span className="text-2xl font-bold text-amber-400 mt-2">
                  {orders.filter((o) => o.status !== "DELIVERED").length}
                </span>
              </div>
              <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-4 flex flex-col justify-between">
                <span className="text-white/40 font-semibold text-[9px] uppercase tracking-widest">Completed</span>
                <span className="text-2xl font-bold text-emerald-400 mt-2">
                  {orders.filter((o) => o.status === "DELIVERED").length}
                </span>
              </div>
              <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-4 flex flex-col justify-between">
                <span className="text-white/40 font-semibold text-[9px] uppercase tracking-widest">Active Staff</span>
                <span className="text-2xl font-bold text-purple-400 mt-2">{staff.length}</span>
              </div>
            </>
          ) : (
            <>
              <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-4 flex flex-col justify-between">
                <span className="text-white/40 font-semibold text-[9px] uppercase tracking-widest">My Active Tasks</span>
                <span className="text-2xl font-bold mt-2">
                  {orders.filter((o) => o.assignedAgent === currentUser.email && o.status !== "DELIVERED").length}
                </span>
              </div>
              <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-4 flex flex-col justify-between">
                <span className="text-white/40 font-semibold text-[9px] uppercase tracking-widest">Delivered Today</span>
                <span className="text-2xl font-bold text-emerald-400 mt-2">
                  {orders.filter((o) => o.assignedAgent === currentUser.email && o.status === "DELIVERED").length}
                </span>
              </div>
              <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-4 flex flex-col justify-between">
                <span className="text-white/40 font-semibold text-[9px] uppercase tracking-widest">Open Pool</span>
                <span className="text-2xl font-bold text-blue-400 mt-2">
                  {orders.filter((o) => !o.assignedAgent && o.status !== "DELIVERED").length}
                </span>
              </div>
              <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-4 flex flex-col justify-between">
                <span className="text-white/40 font-semibold text-[9px] uppercase tracking-widest">Efficiency</span>
                <span className="text-2xl font-bold text-amber-400 mt-2">99.2%</span>
              </div>
            </>
          )}
        </div>

        {/* Tabs for Manager */}
        {currentUser.role === "manager" && (
          <div className="flex border-b border-white/[0.05]">
            <button
              onClick={() => setActiveTab("deliveries")}
              className={`px-6 py-3 text-xs uppercase tracking-widest border-b-2 cursor-pointer transition-all ${
                activeTab === "deliveries" ? "border-blue-500 text-blue-400 font-bold" : "border-transparent text-white/50 hover:text-white"
              }`}
            >
              Shipments
            </button>
            <button
              onClick={() => setActiveTab("staff")}
              className={`px-6 py-3 text-xs uppercase tracking-widest border-b-2 cursor-pointer transition-all ${
                activeTab === "staff" ? "border-blue-500 text-blue-400 font-bold" : "border-transparent text-white/50 hover:text-white"
              }`}
            >
              Delivery Staff
            </button>
          </div>
        )}

        {/* Search header */}
        {!(currentUser.role === "manager" && activeTab === "staff") && (
          <div className="flex gap-2">
            <div className="relative flex-1">
              <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30 text-[18px]">search</span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search order ID, city or customer..."
                className="w-full bg-white/[0.02] border border-white/[0.08] text-white pl-11 pr-10 py-3.5 rounded-xl text-sm outline-none focus:border-blue-500/55 transition-all placeholder-white/20"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white"
                >
                  ✕
                </button>
              )}
            </div>
            <button
              onClick={handleMockScan}
              title="Scan Shipment Barcode"
              className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl px-4 flex items-center justify-center text-white cursor-pointer active:scale-95 transition-all shadow-[0_0_15px_rgba(59,130,246,0.15)]"
            >
              <span className="material-symbols-outlined text-[20px]">qr_code_scanner</span>
            </button>
          </div>
        )}

        {/* ═════════ AGENT VIEW ═════════ */}
        {currentUser.role === "agent" && (
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            
            {/* Left Queue List */}
            <div className="lg:col-span-3 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-[10px] text-white/40 uppercase tracking-widest font-semibold">Active Task Queue</h3>
                <button
                  onClick={() => loadDashboardData(currentUser.role, currentUser.email)}
                  className="text-blue-400 text-xs font-semibold hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[14px]">refresh</span> Reload Queue
                </button>
              </div>

              {loading ? (
                <div className="p-12 text-center text-white/30 tracking-widest animate-pulse uppercase text-xs">Loading Task List...</div>
              ) : filteredOrders.length === 0 ? (
                <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-12 text-center text-white/30 flex flex-col items-center gap-2">
                  <span className="material-symbols-outlined text-4xl text-white/10">inventory_2</span>
                  <span className="text-xs uppercase tracking-widest">No active shipments in queue</span>
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
                        className={`w-full text-left p-5 border rounded-2xl transition-all flex flex-col gap-3.5 cursor-pointer relative overflow-hidden ${
                          isDelivered
                            ? "border-white/[0.03] bg-white/[0.01] opacity-50 hover:opacity-80"
                            : isSelected
                            ? "border-blue-500/70 bg-blue-500/[0.06] shadow-[0_0_20px_rgba(59,130,246,0.1)]"
                            : "border-white/[0.06] bg-white/[0.03] hover:border-white/[0.12] hover:bg-white/[0.05]"
                        }`}
                      >
                        <div className="flex justify-between items-start w-full">
                          <div className="space-y-1">
                            <span className="text-white font-bold text-sm tracking-wide block font-mono">
                              {order.orderId}
                            </span>
                            <span className="text-[11px] text-white/60 block font-semibold">
                              {order.customerName || "VRIX Customer"}
                            </span>
                          </div>
                          <span className={`inline-flex items-center gap-1 text-[8px] font-bold uppercase tracking-widest px-2.5 py-1 border rounded-full ${statusConfig.className}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${statusConfig.dotClass}`} />
                            {statusConfig.label}
                          </span>
                        </div>

                        <div className="text-xs text-white/40 space-y-1 font-medium">
                          <p className="truncate">📍 {order.address || "No Address Provided"}</p>
                          <div className="flex justify-between text-[10px] text-white/30 pt-1 border-t border-white/[0.05]">
                            <span>₹{Number(order.amount).toLocaleString("en-IN")}</span>
                            <span>{new Date(order.createdAt).toLocaleDateString("en-IN")}</span>
                          </div>
                        </div>

                        {/* Assignment flags */}
                        <div className="flex justify-between items-center text-[9px] pt-1">
                          {isAssignedToMe ? (
                            <span className="text-blue-400 uppercase tracking-widest font-semibold flex items-center gap-1">
                              <span className="material-symbols-outlined text-[13px]">assignment_turned_in</span> Assigned to Me
                            </span>
                          ) : (
                            <span className="text-amber-400/80 uppercase tracking-widest font-semibold flex items-center gap-1">
                              <span className="material-symbols-outlined text-[13px]">group</span> Open Pool
                            </span>
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
              <div className="bg-white/[0.02] border border-white/[0.08] p-5 rounded-2xl space-y-6 sticky top-24 backdrop-blur-xl">
                {!selectedOrder ? (
                  <div className="text-center py-16 text-white/30 flex flex-col items-center gap-3">
                    <span className="material-symbols-outlined text-5xl text-white/10">touch_app</span>
                    <p className="text-xs uppercase tracking-widest font-semibold">Select a shipment to begin</p>
                  </div>
                ) : (
                  <>
                    <div className="flex justify-between items-start border-b border-white/[0.05] pb-3">
                      <div>
                        <h3 className="text-white font-bold text-sm font-mono">{selectedOrder.orderId}</h3>
                        <p className="text-white/40 text-[9px] uppercase tracking-widest font-semibold mt-0.5">Verification & Delivery Card</p>
                      </div>
                      <button onClick={() => setSelectedOrder(null)} className="text-white/40 hover:text-white text-xs">✕</button>
                    </div>

                    {/* Order Details List */}
                    <div className="space-y-3.5 text-xs bg-white/[0.02] border border-white/[0.05] p-4 rounded-xl">
                      <div className="flex justify-between">
                        <span className="text-white/40 uppercase tracking-widest text-[9px] font-semibold">Customer</span>
                        <span className="text-white/80 font-bold">{selectedOrder.customerName || "VRIX Customer"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-white/40 uppercase tracking-widest text-[9px] font-semibold">Phone</span>
                        <span className="text-white/80 font-mono">{selectedOrder.customerPhone || "Not provided"}</span>
                      </div>
                      <div className="flex flex-col gap-1 border-t border-white/[0.05] pt-2">
                        <span className="text-white/40 uppercase tracking-widest text-[9px] font-semibold">Delivery Address</span>
                        <span className="text-white/70 text-[11px] leading-relaxed">{selectedOrder.address}, {selectedOrder.city} - {selectedOrder.postalCode}</span>
                      </div>
                      <div className="flex justify-between border-t border-white/[0.05] pt-2 font-bold">
                        <span className="text-white/40 uppercase tracking-widest text-[9px] font-semibold">Total Price</span>
                        <span className="text-blue-400">₹{Number(selectedOrder.amount).toLocaleString("en-IN")}</span>
                      </div>

                      {/* ETA Management Picker */}
                      <div className="border-t border-white/[0.05] pt-3 space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-white/40 uppercase tracking-widest text-[9px] font-semibold">Set Estimated Arrival (ETA)</span>
                          {selectedOrder.estimatedDeliveryDate && (
                            <span className="text-blue-400 font-semibold text-[10px]">
                              {new Date(selectedOrder.estimatedDeliveryDate).toLocaleDateString("en-IN", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                            </span>
                          )}
                        </div>
                        <div className="grid grid-cols-3 gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleUpdateEta(selectedOrder.orderId, getPresetEta("today"))}
                            className="bg-white/5 hover:bg-white/10 border border-white/10 text-white/80 rounded-lg py-1.5 text-[9px] font-bold uppercase tracking-wider transition-colors cursor-pointer"
                          >
                            Today 5 PM
                          </button>
                          <button
                            type="button"
                            onClick={() => handleUpdateEta(selectedOrder.orderId, getPresetEta("tomorrow"))}
                            className="bg-white/5 hover:bg-white/10 border border-white/10 text-white/80 rounded-lg py-1.5 text-[9px] font-bold uppercase tracking-wider transition-colors cursor-pointer"
                          >
                            Tomorrow 12 PM
                          </button>
                          <button
                            type="button"
                            onClick={() => handleUpdateEta(selectedOrder.orderId, getPresetEta("in2days"))}
                            className="bg-white/5 hover:bg-white/10 border border-white/10 text-white/80 rounded-lg py-1.5 text-[9px] font-bold uppercase tracking-wider transition-colors cursor-pointer"
                          >
                            In 2 Days
                          </button>
                        </div>
                        <input
                          type="datetime-local"
                          onChange={(e) => e.target.value && handleUpdateEta(selectedOrder.orderId, new Date(e.target.value).toISOString())}
                          className="w-full bg-[#0c0f1e] border border-white/10 text-white/70 text-[10px] px-2.5 py-1.5 rounded-lg outline-none focus:border-blue-500 bg-transparent"
                        />
                      </div>
                    </div>

                    {/* Actions */}
                    {selectedOrder.status !== "DELIVERED" && (
                      <div className="grid grid-cols-2 gap-2">
                        <a
                          href={selectedOrder.customerPhone ? `tel:${selectedOrder.customerPhone}` : "#"}
                          className={`flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-bold uppercase tracking-widest border transition-all ${
                            selectedOrder.customerPhone
                              ? "border-white/10 bg-white/5 hover:bg-white/10 text-white"
                              : "border-white/5 text-white/20 cursor-not-allowed pointer-events-none"
                          }`}
                        >
                          <span className="material-symbols-outlined text-[16px]">call</span> Call User
                        </a>
                        <a
                          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                            `${selectedOrder.address || ""}, ${selectedOrder.city || ""}`
                          )}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-bold uppercase tracking-widest border border-white/10 bg-white/5 hover:bg-white/10 text-white transition-all"
                        >
                          <span className="material-symbols-outlined text-[16px]">navigation</span> Navigate
                        </a>
                      </div>
                    )}

                    {selectedOrder.status === "DELIVERED" ? (
                      <div className="text-center py-6 space-y-4">
                        <div className="w-12 h-12 bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center mx-auto rounded-full">
                          <span className="material-symbols-outlined text-emerald-400 text-2xl">check_circle</span>
                        </div>
                        <h4 className="text-sm font-bold text-emerald-400 uppercase tracking-wider">Order Delivered</h4>
                        <p className="text-white/40 text-xs">This shipment has been verified by OTP and successfully delivered.</p>
                      </div>
                    ) : (
                      <>
                        {/* OTP Flow UI */}
                        {confirmStep === "idle" && (
                          <div className="space-y-4">
                            <div className="flex flex-col gap-2">
                              <label className="text-[10px] text-white/40 uppercase tracking-widest font-semibold">
                                Dispatch Verification OTP to Email
                              </label>
                              <input
                                type="email"
                                value={customerEmailOverride}
                                onChange={(e) => setCustomerEmailOverride(e.target.value)}
                                placeholder="customer@email.com"
                                className="w-full bg-white/[0.05] border border-white/[0.1] rounded-xl px-3 py-2.5 text-white text-xs outline-none focus:border-blue-500/50"
                              />
                            </div>
                            <button
                              onClick={handleTriggerDeliveryOtp}
                              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-[11px] uppercase tracking-widest py-3.5 rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow-lg active:scale-98 transition-all"
                            >
                              <span className="material-symbols-outlined text-[16px]">send</span> Send Verification OTP
                            </button>
                          </div>
                        )}

                        {confirmStep === "sending" && (
                          <div className="py-6 text-center text-white/50 tracking-widest text-xs flex items-center justify-center gap-2">
                            <span className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                            DISPATCHING OTP...
                          </div>
                        )}

                        {confirmStep === "otp" && (
                          <form onSubmit={handleVerifyDelivery} className="space-y-5">
                            <div className="space-y-1">
                              <h4 className="text-white font-bold text-xs">Verify Delivery Code</h4>
                              <p className="text-white/40 text-[10px]">
                                Code sent to <strong className="text-white/60">{customerEmailOverride}</strong>.
                              </p>
                            </div>

                            <div className="flex justify-between gap-1.5">
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
                                  className="w-10 h-12 text-center text-lg font-bold bg-white/[0.05] border border-white/[0.1] focus:border-blue-400 focus:bg-white/[0.08] outline-none text-white rounded-xl transition-all"
                                />
                              ))}
                            </div>

                            <div className="flex gap-2">
                              <button
                                type="submit"
                                disabled={actionLoading}
                                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] uppercase tracking-widest py-3.5 rounded-xl flex items-center justify-center gap-2 cursor-pointer border border-emerald-500 active:scale-98 transition-all"
                              >
                                {actionLoading ? (
                                  <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                ) : (
                                  <>
                                    <span className="material-symbols-outlined text-[14px]">verified</span> Confirm Delivery
                                  </>
                                )}
                              </button>
                              <button
                                type="button"
                                onClick={() => setConfirmStep("idle")}
                                className="border border-white/10 hover:border-white/20 text-white/50 hover:text-white px-4 rounded-xl text-[11px] font-bold uppercase tracking-widest cursor-pointer"
                              >
                                Back
                              </button>
                            </div>

                            <button
                              type="button"
                              onClick={handleTriggerDeliveryOtp}
                              className="w-full text-center text-[9px] text-white/30 hover:text-white/60 font-semibold underline cursor-pointer uppercase tracking-wider"
                            >
                              Resend OTP Code
                            </button>
                          </form>
                        )}

                        {confirmStep === "success" && (
                          <div className="text-center py-6 space-y-4">
                            <div className="w-12 h-12 bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center mx-auto rounded-full">
                              <span className="material-symbols-outlined text-emerald-400 text-2xl animate-bounce">check_circle</span>
                            </div>
                            <h4 className="text-sm font-bold text-emerald-400 uppercase tracking-wider">Package Delivered</h4>
                            <p className="text-white/40 text-xs">Shipment status has been updated to DELIVERED.</p>
                            <button
                              onClick={() => setSelectedOrder(null)}
                              className="border border-white/10 hover:border-white/20 rounded-xl py-3 text-[10px] font-bold uppercase tracking-widest text-white/60 hover:text-white cursor-pointer w-full mt-2"
                            >
                              Dismiss Card
                            </button>
                          </div>
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
            <div className="flex items-center justify-between">
              <h3 className="text-[10px] text-white/40 uppercase tracking-widest font-semibold">Active Shipment Log ({filteredOrders.length})</h3>
              <button
                onClick={() => loadDashboardData(currentUser.role, currentUser.email)}
                className="text-blue-400 text-xs font-semibold hover:underline cursor-pointer flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-[14px]">refresh</span> Reload Log
              </button>
            </div>

            {loading ? (
              <div className="p-12 text-center text-white/30 tracking-widest animate-pulse uppercase text-xs">Loading Shipments...</div>
            ) : filteredOrders.length === 0 ? (
              <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-12 text-center text-white/30 flex flex-col items-center gap-2">
                <span className="material-symbols-outlined text-4xl text-white/10">inventory_2</span>
                <span className="text-xs uppercase tracking-widest">No shipments recorded</span>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredOrders.map((order) => {
                  const isDelivered = order.status === "DELIVERED";
                  const statusConfig = STATUS_CONFIG[order.status] || STATUS_CONFIG["CREATED"];
                  return (
                    <div
                      key={order.id}
                      className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-5 space-y-4 flex flex-col justify-between"
                    >
                      <div className="space-y-2">
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="text-white font-bold text-sm block font-mono">{order.orderId}</span>
                            <span className="text-white/40 text-[10px]">
                              {new Date(order.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                            </span>
                          </div>
                          <span className={`inline-flex items-center gap-1 text-[8px] font-bold uppercase tracking-widest px-2.5 py-1 border rounded-full ${statusConfig.className}`}>
                            <span className={`w-1 h-1 rounded-full ${statusConfig.dotClass}`} />
                            {statusConfig.label}
                          </span>
                        </div>

                        <div className="text-xs space-y-1 pt-1.5 border-t border-white/[0.05]">
                          <p className="text-white/80 font-semibold">👤 {order.customerName || "VRIX Customer"}</p>
                          <p className="text-white/60 truncate">📍 {order.address}, {order.city}</p>
                          <p className="text-white/40 font-mono text-[10px]">📞 {order.customerPhone || "No contact info"}</p>
                        </div>
                      </div>

                      <div className="space-y-3 pt-3 border-t border-white/[0.05]">
                        <div className="flex flex-col gap-1.5">
                          <label className="text-[9px] text-white/40 uppercase tracking-widest font-semibold">Assigned Agent</label>
                          <select
                            value={order.assignedAgent || "unassigned"}
                            disabled={isDelivered || actionLoading}
                            onChange={(e) => handleAssignAgent(order.orderId, e.target.value)}
                            className="bg-[#0c0f1e] border border-white/10 text-white/80 text-xs px-3 py-2 rounded-xl outline-none focus:border-blue-500 bg-transparent disabled:opacity-50"
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

                        {/* Manager ETA Control */}
                        {!isDelivered && (
                          <div className="flex flex-col gap-1.5 pt-2 border-t border-white/[0.05]">
                            <div className="flex justify-between items-center">
                              <label className="text-[9px] text-white/40 uppercase tracking-widest font-semibold">Estimated Arrival (ETA)</label>
                              {order.estimatedDeliveryDate && (
                                <span className="text-blue-400 font-semibold text-[10px]">
                                  {new Date(order.estimatedDeliveryDate).toLocaleDateString("en-IN", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                                </span>
                              )}
                            </div>
                            <div className="grid grid-cols-3 gap-1">
                              <button
                                type="button"
                                onClick={() => handleUpdateEta(order.orderId, getPresetEta("today"))}
                                className="bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 rounded py-1 text-[8px] uppercase tracking-wider font-semibold cursor-pointer"
                              >
                                Today
                              </button>
                              <button
                                type="button"
                                onClick={() => handleUpdateEta(order.orderId, getPresetEta("tomorrow"))}
                                className="bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 rounded py-1 text-[8px] uppercase tracking-wider font-semibold cursor-pointer"
                              >
                                Tomorrow
                              </button>
                              <button
                                type="button"
                                onClick={() => handleUpdateEta(order.orderId, getPresetEta("in2days"))}
                                className="bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 rounded py-1 text-[8px] uppercase tracking-wider font-semibold cursor-pointer"
                              >
                                +2 Days
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* --- MANAGER STAFF TAB --- */}
        {currentUser.role === "manager" && activeTab === "staff" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-[10px] text-white/40 uppercase tracking-widest font-semibold">Logistics Staff ({staff.length})</h3>
              <button
                onClick={() => setShowAddStaffModal(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-[10px] uppercase tracking-widest px-4 py-2 rounded-xl flex items-center gap-1.5 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[14px]">person_add</span> Register Agent
              </button>
            </div>

            {showAddStaffModal && (
              <div className="fixed inset-0 bg-[#05070a]/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                <div className="bg-[#0c0f1e] border border-white/10 p-6 rounded-2xl max-w-md w-full space-y-5 animate-slide-down">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="text-white font-bold text-base">Add Logistics Staff</h4>
                      <p className="text-white/40 text-[10px]">Register new delivery staff email credentials.</p>
                    </div>
                    <button onClick={() => setShowAddStaffModal(false)} className="text-white/40 hover:text-white">✕</button>
                  </div>

                  <form onSubmit={handleAddStaffMember} className="space-y-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[9px] text-white/50 uppercase tracking-widest font-semibold">Full Name</label>
                      <input
                        type="text"
                        value={newStaffName}
                        onChange={(e) => setNewStaffName(e.target.value)}
                        placeholder="John Doe"
                        required
                        className="bg-white/[0.04] border border-white/10 rounded-xl text-white text-xs px-3 py-2.5 outline-none focus:border-blue-500"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[9px] text-white/50 uppercase tracking-widest font-semibold">Email Address</label>
                      <input
                        type="email"
                        value={newStaffEmail}
                        onChange={(e) => setNewStaffEmail(e.target.value)}
                        placeholder="agent@vrix.com"
                        required
                        className="bg-white/[0.04] border border-white/10 rounded-xl text-white text-xs px-3 py-2.5 outline-none focus:border-blue-500"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[9px] text-white/50 uppercase tracking-widest font-semibold">Portal Role</label>
                      <select
                        value={newStaffRole}
                        onChange={(e) => setNewStaffRole(e.target.value as any)}
                        className="bg-[#0c0f1e] border border-white/10 rounded-xl text-white text-xs px-3 py-2.5 outline-none focus:border-blue-500"
                      >
                        <option value="agent">Delivery Agent</option>
                        <option value="manager">Portal Manager</option>
                      </select>
                    </div>

                    <div className="flex gap-2 pt-2">
                      <button
                        type="submit"
                        disabled={actionLoading}
                        className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold text-[11px] uppercase tracking-widest py-3 rounded-xl cursor-pointer"
                      >
                        {actionLoading ? "Saving..." : "Register Staff"}
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowAddStaffModal(false)}
                        className="border border-white/10 hover:border-white/20 text-white/50 hover:text-white px-4 rounded-xl text-[11px] font-bold uppercase tracking-widest cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {loading ? (
              <div className="p-12 text-center text-white/30 tracking-widest animate-pulse uppercase text-xs">Loading Staff...</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {staff.map((s) => (
                  <div
                    key={s.email}
                    className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-4 flex justify-between items-center"
                  >
                    <div className="space-y-1">
                      <h4 className="text-white font-semibold text-sm">{s.name}</h4>
                      <p className="text-white/40 text-[10px]">{s.email}</p>
                      <span className={`inline-block text-[8px] font-bold uppercase tracking-widest px-2.5 py-0.5 border rounded-full mt-1.5 ${
                        s.role === "manager"
                          ? "bg-purple-500/10 text-purple-400 border-purple-500/20"
                          : "bg-blue-500/10 text-blue-400 border-blue-500/20"
                      }`}>
                        {s.role}
                      </span>
                    </div>

                    {s.email !== "manager@vrix.com" && (
                      <button
                        disabled={actionLoading}
                        onClick={() => handleDeleteStaffMember(s.email)}
                        className="text-rose-400 hover:text-rose-300 font-bold text-[10px] uppercase tracking-widest transition-colors cursor-pointer"
                      >
                        Revoke
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </main>
    </div>
  );
}
