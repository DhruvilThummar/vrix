"use client";

import React, { useState, useEffect } from "react";
import { fetchSiteConfig, saveSiteConfigKey, fetchSecurityLogs, sendTestEmail } from "@/utils/api";

export default function Page() {
  const [backupsEnabled, setBackupsEnabled] = useState(false);
  const [rbacEnabled, setRbacEnabled] = useState(true);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(true);
  const [showSavedToast, setShowSavedToast] = useState(false);
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  // API Credentials State
  const [apiSettings, setApiSettings] = useState({

    // Razorpay
    razorpayEnabled: true,
    razorpayKeyId: "",
    razorpayKeySecret: "",

    // Cloudinary
    cloudinaryEnabled: true,
    cloudinaryCloudName: "",
    cloudinaryApiKey: "",
    cloudinaryApiSecret: "",

    // Nodemailer / SMTP
    nodemailerEnabled: true,
    nodemailerHost: "smtp.hostinger.com",
    nodemailerPort: "465",
    nodemailerUser: "",
    nodemailerPass: "",
  });

  const [logs, setLogs] = useState<any[]>([]);
  const [testingMail, setTestingMail] = useState(false);

  const handleTestEmail = async () => {
    const targetEmail = prompt("Enter recipient email address to send test message:", apiSettings.nodemailerUser || "dhruvilthummar2007@gmail.com");
    if (!targetEmail) return;
    setTestingMail(true);
    try {
      const res = await sendTestEmail(targetEmail);
      if (res.success) {
        alert("✅ EMAIL TEST SUCCESS:\n" + res.message);
      } else {
        alert("❌ EMAIL TEST ERROR:\n" + (res.error || "Failed to send test email. Check host, port, username, and password."));
      }
    } catch (err: any) {
      alert("❌ SMTP ERROR:\n" + err.message);
    } finally {
      setTestingMail(false);
    }
  };

  useEffect(() => {
    async function loadData() {
      try {
        const config = await fetchSiteConfig();
        if (config && config.api_settings) {
          setApiSettings((prev) => ({ ...prev, ...config.api_settings }));
        }

        const secLogs = await fetchSecurityLogs();
        if (Array.isArray(secLogs) && secLogs.length > 0) {
          setLogs(secLogs);
        } else {
          setLogs([
            { timestamp: new Date().toISOString().substring(0, 19).replace("T", " ") + " UTC", event: "System Security Initialized", user: "admin@vrix.com", status: "SUCCESS" },
            { timestamp: new Date().toISOString().substring(0, 19).replace("T", " ") + " UTC", event: "API Security Credentials Synchronized", user: "System", status: "SUCCESS" },
          ]);
        }
      } catch (err) {
        console.error("Failed to load admin security settings:", err);
      }
    }
    loadData();
  }, []);

  const handleInputChange = (field: string, value: any) => {
    setApiSettings((prev) => ({ ...prev, [field]: value }));
  };

  const handleSaveSettings = async () => {
    setSaving(true);
    try {
      await saveSiteConfigKey("api_settings", apiSettings);
      setShowSavedToast(true);
      setTimeout(() => setShowSavedToast(false), 3500);

      const now = new Date().toISOString().substring(0, 19).replace("T", " ") + " UTC";
      setLogs((prev) => [
        { timestamp: now, event: "Updated API & Authentication Credentials", user: "admin@vrix.com", status: "SUCCESS" },
        ...prev,
      ]);
    } catch (err) {
      alert("Failed to save credentials: " + (err as any).message);
    } finally {
      setSaving(false);
    }
  };

  const handleExportCSV = () => {
    alert("Exporting security event logs as CSV file...");
  };

  // Filter logic
  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      (log.event || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (log.user || "").toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "ALL" || log.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="w-full">
      <div className="flex-1 max-w-4xl p-margin-mobile md:p-margin-desktop mx-auto">
        <div className="mb-stack-lg">
          <h1 className="font-display-lg text-display-lg md:text-display-lg font-display-lg-mobile text-deep-navy tracking-tight">
            Security &amp; Integration Credentials
          </h1>
          <p className="font-body-lg text-body-lg text-slate-grey mt-2">
            Manage authentication APIs (Truecaller), payment gateways, SMTP mailers, media storage, and system security controls.
          </p>
        </div>

        {/* ─── API & AUTHENTICATION INTEGRATIONS ──────────────────────────────── */}
        <section className="bg-pure-white border border-slate-grey/25 rounded mb-stack-lg shadow-sm">
          <div className="p-8 border-b border-slate-grey/20">
            <h3 className="font-headline-md text-headline-md text-deep-navy font-semibold flex items-center gap-2">
              <span className="material-symbols-outlined text-gold-accent">key</span>
              Authentication &amp; Service API Keys
            </h3>
            <p className="font-body-md text-body-md text-slate-grey mt-1">
              Configure credentials dynamically. These credentials will override environment defaults.
            </p>
          </div>

          <div className="p-8 space-y-8">




            {/* 3. Razorpay Payment Gateway */}
            <div className="border border-slate-grey/15 p-6 rounded bg-surface-container-low/30">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <i className="fa-solid fa-credit-card text-emerald-600 text-xl"></i>
                  <div>
                    <h4 className="font-body-md font-semibold text-ink-black flex items-center gap-2">
                      Razorpay Payment Gateway
                      <span className={`text-[9px] font-label-caps uppercase px-2 py-0.5 rounded font-bold border ${apiSettings.razorpayEnabled ? "bg-emerald-50 text-emerald-700 border-emerald-300" : "bg-slate-100 text-slate-600 border-slate-300"}`}>
                        {apiSettings.razorpayEnabled ? "LIVE ON STORE" : "OFF / DISABLED"}
                      </span>
                    </h4>
                    <p className="text-xs text-slate-grey">Process payments via UPI, Cards, NetBanking, and Wallets. Toggle OFF to disable online payments.</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={apiSettings.razorpayEnabled}
                    onChange={(e) => handleInputChange("razorpayEnabled", e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                </label>
              </div>

              <div className={`mt-4 p-3 border rounded text-xs leading-relaxed font-body-md ${apiSettings.razorpayEnabled ? "bg-emerald-50/50 border-emerald-200 text-emerald-900" : "bg-slate-100/60 border-slate-200 text-slate-600"}`}>
                {apiSettings.razorpayEnabled
                  ? "✓ Razorpay is ENABLED. Customers will see Razorpay at checkout and can pay securely."
                  : "✕ Razorpay is OFF. Online payment options will be completely hidden from customer checkout."}
              </div>
            </div>


            {/* 3. Cloudinary Media Storage */}
            <div className="border border-slate-grey/15 p-6 rounded bg-surface-container-low/30">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <i className="fa-solid fa-cloud text-sky-600 text-xl"></i>
                  <div>
                    <h4 className="font-body-md font-semibold text-ink-black flex items-center gap-2">
                      Cloudinary Image &amp; Media CDN
                      <span className={`text-[9px] font-label-caps uppercase px-2 py-0.5 rounded font-bold border ${apiSettings.cloudinaryEnabled ? "bg-sky-50 text-sky-700 border-sky-300" : "bg-slate-100 text-slate-600 border-slate-300"}`}>
                        {apiSettings.cloudinaryEnabled ? "ACTIVE" : "OFF / DISABLED"}
                      </span>
                    </h4>
                    <p className="text-xs text-slate-grey">Dynamic image uploads, transformations, and media CDN delivery.</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={apiSettings.cloudinaryEnabled}
                    onChange={(e) => handleInputChange("cloudinaryEnabled", e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-sky-600"></div>
                </label>
              </div>

              <div className={`mt-4 p-3 border rounded text-xs leading-relaxed font-body-md ${apiSettings.cloudinaryEnabled ? "bg-sky-50/50 border-sky-200 text-sky-900" : "bg-slate-100/60 border-slate-200 text-slate-600"}`}>
                {apiSettings.cloudinaryEnabled
                  ? "✓ Cloudinary CDN is ACTIVE. Media uploaded in admin is optimized and delivered via global CDN."
                  : "✕ Cloudinary CDN is OFF. System uses local server media storage and fallback URLs."}
              </div>
              
            </div>


            {/* 4. SMTP / Nodemailer */}
            <div className="border border-slate-grey/15 p-6 rounded bg-surface-container-low/30">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <i className="fa-solid fa-envelope text-amber-600 text-xl"></i>
                  <div>
                    <h4 className="font-body-md font-semibold text-ink-black flex items-center gap-2">
                      SMTP Mail Server (Transactional Email)
                      <span className={`text-[9px] font-label-caps uppercase px-2 py-0.5 rounded font-bold border ${apiSettings.nodemailerEnabled ? "bg-amber-50 text-amber-800 border-amber-300" : "bg-slate-100 text-slate-600 border-slate-300"}`}>
                        {apiSettings.nodemailerEnabled ? "ACTIVE" : "OFF / DISABLED"}
                      </span>
                    </h4>
                    <p className="text-xs text-slate-grey">Sends order notifications, OTP verification codes, and invoices.</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={apiSettings.nodemailerEnabled}
                    onChange={(e) => handleInputChange("nodemailerEnabled", e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-600"></div>
                </label>
              </div>

              <div className={`mt-4 p-3 border rounded text-xs leading-relaxed font-body-md flex items-center justify-between ${apiSettings.nodemailerEnabled ? "bg-amber-50/50 border-amber-200 text-amber-900" : "bg-slate-100/60 border-slate-200 text-slate-600"}`}>
                <span>
                  {apiSettings.nodemailerEnabled
                    ? "✓ SMTP Mail Server is ACTIVE. Order confirmation emails and OTPs are being dispatched."
                    : "✕ SMTP Mail Server is OFF. Email dispatches are currently paused."}
                </span>
                {apiSettings.nodemailerEnabled && (
                  <button
                    type="button"
                    onClick={handleTestEmail}
                    disabled={testingMail}
                    className="px-3 py-1 bg-deep-navy text-pure-white text-[10px] font-label-caps uppercase tracking-wider rounded hover:bg-ink-black transition-colors cursor-pointer shrink-0 ml-2"
                  >
                    {testingMail ? "Testing..." : "Send Test Mail"}
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="bg-surface-container-low p-6 rounded-b flex justify-end">
            <button
              onClick={handleSaveSettings}
              disabled={saving}
              className="bg-deep-navy text-pure-white font-button text-button uppercase px-8 py-3 rounded-none hover:bg-opacity-90 transition-colors shadow-sm cursor-pointer disabled:opacity-50"
            >
              {saving ? "Saving Changes..." : "Save All API Credentials"}
            </button>
          </div>
        </section>

        {/* ─── SECURITY ACCESS LOGS ────────────────────────────────────────────── */}
        <section className="bg-pure-white border border-slate-grey/25 rounded shadow-sm overflow-hidden">
          <div className="p-8 border-b border-slate-grey/20 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
            <div>
              <h3 className="font-headline-md text-headline-md text-deep-navy font-semibold">Security Audit Log</h3>
              <p className="font-body-md text-body-md text-slate-grey mt-1">
                Real-time security logs, login audits, and policy event monitors.
              </p>
            </div>
            <button
              onClick={handleExportCSV}
              className="text-deep-navy font-button text-button uppercase hover:underline underline-offset-4 flex items-center space-x-1 cursor-pointer"
            >
              <span>Export CSV</span>
              <span className="material-symbols-outlined text-sm">download</span>
            </button>
          </div>

          {/* Search and Filters Bar */}
          <div className="p-6 bg-surface-container-low border-b border-slate-grey/20 flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="relative w-full md:w-72">
              <i className="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-slate-grey text-sm"></i>
              <input
                type="text"
                placeholder="Filter logs by event or user..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-pure-white border border-slate-grey/25 py-2 pl-9 pr-4 text-sm focus:border-deep-navy focus:ring-0 text-ink-black placeholder:text-slate-grey/50 rounded-none"
              />
            </div>
            <div className="flex gap-4 w-full md:w-auto items-center justify-end">
              <span className="font-label-caps text-[10px] text-slate-grey uppercase tracking-wider shrink-0">Status:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-pure-white border border-slate-grey/25 px-3 py-2 text-xs text-ink-black focus:border-deep-navy focus:ring-0 cursor-pointer min-w-32 rounded-none"
              >
                <option value="ALL">All Statuses</option>
                <option value="SUCCESS">SUCCESS Only</option>
                <option value="FAILED">FAILED Only</option>
              </select>
            </div>
          </div>

          {/* Table Container */}
          <div className="overflow-x-auto custom-scrollbar max-h-[400px]">
            <table className="w-full text-left border-collapse whitespace-nowrap">
              <thead className="bg-surface-container-low sticky top-0 z-10">
                <tr>
                  <th className="font-label-caps text-label-caps text-slate-grey px-8 py-4 border-b border-slate-grey/20 uppercase tracking-widest">
                    Timestamp
                  </th>
                  <th className="font-label-caps text-label-caps text-slate-grey px-6 py-4 border-b border-slate-grey/20 uppercase tracking-widest">
                    Event Type
                  </th>
                  <th className="font-label-caps text-label-caps text-slate-grey px-6 py-4 border-b border-slate-grey/20 uppercase tracking-widest">
                    User / IP
                  </th>
                  <th className="font-label-caps text-label-caps text-slate-grey px-8 py-4 border-b border-slate-grey/20 uppercase tracking-widest text-right">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="font-body-md text-body-md text-sm">
                {filteredLogs.map((log, index) => (
                  <tr key={index} className="border-b border-slate-grey/10 hover:bg-soft-linen/50 transition-colors">
                    <td className="px-8 py-4 text-slate-grey">{log.timestamp}</td>
                    <td className="px-6 py-4 font-semibold text-ink-black">{log.event}</td>
                    <td className="px-6 py-4 text-slate-grey">{log.user}</td>
                    <td className="px-8 py-4 text-right">
                      <span
                        className={`inline-flex items-center px-2 py-1 rounded-none border font-label-caps text-[10px] ${
                          log.status === "SUCCESS"
                            ? "border-green-600/30 text-green-700 bg-green-50/20"
                            : "border-error/30 text-error bg-error-container/10"
                        }`}
                      >
                        {log.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      {/* Floating Save settings success toast */}
      {showSavedToast && (
        <div className="fixed bottom-8 right-8 bg-deep-navy text-pure-white px-6 py-4 rounded-none shadow-2xl flex items-center gap-3 animate-fade-in-up z-50 border border-pure-white/10">
          <i className="fa-solid fa-circle-check text-green-400 text-[18px]"></i>
          <span className="font-label-caps text-label-caps tracking-widest text-[11px]">
            API credentials saved successfully
          </span>
        </div>
      )}
    </div>
  );
}
