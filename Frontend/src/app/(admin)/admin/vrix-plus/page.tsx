"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { fetchUsers, updateUserVrixPlus, fetchDb, updateCMS } from "@/utils/api";
import { useCurrency } from "@/context/CurrencyContext";


interface UserRecord {
  email: string;
  name?: string;
  phone?: string;
  createdAt?: string;
  isVrixPlusMember?: boolean;
  vrixPlusJoinedDate?: string;
  totalBuying?: number;
  dateOfBirth?: string;
}

export default function AdminVrixPlusPage() {
  const { formatPrice } = useCurrency();
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [vrixConfig, setVrixConfig] = useState<any>({
    isPaidSubscription: false,
    subscriptionPrice: 999,
    subscriptionPeriod: "lifetime",
    birthdayCouponCode: "BIRTHDAY15",
    birthdayDiscountValue: 15,
    birthdayDiscountType: "percentage",
    birthdayPerkEnabled: true,
    birthdayPerkDesc: "Exclusive VRIX+ Member Birthday Perk"
  });

  const [loading, setLoading] = useState(true);
  const [saveLoading, setSaveLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const loadData = async () => {
    setLoading(true);
    try {
      const [usersData, dbData] = await Promise.all([
        fetchUsers().catch(() => []),
        fetchDb().catch(() => ({}))
      ]);
      setUsers(Array.isArray(usersData) ? usersData : []);
      
      const vrixPlusCMS = dbData?.vrix_plus || dbData?.cms?.vrix_plus || {};
      setVrixConfig((prev: any) => ({
        ...prev,
        ...vrixPlusCMS,
        isPaidSubscription: vrixPlusCMS.isPaidSubscription ?? false,
        subscriptionPrice: Number(vrixPlusCMS.subscriptionPrice) || 999,
        subscriptionPeriod: vrixPlusCMS.subscriptionPeriod || "lifetime"
      }));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSaveConfig = async () => {
    setSaveLoading(true);
    try {
      await updateCMS({ vrix_plus: vrixConfig });
      alert("Subscription settings saved successfully!");
    } catch (err: any) {
      alert("Failed to save settings: " + err.message);
    } finally {
      setSaveLoading(false);
    }
  };

  const handleRevokeMembership = async (email: string) => {
    if (!confirm(`Are you sure you want to revoke VRIX+ membership for ${email}?`)) return;
    try {
      await updateUserVrixPlus(email, false);
      setUsers(prev => prev.map(u => u.email === email ? { ...u, isVrixPlusMember: false } : u));
    } catch (err: any) {
      alert("Failed to revoke membership: " + err.message);
    }
  };

  // Calculations
  const members = useMemo(() => users.filter(u => !!u.isVrixPlusMember), [users]);
  
  const estimatedRevenue = useMemo(() => {
    const price = Number(vrixConfig.subscriptionPrice) || 0;
    if (vrixConfig.isPaidSubscription) {
      return members.length * price;
    }
    return 0; // If free, estimated subscription revenue is 0 or display members * price as potential
  }, [members, vrixConfig]);

  const newJoinsThisMonth = useMemo(() => {
    const now = new Date();
    const currentMonth = now.toLocaleString("en-US", { month: "long" }).toLowerCase();
    const currentYear = now.getFullYear().toString();
    return members.filter(u => {
      const joinedDate = String(u.vrixPlusJoinedDate || "").toLowerCase();
      return joinedDate.includes(currentMonth) && joinedDate.includes(currentYear);
    }).length;
  }, [members]);

  const birthdayPerksActive = useMemo(() => {
    // Shows number of members whose birthday is this month
    const currentMonth = new Date().getMonth();
    return members.filter(u => {
      if (!u.dateOfBirth) return false;
      const dob = new Date(u.dateOfBirth);
      return !isNaN(dob.getTime()) && dob.getMonth() === currentMonth;
    }).length;
  }, [members]);

  const filteredMembers = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return members.filter(u => 
      !q ||
      String(u.name || "").toLowerCase().includes(q) ||
      String(u.email || "").toLowerCase().includes(q)
    );
  }, [members, searchQuery]);

  if (loading) {
    return (
      <div className="p-10 flex flex-col items-center justify-center min-h-[60vh] text-slate-grey text-xs uppercase tracking-widest gap-3">
        <div className="w-6 h-6 border-2 border-deep-navy border-t-transparent rounded-full animate-spin"></div>
        Loading VRIX+ Dashboard...
      </div>
    );
  }

  return (
    <div className="p-6 md:p-10 space-y-8 bg-soft-linen/10 min-h-screen text-ink-black font-body-md">
      
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-grey/20 pb-6">
        <div>
          <span className="font-label-caps text-[10px] text-slate-grey uppercase tracking-widest block mb-1">
            VRIX+ Paid Subscription Club
          </span>
          <h1 className="font-display-lg text-headline-lg tracking-wider text-deep-navy uppercase">
            VRIX+ Club Hub
          </h1>
        </div>
      </div>

      {/* Section 1 — Stats Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-pure-white border border-slate-grey/15 p-6 shadow-sm flex flex-col justify-between">
          <span className="text-[10px] font-label-caps uppercase tracking-widest text-slate-grey font-semibold">Total Members</span>
          <span className="text-3xl font-light font-display-md text-deep-navy mt-2">{members.length}</span>
          <span className="text-[10px] text-slate-grey/70 mt-1">Registered VRIX+ Club members</span>
        </div>
        <div className="bg-pure-white border border-slate-grey/15 p-6 shadow-sm flex flex-col justify-between">
          <span className="text-[10px] font-label-caps uppercase tracking-widest text-slate-grey font-semibold">Estimated Revenue</span>
          <span className="text-3xl font-light font-display-md text-green-700 mt-2">
            {formatPrice(estimatedRevenue)}
          </span>
          <span className="text-[10px] text-slate-grey/70 mt-1">
            {vrixConfig.isPaidSubscription ? `Based on ₹${vrixConfig.subscriptionPrice} pricing` : "Free Tier Active"}
          </span>
        </div>
        <div className="bg-pure-white border border-slate-grey/15 p-6 shadow-sm flex flex-col justify-between">
          <span className="text-[10px] font-label-caps uppercase tracking-widest text-slate-grey font-semibold">New Joins This Month</span>
          <span className="text-3xl font-light font-display-md text-deep-navy mt-2">{newJoinsThisMonth}</span>
          <span className="text-[10px] text-slate-grey/70 mt-1">Members joined this calendar month</span>
        </div>
        <div className="bg-pure-white border border-slate-grey/15 p-6 shadow-sm flex flex-col justify-between">
          <span className="text-[10px] font-label-caps uppercase tracking-widest text-slate-grey font-semibold">Active Birthday Perks</span>
          <span className="text-3xl font-light font-display-md text-deep-navy mt-2">{birthdayPerksActive}</span>
          <span className="text-[10px] text-slate-grey/70 mt-1">Members celebrating birthdays this month</span>
        </div>
      </div>

      {/* Middle Split Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Section 2 — Subscription Configuration */}
        <div className="lg:col-span-2 bg-pure-white border border-slate-grey/15 p-6 shadow-sm space-y-6">
          <h2 className="text-xs font-label-caps uppercase tracking-wider font-bold text-deep-navy border-b border-soft-linen pb-3 flex items-center gap-2">
            <span className="material-symbols-outlined text-sm">settings</span>
            Subscription settings & pricing
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-label-caps uppercase tracking-widest text-slate-grey font-semibold">Membership Type</label>
              <div className="flex items-center gap-3 mt-1">
                <button
                  type="button"
                  onClick={() => setVrixConfig((prev: any) => ({ ...prev, isPaidSubscription: false }))}
                  className={`flex-1 py-3 text-xs uppercase font-label-caps tracking-wider border text-center transition-all ${
                    !vrixConfig.isPaidSubscription 
                      ? "bg-deep-navy text-white border-deep-navy font-bold" 
                      : "bg-white text-slate-grey border-slate-grey/20 hover:bg-soft-linen/20"
                  }`}
                >
                  Free (Open)
                </button>
                <button
                  type="button"
                  onClick={() => setVrixConfig((prev: any) => ({ ...prev, isPaidSubscription: true }))}
                  className={`flex-1 py-3 text-xs uppercase font-label-caps tracking-wider border text-center transition-all ${
                    vrixConfig.isPaidSubscription 
                      ? "bg-deep-navy text-white border-deep-navy font-bold" 
                      : "bg-white text-slate-grey border-slate-grey/20 hover:bg-soft-linen/20"
                  }`}
                >
                  Paid Subscription
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-label-caps uppercase tracking-widest text-slate-grey font-semibold">Subscription Period</label>
              <select
                disabled={!vrixConfig.isPaidSubscription}
                value={vrixConfig.subscriptionPeriod}
                onChange={(e) => setVrixConfig((prev: any) => ({ ...prev, subscriptionPeriod: e.target.value }))}
                className="w-full bg-white border border-slate-grey/20 rounded-none px-4 py-3 text-xs focus:ring-1 focus:ring-deep-navy focus:border-deep-navy outline-none"
              >
                <option value="lifetime">Lifetime Access</option>
                <option value="yearly">Yearly Renewal</option>
                <option value="monthly">Monthly Subscription</option>
              </select>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-label-caps uppercase tracking-widest text-slate-grey font-semibold">Subscription Price (₹)</label>
              <input
                disabled={!vrixConfig.isPaidSubscription}
                type="number"
                value={vrixConfig.subscriptionPrice}
                onChange={(e) => setVrixConfig((prev: any) => ({ ...prev, subscriptionPrice: Number(e.target.value) || 0 }))}
                className="w-full bg-white border border-slate-grey/20 rounded-none px-4 py-3 text-xs focus:ring-1 focus:ring-deep-navy focus:border-deep-navy outline-none"
                placeholder="999"
              />
            </div>

            <div className="flex items-end">
              <button
                type="button"
                onClick={handleSaveConfig}
                disabled={saveLoading}
                className="w-full bg-deep-navy text-white py-3.5 text-xs font-label-caps uppercase tracking-widest hover:bg-deep-navy/90 transition-all font-bold flex items-center justify-center gap-2"
              >
                {saveLoading ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Saving Changes...
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-sm">save</span>
                    Save Subscription Plan
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Section 3 — Birthday Perk Summary Card */}
        <div className="bg-pure-white border border-slate-grey/15 p-6 shadow-sm flex flex-col justify-between">
          <div>
            <h2 className="text-xs font-label-caps uppercase tracking-wider font-bold text-deep-navy border-b border-soft-linen pb-3 flex items-center gap-2">
              <span className="material-symbols-outlined text-sm">cake</span>
              Birthday Perk Config
            </h2>
            <div className="mt-4 space-y-3.5 text-xs">
              <div className="flex justify-between border-b border-slate-grey/5 pb-2">
                <span className="text-slate-grey">Coupon Code:</span>
                <span className="font-mono font-bold text-deep-navy">{vrixConfig.birthdayCouponCode}</span>
              </div>
              <div className="flex justify-between border-b border-slate-grey/5 pb-2">
                <span className="text-slate-grey">Discount:</span>
                <span className="font-semibold">{vrixConfig.birthdayDiscountValue}{vrixConfig.birthdayDiscountType === "percentage" ? "%" : " Off"}</span>
              </div>
              <div className="flex justify-between border-b border-slate-grey/5 pb-2">
                <span className="text-slate-grey">Status:</span>
                <span className={`font-semibold uppercase text-[10px] tracking-wider px-2 py-0.5 border ${
                  vrixConfig.birthdayPerkEnabled ? "bg-green-50 text-green-700 border-green-200" : "bg-red-50 text-red-700 border-red-200"
                }`}>
                  {vrixConfig.birthdayPerkEnabled ? "Enabled" : "Disabled"}
                </span>
              </div>
              <div className="text-[10px] text-slate-grey/80 leading-relaxed italic mt-2">
                "{vrixConfig.birthdayPerkDesc}"
              </div>
            </div>
          </div>
          <Link
            href="/admin/cms?tab=vrix-plus"
            className="mt-6 w-full text-center border border-deep-navy/35 text-deep-navy py-2.5 text-[10px] font-label-caps uppercase tracking-wider font-semibold hover:bg-soft-linen/25 transition-all flex items-center justify-center gap-1.5"
          >
            <span className="material-symbols-outlined text-sm">edit</span>
            Modify Perk Details in CMS
          </Link>
        </div>
      </div>

      {/* Section 4 — VRIX+ Members Table */}
      <div className="bg-pure-white border border-slate-grey/15 p-6 shadow-sm space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <h2 className="text-xs font-label-caps uppercase tracking-wider font-bold text-deep-navy flex items-center gap-2">
            <span className="material-symbols-outlined text-sm">group</span>
            VRIX+ Member Registry ({filteredMembers.length})
          </h2>
          <div className="w-full md:w-80 relative">
            <span className="material-symbols-outlined text-slate-grey absolute left-3 top-2.5 text-lg">search</span>
            <input
              type="text"
              placeholder="Search members by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-soft-linen/10 border border-slate-grey/15 px-9 py-2 text-xs focus:ring-1 focus:ring-deep-navy outline-none"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-grey/25 text-slate-grey uppercase font-label-caps font-bold tracking-wider">
                <th className="py-3 px-4">Customer Name</th>
                <th className="py-3 px-4">Email</th>
                <th className="py-3 px-4">Phone</th>
                <th className="py-3 px-4">Date of Birth</th>
                <th className="py-3 px-4">Joined Date</th>
                <th className="py-3 px-4 text-right">Lifetime Spend</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-grey/10">
              {filteredMembers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-slate-grey italic">
                    No matching VRIX+ members found.
                  </td>
                </tr>
              ) : (
                filteredMembers.map((m) => (
                  <tr key={m.email} className="hover:bg-soft-linen/15 transition-colors">
                    <td className="py-3.5 px-4 font-semibold text-deep-navy">{m.name || "VRIX Member"}</td>
                    <td className="py-3.5 px-4">{m.email}</td>
                    <td className="py-3.5 px-4">{m.phone || "N/A"}</td>
                    <td className="py-3.5 px-4">{m.dateOfBirth || "N/A"}</td>
                    <td className="py-3.5 px-4">{m.vrixPlusJoinedDate || "N/A"}</td>
                    <td className="py-3.5 px-4 text-right font-semibold">{formatPrice(m.totalBuying || 0)}</td>
                    <td className="py-3.5 px-4 text-center flex items-center justify-center gap-2">
                      <button
                        onClick={() => handleRevokeMembership(m.email)}
                        className="px-3 py-1.5 border border-red-200 text-red-600 hover:bg-red-50 text-[10px] font-semibold transition-all"
                      >
                        Revoke Club Card
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
