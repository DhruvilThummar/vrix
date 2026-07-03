"use client";

import React, { useState, useEffect, useRef } from "react";
import { uploadMediaMultiple, fetchMedia } from "@/utils/api";

type MediaFile = {
  name: string;
  url: string;
  createdAt: string;
  size: number;
};

export default function AdminMediaPage() {
  const [uploadedFiles, setUploadedFiles] = useState<MediaFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [toast, setToast] = useState<{ msg: string; type: "ok" | "err" } | null>(null);
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const showToast = (msg: string, type: "ok" | "err" = "ok") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const loadMedia = async () => {
    setLoading(true);
    try {
      const data = await fetchMedia();
      setUploadedFiles(data.files || []);
    } catch (err: any) {
      showToast("Failed to load media library.", "err");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMedia();
  }, []);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const files = Array.from(e.dataTransfer.files);
      setSelectedFiles((prev) => [...prev, ...files]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const files = Array.from(e.target.files);
      setSelectedFiles((prev) => [...prev, ...files]);
    }
  };

  const removeSelectedFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const clearSelected = () => {
    setSelectedFiles([]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) return;
    setUploading(true);
    try {
      const res = await uploadMediaMultiple(selectedFiles);
      
      const successes = res.results.filter((r) => r.success);
      const failures = res.results.filter((r) => !r.success);

      if (successes.length > 0) {
        showToast(`Successfully uploaded ${successes.length} file(s).`);
      }
      if (failures.length > 0) {
        showToast(`Failed to upload ${failures.length} file(s).`, "err");
      }

      clearSelected();
      loadMedia();
    } catch (err: any) {
      showToast("Upload failed: " + err.message, "err");
    } finally {
      setUploading(false);
    }
  };

  const copyToClipboard = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedUrl(url);
    showToast("URL copied to clipboard!");
    setTimeout(() => setCopiedUrl(null), 2000);
  };

  const formatBytes = (bytes: number, decimals = 2) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
  };

  return (
    <div className="w-full min-h-screen bg-soft-linen/50 p-6 md:p-10 relative">
      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 px-6 py-4 border shadow-2xl flex items-center gap-3 animate-fade-in text-sm font-body-md ${toast.type === "ok" ? "bg-deep-navy text-pure-white border-slate-grey/30" : "bg-red-900 text-white border-red-700"}`}>
          <span className="material-symbols-outlined text-[16px]">{toast.type === "ok" ? "check_circle" : "error"}</span>
          {toast.msg}
        </div>
      )}

      <div className="max-w-7xl mx-auto flex flex-col gap-8">
        {/* Header */}
        <div className="flex justify-between items-center border-b border-slate-grey/20 pb-6">
          <div>
            <h1 className="font-display-lg text-headline-md text-deep-navy uppercase">Media Library</h1>
            <p className="text-slate-grey font-body-md text-sm mt-1">
              Upload multiple images at once, manage your gallery, and copy file URLs.
            </p>
          </div>
        </div>

        {/* Uploader Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-pure-white border border-slate-grey/25 p-6 shadow-sm flex flex-col gap-4">
            <h3 className="font-label-caps text-[11px] uppercase tracking-widest text-deep-navy border-b border-slate-grey/10 pb-2">
              Upload Images (Bulk)
            </h3>

            {/* Drop Zone */}
            <div
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-DEFAULT p-10 flex flex-col items-center justify-center gap-3 transition-all cursor-pointer ${
                dragActive ? "border-deep-navy bg-soft-linen/30" : "border-slate-grey/25 hover:border-deep-navy bg-transparent"
              }`}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*,video/*"
                onChange={handleFileSelect}
                className="hidden"
              />
              <span className="material-symbols-outlined text-4xl text-slate-grey">
                cloud_upload
              </span>
              <p className="font-body-md text-sm text-ink-black font-medium">
                Drag and drop files here, or click to browse
              </p>
              <p className="font-label-caps text-[10px] text-slate-grey uppercase tracking-widest">
                Support for JPG, PNG, WEBP, and GIFs (max 10 files at once)
              </p>
            </div>

            {/* Selected Files List */}
            {selectedFiles.length > 0 && (
              <div className="mt-4 border border-slate-grey/15 rounded-DEFAULT overflow-hidden">
                <div className="bg-soft-linen/30 px-4 py-2 border-b border-slate-grey/15 flex justify-between items-center">
                  <span className="font-label-caps text-[10px] text-slate-grey uppercase tracking-widest">
                    Selected Files ({selectedFiles.length})
                  </span>
                  <button
                    onClick={clearSelected}
                    className="text-[10px] font-label-caps uppercase text-red-600 hover:underline cursor-pointer"
                  >
                    Clear All
                  </button>
                </div>
                <div className="divide-y divide-slate-grey/10 max-h-48 overflow-y-auto">
                  {selectedFiles.map((file, idx) => (
                    <div key={idx} className="flex justify-between items-center px-4 py-2.5 hover:bg-soft-linen/10">
                      <div className="flex flex-col min-w-0">
                        <span className="font-body-md text-xs text-ink-black font-semibold truncate">
                          {file.name}
                        </span>
                        <span className="text-[9px] text-slate-grey">
                          {formatBytes(file.size)}
                        </span>
                      </div>
                      <button
                        onClick={(e) => { e.stopPropagation(); removeSelectedFile(idx); }}
                        className="text-slate-grey hover:text-red-600 transition-colors cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[16px]">close</span>
                      </button>
                    </div>
                  ))}
                </div>
                <div className="p-3 bg-pure-white border-t border-slate-grey/15 flex justify-end">
                  <button
                    onClick={handleUpload}
                    disabled={uploading}
                    className="font-button text-xs uppercase px-6 py-2.5 bg-deep-navy text-pure-white hover:bg-ink-black transition-colors cursor-pointer flex items-center gap-2"
                  >
                    {uploading ? (
                      <>
                        <span className="w-3.5 h-3.5 border-2 border-pure-white border-t-transparent rounded-full animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <span className="material-symbols-outlined text-[14px]">upload</span>
                        Upload {selectedFiles.length} File(s)
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="bg-pure-white border border-slate-grey/25 p-6 shadow-sm flex flex-col gap-3">
            <h3 className="font-label-caps text-[11px] uppercase tracking-widest text-deep-navy border-b border-slate-grey/10 pb-2">
              Instructions
            </h3>
            <ul className="text-xs text-slate-grey space-y-2 list-disc pl-4 font-body-md">
              <li>Choose multiple images or videos by selecting them or dragging them into the drop zone.</li>
              <li>Click <strong>Upload</strong> to store them in your storage.</li>
              <li>Once uploaded, copy their URLs using the <strong>Copy</strong> icon in the media gallery.</li>
              <li>Use the copied URLs in CMS, collections, or product details.</li>
            </ul>
          </div>
        </div>

        {/* Gallery Grid */}
        <div className="bg-pure-white border border-slate-grey/25 p-6 shadow-sm flex flex-col gap-6">
          <div className="flex justify-between items-center border-b border-slate-grey/10 pb-3">
            <h3 className="font-label-caps text-[11px] uppercase tracking-widest text-deep-navy">
              Media Gallery ({uploadedFiles.length} items)
            </h3>
            <button
              onClick={loadMedia}
              className="text-[10px] font-label-caps uppercase text-deep-navy hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[13px]">refresh</span> Refresh
            </button>
          </div>

          {loading ? (
            <div className="h-64 flex items-center justify-center text-slate-grey font-label-caps text-xs tracking-widest">
              Loading Gallery...
            </div>
          ) : uploadedFiles.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center gap-3 text-slate-grey border-2 border-dashed border-slate-grey/10 py-16">
              <span className="material-symbols-outlined text-4xl">photo_library</span>
              <p className="text-xs font-label-caps uppercase tracking-widest">No uploaded files in local storage</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
              {uploadedFiles.map((file, idx) => (
                <div
                  key={idx}
                  className="group bg-soft-linen/25 border border-slate-grey/15 hover:border-deep-navy overflow-hidden transition-all flex flex-col relative"
                >
                  {/* Thumbnail */}
                  <div className="aspect-[4/5] relative bg-soft-linen flex items-center justify-center overflow-hidden border-b border-slate-grey/10">
                    <img
                      src={file.url}
                      alt={file.name}
                      className="w-full h-full object-cover mix-blend-multiply group-hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-ink-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <button
                        onClick={() => copyToClipboard(file.url)}
                        title="Copy URL"
                        className="w-8 h-8 rounded-full bg-pure-white text-ink-black flex items-center justify-center hover:bg-deep-navy hover:text-pure-white transition-colors cursor-pointer shadow-md"
                      >
                        <span className="material-symbols-outlined text-[16px]">
                          {copiedUrl === file.url ? "check" : "content_copy"}
                        </span>
                      </button>
                      <a
                        href={file.url}
                        target="_blank"
                        rel="noreferrer"
                        title="Open in new tab"
                        className="w-8 h-8 rounded-full bg-pure-white text-ink-black flex items-center justify-center hover:bg-deep-navy hover:text-pure-white transition-colors cursor-pointer shadow-md"
                      >
                        <span className="material-symbols-outlined text-[16px]">open_in_new</span>
                      </a>
                    </div>
                  </div>

                  {/* File info */}
                  <div className="p-3 space-y-1">
                    <p className="font-body-md text-xs font-semibold text-ink-black truncate" title={file.name}>
                      {file.name.substring(file.name.indexOf("_") + 1 || 0)}
                    </p>
                    <div className="flex justify-between items-center text-[9px] text-slate-grey font-label-caps uppercase tracking-wider">
                      <span>{formatBytes(file.size)}</span>
                      <span>{new Date(file.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
