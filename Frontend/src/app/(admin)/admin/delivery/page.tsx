"use client";

import React, { useEffect, useState } from "react";
import { fetchDeliveryStaff, addDeliveryStaff, deleteDeliveryStaff } from "@/utils/api";

interface StaffMember {
  email: string;
  name: string;
  role: "agent" | "manager";
  createdAt: string;
}

export default function AdminDeliveryPage() {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  // Form State
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState<"agent" | "manager">("agent");
  const [showAddForm, setShowAddForm] = useState(false);

  useEffect(() => {
    loadStaff();
  }, []);

  const loadStaff = async () => {
    setLoading(true);
    try {
      const data = await fetchDeliveryStaff();
      setStaff(data);
    } catch (err: any) {
      showToast(err.message || "Failed to load delivery staff.", "error");
    } finally {
      setLoading(false);
    }
  };

  const showToast = (msg: string, type: "success" | "error" = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  const handleAddStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !name) return;
    setActionLoading(true);
    try {
      const newStaff = await addDeliveryStaff({ email, name, role });
      setStaff((prev) => [newStaff, ...prev]);
      showToast(`Successfully registered ${name} as a delivery ${role}.`);
      setEmail("");
      setName("");
      setRole("agent");
      setShowAddForm(false);
    } catch (err: any) {
      showToast(err.message || "Failed to register staff member.", "error");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteStaff = async (staffEmail: string) => {
    if (!confirm(`Are you sure you want to remove access for ${staffEmail}?`)) return;
    setActionLoading(true);
    try {
      await deleteDeliveryStaff(staffEmail);
      setStaff((prev) => prev.filter((s) => s.email !== staffEmail));
      showToast("Staff member removed successfully.");
    } catch (err: any) {
      showToast(err.message || "Failed to remove staff member.", "error");
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="w-full min-h-full p-8 space-y-8">
      {/* Toast Alert */}
      {toast && (
        <div className={`fixed top-6 right-6 z-50 px-6 py-4 border shadow-2xl flex items-center gap-3 animate-fade-in text-sm font-body-md ${
          toast.type === "success" ? "bg-deep-navy text-pure-white border-slate-grey/30" : "bg-red-900 text-white border-red-700"
        }`}>
          <span className="material-symbols-outlined text-[16px]">{toast.type === "success" ? "check_circle" : "error"}</span>
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display-lg text-2xl text-deep-navy uppercase tracking-widest">Delivery Staff Management</h1>
          <p className="text-slate-grey font-body-md text-sm mt-1">Manage delivery agents, system managers, and access credentials.</p>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center justify-center gap-2 text-[11px] font-label-caps uppercase tracking-widest text-pure-white bg-deep-navy px-6 py-3 hover:bg-ink-black transition-colors duration-300 cursor-pointer self-start sm:self-auto"
        >
          <span className="material-symbols-outlined text-[16px]">{showAddForm ? "remove" : "add"}</span>
          {showAddForm ? "Cancel" : "Add Staff Member"}
        </button>
      </div>

      {/* Add Staff Form Accordion */}
      {showAddForm && (
        <div className="bg-pure-white border border-slate-grey/20 p-6 animate-slide-down">
          <h2 className="font-label-caps text-[11px] uppercase tracking-widest text-slate-grey mb-4">Register New Staff Account</h2>
          <form onSubmit={handleAddStaff} className="grid grid-cols-1 md:grid-cols-4 gap-6 items-end">
            <div className="flex flex-col gap-2">
              <label className="font-label-caps text-[10px] text-slate-grey uppercase tracking-widest">Full Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. John Doe"
                required
                className="border-b border-slate-grey/30 py-2.5 text-sm text-ink-black focus:border-deep-navy outline-none font-body-md"
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="font-label-caps text-[10px] text-slate-grey uppercase tracking-widest">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. agent@vrix.com"
                required
                className="border-b border-slate-grey/30 py-2.5 text-sm text-ink-black focus:border-deep-navy outline-none font-body-md"
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="font-label-caps text-[10px] text-slate-grey uppercase tracking-widest">System Role</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as any)}
                className="border-b border-slate-grey/30 py-2.5 text-sm text-ink-black focus:border-deep-navy outline-none font-body-md bg-transparent"
              >
                <option value="agent">Delivery Agent</option>
                <option value="manager">Portal Manager</option>
              </select>
            </div>
            <button
              type="submit"
              disabled={actionLoading}
              className="bg-deep-navy text-pure-white py-3.5 px-6 font-button text-[11px] uppercase tracking-widest hover:bg-ink-black transition-colors duration-300 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
            >
              {actionLoading ? <span className="w-3. h-3 border-2 border-white border-t-transparent rounded-full animate-spin" /> : "Register Staff"}
            </button>
          </form>
        </div>
      )}

      {/* Staff Directory */}
      <div className="bg-pure-white border border-slate-grey/20 overflow-hidden">
        <div className="p-5 border-b border-slate-grey/15">
          <h2 className="font-headline-md text-base text-deep-navy uppercase">Registered Staff Directory</h2>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-grey font-label-caps text-xs tracking-widest animate-pulse">Loading staff records...</div>
        ) : staff.length === 0 ? (
          <div className="p-12 text-center text-slate-grey font-label-caps text-xs tracking-widest">No staff accounts registered.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-soft-linen/30 border-b border-slate-grey/15 text-slate-grey font-label-caps text-[9px] tracking-widest uppercase">
                  <th className="px-6 py-4 font-normal">Name</th>
                  <th className="px-6 py-4 font-normal">Email Address</th>
                  <th className="px-6 py-4 font-normal">Role</th>
                  <th className="px-6 py-4 font-normal">Registered On</th>
                  <th className="px-6 py-4 font-normal text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-grey/10">
                {staff.map((s) => (
                  <tr key={s.email} className="hover:bg-soft-linen/25 transition-colors">
                    <td className="px-6 py-4 font-body-md text-sm font-semibold text-deep-navy">{s.name}</td>
                    <td className="px-6 py-4 font-body-md text-sm text-ink-black">{s.email}</td>
                    <td className="px-6 py-4">
                      <span className={`text-[9px] font-label-caps uppercase tracking-widest px-2 py-0.5 border rounded-full ${
                        s.role === "manager"
                          ? "bg-purple-50 text-purple-700 border-purple-200"
                          : "bg-blue-50 text-blue-700 border-blue-200"
                      }`}>
                        {s.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-grey text-xs font-body-md">
                      {new Date(s.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleDeleteStaff(s.email)}
                        disabled={actionLoading || s.email === "manager@vrix.com"}
                        className="text-red-600 hover:text-red-950 font-label-caps text-[10px] uppercase tracking-widest transition-colors disabled:opacity-30 cursor-pointer"
                        title={s.email === "manager@vrix.com" ? "System protected root manager account" : "Remove staff account"}
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
