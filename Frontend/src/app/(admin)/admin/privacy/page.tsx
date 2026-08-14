"use client";

import React, { useState, useEffect } from "react";
import { getApiBaseUrl } from "@/utils/api";

export default function AdminPrivacyPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const [dpoForm, setDpoForm] = useState({
    dpoName: "Data Protection Officer",
    dpoEmail: "info@vrixjewels.com",
    dpoPhone: "+91 90542 85693",
    dpoAddress: "VRIX Flagship Atelier, Diamond Financial District, Surat, Gujarat 395007",
    responseHours: "48 Hours",
    dpdpEnabled: true,
  });

  const [consentLogs, setConsentLogs] = useState<any[]>([]);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const loadPrivacyData = async () => {
    setLoading(true);
    const baseUrl = getApiBaseUrl();
    try {
      const [dpoRes, logsRes] = await Promise.all([
        fetch(`${baseUrl}/consent/dpo`),
        fetch(`${baseUrl}/consent/logs`),
      ]);
      const dpoData = await dpoRes.json();
      const logsData = await logsRes.json();

      if (dpoData?.success && dpoData.dpo) {
        setDpoForm(dpoData.dpo);
      }
      if (logsData?.success && Array.isArray(logsData.logs)) {
        setConsentLogs(logsData.logs);
      }
    } catch (e) {
      console.error(e);
      showToast("Error loading privacy settings.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPrivacyData();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const baseUrl = getApiBaseUrl();
    try {
      const res = await fetch(`${baseUrl}/consent/dpo`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dpoForm),
      });
      const data = await res.json();
      if (data.success) {
        showToast("DPO & DPDP Act settings saved successfully.");
      } else {
        showToast("Failed to save: " + (data.error || "Unknown error"));
      }
    } catch (err: any) {
      showToast("Save error: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="w-full h-screen bg-soft-linen/30 flex items-center justify-center gap-3 font-label-caps text-xs text-slate-grey uppercase tracking-widest">
        <div className="w-5 h-5 border-2 border-deep-navy border-t-transparent rounded-full animate-spin" />
        Loading Privacy &amp; DPDP Control Panel...
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-soft-linen/30 p-6 md:p-12 relative font-body-md text-ink-black">
      {toast && (
        <div className="fixed bottom-8 right-8 z-50 bg-deep-navy text-pure-white px-6 py-4 border border-slate-grey/30 shadow-2xl flex items-center gap-3 animate-fade-in rounded">
          <span className="material-symbols-outlined text-sm">info</span>
          <p className="font-body-md text-sm tracking-wide">{toast}</p>
        </div>
      )}

      <div className="max-w-7xl mx-auto space-y-8">
        {/* Banner Section */}
        <div className="bg-pure-white border border-slate-grey/25 p-6 md:p-8 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 relative overflow-hidden rounded">
          <div className="absolute top-0 left-0 right-0 h-1 bg-deep-navy" />
          <div className="space-y-1.5">
            <h1 className="font-display-lg text-xl text-deep-navy uppercase tracking-wider flex items-center gap-2">
              <span className="material-symbols-outlined text-xl">shield_lock</span>
              DPDP Act 2023 &amp; Data Privacy Control Center
            </h1>
            <p className="text-xs text-slate-grey">
              Manage statutory Data Protection Officer (DPO) credentials, DPDP Act 2023 compliance, and user consent audit logs.
            </p>
          </div>
          <button
            type="button"
            onClick={loadPrivacyData}
            className="px-4 py-2 border border-slate-grey/25 text-deep-navy text-[10px] font-label-caps uppercase hover:bg-soft-linen transition-colors rounded shrink-0 flex items-center gap-1.5"
          >
            <span className="material-symbols-outlined text-sm">refresh</span>
            Refresh Audit Logs
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: DPO Configurator Form */}
          <form onSubmit={handleSave} className="lg:col-span-1 bg-pure-white border border-slate-grey/25 p-6 shadow-sm space-y-5 rounded">
            <h2 className="font-headline-md text-sm text-deep-navy uppercase tracking-wider border-b border-slate-grey/15 pb-3 font-bold flex items-center gap-2">
              <span className="material-symbols-outlined text-base">badge</span>
              DPO Officer Credentials
            </h2>

            <div className="space-y-1.5">
              <label className="font-label-caps text-[10px] uppercase text-slate-grey font-semibold">DPO Designation / Name</label>
              <input
                type="text"
                value={dpoForm.dpoName}
                onChange={(e) => setDpoForm({ ...dpoForm, dpoName: e.target.value })}
                className="w-full border border-slate-grey/30 px-3 py-2 text-xs outline-none focus:border-deep-navy font-medium rounded"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-label-caps text-[10px] uppercase text-slate-grey font-semibold">Official DPO Email</label>
              <input
                type="email"
                value={dpoForm.dpoEmail}
                onChange={(e) => setDpoForm({ ...dpoForm, dpoEmail: e.target.value })}
                className="w-full border border-slate-grey/30 px-3 py-2 text-xs outline-none focus:border-deep-navy font-medium rounded"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-label-caps text-[10px] uppercase text-slate-grey font-semibold">DPO Helpline / Phone</label>
              <input
                type="text"
                value={dpoForm.dpoPhone}
                onChange={(e) => setDpoForm({ ...dpoForm, dpoPhone: e.target.value })}
                className="w-full border border-slate-grey/30 px-3 py-2 text-xs outline-none focus:border-deep-navy font-medium rounded"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-label-caps text-[10px] uppercase text-slate-grey font-semibold">Physical Atelier Address</label>
              <textarea
                rows={3}
                value={dpoForm.dpoAddress}
                onChange={(e) => setDpoForm({ ...dpoForm, dpoAddress: e.target.value })}
                className="w-full border border-slate-grey/30 px-3 py-2 text-xs outline-none focus:border-deep-navy font-medium rounded resize-none"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-label-caps text-[10px] uppercase text-slate-grey font-semibold">Statutory Response Window</label>
              <input
                type="text"
                value={dpoForm.responseHours}
                onChange={(e) => setDpoForm({ ...dpoForm, responseHours: e.target.value })}
                className="w-full border border-slate-grey/30 px-3 py-2 text-xs outline-none focus:border-deep-navy font-medium rounded"
                placeholder="e.g. 48 Hours"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={saving}
                className="w-full py-2.5 bg-deep-navy text-pure-white text-[10px] font-label-caps uppercase tracking-widest hover:bg-ink-black transition-colors rounded font-bold cursor-pointer disabled:opacity-50"
              >
                {saving ? "Saving Changes..." : "Save DPO Credentials"}
              </button>
            </div>
          </form>

          {/* Right Column: Consent & DPDP Audit Log Table */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-pure-white border border-slate-grey/25 p-6 shadow-sm space-y-4 rounded">
              <div className="flex justify-between items-center border-b border-slate-grey/15 pb-3">
                <h3 className="font-headline-md text-sm text-deep-navy uppercase font-bold flex items-center gap-2">
                  <span className="material-symbols-outlined text-base">history_edu</span>
                  Recent Consent &amp; DPDP Audit Trail
                </h3>
                <span className="text-[10px] font-label-caps text-slate-grey uppercase font-semibold">
                  Showing {consentLogs.length} Entries
                </span>
              </div>

              <div className="overflow-x-auto rounded border border-slate-grey/15">
                <table className="w-full text-left text-xs font-jost">
                  <thead>
                    <tr className="bg-soft-linen/20 border-b border-slate-grey/15 text-[10px] font-label-caps uppercase text-slate-grey">
                      <th className="p-3">Session ID</th>
                      <th className="p-3">Source</th>
                      <th className="p-3">Region</th>
                      <th className="p-3">Analytics</th>
                      <th className="p-3">Marketing</th>
                      <th className="p-3">Timestamp</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-grey/10 text-ink-black">
                    {consentLogs.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-6 text-center text-slate-grey italic">
                          No consent audit logs recorded yet.
                        </td>
                      </tr>
                    ) : (
                      consentLogs.map((log, idx) => (
                        <tr key={log.id || idx} className="hover:bg-soft-linen/10">
                          <td className="p-3 font-mono text-[11px] font-semibold text-deep-navy">
                            {log.sessionId ? log.sessionId.slice(0, 14) + "..." : "Anonymous"}
                          </td>
                          <td className="p-3 font-label-caps text-[9px] uppercase">
                            <span className="px-2 py-0.5 bg-slate-grey/10 text-slate-grey rounded">
                              {log.consentSource || "banner"}
                            </span>
                          </td>
                          <td className="p-3 font-bold text-deep-navy">{log.region || "IN"}</td>
                          <td className="p-3">
                            <span className={`px-2 py-0.5 text-[9px] font-bold rounded ${log.analytics ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"}`}>
                              {log.analytics ? "GRANTED" : "DENIED"}
                            </span>
                          </td>
                          <td className="p-3">
                            <span className={`px-2 py-0.5 text-[9px] font-bold rounded ${log.marketing ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"}`}>
                              {log.marketing ? "GRANTED" : "DENIED"}
                            </span>
                          </td>
                          <td className="p-3 text-[11px] text-slate-grey">
                            {log.createdAt ? new Date(log.createdAt).toLocaleString("en-IN") : "Recent"}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
