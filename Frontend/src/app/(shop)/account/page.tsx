"use client";

import React, { useState, useRef, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useCurrency } from "@/context/CurrencyContext";
import {
  registerUser,
  confirmRegistration,
  loginUser,
  confirmLogin,
  loginUserDirect,
  addSecurityLog,
  fetchProducts,
  getApiBaseUrl,
  fetchUserOrders,
  getWishlistKey,
  fetchSavedAddresses,
  saveAddress,
  deleteSavedAddress,
  SavedAddress
} from "@/utils/api";

import GoogleAuthButton from "@/components/auth/GoogleAuthButton";

interface Order {
  orderId: string;
  createdAt: string;
  amount: number;
  status: string;
  address?: string;
  city?: string;
  postalCode?: string;
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
  const { formatPrice } = useCurrency();

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
    phone: user?.phone || "",
    dateOfBirth: user?.dateOfBirth || ""
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
  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([]);
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);
  const [wishlist, setWishlist] = useState<WishlistItem[]>([]);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Sync user profile state
  useEffect(() => {
    if (isLoggedIn && user) {
      setAuthStep("verified");
      setAuthEmail(user.email);
      setProfile({
        firstName: getFirstName(user.name, user.email),
        lastName: getLastName(user.name),
        email: user.email,
        phone: user.phone || "",
        dateOfBirth: user.dateOfBirth || ""
      });
    } else {
      setAuthStep("email");
      setAuthEmail("");
    }
  }, [isLoggedIn, user]);

  // Sync wishlist from localStorage
  useEffect(() => {
    async function loadWishlist() {
      try {
        const key = getWishlistKey(user?.email);
        const savedIds = localStorage.getItem(key) || localStorage.getItem("vrix-wishlist");
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
  }, [activeTab, user?.email]);

  const [userOrders, setUserOrders] = useState<Order[]>([]);
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

  // Load the persisted address book. The legacy local entry is only used as a one-time display fallback.
  useEffect(() => {
    if (!user?.email) return;
    fetchSavedAddresses(user.email).then(setSavedAddresses).catch((e) => console.error("Error loading saved addresses:", e));
  }, [user?.email]);

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
        await registerUser({ email: cleanEmail, password: authPassword, name: cleanName, phone: cleanPhone });
        setOtpInput(["", "", "", "", "", ""]);
        triggerFeedback("Verification code sent to your email! Please enter it below.");
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

  const handleOtpChange = (idx: number, val: string) => {
    const digits = val.replace(/\D/g, "");
    if (digits.length > 1) {
      const next = [...otpInput];
      digits.slice(0, 6).split("").forEach((d, offset) => {
        if (idx + offset < 6) next[idx + offset] = d;
      });
      setOtpInput(next);
      const focusIndex = Math.min(idx + digits.length - 1, 5);
      otpRefs.current[focusIndex]?.focus();
      return;
    }
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
      <div className="w-full min-h-[80vh] bg-soft-linen flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md bg-pure-white border border-slate-grey/20 shadow-xl p-8 md:p-10 space-y-8 relative">
          <div className="text-center space-y-1">
            <p className="font-label-caps text-[10px] tracking-widest text-slate-grey uppercase">Member Access</p>
            <h1 className="font-display-lg text-2xl text-deep-navy uppercase tracking-widest">VRIX</h1>
          </div>

          {authStep === "email" ? (
            <div className="space-y-6">
              <div className="flex border-b border-slate-grey/25 pb-2 justify-center gap-6 text-xs font-label-caps tracking-widest">
                <button
                  onClick={() => { setAuthMode("signin"); setAuthError(null); }}
                  className={`pb-1 cursor-pointer transition-colors ${authMode === "signin" ? "border-b-2 border-deep-navy text-deep-navy font-bold" : "text-slate-grey hover:text-ink-black"}`}
                >
                  SIGN IN
                </button>
                <button
                  onClick={() => { setAuthMode("signup"); setAuthError(null); }}
                  className={`pb-1 cursor-pointer transition-colors ${authMode === "signup" ? "border-b-2 border-deep-navy text-deep-navy font-bold" : "text-slate-grey hover:text-ink-black"}`}
                >
                  CREATE ACCOUNT
                </button>
              </div>

              <div className="space-y-3">
                <GoogleAuthButton
                  onSuccess={(usr) => {
                    setAuthStep("verified");
                    triggerFeedback(usr?.isVrixPlusMember ? "Welcome to VRIX+ Circle!" : "Welcome back!");
                  }}
                  onError={(err) => setAuthError(err)}
                  buttonText={authMode === "signup" ? "Sign Up with Google" : "Sign In with Google"}
                />

                <div className="flex items-center gap-3 my-1">
                  <div className="flex-1 h-[1px] bg-slate-grey/20" />
                  <span className="font-label-caps text-[9px] text-slate-grey uppercase tracking-widest">Or Continue With Email</span>
                  <div className="flex-1 h-[1px] bg-slate-grey/20" />
                </div>
              </div>

              <form onSubmit={handleAuthSubmit} className="space-y-4">
                {authMode === "signup" && (
                  <div className="space-y-1">
                    <label className="font-label-caps text-[9px] text-slate-grey uppercase tracking-widest block">Full Name</label>
                    <input
                      type="text"
                      value={authName}
                      onChange={(e) => setAuthName(e.target.value)}
                      placeholder="Your full name"
                      required
                      className="w-full border-b border-slate-grey/30 py-2 focus:border-deep-navy outline-none font-body-md text-ink-black text-sm bg-transparent"
                    />
                  </div>
                )}

                <div className="space-y-1">
                  <label className="font-label-caps text-[9px] text-slate-grey uppercase tracking-widest block">Email Address</label>
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
                  className="w-full font-button text-xs uppercase py-4 bg-deep-navy text-pure-white hover:bg-ink-black transition-colors cursor-pointer flex items-center justify-center gap-2 tracking-widest mt-2"
                >
                  {authLoading ? (
                    <span className="w-4 h-4 border-2 border-pure-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    authMode === "signup" ? "Verify & Register" : "Sign In"
                  )}
                </button>
              </form>
            </div>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-6">
              <div className="space-y-3">
                <label className="font-label-caps text-[10px] text-slate-grey uppercase tracking-widest block">
                  Enter 6-Digit Code
                </label>
                <p className="text-xs text-slate-grey font-body-md">Sent to <strong>{authEmail}</strong></p>
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
                      className="w-11 h-13 text-center text-lg font-semibold border border-slate-grey/30 focus:border-deep-navy outline-none text-deep-navy bg-soft-linen/30 transition-colors"
                    />
                  ))}
                </div>
              </div>
              {authError && <p className="text-xs text-red-600 font-body-md">{authError}</p>}
              <button
                type="submit"
                disabled={authLoading}
                className="w-full font-button text-xs uppercase py-4 bg-deep-navy text-pure-white hover:bg-ink-black transition-colors cursor-pointer flex items-center justify-center gap-2 tracking-widest"
              >
                {authLoading ? (
                  <span className="w-4 h-4 border-2 border-pure-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  "Verify & Sign In"
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    );
  }

  // ── Main Account Dashboard (Full-width edge-to-edge theme) ────
  return (
    <div className="w-full min-h-screen bg-soft-linen flex flex-col">
      {/* Toast Notification */}
      {successMsg && (
        <div className="fixed bottom-8 right-8 z-50 bg-deep-navy text-pure-white px-6 py-4 border border-slate-grey/30 shadow-2xl flex items-center gap-3 animate-fade-in">
          <span className="material-symbols-outlined text-sm">check_circle</span>
          <p className="font-body-md text-sm tracking-wide">{successMsg}</p>
        </div>
      )}

      {/* FULL-WIDTH BRAND HEADER BANNER (Full Side Edge-to-Edge) */}
      <section className="w-full bg-ink-black text-pure-white py-8 md:py-12 border-b border-gold-accent/20 shadow-md">
        <div className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="font-label-caps text-[10px] text-[#D9C08A] uppercase tracking-[0.25em] font-semibold">
              VRIX PRIVATE MEMBER PORTAL
            </span>
            <h1 className="font-display-lg text-2xl md:text-3xl uppercase tracking-tight">
              {profile.firstName ? `Hello, ${profile.firstName}` : "Welcome to Your Account"}
            </h1>
            <p className="font-body-md text-xs text-pure-white/80">
              Manage your orders, saved wishlist items, and member privileges.
            </p>
          </div>
          <div className="flex min-w-0 items-center gap-3">
            <span className="font-label-caps text-[clamp(0.55rem,2vw,0.625rem)] leading-tight uppercase tracking-[0.12em] sm:tracking-widest px-3 py-1.5 bg-pure-white/10 border border-pure-white/20 rounded-full whitespace-nowrap">
              {memberTier}
            </span>
          </div>
        </div>
      </section>

      {/* MOBILE STICKY HORIZONTAL TAB BAR (< 768px - Full Width Edge-to-Edge) */}
      <div className="md:hidden sticky top-[64px] z-30 w-full bg-pure-white border-b border-slate-grey/20 py-2.5 px-4 shadow-xs">
Member Tier Font Size: Reduce font size in account overview so text is fully visible.        <div className="flex gap-2 overflow-x-auto hide-scrollbar whitespace-nowrap py-1 w-full">
          {menuItems.map((item) => {
            const isActive = activeTab === item.key;
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => setActiveTab(item.key)}
                className={`flex items-center gap-1.5 px-4 py-2 text-xs font-label-caps uppercase tracking-wider transition-all duration-200 shrink-0 border cursor-pointer ${isActive
                    ? "border-deep-navy bg-deep-navy text-pure-white shadow-xs font-semibold"
                    : "border-slate-grey/15 bg-pure-white text-slate-grey hover:text-ink-black hover:border-slate-grey/30"
                  }`}
              >
                <span className="material-symbols-outlined text-[15px]">{item.icon}</span>
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <main className="flex-grow w-full max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop py-6 md:py-section-gap">

        {/* DESKTOP RESPONSIVE GRID LAYOUT (>= 768px): Sidebar (1 col) + Content (3 cols) */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 lg:gap-12 items-start w-full">

          {/* DESKTOP MINIMALIST LEFT SIDEBAR (STICKY) */}
          <aside className="hidden md:block col-span-1 sticky top-28 bg-pure-white p-6 border border-slate-grey/15 shadow-xs space-y-6 w-full">
            <div className="border-b border-slate-grey/15 pb-4 space-y-1">
              <span className="font-label-caps text-[9px] text-slate-grey uppercase tracking-widest block">Signed In As</span>
              <h3 className="font-display-lg text-sm text-deep-navy uppercase font-semibold truncate">{profile.firstName || "Member"}</h3>
              <p className="font-body-md text-[11px] text-slate-grey truncate">{authEmail}</p>
            </div>

            <nav className="flex flex-col gap-1 w-full">
              {menuItems.map((item) => {
                const isActive = activeTab === item.key;
                return (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => setActiveTab(item.key)}
                    className={`flex items-center gap-3 w-full text-left font-label-caps text-xs tracking-wider uppercase py-3 px-4 border-l-2 transition-all duration-200 cursor-pointer ${isActive
                        ? "border-deep-navy text-deep-navy bg-soft-linen/50 font-bold"
                        : "border-transparent text-slate-grey hover:text-ink-black hover:bg-soft-linen/20"
                      }`}
                  >
                    <span className="material-symbols-outlined text-[18px]">{item.icon}</span>
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>
          </aside>

          {/* SPACIOUS RIGHT PANE FOR TAB CONTENT */}
          <section className="col-span-1 md:col-span-3 bg-pure-white border border-slate-grey/15 p-6 md:p-10 shadow-xs min-h-[550px] relative w-full">

            {/* 1. DASHBOARD TAB */}
            {activeTab === "dashboard" && (
              <div className="space-y-8 animate-fade-in transition-opacity duration-500 ease-out">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-grey/15 pb-6 gap-4">
                  <div>
                    <span className="font-label-caps text-[10px] text-slate-grey uppercase tracking-widest">Account Overview</span>
                    <h1 className="font-display-lg text-2xl text-deep-navy uppercase tracking-tight">
                      Welcome, {profile.firstName || "Member"}
                    </h1>
                  </div>
                  <Link
                    href="/account/orders"
                    className="font-button text-[10px] uppercase tracking-widest px-4 py-2.5 border border-deep-navy text-deep-navy hover:bg-deep-navy hover:text-pure-white transition-colors flex items-center gap-1.5 self-start sm:self-auto"
                  >
                    <span className="material-symbols-outlined text-[15px]">local_shipping</span>
                    Track Live Orders
                  </Link>
                </div>

                {/* Key Metrics Grid */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  {[
                    { label: "Total Orders", value: userOrders.length },
                    { label: "Reward Points", value: rewardPoints },
                    { label: "Wishlist Items", value: wishlist.length },
                    { label: "Member Tier", value: memberTier },
                  ].map((stat) => (
                    <div key={stat.label} className="bg-soft-linen/30 p-4 sm:p-5 border border-slate-grey/15 flex flex-col justify-between h-28 min-w-0 hover:border-slate-grey/30 transition-colors">
                      <span className="font-label-caps text-[9px] text-slate-grey uppercase tracking-wider">{stat.label}</span>
                      <span className={stat.label === "Member Tier"
                        ? "font-display-lg text-[clamp(0.65rem,2.8vw,1rem)] sm:text-[clamp(0.8rem,1.6vw,1.25rem)] leading-tight text-deep-navy font-semibold break-words"
                        : "font-display-lg text-xl md:text-2xl text-deep-navy font-semibold truncate"
                      }>{stat.value}</span>
                    </div>
                  ))}
                </div>

                {/* Recent Orders Section */}
                <div className="space-y-4 pt-4">
                  <div className="flex justify-between items-center border-b border-slate-grey/15 pb-3">
                    <h3 className="font-headline-md text-sm text-deep-navy uppercase tracking-wider">Recent Orders</h3>
                    <button onClick={() => setActiveTab("orders")} className="font-label-caps text-[10px] text-slate-grey hover:text-deep-navy underline tracking-wider cursor-pointer">
                      VIEW ALL
                    </button>
                  </div>

                  {userOrders.length > 0 ? (
                    <div className="space-y-3">
                      {userOrders.slice(0, 2).map((order) => {
                        const status = order.status || "Processing";
                        const isDelivered = status === "Delivered" || status === "SUCCESS";
                        return (
                          <div key={order.orderId} className="border border-slate-grey/15 p-4 flex flex-col sm:flex-row justify-between sm:items-center gap-3 bg-pure-white hover:border-slate-grey/30 transition-colors">
                            <div>
                              <p className="font-body-md text-xs font-semibold text-deep-navy">{order.orderId}</p>
                              <p className="text-[10px] text-slate-grey mt-0.5">
                                {new Date(order.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                              </p>
                            </div>
                            <div className="flex items-center justify-between sm:justify-end gap-4">
                              <span className="font-body-md text-xs font-semibold text-ink-black">{formatPrice(Number(order.amount))}</span>
                              <span className={`px-2.5 py-0.5 text-[9px] font-label-caps uppercase tracking-wider font-bold border rounded-full ${isDelivered ? "bg-emerald-50 text-emerald-800 border-emerald-200" : "bg-amber-50 text-amber-800 border-amber-200"
                                }`}>
                                {status === "SUCCESS" ? "Delivered" : status}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-10 px-4 text-center border border-dashed border-slate-grey/20 bg-soft-linen/20 space-y-3">
                      <span className="material-symbols-outlined text-slate-grey text-4xl" style={{ fontVariationSettings: "'wght' 200" }}>local_shipping</span>
                      <p className="font-body-md text-slate-grey text-xs">No orders placed yet.</p>
                      <Link href="/products" className="font-button text-[10px] uppercase px-6 py-2.5 bg-deep-navy text-pure-white hover:bg-ink-black transition-colors tracking-widest">
                        START SHOPPING
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 2. ORDERS TAB */}
            {activeTab === "orders" && (
              <div className="space-y-6 animate-fade-in transition-opacity duration-500 ease-out">
                <header className="border-b border-slate-grey/15 pb-4">
                  <h1 className="font-display-lg text-xl text-deep-navy uppercase tracking-wider">Order History</h1>
                  <p className="font-body-md text-xs text-slate-grey mt-1">Track and manage all your past and current jewelry commissions.</p>
                </header>

                {userOrders.length > 0 ? (
                  <div className="space-y-4">
                    {userOrders.map((order) => {
                      const status = order.status || "Processing";
                      const isDelivered = status === "Delivered" || status === "SUCCESS" || status === "Completed";
                      const isProcessing = status === "Processing" || status === "Pending";

                      return (
                        <div key={order.orderId} className="border border-slate-grey/15 bg-pure-white p-5 md:p-6 space-y-4 hover:border-slate-grey/30 transition-colors shadow-2xs">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-grey/15 pb-3">
                            <div className="space-y-0.5">
                              <span className="font-label-caps text-[10px] text-slate-grey uppercase tracking-widest">Order ID</span>
                              <p className="font-body-md text-sm font-semibold text-deep-navy">{order.orderId}</p>
                            </div>

                            <div className="flex items-center gap-3">
                              <span className={`inline-flex items-center gap-1.5 px-3 py-1 text-[10px] font-label-caps uppercase tracking-wider font-bold border rounded-full ${isDelivered
                                  ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                                  : isProcessing
                                    ? "bg-amber-50 text-amber-800 border-amber-200"
                                    : "bg-indigo-50 text-indigo-800 border-indigo-200"
                                }`}>
                                <span className="w-1.5 h-1.5 rounded-full bg-current" />
                                {status === "SUCCESS" ? "Delivered" : status}
                              </span>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs font-body-md">
                            <div>
                              <span className="font-label-caps text-[9px] text-slate-grey uppercase tracking-widest block">Date Placed</span>
                              <span className="text-ink-black font-medium">{new Date(order.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
                            </div>
                            <div>
                              <span className="font-label-caps text-[9px] text-slate-grey uppercase tracking-widest block">Total Amount</span>
                              <span className="text-deep-navy font-semibold">{formatPrice(Number(order.amount))}</span>
                            </div>
                            <div className="col-span-2 sm:col-span-1 flex items-center justify-end gap-3 pt-2 sm:pt-0">
                              <button
                                type="button"
                                onClick={() => {
                                  const apiBaseUrl = getApiBaseUrl();
                                  window.open(`${apiBaseUrl}/payment/invoice/${order.orderId}`, "_blank");
                                }}
                                className="font-button text-[10px] tracking-wider text-deep-navy hover:text-slate-grey underline uppercase cursor-pointer flex items-center gap-1"
                              >
                                <span className="material-symbols-outlined text-[14px]">download</span>
                                Invoice
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-16 px-4 text-center border border-dashed border-slate-grey/25 bg-soft-linen/20 space-y-4">
                    <span className="material-symbols-outlined text-slate-grey text-5xl" style={{ fontVariationSettings: "'wght' 200" }}>
                      local_shipping
                    </span>
                    <div className="space-y-1">
                      <h3 className="font-headline-md text-slate-grey text-base uppercase tracking-wider">No Orders Placed Yet</h3>
                      <p className="font-body-md text-slate-grey text-xs max-w-xs mx-auto">
                        When you commission or order pieces from VRIX, your order updates and invoices will appear here.
                      </p>
                    </div>
                    <Link
                      href="/products"
                      className="font-button text-xs uppercase px-8 py-3.5 bg-deep-navy text-pure-white hover:bg-ink-black transition-colors tracking-widest mt-2 inline-block"
                    >
                      START SHOPPING
                    </Link>
                  </div>
                )}
              </div>
            )}

            {/* 3. WISHLIST TAB */}
            {activeTab === "wishlist" && (
              <div className="space-y-6 animate-fade-in transition-opacity duration-500 ease-out">
                <header className="border-b border-slate-grey/15 pb-4">
                  <h1 className="font-display-lg text-xl text-deep-navy uppercase tracking-wider">My Wishlist</h1>
                  <p className="font-body-md text-xs text-slate-grey mt-1">Your saved architectural fine jewelry selections.</p>
                </header>

                {wishlist.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 px-4 text-center border border-dashed border-slate-grey/25 bg-soft-linen/20 space-y-4">
                    <span className="material-symbols-outlined text-slate-grey text-5xl" style={{ fontVariationSettings: "'wght' 200" }}>
                      favorite_border
                    </span>
                    <div className="space-y-1">
                      <h3 className="font-headline-md text-slate-grey text-base uppercase tracking-wider">Your Wishlist is Empty</h3>
                      <p className="font-body-md text-slate-grey text-xs max-w-xs mx-auto">
                        Save your favorite architectural fine jewelry pieces here to inspect or order them anytime.
                      </p>
                    </div>
                    <Link
                      href="/products"
                      className="font-button text-xs uppercase px-8 py-3.5 bg-deep-navy text-pure-white hover:bg-ink-black transition-colors tracking-widest mt-2 inline-block"
                    >
                      EXPLORE CATALOGUE
                    </Link>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
                    {wishlist.map((item) => (
                      <div key={item.id} className="border border-slate-grey/15 p-4 flex gap-4 bg-pure-white hover:border-slate-grey/30 transition-colors">
                        <Link href={`/product/${item.id}`} className="w-20 h-24 bg-soft-linen relative shrink-0 overflow-hidden block">
                          <Image src={item.image} alt={item.title} fill className="object-cover mix-blend-multiply" sizes="80px" />
                        </Link>
                        <div className="flex-grow flex flex-col justify-between">
                          <div className="space-y-1">
                            <span className="text-[9px] font-label-caps text-slate-grey uppercase tracking-widest block truncate">{item.material || "Fine Jewelry"}</span>
                            <Link href={`/product/${item.id}`}>
                              <h4 className="font-body-md text-xs text-deep-navy uppercase font-semibold hover:underline line-clamp-1">{item.title}</h4>
                            </Link>
                            <p className="font-body-md text-xs text-ink-black font-semibold mt-1">{formatPrice(item.price)}</p>
                          </div>
                          <div className="flex gap-4 pt-2">
                            <button
                              type="button"
                              onClick={() => {
                                const updated = wishlist.filter(w => w.id !== item.id);
                                setWishlist(updated);
                                const key = getWishlistKey(user?.email);
                                const ids = updated.map(w => w.id);
                                localStorage.setItem(key, JSON.stringify(ids));
                                localStorage.setItem("vrix-wishlist", JSON.stringify(ids));
                                triggerFeedback("Removed from wishlist.");
                              }}
                              className="font-button text-[9px] tracking-widest text-red-600 uppercase cursor-pointer hover:underline"
                            >
                              REMOVE
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* 4. ADDRESSES TAB */}
            {activeTab === "addresses" && (
              <div className="space-y-6 animate-fade-in transition-opacity duration-500 ease-out">
                <header className="border-b border-slate-grey/15 pb-4 flex justify-between items-center">
                  <div>
                    <h1 className="font-display-lg text-xl text-deep-navy uppercase tracking-wider">Shipping Addresses</h1>
                    <p className="font-body-md text-xs text-slate-grey mt-1">Manage your primary delivery location for 1-click checkout.</p>
                  </div>
                  {!isEditingAddress && (
                    <button
                      onClick={() => { setEditingAddressId(null); setShippingAddress({ street: "", city: "", state: "", zip: "", country: "IN", phone: "", useSamePhone: true }); setIsEditingAddress(true); }}
                      className="font-label-caps text-xs text-deep-navy border border-deep-navy px-4 py-2 hover:bg-deep-navy hover:text-pure-white transition-colors cursor-pointer"
                    >
                      + ADD ADDRESS
                    </button>
                  )}
                </header>

                {isEditingAddress ? (
                  <form onSubmit={async (e) => {
                    e.preventDefault();
                    const savedObj = {
                      ...shippingAddress,
                      phone: shippingAddress.useSamePhone ? profile.phone : shippingAddress.phone
                    };
                    setShippingAddress(savedObj);
                    if (!user?.email) return;
                    try {
                      await saveAddress(user.email, {
                        label: "Home",
                        fullName: `${profile.firstName} ${profile.lastName}`.trim() || user.name || "VRIX Member",
                        phone: savedObj.phone,
                        address: savedObj.street,
                        apartment: null,
                        city: savedObj.city,
                        state: savedObj.state,
                        postalCode: savedObj.zip,
                        country: savedObj.country,
                        isDefault: savedAddresses.length === 0 || savedAddresses.find((item) => item.id === editingAddressId)?.isDefault || false,
                      }, editingAddressId || undefined);
                      setSavedAddresses(await fetchSavedAddresses(user.email));
                      setIsEditingAddress(false);
                      setEditingAddressId(null);
                      triggerFeedback("Address saved successfully.");
                    } catch (error) { setAuthError(error instanceof Error ? error.message : "Could not save address."); }
                  }} className="space-y-5">
                    {[
                      { label: "Street Address", field: "street" as const, placeholder: "Building, Flat / House No., Street" },
                      { label: "City", field: "city" as const, placeholder: "City / Town" },
                      { label: "State", field: "state" as const, placeholder: "State / Province" },
                      { label: "ZIP Code", field: "zip" as const, placeholder: "Postal / PIN Code" },
                      { label: "Country", field: "country" as const, placeholder: "Country" },
                    ].map(({ label, field, placeholder }) => (
                      <div key={field} className="flex flex-col gap-1.5">
                        <label className="font-label-caps text-[9px] text-slate-grey uppercase tracking-widest">{label}</label>
                        <input
                          type="text"
                          value={shippingAddress[field]}
                          onChange={(e) => setShippingAddress({ ...shippingAddress, [field]: e.target.value })}
                          placeholder={placeholder}
                          required
                          className="border-b border-slate-grey/30 py-2 focus:border-deep-navy outline-none font-body-md text-sm text-ink-black bg-transparent"
                        />
                      </div>
                    ))}

                    <div className="flex gap-4 pt-4">
                      <button type="submit" className="font-button text-xs uppercase px-8 py-3 bg-deep-navy text-pure-white hover:bg-ink-black transition-colors cursor-pointer">Save Address</button>
                      <button type="button" onClick={() => setIsEditingAddress(false)} className="font-button text-xs uppercase px-8 py-3 border border-slate-grey/30 text-slate-grey hover:text-ink-black cursor-pointer">Cancel</button>
                    </div>
                  </form>
                ) : savedAddresses.length > 0 ? (
                  <div className="grid gap-3">
                    {savedAddresses.map((item) => <div key={item.id} className="bg-soft-linen/30 border border-slate-grey/15 p-5 flex justify-between gap-4">
                      <div className="space-y-1"><span className="font-label-caps text-[10px] text-slate-grey uppercase tracking-widest block">{item.label}{item.isDefault ? " · Default" : ""}</span><p className="font-body-md text-sm text-deep-navy font-semibold">{item.fullName}</p><p className="font-body-md text-xs text-slate-grey">{[item.address, item.apartment, item.city, item.state, item.postalCode, item.country].filter(Boolean).join(", ")}</p><p className="font-body-md text-xs text-slate-grey">{item.phone}</p></div>
                      <div className="flex flex-col gap-2 text-[10px] uppercase tracking-widest"><button onClick={() => { setEditingAddressId(item.id); setShippingAddress({ street: item.address, city: item.city, state: item.state || "", zip: item.postalCode, country: item.country, phone: item.phone || "", useSamePhone: !item.phone || item.phone === profile.phone }); setIsEditingAddress(true); }} className="text-deep-navy cursor-pointer">Edit</button><button onClick={async () => { if (!user?.email || !confirm("Remove this address?")) return; await deleteSavedAddress(user.email, item.id); setSavedAddresses(await fetchSavedAddresses(user.email)); }} className="text-red-600 cursor-pointer">Remove</button></div>
                    </div>)}
                  </div>
                ) : (
                  <div className="bg-soft-linen/20 border border-dashed border-slate-grey/20 p-8 text-center space-y-4">
                    <div className="w-12 h-12 bg-pure-white rounded-full flex items-center justify-center mx-auto text-slate-grey shadow-xs">
                      <span className="material-symbols-outlined text-[24px]">location_on</span>
                    </div>
                    <div className="space-y-1">
                      <h4 className="font-label-caps text-xs text-deep-navy uppercase font-semibold">No Address Saved</h4>
                      <p className="font-body-md text-xs text-slate-grey max-w-sm mx-auto">
                        Add your primary delivery address for 1-click checkouts and shipping.
                      </p>
                    </div>
                    <button
                      onClick={() => { setEditingAddressId(null); setIsEditingAddress(true); }}
                      className="font-button text-xs uppercase px-6 py-2.5 bg-deep-navy text-pure-white hover:bg-ink-black transition-colors cursor-pointer"
                    >
                      + Add Address
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* 5. ACCOUNT DETAILS TAB */}
            {activeTab === "account" && (
              <div className="space-y-6 animate-fade-in transition-opacity duration-500 ease-out">
                <header className="border-b border-slate-grey/15 pb-4">
                  <h1 className="font-display-lg text-xl text-deep-navy uppercase tracking-wider">Account Details</h1>
                  <p className="font-body-md text-xs text-slate-grey mt-1">Update your profile information and contact details.</p>
                </header>

                <form onSubmit={async (e) => {
                  e.preventDefault();
                  const fullName = `${profile.firstName} ${profile.lastName}`.trim();
                  try {
                    const apiBaseUrl = getApiBaseUrl();
                    await fetch(`${apiBaseUrl}/auth/profile`, {
                      method: "PUT",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ email: authEmail, name: fullName, phone: profile.phone, dateOfBirth: profile.dateOfBirth })
                    });
                  } catch (err) {
                    console.error("Failed to persist user profile to DB:", err);
                  }
                  login(authEmail, { name: fullName, phone: profile.phone, dateOfBirth: profile.dateOfBirth, isVrixPlusMember: user?.isVrixPlusMember });
                  triggerFeedback("Account details updated successfully.");
                }} className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    {[{ label: "First Name", field: "firstName" as const }, { label: "Last Name", field: "lastName" as const }].map(({ label, field }) => (
                      <div key={field} className="flex flex-col gap-1.5">
                        <label className="font-label-caps text-[9px] text-slate-grey uppercase tracking-widest">{label}</label>
                        <input type="text" value={profile[field]} onChange={(e) => setProfile({ ...profile, [field]: e.target.value })} required className="border-b border-slate-grey/30 py-2 focus:border-deep-navy outline-none font-body-md text-sm text-ink-black bg-transparent" />
                      </div>
                    ))}
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="font-label-caps text-[9px] text-slate-grey uppercase tracking-widest">Phone / Mobile Number</label>
                    <input
                      type="tel"
                      value={profile.phone}
                      onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                      placeholder="+91 98765 43210"
                      className="border-b border-slate-grey/30 py-2 focus:border-deep-navy outline-none font-body-md text-sm text-ink-black bg-transparent"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="font-label-caps text-[9px] text-slate-grey uppercase tracking-widest">Date of Birth</label>
                    <input
                      type="date"
                      value={profile.dateOfBirth || ""}
                      onChange={(e) => setProfile({ ...profile, dateOfBirth: e.target.value })}
                      className="border-b border-slate-grey/30 py-2 focus:border-deep-navy outline-none font-body-md text-sm text-ink-black max-w-xs bg-transparent"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="font-label-caps text-[9px] text-slate-grey uppercase tracking-widest">Verified Email</label>
                    <div className="flex items-center gap-2 border-b border-slate-grey/20 py-2">
                      <span className="material-symbols-outlined text-emerald-600 text-[16px]">verified</span>
                      <span className="font-body-md text-sm text-ink-black">{authEmail}</span>
                    </div>
                  </div>

                  <button type="submit" className="font-button text-xs uppercase px-10 py-4 bg-deep-navy text-pure-white hover:bg-ink-black transition-colors cursor-pointer">
                    Save Profile
                  </button>
                </form>
              </div>
            )}

            {/* 6. VRIX+ CLUB TAB */}
            {activeTab === "vrix_plus" && (
              <div className="space-y-6 animate-fade-in transition-opacity duration-500 ease-out">
                <header className="border-b border-slate-grey/15 pb-4">
                  <span className="font-label-caps text-[9px] text-[#B59D7C] uppercase tracking-[0.3em] font-semibold block mb-1">
                    PRIVATE MEMBER CIRCLE
                  </span>
                  <h1 className="font-display-lg text-xl text-deep-navy uppercase">VRIX+ Club</h1>
                  <p className="font-body-md text-xs text-slate-grey mt-1">
                    Exclusive member privileges, complimentary priority shipping, and private sales.
                  </p>
                </header>

                {user?.isVrixPlusMember ? (
                  <div className="space-y-6">
                    <div className="relative overflow-hidden bg-gradient-to-br from-[#0F1728] via-[#1B263B] to-[#0F1728] text-pure-white p-6 md:p-8 border border-[#B59D7C]/40 shadow-xl space-y-5">
                      <div className="flex justify-between items-start">
                        <div className="space-y-1">
                          <span className="font-label-caps text-[9px] tracking-[0.3em] uppercase text-[#B59D7C] font-bold">
                            VIP MEMBER PASS
                          </span>
                          <h2 className="font-display-lg text-xl md:text-2xl tracking-widest uppercase">VRIX+ CIRCLE</h2>
                        </div>
                        <span className="px-3 py-1 bg-[#B59D7C]/20 border border-[#B59D7C] text-[#B59D7C] text-[9px] font-label-caps uppercase tracking-widest font-bold rounded-full">
                          ACTIVE
                        </span>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-4 border-t border-pure-white/10 text-xs font-body-md">
                        <div>
                          <span className="font-label-caps text-[8px] text-pure-white/60 uppercase tracking-widest block mb-0.5">MEMBER ID</span>
                          <span className="font-mono text-xs font-semibold text-pure-white">
                            VP-{user.email ? user.email.slice(0, 4).toUpperCase() : "8821"}
                          </span>
                        </div>
                        <div>
                          <span className="font-label-caps text-[8px] text-pure-white/60 uppercase tracking-widest block mb-0.5">TIER</span>
                          <span className="font-label-caps text-[10px] text-[#B59D7C] font-bold uppercase tracking-widest">
                            BLACK TIER
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {[
                        { icon: "verified_user", title: "5% Automatic Discount", desc: "Applied automatically at checkout on all purchases." },
                        { icon: "local_shipping", title: "Complimentary Express Delivery", desc: "Free priority insured express shipping on every order." },
                      ].map((perk) => (
                        <div key={perk.title} className="p-4 border border-slate-grey/15 bg-soft-linen/20 flex items-start gap-3">
                          <span className="material-symbols-outlined text-[#B59D7C] text-[20px] shrink-0">{perk.icon}</span>
                          <div className="space-y-0.5">
                            <h4 className="font-headline-md text-xs text-deep-navy font-semibold uppercase">{perk.title}</h4>
                            <p className="font-body-md text-[11px] text-slate-grey leading-relaxed">{perk.desc}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="border border-slate-grey/25 p-8 text-center space-y-5 bg-gradient-to-b from-soft-linen/30 to-pure-white">
                    <span className="font-label-caps text-[9px] tracking-[0.3em] uppercase text-[#B59D7C] font-semibold">
                      JOIN THE CIRCLE
                    </span>
                    <h3 className="font-display-lg text-xl text-deep-navy uppercase tracking-wider max-w-md mx-auto">
                      Elevate Your Experience with VRIX+
                    </h3>
                    <p className="font-body-md text-xs text-slate-grey max-w-sm mx-auto leading-relaxed">
                      Enjoy exclusive 5% member discounts, complimentary express worldwide delivery, signature gift packaging, and private collection access.
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
                      className="px-8 py-3.5 bg-deep-navy text-pure-white font-button text-xs uppercase tracking-widest hover:bg-ink-black transition-colors cursor-pointer"
                    >
                      Activate VRIX+ Membership
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* 7. LOGOUT TAB */}
            {activeTab === "logout" && (
              <div className="space-y-6 animate-fade-in transition-opacity duration-500 ease-out text-center py-12">
                <span className="material-symbols-outlined text-deep-navy text-5xl">logout</span>
                <div className="space-y-2 max-w-sm mx-auto">
                  <h3 className="font-headline-md text-deep-navy text-lg uppercase tracking-wider">Confirm Sign Out</h3>
                  <p className="font-body-md text-xs text-slate-grey">Are you sure you want to log out of your VRIX account?</p>
                </div>
                <div className="flex gap-4 justify-center pt-4">
                  <button onClick={handleAccountLogout} className="font-button text-xs uppercase px-8 py-3 bg-deep-navy text-pure-white hover:bg-ink-black transition-colors cursor-pointer">
                    Sign Out
                  </button>
                  <button onClick={() => setActiveTab("dashboard")} className="font-button text-xs uppercase px-8 py-3 border border-slate-grey/30 text-slate-grey hover:text-ink-black transition-colors cursor-pointer">
                    Cancel
                  </button>
                </div>
              </div>
            )}

          </section>
        </div>
      </main>
    </div>
  );
}
