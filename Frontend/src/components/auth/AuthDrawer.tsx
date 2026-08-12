"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { fetchDb, loginUserDirect, registerUser, confirmRegistration, confirmLogin, getApiBaseUrl } from "@/utils/api";
import SkeletonImage from "@/components/shop/SkeletonImage";
import GoogleAuthButton from "@/components/auth/GoogleAuthButton";
import { Dialog } from "@base-ui/react/dialog";
import { useGSAP } from "@gsap/react";
import { gsap } from "@/lib/gsap";

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
  const [birthDate, setBirthDate] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [otpInput, setOtpInput] = useState(["", "", "", "", "", ""]);
  const [optinEmail, setOptinEmail] = useState(true);
  const [optinSms, setOptinSms] = useState(true);
  const [rememberMe, setRememberMe] = useState(true);
  const [joinVrixPlus, setJoinVrixPlus] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);
  const drawerRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

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

  // GSAP Right side drawer entry/exit animations
  useGSAP(() => {
    if (isOpen) {
      // Animate overlay backdrop
      if (overlayRef.current) {
        gsap.fromTo(overlayRef.current, { opacity: 0 }, { opacity: 1, duration: 0.35, ease: "power2.out" });
      }
      // Animate right drawer container panel
      if (drawerRef.current) {
        gsap.fromTo(drawerRef.current, { x: "100%" }, { x: "0%", duration: 0.38, ease: "power3.out" });
      }
    }
  }, [isOpen]);

  const triggerToast = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(null), 3500);
  };

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim().toLowerCase();
    const cleanName = name.trim();
    const cleanPhone = phone.trim();

    if (!cleanEmail || !password) {
      setErrorMsg("Email and password are required.");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      setErrorMsg("Please enter a valid email address.");
      return;
    }

    if (password.length < 6) {
      setErrorMsg("Password must be at least 6 characters long.");
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    try {
      if (authMode === "signup") {
        if (!cleanName) {
          setErrorMsg("Full name is required for registration.");
          setLoading(false);
          return;
        }
        await registerUser({ 
          email: cleanEmail, 
          password, 
          name: cleanName, 
          phone: cleanPhone,
          birthDate: birthDate || undefined
        });
        setOtpInput(["", "", "", "", "", ""]);
        triggerToast("Verification code sent to your email! Please enter it below.");
        setAuthStep("otp");
      } else {
        const res = await loginUserDirect({ email: cleanEmail, password });
        login(cleanEmail, { name: res.user.name, phone: res.user.phone, isVrixPlusMember: res.user.isVrixPlusMember });
        triggerToast("Welcome back to VRIX!");
        onClose();
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Authentication failed. Please check credentials.");
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    const cleanEmail = email.trim().toLowerCase();
    const cleanName = name.trim();
    const cleanPhone = phone.trim();
    setLoading(true);
    setErrorMsg(null);
    try {
      await registerUser({ 
        email: cleanEmail, 
        password, 
        name: cleanName, 
        phone: cleanPhone,
        birthDate: birthDate || undefined
      });
      setOtpInput(["", "", "", "", "", ""]);
      triggerToast("A new verification code has been sent to your email.");
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to resend code.");
    } finally {
      setLoading(false);
    }
  };

  const handleOtpVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = otpInput.join("");
    if (code.length < 6) { setErrorMsg("Please enter the complete 6-digit code."); return; }
    setLoading(true);
    setErrorMsg(null);
    try {
      const cleanEmail = email.trim().toLowerCase();
      const res = await confirmRegistration({ email: cleanEmail, otp: code, password, name: name.trim(), phone: phone.trim() });
      let isVrixMember = res.user?.isVrixPlusMember ?? false;

      if (joinVrixPlus) {
        try {
          const apiBaseUrl = getApiBaseUrl();
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

      login(cleanEmail, { name: res.user.name, phone: res.user.phone, isVrixPlusMember: isVrixMember });
      triggerToast(isVrixMember ? "Welcome to VRIX+ Circle!" : "Account created successfully!");
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || "Invalid or expired OTP code.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={(open: boolean) => !open && onClose()}>
      <Dialog.Portal>
        {/* Backdrop overlay */}
        <Dialog.Backdrop ref={overlayRef} className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs" />
        
        {/* Drawer content panel */}
        <Dialog.Popup
          ref={drawerRef}
          className="fixed top-0 right-0 z-50 h-screen w-full sm:w-[480px] bg-pure-white text-ink-black shadow-2xl flex flex-col overflow-y-auto outline-none"
        >
          {/* Toast Msg inside drawer container */}
          {successMsg && (
            <div className="absolute top-4 left-4 right-4 z-50 bg-deep-navy text-pure-white px-4 py-3 text-xs font-body-md shadow-lg flex items-center justify-between animate-fade-in">
              <span>{successMsg}</span>
              <button onClick={() => setSuccessMsg(null)}>✕</button>
            </div>
          )}

          {/* Header */}
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
            /* Logged in view */
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
            /* Form Panel */
            <div className="flex-grow flex flex-col">
              
              {/* Promo Banner block */}
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

              {/* Form Content */}
              <div className="p-6 space-y-6 flex-grow">
                
                {/* Form Navigation Mode toggle button tab row */}
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

                {/* Third party quick add buttons */}
                {authStep === "email" && (
                  <div className="pt-2 space-y-3">
                    <GoogleAuthButton
                      joinVrixPlus={joinVrixPlus}
                      onSuccess={(usr) => {
                        triggerToast(usr?.isVrixPlusMember ? "Welcome to VRIX+ Circle!" : "Welcome back to VRIX!");
                        onClose();
                      }}
                      onError={(err) => setErrorMsg(err)}
                      buttonText={authMode === "signup" ? "Sign Up with Google" : "Sign In with Google"}
                    />

                    <div className="flex items-center gap-3 my-2">
                      <div className="flex-1 h-[1px] bg-slate-grey/20" />
                      <span className="font-label-caps text-[9px] text-slate-grey uppercase tracking-widest">Or Continue With Email</span>
                      <div className="flex-1 h-[1px] bg-slate-grey/20" />
                    </div>
                  </div>
                )}

                {authStep === "email" ? (
                  <form onSubmit={handleAuthSubmit} className="space-y-4">
                    {authMode === "signup" && (
                      <>
                        <div className="relative border-b border-slate-grey/30 pt-3 group">
                          <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                            placeholder=" "
                            className="w-full py-1.5 text-sm text-ink-black outline-none bg-transparent peer"
                          />
                          <label className="absolute left-0 top-3 text-[11px] uppercase tracking-widest text-slate-grey pointer-events-none transition-all duration-200 peer-placeholder-shown:top-3 peer-placeholder-shown:text-sm peer-focus:top-[-6px] peer-focus:text-[9px] peer-[:not(:placeholder-shown)]:top-[-6px] peer-[:not(:placeholder-shown)]:text-[9px]">
                            Full Name
                          </label>
                        </div>

                        <div className="relative border-b border-slate-grey/30 pt-3 group">
                          <input
                            type="text"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            placeholder=" "
                            className="w-full py-1.5 text-sm text-ink-black outline-none bg-transparent peer"
                          />
                          <label className="absolute left-0 top-3 text-[11px] uppercase tracking-widest text-slate-grey pointer-events-none transition-all duration-200 peer-placeholder-shown:top-3 peer-placeholder-shown:text-sm peer-focus:top-[-6px] peer-focus:text-[9px] peer-[:not(:placeholder-shown)]:top-[-6px] peer-[:not(:placeholder-shown)]:text-[9px]">
                            Phone Number
                          </label>
                        </div>

                        {/* Birth Date Picker (Feature 6) */}
                        <div className="relative border-b border-slate-grey/30 pt-3 group">
                          <input
                            type="date"
                            value={birthDate}
                            onChange={(e) => setBirthDate(e.target.value)}
                            placeholder=" "
                            className="w-full py-1.5 text-sm text-ink-black outline-none bg-transparent peer"
                          />
                          <label className="absolute left-0 top-[-6px] text-[9px] uppercase tracking-widest text-slate-grey pointer-events-none">
                            Birth Date
                          </label>
                        </div>
                      </>
                    )}

                    <div className="relative border-b border-slate-grey/30 pt-3 group">
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        placeholder=" "
                        className="w-full py-1.5 text-sm text-ink-black outline-none bg-transparent peer"
                      />
                      <label className="absolute left-0 top-3 text-[11px] uppercase tracking-widest text-slate-grey pointer-events-none transition-all duration-200 peer-placeholder-shown:top-3 peer-placeholder-shown:text-sm peer-focus:top-[-6px] peer-focus:text-[9px] peer-[:not(:placeholder-shown)]:top-[-6px] peer-[:not(:placeholder-shown)]:text-[9px]">
                        Email Address
                      </label>
                    </div>

                    <div className="relative border-b border-slate-grey/30 pt-3 group">
                      <input
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        placeholder=" "
                        className="w-full py-1.5 pr-8 text-sm text-ink-black outline-none bg-transparent peer"
                      />
                      <label className="absolute left-0 top-3 text-[11px] uppercase tracking-widest text-slate-grey pointer-events-none transition-all duration-200 peer-placeholder-shown:top-3 peer-placeholder-shown:text-sm peer-focus:top-[-6px] peer-focus:text-[9px] peer-[:not(:placeholder-shown)]:top-[-6px] peer-[:not(:placeholder-shown)]:text-[9px]">
                        Password
                      </label>
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-0 top-3 text-slate-grey hover:text-black cursor-pointer text-xs"
                      >
                        {showPassword ? "HIDE" : "SHOW"}
                      </button>
                    </div>

                    {/* Marketing checkboxes */}
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
                  /* Verification OTP */
                  <form onSubmit={handleOtpVerify} className="space-y-4">
                    <div className="flex justify-between items-center">
                      <p className="text-xs text-slate-grey">Enter the 6-digit code sent to <strong>{email}</strong></p>
                      <button
                        type="button"
                        onClick={() => { setAuthStep("email"); setErrorMsg(null); }}
                        className="text-[11px] text-slate-grey hover:text-black underline cursor-pointer"
                      >
                        Edit Email
                      </button>
                    </div>

                    <div className="flex gap-2 justify-between py-2">
                      {otpInput.map((digit, i) => (
                        <input
                          key={i}
                          ref={(el) => { otpRefs.current[i] = el; }}
                          type="text"
                          inputMode="numeric"
                          maxLength={1}
                          value={digit}
                          onPaste={(e) => {
                            const pasteData = e.clipboardData.getData("text");
                            const digits = pasteData.replace(/\D/g, "").slice(0, 6);
                            if (digits.length > 0) {
                              e.preventDefault();
                              const next = [...otpInput];
                              digits.split("").forEach((d, idx) => {
                                if (i + idx < 6) next[i + idx] = d;
                              });
                              setOtpInput(next);
                              const focusIndex = Math.min(i + digits.length - 1, 5);
                              otpRefs.current[focusIndex]?.focus();
                            }
                          }}
                          onChange={(e) => {
                            const val = e.target.value;
                            const digits = val.replace(/\D/g, "");
                            if (digits.length > 1) {
                              const next = [...otpInput];
                              digits.slice(0, 6).split("").forEach((d, idx) => {
                                if (i + idx < 6) next[i + idx] = d;
                              });
                              setOtpInput(next);
                              const focusIndex = Math.min(i + digits.length - 1, 5);
                              otpRefs.current[focusIndex]?.focus();
                              return;
                            }
                            if (!/^\d?$/.test(val)) return;
                            const next = [...otpInput];
                            next[i] = val;
                            setOtpInput(next);
                            if (val && i < 5) otpRefs.current[i + 1]?.focus();
                          }}
                          onKeyDown={(e) => {
                            if (e.key === "Backspace" && !digit && i > 0) {
                              otpRefs.current[i - 1]?.focus();
                            }
                          }}
                          className="w-10 h-12 text-center text-lg font-semibold border border-slate-grey/30 focus:border-black outline-none bg-soft-linen/20 transition-colors"
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

                    <div className="text-center pt-2">
                      <button
                        type="button"
                        disabled={loading}
                        onClick={handleResendOtp}
                        className="text-xs text-slate-grey hover:text-black font-body-md underline cursor-pointer"
                      >
                        Didn't receive the code? Resend Code
                      </button>
                    </div>
                  </form>
                )}

                {/* legal links */}
                <div className="pt-4 border-t border-soft-linen text-[10px] text-slate-grey leading-relaxed text-center">
                  By using this service you agree to our{" "}
                  <Link href="/legal?tab=terms" className="underline hover:text-black">Terms & Conditions</Link> and{" "}
                  <Link href="/legal?tab=privacy" className="underline hover:text-black">Privacy Policy</Link>.
                </div>
              </div>
            </div>
          )}
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
