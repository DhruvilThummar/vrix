"use client";

import React, { useState } from "react";

export default function Page() {
  const [backupsEnabled, setBackupsEnabled] = useState(false);
  const [rbacEnabled, setRbacEnabled] = useState(true);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(true);
  const [showSavedToast, setShowSavedToast] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const [logs, setLogs] = useState([
    {
      timestamp: "2026-06-15 14:32:01 UTC",
      event: "2FA Settings Modified",
      user: "admin@vrix.com (192.168.1.1)",
      status: "SUCCESS",
    },
    {
      timestamp: "2026-06-15 10:15:44 UTC",
      event: "Failed Login Attempt",
      user: "unknown (203.0.113.42)",
      status: "FAILED",
    },
    {
      timestamp: "2026-06-15 09:00:00 UTC",
      event: "Automated Backup Complete",
      user: "System",
      status: "SUCCESS",
    },
    {
      timestamp: "2026-06-14 16:45:12 UTC",
      event: "API Key Generated",
      user: "dev@vrix.com (10.0.0.5)",
      status: "SUCCESS",
    },
    {
      timestamp: "2026-06-14 11:20:05 UTC",
      event: "Admin Login",
      user: "admin@vrix.com (192.168.1.1)",
      status: "SUCCESS",
    },
  ]);

  const addLog = (event: string, status: "SUCCESS" | "FAILED" = "SUCCESS") => {
    const now = new Date().toISOString().replace("T", " ").substring(0, 19) + " UTC";
    setLogs((prev) => [
      {
        timestamp: now,
        event,
        user: "admin@vrix.com (192.168.1.1)",
        status,
      },
      ...prev,
    ]);
  };

  const handleToggleRbac = () => {
    const nextVal = !rbacEnabled;
    setRbacEnabled(nextVal);
    addLog(`RBAC Access Controls ${nextVal ? "Enabled" : "Disabled"}`);
  };

  const handleToggleTwoFactor = () => {
    const nextVal = !twoFactorEnabled;
    setTwoFactorEnabled(nextVal);
    addLog(`Two-Factor Auth Requirements ${nextVal ? "Mandated" : "Disabled"}`);
  };

  const handleToggleBackups = () => {
    const nextVal = !backupsEnabled;
    setBackupsEnabled(nextVal);
    addLog(`Daily Backup Configuration ${nextVal ? "Enabled" : "Disabled"}`);
  };

  const handleSaveSettings = () => {
    setShowSavedToast(true);
    setTimeout(() => setShowSavedToast(false), 3500);
    addLog("Platform Security Settings Saved");
  };

  const handleExportCSV = () => {
    addLog("Exported Security Events Log (CSV)");
    alert("Exporting logs as CSV file...");
  };

  // Filter logic
  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      log.event.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.user.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "ALL" || log.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="w-full">
      <div className="flex-1 max-w-4xl p-margin-mobile md:p-margin-desktop mx-auto">
        <div className="mb-stack-lg">
          <h1 className="font-display-lg text-display-lg md:text-display-lg font-display-lg-mobile text-deep-navy tracking-tight">
            Security &amp; Platform
          </h1>
          <p className="font-body-lg text-body-lg text-slate-grey mt-2">
            Manage authorization layers, access logs, and core security policies.
          </p>
        </div>

        {/* Access Control Cards */}
        <section className="bg-pure-white border border-slate-grey/25 rounded mb-stack-lg shadow-sm">
          <div className="p-8 border-b border-slate-grey/20">
            <h3 className="font-headline-md text-headline-md text-deep-navy font-semibold">Access Settings</h3>
            <p className="font-body-md text-body-md text-slate-grey mt-1">
              Configure operational boundaries and access permissions.
            </p>
          </div>
          <div className="p-8 space-y-8">
            {/* Setting 1: RBAC */}
            <div className="flex items-start justify-between">
              <div className="pr-8">
                <h4 className="font-body-md text-body-md font-semibold text-ink-black">Role-Based Access Control (RBAC)</h4>
                <p className="font-body-md text-body-md text-slate-grey mt-1 text-sm">
                  Enforce strict permission boundaries based on user roles. Disabling this defaults all users to super-admin.
                </p>
              </div>
              <div className="relative inline-block w-12 mr-2 align-middle select-none transition duration-200 ease-in mt-1 shrink-0">
                <input
                  type="checkbox"
                  id="toggle-rbac"
                  className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer"
                  checked={rbacEnabled}
                  onChange={handleToggleRbac}
                />
                <label
                  htmlFor="toggle-rbac"
                  className={`toggle-label block overflow-hidden h-6 rounded-full cursor-pointer transition-colors duration-300 ${
                    rbacEnabled ? "bg-deep-navy" : "bg-gray-300"
                  }`}
                ></label>
              </div>
            </div>
            <hr className="border-slate-grey/10" />

            {/* Setting 2: 2FA */}
            <div className="flex items-start justify-between">
              <div className="pr-8">
                <h4 className="font-body-md text-body-md font-semibold text-ink-black">Require Two-Factor Authentication (2FA)</h4>
                <p className="font-body-md text-body-md text-slate-grey mt-1 text-sm">
                  Mandate 2FA authentication for all administrative accounts. Highly recommended to maintain account integrity.
                </p>
              </div>
              <div className="relative inline-block w-12 mr-2 align-middle select-none transition duration-200 ease-in mt-1 shrink-0">
                <input
                  type="checkbox"
                  id="toggle-2fa"
                  className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer"
                  checked={twoFactorEnabled}
                  onChange={handleToggleTwoFactor}
                />
                <label
                  htmlFor="toggle-2fa"
                  className={`toggle-label block overflow-hidden h-6 rounded-full cursor-pointer transition-colors duration-300 ${
                    twoFactorEnabled ? "bg-deep-navy" : "bg-gray-300"
                  }`}
                ></label>
              </div>
            </div>
            <hr className="border-slate-grey/10" />

            {/* Setting 3: Backups */}
            <div className="flex items-start justify-between">
              <div className="pr-8">
                <h4 className="font-body-md text-body-md font-semibold text-ink-black">Daily Cold-Storage Backups</h4>
                <p className="font-body-md text-body-md text-slate-grey mt-1 text-sm">
                  Perform daily encrypted backups of inventory and order data to secure standalone server blocks.
                </p>
              </div>
              <div className="relative inline-block w-12 mr-2 align-middle select-none transition duration-200 ease-in mt-1 shrink-0">
                <input
                  type="checkbox"
                  id="toggle-backups"
                  className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer"
                  checked={backupsEnabled}
                  onChange={handleToggleBackups}
                />
                <label
                  htmlFor="toggle-backups"
                  className={`toggle-label block overflow-hidden h-6 rounded-full cursor-pointer transition-colors duration-300 ${
                    backupsEnabled ? "bg-deep-navy" : "bg-gray-300"
                  }`}
                ></label>
              </div>
            </div>
          </div>
          <div className="bg-surface-container-low p-6 rounded-b flex justify-end">
            <button
              onClick={handleSaveSettings}
              className="bg-deep-navy text-pure-white font-button text-button uppercase px-6 py-3 rounded-none hover:bg-opacity-90 transition-colors shadow-sm cursor-pointer"
            >
              Save Security Changes
            </button>
          </div>
        </section>

        {/* Security Logs Section */}
        <section className="bg-pure-white border border-slate-grey/25 rounded shadow-sm overflow-hidden">
          <div className="p-8 border-b border-slate-grey/20 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
            <div>
              <h3 className="font-headline-md text-headline-md text-deep-navy font-semibold">Security Events Monitoring</h3>
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
              {(searchQuery || statusFilter !== "ALL") && (
                <button
                  onClick={() => {
                    setSearchQuery("");
                    setStatusFilter("ALL");
                  }}
                  className="text-xs text-deep-navy font-button hover:underline cursor-pointer shrink-0"
                >
                  Clear Filters
                </button>
              )}
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
                {filteredLogs.length === 0 && (
                  <tr>
                    <td colSpan={4} className="text-center py-12 text-slate-grey font-body-md bg-surface-container-low/20">
                      <i className="fa-solid fa-inbox text-[28px] mb-2 block opacity-40"></i>
                      No security events match your criteria.
                    </td>
                  </tr>
                )}
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
            Security settings saved successfully
          </span>
        </div>
      )}
    </div>
  );
}
