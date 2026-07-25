"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { fetchAllCollections, saveCollections, uploadMedia } from "@/utils/api";

interface Collection {
  id: string;
  title: string;
  tagline: string;
  description: string;
  image: string;
  link: string;
  isVisible?: boolean;
}

const DEFAULT_LINK_BASES = [
  "/collections/silent-center",
  "/collections/silent-center?collection=solitude",
  "/collections/silent-center?collection=presence",
  "/collections/silent-center?collection=light",
];

export default function AdminCollectionsPage() {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Collection | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: "ok" | "err" } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form fields
  const [fId, setFId] = useState("");
  const [fTitle, setFTitle] = useState("");
  const [fTagline, setFTagline] = useState("");
  const [fDescription, setFDescription] = useState("");
  const [fImage, setFImage] = useState("");
  const [fLink, setFLink] = useState("/collections/silent-center");
  const [fVisible, setFVisible] = useState(true);

  const showToast = (msg: string, type: "ok" | "err" = "ok") => {
    setToast({ msg, type }); setTimeout(() => setToast(null), 3500);
  };

  const loadCollections = async () => {
    setLoading(true);
    try {
      const cols = await fetchAllCollections();
      setCollections(cols.map((c: any) => ({ ...c, isVisible: c.isVisible !== false })));
    } catch {
      showToast("Failed to load collections.", "err");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadCollections(); }, []);

  const selectCollection = (c: Collection) => {
    setSelected(c); setIsNew(false);
    setFId(c.id); setFTitle(c.title); setFTagline(c.tagline);
    setFDescription(c.description); setFImage(c.image);
    setFLink(c.link); setFVisible(c.isVisible !== false);
  };

  const handleNew = () => {
    setSelected(null); setIsNew(true);
    setFId(""); setFTitle(""); setFTagline("");
    setFDescription(""); setFImage(""); setFLink("/collections/silent-center");
    setFVisible(true);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadLoading(true);
    try {
      const result = await uploadMedia(file);
      setFImage(result.url);
      showToast("Image uploaded.");
    } catch (err: any) {
      showToast("Upload failed: " + err.message, "err");
    } finally {
      setUploadLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const saveAll = async (updatedList: Collection[]) => {
    setSaving(true);
    try {
      await saveCollections(updatedList);
      showToast("Collections saved.");
      setCollections(updatedList);
    } catch (err: any) {
      showToast("Save failed: " + err.message, "err");
    } finally {
      setSaving(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fTitle.trim() || !fImage.trim()) { showToast("Title and image are required.", "err"); return; }
    const id = fId || fTitle.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    const link = fLink && fLink !== "/collections/silent-center"
      ? fLink
      : `/collections/silent-center?collection=${id}`;
    const updated: Collection = { id, title: fTitle, tagline: fTagline, description: fDescription, image: fImage, link, isVisible: fVisible };
    let newList: Collection[];
    if (isNew) {
      newList = [...collections, updated];
    } else {
      newList = collections.map((c) => c.id === selected?.id ? updated : c);
    }
    await saveAll(newList);
    loadCollections();
    setIsNew(false);
    setSelected(updated);
  };

  const handleDelete = async () => {
    if (!selected || isNew) return;
    if (!confirm(`Delete collection "${selected.title}"?`)) return;
    const newList = collections.filter((c) => c.id !== selected.id);
    await saveAll(newList);
    setSelected(null);
    loadCollections();
  };

  const handleToggleVisibility = async (c: Collection) => {
    const newList = collections.map((col) => col.id === c.id ? { ...col, isVisible: !c.isVisible } : col);
    setCollections(newList);
    await saveAll(newList);
  };

  const handleReorder = (idx: number, dir: -1 | 1) => {
    const newList = [...collections];
    const target = idx + dir;
    if (target < 0 || target >= newList.length) return;
    [newList[idx], newList[target]] = [newList[target], newList[idx]];
    setCollections(newList);
    saveAll(newList);
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

      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="border-b border-slate-grey/20 pb-6 flex justify-between items-center">
          <div>
            <h1 className="font-display-lg text-headline-md text-deep-navy uppercase">Collections Manager</h1>
            <p className="text-slate-grey font-body-md text-sm mt-1">{collections.length} collections · {collections.filter((c) => c.isVisible !== false).length} visible</p>
          </div>
          <button onClick={handleNew} className="font-button text-[11px] uppercase px-5 py-3 bg-deep-navy text-pure-white hover:bg-ink-black transition-colors cursor-pointer flex items-center gap-2">
            <span className="material-symbols-outlined text-[16px]">add</span>
            New Collection
          </button>
        </div>

        {loading ? (
          <div className="h-48 flex items-center justify-center text-slate-grey font-label-caps text-xs tracking-widest">Loading collections...</div>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
            {/* Collection List */}
            <div className="xl:col-span-2 bg-pure-white border border-slate-grey/20 shadow-sm overflow-hidden">
              <div className="p-4 border-b border-slate-grey/15">
                <h2 className="font-label-caps text-[11px] uppercase tracking-widest text-deep-navy">All Collections</h2>
              </div>
              <div className="divide-y divide-slate-grey/10 max-h-[600px] overflow-y-auto">
                {collections.length === 0 && (
                  <div className="p-8 text-center text-slate-grey text-xs font-label-caps uppercase tracking-widest">No collections. Add one.</div>
                )}
                {collections.map((c, idx) => {
                  const isSelected = selected?.id === c.id && !isNew;
                  return (
                    <div key={c.id} className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-all ${isSelected ? "bg-soft-linen/40 border-l-2 border-deep-navy" : "hover:bg-soft-linen/20"}`} onClick={() => selectCollection(c)}>
                      {/* Image */}
                      <div className="w-12 h-14 relative bg-soft-linen overflow-hidden shrink-0 border border-slate-grey/10">
                        {c.image && <Image src={c.image} alt={c.title} fill className="object-cover mix-blend-multiply" sizes="48px" />}
                      </div>
                      {/* Info */}
                      <div className="flex-1 min-w-0 space-y-0.5">
                        <p className="text-sm font-body-md text-ink-black font-medium truncate">{c.title}</p>
                        <p className="text-[10px] text-slate-grey font-label-caps uppercase tracking-wider truncate">{c.tagline}</p>
                      </div>
                      {/* Controls */}
                      <div className="flex flex-col items-end gap-1 shrink-0">
                        <button
                          onClick={(e) => { e.stopPropagation(); handleToggleVisibility(c); }}
                          className={`flex items-center gap-1 text-[9px] font-label-caps uppercase tracking-widest cursor-pointer ${c.isVisible !== false ? "text-green-700" : "text-slate-grey"}`}
                        >
                          <span className="material-symbols-outlined text-[13px]">{c.isVisible !== false ? "visibility" : "visibility_off"}</span>
                          {c.isVisible !== false ? "Live" : "Hidden"}
                        </button>
                        <div className="flex gap-0.5">
                          <button onClick={(e) => { e.stopPropagation(); handleReorder(idx, -1); }} disabled={idx === 0} className="w-5 h-5 flex items-center justify-center border border-slate-grey/20 text-slate-grey hover:text-deep-navy disabled:opacity-30 cursor-pointer">
                            <span className="material-symbols-outlined text-[11px]">arrow_upward</span>
                          </button>
                          <button onClick={(e) => { e.stopPropagation(); handleReorder(idx, 1); }} disabled={idx === collections.length - 1} className="w-5 h-5 flex items-center justify-center border border-slate-grey/20 text-slate-grey hover:text-deep-navy disabled:opacity-30 cursor-pointer">
                            <span className="material-symbols-outlined text-[11px]">arrow_downward</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Editor */}
            <div className="xl:col-span-3 bg-pure-white border border-slate-grey/20 shadow-sm p-6 overflow-y-auto max-h-[600px]">
              {!selected && !isNew ? (
                <div className="h-full flex flex-col items-center justify-center gap-3 text-slate-grey py-16">
                  <span className="material-symbols-outlined text-4xl">touch_app</span>
                  <p className="text-xs font-label-caps uppercase tracking-widest">Select a collection to edit</p>
                </div>
              ) : (
                <form onSubmit={handleSave} className="space-y-5">
                  <div className="flex justify-between items-center border-b border-slate-grey/15 pb-3">
                    <h3 className="font-label-caps text-[11px] uppercase tracking-widest text-deep-navy">
                      {isNew ? "New Collection" : `Editing: ${selected?.title}`}
                    </h3>
                    {!isNew && (
                      <button type="button" onClick={handleDelete} className="text-[10px] font-label-caps uppercase text-red-600 hover:underline flex items-center gap-1 cursor-pointer">
                        <span className="material-symbols-outlined text-[14px]">delete</span>Delete
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="font-label-caps text-[9px] text-slate-grey uppercase tracking-widest">Title *</label>
                      <input type="text" value={fTitle} onChange={(e) => setFTitle(e.target.value)} required placeholder="Silent Center" className="border-b border-slate-grey/30 py-1.5 focus:border-deep-navy outline-none font-body-md text-sm text-ink-black bg-transparent" />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="font-label-caps text-[9px] text-slate-grey uppercase tracking-widest">URL Slug (ID)</label>
                      <input type="text" value={fId} onChange={(e) => setFId(e.target.value)} placeholder="silent-center" className="border-b border-slate-grey/30 py-1.5 focus:border-deep-navy outline-none font-body-md text-sm text-slate-grey bg-transparent" />
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="font-label-caps text-[9px] text-slate-grey uppercase tracking-widest">Tagline</label>
                    <input type="text" value={fTagline} onChange={(e) => setFTagline(e.target.value)} placeholder="For your balance" className="border-b border-slate-grey/30 py-1.5 focus:border-deep-navy outline-none font-body-md text-sm text-ink-black bg-transparent" />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="font-label-caps text-[9px] text-slate-grey uppercase tracking-widest">Description</label>
                    <textarea rows={3} value={fDescription} onChange={(e) => setFDescription(e.target.value)} placeholder="Collection description..." className="border border-slate-grey/25 p-2 focus:border-deep-navy outline-none font-body-md text-xs text-ink-black resize-y" />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="font-label-caps text-[9px] text-slate-grey uppercase tracking-widest">Collection Link</label>
                    <input type="text" value={fLink} onChange={(e) => setFLink(e.target.value)} placeholder="/collections/silent-center" className="border-b border-slate-grey/30 py-1.5 focus:border-deep-navy outline-none font-body-md text-sm text-ink-black bg-transparent" />
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {DEFAULT_LINK_BASES.map((l) => (
                        <button key={l} type="button" onClick={() => setFLink(l)} className="text-[9px] font-label-caps px-2 py-0.5 border border-slate-grey/25 text-slate-grey hover:border-deep-navy hover:text-deep-navy cursor-pointer transition-colors">{l}</button>
                      ))}
                    </div>
                  </div>

                  {/* Image */}
                  <div className="flex flex-col gap-2">
                    <label className="font-label-caps text-[9px] text-slate-grey uppercase tracking-widest">Cover Image *</label>
                    <div className="flex gap-3 items-start">
                      <div className="flex-1 space-y-2">
                        <input type="url" value={fImage} onChange={(e) => setFImage(e.target.value)} placeholder="Image URL" className="w-full border-b border-slate-grey/30 py-1.5 focus:border-deep-navy outline-none font-body-md text-sm text-ink-black bg-transparent" />
                        <div className="flex items-center gap-2">
                          <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" id="col-img-upload" />
                          <label htmlFor="col-img-upload" className={`inline-flex items-center gap-1.5 font-button text-[9px] uppercase px-3 py-1.5 border border-slate-grey/30 text-slate-grey hover:border-deep-navy hover:text-deep-navy transition-colors cursor-pointer ${uploadLoading ? "opacity-50 pointer-events-none" : ""}`}>
                            {uploadLoading ? <span className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" /> : <span className="material-symbols-outlined text-[12px]">upload</span>}
                            {uploadLoading ? "Uploading..." : "Upload Image"}
                          </label>
                        </div>
                      </div>
                      {fImage && (
                        <div className="w-20 h-24 relative bg-soft-linen overflow-hidden border border-slate-grey/15 shrink-0">
                          <Image src={fImage} alt="Preview" fill className="object-cover" sizes="80px" />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Visibility */}
                  <div className="flex items-center gap-3">
                    <button type="button" onClick={() => setFVisible(!fVisible)} className={`flex items-center gap-2 font-label-caps text-[10px] uppercase tracking-widest border-b cursor-pointer transition-colors py-1 ${fVisible ? "border-green-400 text-green-700" : "border-slate-grey/30 text-slate-grey"}`}>
                      <span className="material-symbols-outlined text-[16px]">{fVisible ? "visibility" : "visibility_off"}</span>
                      {fVisible ? "Visible on store" : "Hidden from store"}
                    </button>
                  </div>

                  <div className="flex gap-3 pt-1">
                    <button type="submit" disabled={saving} className="flex-1 font-button text-[11px] uppercase py-3 bg-deep-navy text-pure-white hover:bg-ink-black transition-colors cursor-pointer flex items-center justify-center gap-2">
                      {saving ? <span className="w-4 h-4 border-2 border-pure-white border-t-transparent rounded-full animate-spin" /> : (isNew ? "Create Collection" : "Save Changes")}
                    </button>
                    {isNew && (
                      <button type="button" onClick={() => { setIsNew(false); setSelected(null); }} className="px-4 font-button text-[11px] uppercase border border-slate-grey/30 text-ink-black hover:border-ink-black transition-colors cursor-pointer">✕</button>
                    )}
                  </div>
                </form>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
