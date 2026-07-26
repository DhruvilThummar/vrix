"use client";

import React, { useState, useRef, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  registerUser,
  confirmRegistration,
  loginUser,
  confirmLogin,
  loginUserDirect,
  loginWithGoogle,
  addSecurityLog,
  fetchProducts,
  fetchDbPublic as fetchDb,
  verifyTruecaller,
  getApiBaseUrl,
  fetchUserOrders
} from "@/utils/api";

interface Order {
  id: string;
  date: string;
  amount: string;
  status: "Processing" | "Delivered" | "Shipped";
}

interface WishlistItem {
  id: string;
  title: string;
  price: number;
  image: string;
  material: string;
}

interface ShippingAddress {
  street: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  phone: string;
  useSamePhone: boolean;
}

type AuthStep = "email" | "otp" | "verified";
type AuthMode = "signin" | "signup";

export default function UserAccountPage() {
  const router = useRouter();
  const { user, isLoggedIn, login, logout } = useAuth();

  // ── Auth State ──────────────────────────────────────────────────────────────
  const [authMode, setAuthMode] = useState<AuthMode>("signin");
  const [authStep, setAuthStep] = useState<AuthStep>(isLoggedIn ? "verified" : "email");
  const [authEmail, setAuthEmail] = useState(user?.email || "");
  const [authPassword, setAuthPassword] = useState("");
  const [authName, setAuthName] = useState("");
  const [authPhone, setAuthPhone] = useState("");
  
  const [otpInput, setOtpInput] = useState(["", "", "", "", "", ""]);
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  // ── Truecaller Config & Simulation State ─────────────────────────────────────
  const [truecallerEnabled, setTruecallerEnabled] = useState(false);
  const [truecallerSandbox, setTruecallerSandbox] = useState(true);
  const [showTruecallerModal, setShowTruecallerModal] = useState(false);
  const [simName, setSimName] = useState("Dhruv Agent");
  const [simPhone, setSimPhone] = useState("+919876543210");
  const [simEmail, setSimEmail] = useState("dhruv@vrix.com");

  // ── Account State ───────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState("dashboard");
  const getFirstName = (name?: string, email?: string) => {
    if (name && name.trim()) return name.trim().split(" ")[0];
    if (email) {
      const prefix = email.split("@")[0];
      return prefix.charAt(0).toUpperCase() + prefix.slice(1);
    }
    return "";
  };

  const getLastName = (name?: string) => {
    if (name && name.trim()) return name.trim().split(" ").slice(1).join(" ");
    return "";
  };

  const [profile, setProfile] = useState({ 
    firstName: getFirstName(user?.name, user?.email), 
    lastName: getLastName(user?.name), 
    email: user?.email || "", 
    phone: user?.phone || "" 
  });
  const [shippingAddress, setShippingAddress] = useState<ShippingAddress>({
    street: "",
    city: "",
    state: "",
    zip: "",
    country: "",
    phone: "",
    useSamePhone: true,
  });
  const [isEditingAddress, setIsEditingAddress] = useState(false);
  const [wishlist, setWishlist] = useState<WishlistItem[]>([]);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Sync Truecaller API settings
  useEffect(() => {
    fetchDb()
      .then((res) => {
        if (res.api_settings) {
          setTruecallerEnabled(!!res.api_settings.truecallerEnabled);
          setTruecallerSandbox(!!res.api_settings.truecallerSandboxMode);
        }
      })
      .catch((err) => console.error("Failed to load API settings for Truecaller:", err));
  }, []);

  // Sync user profile state
  useEffect(() => {
    if (isLoggedIn && user) {
      setAuthStep("verified");
      setAuthEmail(user.email);
      setProfile({
        firstName: getFirstName(user.name, user.email),
        lastName: getLastName(user.name),
        email: user.email,
        phone: user.phone || ""
      });
    } else {
      setAuthStep("email");
      setAuthEmail("");
    }
  }, [isLoggedIn, user]);

  // Sync wishlist from localStorage on tab change or mount
  useEffect(() => {
    async function loadWishlist() {
      try {
        const savedIds = localStorage.getItem("vrix-wishlist");
        const ids = savedIds ? JSON.parse(savedIds) : [];
        if (ids.length > 0) {
          const allProducts = await fetchProducts();
          const filtered = allProducts.filter((p: any) => ids.includes(p.id));
          setWishlist(filtered);
        } else {
          setWishlist([]);
        }
      } catch (err) {
        console.error("Failed to load wishlist:", err);
      }
    }
    if (activeTab === "wishlist" || activeTab === "dashboard") {
      loadWishlist();
    }
  }, [activeTab]);

  const [userOrders, setUserOrders] = useState<any[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);

  useEffect(() => {
    async function loadOrders() {
      if (!user?.email) return;
      setOrdersLoading(true);
      try {
        const data = await fetchUserOrders(user.email);
        if (Array.isArray(data)) {
          setUserOrders(data);
        }
      } catch (err) {
        console.error("Failed to load user orders:", err);
      } finally {
        setOrdersLoading(false);
      }
    }
    if (isLoggedIn && user?.email) {
      loadOrders();
    }
  }, [isLoggedIn, user?.email]);

  // Load saved address from localStorage or latest order
  useEffect(() => {
    if (!user?.email) return;
    try {
      const saved = localStorage.getItem(`vrix_address_${user.email}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        setShippingAddress({
          street: parsed.street || "",
          city: parsed.city || "",
          state: parsed.state || "",
          zip: parsed.zip || "",
          country: parsed.country || "",
          phone: parsed.phone || "",
          useSamePhone: parsed.useSamePhone !== undefined ? parsed.useSamePhone : true,
        });
      } else if (userOrders.length > 0) {
        const latest = userOrders[0];
        if (latest.address) {
          setShippingAddress({
            street: latest.address || "",
            city: latest.city || "",
            state: "",
            zip: latest.postalCode || "",
            country: "India",
            phone: user.phone || "",
            useSamePhone: true,
          });
        }
      }
    } catch (e) {
      console.error("Error loading address:", e);
    }
  }, [user?.email, userOrders]);

  const totalSpent = userOrders.reduce((sum, o) => sum + (Number(o.amount) || 0), 0);
  const rewardPoints = Math.floor(totalSpent * 0.1);
  const memberTier = user?.isVrixPlusMember ? "VRIX+ Member" : (userOrders.length > 3 ? "Platinum Member" : (userOrders.length > 0 ? "Gold Member" : "Standard Member"));

  // ── Helpers ─────────────────────────────────────────────────────────────────
  const triggerFeedback = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(null), 3500);
  };

  const handleAccountLogout = () => {
    logout();
    setAuthStep("email");
    setAuthEmail("");
    setOtpInput(["", "", "", "", "", ""]);
    setActiveTab("dashboard");
    router.replace("/account");
  };

  // ── Auth Handlers ──────────────────────────────────────────────────────────
  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = authEmail.trim().toLowerCase();
    const cleanName = authName.trim();
    const cleanPhone = authPhone.trim();

    if (!cleanEmail || !authPassword) {
      setAuthError("Email and password are required.");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      setAuthError("Please enter a valid email address.");
      return;
    }

    if (authPassword.length < 6) {
      setAuthError("Password must be at least 6 characters long.");
      return;
    }

    setAuthLoading(true);
    setAuthError(null);
    try {
      if (authMode === "signup") {
        if (!cleanName) { setAuthError("Full name is required for registration."); setAuthLoading(false); return; }
        const res = await registerUser({ email: cleanEmail, password: authPassword, name: cleanName, phone: cleanPhone });
        if (res.otp) {
          const digits = String(res.otp).split("").slice(0, 6);
          if (digits.length === 6) setOtpInput(digits);
          triggerFeedback(`Verification code generated! (Dev code: ${res.otp})`);
        } else {
          triggerFeedback("Verification code sent to your email!");
        }
        setAuthStep("otp");
      } else {
        const res = await loginUserDirect({ email: cleanEmail, password: authPassword });
        login(cleanEmail, { name: res.user.name, phone: res.user.phone, isVrixPlusMember: res.user.isVrixPlusMember });
        triggerFeedback("Welcome back!");
        setAuthStep("verified");
      }
    } catch (err: any) {
      setAuthError(err.message || "Authentication request failed. Please try again.");
    } finally {
      setAuthLoading(false);
    }
  };

  const handleResendOtp = async () => {
    const cleanEmail = authEmail.trim().toLowerCase();
    const cleanName = authName.trim();
    const cleanPhone = authPhone.trim();
    setAuthLoading(true);
    setAuthError(null);
    try {
      const res = await registerUser({ email: cleanEmail, password: authPassword, name: cleanName, phone: cleanPhone });
      if (res.otp) {
        const digits = String(res.otp).split("").slice(0, 6);
        if (digits.length === 6) setOtpInput(digits);
        triggerFeedback(`Code resent! (Dev code: ${res.otp})`);
      } else {
        triggerFeedback("A new verification code has been sent to your email.");
      }
    } catch (err: any) {
      setAuthError(err.message || "Failed to resend code.");
    } finally {
      setAuthLoading(false);
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
    const code = otpInput.join("");
    if (code.length < 6) { setAuthError("Please enter the complete 6-digit code."); return; }
    setAuthLoading(true);
    setAuthError(null);
    try {
      const cleanEmail = authEmail.trim().toLowerCase();
      if (authMode === "signup") {
        const res = await confirmRegistration({
          email: cleanEmail,
          otp: code,
          password: authPassword,
          name: authName.trim(),
          phone: authPhone.trim()
        });
        login(cleanEmail, { name: res.user.name, phone: res.user.phone, isVrixPlusMember: res.user.isVrixPlusMember });
        triggerFeedback("Account verified! Welcome to VRIX.");
      } else {
        const res = await confirmLogin({
          email: cleanEmail,
          otp: code
        });
        login(cleanEmail, { name: res.user.name, phone: res.user.phone, isVrixPlusMember: res.user.isVrixPlusMember });
        triggerFeedback("Welcome back!");
      }
      setAuthStep("verified");
    } catch (err: any) {
      setAuthError(err.message || "Invalid or expired verification code.");
    } finally {
      setAuthLoading(false);
    }
  };

  // ── Truecaller Verification Handlers ────────────────────────────────────────
  const handleTruecallerVerification = async () => {
    if (truecallerSandbox) {
      setShowTruecallerModal(true);
    } else {
      alert("Live Truecaller verification requires HTTPS. Please toggle Sandbox Mode in the Admin panel to test locally.");
    }
  };

  const handleTruecallerAutofillConfirm = async () => {
    setAuthLoading(true);
    setAuthError(null);
    try {
      const rawPayload = {
        firstName: simName.split(" ")[0] || "",
        lastName: simName.split(" ").slice(1).join(" ") || "",
        email: simEmail,
        phoneNumber: simPhone,
        verifier: "mock-verifier-check"
      };
      const base64Payload = btoa(JSON.stringify(rawPayload));
      
      const res = await verifyTruecaller(base64Payload, "mock-signature", "RSA-SHA512");
      
      if (res.success && res.profile) {
        login(res.profile.email, { name: res.profile.name, phone: res.profile.phone });
        setProfile({
          firstName: res.profile.name.split(" ")[0],
          lastName: res.profile.name.split(" ").slice(1).join(" ") || "",
          email: res.profile.email,
          phone: res.profile.phone
        });
        setAuthStep("verified");
        triggerFeedback("⚡ Successfully signed in via Truecaller!");
      } else {
        setAuthError("Truecaller verification failed.");
      }
    } catch (err: any) {
      setAuthError("Verification failed: " + err.message);
    } finally {
      setAuthLoading(false);
      setShowTruecallerModal(false);
    }
  };

  const menuItems = [
    { key: "dashboard", label: "Dashboard", icon: "dashboard" },
    { key: "orders", label: "Orders", icon: "shopping_bag" },
    { key: "wishlist", label: "Wishlist", icon: "favorite" },
    { key: "addresses", label: "Addresses", icon: "location_on" },
    { key: "account", label: "Account Details", icon: "person" },
    { key: "vrix_plus", label: "VRIX+ Club", icon: "stars" },
    { key: "logout", label: "Logout", icon: "logout" },
  ];

  // ── Auth Gate ────────────────────────────────────────────────────────────
  if (authStep !== "verified") {
    return (
      <div className="w-full min-h-screen bg-soft-linen/30 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md bg-pure-white border border-slate-grey/20 shadow-lg p-10 space-y-8 relative">
          {/* Logo / Brand */}
          <div className="text-center space-y-1">
            <p className="font-label-caps text-[10px] tracking-widest text-slate-grey uppercase">Member Access</p>
            <h1 className="font-display-lg text-2xl text-deep-navy uppercase tracking-widest">VRIX</h1>
          </div>

          {authStep === "email" ? (
            <div className="space-y-6">
              {/* Tabs for Sign In vs Register */}
              <div className="flex border-b border-slate-grey/25 pb-2 justify-center gap-6 text-sm font-label-caps tracking-widest">
                <button 
                  onClick={() => { setAuthMode("signin"); setAuthError(null); }}
                  className={`pb-1 cursor-pointer transition-colors ${authMode === "signin" ? "border-b-2 border-deep-navy text-deep-navy font-semibold" : "text-slate-grey hover:text-ink-black"}`}
                >
                  SIGN IN
                </button>
                <button 
                  onClick={() => { setAuthMode("signup"); setAuthError(null); }}
                  className={`pb-1 cursor-pointer transition-colors ${authMode === "signup" ? "border-b-2 border-deep-navy text-deep-navy font-semibold" : "text-slate-grey hover:text-ink-black"}`}
                >
                  CREATE ACCOUNT
                </button>
              </div>

              <form onSubmit={handleAuthSubmit} className="space-y-5">
                {authMode === "signup" && (
                  <div className="space-y-1">
                    <label className="font-label-caps text-[9px] text-slate-grey uppercase tracking-widest block">Full Name</label>
                    <input
                      type="text"
                      value={authName}
                      onChange={(e) => setAuthName(e.target.value)}
                      placeholder="Your name"
                      required
                      className="w-full border-b border-slate-grey/30 py-2 focus:border-deep-navy outline-none font-body-md text-ink-black text-sm bg-transparent"
                    />
                  </div>
                )}

                <div className="space-y-1">
                  <label className="font-label-caps text-[9px] text-slate-grey uppercase tracking-widest block">Email Address (ID)</label>
                  <input
                    type="email"
                    value={authEmail}
                    onChange={(e) => setAuthEmail(e.target.value)}
                    placeholder="your@email.com"
                    required
                    className="w-full border-b border-slate-grey/30 py-2 focus:border-deep-navy outline-none font-body-md text-ink-black text-sm bg-transparent"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-label-caps text-[9px] text-slate-grey uppercase tracking-widest block">Password</label>
                  <input
                    type="password"
                    value={authPassword}
                    onChange={(e) => setAuthPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="w-full border-b border-slate-grey/30 py-2 focus:border-deep-navy outline-none font-body-md text-ink-black text-sm bg-transparent"
                  />
                </div>

                {authMode === "signup" && (
                  <div className="space-y-1">
                    <label className="font-label-caps text-[9px] text-slate-grey uppercase tracking-widest block">Phone Number (Optional)</label>
                    <input
                      type="tel"
                      value={authPhone}
                      onChange={(e) => setAuthPhone(e.target.value)}
                      placeholder="+91 98765 43210"
                      className="w-full border-b border-slate-grey/30 py-2 focus:border-deep-navy outline-none font-body-md text-ink-black text-sm bg-transparent"
                    />
                  </div>
                )}

                {authError && <p className="text-xs text-red-600 font-body-md">{authError}</p>}

                <button
                  type="submit"
                  disabled={authLoading}
                  className="w-full font-button text-button uppercase py-4 bg-deep-navy text-pure-white hover:bg-ink-black transition-colors cursor-pointer flex items-center justify-center gap-2 tracking-widest text-xs"
                >
                  {authLoading ? (
                    <span className="w-4 h-4 border-2 border-pure-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    authMode === "signup" ? "Verify & Register" : "Sign In"
                  )}
                </button>
              </form>

              {/* Google & Truecaller OAuth Login Block */}
              <div className="pt-4 border-t border-slate-grey/15 space-y-3">
                <p className="text-center text-[10px] font-label-caps text-slate-grey tracking-wider uppercase">Or verify instantly</p>
                <div className="grid grid-cols-1 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setAuthLoading(true);
                      setAuthError(null);
                      try {
                        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://snvifoikeixkgrdkgyme.supabase.co";
                        const redirectUrl = `${window.location.origin}/auth/callback`;
                        window.location.href = `${supabaseUrl.replace(/\/$/, "")}/auth/v1/authorize?provider=google&redirect_to=${encodeURIComponent(redirectUrl)}`;
                      } catch (err: any) {
                        setAuthError(err.message || "Failed to initiate Google Sign-In.");
                        setAuthLoading(false);
                      }
                    }}
                    className="w-full bg-pure-white text-ink-black border border-slate-grey/30 py-3 font-button text-xs uppercase tracking-widest hover:bg-soft-linen transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"/>
                      <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.26v3.15C3.25 21.32 7.33 24 12 24z"/>
                      <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.26C.46 8.18 0 10.02 0 12s.46 3.82 1.26 5.42l4.02-3.15z"/>
                      <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.25 2.68 1.26 6.58l4.02 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
                    </svg>
                    Continue with Google
                  </button>

                  {truecallerEnabled && (
                    <button
                      type="button"
                      onClick={handleTruecallerVerification}
                      className="w-full bg-[#0087FF] text-pure-white py-3 font-button text-xs uppercase tracking-widest hover:bg-[#0076E5] transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                    >
                      <span className="material-symbols-outlined text-[16px]">bolt</span>
                      {authMode === "signup" ? "Sign up with Truecaller" : "Sign in with Truecaller"}
                    </button>
                  )}
                </div>
              </div>

              {authMode === "signup" ? (
                <p className="text-center text-[11px] text-slate-grey font-body-md leading-relaxed">
                  For your security, we'll send a 6-digit confirmation code to your email.
                </p>
              ) : (
                <p className="text-center text-[11px] text-slate-grey font-body-md leading-relaxed">
                  Secure access to your VRIX account details and order history.
                </p>
              )}
            </div>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-6">
              <div className="space-y-3">
                <label className="font-label-caps text-[10px] text-slate-grey uppercase tracking-widest block">
                  Enter 6-Digit Code
                </label>
                <p className="text-xs text-slate-grey font-body-md">Sent to <strong>{authEmail}</strong></p>
                <div className="flex gap-3 justify-between">
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
                      className="w-12 h-14 text-center text-xl font-semibold border border-slate-grey/30 focus:border-deep-navy outline-none text-deep-navy bg-soft-linen/30 transition-colors"
                    />
                  ))}
                </div>
              </div>
              {authError && <p className="text-xs text-red-600 font-body-md">{authError}</p>}
              <button
                type="submit"
                disabled={authLoading}
                className="w-full font-button text-button uppercase py-4 bg-deep-navy text-pure-white hover:bg-ink-black transition-colors cursor-pointer flex items-center justify-center gap-2 text-xs tracking-widest"
              >
                {authLoading ? (
                  <span className="w-4 h-4 border-2 border-pure-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  "Verify & Sign In"
                )}
              </button>
              <button
                type="button"
                onClick={() => { setAuthStep("email"); setOtpInput(["","","","","",""]); setAuthError(null); }}
                className="w-full text-center text-xs text-slate-grey hover:text-deep-navy transition-colors font-body-md underline cursor-pointer"
              >
                Use a different email
              </button>
            </form>
          )}

          {/* Truecaller Sandbox Modal */}
          {showTruecallerModal && (
            <div className="fixed inset-0 bg-deep-navy/40 backdrop-blur-sm flex items-center justify-center z-[100] p-4 transition-all animate-fade-in">
              <div className="bg-pure-white w-full max-w-sm border border-slate-grey/25 shadow-2xl p-6 relative flex flex-col space-y-5 animate-scale-up">
                {/* Close Button */}
                <button
                  type="button"
                  onClick={() => setShowTruecallerModal(false)}
                  className="absolute top-4 right-4 text-slate-grey hover:text-ink-black transition-colors cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[20px]">close</span>
                </button>

                {/* Header */}
                <div className="text-center space-y-1">
                  <div className="w-12 h-12 bg-[#0087FF]/10 text-[#0087FF] rounded-full flex items-center justify-center mx-auto mb-2">
                    <span className="material-symbols-outlined text-[26px]">bolt</span>
                  </div>
                  <h3 className="font-display-lg text-lg text-deep-navy tracking-wide uppercase">Truecaller Sandbox</h3>
                  <p className="font-body-md text-[11px] text-slate-grey">Simulating Truecaller 1-Tap Verification</p>
                </div>

                {/* Form Fields */}
                <div className="space-y-4 pt-2">
                  <div className="space-y-1">
                    <label className="font-label-caps text-[9px] text-slate-grey uppercase tracking-widest block">Simulated Name</label>
                    <input
                      type="text"
                      value={simName}
                      onChange={(e) => setSimName(e.target.value)}
                      placeholder="Dhruv Agent"
                      required
                      className="w-full border-b border-slate-grey/30 py-1.5 focus:border-deep-navy outline-none font-body-md text-ink-black text-sm bg-transparent"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-label-caps text-[9px] text-slate-grey uppercase tracking-widest block">Simulated Email</label>
                    <input
                      type="email"
                      value={simEmail}
                      onChange={(e) => setSimEmail(e.target.value)}
                      placeholder="dhruv@vrix.com"
                      required
                      className="w-full border-b border-slate-grey/30 py-1.5 focus:border-deep-navy outline-none font-body-md text-ink-black text-sm bg-transparent"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-label-caps text-[9px] text-slate-grey uppercase tracking-widest block">Simulated Phone</label>
                    <input
                      type="tel"
                      value={simPhone}
                      onChange={(e) => setSimPhone(e.target.value)}
                      placeholder="+919876543210"
                      required
                      className="w-full border-b border-slate-grey/30 py-1.5 focus:border-deep-navy outline-none font-body-md text-ink-black text-sm bg-transparent"
                    />
                  </div>
                </div>

                {/* Verify Button */}
                <button
                  type="button"
                  onClick={handleTruecallerAutofillConfirm}
                  disabled={authLoading}
                  className="w-full bg-[#0087FF] text-pure-white py-3.5 font-button text-xs uppercase tracking-widest hover:bg-[#0076E5] transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-md mt-4"
                >
                  {authLoading ? (
                    <span className="w-4 h-4 border-2 border-pure-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-[16px]">verified_user</span>
                      Instant Verification
                    </>
                  )}
                </button>

                <p className="text-[10px] text-center text-slate-grey leading-relaxed pt-1">
                  Clicking verify will send a mock payload to `/api/truecaller/verify` to simulate a real Truecaller callback response.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── Main Account Dashboard ───────────────────────────────────────────────────
  return (
    <div className="w-full bg-surface min-h-screen">
      {successMsg && (
        <div className="fixed bottom-8 right-8 z-50 bg-deep-navy text-pure-white px-6 py-4 border border-slate-grey/30 shadow-2xl flex items-center gap-3 animate-fade-in">
          <span className="material-symbols-outlined text-sm">check_circle</span>
          <p className="font-body-md text-sm tracking-wide">{successMsg}</p>
        </div>
      )}

      <main className="max-w-container-max mx-auto w-full px-margin-mobile md:px-margin-desktop py-section-gap grid grid-cols-12 gap-12 relative">
        {/* Sidebar */}
        <aside className="col-span-12 md:col-span-3">
          <div className="mb-6 space-y-0.5">
            <p className="font-label-caps text-[10px] text-slate-grey uppercase tracking-widest">Signed in as</p>
            <p className="font-body-md text-sm text-deep-navy font-semibold">{authEmail}</p>
          </div>
          <h2 className="font-label-caps text-xs text-slate-grey mb-4 uppercase tracking-widest border-b border-slate-grey/15 pb-2">
            My Account
          </h2>
          <nav className="flex flex-col gap-2 border-l border-slate-grey/20 pl-4">
            {menuItems.map((item) => (
              <button
                key={item.key}
                onClick={() => setActiveTab(item.key)}
                className={`flex items-center space-x-3 w-full text-left font-body-md text-sm transition-colors py-2 border-l-2 -ml-[18px] pl-[16px] cursor-pointer ${
                  activeTab === item.key
                    ? "text-deep-navy border-deep-navy font-semibold"
                    : "text-slate-grey border-transparent hover:text-ink-black"
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">{item.icon}</span>
                <span>{item.label}</span>
              </button>
            ))}
          </nav>
        </aside>

        {/* Main Content */}
        <section className="col-span-12 md:col-span-9 bg-pure-white border border-slate-grey/10 p-8 md:p-12 shadow-sm min-h-[500px]">

          {/* DASHBOARD */}
          {activeTab === "dashboard" && (
            <div className="space-y-8 animate-fade-in">
              <div className="pt-2 flex justify-end">
                <Link href="/account/orders" className="font-button text-[10px] uppercase tracking-widest px-4 py-2 border border-deep-navy text-deep-navy hover:bg-deep-navy hover:text-pure-white transition-colors flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px]">local_shipping</span>
                  Track Live Orders
                </Link>
              </div>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                  { label: "Total Orders", value: userOrders.length },
                  { label: "Reward Points", value: rewardPoints },
                  { label: "Wishlist Items", value: wishlist.length },
                  { label: "Member Tier", value: memberTier },
                ].map((stat) => (
                  <div key={stat.label} className="bg-surface p-6 border border-slate-grey/15 flex flex-col justify-between h-32 hover:border-slate-grey/30 transition-colors">
                    <span className="font-label-caps text-[10px] text-slate-grey uppercase tracking-wider">{stat.label}</span>
                    <span className="font-display-lg text-headline-lg text-deep-navy">{stat.value}</span>
                  </div>
                ))}
              </div>
              <div className="pt-4">
                <div className="flex justify-between items-center mb-4 border-b border-slate-grey/15 pb-2">
                  <h3 className="font-headline-md text-base text-deep-navy">Recent Orders</h3>
                  <button onClick={() => setActiveTab("orders")} className="font-label-caps text-[10px] text-slate-grey hover:text-deep-navy underline tracking-wider">VIEW ALL</button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead><tr className="border-b border-slate-grey/25 text-slate-grey font-label-caps text-[10px] tracking-wider">
                      <th className="py-3 font-normal">ORDER ID</th><th className="py-3 font-normal">DATE</th>
                      <th className="py-3 font-normal">TOTAL</th><th className="py-3 font-normal">STATUS</th>
                      <th className="py-3 font-normal text-right">INVOICE</th>
                    </tr></thead>
                    <tbody className="font-body-md text-sm text-deep-navy divide-y divide-slate-grey/10">
                      {userOrders.length > 0 ? (
                        userOrders.slice(0, 3).map((order) => (
                          <tr key={order.orderId} className="hover:bg-soft-linen/20 transition-colors">
                            <td className="py-4 font-semibold">{order.orderId}</td>
                            <td className="py-4 text-slate-grey">{new Date(order.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</td>
                            <td className="py-4">₹{Number(order.amount).toLocaleString()}</td>
                            <td className="py-4"><span className="inline-flex px-2 py-0.5 border border-slate-grey/20 text-[9px] font-label-caps uppercase tracking-wider text-deep-navy">{order.status || "SUCCESS"}</span></td>
                            <td className="py-4 text-right">
                              <button
                                onClick={() => {
                                  const apiBaseUrl = getApiBaseUrl();
                                  window.open(`${apiBaseUrl}/payment/invoice/${order.orderId}`, "_blank");
                                }}
                                className="font-button text-[10px] tracking-wider text-deep-navy hover:text-slate-grey underline uppercase cursor-pointer"
                              >
                                Invoice
                              </button>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={5} className="py-8 text-center text-xs text-slate-grey font-body-md">
                            No orders placed yet. <Link href="/collections/all" className="text-deep-navy underline font-semibold">Explore Collections</Link>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ORDERS */}
          {activeTab === "orders" && (
            <div className="space-y-8 animate-fade-in">
              <header className="border-b border-slate-grey/15 pb-4">
                <h1 className="font-display-lg text-headline-md text-deep-navy uppercase">Order History</h1>
                <p className="font-body-md text-xs text-slate-grey mt-1">Track and manage all past and active commissions.</p>
              </header>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead><tr className="border-b border-slate-grey/25 text-slate-grey font-label-caps text-[10px] tracking-wider">
                    <th className="py-3 font-normal">ORDER ID</th><th className="py-3 font-normal">DATE</th>
                    <th className="py-3 font-normal">TOTAL AMOUNT</th><th className="py-3 font-normal">STATUS</th>
                    <th className="py-3 font-normal text-right">ACTION</th>
                  </tr></thead>
                  <tbody className="font-body-md text-sm text-deep-navy divide-y divide-slate-grey/10">
                    {userOrders.length > 0 ? (
                      userOrders.map((order) => (
                        <tr key={order.orderId} className="hover:bg-soft-linen/20 transition-colors">
                          <td className="py-4 font-semibold">{order.orderId}</td>
                          <td className="py-4 text-slate-grey">{new Date(order.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</td>
                          <td className="py-4">₹{Number(order.amount).toLocaleString()}</td>
                          <td className="py-4"><span className="inline-flex px-2 py-0.5 border border-slate-grey/20 text-[9px] font-label-caps uppercase tracking-wider">{order.status || "SUCCESS"}</span></td>
                          <td className="py-4 text-right">
                            <button
                              onClick={() => {
                                const apiBaseUrl = getApiBaseUrl();
                                window.open(`${apiBaseUrl}/payment/invoice/${order.orderId}`, "_blank");
                              }}
                              className="font-button text-[10px] tracking-wider text-deep-navy hover:text-slate-grey underline uppercase cursor-pointer"
                            >
                              Invoice
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-xs text-slate-grey font-body-md">
                          No orders found for this account. <Link href="/collections/all" className="text-deep-navy underline font-semibold">Start Shopping</Link>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* WISHLIST */}
          {activeTab === "wishlist" && (
            <div className="space-y-8 animate-fade-in">
              <header className="border-b border-slate-grey/15 pb-4">
                <h1 className="font-display-lg text-headline-md text-deep-navy uppercase">My Wishlist</h1>
                <p className="font-body-md text-xs text-slate-grey mt-1">Your curated selections, kept safe.</p>
              </header>
              {wishlist.length === 0 ? (
                <p className="py-12 text-center text-slate-grey font-body-md text-sm">Your wishlist is empty.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {wishlist.map((item) => (
                    <div key={item.id} className="border border-slate-grey/15 p-4 flex gap-4 bg-surface/50">
                      <div className="w-20 h-24 bg-soft-linen relative shrink-0">
                        <Image src={item.image} alt={item.title} fill className="object-cover" sizes="80px" />
                      </div>
                      <div className="flex-grow flex flex-col justify-between">
                        <div className="space-y-1">
                          <h4 className="font-label-caps text-xs text-deep-navy uppercase font-semibold">{item.title}</h4>
                          <p className="text-[10px] text-slate-grey uppercase tracking-wider">{item.material}</p>
                          <p className="font-body-md text-sm text-ink-black font-semibold">${item.price}</p>
                        </div>
                        <div className="flex gap-4 pt-2">
                          <button onClick={() => {
                            const updated = wishlist.filter(w => w.id !== item.id);
                            setWishlist(updated);
                            localStorage.setItem("vrix-wishlist", JSON.stringify(updated.map(w => w.id)));
                            triggerFeedback("Removed from wishlist.");
                          }} className="font-button text-[9px] tracking-widest text-red-600 uppercase cursor-pointer">REMOVE</button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ADDRESSES */}
          {activeTab === "addresses" && (
            <div className="space-y-8 animate-fade-in">
              <header className="border-b border-slate-grey/15 pb-4 flex justify-between items-center">
                <div>
                  <h1 className="font-display-lg text-headline-md text-deep-navy uppercase">My Address</h1>
                  <p className="font-body-md text-xs text-slate-grey mt-1">Manage your primary shipping details.</p>
                </div>
                {!isEditingAddress && (
                  <button onClick={() => setIsEditingAddress(true)} className="font-label-caps text-xs text-deep-navy hover:underline cursor-pointer border border-deep-navy px-3 py-1.5">EDIT</button>
                )}
              </header>
              {isEditingAddress ? (
                <form onSubmit={(e) => {
                  e.preventDefault();
                  const savedObj = {
                    ...shippingAddress,
                    phone: shippingAddress.useSamePhone ? profile.phone : shippingAddress.phone
                  };
                  setShippingAddress(savedObj);
                  if (user?.email) {
                    localStorage.setItem(`vrix_address_${user.email}`, JSON.stringify(savedObj));
                  }
                  setIsEditingAddress(false);
                  triggerFeedback("Shipping address updated successfully.");
                }} className="space-y-6">
                  {[
                    { label: "Street Address", field: "street" as const, placeholder: "Building, Flat / House No., Street" },
                    { label: "City", field: "city" as const, placeholder: "City / Town" },
                    { label: "State", field: "state" as const, placeholder: "State / Province" },
                    { label: "ZIP Code", field: "zip" as const, placeholder: "Postal / PIN Code" },
                    { label: "Country", field: "country" as const, placeholder: "Country" },
                  ].map(({ label, field, placeholder }) => (
                    <div key={field} className="flex flex-col gap-2">
                      <label className="font-label-caps text-[9px] text-slate-grey uppercase">{label}</label>
                      <input
                        type="text"
                        value={shippingAddress[field]}
                        onChange={(e) => setShippingAddress({ ...shippingAddress, [field]: e.target.value })}
                        placeholder={placeholder}
                        required
                        className="border-b border-slate-grey/30 py-1.5 focus:border-deep-navy outline-none font-body-md text-sm text-ink-black"
                      />
                    </div>
                  ))}

                  {/* Delivery Phone Selection */}
                  <div className="space-y-3 pt-2 border-t border-slate-grey/15">
                    <label className="font-label-caps text-[9px] text-slate-grey uppercase tracking-wider block">
                      Delivery Contact Phone Number
                    </label>
                    <div className="space-y-2">
                      <label className="flex items-center gap-2 cursor-pointer text-xs font-body-md text-deep-navy">
                        <input
                          type="radio"
                          name="phoneOption"
                          checked={shippingAddress.useSamePhone}
                          onChange={() => setShippingAddress({ ...shippingAddress, useSamePhone: true, phone: profile.phone })}
                          className="accent-deep-navy cursor-pointer"
                        />
                        <span>Use my Account Phone Number ({profile.phone || "Same as Account"})</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer text-xs font-body-md text-deep-navy">
                        <input
                          type="radio"
                          name="phoneOption"
                          checked={!shippingAddress.useSamePhone}
                          onChange={() => setShippingAddress({ ...shippingAddress, useSamePhone: false })}
                          className="accent-deep-navy cursor-pointer"
                        />
                        <span>Enter a different delivery contact number</span>
                      </label>
                    </div>

                    {!shippingAddress.useSamePhone && (
                      <div className="flex flex-col gap-2 pt-2 animate-fade-in">
                        <label className="font-label-caps text-[9px] text-slate-grey uppercase">Delivery Contact Phone</label>
                        <input
                          type="tel"
                          value={shippingAddress.phone}
                          onChange={(e) => setShippingAddress({ ...shippingAddress, phone: e.target.value })}
                          placeholder="+91 98765 43210 (For Courier Delivery Calls)"
                          required
                          className="border-b border-slate-grey/30 py-1.5 focus:border-deep-navy outline-none font-body-md text-sm text-ink-black"
                        />
                      </div>
                    )}
                  </div>

                  <div className="flex gap-4 pt-2">
                    <button type="submit" className="font-button text-xs uppercase px-8 py-3 bg-deep-navy text-pure-white hover:bg-ink-black transition-colors cursor-pointer">Save Address</button>
                    <button type="button" onClick={() => setIsEditingAddress(false)} className="font-button text-xs uppercase px-8 py-3 border border-slate-grey/30 text-slate-grey cursor-pointer">Cancel</button>
                  </div>
                </form>
              ) : (shippingAddress.street || shippingAddress.city) ? (
                <div className="bg-surface/50 border border-slate-grey/15 p-6 space-y-2">
                  <h4 className="font-label-caps text-[10px] text-slate-grey uppercase tracking-wider mb-2">Primary Shipping Location</h4>
                  <p className="font-body-md text-sm text-deep-navy font-semibold">{profile.firstName} {profile.lastName}</p>
                  <p className="font-body-md text-sm text-slate-grey">{shippingAddress.street}</p>
                  <p className="font-body-md text-sm text-slate-grey">{shippingAddress.city}{shippingAddress.state ? `, ${shippingAddress.state}` : ""} {shippingAddress.zip}</p>
                  <p className="font-body-md text-sm text-slate-grey">{shippingAddress.country}</p>
                  <div className="pt-2 border-t border-slate-grey/10 flex items-center gap-2 text-xs text-deep-navy font-medium">
                    <span className="material-symbols-outlined text-[16px] text-slate-grey">call</span>
                    <span>Delivery Contact: <strong>{shippingAddress.phone || profile.phone || "Not specified"}</strong></span>
                  </div>
                </div>
              ) : (
                <div className="bg-surface/50 border border-slate-grey/15 p-8 text-center space-y-4">
                  <div className="w-12 h-12 bg-soft-linen rounded-full flex items-center justify-center mx-auto text-slate-grey">
                    <span className="material-symbols-outlined text-[24px]">location_on</span>
                  </div>
                  <div className="space-y-1">
                    <h4 className="font-label-caps text-xs text-deep-navy uppercase font-semibold">No Shipping Address Saved</h4>
                    <p className="font-body-md text-xs text-slate-grey max-w-sm mx-auto">
                      Add your primary delivery address for smooth 1-click checkouts and order shipping.
                    </p>
                  </div>
                  <button
                    onClick={() => setIsEditingAddress(true)}
                    className="font-button text-xs uppercase px-6 py-2.5 bg-deep-navy text-pure-white hover:bg-ink-black transition-colors cursor-pointer"
                  >
                    + Add Primary Address
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ACCOUNT DETAILS */}
          {activeTab === "account" && (
            <div className="space-y-8 animate-fade-in">
              <header className="border-b border-slate-grey/15 pb-4">
                <h1 className="font-display-lg text-headline-md text-deep-navy uppercase">Account Details</h1>
              </header>
              <form onSubmit={(e) => {
                e.preventDefault();
                const fullName = `${profile.firstName} ${profile.lastName}`.trim();
                login(authEmail, { name: fullName, phone: profile.phone, isVrixPlusMember: user?.isVrixPlusMember });
                triggerFeedback("Account details updated successfully.");
              }} className="space-y-8">
                <div className="grid grid-cols-2 gap-4">
                  {[{ label: "First Name", field: "firstName" as const }, { label: "Last Name", field: "lastName" as const }].map(({ label, field }) => (
                    <div key={field} className="flex flex-col gap-2">
                      <label className="font-label-caps text-[9px] text-slate-grey uppercase">{label}</label>
                      <input type="text" value={profile[field]} onChange={(e) => setProfile({ ...profile, [field]: e.target.value })} required className="border-b border-slate-grey/30 py-1.5 focus:border-deep-navy outline-none font-body-md text-sm text-ink-black" />
                    </div>
                  ))}
                </div>

                <div className="flex flex-col gap-2">
                  <label className="font-label-caps text-[9px] text-slate-grey uppercase">Phone / Mobile Number</label>
                  <input
                    type="tel"
                    value={profile.phone}
                    onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                    placeholder="+91 98765 43210 (For SMS Notifications & Express Login)"
                    className="border-b border-slate-grey/30 py-1.5 focus:border-deep-navy outline-none font-body-md text-sm text-ink-black"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label className="font-label-caps text-[9px] text-slate-grey uppercase">Verified Email</label>
                  <div className="flex items-center gap-2 border-b border-slate-grey/20 py-1.5">
                    <span className="material-symbols-outlined text-green-600 text-[16px]">verified</span>
                    <span className="font-body-md text-sm text-ink-black">{authEmail}</span>
                    <span className="ml-auto font-label-caps text-[9px] text-green-600 uppercase tracking-wider">Verified</span>
                  </div>
                </div>
                <button type="submit" className="font-button text-xs uppercase px-12 py-4 bg-deep-navy text-pure-white hover:bg-ink-black transition-colors cursor-pointer">Save Profile</button>
              </form>
            </div>
          )}

          {/* VRIX+ CLUB */}
          {activeTab === "vrix_plus" && (
            <div className="space-y-8 animate-fade-in">
              <header className="border-b border-slate-grey/15 pb-4">
                <span className="font-label-caps text-[9px] text-[#B59D7C] uppercase tracking-[0.3em] font-semibold block mb-1">
                  PRIVATE MEMBER CIRCLE
                </span>
                <h1 className="font-display-lg text-headline-md text-deep-navy uppercase">VRIX+ Club</h1>
                <p className="font-body-md text-xs text-slate-grey mt-1">
                  Unlock exclusive member privileges, complimentary services, and bespoke private sales.
                </p>
              </header>

              {user?.isVrixPlusMember ? (
                <div className="space-y-8">
                  {/* Luxury Digital Pass Card */}
                  <div className="relative overflow-hidden bg-gradient-to-br from-[#0F1728] via-[#1B263B] to-[#0F1728] text-pure-white p-8 md:p-10 border border-[#B59D7C]/40 shadow-2xl space-y-6">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-[#B59D7C]/10 rounded-full blur-3xl pointer-events-none" />
                    
                    <div className="flex justify-between items-start">
                      <div className="space-y-1">
                        <span className="font-label-caps text-[10px] tracking-[0.3em] uppercase text-[#B59D7C] font-bold">
                          VIP MEMBER PASS
                        </span>
                        <h2 className="font-display-lg text-2xl md:text-3xl tracking-widest uppercase">VRIX+ CIRCLE</h2>
                      </div>
                      <span className="px-3 py-1 bg-[#B59D7C]/20 border border-[#B59D7C] text-[#B59D7C] text-[10px] font-label-caps uppercase tracking-widest font-bold rounded-full">
                        ACTIVE MEMBER
                      </span>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 gap-6 pt-4 border-t border-pure-white/10">
                      <div>
                        <span className="font-label-caps text-[9px] text-pure-white/60 uppercase tracking-widest block mb-1">MEMBER ID</span>
                        <span className="font-mono text-sm tracking-wider font-semibold text-pure-white">
                          VP-{user.email ? user.email.slice(0, 4).toUpperCase() + user.email.length : "8821"}
                        </span>
                      </div>
                      <div>
                        <span className="font-label-caps text-[9px] text-pure-white/60 uppercase tracking-widest block mb-1">JOINED DATE</span>
                        <span className="font-body-md text-sm font-semibold text-pure-white">
                          {user.vrixPlusJoinedDate || "Active Member"}
                        </span>
                      </div>
                      <div>
                        <span className="font-label-caps text-[9px] text-pure-white/60 uppercase tracking-widest block mb-1">MEMBER TIER</span>
                        <span className="font-label-caps text-xs text-[#B59D7C] font-bold tracking-widest block mt-0.5 uppercase">
                          VRIX+ BLACK TIER
                        </span>
                      </div>
                    </div>

                    <div className="pt-2 flex flex-wrap gap-4">
                      <Link
                        href="/collections/vrix-plus"
                        className="px-6 py-2.5 bg-[#B59D7C] text-deep-navy font-button text-[11px] uppercase tracking-widest font-bold hover:bg-pure-white transition-colors"
                      >
                        Explore Exclusive VRIX+ Jewelry →
                      </Link>
                    </div>
                  </div>

                  {/* Active Perks Grid */}
                  <div className="space-y-4">
                    <h3 className="font-headline-md text-sm text-deep-navy uppercase tracking-wider">Your Included VRIX+ Privileges</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {[
                        { icon: "verified_user", title: "5% Automatic Member Discount", desc: "Enjoy an extra 5% off automatically applied at checkout on all orders." },
                        { icon: "local_shipping", title: "Complimentary Express Delivery", desc: "Free priority insured express shipping on every single purchase." },
                        { icon: "card_giftcard", title: "Signature Gift Packaging", desc: "Complimentary velvet presentation box & gold-embossed message card." },
                        { icon: "support_agent", title: "Dedicated VIP Concierge", desc: "Direct 1-on-1 priority assistance for custom jewelry design requests." },
                      ].map((perk) => (
                        <div key={perk.title} className="p-5 border border-slate-grey/15 bg-surface/40 flex items-start gap-3">
                          <span className="material-symbols-outlined text-[#B59D7C] text-[22px] shrink-0">{perk.icon}</span>
                          <div className="space-y-1">
                            <h4 className="font-headline-md text-xs text-deep-navy font-semibold uppercase">{perk.title}</h4>
                            <p className="font-body-md text-[11px] text-slate-grey leading-relaxed">{perk.desc}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="border border-slate-grey/25 p-8 md:p-12 bg-gradient-to-b from-[#FAF8F5] to-pure-white text-center space-y-6">
                  <span className="font-label-caps text-[10px] tracking-[0.3em] uppercase text-[#B59D7C] font-semibold">
                    JOIN THE CIRCLE
                  </span>
                  <h3 className="font-display-lg text-2xl text-deep-navy uppercase tracking-wider max-w-lg mx-auto">
                    Elevate Your Experience with VRIX+
                  </h3>
                  <p className="font-body-md text-xs text-slate-grey max-w-md mx-auto leading-relaxed">
                    Enjoy exclusive 5% member discounts, complimentary express worldwide delivery, signature gift packaging, and early access to limited bespoke collections.
                  </p>

                  <button
                    type="button"
                    onClick={async () => {
                      if (!user?.email) return;
                      try {
                        const apiBaseUrl = getApiBaseUrl();
                        const res = await fetch(`${apiBaseUrl}/auth/join-vrix-plus`, {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ email: user.email })
                        });
                        const data = await res.json();
                        if (res.ok) {
                          login(data.user.email, {
                            name: data.user.name,
                            phone: data.user.phone,
                            isVrixPlusMember: true,
                            vrixPlusJoinedDate: data.user.vrixPlusJoinedDate
                          });
                          triggerFeedback("Welcome to VRIX+ Club!");
                        }
                      } catch (err) {
                        console.error(err);
                      }
                    }}
                    className="px-10 py-4 bg-deep-navy text-pure-white font-button text-xs uppercase tracking-widest hover:bg-ink-black transition-colors cursor-pointer"
                  >
                    Activate Complimentary VRIX+ Membership
                  </button>
                </div>
              )}
            </div>
          )}

          {/* LOGOUT */}
          {activeTab === "logout" && (
            <div className="space-y-8 animate-fade-in text-center py-12">
              <span className="material-symbols-outlined text-deep-navy text-5xl">logout</span>
              <div className="space-y-2 max-w-sm mx-auto">
                <h3 className="font-headline-md text-deep-navy text-xl">Confirm Logout</h3>
                <p className="font-body-md text-sm text-slate-grey">Are you sure you want to sign out?</p>
              </div>
              <div className="flex gap-4 justify-center pt-6">
                <button onClick={handleAccountLogout} className="font-button text-xs uppercase px-8 py-3 bg-deep-navy text-pure-white hover:bg-ink-black transition-colors cursor-pointer">Sign Out</button>
                <button onClick={() => setActiveTab("dashboard")} className="font-button text-xs uppercase px-8 py-3 border border-slate-grey/30 text-slate-grey hover:text-ink-black transition-colors cursor-pointer">Cancel</button>
              </div>
            </div>
          )}

        </section>
      </main>
    </div>
  );
}
