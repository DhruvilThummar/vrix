"use client";

import React, { useState, useEffect, useRef } from "react";
import { fetchDeliveryOrders, sendDeliveryOtp, verifyDeliveryOtp } from "@/utils/api";

type DeliveryStatus = "CREATED" | "SUCCESS" | "DELIVERED" | "FAILED";

interface DeliveryOrder {
  id: string;
  orderId: string;
  amount: number;
  currency: string;
  status: DeliveryStatus;
  paymentId?: string;
  createdAt: string;
}

const STATUS_COLORS: Record<DeliveryStatus, string> = {
  CREATED: "bg-amber-50 text-amber-700 border-amber-200",
  SUCCESS: "bg-blue-50 text-blue-700 border-blue-200",
  DELIVERED: "bg-green-50 text-green-700 border-green-200",
  FAILED: "bg-red-50 text-red-700 border-red-200",
};

export default function DeliveryPanelPage() {
  const [orders, setOrders] = useState<DeliveryOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<DeliveryOrder | null>(null);
  const [customerEmail, setCustomerEmail] = useState("");
  const [otpInput, setOtpInput] = useState(["", "", "", "", "", ""]);
  const [step, setStep] = useState<"select" | "send-otp" | "enter-otp" | "success">("select");
  const [actionLoading, setActionLoading] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);
  const [search, setSearch] = useState("");
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => { loadOrders(); }, []);

  const loadOrders = async () => {
    setLoading(true);
    try {
      const data = await fetchDeliveryOrders();
      setOrders(data);
    } catch {
      showToast("Failed to load orders.", "error");
    } finally {
      setLoading(false);
    }
  };

  const showToast = (msg: string, type: "success" | "error" = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  const handleSelectOrder = (order: DeliveryOrder) => {
    if (order.status === "DELIVERED") {
      showToast("This order has already been delivered.", "error");
      return;
    }
    setSelectedOrder(order);
    setCustomerEmail("");
    setOtpInput(["", "", "", "", "", ""]);
    setStep("send-otp");
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder || !customerEmail) return;
    setActionLoading(true);
    try {
      const res = await sendDeliveryOtp(selectedOrder.orderId, customerEmail);
      showToast(res.message || "OTP sent to customer.");
      if (res.otp) showToast(`[DEV MODE] OTP: ${res.otp}`, "success");
      setStep("enter-otp");
    } catch (err: any) {
      showToast(err.message || "Failed to send OTP.", "error");
    } finally {
      setActionLoading(false);
    }
  };

  const handleOtpChange = (idx: number, val: string) => {
    if (!/^\d?$/.test(val)) return;
    const next = [...otpInput];
    next[idx] = val;
    setOtpInput(next);
    if (val && idx < 5) otpRefs.current[idx + 1]?.focus();
  };

  const handleOtpKeyDown = (idx: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otpInput[idx] && idx > 0) {
      otpRefs.current[idx - 1]?.focus();
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder) return;
    const code = otpInput.join("");
    if (code.length < 6) { showToast("Enter the full 6-digit code.", "error"); return; }
    setActionLoading(true);
    try {
      await verifyDeliveryOtp(selectedOrder.orderId, code);
      setStep("success");
      setOrders((prev) =>
        prev.map((o) => o.orderId === selectedOrder.orderId ? { ...o, status: "DELIVERED" } : o)
      );
      showToast("Delivery confirmed successfully!", "success");
    } catch (err: any) {
      showToast(err.message || "Invalid OTP.", "error");
    } finally {
      setActionLoading(false);
    }
  };

  const resetPanel = () => {
    setSelectedOrder(null);
    setStep("select");
    setOtpInput(["", "", "", "", "", ""]);
    setCustomerEmail("");
  };

  const filtered = orders.filter((o) =>
    o.orderId?.toLowerCase().includes(search.toLowerCase()) ||
    o.status?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="w-full min-h-screen bg-[#0f1728]">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-6 right-6 z-50 px-6 py-4 border shadow-2xl flex items-center gap-3 animate-fade-in text-sm font-body-md ${
          toast.type === "success" ? "bg-deep-navy text-pure-white border-slate-grey/30" : "bg-red-900 text-white border-red-700"
        }`}>
          <span className="material-symbols-outlined text-[16px]">{toast.type === "success" ? "check_circle" : "error"}</span>
          {toast.msg}
        </div>
      )}

      {/* Header Bar */}
      <header className="border-b border-white/10 px-6 md:px-12 py-5 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <span className="material-symbols-outlined text-white/60 text-[20px]">local_shipping</span>
          <div>
            <h1 className="text-white font-display-lg text-lg uppercase tracking-widest">VRIX Delivery Portal</h1>
            <p className="text-white/40 text-[11px] font-label-caps uppercase tracking-widest">Agent Dashboard</p>
          </div>
        </div>
        <button onClick={loadOrders} className="flex items-center gap-2 text-white/50 hover:text-white text-[11px] font-label-caps uppercase tracking-widest transition-colors cursor-pointer">
          <span className="material-symbols-outlined text-[16px]">refresh</span>
          Refresh
        </button>
      </header>

      <div className="max-w-6xl mx-auto px-4 md:px-8 py-8 grid grid-cols-1 lg:grid-cols-5 gap-6">

        {/* Orders List */}
        <div className="lg:col-span-3 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-white/70 font-label-caps text-[11px] uppercase tracking-widest">Active Orders ({filtered.length})</h2>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-2 top-1/2 -translate-y-1/2 text-white/30 text-[14px]">search</span>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search order ID..."
                className="bg-white/5 border border-white/10 text-white text-xs pl-7 pr-3 py-2 outline-none focus:border-white/30 font-body-md placeholder-white/30 w-48"
              />
            </div>
          </div>

          {loading ? (
            <div className="h-48 flex items-center justify-center text-white/30 text-xs font-label-caps uppercase tracking-widest">Loading orders...</div>
          ) : filtered.length === 0 ? (
            <div className="h-48 flex flex-col items-center justify-center gap-3 text-white/30">
              <span className="material-symbols-outlined text-4xl">inventory_2</span>
              <p className="text-xs font-label-caps uppercase tracking-widest">No active orders found</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filtered.map((order) => {
                const isSelected = selectedOrder?.orderId === order.orderId;
                const isDelivered = order.status === "DELIVERED";
                return (
                  <button
                    key={order.id}
                    onClick={() => handleSelectOrder(order)}
                    disabled={isDelivered}
                    className={`w-full text-left p-5 border transition-all cursor-pointer ${
                      isDelivered
                        ? "border-white/5 opacity-50 cursor-not-allowed"
                        : isSelected
                        ? "border-blue-400/50 bg-blue-900/20"
                        : "border-white/10 bg-white/5 hover:border-white/25 hover:bg-white/10"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-white font-semibold text-sm font-body-md tracking-wide">
                        {order.orderId}
                      </span>
                      <span className={`text-[9px] font-label-caps uppercase tracking-widest px-2 py-1 border rounded-full ${STATUS_COLORS[order.status]}`}>
                        {order.status}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-white/40 text-[11px] font-body-md">
                      <span>{order.currency} {order.amount?.toLocaleString()}</span>
                      <span>{new Date(order.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</span>
                    </div>
                    {isDelivered && (
                      <div className="flex items-center gap-1 mt-2 text-green-400 text-[10px] font-label-caps uppercase tracking-widest">
                        <span className="material-symbols-outlined text-[13px]">check_circle</span>
                        Delivered
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* OTP Action Panel */}
        <div className="lg:col-span-2">
          <div className="bg-white/5 border border-white/10 p-6 space-y-6 sticky top-8">
            {step === "select" && (
              <div className="text-center py-12 space-y-4">
                <span className="material-symbols-outlined text-white/20 text-5xl">touch_app</span>
                <p className="text-white/40 text-xs font-label-caps uppercase tracking-widest">Select an order to begin delivery</p>
              </div>
            )}

            {step === "send-otp" && selectedOrder && (
              <>
                <div>
                  <h3 className="text-white font-label-caps text-[11px] uppercase tracking-widest mb-1">Delivery Confirmation</h3>
                  <p className="text-white/40 text-[11px] font-body-md">Enter the customer's email to send them a delivery OTP.</p>
                </div>

                {/* Order Info Card */}
                <div className="bg-white/5 border border-white/10 p-4 space-y-2">
                  <div className="flex justify-between text-[11px]">
                    <span className="text-white/40 font-label-caps uppercase tracking-widest">Order ID</span>
                    <span className="text-white font-semibold font-body-md">{selectedOrder.orderId}</span>
                  </div>
                  <div className="flex justify-between text-[11px]">
                    <span className="text-white/40 font-label-caps uppercase tracking-widest">Amount</span>
                    <span className="text-white font-body-md">{selectedOrder.currency} {selectedOrder.amount?.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-[11px]">
                    <span className="text-white/40 font-label-caps uppercase tracking-widest">Status</span>
                    <span className={`font-label-caps text-[9px] uppercase tracking-widest px-2 py-0.5 border rounded-full ${STATUS_COLORS[selectedOrder.status]}`}>{selectedOrder.status}</span>
                  </div>
                </div>

                <form onSubmit={handleSendOtp} className="space-y-4">
                  <div className="flex flex-col gap-2">
                    <label className="font-label-caps text-[10px] text-white/50 uppercase tracking-widest">Customer Email</label>
                    <input
                      type="email"
                      value={customerEmail}
                      onChange={(e) => setCustomerEmail(e.target.value)}
                      placeholder="customer@email.com"
                      required
                      className="bg-white/5 border border-white/15 text-white text-sm px-3 py-2.5 outline-none focus:border-white/40 font-body-md placeholder-white/25"
                    />
                  </div>
                  <div className="flex gap-3">
                    <button type="submit" disabled={actionLoading} className="flex-1 font-button text-[11px] uppercase py-3 bg-blue-600 text-white hover:bg-blue-700 transition-colors cursor-pointer flex items-center justify-center gap-2">
                      {actionLoading ? <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <><span className="material-symbols-outlined text-[14px]">send</span>Send OTP</>}
                    </button>
                    <button type="button" onClick={resetPanel} className="px-4 font-button text-[11px] uppercase border border-white/20 text-white/50 hover:text-white hover:border-white/40 transition-colors cursor-pointer">✕</button>
                  </div>
                </form>
              </>
            )}

            {step === "enter-otp" && selectedOrder && (
              <>
                <div>
                  <h3 className="text-white font-label-caps text-[11px] uppercase tracking-widest mb-1">Enter Customer OTP</h3>
                  <p className="text-white/40 text-[11px] font-body-md">Ask the customer to read out the 6-digit code sent to <strong className="text-white/60">{customerEmail}</strong>.</p>
                </div>

                <form onSubmit={handleVerifyOtp} className="space-y-6">
                  <div className="flex gap-2 justify-between">
                    {otpInput.map((digit, i) => (
                      <input
                        key={i}
                        ref={(el) => { otpRefs.current[i] = el; }}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleOtpChange(i, e.target.value)}
                        onKeyDown={(e) => handleOtpKeyDown(i, e)}
                        className="w-10 h-12 text-center text-lg font-semibold bg-white/5 border border-white/20 focus:border-blue-400 outline-none text-white transition-colors"
                      />
                    ))}
                  </div>
                  <div className="flex gap-3">
                    <button type="submit" disabled={actionLoading} className="flex-1 font-button text-[11px] uppercase py-3 bg-green-600 text-white hover:bg-green-700 transition-colors cursor-pointer flex items-center justify-center gap-2">
                      {actionLoading ? <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <><span className="material-symbols-outlined text-[14px]">verified</span>Confirm Delivery</>}
                    </button>
                    <button type="button" onClick={() => setStep("send-otp")} className="px-4 font-button text-[11px] uppercase border border-white/20 text-white/50 hover:text-white transition-colors cursor-pointer">Back</button>
                  </div>
                  <button type="button" onClick={handleSendOtp as any} className="w-full text-center text-[10px] text-white/30 hover:text-white/60 font-body-md underline transition-colors cursor-pointer">Resend OTP</button>
                </form>
              </>
            )}

            {step === "success" && selectedOrder && (
              <div className="text-center py-8 space-y-6">
                <div className="w-16 h-16 bg-green-600/20 border border-green-500/30 flex items-center justify-center mx-auto">
                  <span className="material-symbols-outlined text-green-400 text-4xl">task_alt</span>
                </div>
                <div className="space-y-2">
                  <h3 className="text-white font-headline-md text-xl uppercase">Delivered!</h3>
                  <p className="text-white/50 text-xs font-body-md">Order <strong className="text-white/80">{selectedOrder.orderId}</strong> has been successfully marked as delivered.</p>
                </div>
                <button onClick={resetPanel} className="w-full font-button text-[11px] uppercase py-3 border border-white/20 text-white/60 hover:text-white hover:border-white/40 transition-colors cursor-pointer">
                  Back to Orders
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
