"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { fetchDb, loginUserDirect, registerUser, confirmRegistration, confirmLogin } from "@/utils/api";
import SkeletonImage from "@/components/shop/SkeletonImage";

interface AuthDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AuthDrawer({ isOpen, onClose }: AuthDrawerProps) {
  const { login, isLoggedIn, user, logout } = useAuth();

  const [cms, setCms] = useState<any>({
    programName: "VRIX+ Circle",
    subheading: "Get exclusive updates on promotions, products & more.",
    bannerImage: "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?q=80&w=1200&auto=format&fit=crop",
    benefits: [
      "15% Off Permanent Jewelry",
      "Early Sale Access",
      "Exclusive First Looks",
      "Unique Perks & Birthday Treats"
    ]
  });

  const [authMode, setAuthMode] = useState<"signin" | "signup">("signin");
  const [authStep, setAuthStep] = useState<"email" | "otp">("email");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [otpInput, setOtpInput] = useState(["", "", "", "", "", ""]);
  const [optinEmail, setOptinEmail] = useState(true);
  const [optinSms, setOptinSms] = useState(true);
  const [rememberMe, setRememberMe] = useState(true);
  const [joinVrixPlus, setJoinVrixPlus] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    fetchDb()
      .then((res) => {
        if (res.vrix_plus) {
          setCms({
            programName: res.vrix_plus.programName || "VRIX+ Circle",
            subheading: res.vrix_plus.subheading || "Get exclusive updates on promotions, products & more.",
            bannerImage: res.vrix_plus.bannerImage || "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?q=80&w=1200&auto=format&fit=crop",
            benefits: Array.isArray(res.vrix_plus.benefits)
              ? res.vrix_plus.benefits.map((b: any) => (typeof b === "string" ? b : b.title))
              : [
                  "15% Off Permanent Jewelry",
                  "Early Sale Access",
                  "Exclusive First Looks",
                  "Unique Perks & Birthday Treats"
                ]
          });
        }
      })
      .catch((err) => console.error("Error loading AuthDrawer CMS:", err));
  }, []);

  if (!isOpen) return null;

  const triggerToast = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(null), 3500);
  };

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setLoading(true);
    setErrorMsg(null);
    try {
      if (authMode === "signup") {
        if (!name) { setErrorMsg("Name is required for registration."); setLoading(false); return; }
        await registerUser({ email, password, name, phone });
        triggerToast("Verification code sent to your email!");
        setAuthStep("otp");
      } else {
        const res = await loginUserDirect({ email, password });
        login(email, { name: res.user.name, phone: res.user.phone, isVrixPlusMember: res.user.isVrixPlusMember });
        triggerToast("Welcome back to VRIX!");
        onClose();
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Authentication failed. Please check credentials.");
    } finally {
      setLoading(false);
    }
  };

  const handleOtpVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = otpInput.join("");
    if (code.length < 6) { setErrorMsg("Please enter the 6-digit code."); return; }
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await confirmRegistration({ email, otp: code, password, name, phone });
      let isVrixMember = res.user?.isVrixPlusMember ?? false;

      if (joinVrixPlus) {
        try {
          const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
          await fetch(`${apiBaseUrl}/auth/join-vrix-plus`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: res.user.email })
          });
          isVrixMember = true;
        } catch (e) {
          console.error("VRIX+ join error during signup:", e);
        }
      }

      login(email, { name: res.user.name, phone: res.user.phone, isVrixPlusMember: isVrixMember });
      triggerToast(isVrixMember ? "Welcome to VRIX+ Circle!" : "Account created successfully!");
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || "Invalid OTP code.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    login("member@vrix.com", { name: "VRIX Member", phone: "+1 555-0192", isVrixPlusMember: false });
    triggerToast("Signed in with Google!");
    onClose();
  };

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs transition-opacity duration-300"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="fixed top-0 right-0 z-50 h-screen w-full sm:w-[480px] bg-pure-white text-ink-black shadow-2xl flex flex-col transition-transform duration-300 ease-out overflow-y-auto">
        
        {/* Toast */}
        {successMsg && (
          <div className="absolute top-4 left-4 right-4 z-50 bg-deep-navy text-pure-white px-4 py-3 text-xs font-body-md shadow-lg flex items-center justify-between animate-fade-in">
            <span>{successMsg}</span>
            <button onClick={() => setSuccessMsg(null)}>✕</button>
          </div>
        )}

        {/* Top Header */}
        <div className="p-4 border-b border-soft-linen flex justify-between items-center bg-pure-white sticky top-0 z-10">
          <span className="font-label-caps text-xs tracking-widest text-deep-navy font-semibold uppercase">
            {isLoggedIn ? "Account Profile" : cms.programName}
          </span>
          <button 
            onClick={onClose}
            className="p-1 text-slate-grey hover:text-ink-black transition-colors cursor-pointer"
            aria-label="Close panel"
          >
            <span className="material-symbols-outlined text-2xl font-light">close</span>
          </button>
        </div>

        {isLoggedIn ? (
          /* LOGGED IN VIEW */
          <div className="p-8 space-y-6 flex-grow flex flex-col justify-between">
            <div className="space-y-4">
              <div className="w-16 h-16 bg-[#F5F4F0] text-deep-navy rounded-full flex items-center justify-center font-display-lg text-2xl border border-slate-grey/20">
                {user?.name?.[0] || "V"}
              </div>
              <div>
                <h3 className="font-display-lg text-xl text-deep-navy uppercase">{user?.name || "VRIX Member"}</h3>
                <p className="font-body-md text-xs text-slate-grey">{user?.email}</p>
                {user?.isVrixPlusMember && (
                  <span className="inline-flex items-center gap-1 mt-2 text-[10px] font-label-caps text-[#B59D7C] bg-[#F5F4F0] px-2.5 py-1 uppercase tracking-widest font-semibold border border-[#B59D7C]/30">
                    ★ VRIX+ Member Active
                  </span>
                )}
              </div>
            </div>

            <div className="space-y-3 pt-6 border-t border-soft-linen">
              <Link 
                href="/account"
                onClick={onClose}
                className="w-full block py-3.5 text-center bg-black text-white uppercase tracking-widest text-xs font-button hover:bg-black/90 transition-colors"
              >
                Go to Account Dashboard
              </Link>
              <button 
                onClick={() => {
                  logout();
                  triggerToast("Logged out successfully.");
                  onClose();
                }}
                className="w-full py-3.5 border border-slate-grey/30 text-ink-black uppercase tracking-widest text-xs font-button hover:border-black transition-colors cursor-pointer"
              >
                Sign Out
              </button>
            </div>
          </div>
        ) : (
          /* NOT LOGGED IN MONICA VINADER STYLE SIGN-IN FORM */
          <div className="flex-grow flex flex-col">
            
            {/* MV Circle Promo Section */}
            <section className="bg-[#FAF8F5] p-6 border-b border-soft-linen relative overflow-hidden">
              <div className="relative h-36 w-full mb-4 overflow-hidden rounded-xs">
                <SkeletonImage
                  src={cms.bannerImage}
                  alt={cms.programName}
                  fill
                  className="object-cover"
                  sizes="480px"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-3">
                  <h3 className="font-display-lg text-white text-xl tracking-widest uppercase">{cms.programName}</h3>
                </div>
              </div>

              <p className="font-body-md text-xs text-slate-grey mb-3">{cms.subheading}</p>
              
              <ul className="grid grid-cols-2 gap-2 text-[11px] font-label-caps text-deep-navy">
                {cms.benefits.map((benefit: string, idx: number) => (
                  <li key={idx} className="flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[14px] text-green-700 font-bold">check</span>
                    <span>{benefit}</span>
                  </li>
                ))}
              </ul>
            </section>

            {/* Form Section */}
            <div className="p-6 space-y-6 flex-grow">
              
              {/* Sign In vs Register Toggle */}
              <div className="flex border-b border-soft-linen pb-2 gap-6 font-label-caps text-xs tracking-widest">
                <button
                  type="button"
                  onClick={() => { setAuthMode("signin"); setErrorMsg(null); }}
                  className={`pb-1 transition-all cursor-pointer ${authMode === "signin" ? "border-b-2 border-black text-black font-semibold" : "text-slate-grey hover:text-black"}`}
                >
                  SIGN IN
                </button>
                <button
                  type="button"
                  onClick={() => { setAuthMode("signup"); setErrorMsg(null); }}
                  className={`pb-1 transition-all cursor-pointer ${authMode === "signup" ? "border-b-2 border-black text-black font-semibold" : "text-slate-grey hover:text-black"}`}
                >
                  SIGN UP
                </button>
              </div>

              {/* Social Logins */}
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={handleGoogleLogin}
                  className="w-full py-3 border border-slate-grey/30 text-ink-black font-button text-xs uppercase tracking-wider hover:bg-soft-linen transition-colors flex items-center justify-center gap-2 cursor-pointer"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"/>
                    <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.26v3.15C3.25 21.32 7.33 24 12 24z"/>
                    <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.26C.46 8.18 0 10.02 0 12s.46 3.82 1.26 5.42l4.02-3.15z"/>
                    <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.25 2.68 1.26 6.58l4.02 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
                  </svg>
                  Continue with Google
                </button>
              </div>

              {/* Separator */}
              <div className="flex items-center gap-3 text-slate-grey/40 my-2">
                <div className="h-[1px] bg-slate-grey/20 flex-grow"></div>
                <span className="text-[10px] font-label-caps uppercase tracking-widest text-slate-grey">OR</span>
                <div className="h-[1px] bg-slate-grey/20 flex-grow"></div>
              </div>

              {/* Form Input */}
              {authStep === "email" ? (
                <form onSubmit={handleAuthSubmit} className="space-y-4">
                  {authMode === "signup" && (
                    <div className="space-y-1">
                      <label className="font-label-caps text-[9px] uppercase tracking-widest text-slate-grey block">Full Name</label>
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Your Name"
                        required
                        className="w-full border-b border-slate-grey/30 py-2 text-sm text-ink-black focus:border-black outline-none bg-transparent"
                      />
                    </div>
                  )}

                  <div className="space-y-1">
                    <label className="font-label-caps text-[9px] uppercase tracking-widest text-slate-grey block">Email Address</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="your@email.com"
                      required
                      className="w-full border-b border-slate-grey/30 py-2 text-sm text-ink-black focus:border-black outline-none bg-transparent"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-label-caps text-[9px] uppercase tracking-widest text-slate-grey block">Password</label>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      className="w-full border-b border-slate-grey/30 py-2 text-sm text-ink-black focus:border-black outline-none bg-transparent"
                    />
                  </div>

                  {/* Checkboxes */}
                  <div className="space-y-2 pt-2 text-[11px] text-slate-grey font-body-md">
                    <label className="flex items-start gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={optinEmail}
                        onChange={(e) => setOptinEmail(e.target.checked)}
                        className="mt-0.5"
                      />
                      <span>Emails about private sales + new launches</span>
                    </label>
                    <label className="flex items-start gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={optinSms}
                        onChange={(e) => setOptinSms(e.target.checked)}
                        className="mt-0.5"
                      />
                      <span>Text messages about private sales + new launches</span>
                    </label>
                    <label className="flex items-start gap-2 cursor-pointer pt-1">
                      <input
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className="mt-0.5"
                      />
                      <span className="font-semibold text-ink-black">Keep me signed in</span>
                    </label>

                    {authMode === "signup" && (
                      <label className="flex items-start gap-2 cursor-pointer pt-1 border-t border-slate-grey/15 mt-2">
                        <input
                          type="checkbox"
                          checked={joinVrixPlus}
                          onChange={(e) => setJoinVrixPlus(e.target.checked)}
                          className="mt-0.5"
                        />
                        <span className="font-semibold text-deep-navy">Join VRIX+ Circle (Exclusive Member Access & Perks)</span>
                      </label>
                    )}
                  </div>

                  {errorMsg && <p className="text-xs text-red-600 font-body-md">{errorMsg}</p>}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-4 bg-black text-white uppercase tracking-widest text-xs font-button hover:bg-black/90 transition-colors flex items-center justify-center gap-2 cursor-pointer mt-4"
                  >
                    {loading ? (
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <span>Continue</span>
                        <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                      </>
                    )}
                  </button>
                </form>
              ) : (
                /* OTP CODE VERIFICATION */
                <form onSubmit={handleOtpVerify} className="space-y-4">
                  <p className="text-xs text-slate-grey">Enter the 6-digit confirmation code sent to <strong>{email}</strong></p>
                  <div className="flex gap-2 justify-between py-2">
                    {otpInput.map((digit, i) => (
                      <input
                        key={i}
                        ref={(el) => { otpRefs.current[i] = el; }}
                        type="text"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (!/^\d?$/.test(val)) return;
                          const next = [...otpInput];
                          next[i] = val;
                          setOtpInput(next);
                          if (val && i < 5) otpRefs.current[i + 1]?.focus();
                        }}
                        className="w-10 h-12 text-center text-lg font-semibold border border-slate-grey/30 focus:border-black outline-none"
                      />
                    ))}
                  </div>

                  {errorMsg && <p className="text-xs text-red-600 font-body-md">{errorMsg}</p>}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-4 bg-black text-white uppercase tracking-widest text-xs font-button hover:bg-black/90 transition-colors flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {loading ? (
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      "Verify & Sign In"
                    )}
                  </button>
                </form>
              )}

              {/* Legal Footer */}
              <div className="pt-4 border-t border-soft-linen text-[10px] text-slate-grey leading-relaxed text-center">
                By using this service you agree to our{" "}
                <Link href="/legal?tab=terms" className="underline hover:text-black">Terms & Conditions</Link> and{" "}
                <Link href="/legal?tab=privacy" className="underline hover:text-black">Privacy Policy</Link>.
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
