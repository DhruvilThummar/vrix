"use client";

import Image from "next/image";
import { uploadMedia } from "@/utils/api";
import { useState } from "react";

const DEFAULT_AVATAR = "https://lh3.googleusercontent.com/aida-public/AB6AXuCEmDU3gu16YubKEVucF99HSS0iunyLU-YcbfpfX9oeZzjPdLD20AMfwJNxNlPG0c9jCGX2GJyo6O3_-kgjnu_9YPI6tWcYCujJKYFngfcebHqBEnkmdkv-561gqgQUG3BHCniP5Kj92pqfqs8NLRmcH2cQxdX7DTn9Kzmjqi7Ry3FBcjpeo31uXBUviSFTGjuuu7KVIaMGAeEg4r9_lVPAShUIH1QIIXrJdyb0hxe9AlXd1VW6wgAApagpCY3c-CV2KqwlPsM4sEk";

interface AdminProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (name: string, avatar: string) => void;
  initialName: string;
  initialAvatar: string;
}

export default function AdminProfileModal({
  isOpen,
  onClose,
  onSave,
  initialName,
  initialAvatar,
}: AdminProfileModalProps) {
  const [tempName, setTempName] = useState(initialName);
  const [tempAvatar, setTempAvatar] = useState(initialAvatar);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    setUploadError(null);
    try {
      const res = await uploadMedia(files[0]);
      setTempAvatar(res.url);
    } catch (err: any) {
      console.error(err);
      setUploadError(err.message || "Failed to upload image.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tempName.trim()) return;
    onSave(tempName, tempAvatar || DEFAULT_AVATAR);
  };

  return (
    <div className="fixed inset-0 bg-deep-navy/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-pure-white border border-slate-grey/20 max-w-md w-full shadow-2xl p-8 space-y-6 animate-scale-up">
        <div className="flex justify-between items-center border-b border-slate-grey/15 pb-3">
          <h3 className="font-headline-md text-lg text-deep-navy uppercase">Admin Profile Settings</h3>
          <button
            onClick={onClose}
            className="text-slate-grey hover:text-deep-navy transition-colors focus:outline-none cursor-pointer"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Avatar Preview & Upload */}
          <div className="flex flex-col items-center gap-4">
            <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-deep-navy shadow relative group bg-soft-linen">
              <Image
                alt="New Avatar Preview"
                src={tempAvatar || DEFAULT_AVATAR}
                fill
                sizes="96px"
                className="object-cover"
              />
              {isUploading && (
                <div className="absolute inset-0 bg-deep-navy/60 flex items-center justify-center">
                  <div className="w-6 h-6 border-2 border-pure-white border-t-transparent rounded-full animate-spin"></div>
                </div>
              )}
            </div>

            <div className="w-full">
              <label className="block text-center font-label-caps text-[9px] text-slate-grey uppercase tracking-widest mb-2">
                Profile Photo Source
              </label>
              <div className="flex gap-2 justify-center">
                <label className="border border-deep-navy text-deep-navy hover:bg-deep-navy hover:text-pure-white px-4 py-2 text-[10px] font-button uppercase tracking-wider transition-colors cursor-pointer text-center flex-1">
                  Upload File
                  <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
                </label>
              </div>
              {uploadError && (
                <p className="text-[10px] text-error mt-1 text-center font-body-md">{uploadError}</p>
              )}
            </div>
          </div>

          {/* Form Inputs */}
          <div className="space-y-4">
            <div className="flex flex-col gap-1.5">
              <label className="font-label-caps text-[10px] text-slate-grey uppercase tracking-widest">
                Administrator Name
              </label>
              <input
                type="text"
                value={tempName}
                onChange={(e) => setTempName(e.target.value)}
                required
                className="border-b border-slate-grey/30 py-2 focus:border-deep-navy outline-none font-body-md text-ink-black w-full"
                placeholder="Enter admin name"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="font-label-caps text-[10px] text-slate-grey uppercase tracking-widest">
                Avatar Image URL (Optional)
              </label>
              <input
                type="url"
                value={tempAvatar}
                onChange={(e) => setTempAvatar(e.target.value)}
                className="border-b border-slate-grey/30 py-2 focus:border-deep-navy outline-none font-body-md text-ink-black w-full text-xs"
                placeholder="https://example.com/avatar.jpg"
              />
            </div>
          </div>

          {/* Footer Controls */}
          <div className="flex gap-4 pt-2">
            <button
              type="submit"
              disabled={isUploading}
              className="font-button text-xs uppercase px-6 py-3 bg-deep-navy text-pure-white hover:bg-ink-black transition-colors cursor-pointer flex-1 flex items-center justify-center"
            >
              Save Profile
            </button>
            <button
              type="button"
              onClick={onClose}
              className="font-button text-xs uppercase px-6 py-3 border border-slate-grey/30 text-slate-grey hover:text-ink-black transition-colors cursor-pointer flex-1"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
