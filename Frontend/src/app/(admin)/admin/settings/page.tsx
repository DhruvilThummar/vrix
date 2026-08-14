"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { getApiBaseUrl, uploadMedia } from "@/utils/api";
import Image from "next/image";

const DEFAULT_AVATAR = "https://lh3.googleusercontent.com/aida-public/AB6AXuCEmDU3gu16YubKEVucF99HSS0iunyLU-YcbfpfX9oeZzjPdLD20AMfwJNxNlPG0c9jCGX2GJyo6O3_-kgjnu_9YPI6tWcYCujJKYFngfcebHqBEnkmdkv-561gqgQUG3BHCniP5Kj92pqfqs8NLRmcH2cQxdX7DTn9Kzmjqi7Ry3FBcjpeo31uXBUviSFTGjuuu7KVIaMGAeEg4r9_lVPAShUIH1QIIXrJdyb0hxe9AlXd1VW6wgAApagpCY3c-CV2KqwlPsM4sEk";

export default function AdminSettingsPage() {
  const { user, login } = useAuth();

  const [adminName, setAdminName] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [adminSecret, setAdminSecret] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedName = localStorage.getItem("vrix_admin_name") || user?.name || "Administrator";
      const storedEmail = user?.email || localStorage.getItem("vrix-admin-email") || "admin@vrix.com";
      const storedAvatar = localStorage.getItem("vrix_admin_avatar") || DEFAULT_AVATAR;
      const storedSecret = localStorage.getItem("vrix-admin-secret") || "vrix-admin-secret-key-2026";

      setAdminName(storedName);
      setAdminEmail(storedEmail);
      setAvatarUrl(storedAvatar);
      setAdminSecret(storedSecret);
    }
  }, [user]);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    setMessage(null);
    try {
      const res = await uploadMedia(files[0]);
      setAvatarUrl(res.url);
      localStorage.setItem("vrix_admin_avatar", res.url);
      setMessage({ type: "success", text: "Avatar uploaded successfully." });
    } catch (err: any) {
      setMessage({ type: "error", text: err.message || "Failed to upload avatar." });
    } finally {
      setUploading(false);
    }
  };

  const handleSaveCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (newPassword && newPassword !== confirmPassword) {
      setMessage({ type: "error", text: "New passwords do not match." });
      return;
    }

    setSaving(true);
    try {
      const baseUrl = getApiBaseUrl();
      const currentEmail = user?.email || adminEmail;

      const res = await fetch(`${baseUrl}/admin/update-credentials`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          oldEmail: currentEmail,
          newEmail: adminEmail.trim(),
          newPassword: newPassword.trim() || undefined,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({ error: "Failed to update admin credentials." }));
        throw new Error(errData.error || "Failed to update admin credentials.");
      }

      const resData = await res.json();

      // Update Local Storage & Auth Context
      localStorage.setItem("vrix_admin_name", adminName);
      localStorage.setItem("vrix_admin_avatar", avatarUrl);
      localStorage.setItem("vrix-admin-secret", adminSecret);
      
      login(resData.newEmail || adminEmail, { name: adminName });

      setNewPassword("");
      setConfirmPassword("");
      setMessage({ type: "success", text: "🎉 Admin ID (Email) & Password updated successfully!" });
    } catch (err: any) {
      setMessage({ type: "error", text: err.message || "Failed to save settings." });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col gap-1 border-b border-slate-grey/20 pb-4">
        <h1 className="font-headline-lg text-2xl uppercase tracking-wider text-deep-navy">
          Admin Account &amp; Credentials Settings
        </h1>
        <p className="font-body-md text-xs text-slate-grey">
          Update your Admin Login ID (Email), Password, Security Headers, and Profile details.
        </p>
      </div>

      {/* Alert Message */}
      {message && (
        <div
          className={`p-4 rounded text-xs font-body-md flex items-center gap-3 ${
            message.type === "success"
              ? "bg-green-50 border border-green-200 text-green-800"
              : "bg-red-50 border border-red-200 text-red-800"
          }`}
        >
          <span className="material-symbols-outlined text-base">
            {message.type === "success" ? "check_circle" : "error"}
          </span>
          {message.text}
        </div>
      )}

      <form onSubmit={handleSaveCredentials} className="space-y-8">
        {/* Profile & Avatar Section */}
        <div className="bg-pure-white p-6 border border-slate-grey/20 shadow-sm space-y-6">
          <h2 className="font-headline-md text-sm uppercase tracking-wider text-deep-navy border-b border-slate-grey/15 pb-3 flex items-center gap-2">
            <span className="material-symbols-outlined text-lg">account_circle</span>
            Admin Profile Info
          </h2>

          <div className="flex flex-col sm:flex-row items-center gap-6">
            <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-deep-navy relative bg-soft-linen flex-shrink-0">
              <Image
                src={avatarUrl || DEFAULT_AVATAR}
                alt="Admin Avatar"
                fill
                sizes="96px"
                className="object-cover"
              />
              {uploading && (
                <div className="absolute inset-0 bg-deep-navy/60 flex items-center justify-center">
                  <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                </div>
              )}
            </div>

            <div className="space-y-3 flex-1 w-full">
              <div>
                <label className="block font-label-caps text-[10px] uppercase tracking-widest text-slate-grey mb-1">
                  Upload Avatar Photo
                </label>
                <label className="inline-block border border-deep-navy text-deep-navy hover:bg-deep-navy hover:text-white px-4 py-2 text-xs font-button uppercase tracking-wider transition-colors cursor-pointer">
                  {uploading ? "Uploading..." : "Choose Image File"}
                  <input type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
                </label>
              </div>

              <div>
                <label className="block font-label-caps text-[10px] uppercase tracking-widest text-slate-grey mb-1">
                  Avatar Image Direct URL
                </label>
                <input
                  type="url"
                  value={avatarUrl}
                  onChange={(e) => setAvatarUrl(e.target.value)}
                  placeholder="https://example.com/avatar.jpg"
                  className="w-full border-b border-slate-grey/30 py-1.5 text-xs outline-none focus:border-deep-navy"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 pt-2">
            <div>
              <label className="block font-label-caps text-[10px] uppercase tracking-widest text-slate-grey mb-1">
                Admin Display Name
              </label>
              <input
                type="text"
                value={adminName}
                onChange={(e) => setAdminName(e.target.value)}
                required
                placeholder="Enter administrator name"
                className="w-full border-b border-slate-grey/30 py-2 font-body-md text-sm outline-none focus:border-deep-navy"
              />
            </div>
          </div>
        </div>

        {/* Credentials Section */}
        <div className="bg-pure-white p-6 border border-slate-grey/20 shadow-sm space-y-6">
          <h2 className="font-headline-md text-sm uppercase tracking-wider text-deep-navy border-b border-slate-grey/15 pb-3 flex items-center gap-2">
            <span className="material-symbols-outlined text-lg">key</span>
            Login ID &amp; Password Management
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="sm:col-span-2">
              <label className="block font-label-caps text-[10px] uppercase tracking-widest text-slate-grey mb-1">
                Admin Login ID (Email Address) *
              </label>
              <input
                type="email"
                value={adminEmail}
                onChange={(e) => setAdminEmail(e.target.value)}
                required
                placeholder="admin@vrix.com"
                className="w-full border-b border-slate-grey/30 py-2 font-body-md text-sm outline-none focus:border-deep-navy"
              />
              <p className="text-[10px] text-slate-grey mt-1">
                This is the ID/Email used to log into the VRIX Admin Panel.
              </p>
            </div>

            <div>
              <label className="block font-label-caps text-[10px] uppercase tracking-widest text-slate-grey mb-1">
                New Password
              </label>
              <div className="relative flex items-center">
                <input
                  type={showPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full border-b border-slate-grey/30 py-2 pr-10 font-body-md text-sm outline-none focus:border-deep-navy"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2 text-slate-grey hover:text-deep-navy transition-colors"
                >
                  <span className="material-symbols-outlined text-sm">
                    {showPassword ? "visibility_off" : "visibility"}
                  </span>
                </button>
              </div>
              <p className="text-[10px] text-slate-grey mt-1">
                Leave empty to keep current password unchanged.
              </p>
            </div>

            <div>
              <label className="block font-label-caps text-[10px] uppercase tracking-widest text-slate-grey mb-1">
                Confirm New Password
              </label>
              <input
                type={showPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full border-b border-slate-grey/30 py-2 font-body-md text-sm outline-none focus:border-deep-navy"
              />
            </div>
          </div>
        </div>

        {/* Admin Secret Section */}
        <div className="bg-pure-white p-6 border border-slate-grey/20 shadow-sm space-y-4">
          <h2 className="font-headline-md text-sm uppercase tracking-wider text-deep-navy border-b border-slate-grey/15 pb-3 flex items-center gap-2">
            <span className="material-symbols-outlined text-lg">shield</span>
            API Admin Secret Key
          </h2>

          <div>
            <label className="block font-label-caps text-[10px] uppercase tracking-widest text-slate-grey mb-1">
              X-Admin-Secret Header Key
            </label>
            <input
              type="text"
              value={adminSecret}
              onChange={(e) => setAdminSecret(e.target.value)}
              placeholder="vrix-admin-secret-key-2026"
              className="w-full border-b border-slate-grey/30 py-2 font-mono text-xs outline-none focus:border-deep-navy"
            />
            <p className="text-[10px] text-slate-grey mt-1">
              Sent with administrative requests (`X-Admin-Secret` header) to verify backend permissions.
            </p>
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end pt-4">
          <button
            type="submit"
            disabled={saving || uploading}
            className="px-8 py-3 bg-deep-navy text-white font-button text-xs uppercase tracking-widest hover:bg-ink-black transition-colors disabled:opacity-50 flex items-center gap-2 cursor-pointer"
          >
            {saving && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
            Save All Changes
          </button>
        </div>
      </form>
    </div>
  );
}
