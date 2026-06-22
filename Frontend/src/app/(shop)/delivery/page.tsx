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
} from "@/utils/api";

type DeliveryStatus = "CREATED" | "SUCCESS" | "DELIVERED" | "FAILED";

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
}

interface StaffMember {
  email: string;
  name: string;
  role: "agent" | "manager";
}

const STATUS_COLORS: Record<DeliveryStatus, string> = {
  CREATED: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  SUCCESS: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  DELIVERED: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  FAILED: "bg-rose-500/10 text-rose-400 border-rose-500/20",
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
    setConfirmStep("idle");
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
      // Pick a random pending order ID if available
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
      <div className="w-full min-h-screen bg-[#0f1728] flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden">
        {/* Background glow effects */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] bg-blue-500/10 rounded-full blur-[80px] pointer-events-none" />
        <div className="absolute bottom-1/4 left-1/3 w-[250px] h-[250px] bg-purple-500/10 rounded-full blur-[70px] pointer-events-none" />

        {/* Header Bar */}
        <div className="w-full max-w-md text-center mb-8 z-10">
          <div className="inline-flex items-center gap-3 mb-3 text-blue-400">
            <span className="material-symbols-outlined text-4xl">local_shipping</span>
          </div>
          <h1 className="text-pure-white font-display-lg text-2xl uppercase tracking-widest">VRIX Logis</h1>
          <p className="text-white/40 text-xs font-label-caps uppercase tracking-widest mt-1">Delivery Operations Portal</p>
        </div>

        {/* Login Box */}
        <div className="w-full max-w-md bg-white/5 border border-white/10 backdrop-blur-xl p-8 rounded-none space-y-6 z-10 shadow-2xl">
          {authStep === "email" ? (
            <form onSubmit={handleAuthSubmit} className="space-y-5">
              <div className="space-y-2">
                <h2 className="text-white font-semibold text-lg font-body-md">Staff Authentication</h2>
                <p className="text-white/55 text-xs font-body-md">Enter your registered staff email address to receive a portal access code.</p>
              </div>

              <div className="space-y-4">
                <div className="flex flex-col gap-2">
                  <label className="font-label-caps text-[10px] text-white/55 uppercase tracking-widest">Email Address</label>
                  <input
                    type="email"
                    value={authEmail}
                    onChange={(e) => setAuthEmail(e.target.value)}
                    placeholder="name@vrix.com"
                    required
                    className="bg-white/5 border border-white/15 text-white text-sm px-4 py-3 outline-none focus:border-blue-400 focus:bg-white/10 transition-all font-body-md placeholder-white/20"
                  />
                </div>

                <button
                  type="submit"
                  disabled={authLoading}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-button text-[11px] uppercase tracking-widest py-4 transition-colors flex items-center justify-center gap-2 cursor-pointer border border-blue-500"
                >
                  {authLoading ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : "Request Login Code"}
                </button>
              </div>

              <div className="pt-2 text-center">
                <p className="text-[10px] text-white/30 font-body-md leading-relaxed">
                  Default testing accounts: <br />
                  Manager: <strong className="text-white/55">manager@vrix.com</strong> · Agent: <strong className="text-white/55">agent@vrix.com</strong>
                </p>
              </div>
            </form>
          ) : (
            <form onSubmit={handleAuthVerify} className="space-y-6">
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => setAuthStep("email")}
                  className="text-blue-400 text-xs font-body-md hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[14px]">arrow_back</span> Back
                </button>
                <h2 className="text-white font-semibold text-lg font-body-md mt-2">Enter Verification Code</h2>
                <p className="text-white/55 text-xs font-body-md">
                  We've generated a 6-digit access code for <strong className="text-white/70">{authEmail}</strong>.
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
                      className="w-12 h-14 text-center text-xl font-bold bg-white/5 border border-white/20 focus:border-blue-400 focus:bg-white/10 outline-none text-white transition-all rounded-none"
                    />
                  ))}
                </div>

                <button
                  type="submit"
                  disabled={authLoading}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-button text-[11px] uppercase tracking-widest py-4 transition-colors flex items-center justify-center gap-2 cursor-pointer"
                >
                  {authLoading ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : "Verify & Sign In"}
                </button>
              </div>

              <button
                type="button"
                onClick={handleAuthSubmit}
                className="w-full text-center text-[10px] text-white/30 hover:text-white/60 font-body-md underline cursor-pointer"
              >
                Resend verification code
              </button>
            </form>
          )}
        </div>

        {/* Global Toast Alert inside login */}
        {toast && (
          <div className={`fixed top-6 right-6 z-50 px-6 py-4 border shadow-2xl flex items-center gap-3 animate-fade-in text-sm font-body-md ${
            toast.type === "success" ? "bg-deep-navy text-pure-white border-slate-grey/30" : "bg-red-900 text-white border-red-700"
          }`}>
            <span className="material-symbols-outlined text-[16px]">{toast.type === "success" ? "check_circle" : "error"}</span>
            {toast.msg}
          </div>
        )}
      </div>
    );
  }

  // Render Portal Console
  return (
    <div className="w-full min-h-screen bg-[#0b0f19] text-white flex flex-col font-body-md select-none">
      {/* Toast Alert */}
      {toast && (
        <div className={`fixed top-6 right-6 z-50 px-6 py-4 border border-white/10 backdrop-blur-xl shadow-2xl flex items-center gap-3 animate-fade-in text-sm font-body-md ${
          toast.type === "success" ? "bg-blue-950/90 text-blue-200" : "bg-rose-950/90 text-rose-200"
        }`}>
          <span className="material-symbols-outlined text-[16px]">{toast.type === "success" ? "check_circle" : "error"}</span>
          {toast.msg}
        </div>
      )}

      {/* Barcode scanner overlay mockup */}
      {showScannerMock && (
        <div className="fixed inset-0 z-50 bg-[#05070a]/90 flex flex-col items-center justify-center p-6 text-center animate-fade-in">
          <div className="relative w-64 h-64 border-2 border-blue-500/50 flex items-center justify-center overflow-hidden">
            {/* Laser line animation */}
            <div className="absolute left-0 w-full h-0.5 bg-blue-400 shadow-md shadow-blue-500/50 animate-bounce" style={{ animationDuration: "2s" }} />
            <span className="material-symbols-outlined text-white/20 text-6xl">qr_code_scanner</span>
          </div>
          <h3 className="font-label-caps text-xs uppercase tracking-widest text-blue-400 mt-6 animate-pulse">Scanning Shipment Barcode...</h3>
          <p className="text-white/40 text-[10px] mt-2">Simulating device camera integration</p>
        </div>
      )}

      {/* Header Bar */}
      <header className="border-b border-white/5 bg-[#0e1424] px-4 md:px-8 py-4 flex items-center justify-between sticky top-0 z-30 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-blue-600 flex items-center justify-center text-white">
            <span className="material-symbols-outlined text-[20px]">local_shipping</span>
          </div>
          <div>
            <h1 className="font-display-lg text-sm tracking-widest uppercase">VRIX Logis</h1>
            <p className="text-white/40 text-[9px] font-label-caps uppercase tracking-widest">
              {currentUser.role === "manager" ? "Control Console" : "Agent Workstation"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden sm:flex flex-col text-right">
            <span className="text-xs text-white/70 font-semibold">{currentUser.name}</span>
            <span className="text-[9px] text-white/30 uppercase tracking-widest font-label-caps">{currentUser.email}</span>
          </div>
          <button
            onClick={handleLogout}
            className="border border-white/10 hover:border-white/25 px-3 py-1.5 text-[9px] font-label-caps uppercase tracking-widest text-white/50 hover:text-white transition-colors cursor-pointer"
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
              <div className="bg-[#121a2e] border border-white/5 p-4 flex flex-col justify-between">
                <span className="text-white/40 font-label-caps text-[9px] uppercase tracking-widest">Total Shipments</span>
                <span className="text-xl font-bold mt-2">{orders.length}</span>
              </div>
              <div className="bg-[#121a2e] border border-white/5 p-4 flex flex-col justify-between">
                <span className="text-white/40 font-label-caps text-[9px] uppercase tracking-widest">Pending Route</span>
                <span className="text-xl font-bold text-amber-400 mt-2">
                  {orders.filter((o) => o.status !== "DELIVERED").length}
                </span>
              </div>
              <div className="bg-[#121a2e] border border-white/5 p-4 flex flex-col justify-between">
                <span className="text-white/40 font-label-caps text-[9px] uppercase tracking-widest">Completed</span>
                <span className="text-xl font-bold text-emerald-400 mt-2">
                  {orders.filter((o) => o.status === "DELIVERED").length}
                </span>
              </div>
              <div className="bg-[#121a2e] border border-white/5 p-4 flex flex-col justify-between">
                <span className="text-white/40 font-label-caps text-[9px] uppercase tracking-widest">Active Staff</span>
                <span className="text-xl font-bold text-purple-400 mt-2">{staff.length}</span>
              </div>
            </>
          ) : (
            <>
              <div className="bg-[#121a2e] border border-white/5 p-4 flex flex-col justify-between">
                <span className="text-white/40 font-label-caps text-[9px] uppercase tracking-widest">My Assignments</span>
                <span className="text-xl font-bold mt-2">
                  {orders.filter((o) => o.assignedAgent === currentUser.email && o.status !== "DELIVERED").length}
                </span>
              </div>
              <div className="bg-[#121a2e] border border-white/5 p-4 flex flex-col justify-between">
                <span className="text-white/40 font-label-caps text-[9px] uppercase tracking-widest">Completed Today</span>
                <span className="text-xl font-bold text-emerald-400 mt-2">
                  {orders.filter((o) => o.assignedAgent === currentUser.email && o.status === "DELIVERED").length}
                </span>
              </div>
              <div className="bg-[#121a2e] border border-white/5 p-4 flex flex-col justify-between">
                <span className="text-white/40 font-label-caps text-[9px] uppercase tracking-widest">Unassigned Pool</span>
                <span className="text-xl font-bold text-blue-400 mt-2">
                  {orders.filter((o) => !o.assignedAgent && o.status !== "DELIVERED").length}
                </span>
              </div>
              <div className="bg-[#121a2e] border border-white/5 p-4 flex flex-col justify-between">
                <span className="text-white/40 font-label-caps text-[9px] uppercase tracking-widest">Efficiency Rating</span>
                <span className="text-xl font-bold text-amber-400 mt-2">98.4%</span>
              </div>
            </>
          )}
        </div>

        {/* --- Role Switch tabs for Manager --- */}
        {currentUser.role === "manager" && (
          <div className="flex border-b border-white/5">
            <button
              onClick={() => setActiveTab("deliveries")}
              className={`px-6 py-3 font-label-caps text-xs uppercase tracking-widest border-b-2 cursor-pointer ${
                activeTab === "deliveries" ? "border-blue-500 text-blue-400 font-semibold" : "border-transparent text-white/50 hover:text-white"
              }`}
            >
              Shipments
            </button>
            <button
              onClick={() => setActiveTab("staff")}
              className={`px-6 py-3 font-label-caps text-xs uppercase tracking-widest border-b-2 cursor-pointer ${
                activeTab === "staff" ? "border-blue-500 text-blue-400 font-semibold" : "border-transparent text-white/50 hover:text-white"
              }`}
            >
              Delivery Staff
            </button>
          </div>
        )}

        {/* --- Search & Barcode Scans Header (Mobile optimised) --- */}
        {!(currentUser.role === "manager" && activeTab === "staff") && (
          <div className="flex gap-2">
            <div className="relative flex-1">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-white/30 text-[18px]">search</span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search order ID, address or customer..."
                className="w-full bg-[#121a2e] border border-white/5 text-white pl-10 pr-4 py-3 text-sm outline-none focus:border-blue-500 transition-all font-body-md placeholder-white/20"
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
              title="Barcode Scanner Mock"
              className="bg-blue-600 hover:bg-blue-700 border border-blue-500 px-4 flex items-center justify-center text-white cursor-pointer"
            >
              <span className="material-symbols-outlined text-[20px]">qr_code_scanner</span>
            </button>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════════════════
            AGENT VIEW
            ══════════════════════════════════════════════════════════════════════════════ */}
        {currentUser.role === "agent" && (
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            {/* Orders Panel */}
            <div className="lg:col-span-3 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-label-caps text-[10px] text-white/40 uppercase tracking-widest">Active Task Queue</h3>
                <button
                  onClick={() => loadDashboardData(currentUser.role, currentUser.email)}
                  className="text-blue-400 text-xs font-body-md hover:underline cursor-pointer flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-[14px]">refresh</span> Reload
                </button>
              </div>

              {loading ? (
                <div className="p-12 text-center text-white/30 font-label-caps text-xs tracking-widest animate-pulse">Loading orders...</div>
              ) : filteredOrders.length === 0 ? (
                <div className="bg-[#121a2e] border border-white/5 p-12 text-center text-white/30 flex flex-col items-center gap-2">
                  <span className="material-symbols-outlined text-4xl text-white/10">inventory_2</span>
                  <span className="font-label-caps text-xs uppercase tracking-widest">No shipments found</span>
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredOrders.map((order) => {
                    const isSelected = selectedOrder?.orderId === order.orderId;
                    const isAssignedToMe = order.assignedAgent === currentUser.email;
                    const isDelivered = order.status === "DELIVERED";

                    return (
                      <button
                        key={order.id}
                        onClick={() => handleSelectOrder(order)}
                        className={`w-full text-left p-4 border transition-all flex flex-col justify-between gap-3 rounded-none cursor-pointer ${
                          isDelivered
                            ? "border-white/5 opacity-55 hover:opacity-80"
                            : isSelected
                            ? "border-blue-500 bg-blue-900/10"
                            : "border-white/5 bg-[#121a2e] hover:border-white/15 hover:bg-[#16203a]"
                        }`}
                      >
                        <div className="flex justify-between items-start w-full">
                          <div className="space-y-1">
                            <span className="text-white font-semibold text-sm tracking-wide block font-body-md">
                              {order.orderId}
                            </span>
                            <span className="text-[10px] text-white/50 block font-body-md">
                              {order.customerName || "VRIX Customer"}
                            </span>
                          </div>
                          <span className={`text-[8px] font-label-caps uppercase tracking-widest px-2.5 py-0.5 border ${STATUS_COLORS[order.status]}`}>
                            {order.status}
                          </span>
                        </div>

                        <div className="text-[11px] text-white/40 space-y-1 font-body-md">
                          <p className="truncate">📍 {order.address || "No Address Provided"}</p>
                          <div className="flex justify-between text-[10px] text-white/30 pt-1">
                            <span>₹{order.amount?.toLocaleString()}</span>
                            <span>{new Date(order.createdAt).toLocaleDateString("en-IN")}</span>
                          </div>
                        </div>

                        {/* Extra indicators */}
                        <div className="flex justify-between items-center text-[9px] pt-1">
                          {isAssignedToMe ? (
                            <span className="text-blue-400 font-label-caps uppercase tracking-wider flex items-center gap-1 font-semibold">
                              <span className="material-symbols-outlined text-[12px]">assignment_turned_in</span> Assigned to Me
                            </span>
                          ) : (
                            <span className="text-amber-400/70 font-label-caps uppercase tracking-wider flex items-center gap-1">
                              <span className="material-symbols-outlined text-[12px]">group</span> Open Pool
                            </span>
                          )}

                          {isDelivered && (
                            <span className="text-emerald-400 font-label-caps uppercase tracking-wider flex items-center gap-1">
                              <span className="material-symbols-outlined text-[12px]">check_circle</span> Delivered
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* OTP Confirmation Panel (Mobile efficient side sheet) */}
            <div className="lg:col-span-2">
              <div className="bg-[#121a2e] border border-white/5 p-5 space-y-6 sticky top-24">
                {!selectedOrder ? (
                  <div className="text-center py-16 text-white/30 flex flex-col items-center gap-3">
                    <span className="material-symbols-outlined text-5xl text-white/10">touch_app</span>
                    <p className="font-label-caps text-xs uppercase tracking-widest">Select a shipment to begin delivery</p>
                  </div>
                ) : (
                  <>
                    <div className="flex justify-between items-start border-b border-white/5 pb-3">
                      <div>
                        <h3 className="text-white font-semibold font-body-md text-sm">{selectedOrder.orderId}</h3>
                        <p className="text-white/40 text-[10px] uppercase font-label-caps tracking-widest">Delivery Confirmation Card</p>
                      </div>
                      <button onClick={() => setSelectedOrder(null)} className="text-white/40 hover:text-white text-xs">✕</button>
                    </div>

                    {/* Order Details list */}
                    <div className="space-y-3 text-xs bg-white/5 border border-white/5 p-4 font-body-md">
                      <div className="flex justify-between">
                        <span className="text-white/40 uppercase tracking-widest text-[9px] font-label-caps">Customer</span>
                        <span className="text-white/80 font-semibold">{selectedOrder.customerName || "VRIX Customer"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-white/40 uppercase tracking-widest text-[9px] font-label-caps">Phone</span>
                        <span className="text-white/80">{selectedOrder.customerPhone || "Not provided"}</span>
                      </div>
                      <div className="flex flex-col gap-1 border-t border-white/5 pt-2 mt-2">
                        <span className="text-white/40 uppercase tracking-widest text-[9px] font-label-caps">Address</span>
                        <span className="text-white/70 text-[11px] leading-relaxed">{selectedOrder.address}, {selectedOrder.city}</span>
                      </div>
                      <div className="flex justify-between border-t border-white/5 pt-2 mt-2 font-semibold">
                        <span className="text-white/40 uppercase tracking-widest text-[9px] font-label-caps">Amount</span>
                        <span className="text-blue-400">₹{selectedOrder.amount?.toLocaleString()}</span>
                      </div>
                    </div>

                    {/* Mobile helper action buttons: Call & Navigate */}
                    {selectedOrder.status !== "DELIVERED" && (
                      <div className="grid grid-cols-2 gap-2">
                        <a
                          href={selectedOrder.customerPhone ? `tel:${selectedOrder.customerPhone}` : "#"}
                          className={`flex items-center justify-center gap-2 py-3 text-xs font-label-caps uppercase tracking-widest border transition-all ${
                            selectedOrder.customerPhone
                              ? "border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20 text-white"
                              : "border-white/5 bg-transparent text-white/20 cursor-not-allowed pointer-events-none"
                          }`}
                        >
                          <span className="material-symbols-outlined text-[16px]">call</span> Call Customer
                        </a>
                        <a
                          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                            `${selectedOrder.address || ""}, ${selectedOrder.city || ""}`
                          )}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-center gap-2 py-3 text-xs font-label-caps uppercase tracking-widest border border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20 text-white transition-all"
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
                        <h4 className="font-headline-md text-base text-emerald-400 uppercase">Order Delivered</h4>
                        <p className="text-white/40 text-xs font-body-md">This shipment was successfully validated and delivered.</p>
                      </div>
                    ) : (
                      <>
                        {/* OTP Flow UI */}
                        {confirmStep === "idle" && (
                          <div className="space-y-4">
                            <div className="flex flex-col gap-2">
                              <label className="font-label-caps text-[10px] text-white/55 uppercase tracking-widest">
                                Dispatch Delivery OTP to Email
                              </label>
                              <input
                                type="email"
                                value={customerEmailOverride}
                                onChange={(e) => setCustomerEmailOverride(e.target.value)}
                                placeholder="customer@email.com"
                                className="bg-white/5 border border-white/15 text-white text-xs px-3 py-2.5 outline-none focus:border-blue-500 font-body-md placeholder-white/20"
                              />
                            </div>
                            <button
                              onClick={handleTriggerDeliveryOtp}
                              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-button text-[11px] uppercase tracking-widest py-3.5 flex items-center justify-center gap-2 border border-blue-500 cursor-pointer"
                            >
                              <span className="material-symbols-outlined text-[16px]">send</span> Send Delivery OTP
                            </button>
                          </div>
                        )}

                        {confirmStep === "sending" && (
                          <div className="py-6 text-center text-white/55 font-label-caps text-xs tracking-widest flex items-center justify-center gap-2">
                            <span className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                            Requesting OTP...
                          </div>
                        )}

                        {confirmStep === "otp" && (
                          <form onSubmit={handleVerifyDelivery} className="space-y-5">
                            <div className="space-y-1">
                              <h4 className="text-white font-semibold text-xs font-body-md">Verify Delivery Code</h4>
                              <p className="text-white/45 text-[10px] font-body-md">
                                Enter the 6-digit verification code sent to <strong className="text-white/60">{customerEmailOverride}</strong>.
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
                                  className="w-10 h-12 text-center text-lg font-bold bg-white/5 border border-white/20 focus:border-blue-400 outline-none text-white rounded-none transition-all"
                                />
                              ))}
                            </div>

                            <div className="flex gap-2">
                              <button
                                type="submit"
                                disabled={actionLoading}
                                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-button text-[11px] uppercase tracking-widest py-3.5 flex items-center justify-center gap-2 cursor-pointer border border-emerald-500"
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
                                className="border border-white/10 hover:border-white/20 hover:bg-white/5 text-white/50 hover:text-white px-4 font-button text-[11px] uppercase tracking-widest cursor-pointer"
                              >
                                Back
                              </button>
                            </div>

                            <button
                              type="button"
                              onClick={handleTriggerDeliveryOtp}
                              className="w-full text-center text-[9px] text-white/30 hover:text-white/60 font-body-md underline cursor-pointer"
                            >
                              Resend delivery code
                            </button>
                          </form>
                        )}

                        {confirmStep === "success" && (
                          <div className="text-center py-6 space-y-4">
                            <div className="w-12 h-12 bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center mx-auto rounded-full">
                              <span className="material-symbols-outlined text-emerald-400 text-2xl animate-bounce">check_circle</span>
                            </div>
                            <h4 className="font-headline-md text-base text-emerald-400 uppercase">Package Delivered</h4>
                            <p className="text-white/40 text-xs font-body-md">The shipment has been successfully marked as DELIVERED.</p>
                            <button
                              onClick={() => setSelectedOrder(null)}
                              className="border border-white/10 hover:border-white/20 px-6 py-2.5 font-button text-[10px] uppercase tracking-widest text-white/60 hover:text-white cursor-pointer w-full mt-2"
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

        {/* ══════════════════════════════════════════════════════════════════════════════
            MANAGER VIEW
            ══════════════════════════════════════════════════════════════════════════════ */}
        {currentUser.role === "manager" && activeTab === "deliveries" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-label-caps text-[10px] text-white/40 uppercase tracking-widest">Active Shipment Log ({filteredOrders.length})</h3>
              <button
                onClick={() => loadDashboardData(currentUser.role, currentUser.email)}
                className="text-blue-400 text-xs font-body-md hover:underline cursor-pointer flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-[14px]">refresh</span> Reload Log
              </button>
            </div>

            {loading ? (
              <div className="p-12 text-center text-white/30 font-label-caps text-xs tracking-widest animate-pulse">Loading orders...</div>
            ) : filteredOrders.length === 0 ? (
              <div className="bg-[#121a2e] border border-white/5 p-12 text-center text-white/30 flex flex-col items-center gap-2">
                <span className="material-symbols-outlined text-4xl text-white/10">inventory_2</span>
                <span className="font-label-caps text-xs uppercase tracking-widest">No shipments recorded</span>
              </div>
            ) : (
              /* Mobile-optimized shipment card list for Manager */
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredOrders.map((order) => {
                  const isDelivered = order.status === "DELIVERED";
                  return (
                    <div
                      key={order.id}
                      className="bg-[#121a2e] border border-white/5 p-5 space-y-4 flex flex-col justify-between"
                    >
                      <div className="space-y-2">
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="text-white font-semibold text-sm block font-body-md">{order.orderId}</span>
                            <span className="text-white/40 text-[10px] font-body-md">
                              {new Date(order.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                            </span>
                          </div>
                          <span className={`text-[8px] font-label-caps uppercase tracking-widest px-2.5 py-0.5 border ${STATUS_COLORS[order.status]}`}>
                            {order.status}
                          </span>
                        </div>

                        <div className="text-xs space-y-1 pt-1 border-t border-white/5 font-body-md">
                          <p className="text-white/80 font-medium">👤 {order.customerName || "VRIX Customer"}</p>
                          <p className="text-white/60 truncate">📍 {order.address}, {order.city}</p>
                          <p className="text-white/40 text-[10px]">📞 {order.customerPhone || "No contact info"}</p>
                        </div>
                      </div>

                      <div className="space-y-3 pt-3 border-t border-white/5">
                        <div className="flex flex-col gap-1.5">
                          <label className="font-label-caps text-[9px] text-white/40 uppercase tracking-widest">Assigned Delivery Agent</label>
                          <select
                            value={order.assignedAgent || "unassigned"}
                            disabled={isDelivered || actionLoading}
                            onChange={(e) => handleAssignAgent(order.orderId, e.target.value)}
                            className="bg-[#0b0f19] border border-white/10 text-white/80 text-xs px-3 py-2 outline-none focus:border-blue-500 font-body-md bg-transparent rounded-none disabled:opacity-50"
                          >
                            <option value="unassigned" className="bg-[#0e1424]">Unassigned (Pool)</option>
                            {staff
                              .filter((s) => s.role === "agent")
                              .map((agent) => (
                                <option key={agent.email} value={agent.email} className="bg-[#0e1424]">
                                  {agent.name} ({agent.email})
                                </option>
                              ))}
                          </select>
                        </div>

                        {isDelivered && (
                          <div className="flex items-center gap-1.5 text-emerald-400 text-[10px] font-label-caps uppercase tracking-widest font-semibold pt-1">
                            <span className="material-symbols-outlined text-[14px]">check_circle</span> Delivered
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
              <h3 className="font-label-caps text-[10px] text-white/40 uppercase tracking-widest">Logistics Staff ({staff.length})</h3>
              <button
                onClick={() => setShowAddStaffModal(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white font-button text-[10px] uppercase tracking-widest px-4 py-2 border border-blue-500 flex items-center gap-1.5 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[14px]">person_add</span> Register Agent
              </button>
            </div>

            {/* Slide Down Add Staff form inside modal overlay */}
            {showAddStaffModal && (
              <div className="fixed inset-0 bg-[#05070a]/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                <div className="bg-[#0e1424] border border-white/10 p-6 max-w-md w-full space-y-5 animate-slide-down">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="text-white font-semibold font-body-md text-base">Add Logistics Staff</h4>
                      <p className="text-white/40 text-[10px] font-body-md">Register new delivery staff email credentials.</p>
                    </div>
                    <button onClick={() => setShowAddStaffModal(false)} className="text-white/40 hover:text-white">✕</button>
                  </div>

                  <form onSubmit={handleAddStaffMember} className="space-y-4 font-body-md">
                    <div className="flex flex-col gap-1.5">
                      <label className="font-label-caps text-[9px] text-white/50 uppercase tracking-widest">Full Name</label>
                      <input
                        type="text"
                        value={newStaffName}
                        onChange={(e) => setNewStaffName(e.target.value)}
                        placeholder="John Doe"
                        required
                        className="bg-[#121a2e] border border-white/15 text-white text-xs px-3 py-2.5 outline-none focus:border-blue-500"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="font-label-caps text-[9px] text-white/50 uppercase tracking-widest">Email Address</label>
                      <input
                        type="email"
                        value={newStaffEmail}
                        onChange={(e) => setNewStaffEmail(e.target.value)}
                        placeholder="agent@vrix.com"
                        required
                        className="bg-[#121a2e] border border-white/15 text-white text-xs px-3 py-2.5 outline-none focus:border-blue-500"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="font-label-caps text-[9px] text-white/50 uppercase tracking-widest">Portal Role</label>
                      <select
                        value={newStaffRole}
                        onChange={(e) => setNewStaffRole(e.target.value as any)}
                        className="bg-[#121a2e] border border-white/15 text-white text-xs px-3 py-2.5 outline-none focus:border-blue-500 bg-transparent rounded-none"
                      >
                        <option value="agent" className="bg-[#0e1424]">Delivery Agent</option>
                        <option value="manager" className="bg-[#0e1424]">Portal Manager</option>
                      </select>
                    </div>

                    <div className="flex gap-2 pt-2">
                      <button
                        type="submit"
                        disabled={actionLoading}
                        className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-button text-[11px] uppercase tracking-widest py-3 border border-blue-500 cursor-pointer"
                      >
                        {actionLoading ? "Saving..." : "Register Staff"}
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowAddStaffModal(false)}
                        className="border border-white/10 hover:border-white/20 text-white/50 hover:text-white px-4 font-button text-[11px] uppercase tracking-widest cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {loading ? (
              <div className="p-12 text-center text-white/30 font-label-caps text-xs tracking-widest animate-pulse">Loading staff directory...</div>
            ) : (
              /* Mobile-optimized staff list cards */
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {staff.map((s) => (
                  <div
                    key={s.email}
                    className="bg-[#121a2e] border border-white/5 p-4 flex justify-between items-center"
                  >
                    <div className="space-y-1">
                      <h4 className="text-white font-semibold text-sm font-body-md">{s.name}</h4>
                      <p className="text-white/40 text-[10px] font-body-md">{s.email}</p>
                      <span className={`inline-block text-[8px] font-label-caps uppercase tracking-widest px-2 py-0.5 border rounded-full mt-1 ${
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
                        className="text-rose-400 hover:text-rose-300 font-label-caps text-[10px] uppercase tracking-widest transition-colors cursor-pointer"
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
