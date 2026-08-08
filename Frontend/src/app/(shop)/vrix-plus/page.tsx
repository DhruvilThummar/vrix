"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { fetchDbPublic as fetchDb, getApiBaseUrl } from "@/utils/api";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";


const DEFAULT_CMS = {
  programName: "VRIX+",
  memberName: "VRIX+ Member",
  tagline: "The world of VRIX, unlocked.",
  headline: "Join VRIX+",
  subheading: "Become a VRIX+ Member and enjoy exclusive access, early releases, and premium services designed to elevate your experience with VRIX.",
  welcomeGift: "Your first VRIX+ privilege awaits.",
  benefits: [
    {
      title: "Early Access",
      description: "Shop new collections before public release."
    },
    {
      title: "Member-Exclusive Releases",
      description: "Access limited pieces available only to VRIX+ Members."
    },
    {
      title: "Birthday Privilege",
      description: "Receive a special birthday surprise from VRIX."
    }
  ]
};

export default function VrixPlusPage() {
  const { user, isLoggedIn, login } = useAuth();

  const [cms, setCms] = useState(DEFAULT_CMS);
  const [loading, setLoading] = useState(true);
  const [emailInput, setEmailInput] = useState("");
  const [joiningLoading, setJoiningLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    fetchDb()
      .then((res) => {
        if (res.vrix_plus) {
          setCms({
            programName: res.vrix_plus.programName || DEFAULT_CMS.programName,
            memberName: res.vrix_plus.memberName || DEFAULT_CMS.memberName,
            tagline: res.vrix_plus.tagline || DEFAULT_CMS.tagline,
            headline: res.vrix_plus.headline || DEFAULT_CMS.headline,
            subheading: res.vrix_plus.subheading || DEFAULT_CMS.subheading,
            welcomeGift: res.vrix_plus.welcomeGift || DEFAULT_CMS.welcomeGift,
            benefits: Array.isArray(res.vrix_plus.benefits) ? res.vrix_plus.benefits : DEFAULT_CMS.benefits
          });
        }
      })
      .catch((err) => console.error("Error loading VRIX+ CMS details:", err))
      .finally(() => setLoading(false));
  }, []);

  // Prefill email if logged in
  useEffect(() => {
    if (isLoggedIn && user?.email) {
      setEmailInput(user.email);
    }
  }, [isLoggedIn, user]);

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput.trim()) return;
    setJoiningLoading(true);
    setErrorMsg(null);

    try {
      const apiBaseUrl = getApiBaseUrl();

      const res = await fetch(`${apiBaseUrl}/auth/join-vrix-plus`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: emailInput.trim() })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to join program.");
      }

      // Log user in or update their local session
      login(data.user.email, {
        name: data.user.name,
        phone: data.user.phone,
        isVrixPlusMember: true,
        vrixPlusJoinedDate: data.user.vrixPlusJoinedDate
      });

    } catch (err: any) {
      setErrorMsg(err.message || "An unexpected error occurred.");
    } finally {
      setJoiningLoading(false);
    }
  };

  const isJoined = isLoggedIn && user?.isVrixPlusMember;

  return (
    <div className="w-full min-h-screen bg-[#faf9f7] py-12 px-4 md:px-6">
      <div className="max-w-4xl mx-auto space-y-12">

        {/* Header Hero Branding */}
        <div className="text-center space-y-4">
          <p className="font-label-caps text-xs tracking-[0.3em] uppercase text-[#B59D7C] font-semibold">
            {loading ? <Skeleton width={120} /> : cms.programName} CLUB
          </p>
          <h1 className="font-display-lg text-4xl md:text-5xl font-light uppercase tracking-wider text-ink-black">
            {loading ? <Skeleton width={380} /> : cms.tagline}
          </h1>
          <p className="max-w-2xl mx-auto font-body-md text-sm text-slate-grey leading-relaxed">
            {loading ? <Skeleton count={2} /> : cms.subheading}
          </p>
        </div>

        {/* Dynamic Card Area (Join vs Active Status Dashboard) */}
        <div className="bg-pure-white border border-slate-grey/20 p-8 md:p-12 shadow-xl rounded-xs">
          {loading ? (
            <div className="space-y-6">
              <Skeleton height={20} width="40%" />
              <Skeleton height={14} count={3} />
              <Skeleton height={50} />
            </div>
          ) : isJoined ? (
            /* ACTIVE MEMBERSHIP STATE */
            <div className="space-y-8 animate-fade-in text-center md:text-left">
              <div className="flex flex-col md:flex-row justify-between items-center border-b border-slate-grey/15 pb-6 gap-4">
                <div className="space-y-1">
                  <span className="font-label-caps text-[10px] text-slate-grey uppercase tracking-widest">Membership Status</span>
                  <h2 className="font-display-lg text-2xl uppercase tracking-widest text-[#B59D7C] flex items-center justify-center md:justify-start gap-2">
                    Welcome to {cms.programName}
                  </h2>
                </div>
                <div className="bg-[#EBEAE4] px-4 py-2 border border-slate-grey/25 text-center">
                  <p className="font-label-caps text-[9px] text-slate-grey uppercase tracking-widest leading-none mb-1">MEMBER STATUS</p>
                  <p className="font-label-caps text-xs text-deep-navy font-bold tracking-widest">ACTIVE</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
                <div className="border border-soft-linen p-5 bg-surface/30 space-y-1">
                  <p className="font-label-caps text-[9px] text-slate-grey uppercase tracking-wider">MEMBER NAME</p>
                  <p className="font-body-md text-sm font-semibold text-ink-black">{user?.name || cms.memberName}</p>
                </div>
                <div className="border border-soft-linen p-5 bg-surface/30 space-y-1">
                  <p className="font-label-caps text-[9px] text-slate-grey uppercase tracking-wider">MEMBER SINCE</p>
                  <p className="font-body-md text-sm font-semibold text-ink-black">
                    {user?.vrixPlusJoinedDate || "14 July 2026"}
                  </p>
                </div>
                <div className="border border-soft-linen p-5 bg-surface/30 space-y-1">
                  <p className="font-label-caps text-[9px] text-slate-grey uppercase tracking-wider">WELCOME PRIVILEGE</p>
                  <p className="font-body-md text-xs font-semibold text-deep-navy uppercase tracking-wider animate-pulse">
                    {cms.welcomeGift}
                  </p>
                </div>
              </div>

              <div className="pt-6 border-t border-soft-linen">
                <p className="font-body-md text-xs text-slate-grey leading-relaxed">
                  Thank you for being a part of {cms.programName}. You have unlocked early access to releases and specialized customer care options. Head to your <Link href="/account" className="underline font-semibold text-deep-navy">Account Dashboard</Link> to view detailed rewards.
                </p>
              </div>
            </div>
          ) : (
            /* JOIN SECTION */
            <div className="space-y-8 animate-fade-in">
              <div className="text-center md:text-left space-y-2">
                <h2 className="font-display-lg text-2xl uppercase tracking-widest text-ink-black">
                  {cms.headline}
                </h2>
                <p className="font-body-md text-xs text-slate-grey">
                  {cms.welcomeGift} Enter your email address below to unlock membership privileges.
                </p>
              </div>

              <form onSubmit={handleJoin} className="space-y-4 max-w-md mx-auto md:mx-0">
                <div className="flex flex-col gap-1.5">
                  <label className="font-label-caps text-[9px] text-slate-grey uppercase tracking-widest block font-semibold">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    placeholder="Enter your email address"
                    className="w-full bg-transparent border-b border-slate-grey/30 py-2.5 focus:border-ink-black transition-colors text-sm text-ink-black"
                    required
                    disabled={joiningLoading}
                  />
                </div>

                {errorMsg && <p className="text-xs text-red-600 font-body-md">{errorMsg}</p>}

                <button
                  type="submit"
                  disabled={joiningLoading}
                  className="w-full font-button text-xs uppercase py-4 bg-black text-white hover:bg-black/90 transition-all cursor-pointer flex items-center justify-center gap-2 tracking-widest font-semibold"
                >
                  {joiningLoading ? (
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    `Join ${cms.programName}`
                  )}
                </button>

                <p className="text-[10px] text-slate-grey leading-relaxed text-center md:text-left">
                  By joining, you agree to receive exclusive updates from VRIX. You can unsubscribe at any time.
                </p>
              </form>
            </div>
          )}
        </div>

        {/* Benefits Grid */}
        <div className="space-y-8">
          <div className="text-center">
            <h3 className="font-label-caps text-xs tracking-widest uppercase text-slate-grey font-semibold">
              Membership Benefits
            </h3>
            <div className="w-8 h-[1px] bg-slate-grey/30 mx-auto mt-2"></div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {cms.benefits.map((benefit, i) => (
              <div key={i} className="border border-slate-grey/15 p-6 bg-pure-white shadow-xs space-y-3">
                <div className="w-8 h-8 rounded-full bg-[#F5F4F0] flex items-center justify-center text-xs font-semibold text-[#B59D7C]">
                  {i + 1}
                </div>
                <h4 className="font-label-caps text-xs text-deep-navy uppercase font-bold tracking-wider">
                  {loading ? <Skeleton width="80%" /> : benefit.title}
                </h4>
                <p className="font-body-md text-xs text-slate-grey leading-relaxed">
                  {loading ? <Skeleton count={2} /> : benefit.description}
                </p>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
