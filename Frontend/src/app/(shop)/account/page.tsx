"use client";

import React, { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  registerUser,
  confirmRegistration,
  loginUser,
  confirmLogin,
  addSecurityLog,
  fetchProducts,
  fetchDb,
  verifyTruecaller
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
  const [profile, setProfile] = useState({ 
    firstName: user?.name?.split(" ")[0] || "Vraj", 
    lastName: user?.name?.split(" ").slice(1).join(" ") || "Shah", 
    email: user?.email || "", 
    phone: user?.phone || "+1 (555) 019-2834" 
  });
  const [passwordState, setPasswordState] = useState({ current: "", new: "", confirm: "" });
  const [shippingAddress, setShippingAddress] = useState({
    street: "100 Minimalist Way, Suite 400",
    city: "New York",
    state: "NY",
    zip: "10001",
    country: "United States",
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
        firstName: user.name?.split(" ")[0] || "Vraj",
        lastName: user.name?.split(" ").slice(1).join(" ") || "Shah",
        email: user.email,
        phone: user.phone || "+1 (555) 019-2834"
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

  const [orders] = useState<Order[]>([
    { id: "#VRIX12345", date: "May 18, 2026", amount: "$340.00", status: "Processing" },
    { id: "#VRIX12312", date: "April 30, 2026", amount: "$620.00", status: "Delivered" },
    { id: "#VRIX12289", date: "March 15, 2026", amount: "$890.00", status: "Delivered" },
  ]);

  // ── Helpers ─────────────────────────────────────────────────────────────────
  const triggerFeedback = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(null), 3500);
  };

  // ── Auth Handlers ──────────────────────────────────────────────────────────
  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authEmail || !authPassword) return;
    setAuthLoading(true);
    setAuthError(null);
    try {
      if (authMode === "signup") {
        if (!authName) { setAuthError("Name is required for registration."); setAuthLoading(false); return; }
        await registerUser({ email: authEmail, password: authPassword, name: authName, phone: authPhone });
        triggerFeedback("Verification code sent to your email!");
      } else {
        await loginUser({ email: authEmail, password: authPassword });
        triggerFeedback("Sign in code sent to your email!");
      }
      setAuthStep("otp");
    } catch (err: any) {
      setAuthError(err.message || "Authentication request failed. Please try again.");
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
    if (code.length < 6) { setAuthError("Please enter the 6-digit code."); return; }
    setAuthLoading(true);
    setAuthError(null);
    try {
      if (authMode === "signup") {
        const res = await confirmRegistration({
          email: authEmail,
          otp: code,
          password: authPassword,
          name: authName,
          phone: authPhone
        });
        login(authEmail, { name: res.user.name, phone: res.user.phone });
        triggerFeedback("Account verified! Welcome to VRIX.");
      } else {
        const res = await confirmLogin({
          email: authEmail,
          otp: code
        });
        login(authEmail, { name: res.user.name, phone: res.user.phone });
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
    { key: "rewards", label: "Rewards", icon: "stars" },
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
                    authMode === "signup" ? "Verify & Register" : "Send Verification Code"
                  )}
                </button>
              </form>

              {/* Truecaller Login Block */}
              {truecallerEnabled && (
                <div className="pt-4 border-t border-slate-grey/15 space-y-4">
                  <p className="text-center text-[10px] font-label-caps text-slate-grey tracking-wider uppercase">Or login instantly</p>
                  <button
                    type="button"
                    onClick={handleTruecallerVerification}
                    className="w-full bg-[#0087FF] text-pure-white py-3.5 font-button text-xs uppercase tracking-widest hover:bg-[#0076E5] transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                  >
                    <span className="material-symbols-outlined text-[16px]">bolt</span>
                    Sign in with Truecaller
                  </button>
                </div>
              )}

              <p className="text-center text-[11px] text-slate-grey font-body-md leading-relaxed">
                For your security, we'll send a 6-digit confirmation code to your email.
              </p>
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
              <header className="border-b border-slate-grey/15 pb-4">
                <h1 className="font-headline-md text-2xl text-deep-navy uppercase">Welcome back, {profile.firstName}.</h1>
                <p className="font-body-md text-sm text-slate-grey mt-1">Here is a quick overview of your VRIX member account activity.</p>
              </header>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                  { label: "Total Orders", value: orders.length },
                  { label: "Reward Points", value: "320" },
                  { label: "Wishlist Items", value: wishlist.length },
                  { label: "Member Tier", value: "Platinum" },
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
                    </tr></thead>
                    <tbody className="font-body-md text-sm text-deep-navy divide-y divide-slate-grey/10">
                      {orders.slice(0, 2).map((order) => (
                        <tr key={order.id} className="hover:bg-soft-linen/20 transition-colors">
                          <td className="py-4 font-semibold">{order.id}</td>
                          <td className="py-4 text-slate-grey">{order.date}</td>
                          <td className="py-4">{order.amount}</td>
                          <td className="py-4"><span className="inline-flex px-2 py-0.5 border border-slate-grey/20 text-[9px] font-label-caps uppercase tracking-wider text-deep-navy">{order.status}</span></td>
                        </tr>
                      ))}
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
                    {orders.map((order) => (
                      <tr key={order.id} className="hover:bg-soft-linen/20 transition-colors">
                        <td className="py-4 font-semibold">{order.id}</td>
                        <td className="py-4 text-slate-grey">{order.date}</td>
                        <td className="py-4">{order.amount}</td>
                        <td className="py-4"><span className="inline-flex px-2 py-0.5 border border-slate-grey/20 text-[9px] font-label-caps uppercase tracking-wider">{order.status}</span></td>
                        <td className="py-4 text-right">
                          <button onClick={() => triggerFeedback(`Invoice for ${order.id} downloading...`)} className="font-button text-[10px] tracking-wider text-deep-navy hover:text-slate-grey underline uppercase cursor-pointer">Invoice</button>
                        </td>
                      </tr>
                    ))}
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
                <form onSubmit={(e) => { e.preventDefault(); setIsEditingAddress(false); triggerFeedback("Address saved."); }} className="space-y-6">
                  {[
                    { label: "Street Address", field: "street" as const },
                    { label: "City", field: "city" as const },
                    { label: "State", field: "state" as const },
                    { label: "ZIP Code", field: "zip" as const },
                    { label: "Country", field: "country" as const },
                  ].map(({ label, field }) => (
                    <div key={field} className="flex flex-col gap-2">
                      <label className="font-label-caps text-[9px] text-slate-grey uppercase">{label}</label>
                      <input type="text" value={shippingAddress[field]} onChange={(e) => setShippingAddress({ ...shippingAddress, [field]: e.target.value })} required className="border-b border-slate-grey/30 py-1.5 focus:border-deep-navy outline-none font-body-md text-sm text-ink-black" />
                    </div>
                  ))}
                  <div className="flex gap-4">
                    <button type="submit" className="font-button text-xs uppercase px-8 py-3 bg-deep-navy text-pure-white hover:bg-ink-black transition-colors cursor-pointer">Save Address</button>
                    <button type="button" onClick={() => setIsEditingAddress(false)} className="font-button text-xs uppercase px-8 py-3 border border-slate-grey/30 text-slate-grey cursor-pointer">Cancel</button>
                  </div>
                </form>
              ) : (
                <div className="bg-surface/50 border border-slate-grey/15 p-6 space-y-2">
                  <h4 className="font-label-caps text-[10px] text-slate-grey uppercase tracking-wider mb-2">Primary Shipping Location</h4>
                  <p className="font-body-md text-sm text-deep-navy font-semibold">{profile.firstName} {profile.lastName}</p>
                  <p className="font-body-md text-sm text-slate-grey">{shippingAddress.street}</p>
                  <p className="font-body-md text-sm text-slate-grey">{shippingAddress.city}, {shippingAddress.state} {shippingAddress.zip}</p>
                  <p className="font-body-md text-sm text-slate-grey">{shippingAddress.country}</p>
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
              <form onSubmit={(e) => { e.preventDefault(); triggerFeedback("Account details updated."); }} className="space-y-8">
                <div className="grid grid-cols-2 gap-4">
                  {[{ label: "First Name", field: "firstName" as const }, { label: "Last Name", field: "lastName" as const }].map(({ label, field }) => (
                    <div key={field} className="flex flex-col gap-2">
                      <label className="font-label-caps text-[9px] text-slate-grey uppercase">{label}</label>
                      <input type="text" value={profile[field]} onChange={(e) => setProfile({ ...profile, [field]: e.target.value })} required className="border-b border-slate-grey/30 py-1.5 focus:border-deep-navy outline-none font-body-md text-sm text-ink-black" />
                    </div>
                  ))}
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

          {/* REWARDS */}
          {activeTab === "rewards" && (
            <div className="space-y-8 animate-fade-in">
              <header className="border-b border-slate-grey/15 pb-4">
                <h1 className="font-display-lg text-headline-md text-deep-navy uppercase">VRIX Rewards</h1>
              </header>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="border border-slate-grey/15 p-6 bg-surface/30 space-y-4">
                  <span className="font-label-caps text-[10px] text-slate-grey uppercase tracking-wider">Active Balance</span>
                  <h3 className="font-display-lg text-4xl text-deep-navy">320 pts</h3>
                  <div className="w-full bg-slate-grey/25 h-1"><div className="bg-deep-navy h-1 w-[64%]" /></div>
                  <p className="text-xs text-slate-grey font-body-md">180 points away from next tier.</p>
                </div>
                <div className="border border-slate-grey/15 p-6 bg-surface/30 space-y-2">
                  <span className="font-label-caps text-[10px] text-slate-grey uppercase tracking-wider">Member Tier</span>
                  <h3 className="font-headline-md text-xl text-deep-navy uppercase font-semibold">Platinum Level</h3>
                  <ul className="text-xs text-slate-grey space-y-2 pt-2 list-disc pl-4 font-body-md">
                    <li>Complimentary express delivery worldwide</li>
                    <li>Priority crafting queue on bespoke commissions</li>
                    <li>Exclusive preview access to seasonal collections</li>
                  </ul>
                </div>
              </div>
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
                <button onClick={() => { setAuthStep("email"); setAuthEmail(""); setOtpInput(["","","","","",""]); setActiveTab("dashboard"); }} className="font-button text-xs uppercase px-8 py-3 bg-deep-navy text-pure-white hover:bg-ink-black transition-colors cursor-pointer">Sign Out</button>
                <button onClick={() => setActiveTab("dashboard")} className="font-button text-xs uppercase px-8 py-3 border border-slate-grey/30 text-slate-grey hover:text-ink-black transition-colors cursor-pointer">Cancel</button>
              </div>
            </div>
          )}

        </section>
      </main>
    </div>
  );
}
